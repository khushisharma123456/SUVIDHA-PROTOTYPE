// AngularJS Application Module
(function() {
    'use strict';

    angular.module('suvidhaApp', ['ngRoute', 'ngSanitize'])
        .config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
            $routeProvider
                .when('/', {
                    templateUrl: '/static/app/views/dashboard.html',
                    controller: 'DashboardController',
                    controllerAs: 'vm',
                    requireAuth: true
                })
                .when('/dashboard', {
                    templateUrl: '/static/app/views/dashboard.html',
                    controller: 'DashboardController',
                    controllerAs: 'vm',
                    requireAuth: true
                })
                .when('/utilities', {
                    redirectTo: '/dashboard'
                })
                .when('/insights', {
                    templateUrl: '/static/app/views/insights.html',
                    controller: 'InsightsController',
                    controllerAs: 'vm',
                    requireAuth: true
                })
                .when('/simulator', {
                    templateUrl: '/static/app/views/simulator.html',
                    controller: 'SimulatorController',
                    controllerAs: 'vm',
                    requireAuth: true
                })
                .when('/services', {
                    templateUrl: '/static/app/views/services.html',
                    controller: 'ServicesController',
                    controllerAs: 'vm',
                    requireAuth: true
                })
                .when('/community', {
                    templateUrl: '/static/app/views/community.html',
                    controller: 'CommunityController',
                    controllerAs: 'vm',
                    requireAuth: true
                })
                .when('/records', {
                    templateUrl: '/static/app/views/records.html',
                    controller: 'RecordsController',
                    controllerAs: 'vm',
                    requireAuth: true
                })
                .when('/profile', {
                    templateUrl: '/static/app/views/profile.html?v=5',
                    controller: 'ProfileController',
                    controllerAs: 'vm',
                    requireAuth: true
                })
                .when('/waste-management', {
                    templateUrl: '/static/app/views/waste-management.html',
                    controller: 'WasteManagementController',
                    controllerAs: 'vm',
                    requireAuth: true
                })
                .when('/wallet', {
                    templateUrl: '/static/app/views/wallet.html',
                    controller: 'walletController',
                    controllerAs: 'vm',
                    requireAuth: true
                })
                .otherwise({
                    redirectTo: '/dashboard'
                });

            // Use HTML5 mode (optional - removes # from URLs)
            // $locationProvider.html5Mode(true);
        }])
        .run(['$rootScope', '$location', '$sce', 'AuthService', 'TranslationService', function($rootScope, $location, $sce, AuthService, TranslationService) {
            // Initialize translation service — load translations.json
            TranslationService.init();

            // Set current language (for backward compatibility)
            $rootScope.currentLang = 'en';

            // --- User name for sidebar ---
            $rootScope.loadUserName = function() {
                try {
                    var user = JSON.parse(localStorage.getItem('suvidhaUser') || '{}');
                    $rootScope.userName = user.full_name || user.name || user.username || 'Citizen';
                } catch (e) {
                    $rootScope.userName = 'Citizen';
                }
            };
            $rootScope.loadUserName();

            // --- Sidebar toggle ---
            $rootScope.sidebarCollapsed = false;
            $rootScope.mobileMenuOpen = false;
            $rootScope.toggleSidebar = function() {
                $rootScope.sidebarCollapsed = !$rootScope.sidebarCollapsed;
            };
            $rootScope.toggleMobileSidebar = function() {
                $rootScope.mobileMenuOpen = !$rootScope.mobileMenuOpen;
            };
            $rootScope.closeMobileSidebar = function() {
                if ($rootScope.mobileMenuOpen) {
                    $rootScope.mobileMenuOpen = false;
                }
            };

            // --- Global dialog service ---
            var iconMap = {
                info: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
                success: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
                warning: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
                error: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>'
            };

            $rootScope.dialog = { show: false };

            $rootScope.showDialog = function(title, message, type, btnText, showCancel) {
                $rootScope.dialog = {
                    show: true,
                    title: title || 'Notice',
                    message: message || '',
                    type: type || 'info',
                    icon: $sce.trustAsHtml(iconMap[type || 'info'] || iconMap.info),
                    btnText: btnText || 'OK',
                    showCancel: !!showCancel
                };
            };

            // Logout function
            $rootScope.logout = function() {
                AuthService.logout()
                    .then(function() {
                        localStorage.removeItem('suvidhaUser');
                        localStorage.removeItem('authToken');
                        window.location.href = '/login';
                    })
                    .catch(function() {
                        localStorage.removeItem('suvidhaUser');
                        localStorage.removeItem('authToken');
                        window.location.href = '/login';
                    });
            };

            // Authentication check on route change - DISABLED
            // Flask backend handles authentication via sessions
            // $rootScope.$on('$routeChangeStart', function(event, next) {
            //     if (next.requireAuth && !AuthService.isAuthenticated()) {
            //         event.preventDefault();
            //         window.location.href = '/login';
            //     }
            // });

            // Track current page for sidebar active state
            $rootScope.$on('$routeChangeSuccess', function() {
                var path = $location.path().substring(1) || 'dashboard';
                $rootScope.currentPage = path;
                // Reload user name on route change in case it was updated
                loadUserName();
            });

            // Initialize Lucide icons after route change
            $rootScope.$on('$viewContentLoaded', function() {
                if (typeof lucide !== 'undefined') {
                    setTimeout(function() { lucide.createIcons(); }, 50);
                }
            });
        }]);
})();
