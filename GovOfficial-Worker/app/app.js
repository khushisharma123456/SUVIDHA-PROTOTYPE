/**
 * Suvidha Field Agent Dashboard
 * AngularJS Application
 */

var app = angular.module('workerApp', ['ngRoute']);

// Route Configuration
app.config(['$routeProvider', function ($routeProvider) {
    $routeProvider
        .when('/', {
            templateUrl: 'app/views/dashboard.html',
            controller: 'DashboardController'
        })
        .when('/dashboard', {
            templateUrl: 'app/views/dashboard.html',
            controller: 'DashboardController'
        })
        .when('/search', {
            templateUrl: 'app/views/search.html',
            controller: 'SearchController'
        })
        .when('/wallet', {
            templateUrl: 'app/views/wallet.html',
            controller: 'WalletController'
        })
        .when('/report', {
            templateUrl: 'app/views/report.html',
            controller: 'ReportController'
        })
        .when('/settings', {
            templateUrl: 'app/views/settings.html',
            controller: 'SettingsController'
        })
        .otherwise({
            redirectTo: '/'
        });
}]);

// Main Controller (handles header, language, notifications)
app.controller('MainController', ['$scope', '$location', '$http', function ($scope, $location, $http) {
    $scope.currentDate = new Date().toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    $scope.currentPage = 'Field Agent Dashboard';
    $scope.notifications = 3;
    $scope.selectedLang = 'EN';
    $scope.showLangMenu = false;

    $scope.languages = [
        { code: 'EN', name: 'English' },
        { code: 'HI', name: 'हिन्दी' },
        { code: 'BN', name: 'বাংলা' }
    ];

    // Load user from localStorage first for immediate display
    var storedUser = JSON.parse(localStorage.getItem('suvidhaUser') || 'null');
    if (storedUser) {
        var uName = storedUser.full_name || storedUser.name || 'Field Agent';
        $scope.user = {
            name: uName,
            initials: uName.split(' ').map(function(n) { return n[0]; }).join('').toUpperCase().substring(0, 2) || 'FA',
            role: 'Field Agent',
            category: storedUser.category || 'Field Agent',
            assignedWard: storedUser.assigned_ward || ''
        };
    } else {
        $scope.user = {
            name: 'Field Agent',
            initials: 'FA',
            role: 'Field Agent'
        };
    }

    // Load user profile from API (overrides localStorage data)
    $http.get('/api/profile').then(function(response) {
        if (response.data.user) {
            $scope.user.name = response.data.user.full_name || $scope.user.name;
            $scope.user.initials = ($scope.user.name).split(' ').map(function(n) { return n[0]; }).join('').toUpperCase().substring(0, 2);
            $scope.user.category = response.data.user.category || $scope.user.category;
            $scope.user.assignedWard = response.data.user.assigned_ward || $scope.user.assignedWard;
        }
    }).catch(function(error) {
        console.log('Could not load user profile:', error);
    });

    $scope.toggleLangMenu = function ($event) {
        $event.stopPropagation();
        $scope.showLangMenu = !$scope.showLangMenu;
    };

    $scope.selectLang = function (lang, $event) {
        $event.stopPropagation();
        $scope.selectedLang = lang;
        $scope.showLangMenu = false;
    };

    $scope.isActive = function (path) {
        return $location.path() === path || ($location.path() === '/' && path === '/dashboard');
    };

    $scope.logout = function () {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('suvidhaUser');
            localStorage.removeItem('user_id');
            $http.post('/api/auth/logout').then(function() {
                window.location.href = '/';
            }).catch(function(error) {
                console.log('Error logging out:', error);
                window.location.href = '/';
            });
        }
    };

    // Close language menu on outside click
    document.addEventListener('click', function () {
        $scope.$apply(function () {
            $scope.showLangMenu = false;
        });
    });
}]);

