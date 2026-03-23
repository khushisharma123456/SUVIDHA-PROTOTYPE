// Profile Controller
(function() {
    'use strict';

    angular.module('suvidhaApp')
        .controller('ProfileController', ['$scope', '$timeout', 'ApiService', ProfileController]);

    function ProfileController($scope, $timeout, ApiService) {
        var vm = this;
        var $rootScope = $scope.$root;
        vm.loading = true;
        vm.loadingConnections = true;
        vm.profileData = {};
        vm.settingsTab = 'profile';
        vm.editMode = false;
        vm.saving = false;

        // Load from localStorage immediately
        var storedUser = JSON.parse(localStorage.getItem('suvidhaUser') || 'null');
        if (storedUser) {
            vm.user = {
                fullName: storedUser.full_name || storedUser.name || '',
                email: storedUser.email || '',
                phone: storedUser.phone || '',
                address: storedUser.locality || '',
                ward: storedUser.ward || '',
                city: storedUser.city || '',
                state: storedUser.state || '',
                dateOfBirth: storedUser.date_of_birth || '',
                preferredLanguage: storedUser.preferred_language || 'en',
                userType: storedUser.user_type || 'general',
                accountCreated: storedUser.account_created || '',
                alertsEnabled: storedUser.alerts_enabled !== false,
                isVerified: storedUser.is_verified || false
            };
        } else {
            vm.user = { fullName: '', email: '', phone: '', address: '', ward: '', city: '', state: '', dateOfBirth: '', preferredLanguage: 'en', userType: 'general', accountCreated: '', alertsEnabled: true, isVerified: false };
        }

        // Preferences
        vm.preferences = {
            language: 'en',
            billSms: true,
            usageEmail: true,
            highContrast: false,
            largeText: false
        };

        // Load saved preferences from localStorage
        try {
            var savedPrefs = JSON.parse(localStorage.getItem('suvidhaPreferences') || 'null');
            if (savedPrefs) {
                angular.extend(vm.preferences, savedPrefs);
            }
        } catch (e) { /* ignore */ }

        // Connections data
        vm.connections = [
            { utility: 'Electricity', label: 'Consumer No', number: storedUser ? (storedUser.electricity_id || 'ELEC-2025-001') : 'N/A', status: 'Active', statusClass: 'badge-success' },
            { utility: 'Water', label: 'Connection ID', number: storedUser ? (storedUser.water_id || 'WTR-2025-001') : 'N/A', status: 'Active', statusClass: 'badge-success' },
            { utility: 'Gas', label: 'Connection ID', number: storedUser ? (storedUser.gas_id || 'GAS-2025-001') : 'N/A', status: 'Active', statusClass: 'badge-success' }
        ];

        vm.updateProfile = function() {
            vm.saving = true;
            var profileData = {
                full_name: vm.user.fullName,
                phone: vm.user.phone,
                locality: vm.user.address,
                state: vm.user.state,
                city: vm.user.city,
                ward: vm.user.ward,
                date_of_birth: vm.user.dateOfBirth || null,
                alerts_enabled: vm.user.alertsEnabled
            };
            
            ApiService.updateProfileData(profileData)
                .then(function(response) {
                    vm.saving = false;
                    vm.editMode = false;
                    if (response.data.success) {
                        console.log('✅ Profile updated successfully');
                        $rootScope.showDialog(
                            'Profile Updated',
                            'Your profile information has been updated successfully.',
                            'success'
                        );
                    } else {
                        $rootScope.showDialog(
                            'Update Failed',
                            response.data.message || 'Failed to update profile',
                            'error'
                        );
                    }
                })
                .catch(function(error) {
                    vm.saving = false;
                    console.error('Error updating profile:', error);
                    $rootScope.showDialog(
                        'Error',
                        'An error occurred while updating your profile.',
                        'error'
                    );
                });
        };

        vm.cancelEdit = function() {
            vm.editMode = false;
            // Reload from backend
            loadProfileData();
        };

        vm.onThemeToggle = function() {
            if (vm.preferences.professionalTheme) {
                document.body.classList.add('professional-theme');
                vm.preferences.theme = 'professional';
            } else {
                document.body.classList.remove('professional-theme');
                vm.preferences.theme = 'current';
            }
            localStorage.setItem('suvidhaPreferences', JSON.stringify(vm.preferences));
        };

        // Apply saved theme on controller init
        if (vm.preferences.professionalTheme) {
            document.body.classList.add('professional-theme');
        }

        vm.savePreferences = function() {
            // Apply theme
            if (vm.preferences.professionalTheme) {
                document.body.classList.add('professional-theme');
                vm.preferences.theme = 'professional';
            } else {
                document.body.classList.remove('professional-theme');
                vm.preferences.theme = 'current';
            }
            localStorage.setItem('suvidhaPreferences', JSON.stringify(vm.preferences));
            $rootScope.showDialog(
                'Preferences Saved',
                'Your preferences have been updated. Language: ' + (vm.preferences.language === 'hi' ? 'Hindi' : 'English') + '.',
                'success'
            );
        };

        vm.resetPreferences = function() {
            vm.preferences = { language: 'en', billSms: true, usageEmail: true, highContrast: false, largeText: false, paymentSms: true, advisoryEmail: false, theme: 'current', professionalTheme: false };
            document.body.classList.remove('professional-theme');
            localStorage.removeItem('suvidhaPreferences');
            $rootScope.showDialog('Preferences Reset', 'All preferences have been reset to defaults.', 'info');
        };

        vm.downloadMyData = function() {
            $rootScope.showDialog('Data Download', 'Your data export has been initiated. You will receive a download link via email shortly.', 'info');
        };

        function init() {
            loadProfileData();
            loadConnections();
        }

        function loadProfileData() {
            ApiService.getProfileData()
                .then(function(response) {
                    vm.profileData = response.data;
                    if (response.data && response.data.profile) {
                        var p = response.data.profile;
                        vm.user = {
                            fullName: p.full_name || p.name || 'Not provided',
                            email: p.email || 'No email on file',
                            phone: p.phone || 'Not provided',
                            address: p.locality || p.address || 'No address on file',
                            ward: p.ward || 'N/A',
                            city: p.city || 'Not assigned',
                            state: p.state || 'Not assigned',
                            dateOfBirth: p.date_of_birth || '',
                            preferredLanguage: p.preferred_language || 'en',
                            userType: p.user_type || 'general',
                            accountCreated: p.account_created || '',
                            alertsEnabled: p.alerts_enabled !== false,
                            isVerified: p.is_verified || false,
                            profilePicture: vm.user.profilePicture || null
                        };
                        // Sync to localStorage so other pages stay in sync
                        localStorage.setItem('suvidhaUser', JSON.stringify(p));
                        console.log('✅ Profile loaded from database:', vm.user);
                    }
                    vm.loading = false;
                })
                .catch(function(error) {
                    console.warn('Could not load from API, using localStorage data:', error.status);
                    vm.loading = false;
                });
        }

        function loadConnections() {
            ApiService.getProfileConnections()
                .then(function(response) {
                    if (response.data && response.data.success) {
                        vm.connections = response.data.connections || [];
                        console.log('✅ Connections loaded from database:', vm.connections);
                    }
                    vm.loadingConnections = false;
                })
                .catch(function(error) {
                    console.warn('Could not load connections from API, using demo data:', error.status);
                    // Use demo data for development/demo purposes
                    vm.connections = [
                        {
                            utility: 'Electricity',
                            provider: 'BRPL (BSES Rajdhani)',
                            status: 'Active',
                            statusClass: 'badge-success'
                        },
                        {
                            utility: 'Water',
                            provider: 'Delhi Jal Board',
                            status: 'Active',
                            statusClass: 'badge-success'
                        },
                        {
                            utility: 'Gas',
                            provider: 'IGL (Indraprastha Gas)',
                            status: 'Active',
                            statusClass: 'badge-success'
                        }
                    ];
                    vm.loadingConnections = false;
                });
        }

        // Upload profile picture
        vm.uploadProfilePicture = function() {
            var fileInput = document.getElementById('profilePhotoUpload');
            var file = fileInput.files[0];
            
            if (!file) return;
            
            // Validate file type
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file');
                return;
            }
            
            // Validate file size (max 2MB)
            if (file.size > 2 * 1024 * 1024) {
                alert('Image size must be less than 2MB');
                return;
            }
            
            // Read file and convert to data URL
            var reader = new FileReader();
            reader.onload = function(e) {
                // Store profile picture in localStorage
                vm.user.profilePicture = e.target.result;
                localStorage.setItem('suvidhaProfilePicture', e.target.result);
                $scope.$apply();
                
                // Show success message
                console.log('Profile picture updated successfully');
            };
            reader.readAsDataURL(file);
            
            // Reset file input
            fileInput.value = '';
        };

        // Load profile picture from localStorage on init
        var savedProfilePicture = localStorage.getItem('suvidhaProfilePicture');
        if (savedProfilePicture && vm.user) {
            vm.user.profilePicture = savedProfilePicture;
        }

        init();
    }
})();
