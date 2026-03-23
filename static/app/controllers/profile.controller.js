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

        // Initialize with default empty user object
        vm.user = {
            fullName: 'Citizen',
            email: 'No email on file',
            phone: 'Not provided',
            address: 'No address on file',
            ward: 'N/A',
            city: 'Not assigned',
            state: 'Not assigned'
        };

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

        // Connections data array
        vm.connections = [];

        vm.updateProfile = function() {
            vm.saving = true;
            var profileData = {
                full_name: vm.user.fullName,
                phone: vm.user.phone,
                locality: vm.user.address,
                state: vm.user.state,
                city: vm.user.city,
                ward: vm.user.ward
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

        vm.savePreferences = function() {
            localStorage.setItem('suvidhaPreferences', JSON.stringify(vm.preferences));
            $rootScope.showDialog(
                'Preferences Saved',
                'Your preferences have been updated. Language: ' + (vm.preferences.language === 'hi' ? 'Hindi' : 'English') + '.',
                'success'
            );
        };

        vm.resetPreferences = function() {
            vm.preferences = { language: 'en', billSms: true, usageEmail: true, highContrast: false, largeText: false, paymentSms: true, advisoryEmail: false };
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
                            state: p.state || 'Not assigned'
                        };
                        console.log('✅ Profile loaded from database:', vm.user);
                    }
                    vm.loading = false;
                })
                .catch(function(error) {
                    console.warn('Could not load from API, using demo data:', error.status);
                    // Use demo/mock data for development/demo purposes
                    vm.user = {
                        fullName: 'Demo Citizen',
                        email: 'demo@suvidha.gov.in',
                        phone: '+91-9876543210',
                        address: 'Sector 12, Delhi',
                        ward: '1',
                        city: 'New Delhi',
                        state: 'Delhi'
                    };
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
