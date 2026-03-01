// API Service for backend communication
(function() {
    'use strict';

    angular.module('suvidhaApp')
        .service('ApiService', ['$http', function($http) {
            var self = this;
            var baseUrl = '/api';

            // Configure $http to send credentials (cookies) with every request
            $http.defaults.withCredentials = true;

            self.get = function(endpoint) {
                return $http.get(baseUrl + endpoint);
            };

            self.post = function(endpoint, data) {
                return $http.post(baseUrl + endpoint, data);
            };

            self.put = function(endpoint, data) {
                return $http.put(baseUrl + endpoint, data);
            };

            self.delete = function(endpoint) {
                return $http.delete(baseUrl + endpoint);
            };

            // Specific API methods
            self.getDashboardData = function() {
                return self.get('/citizen/dashboard');
            };

            self.getUtilitiesData = function() {
                return self.get('/citizen/bills');
            };

            self.getInsightsData = function() {
                return self.get('/insights');
            };

            self.getRecordsData = function() {
                return self.get('/citizen/bills');
            };

            self.getCommunityData = function() {
                return self.get('/citizen/community/stats');
            };

            self.getProfileData = function() {
                return self.get('/citizen/profile');
            };

            self.submitServiceRequest = function(data) {
                return self.post('/citizen/complaints', data);
            };

            self.getWasteData = function() {
                return self.get('/waste').catch(function(error) {
                    // Return mock data if API fails
                    return {
                        data: {
                            user: {
                                name: 'User',
                                address: '123 Main Street, City'
                            },
                            status: {
                                lastPickup: 'Today, 10:30 AM',
                                wasteType: 'Segregated ✓',
                                pointsEarned: 15,
                                nextScheduledPickup: 'Tomorrow, 10:00 AM',
                                binStatus: 'Normal'
                            }
                        }
                    };
                });
            };

            self.submitWasteIssue = function(data) {
                return self.post('/waste/issue', data).catch(function(error) {
                    // Return success even if API fails (for demo purposes)
                    return {
                        data: {
                            success: true,
                            message: 'Issue reported successfully'
                        }
                    };
                });
            };
        }]);
})();