// Sidebar Controller - For detecting current page
app.controller('SidebarController', ['$scope', '$http', function ($scope, $http) {
    // Get current page from URL
    $scope.isCurrentPage = function (pageName) {
        var currentUrl = window.location.pathname;
        return currentUrl.indexOf(pageName + '.html') !== -1;
    };

    // Load user data from localStorage
    var storedUser = JSON.parse(localStorage.getItem('suvidhaUser') || 'null');
    if (storedUser) {
        var uName = storedUser.full_name || storedUser.name || 'Field Agent';
        $scope.user = {
            name: uName,
            initials: uName.split(' ').map(function(n) { return n[0]; }).join('').toUpperCase().substring(0, 2) || 'FA',
            email: storedUser.email || '',
            agentId: storedUser.employee_id || 'N/A',
            phone: storedUser.phone || '',
            district: storedUser.assigned_district || storedUser.assigned_ward || '',
            joinDate: storedUser.created_at ? new Date(storedUser.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '',
            category: storedUser.category || 'Field Agent'
        };
    } else {
        $scope.user = {
            name: 'Field Agent',
            initials: 'FA',
            email: '',
            agentId: 'N/A',
            phone: '',
            district: '',
            joinDate: '',
            category: 'Field Agent'
        };
    }

    $scope.logout = function () {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('suvidhaUser');
            localStorage.removeItem('user_id');
            localStorage.removeItem('workerSettings');
            localStorage.removeItem('workerPreferences');
            localStorage.removeItem('workerMeterType');
            window.location.href = '/';
        }
    };
}]);

// Dashboard Controller
app.controller('DashboardController', ['$scope', '$http', '$timeout', '$location', function ($scope, $http, $timeout, $location) {
    // Sidebar functions
    $scope.isActive = function (path) {
        return $location.path() === path || ($location.path() === '/' && path === '/dashboard');
    };

    $scope.agentStatus = 'on_task';
    $scope.user = {
        name: 'Vikram Singh',
        initials: 'VS',
        role: 'Electric Meter Reader'
    };

    // Initialize with loading state
    $scope.loading = true;
    $scope.assignment = {};
    $scope.area = { district: 'New Delhi', ward: 'Ward 9', locality: 'Greenview Apts', state: 'Delhi' };
    $scope.stats = { assigned: 35, covered: 0, pending: 35, skipped: 0, coveredPercent: 0 };
    $scope.taskFilter = 'all';
    $scope.tasks = [];

    // Load dashboard data from API
    $http.get('/api/dashboard').then(function(response) {
        $scope.loading = false;
        var data = response.data;

        // Set assignment data
        $scope.assignment = {
            state: data.user.state || 'N/A',
            district: data.user.city || 'N/A',
            ward: data.user.ward || 'N/A',
            locality: data.user.locality || 'N/A'
        };
        // area alias used by the new dashboard layout
        $scope.area = {
            district: data.user.city || 'New Delhi',
            ward: data.user.ward || 'Ward 9',
            locality: data.user.locality || 'Greenview Apts',
            state: data.user.state || 'Delhi'
        };

        // Set stats from reports
        $scope.stats = {
            assigned: data.reports.total || 35,
            covered: data.reports.resolved || 0,
            pending: data.reports.open || 35,
            skipped: 0
        };
        $scope.stats.coveredPercent = $scope.getPercent($scope.stats.covered, $scope.stats.assigned);

        // Update motivation message
        var remaining = $scope.stats.assigned - $scope.stats.covered;
        var toBonus = Math.max(0, 5 - $scope.stats.covered);
        $scope.motivationMsg = toBonus > 0
            ? toBonus + ' more houses to reach your bonus! (' + remaining + ' left today)'
            : 'Bonus unlocked! Keep going 🎉 (' + remaining + ' left today)';

        // Load bills as tasks
        $http.get('/api/records').then(function(recordsResponse) {
            if (recordsResponse.data.bills && Array.isArray(recordsResponse.data.bills)) {
                $scope.tasks = recordsResponse.data.bills.map(function(bill, index) {
                    return {
                        id: index + 1,
                        name: 'House No. ' + (101 + index),
                        type: bill.utility || 'general',
                        time: Math.floor(Math.random() * 40 + 30),
                        completed: bill.status === 'paid'
                    };
                });
            }
        }).catch(function(error) {
            console.log('Could not load records:', error);
            // Use empty tasks array if API fails
            $scope.tasks = [];
        });
    }).catch(function(error) {
        $scope.loading = false;
        console.log('Could not load dashboard data:', error);
        // Set default values on error
        $scope.assignment = { state: 'N/A', district: 'N/A', ward: 'N/A', locality: 'N/A' };
        $scope.area = { district: 'New Delhi', ward: 'Ward 9', locality: 'Greenview Apts', state: 'Delhi' };
        $scope.stats = { assigned: 35, covered: 0, pending: 35, skipped: 0, coveredPercent: 0 };
    });

    // Get percentage helper
    $scope.getPercent = function (value, total) {
        if (!total || total === 0) return 0;
        return Math.round((value / total) * 100);
    };

    // Filter tasks
    $scope.setFilter = function (filter) {
        $scope.taskFilter = filter;
    };

    $scope.filteredTasks = function () {
        if ($scope.taskFilter === 'all') {
            return $scope.tasks;
        }
        return $scope.tasks.filter(function (task) {
            return task.type === $scope.taskFilter;
        });
    };

    // Toggle task completion
    $scope.toggleTask = function (task) {
        task.completed = !task.completed;
        $scope.updateStats();
    };

    // Update stats based on completed tasks
    $scope.updateStats = function () {
        var completedCount = $scope.tasks.filter(function (t) { return t.completed; }).length;
        $scope.stats.covered = completedCount;
        $scope.stats.pending = $scope.stats.assigned - completedCount - $scope.stats.skipped;
    };

    // Refresh stats
    $scope.refreshStats = function () {
        $http.get('/api/dashboard').then(function(response) {
            var data = response.data;
            $scope.stats = {
                assigned: data.reports.total || 0,
                covered: data.reports.resolved || 0,
                pending: data.reports.open || 0,
                skipped: 0
            };
            alert('Stats refreshed!');
        }).catch(function(error) {
            alert('Error refreshing stats');
        });
    };

    // Motivation message for coverage
    $scope.motivationMsg = '5 more houses to reach your bonus!';
    $scope.showInsights = false;

    // Wallet
    $scope.walletPoints = 450;
    $scope.showWalletDialog = function (type, icon, name, cost) {
        if ($scope.walletPoints >= cost) {
            if (confirm('Redeem ' + cost + ' pts for ' + name + '?')) {
                $scope.walletPoints -= cost;
                alert(icon + ' ' + name + ' redeemed successfully!');
            }
        } else {
            alert('Not enough points. Need ' + cost + ' pts, you have ' + $scope.walletPoints + '.');
        }
    };

    // Start Work action
    $scope.startWork = function () {
        alert('Starting next house visit. GPS tracking active.');
    };

    // Open Full Map
    $scope.openFullMap = function () {
        $location.path('/search');
    };

    // Start meter reading
    $scope.startMeterReading = function () {
        alert('Opening camera for meter reading...\nFeature ready for integration.');
    };

    // Trigger Leaflet map init after Angular renders the DOM
    $timeout(function () {
        if (typeof initDashboardMap === 'function') {
            initDashboardMap();
        }
    }, 600);
}]);

