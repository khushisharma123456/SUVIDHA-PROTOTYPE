angular.module('suvidhaApp')
    .controller('AuthController', ['$scope', '$location', '$rootScope', 'AuthService', '$timeout',
        function($scope, $location, $rootScope, AuthService, $timeout) {
            
            // Read URL query params to determine initial view
            var searchParams = $location.search();
            var initialMode = searchParams.mode || 'login';
            var initialRole = searchParams.role || null;
            
            // Current state - set from URL params (default to login, remove landing option)
            $scope.currentView = (initialMode === 'login' || initialMode === 'signup') ? initialMode : 'login';
            $scope.selectedRole = initialRole; // pre-select role if passed from landing page
            $scope.currentStep = 1;
            $scope.totalSteps = 6;
            
            // Language handling
            $scope.currentLang = $rootScope.currentLang || 'en';
            
            $scope.setLanguage = function(lang) {
                $scope.currentLang = lang;
                $rootScope.currentLang = lang;
            };
            
            // View navigation
            $scope.setCurrentView = function(view) {
                $scope.currentView = view;
                if (view === 'signup') {
                    $scope.currentStep = 1;
                }
            };
            
            // Form data
            $scope.loginData = {
                identifier: '',
                password: ''
            };
            
            $scope.signupData = {
                fullName: '',
                language: '',
                email: '',
                phone: '',
                aadhaar: '',
                consent: false,
                state: '',
                city: '',
                ward: '',
                locality: '',
                electricityProvider: '',
                waterProvider: '',
                gasProvider: '',
                password: '',
                confirmPassword: '',
                alertsEnabled: true
            };
            
            // Language options
            $scope.languages = [
                { value: 'en', label: 'English (EN)' },
                { value: 'hi', label: 'हिंदी (Hindi)' },
                { value: 'ta', label: 'தமிழ் (Tamil)' },
                { value: 'te', label: 'తెలుగు (Telugu)' },
                { value: 'bn', label: 'বাংলা (Bengali)' }
            ];
            
            // Location options
            $scope.states = [
                { value: 'delhi', label: 'Delhi' },
                { value: 'mumbai', label: 'Maharashtra' },
                { value: 'karnataka', label: 'Karnataka' },
                { value: 'tamilnadu', label: 'Tamil Nadu' }
            ];
            
            $scope.cities = [
                { value: 'delhi', label: 'Delhi' },
                { value: 'mumbai', label: 'Mumbai' },
                { value: 'bangalore', label: 'Bangalore' },
                { value: 'chennai', label: 'Chennai' }
            ];
            
            $scope.wards = [
                { value: 'ward-1', label: 'Ward 1' },
                { value: 'ward-2', label: 'Ward 2' },
                { value: 'ward-3', label: 'Ward 3' },
                { value: 'ward-4', label: 'Ward 4' }
            ];
            
            // Service providers
            $scope.electricityProviders = [
                { value: 'bses', label: 'BSES Yamuna Power Ltd' },
                { value: 'tata', label: 'Tata Power Delhi' },
                { value: 'cesc', label: 'CESC Limited' },
                { value: 'torrent', label: 'Torrent Power' }
            ];
            
            $scope.waterProviders = [
                { value: 'djb', label: 'Delhi Jal Board' },
                { value: 'bmc', label: 'Brihanmumbai Municipal Corporation' },
                { value: 'bwssb', label: 'Bangalore Water Supply & Sewerage Board' },
                { value: 'cmwssb', label: 'Chennai Metropolitan Water Supply & Sewerage Board' }
            ];
            
            $scope.gasProviders = [
                { value: 'indane', label: 'Indane (Cylinder)' },
                { value: 'hp', label: 'HP Gas (Cylinder)' },
                { value: 'png', label: 'PNG (Pipeline Natural Gas)' },
                { value: 'bharat', label: 'Bharat Gas' }
            ];
            
            // Navigation functions
            $scope.goToSignup = function() {
                $scope.setCurrentView('signup');
            };
            
            $scope.goToLogin = function() {
                $scope.setCurrentView('login');
            };
            
            // Role selection - redirect to appropriate portal
            $scope.selectRole = function(role) {
                switch(role) {
                    case 'citizen':
                        // Stay on current portal, go to login
                        $scope.setCurrentView('login');
                        break;
                    case 'senior':
                        // Redirect to senior citizen portal
                        window.location.href = '/SeniorCitizen/app/views/dashboard.html';
                        break;
                    case 'official':
                        // Redirect to government officials portal
                        window.location.href = '/GovOfficials-Admin/app/views/dashboard.html';
                        break;
                    case 'kiosk':
                        // Kiosk mode - could be a special simplified view
                        window.location.href = '/GovOfficial-Worker/app/views/dashboard.html';
                        break;
                    default:
                        $scope.setCurrentView('login');
                }
            };
            
            // Login role selection (from login page role grid)
            $scope.selectLoginRole = function(role) {
                switch(role) {
                    case 'citizen':
                        $scope.selectedRole = 'citizen';
                        break;
                    case 'senior':
                        $scope.selectedRole = 'senior';
                        break;
                    case 'worker':
                        $scope.selectedRole = 'worker';
                        break;
                    case 'official':
                        $scope.selectedRole = 'official';
                        break;
                    default:
                        $scope.selectedRole = role;
                }
            };
            
            // Progress calculation
            $scope.getProgressPercent = function() {
                return (($scope.currentStep - 1) / ($scope.totalSteps - 1)) * 100;
            };
            
            // Step class helpers
            $scope.isStepActive = function(step) {
                return $scope.currentStep === step;
            };
            
            $scope.isStepCompleted = function(step) {
                return step < $scope.currentStep;
            };
            
            // Navigate between steps
            $scope.goToStep = function(step) {
                $scope.currentStep = step;
            };
            
            // Validation helpers
            $scope.validateStep1 = function() {
                if (!$scope.signupData.fullName || !$scope.signupData.language) {
                    $rootScope.showDialog('Missing Fields', 'Please fill in your full name and select a preferred language.', 'warning');
                    return false;
                }
                return true;
            };
            
            $scope.validateStep2 = function() {
                if (!$scope.signupData.email || !$scope.signupData.phone) {
                    $rootScope.showDialog('Missing Fields', 'Please provide both your email address and phone number.', 'warning');
                    return false;
                }
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test($scope.signupData.email)) {
                    $rootScope.showDialog('Invalid Email', 'Please enter a valid email address (e.g., user@example.com).', 'error');
                    return false;
                }
                return true;
            };
            
            $scope.validateStep3 = function() {
                // Aadhaar is optional
                return true;
            };
            
            $scope.validateStep4 = function() {
                if (!$scope.signupData.state || !$scope.signupData.city || 
                    !$scope.signupData.ward || !$scope.signupData.locality) {
                    $rootScope.showDialog('Missing Location', 'Please fill in your state, city, ward, and locality to continue.', 'warning');
                    return false;
                }
                return true;
            };
            
            $scope.validateStep5 = function() {
                if (!$scope.signupData.electricityProvider || 
                    !$scope.signupData.waterProvider || 
                    !$scope.signupData.gasProvider) {
                    $rootScope.showDialog('Missing Providers', 'Please select your electricity, water, and gas service providers.', 'warning');
                    return false;
                }
                return true;
            };
            
            $scope.validateStep6 = function() {
                if ($scope.signupData.password !== $scope.signupData.confirmPassword) {
                    $rootScope.showDialog('Password Mismatch', 'The passwords you entered do not match. Please try again.', 'error');
                    return false;
                }
                
                if ($scope.signupData.password.length < 8) {
                    $rootScope.showDialog('Weak Password', 'Your password must be at least 8 characters long for security.', 'warning');
                    return false;
                }
                return true;
            };
            
            // Step navigation with validation
            $scope.continueToStep2 = function() {
                if ($scope.validateStep1()) {
                    $scope.goToStep(2);
                }
            };
            
            $scope.continueToStep3 = function() {
                if ($scope.validateStep2()) {
                    $scope.goToStep(3);
                }
            };
            
            $scope.continueToStep4 = function() {
                if ($scope.validateStep3()) {
                    $scope.goToStep(4);
                }
            };
            
            $scope.continueToStep5 = function() {
                if ($scope.validateStep4()) {
                    $scope.goToStep(5);
                }
            };
            
            $scope.continueToStep6 = function() {
                if ($scope.validateStep5()) {
                    $scope.goToStep(6);
                }
            };
            
            // Aadhaar formatting
            $scope.formatAadhaar = function() {
                let value = $scope.signupData.aadhaar.replace(/\D/g, '');
                
                if (value.length > 0) {
                    value = value.match(/.{1,4}/g).join('-');
                }
                
                $scope.signupData.aadhaar = value.substring(0, 14);
            };
            
            // Form submissions
            $scope.login = function() {
                if (!$scope.loginData.identifier || !$scope.loginData.password) {
                    $rootScope.showDialog('Missing Credentials', 'Please enter your email/phone and password to login.', 'warning');
                    return;
                }
                
                $scope.isLoggingIn = true;
                
                AuthService.login($scope.loginData)
                    .then(function(response) {
                        if (response.success) {
                            localStorage.setItem('suvidhaUser', JSON.stringify(response.user));
                            localStorage.setItem('user_id', response.user_id);
                            $rootScope.loadUserName(); // Update sidebar username
                            
                            $scope.isLoggingIn = false;
                            
                            switch($scope.selectedRole) {
                                case 'senior':
                                    window.location.href = '/SeniorCitizen/app/views/dashboard.html';
                                    break;
                                case 'official':
                                    window.location.href = '/GovOfficials-Admin/app/views/dashboard.html';
                                    break;
                                case 'worker':
                                    window.location.href = '/GovOfficial-Worker/app/views/dashboard.html';
                                    break;
                                default:
                                    $location.path('/dashboard');
                            }
                        } else {
                            $scope.isLoggingIn = false;
                            $rootScope.showDialog('Login Failed', response.message || 'Unable to login. Please check your credentials and try again.', 'error');
                        }
                    })
                    .catch(function(error) {
                        $scope.isLoggingIn = false;
                        var errorMsg = error.data?.message || 'Login failed. Please check your credentials.';
                        $rootScope.showDialog('Login Error', errorMsg, 'error');
                    });
            };
            
            $scope.signup = function() {
                if (!$scope.validateStep6()) {
                    return;
                }
                
                $scope.isCreatingAccount = true;
                
                AuthService.signup($scope.signupData)
                    .then(function(response) {
                        if (response.success) {
                            localStorage.setItem('suvidhaUser', JSON.stringify(response.user));
                            localStorage.setItem('user_id', response.user_id);
                            $rootScope.loadUserName(); // Update sidebar username
                            
                            $scope.isCreatingAccount = false;
                            $location.path('/dashboard');
                        } else {
                            $scope.isCreatingAccount = false;
                            $rootScope.showDialog('Registration Failed', response.message || 'Account creation failed. Please try again.', 'error');
                        }
                    })
                    .catch(function(error) {
                        $scope.isCreatingAccount = false;
                        var errorMsg = error.data?.message || 'Account creation failed. Please try again.';
                        $rootScope.showDialog('Registration Error', errorMsg, 'error');
                    });
            };
            
            $scope.forgotPassword = function() {
                $rootScope.showDialog('Password Reset', 'A password reset link has been sent to your registered email address. Please check your inbox and follow the instructions.', 'info');
            };
        }
    ]);
