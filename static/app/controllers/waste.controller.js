// Waste Management Controller
(function () {
    'use strict';

    angular.module('suvidhaApp')
        .controller('WasteManagementController', ['$scope', '$timeout', '$location', 'ApiService', WasteManagementController]);

    function WasteManagementController($scope, $timeout, $location, ApiService) {
        var vm = this;
        var $rootScope = $scope.$root;
        vm.loading = true;
        vm.isSubmitting = false;
        vm.showSuccess = false;
        vm.successMessage = '';

        // User Data
        vm.userData = {
            username: $rootScope.currentUser?.name || 'Citizen',
            name: $rootScope.currentUser?.name || 'User',
            address: ''
        };

        // Waste Status Data
        vm.wasteStatus = {
            lastPickup: 'Today',
            wasteType: 'Segregated',
            pointsEarned: 15,
            nextScheduledPickup: 'Tomorrow',
            binStatus: 'Normal'
        };

        // Form Data
        vm.issue = {
            type: '',
            address: '',
            description: '',
            photo: null
        };

        vm.showReportForm = false;
        vm.showAiWasteHelper = false;
        vm.showWasteGuide = false;

        // AI Waste Analysis Data
        vm.aiPhoto = null;
        vm.aiAnalyzing = false;
        vm.aiResult = null;

        // AI Waste Analysis Results (Mock)
        vm.wasteAnalysisDatabase = {
            'organic': {
                wasteType: 'Organic Waste',
                category: 'organic',
                icon: 'leaf',
                tips: [
                    'Place in green bin for composting',
                    'Drain liquids from food waste',
                    'Wrap in newspaper if wet',
                    'Do not include cooked food with meat'
                ],
                points: 15
            },
            'plastic': {
                wasteType: 'Plastic Waste',
                category: 'dry',
                icon: 'box',
                tips: [
                    'Rinse plastic bottles before disposal',
                    'Place in blue bin for recycling',
                    'Remove caps and labels',
                    'Crush bottles to save space'
                ],
                points: 20
            },
            'glass': {
                wasteType: 'Glass Waste',
                category: 'hazardous',
                icon: 'alert-circle',
                tips: [
                    'Wrap glass carefully in newspaper',
                    'Place in separate container',
                    'Keep away from organic waste',
                    'Inform collection staff about glass'
                ],
                points: 25
            },
            'paper': {
                wasteType: 'Paper Waste',
                category: 'dry',
                icon: 'file-text',
                tips: [
                    'Bundle paper together with twine',
                    'Place in blue recycling bin',
                    'Remove plastic coatings/laminates',
                    'Compress to save space'
                ],
                points: 15
            },
            'electronics': {
                wasteType: 'Electronic Waste',
                category: 'hazardous',
                icon: 'alert-circle',
                tips: [
                    'Do NOT mix with regular waste',
                    'Take to e-waste collection center',
                    'Keep in safe location until collection',
                    'Ensure safe handling for toxins'
                ],
                points: 50
            }
        };

        // Initialize
        function init() {
            loadWasteData();
        }

        function loadWasteData() {
            ApiService.getWasteData()
                .then(function (response) {
                    if (response.data) {
                        vm.userData = response.data.user || vm.userData;
                        vm.wasteStatus = response.data.status || vm.wasteStatus;
                    }
                    vm.issue.address = vm.userData.address;
                    vm.loading = false;
                })
                .catch(function (error) {
                    console.error('Error loading waste data:', error);
                    // Set default address
                    vm.issue.address = vm.userData.address || 'Your residential address';
                    vm.loading = false;
                });
        }

        // Submit Waste Issue
        vm.submitIssue = function () {
            if (!vm.issue.type) {
                $rootScope.showDialog('Missing Issue Type', 'Please select the type of waste issue you want to report.', 'warning');
                return;
            }

            vm.isSubmitting = true;

            // Prepare form data
            var issueData = {
                type: vm.issue.type,
                address: vm.issue.address,
                description: vm.issue.description,
                phone: vm.userData.phone,
                location: vm.userData.location
            };

            ApiService.submitWasteIssue(issueData)
                .then(function (response) {
                    vm.isSubmitting = false;
                    vm.showSuccess = true;
                    vm.successMessage = 'Your issue has been reported! Our team will address it within 24 hours.';

                    // Reset form
                    vm.issue = {
                        type: '',
                        address: vm.userData.address,
                        description: '',
                        photo: null
                    };

                    // document.querySelector('form').reset();

                    // Hide success message after 5 seconds
                    $timeout(function () {
                        vm.showSuccess = false;
                    }, 5000);
                })
                .catch(function (error) {
                    console.error('Error submitting issue:', error);
                    vm.isSubmitting = false;
                    $rootScope.showDialog('Submission Error', 'There was an error submitting your issue. Please try again or contact support.', 'error');
                });
        };

        // Open Live Service
        vm.openLiveService = function () {
            // Create a new view/modal for live service or navigate to new route
            // For now, we'll use a modal approach
            vm.showLiveService = true;
        };

        // Close Live Service Modal
        vm.closeLiveService = function () {
            vm.showLiveService = false;
        };

        // Waste validation now happens automatically from backend when driver confirms collection
        // No manual validation button for citizens

        // Analyze Waste Photo with AI (Nyckel ML Model)
        vm.analyzeWastePhoto = function () {
            if (!vm.aiPhoto) return;

            vm.aiAnalyzing = true;

            // Read file and create object URL for Nyckel API
            var fileInput = document.getElementById('aiPhoto');
            var file = fileInput.files[0];
            
            if (!file) {
                vm.aiAnalyzing = false;
                return;
            }

            // Create object URL for the uploaded image
            var imageUrl = URL.createObjectURL(file);
            
            // Send to backend for Nyckel classification
            ApiService.classifyWaste({
                image_url: imageUrl
            })
            .then(function (response) {
                if (response.data && response.data.success) {
                    // Get the classification from Nyckel
                    vm.aiResult = response.data.classification;
                    vm.aiResult.confidence = response.data.confidence;
                } else {
                    // Fallback to mock analysis if API fails
                    var wasteTypes = Object.keys(vm.wasteAnalysisDatabase);
                    var randomWaste = wasteTypes[Math.floor(Math.random() * wasteTypes.length)];
                    vm.aiResult = vm.wasteAnalysisDatabase[randomWaste];
                }
                vm.aiAnalyzing = false;
                
                // Clean up the object URL
                setTimeout(function() {
                    URL.revokeObjectURL(imageUrl);
                }, 100);
            })
            .catch(function (error) {
                console.error('Error classifying waste:', error);
                vm.aiAnalyzing = false;
                
                // Fallback to mock analysis if API fails
                var wasteTypes = Object.keys(vm.wasteAnalysisDatabase);
                var randomWaste = wasteTypes[Math.floor(Math.random() * wasteTypes.length)];
                vm.aiResult = vm.wasteAnalysisDatabase[randomWaste];
                
                // Clean up the object URL
                URL.revokeObjectURL(imageUrl);
            });
        };

        // Live Service Data
        vm.liveServiceData = {
            truckStatus: 'On the way',
            distance: '1.2 km',
            eta: '5-7 minutes',
            areasCompleted: '23 areas',
            driverName: 'Arun Singh',
            wasteType: 'Mixed & Segregated',
            nextStop: 'Sector 5, Block C',
            capacity: '75% Full',
            truckId: 'T-42'
        };

        vm.showLiveService = false;
        vm.isRefreshing = false;

        // FAQ Data
        vm.faqItems = [
            {
                question: 'What time is my garbage pickup scheduled?',
                answer: 'Garbage pickups are scheduled daily between 8:00 AM and 11:00 AM for most areas. You can check your specific schedule in the "Next Pickup" card above. If you miss the scheduled time, you can report it using the "Report an Issue" button.',
                open: false
            },
            {
                question: 'How should I segregate my waste?',
                answer: 'Waste should be segregated into three categories: Organic (food scraps, leaves), Dry (plastic, paper, metal), and Hazardous (glass, batteries, electronics). Proper segregation helps with recycling and earns you more reward points. See the "Waste Segregation Guide" section for detailed information.',
                open: false
            },
            {
                question: 'What are reward points and how do I earn them?',
                answer: 'Reward points are earned when you properly segregate and dispose of your waste. You earn 15 points for proper disposal, 10 points for segregation, and bonus points for consistent participation. These points can be redeemed for discounts or eco-friendly products.',
                open: false
            },
            {
                question: 'What should I do if my garbage is not picked up?',
                answer: 'If your garbage is not picked up at the scheduled time, you can report it using the "Report an Issue" button. Select "Missed garbage pickup" and provide details. Our team will address it within 24 hours. You can track the status in your "Collection History".',
                open: false
            },
            {
                question: 'Can I track my waste collection vehicle in real-time?',
                answer: 'Yes! Click on the "Live Tracking" button to see the real-time location of your waste collection vehicle. You can track distance, estimated time of arrival (ETA), driver information, and other details.',
                open: false
            },
            {
                question: 'How often are waste collections scheduled?',
                answer: 'Standard waste collection is scheduled once daily, usually in the morning. During peak seasons or in high-density areas, there may be additional collection times. Check your "Collection History" for patterns and schedules specific to your location.',
                open: false
            }
        ];

        // Initialize page
        init();
    }
})();