// Search Controller
app.controller('SearchController', ['$scope', '$http', '$location', function ($scope, $http, $location) {
    // Sidebar functions
    $scope.isActive = function (path) {
        return $location.path() === path || ($location.path() === '/' && path === '/dashboard');
    };

    $scope.agentStatus = 'on_task';
    $scope.user = {
        name: 'Vikram Singh',
        initials: 'VS',
        role: 'Electric Meter Reader'
    };

    $scope.searchQuery = '';
    $scope.filterStatus = 'all';
    $scope.households = [];
    $scope.loading = true;

    // Load households from API
    $http.get('/api/community/members').then(function(response) {
        $scope.loading = false;
        if (response.data.members && Array.isArray(response.data.members)) {
            $scope.households = response.data.members.map(function(member) {
                return {
                    id: 'HH-' + member.id,
                    name: member.full_name || 'Household',
                    address: (member.city || '') + ', ' + (member.state || ''),
                    status: 'pending'
                };
            });
        }
    }).catch(function(error) {
        $scope.loading = false;
        console.log('Could not load households:', error);
    });

    $scope.setFilterStatus = function (status) {
        $scope.filterStatus = status;
    };

    $scope.filteredHouseholds = function () {
        var results = $scope.households;

        // Filter by search query
        if ($scope.searchQuery) {
            var query = $scope.searchQuery.toLowerCase();
            results = results.filter(function (h) {
                return h.name.toLowerCase().includes(query) ||
                    h.id.toLowerCase().includes(query) ||
                    h.address.toLowerCase().includes(query);
            });
        }

        // Filter by status
        if ($scope.filterStatus !== 'all') {
            results = results.filter(function (h) {
                return h.status === $scope.filterStatus;
            });
        }

        return results;
    };

    $scope.selectHousehold = function (household) {
        alert('Selected: ' + household.name + '\n' + household.address);
    };
}]);

