// Profile Controller
(function() {
    'use strict';

    angular.module('suvidhaApp')
        .controller('ProfileController', ['$scope', 'ApiService', ProfileController]);

    function ProfileController($scope, ApiService) {
        var vm = this;
        var $rootScope = $scope.$root;
        vm.loading = true;
        vm.profileData = {};
        vm.settingsTab = 'profile';

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
                state: storedUser.state || ''
            };
        } else {
            vm.user = { fullName: '', email: '', phone: '', address: '', ward: '', city: '', state: '' };
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
            $rootScope.showDialog(
                'Profile Update',
                'Your profile information has been saved successfully. Changes will reflect across all services.',
                'success'
            );
            // Update localStorage
            if (storedUser) {
                storedUser.full_name = vm.user.fullName;
                storedUser.phone = vm.user.phone;
                storedUser.locality = vm.user.address;
                localStorage.setItem('suvidhaUser', JSON.stringify(storedUser));
            }
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
        }

        function loadProfileData() {
            ApiService.getProfileData()
                .then(function(response) {
                    vm.profileData = response.data;
                    if (response.data.profile) {
                        var p = response.data.profile;
                        vm.user = {
                            fullName: p.full_name || p.name || vm.user.fullName,
                            email: p.email || vm.user.email,
                            phone: p.phone || vm.user.phone,
                            address: p.locality || p.address || vm.user.address,
                            ward: p.ward || vm.user.ward,
                            city: p.city || vm.user.city,
                            state: p.state || vm.user.state
                        };
                    }
                    vm.loading = false;
                })
                .catch(function(error) {
                    console.error('Error loading profile data:', error);
                    vm.loading = false;
                });
        }

        init();
    }
})();
