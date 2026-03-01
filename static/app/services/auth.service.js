angular.module('suvidhaApp')
    .service('AuthService', ['$http', '$q', function($http, $q) {
        
        var currentUser = null;
        
        /**
         * Login user with credentials
         * @param {Object} credentials - User credentials {identifier, password}
         * @returns {Promise}
         */
        this.login = function(credentials) {
            return $http.post('/api/citizen/login', credentials)
                .then(function(response) {
                    // Store user data
                    currentUser = response.data.user;
                    
                    // Store token and user info in localStorage
                    if (response.data.token) {
                        localStorage.setItem('authToken', response.data.token);
                    }
                    if (response.data.user_id) {
                        localStorage.setItem('user_id', response.data.user_id);
                    }
                    if (response.data.user_type) {
                        localStorage.setItem('user_type', response.data.user_type);
                    }
                    
                    return response.data;
                })
                .catch(function(error) {
                    console.error('Login error:', error);
                    return $q.reject(error);
                });
        };
        
        /**
         * Sign up new user
         * @param {Object} userData - User registration data
         * @returns {Promise}
         */
        this.signup = function(userData) {
            return $http.post('/api/citizen/signup', userData)
                .then(function(response) {
                    // Optionally auto-login after signup
                    currentUser = response.data.user;
                    
                    // Store token and user info in localStorage
                    if (response.data.token) {
                        localStorage.setItem('authToken', response.data.token);
                    }
                    if (response.data.user_id) {
                        localStorage.setItem('user_id', response.data.user_id);
                    }
                    if (response.data.user_type) {
                        localStorage.setItem('user_type', response.data.user_type);
                    }
                    
                    return response.data;
                })
                .catch(function(error) {
                    console.error('Signup error:', error);
                    return $q.reject(error);
                });
        };
        
        /**
         * Logout current user
         * @returns {Promise}
         */
        this.logout = function() {
            return $http.post('/api/citizen/logout')
                .then(function(response) {
                    currentUser = null;
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('suvidhaUser');
                    localStorage.removeItem('user_id');
                    localStorage.removeItem('user_type');
                    return response.data;
                })
                .catch(function(error) {
                    // Even if server logout fails, clear local data
                    currentUser = null;
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('suvidhaUser');
                    localStorage.removeItem('user_id');
                    localStorage.removeItem('user_type');
                    return $q.resolve({ message: 'Logged out' });
                });
        };
        
        /**
         * Check if user is authenticated
         * @returns {Boolean}
         */
        this.isAuthenticated = function() {
            return !!localStorage.getItem('authToken');
        };
        
        /**
         * Get current user data
         * @returns {Object|null}
         */
        this.getCurrentUser = function() {
            return currentUser;
        };
        
        /**
         * Request password reset
         * @param {String} email - User email
         * @returns {Promise}
         */
        this.requestPasswordReset = function(email) {
            return $http.post('/api/auth/forgot-password', { email: email })
                .then(function(response) {
                    return response.data;
                })
                .catch(function(error) {
                    console.error('Password reset error:', error);
                    return $q.reject(error);
                });
        };
        
        /**
         * Reset password with token
         * @param {String} token - Reset token
         * @param {String} newPassword - New password
         * @returns {Promise}
         */
        this.resetPassword = function(token, newPassword) {
            return $http.post('/api/auth/reset-password', {
                token: token,
                password: newPassword
            })
            .then(function(response) {
                return response.data;
            })
            .catch(function(error) {
                console.error('Password reset error:', error);
                return $q.reject(error);
            });
        };
        
        /**
         * Verify email or phone with OTP
         * @param {Object} data - {type: 'email'|'phone', value: string, otp: string}
         * @returns {Promise}
         */
        this.verifyOTP = function(data) {
            return $http.post('/api/auth/verify-otp', data)
                .then(function(response) {
                    return response.data;
                })
                .catch(function(error) {
                    console.error('OTP verification error:', error);
                    return $q.reject(error);
                });
        };
        
        /**
         * Get authentication token
         * @returns {String|null}
         */
        this.getToken = function() {
            return localStorage.getItem('authToken');
        };
    }]);