// Report Controller
app.controller('ReportController', ['$scope', '$http', '$location', function ($scope, $http, $location) {
    // Sidebar functions
    $scope.isActive = function (path) {
        return $location.path() === path || ($location.path() === '/' && path === '/dashboard');
    };

    $scope.agentStatus = 'on_task';
    $scope.user = {
        name: 'Vikram Singh',
        initials: 'VS',
        role: 'Electric Meter Reader'
    };

    $scope.issueTypes = [
        { id: 'meter_fault', name: 'Meter Fault', icon: '⚡' },
        { id: 'access_denied', name: 'Access Denied', icon: '🚫' },
        { id: 'safety_hazard', name: 'Safety Hazard', icon: '⚠️' },
        { id: 'other', name: 'Other Issue', icon: '📋' }
    ];

    $scope.report = {
        issueType: '',
        houseNo: '',
        description: '',
        photos: []
    };

    $scope.households = [];
    $scope.submitted = false;
    $scope.submitting = false;
    $scope.referenceId = '';
    $scope.errorMessage = '';

    // Load households from API
    $http.get('/api/community/members').then(function(response) {
        if (response.data.members && Array.isArray(response.data.members)) {
            $scope.households = response.data.members.map(function(member) {
                return {
                    id: member.id,
                    name: 'HH-' + member.id + ': ' + (member.full_name || 'Household')
                };
            });
        }
    }).catch(function(error) {
        console.log('Could not load households:', error);
    });

    $scope.selectIssueType = function (type) {
        $scope.report.issueType = type.id;
    };

    // Camera and Photo handling variables
    $scope.cameraActive = false;
    $scope.showCameraPreview = false;
    $scope.capturedPhotoPreview = null;
    var videoElement = null;
    var stream = null;

    // Open camera for photo capture
    $scope.openCamera = function () {
        $scope.cameraActive = true;
        $scope.showCameraPreview = true;
        
        // Wait for video element to be rendered
        setTimeout(function() {
            videoElement = document.getElementById('videoElement');
            if (videoElement && !stream) {
                navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
                    .then(function(mediaStream) {
                        stream = mediaStream;
                        videoElement.srcObject = stream;
                        videoElement.play();
                    })
                    .catch(function(error) {
                        console.error('Error accessing camera:', error);
                        alert('Camera access denied. Please enable camera permissions.');
                        $scope.$apply(function() {
                            $scope.cameraActive = false;
                            $scope.showCameraPreview = false;
                        });
                    });
            }
        }, 100);
    };

    // Capture photo from video stream
    $scope.capturePhoto = function () {
        if (videoElement && videoElement.readyState === videoElement.HAVE_ENOUGH_DATA) {
            var canvas = document.createElement('canvas');
            canvas.width = videoElement.videoWidth;
            canvas.height = videoElement.videoHeight;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(videoElement, 0, 0);
            $scope.capturedPhotoPreview = canvas.toDataURL('image/jpeg', 0.8);
            $scope.cameraActive = false;
        }
    };

    // Capture photo manually (called by button click)
    $scope.capturePhotoManually = function () {
        $scope.capturePhoto();
    };

    // Close camera without capturing
    $scope.closeCamera = function () {
        // Stop camera stream
        if (stream) {
            stream.getTracks().forEach(function(track) {
                track.stop();
            });
            stream = null;
        }
        
        $scope.cameraActive = false;
        $scope.showCameraPreview = false;
        $scope.capturedPhotoPreview = null;
    };

    // Accept the captured photo
    $scope.acceptPhoto = function () {
        if (!$scope.capturedPhotoPreview) {
            $scope.capturePhoto();
        }
        
        // Stop camera stream
        if (stream) {
            stream.getTracks().forEach(function(track) {
                track.stop();
            });
            stream = null;
        }
        
        // Add photo to collection
        if ($scope.report.photos.length < 3) {
            $scope.report.photos.push({
                id: Date.now(),
                name: 'photo_' + ($scope.report.photos.length + 1) + '.jpg',
                dataUrl: $scope.capturedPhotoPreview,
                timestamp: new Date().toISOString()
            });
        }
        
        // Reset camera
        $scope.showCameraPreview = false;
        $scope.capturedPhotoPreview = null;
        $scope.cameraActive = false;
    };

    // Retake photo - restart camera
    $scope.retakePhoto = function () {
        // Stop current stream
        if (stream) {
            stream.getTracks().forEach(function(track) {
                track.stop();
            });
            stream = null;
        }
        
        $scope.cameraActive = true;
        $scope.capturedPhotoPreview = null;
        
        setTimeout(function() {
            videoElement = document.getElementById('videoElement');
            if (videoElement && !stream) {
                navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
                    .then(function(mediaStream) {
                        stream = mediaStream;
                        videoElement.srcObject = stream;
                        videoElement.play();
                    })
                    .catch(function(error) {
                        console.error('Error accessing camera:', error);
                        alert('Camera access denied.');
                    });
            }
        }, 100);
    };

    // Trigger file upload dialog
    $scope.triggerFileUpload = function () {
        var fileInput = document.getElementById('photoUploadInput');
        fileInput.click();
    };

    // Handle photo file upload
    $scope.handlePhotoUpload = function () {
        var fileInput = document.getElementById('photoUploadInput');
        if (fileInput.files && fileInput.files[0]) {
            var file = fileInput.files[0];
            var reader = new FileReader();
            
            reader.onload = function(e) {
                $scope.$apply(function() {
                    if ($scope.report.photos.length < 3) {
                        $scope.report.photos.push({
                            id: Date.now(),
                            name: file.name,
                            dataUrl: e.target.result,
                            timestamp: new Date().toISOString()
                        });
                    } else {
                        alert('Maximum 3 photos allowed.');
                    }
                    // Reset file input
                    fileInput.value = '';
                });
            };
            
            reader.readAsDataURL(file);
        }
    };

    $scope.addPhoto = function () {
        if ($scope.report.photos.length < 3) {
            $scope.report.photos.push({ id: Date.now(), name: 'photo_' + ($scope.report.photos.length + 1) + '.jpg' });
        }
    };

    $scope.removePhoto = function (index) {
        $scope.report.photos.splice(index, 1);
        
        // Stop camera if removing while camera is active
        if ($scope.cameraActive && stream) {
            stream.getTracks().forEach(function(track) {
                track.stop();
            });
            stream = null;
            $scope.cameraActive = false;
            $scope.showCameraPreview = false;
            $scope.capturedPhotoPreview = null;
        }
    };

    $scope.submitReport = function () {
        if (!$scope.report.issueType || !$scope.report.household || !$scope.report.description) {
            alert('Please fill in all required fields.');
            return;
        }

        $scope.submitting = true;
        $scope.errorMessage = '';

        var reportData = {
            utility_type: $scope.report.issueType,
            community_id: $scope.report.household,
            description: $scope.report.description,
            title: $scope.report.issueType,
            priority: 'medium'
        };

        $http.post('/api/services/submit', reportData).then(function(response) {
            $scope.submitting = false;
            $scope.referenceId = response.data.reference_id || 'REF-' + Date.now().toString().slice(-6);
            $scope.submitted = true;

            // Reset after 3 seconds
            setTimeout(function () {
                $scope.$apply(function () {
                    $scope.submitted = false;
                    $scope.report = { issueType: '', houseNo: '', description: '', photos: [] };
                });
            }, 3000);
        }).catch(function(error) {
            $scope.submitting = false;
            $scope.errorMessage = error.data?.message || 'Error submitting report';
            console.log('Error submitting report:', error);
        });
    };
}]);

