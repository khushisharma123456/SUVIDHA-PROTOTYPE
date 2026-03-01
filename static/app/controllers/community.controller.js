// Community Controller - Enhanced
(function() {
    'use strict';

    angular.module('suvidhaApp')
        .controller('CommunityController', ['$scope', '$timeout', 'ApiService', CommunityController]);

    function CommunityController($scope, $timeout, ApiService) {
        var vm = this;
        var $rootScope = $scope.$root;
        vm.loading = true;
        vm.activeSection = 'overview';
        vm.mapView = 'ward';
        vm.advisoryFilter = 'all';

        // Cascading State → City → Ward filter (demo data)
        vm.filterData = {
            'Delhi': {
                'New Delhi': [
                    { value: 'Kalkaji', label: 'Kalkaji (South)' },
                    { value: 'Nehru Place', label: 'Nehru Place' },
                    { value: 'Greater Kailash II', label: 'Greater Kailash II' }
                ],
                'South Delhi': [
                    { value: 'Saket', label: 'Saket' },
                    { value: 'Hauz Khas', label: 'Hauz Khas' }
                ]
            },
            'Uttar Pradesh': {
                'Noida': [
                    { value: 'Sector 62', label: 'Sector 62' },
                    { value: 'Sector 18', label: 'Sector 18' }
                ],
                'Ghaziabad': [
                    { value: 'Indirapuram', label: 'Indirapuram' },
                    { value: 'Vaishali', label: 'Vaishali' }
                ]
            }
        };

        vm.stateList = Object.keys(vm.filterData);
        vm.selectedState = 'Delhi';
        vm.cityList = Object.keys(vm.filterData['Delhi']);
        vm.selectedCity = 'New Delhi';
        vm.wardList = vm.filterData['Delhi']['New Delhi'];
        vm.selectedWard = 'Kalkaji';

        vm.onStateChange = function() {
            vm.cityList = Object.keys(vm.filterData[vm.selectedState] || {});
            vm.selectedCity = vm.cityList[0] || '';
            vm.onCityChange();
        };

        vm.onCityChange = function() {
            vm.wardList = (vm.filterData[vm.selectedState] || {})[vm.selectedCity] || [];
            vm.selectedWard = vm.wardList.length ? vm.wardList[0].value : '';
            vm.loadWardData();
        };

        // Block details data (for rich dialog)
        vm.blockDetails = {
            'A': { score: 92, status: 'Stable', electricity: '99.8% uptime', water: '24/7 supply', waste: 'On time', issues: 0, population: 420 },
            'B': { score: 68, status: 'Moderate', electricity: '96% uptime', water: 'Intermittent evenings', waste: 'On time', issues: 2, population: 380 },
            'C': { score: 41, status: 'High Stress', electricity: '89% uptime', water: 'Low pressure', waste: '1 day delayed', issues: 5, population: 510 },
            'D': { score: 88, status: 'Stable', electricity: '99.5% uptime', water: '24/7 supply', waste: 'On time', issues: 0, population: 290 },
            'E': { score: 95, status: 'Stable', electricity: '99.9% uptime', water: '24/7 supply', waste: 'On time', issues: 0, population: 350 },
            'F': { score: 60, status: 'Moderate', electricity: '94% uptime', water: 'Scheduled cuts', waste: 'On time', issues: 3, population: 440 },
            'G': { score: 83, status: 'Stable', electricity: '98% uptime', water: '22hr supply', waste: 'On time', issues: 1, population: 310 },
            'H': { score: 35, status: 'High Stress', electricity: '82% uptime', water: 'Major disruption', waste: '2 days delayed', issues: 7, population: 470 }
        };
        
        // Header Stats
        vm.stats = {
            healthScore: 78,
            activeParticipants: '342',
            recentReports: 24
        };
        
        // Participation Data
        vm.participation = {
            points: 120,
            rank: 'Top 15%'
        };
        
        vm.earnedBadges = [
            { name: 'Grid Supporter', icon: 'zap' },
            { name: 'Water Steward', icon: 'droplet' },
            { name: 'Community Leader', icon: 'award' }
        ];
        
        // Active Challenges
        vm.activeChallenges = [
            {
                name: 'Peak Hour Saver',
                type: 'electricity',
                icon: 'zap',
                progress: 40,
                daysLeft: 3
            }
        ];
        
        // Advisories Data
        vm.advisories = [
            {
                id: 1,
                priority: 'urgent',
                utility: 'electricity',
                utilityIcon: 'zap',
                title: 'Planned Maintenance - Block C',
                description: 'Transformer upgrade work scheduled. Power supply will be interrupted.',
                issuedBy: 'BRPL',
                validTill: 'Valid till: 20 Jan 2026',
                affectedArea: 'Block C, Kalkaji'
            },
            {
                id: 2,
                priority: 'info',
                utility: 'water',
                utilityIcon: 'droplet',
                title: 'Winter Water Supply Schedule',
                description: 'Morning supply hours adjusted for winter season.',
                issuedBy: 'DJB',
                validTill: 'Seasonal',
                affectedArea: 'All blocks'
            },
            {
                id: 3,
                priority: 'info',
                utility: 'gas',
                utilityIcon: 'flame',
                title: 'Safety Inspection Drive',
                description: 'Free gas connection safety inspection available for all households.',
                issuedBy: 'IGL',
                validTill: 'Valid till: 28 Feb 2026',
                affectedArea: 'Ward-wide'
            }
        ];
        
        vm.filteredAdvisories = vm.advisories;
        
        // Activity Feed
        vm.activityFeed = [
            {
                type: 'participation',
                icon: 'users',
                message: '<strong>38 households</strong> participated in "Peak Hour Saver" challenge yesterday.',
                timeAgo: '2 hours ago',
                actionable: true,
                likes: 12
            },
            {
                type: 'report',
                icon: 'wrench',
                message: '<strong>12 public water leaks</strong> reported and fixed in the last week.',
                timeAgo: '5 hours ago',
                location: 'Various blocks',
                actionable: true,
                likes: 8
            },
            {
                type: 'resolution',
                icon: 'check-circle',
                message: '<strong>5 power outages</strong> resolved faster than SLA due to community alerts.',
                timeAgo: '1 day ago',
                actionable: true,
                likes: 15
            },
            {
                type: 'achievement',
                icon: 'award',
                message: 'Ward achieved <strong>14% solar adoption</strong> - highest in South Delhi zone!',
                timeAgo: '2 days ago',
                actionable: true,
                likes: 24
            }
        ];
        
        vm.hasMoreActivity = true;
        
        // Comparison Metrics
        vm.comparisonMetrics = [
            {
                name: 'Avg Electricity Bill',
                icon: 'indian-rupee',
                ward: '₹1,150',
                wardTrend: 'down',
                zone: '₹1,300',
                city: '₹1,050'
            },
            {
                name: 'Water Reliability',
                icon: 'droplets',
                ward: '92%',
                wardTrend: 'up',
                zone: '88%',
                city: '85%'
            },
            {
                name: 'Solar Penetration',
                icon: 'sun',
                ward: '14%',
                wardTrend: 'up',
                zone: '10%',
                city: '8%'
            },
            {
                name: 'Power Cuts (hrs/month)',
                icon: 'power-off',
                ward: '1.2',
                wardTrend: 'up',
                zone: '2.1',
                city: '3.5'
            }
        ];

        // Methods
        vm.showSection = function(section) {
            vm.activeSection = section;
            $timeout(function() {
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            }, 50);
        };
        
        vm.loadWardData = function() {
            vm.loading = true;
            // Simulate loading ward-specific data
            $timeout(function() {
                vm.loading = false;
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            }, 500);
        };
        
        vm.changeMapView = function(view) {
            vm.mapView = view;
        };
        
        vm.showBlockDetails = function(block) {
            var d = vm.blockDetails[block];
            if (d) {
                var msg = 'Health Score: ' + d.score + '% (' + d.status + ')\n'
                    + 'Population: ' + d.population + ' households\n\n'
                    + '⚡ Electricity: ' + d.electricity + '\n'
                    + '💧 Water: ' + d.water + '\n'
                    + '🗑️ Waste Collection: ' + d.waste + '\n'
                    + '⚠️ Open Issues: ' + d.issues;
                var level = d.score >= 75 ? 'info' : d.score >= 50 ? 'warning' : 'warning';
                $rootScope.showDialog('Block ' + block + ' — ' + d.status, msg, level);
            } else {
                $rootScope.showDialog('Block ' + block, 'No data available for this block.', 'info');
            }
        };
        
        vm.joinChallenge = function(challengeId) {
            $rootScope.showDialog('Challenge Joined!', 'You have successfully joined the community challenge. Complete daily targets to earn points and climb the leaderboard. Good luck!', 'success');
        };
        
        vm.reportLeak = function() {
            console.log('Report leak');
            // Navigate to services page with leak report pre-filled
            window.location.href = '#!/services';
        };
        
        vm.startSafetyChecklist = function() {
            $rootScope.showDialog('Safety Checklist', 'Gas Safety Checklist:\n• Check pipeline connections\n• Test regulator seal\n• Verify ventilation\n• Inspect rubber tube condition\n• Confirm emergency number (1906) saved\n\nComplete all items to earn 20 community points!', 'info');
        };
        
        vm.filterAdvisories = function(filter) {
            vm.advisoryFilter = filter;
            if (filter === 'all') {
                vm.filteredAdvisories = vm.advisories;
            } else {
                vm.filteredAdvisories = vm.advisories.filter(function(advisory) {
                    return advisory.utility === filter;
                });
            }
        };
        
        vm.viewAdvisoryDetails = function(advisory) {
            $rootScope.showDialog(
                advisory.title || 'Advisory Details',
                'Issued by: ' + (advisory.issuedBy || 'N/A') + '\nAffected Area: ' + (advisory.affectedArea || 'N/A') + '\nValidity: ' + (advisory.validTill || 'N/A') + '\n\n' + (advisory.description || ''),
                advisory.priority === 'urgent' ? 'warning' : 'info'
            );
        };
        
        vm.likeActivity = function(activity) {
            activity.likes = (activity.likes || 0) + 1;
        };
        
        vm.loadMoreActivity = function() {
            $rootScope.showDialog('Activity Feed', 'All available community activity for your ward has been loaded. Check back later for new updates and reports.', 'info');
            vm.hasMoreActivity = false;
        };
        
        vm.exportInsights = function() {
            $rootScope.showDialog('Export Community Insights', 'A report with ward comparison metrics, participation data, and utility benchmarks is being generated. The CSV file will be ready for download shortly.', 'info');
        };

        function init() {
            loadCommunityData();
            // Initialize Lucide icons
            $timeout(function() {
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            }, 100);
        }

        function loadCommunityData() {
            ApiService.getCommunityData()
                .then(function(response) {
                    if (response.data) {
                        // Update stats from API
                        if (response.data.health_score !== undefined) {
                            vm.stats.healthScore = response.data.health_score;
                        }
                        if (response.data.active_participants !== undefined) {
                            vm.stats.activeParticipants = response.data.active_participants.toString();
                        }
                        if (response.data.recent_reports !== undefined) {
                            vm.stats.recentReports = response.data.recent_reports;
                        }
                        if (response.data.ward) {
                            vm.selectedWard = response.data.ward;
                        }
                    }
                    vm.loading = false;
                })
                .catch(function(error) {
                    console.error('Error loading community data:', error);
                    vm.loading = false;
                });
        }

        init();
    }
})();
