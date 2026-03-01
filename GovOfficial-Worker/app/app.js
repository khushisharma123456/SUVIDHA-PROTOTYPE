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

// Dashboard Controller
app.controller('DashboardController', ['$scope', '$http', '$timeout', function ($scope, $http, $timeout) {
    // Initialize with loading state
    $scope.loading = true;
    $scope.assignment = {};
    $scope.stats = { assigned: 0, covered: 0, pending: 0, skipped: 0 };
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

        // Set stats from reports
        $scope.stats = {
            assigned: data.reports.total || 0,
            covered: data.reports.resolved || 0,
            pending: data.reports.open || 0,
            skipped: 0
        };

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

    // Start meter reading
    $scope.startMeterReading = function () {
        alert('Opening camera for meter reading...\nFeature ready for integration.');
    };
}]);

// Search Controller
app.controller('SearchController', ['$scope', '$http', function ($scope, $http) {
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
app.controller('ReportController', ['$scope', '$http', function ($scope, $http) {
    $scope.issueTypes = [
        { id: 'meter_fault', name: 'Meter Fault', icon: '⚡' },
        { id: 'access_denied', name: 'Access Denied', icon: '🚫' },
        { id: 'safety_hazard', name: 'Safety Hazard', icon: '⚠️' },
        { id: 'other', name: 'Other Issue', icon: '📋' }
    ];

    $scope.report = {
        issueType: '',
        household: '',
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

    $scope.addPhoto = function () {
        if ($scope.report.photos.length < 3) {
            $scope.report.photos.push({ id: Date.now(), name: 'photo_' + ($scope.report.photos.length + 1) + '.jpg' });
        }
    };

    $scope.removePhoto = function (index) {
        $scope.report.photos.splice(index, 1);
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
                    $scope.report = { issueType: '', household: '', description: '', photos: [] };
                });
            }, 3000);
        }).catch(function(error) {
            $scope.submitting = false;
            $scope.errorMessage = error.data?.message || 'Error submitting report';
            console.log('Error submitting report:', error);
        });
    };
}]);

// Settings Controller
app.controller('SettingsController', ['$scope', '$http', function ($scope, $http) {
    $scope.user = {
        name: 'Loading...',
        email: '',
        phone: '',
        employeeId: ''
    };

    $scope.settings = {
        language: 'en',
        darkMode: false,
        autoSync: true,
        pushNotifications: true,
        soundAlerts: true,
        gpsTagging: true,
        photoQuality: 'high'
    };

    // Load user profile from API
    $http.get('/api/profile').then(function(response) {
        if (response.data.user) {
            $scope.user = {
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

    $scope.saveSettings = function () {
        localStorage.setItem('workerSettings', JSON.stringify($scope.settings));
        alert('Settings saved successfully!');
    };

    $scope.clearCache = function () {
        if (confirm('Are you sure you want to clear cached data? This cannot be undone.')) {
            localStorage.clear();
            alert('Cache cleared successfully!');
        }
    };
}]);