// Wallet Controller
app.controller('WalletController', ['$scope', '$http', '$location', function ($scope, $http, $location) {
    // Sidebar functions
    $scope.isActive = function (path) {
        return $location.path() === path || ($location.path() === '/' && path === '/dashboard');
    };

    $scope.agentStatus = 'on_task';
    $scope.user = {
        name: 'Vikram Singh',
        initials: 'VS',
        role: 'Electric Meter Reader'
    };

    $scope.walletBalance = 5250;
    $scope.transactions = [];
    $scope.loading = true;

    // Load wallet data
    $http.get('/api/wallet').then(function(response) {
        $scope.loading = false;
        if (response.data) {
            $scope.walletBalance = response.data.balance || 0;
            $scope.transactions = response.data.transactions || [];
        }
    }).catch(function(error) {
        $scope.loading = false;
        console.log('Could not load wallet data:', error);
    });

    $scope.logout = function () {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('suvidhaUser');
            localStorage.removeItem('user_id');
            $http.post('/api/auth/logout').then(function() {
                window.location.href = '/';
            }).catch(function(error) {
                console.log('Error logging out:', error);
                window.location.href = '/';
            });
        }
    };
}]);

// Settings Controller
app.controller('SettingsController', ['$scope', '$http', '$location', '$timeout', function ($scope, $http, $location, $timeout) {\n    // Sidebar functions\n    $scope.isActive = function (path) {\n        return $location.path() === path || ($location.path() === '/' && path === '/dashboard');\n    };\n\n    $scope.agentStatus = 'on_task';\n    $scope.user = {\n        name: 'Vikram Singh',\n        initials: 'VS',\n        role: 'Electric Meter Reader'\n    };\n\n    $scope.profileSettings = {\n        name: 'Loading...',\n        email: '',\n        phone: '',\n        employeeId: ''\n    };\n\n    $scope.settings = {\n        language: 'en',\n        darkMode: false,\n        autoSync: true,\n        pushNotifications: true,\n        soundAlerts: true,\n        gpsTagging: true,\n        photoQuality: 'high'\n    };

    // Load user profile from API
    $http.get('/api/profile').then(function(response) {
        if (response.data.user) {
            $scope.profileSettings = {
                name: response.data.user.full_name || 'Field Agent',
                email: response.data.user.email || '',
                phone: response.data.user.phone || '',
                employeeId: response.data.user.employee_id || 'N/A'
            };
        }
    }).catch(function(error) {
        console.log('Could not load user profile:', error);
    });

    // Load saved settings
    var savedSettings = localStorage.getItem('workerSettings');
    if (savedSettings) {
        $scope.settings = JSON.parse(savedSettings);
    }

    // Load saved preferences
    var savedPreferences = localStorage.getItem('workerPreferences');
    if (savedPreferences) {
        $scope.preferences = JSON.parse(savedPreferences);
    }

    $scope.saveSettings = function () {
        localStorage.setItem('workerSettings', JSON.stringify($scope.settings));
        alert('Settings saved successfully!');
    };

    // Save preferences with feedback
    $scope.savePreferences = function () {
        localStorage.setItem('workerPreferences', JSON.stringify($scope.preferences));
        $scope.preferencesSaveStatus = 'success';
        
        // Auto-dismiss message after 3 seconds
        $timeout(function() {
            $scope.preferencesSaveStatus = '';
        }, 3000);
    };

    // Reset preferences to defaults
    $scope.resetPreferences = function () {
        if (confirm('Are you sure you want to reset all preferences to defaults?')) {
            $scope.preferences = {
                language: 'en',
                notifications: true,
                autoSync: true,
                highQualityPhotos: false
            };
            localStorage.setItem('workerPreferences', JSON.stringify($scope.preferences));
            $scope.preferencesSaveStatus = 'success';
            
            // Auto-dismiss message after 3 seconds
            $timeout(function() {
                $scope.preferencesSaveStatus = '';
            }, 3000);
        }
    };

    $scope.clearCache = function () {
        if (confirm('Are you sure you want to clear cached data? This cannot be undone.')) {
            localStorage.clear();
            alert('Cache cleared successfully!');
        }
    };

    $scope.logout = function () {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('suvidhaUser');
            localStorage.removeItem('user_id');
            $http.post('/api/auth/logout').then(function() {
                window.location.href = '/';
            }).catch(function(error) {
                console.log('Error logging out:', error);
                window.location.href = '/';
            });
        }
    };
}]);
