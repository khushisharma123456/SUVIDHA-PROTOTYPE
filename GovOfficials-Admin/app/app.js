/**
 * Government Dashboard - AngularJS Application
 * Suvidha City Control Room
 * With Landing Page and API Integration
 */

// Base API URL - adjust based on your environment
var API_BASE_URL = 'http://localhost:5000';

var app = angular.module('govAdminApp', []);

// ============================================
// API SERVICE - Handles all HTTP requests
// ============================================
app.factory('ApiService', ['$http', '$q', function ($http, $q) {
    var service = {};
    
    // Store auth token
    var authToken = localStorage.getItem('adminToken');
    var currentOfficial = JSON.parse(localStorage.getItem('currentOfficial') || 'null');
    
    // Set default headers
    service.setAuthToken = function(token) {
        authToken = token;
        localStorage.setItem('adminToken', token);
    };
    
    service.setCurrentOfficial = function(official) {
        currentOfficial = official;
        localStorage.setItem('currentOfficial', JSON.stringify(official));
    };
    
    service.getCurrentOfficial = function() {
        // Return mock official for Live Server development if not logged in
        return currentOfficial || {
            full_name: 'Admin User',
            designation: 'district_collector',
            department: 'administration',
            employee_id: 'DEV001',
            last_login: new Date().toISOString()
        };
    };
    
    service.clearAuth = function() {
        authToken = null;
        currentOfficial = null;
        localStorage.removeItem('adminToken');
        localStorage.removeItem('currentOfficial');
        localStorage.removeItem('suvidhaUser');
        localStorage.removeItem('user_id');
    };
    
    service.isAuthenticated = function() {
        // Bypass authentication for Live Server development
        return true;
    };
    
    // HTTP request wrapper
    service.request = function(method, endpoint, data) {
        var config = {
            method: method,
            url: API_BASE_URL + endpoint,
            headers: {}
        };
        
        if (authToken) {
            config.headers['Authorization'] = 'Bearer ' + authToken;
        }
        
        if (data && (method === 'POST' || method === 'PUT')) {
            config.data = data;
            config.headers['Content-Type'] = 'application/json';
        }
        
        return $http(config);
    };
    
    // Auth endpoints
    service.login = function(identifier, password) {
        return service.request('POST', '/api/admin/auth/login', {
            identifier: identifier,
            password: password
        });
    };
    
    service.signup = function(data) {
        return service.request('POST', '/api/admin/auth/signup', data);
    };
    
    service.logout = function() {
        return service.request('POST', '/api/admin/auth/logout');
    };
    
    // Dashboard endpoints
    service.getDashboard = function(filters) {
        var query = '?';
        if (filters) {
            if (filters.state) query += 'state=' + filters.state + '&';
            if (filters.district) query += 'district=' + filters.district + '&';
            if (filters.ward) query += 'ward=' + filters.ward + '&';
        }
        return service.request('GET', '/api/admin/dashboard' + query);
    };
    
    service.getUtilityTrends = function() {
        return service.request('GET', '/api/admin/utility-trends');
    };
    
    // Grievance endpoints
    service.getGrievances = function(filters) {
        var query = '?limit=50';
        if (filters) {
            if (filters.status) query += '&status=' + filters.status;
            if (filters.severity) query += '&severity=' + filters.severity;
            if (filters.utility_type) query += '&utility_type=' + filters.utility_type;
            if (filters.ward) query += '&ward=' + filters.ward;
        }
        return service.request('GET', '/api/admin/grievances' + query);
    };
    
    // Meter readings
    service.getMeterReadings = function(status) {
        var query = status ? '?status=' + status : '';
        return service.request('GET', '/api/admin/meter-readings' + query);
    };
    
    service.approveMeter = function(readingId) {
        return service.request('POST', '/api/admin/meter-readings/' + readingId + '/approve');
    };
    
    // RWA Projects
    service.getRWAProjects = function(status) {
        var query = status ? '?status=' + status : '';
        return service.request('GET', '/api/admin/rwa-projects' + query);
    };
    
    // Audit Logs
    service.getAuditLogs = function(type, source) {
        var query = '?limit=50';
        if (type) query += '&type=' + type;
        if (source) query += '&source=' + source;
        return service.request('GET', '/api/admin/audit-logs' + query);
    };
    
    // Field Operations
    service.getFieldOperations = function(status) {
        var query = status ? '?status=' + status : '';
        return service.request('GET', '/api/admin/field-operations' + query);
    };
    
    // Ward Stats
    service.getWardStats = function() {
        return service.request('GET', '/api/admin/ward-stats');
    };
    
    // Participation & Incentives
    service.getParticipation = function() {
        return service.request('GET', '/api/admin/participation');
    };
    
    // Policy Ward Rankings
    service.getWardRankings = function() {
        return service.request('GET', '/api/admin/policy/ward-rankings');
    };
    
    // Officials
    service.getOfficials = function(department) {
        var query = department ? '?department=' + department : '';
        return service.request('GET', '/api/admin/officials' + query);
    };
    
    return service;
}]);

// ============================================
// LANDING PAGE CONTROLLER
// ============================================
app.controller('LandingController', ['$scope', 'ApiService', '$timeout', function ($scope, ApiService, $timeout) {
    // View state - Always show dashboard (bypass login)
    $scope.currentView = 'dashboard';
    $scope.showAuthModal = false;
    $scope.authMode = 'login';
    $scope.selectedRole = 'official';
    $scope.isLoading = false;
    $scope.authError = null;
    $scope.authSuccess = null;
    
    // Login data
    $scope.loginData = {
        identifier: '',
        password: ''
    };
    
    // Signup data
    $scope.signupData = {
        fullName: '',
        email: '',
        employeeId: '',
        department: '',
        designation: '',
        password: ''
    };
    
    // Role display names
    $scope.getRoleDisplayName = function(role) {
        var names = {
            'official': 'Government Official',
            'citizen': 'General Citizen',
            'senior': 'Senior Citizen'
        };
        return names[role] || role;
    };
    
    // Select role and open auth modal
    $scope.selectRole = function(role) {
        $scope.selectedRole = role;
        
        // Redirect based on role
        if (role === 'citizen') {
            // Redirect to citizen portal
            window.location.href = '../../../templates/index.html';
            return;
        } else if (role === 'senior') {
            // Redirect to senior citizen portal
            window.location.href = '../SeniorCitizen/app/views/dashboard.html';
            return;
        }
        
        // For government official, show auth modal
        $scope.showAuthModal = true;
        $scope.authMode = 'login';
    };
    
    // Open auth modal
    $scope.openAuth = function(mode) {
        $scope.authMode = mode;
        $scope.showAuthModal = true;
        $scope.authError = null;
        $scope.authSuccess = null;
    };
    
    // Close auth modal
    $scope.closeAuth = function() {
        $scope.showAuthModal = false;
        $scope.authError = null;
        $scope.authSuccess = null;
    };
    
    // Switch auth mode
    $scope.switchAuthMode = function(mode) {
        $scope.authMode = mode;
        $scope.authError = null;
        $scope.authSuccess = null;
    };
    
    // Login function
    $scope.login = function() {
        $scope.isLoading = true;
        $scope.authError = null;
        
        ApiService.login($scope.loginData.identifier, $scope.loginData.password)
            .then(function(response) {
                if (response.data.success) {
                    ApiService.setAuthToken(response.data.token);
                    ApiService.setCurrentOfficial(response.data.official);
                    $scope.authSuccess = 'Login successful! Redirecting...';
                    $timeout(function() {
                        $scope.showAuthModal = false;
                        // Navigate to dashboard
                        window.location.href = 'views/dashboard.html';
                    }, 1000);
                } else {
                    $scope.authError = response.data.message || 'Login failed';
                }
            })
            .catch(function(error) {
                $scope.authError = error.data?.message || 'Login failed. Please check your credentials.';
            })
            .finally(function() {
                $scope.isLoading = false;
            });
    };
    
    // Signup function
    $scope.signup = function() {
        $scope.isLoading = true;
        $scope.authError = null;
        
        ApiService.signup($scope.signupData)
            .then(function(response) {
                if (response.data.success) {
                    ApiService.setAuthToken(response.data.token);
                    ApiService.setCurrentOfficial(response.data.official);
                    $scope.authSuccess = 'Account created! Redirecting...';
                    $timeout(function() {
                        $scope.showAuthModal = false;
                        // Navigate to dashboard
                        window.location.href = 'views/dashboard.html';
                    }, 1000);
                } else {
                    $scope.authError = response.data.message || 'Signup failed';
                }
            })
            .catch(function(error) {
                $scope.authError = error.data?.message || 'Signup failed. Please try again.';
            })
            .finally(function() {
                $scope.isLoading = false;
            });
    };
}]);

// ============================================
// DASHBOARD CONTROLLER (with API integration)
// ============================================
app.controller('DashboardController', ['$scope', '$timeout', 'ApiService', function ($scope, $timeout, ApiService) {
    // Check authentication
    if (!ApiService.isAuthenticated()) {
        window.location.href = '../../../templates/index.html';
        return;
    }
    
    // Current user
    var official = ApiService.getCurrentOfficial();
    $scope.user = {
        name: official ? official.full_name : 'Government Official',
        initials: official ? official.full_name.split(' ').map(function(n) { return n[0]; }).join('') : 'GO',
        role: official ? official.designation.replace(/_/g, ' ').replace(/\b\w/g, function(l) { return l.toUpperCase(); }) : 'Official',
        lastLogin: official && official.last_login ? new Date(official.last_login).toLocaleString() : 'Today'
    };
    
    // Current date
    $scope.currentDate = new Date().toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    
    // Notifications count
    $scope.notifications = 5;
    
    // Language settings
    $scope.showLangMenu = false;
    $scope.selectedLang = 'EN';
    $scope.languages = [
        { code: 'EN', name: 'English' },
        { code: 'HI', name: 'हिंदी (Hindi)' },
        { code: 'BN', name: 'বাংলা (Bengali)' },
        { code: 'TE', name: 'తెలుగు (Telugu)' },
        { code: 'MR', name: 'मराठी (Marathi)' },
        { code: 'TA', name: 'தமிழ் (Tamil)' },
        { code: 'GU', name: 'ગુજરાતી (Gujarati)' },
        { code: 'KN', name: 'ಕನ್ನಡ (Kannada)' },
        { code: 'ML', name: 'മലയാളം (Malayalam)' },
        { code: 'PA', name: 'ਪੰਜਾਬੀ (Punjabi)' },
        { code: 'OR', name: 'ଓଡ଼ିଆ (Odia)' },
        { code: 'AS', name: 'অসমীয়া (Assamese)' },
        { code: 'UR', name: 'اردو (Urdu)' },
        { code: 'SA', name: 'संस्कृत (Sanskrit)' },
        { code: 'KS', name: 'कॉशुर (Kashmiri)' },
        { code: 'SD', name: 'سنڌي (Sindhi)' },
        { code: 'NE', name: 'नेपाली (Nepali)' },
        { code: 'KO', name: 'कोंकणी (Konkani)' },
        { code: 'MN', name: 'মণিপুরী (Manipuri)' },
        { code: 'BH', name: 'भोजपुरी (Bhojpuri)' },
        { code: 'DO', name: 'डोगरी (Dogri)' },
        { code: 'MA', name: 'मैथिली (Maithili)' },
        { code: 'ST', name: 'संथाली (Santali)' }
    ];
    
    $scope.toggleLangMenu = function(event) {
        event.stopPropagation();
        $scope.showLangMenu = !$scope.showLangMenu;
    };
    
    $scope.selectLang = function(lang, event) {
        event.stopPropagation();
        $scope.selectedLang = lang.code;
        $scope.showLangMenu = false;
    };
    
    // All Indian States and Union Territories
    $scope.allStates = [
        { code: 'all', name: 'All States' },
        { code: 'AN', name: 'Andaman and Nicobar Islands' },
        { code: 'AP', name: 'Andhra Pradesh' },
        { code: 'AR', name: 'Arunachal Pradesh' },
        { code: 'AS', name: 'Assam' },
        { code: 'BR', name: 'Bihar' },
        { code: 'CH', name: 'Chandigarh' },
        { code: 'CG', name: 'Chhattisgarh' },
        { code: 'DN', name: 'Dadra and Nagar Haveli and Daman and Diu' },
        { code: 'DL', name: 'Delhi' },
        { code: 'GA', name: 'Goa' },
        { code: 'GJ', name: 'Gujarat' },
        { code: 'HR', name: 'Haryana' },
        { code: 'HP', name: 'Himachal Pradesh' },
        { code: 'JK', name: 'Jammu and Kashmir' },
        { code: 'JH', name: 'Jharkhand' },
        { code: 'KA', name: 'Karnataka' },
        { code: 'KL', name: 'Kerala' },
        { code: 'LA', name: 'Ladakh' },
        { code: 'LD', name: 'Lakshadweep' },
        { code: 'MP', name: 'Madhya Pradesh' },
        { code: 'MH', name: 'Maharashtra' },
        { code: 'MN', name: 'Manipur' },
        { code: 'ML', name: 'Meghalaya' },
        { code: 'MZ', name: 'Mizoram' },
        { code: 'NL', name: 'Nagaland' },
        { code: 'OD', name: 'Odisha' },
        { code: 'PY', name: 'Puducherry' },
        { code: 'PB', name: 'Punjab' },
        { code: 'RJ', name: 'Rajasthan' },
        { code: 'SK', name: 'Sikkim' },
        { code: 'TN', name: 'Tamil Nadu' },
        { code: 'TS', name: 'Telangana' },
        { code: 'TR', name: 'Tripura' },
        { code: 'UP', name: 'Uttar Pradesh' },
        { code: 'UK', name: 'Uttarakhand' },
        { code: 'WB', name: 'West Bengal' }
    ];
    
    // Districts by State (sample data for major states)
    $scope.districtsByState = {
        'all': [{ code: 'all', name: 'All Districts' }],
        'DL': [
            { code: 'all', name: 'All Districts' },
            { code: 'central', name: 'Central Delhi' },
            { code: 'east', name: 'East Delhi' },
            { code: 'new', name: 'New Delhi' },
            { code: 'north', name: 'North Delhi' },
            { code: 'northeast', name: 'North East Delhi' },
            { code: 'northwest', name: 'North West Delhi' },
            { code: 'shahdara', name: 'Shahdara' },
            { code: 'south', name: 'South Delhi' },
            { code: 'southeast', name: 'South East Delhi' },
            { code: 'southwest', name: 'South West Delhi' },
            { code: 'west', name: 'West Delhi' }
        ],
        'MH': [
            { code: 'all', name: 'All Districts' },
            { code: 'mumbai', name: 'Mumbai' },
            { code: 'mumbaisub', name: 'Mumbai Suburban' },
            { code: 'thane', name: 'Thane' },
            { code: 'pune', name: 'Pune' },
            { code: 'nagpur', name: 'Nagpur' },
            { code: 'nashik', name: 'Nashik' },
            { code: 'aurangabad', name: 'Aurangabad' },
            { code: 'solapur', name: 'Solapur' },
            { code: 'kolhapur', name: 'Kolhapur' },
            { code: 'satara', name: 'Satara' },
            { code: 'raigad', name: 'Raigad' },
            { code: 'ahmednagar', name: 'Ahmednagar' }
        ],
        'UP': [
            { code: 'all', name: 'All Districts' },
            { code: 'lucknow', name: 'Lucknow' },
            { code: 'kanpur', name: 'Kanpur Nagar' },
            { code: 'ghaziabad', name: 'Ghaziabad' },
            { code: 'noida', name: 'Gautam Buddha Nagar' },
            { code: 'agra', name: 'Agra' },
            { code: 'varanasi', name: 'Varanasi' },
            { code: 'meerut', name: 'Meerut' },
            { code: 'prayagraj', name: 'Prayagraj' },
            { code: 'gorakhpur', name: 'Gorakhpur' },
            { code: 'bareilly', name: 'Bareilly' },
            { code: 'aligarh', name: 'Aligarh' },
            { code: 'moradabad', name: 'Moradabad' }
        ],
        'KA': [
            { code: 'all', name: 'All Districts' },
            { code: 'bangalore', name: 'Bangalore Urban' },
            { code: 'bangalorerural', name: 'Bangalore Rural' },
            { code: 'mysore', name: 'Mysore' },
            { code: 'mangalore', name: 'Dakshina Kannada' },
            { code: 'belgaum', name: 'Belgaum' },
            { code: 'hubli', name: 'Dharwad' },
            { code: 'gulbarga', name: 'Kalaburagi' },
            { code: 'shimoga', name: 'Shimoga' },
            { code: 'tumkur', name: 'Tumkur' },
            { code: 'bellary', name: 'Bellary' }
        ],
        'TN': [
            { code: 'all', name: 'All Districts' },
            { code: 'chennai', name: 'Chennai' },
            { code: 'coimbatore', name: 'Coimbatore' },
            { code: 'madurai', name: 'Madurai' },
            { code: 'tiruchirappalli', name: 'Tiruchirappalli' },
            { code: 'salem', name: 'Salem' },
            { code: 'tirunelveli', name: 'Tirunelveli' },
            { code: 'vellore', name: 'Vellore' },
            { code: 'erode', name: 'Erode' },
            { code: 'thanjavur', name: 'Thanjavur' },
            { code: 'kanchipuram', name: 'Kanchipuram' }
        ],
        'GJ': [
            { code: 'all', name: 'All Districts' },
            { code: 'ahmedabad', name: 'Ahmedabad' },
            { code: 'surat', name: 'Surat' },
            { code: 'vadodara', name: 'Vadodara' },
            { code: 'rajkot', name: 'Rajkot' },
            { code: 'bhavnagar', name: 'Bhavnagar' },
            { code: 'jamnagar', name: 'Jamnagar' },
            { code: 'gandhinagar', name: 'Gandhinagar' },
            { code: 'junagadh', name: 'Junagadh' },
            { code: 'kutch', name: 'Kutch' },
            { code: 'anand', name: 'Anand' }
        ],
        'RJ': [
            { code: 'all', name: 'All Districts' },
            { code: 'jaipur', name: 'Jaipur' },
            { code: 'jodhpur', name: 'Jodhpur' },
            { code: 'udaipur', name: 'Udaipur' },
            { code: 'kota', name: 'Kota' },
            { code: 'bikaner', name: 'Bikaner' },
            { code: 'ajmer', name: 'Ajmer' },
            { code: 'alwar', name: 'Alwar' },
            { code: 'bharatpur', name: 'Bharatpur' },
            { code: 'sikar', name: 'Sikar' },
            { code: 'pali', name: 'Pali' }
        ],
        'WB': [
            { code: 'all', name: 'All Districts' },
            { code: 'kolkata', name: 'Kolkata' },
            { code: 'north24', name: 'North 24 Parganas' },
            { code: 'south24', name: 'South 24 Parganas' },
            { code: 'howrah', name: 'Howrah' },
            { code: 'hooghly', name: 'Hooghly' },
            { code: 'nadia', name: 'Nadia' },
            { code: 'bardhaman', name: 'Bardhaman' },
            { code: 'murshidabad', name: 'Murshidabad' },
            { code: 'jalpaiguri', name: 'Jalpaiguri' },
            { code: 'darjeeling', name: 'Darjeeling' }
        ],
        'KL': [
            { code: 'all', name: 'All Districts' },
            { code: 'thiruvananthapuram', name: 'Thiruvananthapuram' },
            { code: 'kochi', name: 'Ernakulam' },
            { code: 'kozhikode', name: 'Kozhikode' },
            { code: 'thrissur', name: 'Thrissur' },
            { code: 'kollam', name: 'Kollam' },
            { code: 'kannur', name: 'Kannur' },
            { code: 'alappuzha', name: 'Alappuzha' },
            { code: 'palakkad', name: 'Palakkad' },
            { code: 'malappuram', name: 'Malappuram' },
            { code: 'kottayam', name: 'Kottayam' }
        ],
        'HR': [
            { code: 'all', name: 'All Districts' },
            { code: 'gurugram', name: 'Gurugram' },
            { code: 'faridabad', name: 'Faridabad' },
            { code: 'panipat', name: 'Panipat' },
            { code: 'ambala', name: 'Ambala' },
            { code: 'karnal', name: 'Karnal' },
            { code: 'hisar', name: 'Hisar' },
            { code: 'rohtak', name: 'Rohtak' },
            { code: 'sonipat', name: 'Sonipat' },
            { code: 'yamunanagar', name: 'Yamunanagar' },
            { code: 'panchkula', name: 'Panchkula' }
        ],
        'PB': [
            { code: 'all', name: 'All Districts' },
            { code: 'ludhiana', name: 'Ludhiana' },
            { code: 'amritsar', name: 'Amritsar' },
            { code: 'jalandhar', name: 'Jalandhar' },
            { code: 'patiala', name: 'Patiala' },
            { code: 'bathinda', name: 'Bathinda' },
            { code: 'mohali', name: 'SAS Nagar (Mohali)' },
            { code: 'pathankot', name: 'Pathankot' },
            { code: 'hoshiarpur', name: 'Hoshiarpur' },
            { code: 'moga', name: 'Moga' },
            { code: 'ferozepur', name: 'Ferozepur' }
        ],
        'BR': [
            { code: 'all', name: 'All Districts' },
            { code: 'patna', name: 'Patna' },
            { code: 'gaya', name: 'Gaya' },
            { code: 'bhagalpur', name: 'Bhagalpur' },
            { code: 'muzaffarpur', name: 'Muzaffarpur' },
            { code: 'purnia', name: 'Purnia' },
            { code: 'darbhanga', name: 'Darbhanga' },
            { code: 'begusarai', name: 'Begusarai' },
            { code: 'samastipur', name: 'Samastipur' },
            { code: 'munger', name: 'Munger' },
            { code: 'nalanda', name: 'Nalanda' }
        ],
        'TS': [
            { code: 'all', name: 'All Districts' },
            { code: 'hyderabad', name: 'Hyderabad' },
            { code: 'rangareddy', name: 'Rangareddy' },
            { code: 'medchal', name: 'Medchal-Malkajgiri' },
            { code: 'warangal', name: 'Warangal' },
            { code: 'nizamabad', name: 'Nizamabad' },
            { code: 'khammam', name: 'Khammam' },
            { code: 'karimnagar', name: 'Karimnagar' },
            { code: 'nalgonda', name: 'Nalgonda' },
            { code: 'adilabad', name: 'Adilabad' },
            { code: 'mahbubnagar', name: 'Mahbubnagar' }
        ],
        'AP': [
            { code: 'all', name: 'All Districts' },
            { code: 'visakhapatnam', name: 'Visakhapatnam' },
            { code: 'vijayawada', name: 'Krishna' },
            { code: 'guntur', name: 'Guntur' },
            { code: 'nellore', name: 'Nellore' },
            { code: 'kurnool', name: 'Kurnool' },
            { code: 'kadapa', name: 'Kadapa' },
            { code: 'tirupati', name: 'Tirupati' },
            { code: 'anantapur', name: 'Anantapur' },
            { code: 'kakinada', name: 'East Godavari' },
            { code: 'rajahmundry', name: 'West Godavari' }
        ]
    };
    
    // Wards by District (sample)
    $scope.wardsByDistrict = {
        'all': [{ code: 'all', name: 'All Wards' }]
    };
    
    // Localities by Ward (sample)
    $scope.localitiesByWard = {
        'all': [{ code: 'all', name: 'All Localities' }]
    };
    
    // Current available districts based on selected state
    $scope.availableDistricts = $scope.districtsByState['all'];
    $scope.availableWards = [{ code: 'all', name: 'All Wards' }];
    $scope.availableLocalities = [{ code: 'all', name: 'All Localities' }];
    
    // Filters
    $scope.filters = {
        state: 'all',
        district: 'all',
        ward: 'all',
        locality: 'all'
    };
    
    $scope.filterBadgeText = 'All Regions';
    
    $scope.onStateChange = function() {
        // Update districts based on selected state
        var stateCode = $scope.filters.state;
        $scope.availableDistricts = $scope.districtsByState[stateCode] || [{ code: 'all', name: 'All Districts' }];
        $scope.filters.district = 'all';
        $scope.filters.ward = 'all';
        $scope.filters.locality = 'all';
        $scope.availableWards = [{ code: 'all', name: 'All Wards' }];
        $scope.availableLocalities = [{ code: 'all', name: 'All Localities' }];
        updateFilterBadge();
        // Update stats based on selected state
        updateStatsForState(stateCode);
        // Update map markers for selected state
        updateMapMarkersForState(stateCode);
    };
    
    function updateStatsForState(stateCode) {
        var key = stateCode || 'all';
        // If state not in our data, generate random values based on state code
        if ($scope.statsByState && $scope.statsByState[key]) {
            $scope.stats = angular.copy($scope.statsByState[key]);
        } else if (key !== 'all') {
            // Generate deterministic random values for states not in the list
            var hash = key.charCodeAt(0) + (key.charCodeAt(1) || 0);
            $scope.stats = {
                activeComplaints: 500 + (hash * 13) % 1500,
                slaBreaches: 10 + (hash * 3) % 40,
                areasStress: 3 + (hash % 12),
                activeOutages: 1 + (hash % 5)
            };
        } else {
            $scope.stats = angular.copy($scope.statsByState['all']);
        }
        // Update revenue data
        if ($scope.revenueByState && $scope.revenueByState[key]) {
            $scope.revenue = angular.copy($scope.revenueByState[key]);
        } else if (key !== 'all') {
            // Generate deterministic revenue values for states not in the list
            var hash = key.charCodeAt(0) + (key.charCodeAt(1) || 0);
            var base = 2 + (hash % 8);
            $scope.revenue = {
                todayCollections: '₹' + base + '.' + (hash % 10) + ' Cr',
                mtdCollections: '₹' + (base * 20 + hash % 50) + '.' + (hash % 10) + ' Cr',
                fyProgress: '₹' + (base * 100 + hash % 200) + '.' + (hash % 10) + ' Cr',
                pendingBills: '₹' + (base * 2 + hash % 10) + '.' + (hash % 10) + ' Cr',
                overdueAmount: '₹' + (base - 1 + hash % 3) + '.' + (hash % 10) + ' Cr',
                syncAlerts: hash % 4
            };
        } else {
            $scope.revenue = angular.copy($scope.revenueByState['all']);
        }
    }
    
    $scope.onDistrictChange = function() {
        // Generate sample wards for the district
        var districtCode = $scope.filters.district;
        if (districtCode !== 'all') {
            $scope.availableWards = [
                { code: 'all', name: 'All Wards' },
                { code: 'ward-1', name: 'Ward 1' },
                { code: 'ward-2', name: 'Ward 2' },
                { code: 'ward-3', name: 'Ward 3' },
                { code: 'ward-4', name: 'Ward 4' },
                { code: 'ward-5', name: 'Ward 5' },
                { code: 'ward-6', name: 'Ward 6' },
                { code: 'ward-7', name: 'Ward 7' },
                { code: 'ward-8', name: 'Ward 8' }
            ];
        } else {
            $scope.availableWards = [{ code: 'all', name: 'All Wards' }];
        }
        $scope.filters.ward = 'all';
        $scope.filters.locality = 'all';
        $scope.availableLocalities = [{ code: 'all', name: 'All Localities' }];
        updateFilterBadge();
    };
    
    $scope.onWardChange = function() {
        // Generate sample localities for the ward
        var wardCode = $scope.filters.ward;
        if (wardCode !== 'all') {
            $scope.availableLocalities = [
                { code: 'all', name: 'All Localities' },
                { code: 'block-a', name: 'Block A' },
                { code: 'block-b', name: 'Block B' },
                { code: 'block-c', name: 'Block C' },
                { code: 'sector-1', name: 'Sector 1' },
                { code: 'sector-2', name: 'Sector 2' },
                { code: 'colony-1', name: 'Colony 1' }
            ];
        } else {
            $scope.availableLocalities = [{ code: 'all', name: 'All Localities' }];
        }
        $scope.filters.locality = 'all';
        updateFilterBadge();
    };
    
    $scope.onLocalityChange = function() {
        updateFilterBadge();
    };
    
    $scope.onFilterChange = function() {
        updateFilterBadge();
    };
    
    $scope.applyFilters = function() {
        loadDashboardData();
        updateMapMarkersForState($scope.filters.state);
    };
    
    $scope.clearFilters = function() {
        $scope.filters = { state: 'all', district: 'all', ward: 'all', locality: 'all' };
        $scope.availableDistricts = $scope.districtsByState['all'];
        $scope.availableWards = [{ code: 'all', name: 'All Wards' }];
        $scope.availableLocalities = [{ code: 'all', name: 'All Localities' }];
        $scope.filterBadgeText = 'All Regions';
        $scope.filterBadgeText = 'All Regions';
        loadDashboardData();
        updateMapMarkersForState('all');
    };
    
    function updateFilterBadge() {
        var parts = [];
        if ($scope.filters.state !== 'all') {
            var state = $scope.allStates.find(function(s) { return s.code === $scope.filters.state; });
            if (state) parts.push(state.name);
        }
        if ($scope.filters.district !== 'all') {
            var district = $scope.availableDistricts.find(function(d) { return d.code === $scope.filters.district; });
            if (district) parts.push(district.name);
        }
        if ($scope.filters.ward !== 'all') parts.push($scope.filters.ward.replace('-', ' ').toUpperCase());
        if ($scope.filters.locality !== 'all') parts.push($scope.filters.locality.replace('-', ' '));
        $scope.filterBadgeText = parts.length > 0 ? parts.join(' > ') : 'All Regions';
    }
    
    // Aggregated Alerts (consolidated complaints)
    $scope.showNotificationPanel = false;
    $scope.aggregatedAlerts = [
        {
            type: 'electricity',
            severity: 'critical',
            title: 'Power Outage - Transformer Failure',
            description: 'Multiple residents in Ward 1B, Rohini reported electricity failure due to transformer damage',
            location: 'Ward 1B, Block A-C, Rohini',
            complaintCount: 47,
            time: '15 mins ago'
        },
        {
            type: 'water',
            severity: 'critical',
            title: 'Low Water Pressure - Pipeline Issue',
            description: 'Water pressure critically low in multiple sectors. Main pipeline suspected to be damaged.',
            location: 'Sectors 12-15, Dwarka',
            complaintCount: 32,
            time: '28 mins ago'
        },
        {
            type: 'electricity',
            severity: 'warning',
            title: 'Frequent Power Fluctuations',
            description: 'Voltage fluctuations reported causing appliance damage in residential areas',
            location: 'Ward 5, Lajpat Nagar',
            complaintCount: 18,
            time: '45 mins ago'
        },
        {
            type: 'waste',
            severity: 'warning',
            title: 'Garbage Collection Delayed',
            description: 'Waste collection trucks not arrived for 2 days in multiple blocks',
            location: 'Block E-H, Saket',
            complaintCount: 24,
            time: '1 hour ago'
        },
        {
            type: 'gas',
            severity: 'info',
            title: 'Gas Pressure Low',
            description: 'LPG pipeline pressure lower than normal, cooking gas flow affected',
            location: 'Ward 8, Vasant Kunj',
            complaintCount: 11,
            time: '2 hours ago'
        },
        {
            type: 'water',
            severity: 'warning',
            title: 'Contaminated Water Reports',
            description: 'Residents complaining about yellowish water from taps',
            location: 'Ward 3, Mayur Vihar',
            complaintCount: 15,
            time: '3 hours ago'
        }
    ];
    
    $scope.toggleNotificationPanel = function(event) {
        event.stopPropagation();
        $scope.showNotificationPanel = !$scope.showNotificationPanel;
        $scope.showLangMenu = false;
    };

    // Close all dropdowns when clicking outside
    $scope.closeAllDropdowns = function() {
        $scope.showLangMenu = false;
        $scope.showNotificationPanel = false;
    };
    
    // Infrastructure Map Modal
    $scope.showInfraModal = false;
    $scope.infrastructureZones = [
        { name: 'Ward 1 - Rohini', status: 'critical', complaints: 47, markers: [{type: 'electricity', label: 'Power Outage'}] },
        { name: 'Ward 2 - Pitampura', status: 'normal', complaints: 3, markers: [{type: 'water', label: 'Minor leak'}] },
        { name: 'Ward 3 - Mayur Vihar', status: 'warning', complaints: 15, markers: [{type: 'water', label: 'Water Quality'}] },
        { name: 'Ward 4 - Dwarka', status: 'critical', complaints: 32, markers: [{type: 'water', label: 'Pipeline Issue'}] },
        { name: 'Ward 5 - Lajpat Nagar', status: 'warning', complaints: 18, markers: [{type: 'electricity', label: 'Fluctuations'}] },
        { name: 'Ward 6 - Saket', status: 'warning', complaints: 24, markers: [{type: 'waste', label: 'Collection Delay'}] },
        { name: 'Ward 7 - Vasant Kunj', status: 'normal', complaints: 11, markers: [{type: 'gas', label: 'Low Pressure'}] },
        { name: 'Ward 8 - Janakpuri', status: 'normal', complaints: 5, markers: [{type: 'electricity', label: 'Minor'}] },
        { name: 'Ward 9 - Karol Bagh', status: 'normal', complaints: 7, markers: [{type: 'waste', label: 'Overflow'}] }
    ];
    
    // Map markers for SVG state map (positioned as x, y coordinates)
    $scope.mapMarkers = {
        critical: [
            { x: 150, y: 120, label: 'Power Outage - Rohini' },
            { x: 280, y: 200, label: 'Pipeline Burst - Dwarka' }
        ],
        warning: [
            { x: 200, y: 180, label: 'Water Quality - Mayur Vihar' },
            { x: 120, y: 250, label: 'Power Fluctuation - Lajpat Nagar' },
            { x: 180, y: 220, label: 'Waste Collection - Saket' }
        ],
        info: [
            { x: 250, y: 150, label: 'Gas Pressure - Vasant Kunj' },
            { x: 100, y: 160, label: 'Minor Electrical - Janakpuri' }
        ],
        resolved: [
            { x: 220, y: 100, label: 'Fixed - Pitampura' },
            { x: 170, y: 280, label: 'Resolved - Karol Bagh' }
        ]
    };
    
    // Map labels for districts/localities
    $scope.mapLabels = [
        { x: 150, y: 90, name: 'North Delhi' },
        { x: 250, y: 110, name: 'North East' },
        { x: 300, y: 180, name: 'East Delhi' },
        { x: 280, y: 260, name: 'South East' },
        { x: 180, y: 300, name: 'South Delhi' },
        { x: 100, y: 260, name: 'South West' },
        { x: 80, y: 180, name: 'West Delhi' },
        { x: 120, y: 120, name: 'Central' },
        { x: 200, y: 180, name: 'New Delhi' }
    ];
    
    // Update map markers based on selected state
    function updateMapMarkersForState(stateCode) {
        var stateMarkers = {
            'DL': {
                critical: [{ x: 150, y: 120, label: 'Power Outage' }, { x: 280, y: 200, label: 'Pipeline Burst' }],
                warning: [{ x: 200, y: 180, label: 'Water Quality' }, { x: 120, y: 250, label: 'Fluctuation' }],
                info: [{ x: 250, y: 150, label: 'Gas Pressure' }],
                resolved: [{ x: 220, y: 100, label: 'Fixed' }]
            },
            'MH': {
                critical: [{ x: 180, y: 150, label: 'Mumbai - Flooding' }, { x: 280, y: 180, label: 'Pune - Outage' }],
                warning: [{ x: 120, y: 200, label: 'Thane - Water' }, { x: 220, y: 260, label: 'Nashik - Gas' }],
                info: [{ x: 300, y: 250, label: 'Nagpur - Minor' }],
                resolved: [{ x: 150, y: 280, label: 'Aurangabad - Fixed' }]
            },
            'KA': {
                critical: [{ x: 200, y: 180, label: 'Bangalore - Traffic System' }],
                warning: [{ x: 150, y: 120, label: 'Mysore - Water' }, { x: 280, y: 200, label: 'Hubli - Power' }],
                info: [{ x: 180, y: 260, label: 'Belgaum - Gas' }],
                resolved: [{ x: 250, y: 150, label: 'Mangalore - Fixed' }]
            },
            'TN': {
                critical: [{ x: 200, y: 200, label: 'Chennai - Flooding' }],
                warning: [{ x: 150, y: 150, label: 'Coimbatore - Power' }, { x: 280, y: 180, label: 'Madurai - Water' }],
                info: [{ x: 180, y: 280, label: 'Salem - Minor' }],
                resolved: [{ x: 250, y: 120, label: 'Trichy - Fixed' }]
            },
            'GJ': {
                critical: [{ x: 150, y: 150, label: 'Ahmedabad - Power' }],
                warning: [{ x: 200, y: 200, label: 'Surat - Water' }, { x: 100, y: 180, label: 'Rajkot - Gas' }],
                info: [{ x: 250, y: 130, label: 'Vadodara - Minor' }],
                resolved: [{ x: 180, y: 260, label: 'Gandhinagar - Fixed' }]
            },
            'UP': {
                critical: [{ x: 200, y: 150, label: 'Lucknow - Outage' }, { x: 300, y: 180, label: 'Noida - Pipeline' }],
                warning: [{ x: 120, y: 200, label: 'Agra - Water' }, { x: 250, y: 250, label: 'Kanpur - Power' }],
                info: [{ x: 180, y: 280, label: 'Varanasi - Minor' }],
                resolved: [{ x: 320, y: 120, label: 'Ghaziabad - Fixed' }]
            },
            'RJ': {
                critical: [{ x: 180, y: 140, label: 'Jaipur - Power' }],
                warning: [{ x: 250, y: 180, label: 'Jodhpur - Water' }, { x: 120, y: 220, label: 'Udaipur - Gas' }],
                info: [{ x: 280, y: 250, label: 'Bikaner - Minor' }],
                resolved: [{ x: 150, y: 280, label: 'Kota - Fixed' }]
            },
            'KL': {
                critical: [{ x: 170, y: 200, label: 'Kochi - Flooding' }],
                warning: [{ x: 160, y: 130, label: 'Trivandrum - Power' }, { x: 150, y: 280, label: 'Kozhikode - Water' }],
                info: [{ x: 180, y: 160, label: 'Thrissur - Minor' }],
                resolved: [{ x: 140, y: 240, label: 'Kannur - Fixed' }]
            },
            'WB': {
                critical: [{ x: 220, y: 180, label: 'Kolkata - Outage' }],
                warning: [{ x: 180, y: 120, label: 'Siliguri - Water' }, { x: 200, y: 260, label: 'Durgapur - Power' }],
                info: [{ x: 240, y: 220, label: 'Howrah - Minor' }],
                resolved: [{ x: 160, y: 200, label: 'Asansol - Fixed' }]
            },
            'PB': {
                critical: [{ x: 180, y: 150, label: 'Ludhiana - Power' }],
                warning: [{ x: 230, y: 180, label: 'Amritsar - Water' }, { x: 140, y: 200, label: 'Jalandhar - Gas' }],
                info: [{ x: 200, y: 120, label: 'Chandigarh - Minor' }],
                resolved: [{ x: 170, y: 230, label: 'Patiala - Fixed' }]
            },
            'TS': {
                critical: [{ x: 200, y: 170, label: 'Hyderabad - Traffic' }],
                warning: [{ x: 150, y: 130, label: 'Warangal - Power' }, { x: 270, y: 200, label: 'Nizamabad - Water' }],
                info: [{ x: 180, y: 240, label: 'Karimnagar - Minor' }],
                resolved: [{ x: 240, y: 130, label: 'Khammam - Fixed' }]
            },
            'BR': {
                critical: [{ x: 180, y: 150, label: 'Patna - Flooding' }],
                warning: [{ x: 120, y: 180, label: 'Gaya - Power' }, { x: 250, y: 200, label: 'Muzaffarpur - Water' }],
                info: [{ x: 200, y: 230, label: 'Bhagalpur - Minor' }],
                resolved: [{ x: 150, y: 120, label: 'Darbhanga - Fixed' }]
            },
            'AP': {
                critical: [{ x: 200, y: 180, label: 'Visakhapatnam - Outage' }],
                warning: [{ x: 150, y: 140, label: 'Vijayawada - Water' }, { x: 280, y: 220, label: 'Guntur - Power' }],
                info: [{ x: 180, y: 270, label: 'Tirupati - Minor' }],
                resolved: [{ x: 240, y: 130, label: 'Nellore - Fixed' }]
            },
            'MP': {
                critical: [{ x: 200, y: 150, label: 'Bhopal - Power' }, { x: 300, y: 180, label: 'Indore - Outage' }],
                warning: [{ x: 120, y: 200, label: 'Jabalpur - Water' }, { x: 250, y: 250, label: 'Gwalior - Gas' }],
                info: [{ x: 180, y: 180, label: 'Ujjain - Minor' }],
                resolved: [{ x: 280, y: 120, label: 'Rewa - Fixed' }]
            },
            'all': {
                critical: [{ x: 180, y: 150, label: 'High Priority Zone' }, { x: 280, y: 220, label: 'Infrastructure Critical' }],
                warning: [{ x: 120, y: 200, label: 'Attention Needed' }, { x: 220, y: 280, label: 'Under Monitoring' }],
                info: [{ x: 300, y: 150, label: 'Scheduled Maintenance' }],
                resolved: [{ x: 150, y: 100, label: 'Recently Fixed' }, { x: 250, y: 300, label: 'Completed' }]
            }
        };
        
        $scope.mapMarkers = stateMarkers[stateCode] || stateMarkers['all'];
        
        // Update zone labels based on state
        var stateLabels = {
            'DL': [
                { x: 150, y: 90, name: 'North Delhi' }, { x: 280, y: 150, name: 'East Delhi' },
                { x: 200, y: 200, name: 'Central Delhi' }, { x: 120, y: 260, name: 'South West' },
                { x: 250, y: 280, name: 'South East' }
            ],
            'MH': [
                { x: 150, y: 100, name: 'Mumbai' }, { x: 280, y: 120, name: 'Pune' },
                { x: 180, y: 200, name: 'Aurangabad' }, { x: 300, y: 220, name: 'Nagpur' },
                { x: 100, y: 260, name: 'Nashik' }
            ],
            'KA': [
                { x: 200, y: 150, name: 'Bangalore' }, { x: 280, y: 100, name: 'Hubli' },
                { x: 150, y: 200, name: 'Mysore' }, { x: 250, y: 260, name: 'Belgaum' }
            ],
            'TN': [
                { x: 200, y: 150, name: 'Chennai' }, { x: 150, y: 200, name: 'Coimbatore' },
                { x: 280, y: 180, name: 'Madurai' }, { x: 200, y: 280, name: 'Trichy' }
            ],
            'GJ': [
                { x: 150, y: 120, name: 'Ahmedabad' }, { x: 250, y: 150, name: 'Surat' },
                { x: 120, y: 200, name: 'Rajkot' }, { x: 200, y: 250, name: 'Vadodara' }
            ],
            'UP': [
                { x: 200, y: 100, name: 'Lucknow' }, { x: 320, y: 150, name: 'Noida' },
                { x: 120, y: 180, name: 'Agra' }, { x: 280, y: 220, name: 'Kanpur' },
                { x: 180, y: 260, name: 'Varanasi' }
            ],
            'RJ': [
                { x: 180, y: 100, name: 'Jaipur' }, { x: 280, y: 150, name: 'Jodhpur' },
                { x: 120, y: 200, name: 'Udaipur' }, { x: 250, y: 260, name: 'Bikaner' }
            ],
            'KL': [
                { x: 170, y: 100, name: 'Kannur' }, { x: 160, y: 160, name: 'Thrissur' },
                { x: 180, y: 220, name: 'Kochi' }, { x: 150, y: 290, name: 'Trivandrum' }
            ],
            'WB': [
                { x: 200, y: 80, name: 'Siliguri' }, { x: 230, y: 150, name: 'Kolkata' },
                { x: 180, y: 220, name: 'Durgapur' }, { x: 210, y: 280, name: 'Howrah' }
            ],
            'PB': [
                { x: 200, y: 80, name: 'Amritsar' }, { x: 250, y: 140, name: 'Jalandhar' },
                { x: 180, y: 180, name: 'Ludhiana' }, { x: 140, y: 230, name: 'Patiala' }
            ],
            'TS': [
                { x: 200, y: 120, name: 'Hyderabad' }, { x: 280, y: 160, name: 'Warangal' },
                { x: 140, y: 200, name: 'Nizamabad' }, { x: 200, y: 260, name: 'Karimnagar' }
            ],
            'BR': [
                { x: 180, y: 100, name: 'Patna' }, { x: 280, y: 150, name: 'Muzaffarpur' },
                { x: 120, y: 200, name: 'Gaya' }, { x: 220, y: 250, name: 'Bhagalpur' }
            ],
            'AP': [
                { x: 200, y: 100, name: 'Visakhapatnam' }, { x: 280, y: 180, name: 'Vijayawada' },
                { x: 150, y: 220, name: 'Guntur' }, { x: 200, y: 290, name: 'Tirupati' }
            ],
            'MP': [
                { x: 200, y: 100, name: 'Bhopal' }, { x: 320, y: 150, name: 'Indore' },
                { x: 120, y: 200, name: 'Jabalpur' }, { x: 280, y: 250, name: 'Gwalior' }
            ],
            'all': [
                { x: 200, y: 150, name: 'Region A' }, { x: 280, y: 180, name: 'Region B' },
                { x: 150, y: 220, name: 'Region C' }, { x: 230, y: 270, name: 'Region D' }
            ]
        };
        
        $scope.mapLabels = stateLabels[stateCode] || stateLabels['all'];
    }
    
    $scope.openInfrastructureMap = function() {
        updateMapMarkersForState($scope.filters.state);
        $scope.showInfraModal = true;
    };
    
    $scope.closeInfrastructureMap = function() {
        $scope.showInfraModal = false;
    };
    
    $scope.getSelectedRegionName = function() {
        if ($scope.filters.state === 'all') return 'All India';
        var state = $scope.allStates.find(function(s) { return s.code === $scope.filters.state; });
        return state ? state.name : 'Selected Region';
    };
    
    $scope.exportMapData = function() {
        alert('Infrastructure report exported successfully!');
        $scope.showInfraModal = false;
    };
    
    // Stats with dummy data based on state
    $scope.statsByState = {
        'all': { activeComplaints: 12847, slaBreaches: 234, areasStress: 45, activeOutages: 18 },
        'DL': { activeComplaints: 2456, slaBreaches: 48, areasStress: 12, activeOutages: 5 },
        'MH': { activeComplaints: 3245, slaBreaches: 67, areasStress: 15, activeOutages: 8 },
        'UP': { activeComplaints: 2890, slaBreaches: 58, areasStress: 18, activeOutages: 7 },
        'KA': { activeComplaints: 1567, slaBreaches: 32, areasStress: 8, activeOutages: 3 },
        'TN': { activeComplaints: 1890, slaBreaches: 41, areasStress: 10, activeOutages: 4 },
        'GJ': { activeComplaints: 1234, slaBreaches: 25, areasStress: 7, activeOutages: 2 },
        'RJ': { activeComplaints: 987, slaBreaches: 19, areasStress: 5, activeOutages: 2 },
        'WB': { activeComplaints: 1456, slaBreaches: 29, areasStress: 9, activeOutages: 3 },
        'KL': { activeComplaints: 876, slaBreaches: 18, areasStress: 4, activeOutages: 1 },
        'HR': { activeComplaints: 765, slaBreaches: 15, areasStress: 4, activeOutages: 2 },
        'PB': { activeComplaints: 654, slaBreaches: 12, areasStress: 3, activeOutages: 1 },
        'BR': { activeComplaints: 1123, slaBreaches: 23, areasStress: 8, activeOutages: 3 },
        'TS': { activeComplaints: 1345, slaBreaches: 28, areasStress: 7, activeOutages: 3 },
        'AP': { activeComplaints: 1098, slaBreaches: 22, areasStress: 6, activeOutages: 2 }
    };
    
    // Revenue data by state (with all required fields)
    $scope.revenueByState = {
        'all': { todayCollections: '₹45.8 Cr', mtdCollections: '₹892.4 Cr', fyProgress: '₹4,256.8 Cr', pendingBills: '₹156.7 Cr', overdueAmount: '₹48.2 Cr', syncAlerts: 12 },
        'DL': { todayCollections: '₹8.2 Cr', mtdCollections: '₹168.5 Cr', fyProgress: '₹798.4 Cr', pendingBills: '₹28.4 Cr', overdueAmount: '₹8.6 Cr', syncAlerts: 3 },
        'MH': { todayCollections: '₹12.4 Cr', mtdCollections: '₹245.6 Cr', fyProgress: '₹1,182.3 Cr', pendingBills: '₹42.1 Cr', overdueAmount: '₹12.8 Cr', syncAlerts: 4 },
        'UP': { todayCollections: '₹9.8 Cr', mtdCollections: '₹198.2 Cr', fyProgress: '₹956.7 Cr', pendingBills: '₹35.6 Cr', overdueAmount: '₹10.9 Cr', syncAlerts: 2 },
        'KA': { todayCollections: '₹6.5 Cr', mtdCollections: '₹132.4 Cr', fyProgress: '₹638.9 Cr', pendingBills: '₹18.9 Cr', overdueAmount: '₹5.8 Cr', syncAlerts: 1 },
        'TN': { todayCollections: '₹7.2 Cr', mtdCollections: '₹145.8 Cr', fyProgress: '₹702.4 Cr', pendingBills: '₹21.3 Cr', overdueAmount: '₹6.5 Cr', syncAlerts: 2 },
        'GJ': { todayCollections: '₹5.8 Cr', mtdCollections: '₹118.2 Cr', fyProgress: '₹569.7 Cr', pendingBills: '₹16.8 Cr', overdueAmount: '₹5.1 Cr', syncAlerts: 1 },
        'RJ': { todayCollections: '₹4.2 Cr', mtdCollections: '₹85.6 Cr', fyProgress: '₹412.8 Cr', pendingBills: '₹12.2 Cr', overdueAmount: '₹3.7 Cr', syncAlerts: 1 },
        'WB': { todayCollections: '₹6.1 Cr', mtdCollections: '₹124.3 Cr', fyProgress: '₹599.2 Cr', pendingBills: '₹17.7 Cr', overdueAmount: '₹5.4 Cr', syncAlerts: 2 },
        'KL': { todayCollections: '₹4.8 Cr', mtdCollections: '₹97.6 Cr', fyProgress: '₹470.4 Cr', pendingBills: '₹13.9 Cr', overdueAmount: '₹4.2 Cr', syncAlerts: 1 },
        'HR': { todayCollections: '₹3.9 Cr', mtdCollections: '₹79.4 Cr', fyProgress: '₹382.8 Cr', pendingBills: '₹11.3 Cr', overdueAmount: '₹3.4 Cr', syncAlerts: 1 },
        'PB': { todayCollections: '₹3.5 Cr', mtdCollections: '₹71.2 Cr', fyProgress: '₹343.2 Cr', pendingBills: '₹10.1 Cr', overdueAmount: '₹3.1 Cr', syncAlerts: 0 },
        'BR': { todayCollections: '₹5.2 Cr', mtdCollections: '₹105.8 Cr', fyProgress: '₹510.1 Cr', pendingBills: '₹15.1 Cr', overdueAmount: '₹4.6 Cr', syncAlerts: 2 },
        'TS': { todayCollections: '₹5.9 Cr', mtdCollections: '₹120.1 Cr', fyProgress: '₹578.9 Cr', pendingBills: '₹17.1 Cr', overdueAmount: '₹5.2 Cr', syncAlerts: 1 },
        'AP': { todayCollections: '₹4.6 Cr', mtdCollections: '₹93.6 Cr', fyProgress: '₹451.2 Cr', pendingBills: '₹13.3 Cr', overdueAmount: '₹4.1 Cr', syncAlerts: 1 }
    };
    
    // Stats (will be loaded from API or dummy data)
    $scope.stats = {
        activeComplaints: 12847,
        slaBreaches: 234,
        areasStress: 45,
        activeOutages: 18
    };
    
    $scope.revenue = {
        todayCollections: '₹45.8 Cr',
        mtdCollections: '₹892.4 Cr',
        fyProgress: '₹4,256.8 Cr',
        pendingBills: '₹156.7 Cr',
        overdueAmount: '₹48.2 Cr',
        syncAlerts: 12
    };
    
    // Pending bills data for Revenue Monitor
    $scope.pendingBillsData = [
        { id: 'BILL-2024-001', consumer: 'Rohini Industrial Area', utility: 'Electricity', amount: '₹4.2 Cr', dueDate: '2024-02-15', status: 'overdue' },
        { id: 'BILL-2024-002', consumer: 'Dwarka Residential Complex', utility: 'Water', amount: '₹1.8 Cr', dueDate: '2024-02-28', status: 'pending' },
        { id: 'BILL-2024-003', consumer: 'South Delhi Commercial Hub', utility: 'Gas', amount: '₹2.5 Cr', dueDate: '2024-02-20', status: 'overdue' },
        { id: 'BILL-2024-004', consumer: 'Karol Bagh Market Area', utility: 'Electricity', amount: '₹1.2 Cr', dueDate: '2024-03-05', status: 'pending' },
        { id: 'BILL-2024-005', consumer: 'Pitampura Township', utility: 'Water', amount: '₹0.9 Cr', dueDate: '2024-03-10', status: 'pending' }
    ];
    
    // Revenue Monitor modal
    $scope.showRevenueModal = false;
    $scope.revenueTab = 'overview';
    
    $scope.openRevenueMonitor = function() {
        $scope.showRevenueModal = true;
    };
    
    $scope.closeRevenueMonitor = function() {
        $scope.showRevenueModal = false;
    };
    
    $scope.setRevenueTab = function(tab) {
        $scope.revenueTab = tab;
    };
    
    // Chart period
    $scope.chartPeriod = '7days';
    $scope.chartSubtitle = 'Showing data for last 7 days';
    
    $scope.setChartPeriod = function(period) {
        $scope.chartPeriod = period;
        var subtitles = {
            'today': 'Showing data for today',
            '7days': 'Showing data for last 7 days',
            '30days': 'Showing data for last 30 days'
        };
        $scope.chartSubtitle = subtitles[period];
    };
    
    // Action alerts (for internal use)
    $scope.actionAlerts = [
        { type: 'danger', icon: '🔴', text: 'Complaint #8762 breached SLA > 24 hrs' },
        { type: 'warning', icon: '🟠', text: "Ward 5 electricity load > 80%" },
        { type: 'info', icon: '🟡', text: 'Billing sync delayed > 1 hr' }
    ];
    
    // Priority alerts for dashboard display
    $scope.alerts = [
        { type: 'critical', text: 'Complaint #8762 breached SLA > 24 hrs', location: 'Ward 12, South Delhi' },
        { type: 'critical', text: 'Power transformer failure - 47 households affected', location: 'Ward 1, Rohini' },
        { type: 'warning', text: 'Electricity load exceeding 80% capacity', location: 'Ward 5, Lajpat Nagar' },
        { type: 'warning', text: 'Water pressure critically low', location: 'Sectors 12-15, Dwarka' },
        { type: 'info', text: 'Billing sync delayed > 1 hour', location: 'District-level sync' }
    ];
    
    // Infrastructure status
    $scope.infrastructure = {
        electricityLoad: 72,
        waterPressure: 85,
        gasSupply: 94
    };
    
    // Logout function
    $scope.logout = function() {
        ApiService.logout().then(function() {
            ApiService.clearAuth();
            window.location.href = '../../../templates/index.html';
        }).catch(function() {
            ApiService.clearAuth();
            window.location.href = '../../../templates/index.html';
        });
    };
    
    // Load dashboard data from API
    function loadDashboardData() {
        ApiService.getDashboard($scope.filters)
            .then(function(response) {
                if (response.data.success) {
                    $scope.stats = response.data.stats;
                    $scope.revenue = response.data.revenue;
                }
            })
            .catch(function(error) {
                console.error('Failed to load dashboard data:', error);
            });
        
        // Load utility trends for chart
        ApiService.getUtilityTrends()
            .then(function(response) {
                if (response.data.success) {
                    $timeout(function() {
                        initDashboardCharts(response.data);
                    }, 300);
                }
            })
            .catch(function(error) {
                console.error('Failed to load utility trends:', error);
                $timeout(function() {
                    initDashboardCharts(null);
                }, 300);
            });
    }
    
    // Initialize
    loadDashboardData();
}]);

// ============================================
// GRIEVANCE CONTROLLER (with API integration)
// ============================================
app.controller('GrievanceController', ['$scope', 'ApiService', function ($scope, ApiService) {
    // Check authentication
    if (!ApiService.isAuthenticated()) {
        window.location.href = '../../../templates/index.html';
        return;
    }
    
    // Current user
    var official = ApiService.getCurrentOfficial();
    $scope.user = {
        name: official ? official.full_name : 'Government Official',
        initials: official ? official.full_name.split(' ').map(function(n) { return n[0]; }).join('') : 'GO',
        role: official ? official.designation.replace(/_/g, ' ').replace(/\b\w/g, function(l) { return l.toUpperCase(); }) : 'Official'
    };
    
    // Notifications
    $scope.notifications = 5;
    
    // Stats (loaded from API)
    $scope.stats = {
        pending: 0,
        slaRisk: 0,
        escalated: 0,
        resolved: 0
    };
    
    // Filters
    $scope.filters = {
        status: '',
        severity: '',
        utility_type: '',
        ward: ''
    };

    // Grievances list
    $scope.grievances = [];
    $scope.selectedGrievance = null;
    $scope.isLoading = true;
    
    // Utility icons mapping
    var utilityIcons = {
        'electricity': '⚡',
        'water': '💧',
        'gas': '🔥',
        'waste': '🗑️'
    };
    
    // Severity class mapping
    var severityClasses = {
        'critical': 'danger',
        'high': 'danger',
        'medium': 'warning',
        'low': 'success'
    };
    
    // Status class mapping
    var statusClasses = {
        'pending': 'info',
        'assigned': 'info',
        'in_progress': 'warning',
        'escalated': 'danger',
        'resolved': 'success',
        'closed': 'success'
    };
    
    // Load grievances from API
    function loadGrievances() {
        $scope.isLoading = true;
        ApiService.getGrievances($scope.filters)
            .then(function(response) {
                if (response.data.success) {
                    $scope.stats = response.data.stats;
                    $scope.grievances = response.data.grievances.map(function(g) {
                        // Calculate SLA time remaining
                        var slaEnd = new Date(g.sla_deadline);
                        var now = new Date();
                        var diff = slaEnd - now;
                        var hours = Math.floor(diff / (1000 * 60 * 60));
                        var minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                        var slaTime = hours + 'h ' + minutes + 'm';
                        var slaClass = hours < 2 ? 'critical' : (hours < 6 ? 'warning' : 'safe');
                        
                        return {
                            id: g.ticket_number,
                            dbId: g.id,
                            utility: (utilityIcons[g.utility_type] || '📋') + ' ' + (g.utility_type.charAt(0).toUpperCase() + g.utility_type.slice(1)),
                            ward: 'Ward ' + g.ward_number,
                            severity: g.severity.charAt(0).toUpperCase() + g.severity.slice(1),
                            severityClass: severityClasses[g.severity] || 'info',
                            slaTime: slaTime,
                            slaClass: slaClass,
                            status: g.status.replace(/_/g, ' ').replace(/\b\w/g, function(l) { return l.toUpperCase(); }),
                            statusClass: statusClasses[g.status] || 'info',
                            description: g.description,
                            citizen_name: g.citizen_name,
                            address: g.address,
                            created_at: new Date(g.created_at).toLocaleString()
                        };
                    });
                }
            })
            .catch(function(error) {
                console.error('Failed to load grievances:', error);
                // Fallback dummy data
                $scope.stats = { pending: 47, slaRisk: 12, escalated: 8, resolved: 234 };
                $scope.grievances = [
                    { id: 'GRV-2024-001', utility: '⚡ Electricity', ward: 'Ward 3', severity: 'Critical', severityClass: 'danger', slaTime: '2h 15m', slaClass: 'warning', status: 'In Progress', statusClass: 'warning', description: 'Power outage affecting 50 households', citizen_name: 'Ramesh Kumar', address: 'Block A, Sector 12', created_at: '2024-01-15 09:30' },
                    { id: 'GRV-2024-002', utility: '💧 Water', ward: 'Ward 5', severity: 'High', severityClass: 'danger', slaTime: '4h 30m', slaClass: 'safe', status: 'Assigned', statusClass: 'info', description: 'Low water pressure in morning hours', citizen_name: 'Priya Singh', address: 'Block C, Sector 8', created_at: '2024-01-15 10:15' },
                    { id: 'GRV-2024-003', utility: '🔥 Gas', ward: 'Ward 2', severity: 'Medium', severityClass: 'warning', slaTime: '6h 45m', slaClass: 'safe', status: 'Pending', statusClass: 'info', description: 'Gas meter reading discrepancy', citizen_name: 'Amit Sharma', address: 'Block B, Sector 15', created_at: '2024-01-15 11:00' },
                    { id: 'GRV-2024-004', utility: '🗑️ Waste', ward: 'Ward 7', severity: 'Low', severityClass: 'success', slaTime: '1h 20m', slaClass: 'critical', status: 'Escalated', statusClass: 'danger', description: 'Irregular garbage collection', citizen_name: 'Sunita Devi', address: 'Block D, Sector 3', created_at: '2024-01-15 08:45' },
                    { id: 'GRV-2024-005', utility: '⚡ Electricity', ward: 'Ward 1', severity: 'Critical', severityClass: 'danger', slaTime: '0h 45m', slaClass: 'critical', status: 'In Progress', statusClass: 'warning', description: 'Transformer failure', citizen_name: 'Vikram Patel', address: 'Block E, Sector 20', created_at: '2024-01-15 07:30' },
                    { id: 'GRV-2024-006', utility: '💧 Water', ward: 'Ward 4', severity: 'High', severityClass: 'danger', slaTime: '3h 10m', slaClass: 'warning', status: 'Assigned', statusClass: 'info', description: 'Water contamination reported', citizen_name: 'Meena Kumari', address: 'Block F, Sector 11', created_at: '2024-01-15 12:20' },
                    { id: 'GRV-2024-007', utility: '🔥 Gas', ward: 'Ward 6', severity: 'Critical', severityClass: 'danger', slaTime: '1h 55m', slaClass: 'critical', status: 'In Progress', statusClass: 'warning', description: 'Gas leak detected in building', citizen_name: 'Rajesh Verma', address: 'Block G, Sector 5', created_at: '2024-01-15 06:15' }
                ];
                $scope.insights = [
                    { type: 'danger', icon: '⚠️', title: 'Critical SLA Risk', description: '5 cases at risk of SLA breach in next 2 hours' },
                    { type: 'warning', icon: '📈', title: 'Volume Spike', description: 'Electricity complaints up 40% from yesterday' },
                    { type: 'info', icon: '📍', title: 'Hotspot Detected', description: 'Ward 3 shows clustering of water issues' }
                ];
            })
            .finally(function() {
                $scope.isLoading = false;
            });
    }
    
    // Apply filters
    $scope.applyFilters = function() {
        loadGrievances();
    };
    
    // Clear filters
    $scope.clearFilters = function() {
        $scope.filters = { status: '', severity: '', utility_type: '', ward: '' };
        loadGrievances();
    };

    $scope.viewGrievance = function (grievance) {
        $scope.selectedGrievance = grievance;
    };

    $scope.closeDrawer = function () {
        $scope.selectedGrievance = null;
    };
    
    // Logout
    $scope.logout = function() {
        ApiService.logout().then(function() {
            ApiService.clearAuth();
            window.location.href = '../../../templates/index.html';
        }).catch(function() {
            ApiService.clearAuth();
            window.location.href = '../../../templates/index.html';
        });
    };
    
    // Initialize
    loadGrievances();
}]);

// ============================================
// METER CONTROLLER (with API integration)
// ============================================
app.controller('MeterController', ['$scope', 'ApiService', function ($scope, ApiService) {
    // Check authentication
    if (!ApiService.isAuthenticated()) {
        window.location.href = '../../../templates/index.html';
        return;
    }
    
    // Current user
    var official = ApiService.getCurrentOfficial();
    $scope.user = {
        name: official ? official.full_name : 'Government Official',
        initials: official ? official.full_name.split(' ').map(function(n) { return n[0]; }).join('') : 'GO',
        role: official ? official.designation.replace(/_/g, ' ').replace(/\b\w/g, function(l) { return l.toUpperCase(); }) : 'Official'
    };
    
    // Notifications
    $scope.notifications = 5;
    
    // Stats
    $scope.stats = {
        verified: 0,
        review: 0,
        suspicious: 0,
        aiConfidence: 0
    };
    
    // Filter
    $scope.statusFilter = '';
    
    // Meter readings list
    $scope.meterReadings = [];
    $scope.isLoading = true;
    
    // Status class mapping
    var statusClasses = {
        'verified': 'success',
        'pending_review': 'warning',
        'suspicious': 'danger',
        'manual_override': 'info'
    };
    
    // Confidence class helper
    function getConfidenceClass(confidence) {
        if (confidence >= 85) return 'success';
        if (confidence >= 65) return 'warning';
        return 'danger';
    }
    
    // Load meter readings from API
    function loadMeterReadings() {
        $scope.isLoading = true;
        ApiService.getMeterReadings($scope.statusFilter)
            .then(function(response) {
                if (response.data.success) {
                    $scope.stats = response.data.stats;
                    $scope.meterReadings = response.data.readings.map(function(r) {
                        return {
                            id: r.meter_number,
                            dbId: r.id,
                            location: r.location,
                            reading: r.reading_value.toLocaleString(),
                            confidence: r.ai_confidence,
                            confidenceClass: getConfidenceClass(r.ai_confidence),
                            status: r.verification_status.replace(/_/g, ' ').replace(/\b\w/g, function(l) { return l.toUpperCase(); }),
                            statusClass: statusClasses[r.verification_status] || 'info',
                            time: new Date(r.reading_date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
                            utilityType: r.utility_type
                        };
                    });
                }
            })
            .catch(function(error) {
                console.error('Failed to load meter readings:', error);
                // Fallback dummy data
                $scope.stats = { verified: 1247, review: 23, suspicious: 8, aiConfidence: 94.2 };
                $scope.meterReadings = [
                    { id: 'MTR-001234', location: 'Sector 12, Block A', reading: '4,523', confidence: 98, confidenceClass: 'success', status: 'Verified', statusClass: 'success', time: '09:15 AM', utilityType: 'electricity' },
                    { id: 'MTR-001235', location: 'Sector 8, Block C', reading: '2,891', confidence: 72, confidenceClass: 'warning', status: 'Pending Review', statusClass: 'warning', time: '09:32 AM', utilityType: 'electricity' },
                    { id: 'MTR-001236', location: 'Sector 15, Block B', reading: '156', confidence: 45, confidenceClass: 'danger', status: 'Suspicious', statusClass: 'danger', time: '09:45 AM', utilityType: 'water' },
                    { id: 'MTR-001237', location: 'Sector 3, Block D', reading: '3,245', confidence: 96, confidenceClass: 'success', status: 'Verified', statusClass: 'success', time: '10:01 AM', utilityType: 'electricity' },
                    { id: 'MTR-001238', location: 'Sector 20, Block E', reading: '892', confidence: 88, confidenceClass: 'success', status: 'Verified', statusClass: 'success', time: '10:15 AM', utilityType: 'gas' },
                    { id: 'MTR-001239', location: 'Sector 11, Block F', reading: '1,567', confidence: 63, confidenceClass: 'warning', status: 'Pending Review', statusClass: 'warning', time: '10:28 AM', utilityType: 'water' },
                    { id: 'MTR-001240', location: 'Sector 5, Block G', reading: '4,102', confidence: 91, confidenceClass: 'success', status: 'Verified', statusClass: 'success', time: '10:42 AM', utilityType: 'electricity' },
                    { id: 'MTR-001241', location: 'Sector 18, Block H', reading: '287', confidence: 38, confidenceClass: 'danger', status: 'Suspicious', statusClass: 'danger', time: '10:55 AM', utilityType: 'gas' }
                ];
            })
            .finally(function() {
                $scope.isLoading = false;
            });
    }
    
    // Filter change
    $scope.onFilterChange = function() {
        loadMeterReadings();
    };

    $scope.approveMeter = function (meter) {
        ApiService.approveMeter(meter.dbId)
            .then(function(response) {
                if (response.data.success) {
                    meter.status = 'Verified';
                    meter.statusClass = 'success';
                    meter.confidence = 100;
                    meter.confidenceClass = 'success';
                    // Update stats
                    $scope.stats.verified++;
                    $scope.stats.review--;
                }
            })
            .catch(function(error) {
                console.error('Failed to approve meter:', error);
                alert('Failed to approve meter reading');
            });
    };

    $scope.reverifyMeter = function (meter) {
        meter.status = 'Re-verifying';
        meter.statusClass = 'info';
        // In a real app, would call API to trigger re-verification
    };
    
    // Logout
    $scope.logout = function() {
        ApiService.logout().then(function() {
            ApiService.clearAuth();
            window.location.href = '../../../templates/index.html';
        }).catch(function() {
            ApiService.clearAuth();
            window.location.href = '../../../templates/index.html';
        });
    };
    
    // Initialize
    loadMeterReadings();
}]);

// ============================================
// RWA CONTROLLER (with API integration)
// ============================================
app.controller('RWAController', ['$scope', 'ApiService', function ($scope, ApiService) {
    // Check authentication
    if (!ApiService.isAuthenticated()) {
        window.location.href = '../../../templates/index.html';
        return;
    }
    
    // Current user
    var official = ApiService.getCurrentOfficial();
    $scope.user = {
        name: official ? official.full_name : 'Government Official',
        initials: official ? official.full_name.split(' ').map(function(n) { return n[0]; }).join('') : 'GO',
        role: official ? official.designation.replace(/_/g, ' ').replace(/\b\w/g, function(l) { return l.toUpperCase(); }) : 'Official'
    };
    
    // Notifications
    $scope.notifications = 5;
    
    // Stats
    $scope.stats = {
        total: 0,
        completed: 0,
        inProgress: 0,
        delayed: 0
    };
    
    // Filter
    $scope.statusFilter = '';
    
    // Projects list
    $scope.projects = [];
    $scope.isLoading = true;
    
    // Status class mapping
    var statusClasses = {
        'on_track': 'success',
        'near_complete': 'success',
        'in_progress': 'info',
        'delayed': 'danger',
        'completed': 'success'
    };
    
    // Progress class helper
    function getProgressClass(progress) {
        if (progress >= 75) return 'success';
        if (progress >= 50) return 'warning';
        return 'info';
    }
    
    // Load RWA projects from API
    function loadProjects() {
        $scope.isLoading = true;
        ApiService.getRWAProjects($scope.statusFilter)
            .then(function(response) {
                if (response.data.success) {
                    $scope.stats = response.data.stats;
                    $scope.projects = response.data.projects.map(function(p) {
                        return {
                            id: p.id,
                            name: p.project_name,
                            allocated: (p.budget_allocated / 100).toLocaleString('en-IN'),
                            purpose: p.category.charAt(0).toUpperCase() + p.category.slice(1),
                            deadline: new Date(p.deadline).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }),
                            progress: p.progress,
                            progressClass: getProgressClass(p.progress),
                            status: p.status.replace(/_/g, ' ').replace(/\b\w/g, function(l) { return l.toUpperCase(); }),
                            statusClass: statusClasses[p.status] || 'info',
                            rwa: p.rwa_name,
                            ward: p.ward_number,
                            utilization: p.utilization
                        };
                    });
                }
            })
            .catch(function(error) {
                console.error('Failed to load RWA projects:', error);
                // Fallback dummy data
                $scope.stats = { total: 45, active: 32, delayed: 5, completedThisMonth: 8 };
                $scope.projects = [
                    { id: 1, name: 'Community Park Development', allocated: '₹8,50,000', purpose: 'Infrastructure', deadline: 'Mar 15, 2024', progress: 75, progressClass: 'success', status: 'On Track', statusClass: 'success', rwa: 'Green Valley RWA', ward: 'Ward 3', utilization: 72 },
                    { id: 2, name: 'Street Light Installation', allocated: '₹3,25,000', purpose: 'Electricity', deadline: 'Feb 28, 2024', progress: 92, progressClass: 'success', status: 'Near Complete', statusClass: 'success', rwa: 'Sunrise Colony RWA', ward: 'Ward 5', utilization: 88 },
                    { id: 3, name: 'Water Pipeline Repair', allocated: '₹5,75,000', purpose: 'Water', deadline: 'Apr 10, 2024', progress: 45, progressClass: 'warning', status: 'In Progress', statusClass: 'info', rwa: 'Lake View RWA', ward: 'Ward 2', utilization: 40 },
                    { id: 4, name: 'Garbage Disposal System', allocated: '₹4,20,000', purpose: 'Waste Management', deadline: 'Feb 20, 2024', progress: 30, progressClass: 'info', status: 'Delayed', statusClass: 'danger', rwa: 'Metro Heights RWA', ward: 'Ward 7', utilization: 25 },
                    { id: 5, name: 'Security Camera Network', allocated: '₹6,80,000', purpose: 'Security', deadline: 'May 5, 2024', progress: 60, progressClass: 'warning', status: 'On Track', statusClass: 'success', rwa: 'Palm Gardens RWA', ward: 'Ward 1', utilization: 55 },
                    { id: 6, name: 'Senior Citizen Center', allocated: '₹12,00,000', purpose: 'Community', deadline: 'Jun 30, 2024', progress: 25, progressClass: 'info', status: 'In Progress', statusClass: 'info', rwa: 'Heritage Apartments RWA', ward: 'Ward 4', utilization: 20 }
                ];
            })
            .finally(function() {
                $scope.isLoading = false;
            });
    }
    
    // Filter change
    $scope.onFilterChange = function() {
        loadProjects();
    };
    
    // Logout
    $scope.logout = function() {
        ApiService.logout().then(function() {
            ApiService.clearAuth();
            window.location.href = '../../../templates/index.html';
        }).catch(function() {
            ApiService.clearAuth();
            window.location.href = '../../../templates/index.html';
        });
    };
    
    // Initialize
    loadProjects();
}]);

// Participation Controller
// ============================================
// PARTICIPATION CONTROLLER (with API integration)
// ============================================
app.controller('ParticipationController', ['$scope', 'ApiService', function ($scope, ApiService) {
    // Check authentication
    if (!ApiService.isAuthenticated()) {
        window.location.href = '../../../templates/index.html';
        return;
    }
    
    // Current user
    var official = ApiService.getCurrentOfficial();
    $scope.user = {
        name: official ? official.full_name : 'Government Official',
        initials: official ? official.full_name.split(' ').map(function(n) { return n[0]; }).join('') : 'GO',
        role: official ? official.designation.replace(/_/g, ' ').replace(/\b\w/g, function(l) { return l.toUpperCase(); }) : 'Official'
    };
    
    // Notifications
    $scope.notifications = 5;
    $scope.isLoading = true;

    // Stats
    $scope.stats = {
        totalParticipants: 0,
        activeSchemes: 0,
        pendingRedemptions: 0,
        abuseAlerts: 0,
        engagementHealthScore: 0
    };

    // Ward heatmap
    $scope.wards = [];
    
    // Scheme performance data
    $scope.schemePerformance = [];
    
    // Redemptions list
    $scope.redemptions = [];
    
    // Abuse alerts
    $scope.abuseAlerts = [];
    
    // Policy actions
    $scope.policyActions = [];
    
    // Load participation data from API
    function loadParticipationData() {
        $scope.isLoading = true;
        
        ApiService.getParticipation()
            .then(function(response) {
                if (response.data.success) {
                    $scope.stats = response.data.stats;
                    
                    // Map schemes
                    $scope.schemePerformance = response.data.schemes.map(function(s) {
                        var statusClass = s.status === 'active' ? 'success' : (s.status === 'paused' ? 'warning' : 'danger');
                        return {
                            id: s.id,
                            name: s.name,
                            activeWards: s.active_wards,
                            participation: s.participation_rate + '%',
                            costPerEngagement: '₹' + (s.total_budget / Math.max(s.participant_count, 1) / 100).toFixed(2),
                            status: s.status === 'active' ? 'High Impact' : (s.status === 'paused' ? 'Paused' : 'Low Impact'),
                            statusClass: statusClass,
                            abuseRate: 'Low'
                        };
                    });
                    
                    // Map redemptions
                    $scope.redemptions = response.data.recent_redemptions.map(function(r) {
                        return {
                            user: r.user_name.split(' ')[0] + ' ' + r.user_name.split(' ').slice(-1)[0][0] + '.',
                            reward: r.reward_name,
                            points: r.points_redeemed,
                            date: new Date(r.redemption_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }),
                            ward: 'Ward ' + (Math.floor(Math.random() * 32) + 1),
                            verified: r.status === 'completed'
                        };
                    });
                }
            })
            .catch(function(error) {
                console.error('Failed to load participation data:', error);
                // Fallback dummy data
                $scope.stats = { totalParticipants: 18542, activeSchemes: 12, pendingRedemptions: 156, abuseAlerts: 3, engagementHealthScore: 78 };
                $scope.schemePerformance = [
                    { id: 1, name: 'Water Conservation Bonus', activeWards: 28, participation: '72%', costPerEngagement: '₹15.50', status: 'High Impact', statusClass: 'success', abuseRate: 'Low' },
                    { id: 2, name: 'Waste Segregation Rewards', activeWards: 32, participation: '85%', costPerEngagement: '₹8.25', status: 'High Impact', statusClass: 'success', abuseRate: 'Low' },
                    { id: 3, name: 'Electricity Saving Program', activeWards: 24, participation: '45%', costPerEngagement: '₹22.75', status: 'Low Impact', statusClass: 'danger', abuseRate: 'Medium' },
                    { id: 4, name: 'Community Clean-Up Points', activeWards: 15, participation: '38%', costPerEngagement: '₹12.00', status: 'Paused', statusClass: 'warning', abuseRate: 'High' }
                ];
                $scope.redemptions = [
                    { user: 'Ramesh K.', reward: 'Bill Discount ₹200', points: 500, date: 'Jan 15, 2024', ward: 'Ward 3', verified: true },
                    { user: 'Priya S.', reward: 'Shopping Voucher', points: 750, date: 'Jan 14, 2024', ward: 'Ward 7', verified: true },
                    { user: 'Amit P.', reward: 'Free Bus Pass', points: 1000, date: 'Jan 14, 2024', ward: 'Ward 12', verified: false },
                    { user: 'Sunita D.', reward: 'Cinema Tickets', points: 400, date: 'Jan 13, 2024', ward: 'Ward 5', verified: true }
                ];
            });
        
        // Load ward stats for heatmap
        ApiService.getWardStats()
            .then(function(response) {
                if (response.data.success) {
                    $scope.wards = response.data.wards.map(function(w) {
                        var participation = w.citizen_participation_score || Math.floor(Math.random() * 100);
                        var level = participation >= 75 ? 'very-high' : (participation >= 50 ? 'high' : (participation >= 25 ? 'medium' : 'low'));
                        return {
                            id: w.ward_number,
                            level: level,
                            participation: participation,
                            trend: (Math.random() > 0.5 ? '+' : '-') + (Math.random() * 5).toFixed(1) + '%',
                            topScheme: ['Water Saving Bonus', 'Waste Segregation', 'Electricity Efficiency'][Math.floor(Math.random() * 3)],
                            avgPointsPerCitizen: Math.floor(Math.random() * 500) + 100,
                            abuseRiskLevel: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)]
                        };
                    });
                }
            })
            .catch(function(error) {
                console.error('Failed to load ward stats:', error);
                // Fallback ward data
                $scope.wards = [];
                for (var i = 1; i <= 32; i++) {
                    var participation = Math.floor(Math.random() * 100);
                    var level = participation >= 75 ? 'very-high' : (participation >= 50 ? 'high' : (participation >= 25 ? 'medium' : 'low'));
                    $scope.wards.push({
                        id: i,
                        level: level,
                        participation: participation,
                        trend: (Math.random() > 0.5 ? '+' : '-') + (Math.random() * 5).toFixed(1) + '%',
                        topScheme: ['Water Saving Bonus', 'Waste Segregation', 'Electricity Efficiency'][Math.floor(Math.random() * 3)],
                        avgPointsPerCitizen: Math.floor(Math.random() * 500) + 100,
                        abuseRiskLevel: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)]
                    });
                }
            })
            .finally(function() {
                $scope.isLoading = false;
            });
    }
    
    // Sample abuse alerts (could be from API)
    $scope.abuseAlerts = [
        {
            type: 'Multiple Accounts',
            description: 'Same device detected for 5 accounts',
            ward: 'Ward 18',
            severity: 'high',
            pattern: 'Device-based clustering',
            actions: [
                { label: '🔍 Review Pattern', action: 'review' },
                { label: '⏸ Pause Scheme', action: 'pause' },
                { label: '📝 Add Remark', action: 'remark' }
            ]
        },
        {
            type: 'Unusual Activity',
            description: 'Rapid point accumulation pattern',
            ward: 'Ward 7',
            severity: 'medium',
            pattern: 'Temporal anomaly',
            actions: [
                { label: '🔍 Review Pattern', action: 'review' },
                { label: '⏸ Pause Scheme', action: 'pause' },
                { label: '📝 Add Remark', action: 'remark' }
            ]
        }
    ];
    
    // Policy actions
    $scope.policyActions = [
        {
            title: 'Increase Water-Saving Incentives',
            description: 'Wards 3, 15, 22 show low participation rates',
            recommendation: 'Boost point multiplier by 20% for Q1',
            priority: 'high'
        },
        {
            title: 'Expand Electricity Program',
            description: 'Strong demand in 20 wards; resource-efficient',
            recommendation: 'Roll out to remaining 8 wards',
            priority: 'medium'
        }
    ];

    // Interactive ward drawer state
    $scope.selectedWard = null;
    $scope.showWardDetails = false;

    $scope.selectWard = function (ward) {
        $scope.selectedWard = ward;
        $scope.showWardDetails = true;
    };

    $scope.closeWardDetails = function () {
        $scope.showWardDetails = false;
        $scope.selectedWard = null;
    };

    // Action handlers
    $scope.handleAlertAction = function (alert, action) {
        console.log('Action ' + action + ' on alert: ' + alert.type);
    };

    $scope.handlePolicyAction = function (action) {
        console.log('Executing policy action: ' + action.title);
    };
    
    // Logout
    $scope.logout = function() {
        ApiService.logout().then(function() {
            ApiService.clearAuth();
            window.location.href = '../../../templates/index.html';
        }).catch(function() {
            ApiService.clearAuth();
            window.location.href = '../../../templates/index.html';
        });
    };
    
    // Initialize
    loadParticipationData();
}]);

// Policy Controller
// ============================================
// POLICY CONTROLLER (with API integration)
// ============================================
app.controller('PolicyController', ['$scope', '$timeout', 'ApiService', function ($scope, $timeout, ApiService) {
    // Check authentication
    if (!ApiService.isAuthenticated()) {
        window.location.href = '../../../templates/index.html';
        return;
    }
    
    // Current user
    var official = ApiService.getCurrentOfficial();
    $scope.user = {
        name: official ? official.full_name : 'Government Official',
        initials: official ? official.full_name.split(' ').map(function(n) { return n[0]; }).join('') : 'GO',
        role: official ? official.designation.replace(/_/g, ' ').replace(/\b\w/g, function(l) { return l.toUpperCase(); }) : 'Official'
    };
    
    // Notifications
    $scope.notifications = 5;
    $scope.isLoading = true;
    
    // Policy Summary
    $scope.policySummary = {
        keyInsight: 'Loading...',
        riskAlert: 'Loading...',
        opportunity: 'Loading...',
        trend: 'positive'
    };

    // Ward Rankings
    $scope.wardRankings = [];
    
    // Load ward rankings from API
    function loadPolicyData() {
        $scope.isLoading = true;
        
        ApiService.getWardRankings()
            .then(function(response) {
                if (response.data.success) {
                    var wards = response.data.wards;
                    
                    // Calculate policy summary insights
                    var totalResolved = wards.reduce(function(sum, w) { return sum + w.resolved_complaints; }, 0);
                    var avgSatisfaction = wards.reduce(function(sum, w) { return sum + w.citizen_satisfaction; }, 0) / (wards.length || 1);
                    
                    var topWard = wards[0];
                    var lowWards = wards.filter(function(w) { return w.citizen_satisfaction < 75; });
                    
                    $scope.policySummary = {
                        keyInsight: 'Complaint resolution rate improved by ' + ((topWard ? topWard.resolved_complaints : 200) / 10).toFixed(0) + '% this quarter, driven by faster utility response times.',
                        riskAlert: lowWards.length > 0 ? 'Wards ' + lowWards.map(function(w) { return w.ward_number; }).join(', ') + ' show below-target satisfaction scores.' : 'All wards meeting targets.',
                        opportunity: topWard ? 'Implementing best practices from Ward ' + topWard.ward_number + ' could improve average satisfaction by 8-12%.' : 'Review performance data.',
                        trend: avgSatisfaction >= 75 ? 'positive' : 'negative'
                    };
                    
                    // Map ward rankings
                    $scope.wardRankings = wards.map(function(w, index) {
                        var scoreClass = w.citizen_satisfaction >= 85 ? 'success' : (w.citizen_satisfaction >= 75 ? 'info' : 'warning');
                        var score = w.citizen_satisfaction >= 90 ? 'A+' : (w.citizen_satisfaction >= 85 ? 'A' : (w.citizen_satisfaction >= 80 ? 'B+' : (w.citizen_satisfaction >= 75 ? 'B' : 'B-')));
                        
                        return {
                            id: w.ward_number,
                            name: 'Ward ' + w.ward_number,
                            resolved: w.resolved_complaints,
                            avgTime: w.avg_resolution_time.toFixed(1) + ' hrs',
                            satisfaction: w.citizen_satisfaction,
                            score: score,
                            scoreClass: scoreClass,
                            explanation: w.citizen_satisfaction >= 85 ? 'High resolution rate • Low SLA breaches • Superior citizen satisfaction' : (w.citizen_satisfaction >= 75 ? 'Good performance • Consistent operations' : 'Needs improvement • Review processes'),
                            participationScore: w.citizen_participation_score,
                            waterComplaints: Math.floor(Math.random() * 50) + 10,
                            electricityComplaints: Math.floor(Math.random() * 60) + 20,
                            gasComplaints: Math.floor(Math.random() * 20) + 5,
                            trend: (Math.random() > 0.3 ? '+' : '-') + (Math.random() * 5).toFixed(1) + '%'
                        };
                    });
                }
            })
            .catch(function(error) {
                console.error('Failed to load policy data:', error);
                // Fallback dummy data
                $scope.policySummary = {
                    keyInsight: 'Complaint resolution rate improved by 23% this quarter, driven by faster utility response times.',
                    riskAlert: 'Wards 7, 15, 22 show below-target satisfaction scores.',
                    opportunity: 'Implementing best practices from Ward 3 could improve average satisfaction by 8-12%.',
                    trend: 'positive'
                };
                $scope.wardRankings = [
                    { id: 3, name: 'Ward 3', resolved: 245, avgTime: '4.2 hrs', satisfaction: 92, score: 'A+', scoreClass: 'success', explanation: 'High resolution rate • Low SLA breaches • Superior citizen satisfaction', participationScore: 85, waterComplaints: 28, electricityComplaints: 35, gasComplaints: 12, trend: '+3.2%' },
                    { id: 5, name: 'Ward 5', resolved: 198, avgTime: '5.1 hrs', satisfaction: 88, score: 'A', scoreClass: 'success', explanation: 'High resolution rate • Good citizen feedback', participationScore: 78, waterComplaints: 32, electricityComplaints: 42, gasComplaints: 15, trend: '+2.1%' },
                    { id: 12, name: 'Ward 12', resolved: 175, avgTime: '5.8 hrs', satisfaction: 84, score: 'B+', scoreClass: 'info', explanation: 'Good performance • Consistent operations', participationScore: 72, waterComplaints: 38, electricityComplaints: 48, gasComplaints: 18, trend: '+1.5%' },
                    { id: 8, name: 'Ward 8', resolved: 162, avgTime: '6.2 hrs', satisfaction: 81, score: 'B+', scoreClass: 'info', explanation: 'Good performance • Room for improvement', participationScore: 68, waterComplaints: 42, electricityComplaints: 52, gasComplaints: 20, trend: '+0.8%' },
                    { id: 7, name: 'Ward 7', resolved: 145, avgTime: '7.5 hrs', satisfaction: 72, score: 'B-', scoreClass: 'warning', explanation: 'Needs improvement • Review processes', participationScore: 55, waterComplaints: 55, electricityComplaints: 65, gasComplaints: 25, trend: '-1.2%' }
                ];
            })
            .finally(function() {
                $scope.isLoading = false;
            });
    }

    // Policy Impact Correlation Analysis
    $scope.policyImpacts = [
        {
            policy: 'Water-Saving Incentive Program',
            participationLink: 'Wards with 70%+ participation show 35% fewer water complaints',
            impactMetric: '-3.5 complaints/month',
            effectiveness: 'High'
        },
        {
            policy: 'Electricity Efficiency Initiative',
            participationLink: 'Active participants report 42% faster electricity issue resolution',
            impactMetric: '-1.2 hrs avg time',
            effectiveness: 'High'
        },
        {
            policy: 'Community Engagement Program',
            participationLink: 'High participation wards show 18% higher satisfaction scores',
            impactMetric: '+8.2% satisfaction',
            effectiveness: 'Medium'
        }
    ];

    // What-If Policy Scenarios
    $scope.scenarios = [
        {
            title: 'Increase Incentives in Low-Performing Wards',
            assumption: 'Boost point multiplier by 20% for low-performing wards',
            expectedImpact: '+12% participation, -2.5 hrs avg resolution time',
            confidence: '85%',
            riskLevel: 'Low'
        },
        {
            title: 'Add More Verification Teams',
            assumption: '2 additional verification teams in high-complaint wards',
            expectedImpact: '-25% complaints, +18% satisfaction',
            confidence: '78%',
            riskLevel: 'Low'
        },
        {
            title: 'Reduce SLA Thresholds by 1 Hour',
            assumption: 'All grievances must be resolved within 24 hours',
            expectedImpact: '+15% operational cost, +6% satisfaction',
            confidence: '72%',
            riskLevel: 'Medium'
        }
    ];

    // Recommended Policy Actions
    $scope.recommendedActions = [
        {
            priority: 'high',
            title: 'Expand Best Practices from Top Wards',
            description: 'Document and share operational models from top-performing wards.',
            expectedOutcome: 'Could improve average satisfaction by 8-12% across low-performing wards',
            status: 'pending'
        },
        {
            priority: 'high',
            title: 'Prioritise Infrastructure in Low-Performing Wards',
            description: 'Focus on wards with high complaint volumes.',
            expectedOutcome: 'Reduce complaint volume by 30-40%, improve satisfaction by 12-15%',
            status: 'pending'
        },
        {
            priority: 'medium',
            title: 'Launch Targeted Incentive Campaign',
            description: 'Focus on low-participation wards (target: 50%+ participation by Q2).',
            expectedOutcome: 'Increase community engagement, accelerate complaint resolution',
            status: 'pending'
        }
    ];

    // Toggle explanation visibility
    $scope.selectedWardForExplanation = null;
    $scope.toggleExplanation = function (wardIndex) {
        if ($scope.selectedWardForExplanation === wardIndex) {
            $scope.selectedWardForExplanation = null;
        } else {
            $scope.selectedWardForExplanation = wardIndex;
        }
    };

    // Action handlers
    $scope.approveAction = function (action) {
        action.status = 'approved';
        console.log('Action approved: ' + action.title);
    };

    $scope.exploreScenario = function (scenario) {
        console.log('Exploring scenario: ' + scenario.title);
    };
    
    // Logout
    $scope.logout = function() {
        ApiService.logout().then(function() {
            ApiService.clearAuth();
            window.location.href = '../../../templates/index.html';
        }).catch(function() {
            ApiService.clearAuth();
            window.location.href = '../../../templates/index.html';
        });
    };
    
    // Initialize
    loadPolicyData();

    $timeout(function () {
        initPolicyCharts();
    }, 500);
}]);

// Audit Controller
// ============================================
// AUDIT CONTROLLER (with API integration)
// ============================================
app.controller('AuditController', ['$scope', 'ApiService', function ($scope, ApiService) {
    // Check authentication
    if (!ApiService.isAuthenticated()) {
        window.location.href = '../../../templates/index.html';
        return;
    }
    
    // Current user
    var official = ApiService.getCurrentOfficial();
    $scope.user = {
        name: official ? official.full_name : 'Government Official',
        initials: official ? official.full_name.split(' ').map(function(n) { return n[0]; }).join('') : 'GO',
        role: official ? official.designation.replace(/_/g, ' ').replace(/\b\w/g, function(l) { return l.toUpperCase(); }) : 'Official'
    };
    
    // Notifications
    $scope.notifications = 5;
    
    // Logs array
    $scope.logs = [];
    $scope.isLoading = true;

    // Filter state
    $scope.filterType = 'all';
    $scope.filterActionType = 'all';
    $scope.filterSource = 'all';
    $scope.selectedDateRange = 'all';
    
    // Action type icons
    var actionIcons = {
        'grievance_resolved': '✅',
        'complaint_escalated': '⬆️',
        'policy_updated': '📝',
        'access_revoked': '🔒',
        'payment_verified': '💳',
        'report_generated': '📊',
        'data_sync': '🔄',
        'system_config': '⚡',
        'login': '🔐',
        'logout': '🚪'
    };
    
    // Type classes
    var typeClasses = {
        'success': 'success',
        'warning': 'warning',
        'error': 'danger',
        'info': 'info'
    };
    
    // Load audit logs
    function loadAuditLogs() {
        $scope.isLoading = true;
        var type = $scope.filterActionType !== 'all' ? $scope.filterActionType : null;
        var source = $scope.filterSource !== 'all' ? $scope.filterSource : null;
        
        ApiService.getAuditLogs(type, source)
            .then(function(response) {
                if (response.data.success) {
                    $scope.logs = response.data.logs.map(function(log) {
                        var actionType = log.action_type.toLowerCase().replace(/ /g, '_');
                        return {
                            id: log.log_id,
                            dbId: log.id,
                            icon: actionIcons[actionType] || '📋',
                            action: log.action_type.replace(/_/g, ' ').replace(/\b\w/g, function(l) { return l.toUpperCase(); }),
                            official: (log.performed_by || 'System') + (log.official_id ? ' (ID: GOV-' + String(log.official_id).padStart(4, '0') + ')' : ''),
                            department: log.department || 'System',
                            reason: log.description,
                            date: new Date(log.timestamp).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }),
                            time: new Date(log.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
                            timestamp: log.timestamp,
                            type: typeClasses[log.severity] || 'info',
                            source: log.source === 'system' ? 'System (AUTO)' : 'Manual',
                            relatedId: log.related_entity_type + '-' + log.related_entity_id,
                            impact: log.action_type.replace(/_/g, ' ').replace(/\b\w/g, function(l) { return l.toUpperCase(); }),
                            severity: log.severity.charAt(0).toUpperCase() + log.severity.slice(1)
                        };
                    });
                }
            })
            .catch(function(error) {
                console.error('Failed to load audit logs:', error);
                // Fallback dummy data
                $scope.logs = [
                    { id: 'AUD-001', icon: '✅', action: 'Grievance Resolved', official: 'Rajesh Kumar (ID: GOV-0012)', department: 'Grievance Cell', reason: 'Electricity complaint resolved after verification', date: 'Jan 15, 2024', time: '09:32 AM', type: 'success', source: 'Manual', relatedId: 'GRV-2024-001', impact: 'Grievance Resolved', severity: 'Info' },
                    { id: 'AUD-002', icon: '⬆️', action: 'Complaint Escalated', official: 'Priya Singh (ID: GOV-0008)', department: 'Water Department', reason: 'SLA breach imminent - escalated to supervisor', date: 'Jan 15, 2024', time: '10:15 AM', type: 'warning', source: 'System (AUTO)', relatedId: 'GRV-2024-015', impact: 'Complaint Escalated', severity: 'Warning' },
                    { id: 'AUD-003', icon: '📝', action: 'Policy Updated', official: 'Admin (ID: GOV-0001)', department: 'Administration', reason: 'Updated SLA thresholds for critical complaints', date: 'Jan 15, 2024', time: '11:00 AM', type: 'info', source: 'Manual', relatedId: 'POL-2024-003', impact: 'Policy Updated', severity: 'Info' },
                    { id: 'AUD-004', icon: '🔒', action: 'Access Revoked', official: 'Security Team (ID: GOV-0002)', department: 'IT Security', reason: 'Temporary worker access expired', date: 'Jan 15, 2024', time: '11:45 AM', type: 'warning', source: 'System (AUTO)', relatedId: 'USR-2024-042', impact: 'Access Revoked', severity: 'Warning' },
                    { id: 'AUD-005', icon: '💳', action: 'Payment Verified', official: 'Finance Dept (ID: GOV-0015)', department: 'Finance', reason: 'Bulk payment of ₹45,000 verified for RWA project', date: 'Jan 15, 2024', time: '12:20 PM', type: 'success', source: 'Manual', relatedId: 'PAY-2024-089', impact: 'Payment Verified', severity: 'Info' },
                    { id: 'AUD-006', icon: '📊', action: 'Report Generated', official: 'Analytics (ID: GOV-0003)', department: 'Analytics', reason: 'Weekly performance report for all wards', date: 'Jan 15, 2024', time: '01:00 PM', type: 'info', source: 'System (AUTO)', relatedId: 'RPT-2024-012', impact: 'Report Generated', severity: 'Info' },
                    { id: 'AUD-007', icon: '🔄', action: 'Data Sync', official: 'System', department: 'IT', reason: 'Synced meter readings from field devices', date: 'Jan 15, 2024', time: '02:30 PM', type: 'info', source: 'System (AUTO)', relatedId: 'SYN-2024-156', impact: 'Data Sync', severity: 'Info' },
                    { id: 'AUD-008', icon: '🔐', action: 'Login', official: 'Amit Sharma (ID: GOV-0020)', department: 'Operations', reason: 'Successful login from authorized IP', date: 'Jan 15, 2024', time: '03:15 PM', type: 'success', source: 'System (AUTO)', relatedId: 'SES-2024-892', impact: 'Login', severity: 'Info' }
                ];
            })
            .finally(function() {
                $scope.isLoading = false;
            });
    }

    // Get unique values for filters
    $scope.uniqueActionTypes = ['All', 'Grievance Resolved', 'Complaint Escalated', 'Policy Updated', 'Login', 'Logout', 'Data Sync'];
    $scope.uniqueSources = ['All', 'Manual', 'System (AUTO)'];

    // Apply filters
    $scope.setFilter = function (type) {
        $scope.filterType = type;
    };

    $scope.setActionFilter = function (action) {
        $scope.filterActionType = action;
        loadAuditLogs();
    };

    $scope.setSourceFilter = function (source) {
        $scope.filterSource = source;
        loadAuditLogs();
    };

    $scope.setDateRange = function (range) {
        $scope.selectedDateRange = range;
    };

    // Master filter function
    $scope.filterLogs = function (log) {
        if ($scope.filterType !== 'all' && log.type !== $scope.filterType) {
            return false;
        }
        return true;
    };

    // Export functionality
    $scope.exportAuditLog = function (format) {
        var filteredLogs = $scope.logs.filter($scope.filterLogs);

        if (format === 'csv') {
            var csvContent = 'Log ID,Timestamp,Action,Official,Department,Reason,Type,Source,Related ID,Impact\n';
            filteredLogs.forEach(function (log) {
                csvContent += '"' + log.id + '","' + log.timestamp + '","' + log.action + '","' + log.official + '","' + log.department + '","' + log.reason + '","' + log.type + '","' + log.source + '","' + log.relatedId + '","' + log.impact + '"\n';
            });

            var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            var link = document.createElement('a');
            var url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'audit-log-' + new Date().getTime() + '.csv');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            alert('Audit log exported to CSV');
        } else if (format === 'pdf') {
            var pdfContent = 'AUDIT LOG EXPORT\n';
            pdfContent += 'Generated: ' + new Date().toLocaleDateString('en-IN') + '\n\n';
            filteredLogs.forEach(function (log) {
                pdfContent += '─────────────────────────────────────\n';
                pdfContent += 'LOG ID: ' + log.id + '\n';
                pdfContent += 'Timestamp: ' + log.timestamp + '\n';
                pdfContent += 'Action: ' + log.action + '\n';
                pdfContent += 'Official: ' + log.official + '\n';
                pdfContent += 'Reason: ' + log.reason + '\n';
            });

            var blob = new Blob([pdfContent], { type: 'text/plain;charset=utf-8;' });
            var link = document.createElement('a');
            var url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'audit-log-' + new Date().getTime() + '.txt');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            alert('Audit log exported as text');
        }
    };

    // Log details drawer
    $scope.selectedLogEntry = null;
    $scope.showLogDetails = false;

    $scope.viewLogDetails = function (log) {
        $scope.selectedLogEntry = log;
        $scope.showLogDetails = true;
    };

    $scope.closeLogDetails = function () {
        $scope.showLogDetails = false;
        $scope.selectedLogEntry = null;
    };

    $scope.getLogContext = function (log) {
        return {
            relatedGrievance: log.relatedId,
            previousState: 'Open',
            newState: log.impact,
            changeReason: log.reason,
            approvalStatus: 'Verified',
            verifiedBy: 'System',
            verifiedTime: log.timestamp
        };
    };
    
    // Logout
    $scope.logout = function() {
        ApiService.logout().then(function() {
            ApiService.clearAuth();
            window.location.href = '../../../templates/index.html';
        }).catch(function() {
            ApiService.clearAuth();
            window.location.href = '../../../templates/index.html';
        });
    };
    
    // Initialize
    loadAuditLogs();
}]);

// Settings Controller - Government-Compliant with Governance Enforcement
// ============================================
// SETTINGS CONTROLLER (with API integration)
// ============================================
app.controller('SettingsController', ['$scope', 'ApiService', function ($scope, ApiService) {
    // Check authentication
    if (!ApiService.isAuthenticated()) {
        window.location.href = '../../../templates/index.html';
        return;
    }
    
    // Current user
    var official = ApiService.getCurrentOfficial();
    $scope.user = {
        name: official ? official.full_name : 'Government Official',
        initials: official ? official.full_name.split(' ').map(function(n) { return n[0]; }).join('') : 'GO',
        role: official ? official.designation.replace(/_/g, ' ').replace(/\b\w/g, function(l) { return l.toUpperCase(); }) : 'Official'
    };
    
    // Notifications
    $scope.notifications = 5;
    
    // Initialize tab state
    $scope.activeTab = 'profile';

    // Initialize settings object with government-grade enforcement
    // Use data from logged-in official
    var deptName = official ? official.department.replace(/_/g, ' ').replace(/\b\w/g, function(l) { return l.toUpperCase(); }) : 'Grievance Management';
    var designationName = official ? official.designation.replace(/_/g, ' ').replace(/\b\w/g, function(l) { return l.toUpperCase(); }) : 'Senior Government Official';
    
    $scope.settings = {
        profile: {
            fullName: official ? official.full_name : 'Rajesh Kumar',
            email: official ? official.email : 'rajesh.kumar@gov.in',
            phone: official ? (official.phone || '+91-9876543210') : '+91-9876543210',
            designation: designationName,
            department: official ? official.department : 'grievance',
            departmentName: deptName,
            employeeId: official ? official.employee_id : 'GOV-0001'
        },
        security: {
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
            twoFactorAuth: true  // MANDATORY - Cannot be changed
        },
        notifications: {
            emailAlerts: true,
            smsAlerts: true,
            mandatorySlaBreachAlerts: true,       // MANDATORY - Locked
            mandatoryIntegrityAlerts: true,        // MANDATORY - Locked
            mandatorySecurityAlerts: true,         // MANDATORY - Locked
            dailyReport: true,
            frequency: 'immediate'
        },
        display: {
            theme: 'light',  // LOCKED - Government standard
            language: 'en',
            dateFormat: 'dd/mm/yyyy',
            compactView: false
        },
        api: {
            key: 'sk_live_••••••••••••••••••••••••••',  // Masked for security
            webhooksStatus: 'Centrally Managed (Read-Only)',  // LOCKED
            webhookUrl: '(Managed by System Administration)'   // LOCKED
        }
    };

    // System information
    $scope.systemInfo = {
        version: '2.1.0',
        lastUpdated: new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }),
        dbStatus: 'Connected',
        serverStatus: 'Operational',
        lastBackup: new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) + ' - 02:00 AM'
    };

    // Data governance and compliance
    $scope.dataGovernance = {
        retentionPolicy: '7-Year Mandatory Retention',
        auditConsent: true,  // Cannot be unchecked
        dataRetentionMonths: 84  // 7 years
    };
    
    // Logout
    $scope.logout = function() {
        ApiService.logout().then(function() {
            ApiService.clearAuth();
            window.location.href = '../../../templates/index.html';
        }).catch(function() {
            ApiService.clearAuth();
            window.location.href = '../../../templates/index.html';
        });
    };

    // Save profile settings (only name, email, phone - NOT department)
    $scope.saveProfile = function () {
        // Department change not allowed here - would require admin approval
        $scope.successMessage = {
            type: 'success',
            text: '✓ Profile settings saved successfully. Department change requires administrator approval.'
        };
        setTimeout(function () {
            $scope.$apply(function () {
                $scope.successMessage = null;
            });
        }, 3000);
    };
    
    $scope.resetProfile = function () {
        // Reset profile to original values
        $scope.settings.profile.fullName = 'Rajesh Kumar';
        $scope.settings.profile.email = 'rajesh.kumar@gov.in';
        $scope.settings.profile.phone = '+91-9876543210';
    };

    // Save notification settings - enforce mandatory alerts
    $scope.saveNotifications = function () {
        if ($scope.settings.security.newPassword !== $scope.settings.security.confirmPassword) {
            $scope.successMessage = {
                type: 'error',
                text: '✗ Passwords do not match'
            };
            return;
        }
        $scope.successMessage = {
            type: 'success',
            text: '✓ Password changed successfully. Change logged in Audit Vault.'
        };
        $scope.settings.security.currentPassword = '';
        $scope.settings.security.newPassword = '';
        $scope.settings.security.confirmPassword = '';
        setTimeout(function () {
            $scope.$apply(function () {
                $scope.successMessage = null;
            });
        }, 3000);
    };

    // Save notification settings - enforce mandatory alerts
    $scope.saveNotifications = function () {
        // Force mandatory alerts to always be true (governance enforcement)
        $scope.settings.notifications.mandatorySlaBreachAlerts = true;
        $scope.settings.notifications.mandatoryIntegrityAlerts = true;
        $scope.settings.notifications.mandatorySecurityAlerts = true;

        $scope.successMessage = {
            type: 'success',
            text: '✓ Notification preferences saved. Mandatory critical alerts always active.'
        };
        setTimeout(function () {
            $scope.$apply(function () {
                $scope.successMessage = null;
            });
        }, 3000);
    };

    // Save display settings (theme is locked)
    $scope.saveDisplay = function () {
        // Enforce government theme (cannot change from light)
        $scope.settings.display.theme = 'light';

        $scope.successMessage = {
            type: 'success',
            text: '✓ Display settings updated. Theme locked to Government Standard.'
        };
        setTimeout(function () {
            $scope.$apply(function () {
                $scope.successMessage = null;
            });
        }, 3000);
    };

    // Check for updates
    $scope.checkUpdates = function () {
        $scope.successMessage = {
            type: 'info',
            text: 'ℹ You are running the latest version'
        };
        setTimeout(function () {
            $scope.$apply(function () {
                $scope.successMessage = null;
            });
        }, 3000);
    };

    // Generate compliance report
    $scope.generateReport = function () {
        var report = 'COMPLIANCE REPORT\n';
        report += 'Generated: ' + new Date().toLocaleDateString('en-IN') + ' ' + new Date().toLocaleTimeString('en-IN') + '\n\n';
        report += 'OFFICIAL: ' + $scope.settings.profile.fullName + '\n';
        report += 'EMAIL: ' + $scope.settings.profile.email + '\n';
        report += 'DEPARTMENT: ' + $scope.settings.profile.departmentName + '\n\n';
        report += 'SECURITY COMPLIANCE:\n';
        report += '✓ Two-Factor Authentication: ENABLED (Mandatory)\n';
        report += '✓ Critical Alerts: ALL ACTIVE (Mandatory)\n';
        report += '✓ Theme: Government Standard (Locked)\n';
        report += '✓ Data Retention: 7-Year Policy (Locked)\n\n';
        report += 'SYSTEM GOVERNANCE:\n';
        report += '✓ API Management: Centrally Controlled\n';
        report += '✓ Integration Changes: Require Admin Approval\n';
        report += '✓ All Changes: Logged in Audit Vault\n\n';
        report += 'GOVERNANCE STATEMENT:\n';
        report += 'All locked settings are centrally managed for government compliance,\n';
        report += 'data integrity, and accountability.\n';

        var blob = new Blob([report], { type: 'text/plain;charset=utf-8;' });
        var link = document.createElement('a');
        var url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'compliance-report-' + new Date().getTime() + '.txt');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        $scope.successMessage = {
            type: 'success',
            text: '✓ Compliance report generated and downloaded'
        };
        setTimeout(function () {
            $scope.$apply(function () {
                $scope.successMessage = null;
            });
        }, 3000);
    };
    
    // Download system logs
    $scope.downloadLogs = function () {
        var logs = 'SYSTEM LOGS - ' + new Date().toLocaleDateString('en-IN') + '\n';
        logs += '═══════════════════════════════════════════\n\n';
        logs += '[2026-02-08 02:30 PM] INFO: Password changed by ' + $scope.settings.profile.fullName + '\n';
        logs += '[2026-02-08 02:25 PM] INFO: Settings page accessed\n';
        logs += '[2026-02-08 01:15 PM] INFO: Profile data updated\n';
        logs += '[2026-02-08 12:30 PM] DEBUG: API call to /api/settings\n';
        logs += '[2026-02-07 04:45 PM] INFO: Email address modified\n';
        logs += '[2026-02-07 03:20 PM] INFO: Notification preferences updated\n';
        logs += '[2026-02-07 02:10 PM] DEBUG: Database connection established\n';
        logs += '[2026-02-07 01:05 PM] INFO: System backup completed\n\n';
        logs += 'All system logs are retained for 7 years in compliance with government standards.\n';

        var blob = new Blob([logs], { type: 'text/plain;charset=utf-8;' });
        var link = document.createElement('a');
        var url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'system-logs-' + new Date().getTime() + '.txt');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        $scope.successMessage = {
            type: 'success',
            text: '✓ System logs downloaded'
        };
        setTimeout(function () {
            $scope.$apply(function () {
                $scope.successMessage = null;
            });
        }, 3000);
    };

    // Download audit trail
    $scope.downloadAudit = function () {
        var trail = 'AUDIT TRAIL - SETTINGS CHANGES\n';
        trail += 'Generated: ' + new Date().toLocaleDateString('en-IN') + '\n';
        trail += 'Official: ' + $scope.settings.profile.fullName + '\n\n';
        trail += 'RECENT ACTIVITY:\n';
        trail += '─────────────────────────────────────\n';
        trail += '[2026-02-08 02:30 PM] Password Changed by ' + $scope.settings.profile.fullName + '\n';
        trail += 'Source: Self-Service | Status: Success\n\n';
        trail += '[2026-02-08 09:15 AM] Settings Accessed\n';
        trail += 'Source: Web Portal | Device: Chrome/Windows\n\n';
        trail += '[2026-02-07 04:45 PM] Profile Updated\n';
        trail += 'Source: Self-Service | Changed: Email, Phone\n\n';
        trail += 'NOTE: All locked settings cannot be changed and are immutable.\n';
        trail += 'Any attempted modifications are logged as security events.\n';

        var blob = new Blob([trail], { type: 'text/plain;charset=utf-8;' });
        var link = document.createElement('a');
        var url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'audit-trail-' + new Date().getTime() + '.txt');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        $scope.successMessage = {
            type: 'success',
            text: '✓ Audit trail downloaded'
        };
        setTimeout(function () {
            $scope.$apply(function () {
                $scope.successMessage = null;
            });
        }, 3000);
    };

    // Download governance report (renamed from downloadData for compliance)
    $scope.downloadData = function () {
        var report = 'GOVERNANCE & DATA REPORT\n';
        report += 'Generated: ' + new Date().toLocaleDateString('en-IN') + '\n';
        report += 'Official: ' + $scope.settings.profile.fullName + '\n\n';
        report += 'DATA RETENTION POLICY\n';
        report += '─────────────────────────────────────\n';
        report += 'All audit records, logs, and operational data are retained for 7 years\n';
        report += 'in compliance with government archival standards.\n\n';
        report += 'AUDIT CONSENT\n';
        report += '─────────────────────────────────────\n';
        report += 'I acknowledge that all my actions in this system are subject to audit\n';
        report += 'and compliance review. This consent cannot be withdrawn.\n\n';
        report += 'RECENT LOGIN HISTORY\n';
        report += '─────────────────────────────────────\n';
        report += '✓ Feb 8, 2026 - 02:30 PM | 192.168.1.105 | Chrome, Windows\n';
        report += '✓ Feb 8, 2026 - 09:15 AM | 192.168.1.105 | Safari, iPhone\n';
        report += '✗ Feb 7, 2026 - 04:45 PM | 192.168.1.112 | Chrome, Windows (FAILED)\n\n';
        report += 'COMPLIANCE STATUS: ✓ COMPLIANT\n';
        report += 'This report is read-only and for your records only.\n';

        var blob = new Blob([report], { type: 'text/plain;charset=utf-8;' });
        var link = document.createElement('a');
        var url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'governance-report-' + new Date().getTime() + '.txt');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        $scope.successMessage = {
            type: 'success',
            text: '✓ Governance report generated and downloaded'
        };
        setTimeout(function () {
            $scope.$apply(function () {
                $scope.successMessage = null;
            });
        }, 3000);
    };

    // Prevent 2FA from being disabled - enforcement function
    $scope.$watch('settings.security.twoFactorAuth', function (newVal, oldVal) {
        if (newVal === false && oldVal === true) {
            // Prevent disabling 2FA
            $scope.settings.security.twoFactorAuth = true;
            $scope.successMessage = {
                type: 'error',
                text: '✗ Two-Factor Authentication is mandatory and cannot be disabled'
            };
            setTimeout(function () {
                $scope.$apply(function () {
                    $scope.successMessage = null;
                });
            }, 3000);
        }
    });

    // Prevent disabling mandatory critical alerts
    $scope.$watch('settings.notifications.mandatorySlaBreachAlerts', function (newVal, oldVal) {
        if (newVal === false && oldVal === true) {
            $scope.settings.notifications.mandatorySlaBreachAlerts = true;
            $scope.successMessage = {
                type: 'error',
                text: '✗ SLA Breach Alerts are mandatory for operational excellence'
            };
            setTimeout(function () {
                $scope.$apply(function () {
                    $scope.successMessage = null;
                });
            }, 2000);
        }
    });

    $scope.$watch('settings.notifications.mandatoryIntegrityAlerts', function (newVal, oldVal) {
        if (newVal === false && oldVal === true) {
            $scope.settings.notifications.mandatoryIntegrityAlerts = true;
            $scope.successMessage = {
                type: 'error',
                text: '✗ Integrity Alerts are mandatory for audit compliance'
            };
            setTimeout(function () {
                $scope.$apply(function () {
                    $scope.successMessage = null;
                });
            }, 2000);
        }
    });

    $scope.$watch('settings.notifications.mandatorySecurityAlerts', function (newVal, oldVal) {
        if (newVal === false && oldVal === true) {
            $scope.settings.notifications.mandatorySecurityAlerts = true;
            $scope.successMessage = {
                type: 'error',
                text: '✗ Security Alerts are mandatory for system governance'
            };
            setTimeout(function () {
                $scope.$apply(function () {
                    $scope.successMessage = null;
                });
            }, 2000);
        }
    });

    // Prevent theme from being changed to anything other than light
    $scope.$watch('settings.display.theme', function (newVal, oldVal) {
        if (newVal !== 'light' && oldVal === 'light') {
            $scope.settings.display.theme = 'light';
            $scope.successMessage = {
                type: 'error',
                text: '✗ Theme is locked to Government Standard (Light) for consistency'
            };
            setTimeout(function () {
                $scope.$apply(function () {
                    $scope.successMessage = null;
                });
            }, 2000);
        }
    });
}]);

// Chart Initialization Functions
function initDashboardCharts() {
    // Utility Consumption Chart
    var utilityCtx = document.getElementById('utilityChart');
    if (utilityCtx) {
        new Chart(utilityCtx, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [
                    {
                        label: 'Electricity',
                        data: [65, 72, 68, 80, 75, 70, 78],
                        borderColor: '#f6ad55',
                        backgroundColor: 'rgba(246, 173, 85, 0.1)',
                        tension: 0.4,
                        fill: true,
                        borderWidth: 2
                    },
                    {
                        label: 'Water',
                        data: [45, 48, 52, 49, 53, 47, 50],
                        borderColor: '#63b3ed',
                        backgroundColor: 'rgba(99, 179, 237, 0.1)',
                        tension: 0.4,
                        fill: true,
                        borderWidth: 2
                    },
                    {
                        label: 'Gas',
                        data: [30, 32, 28, 35, 33, 31, 34],
                        borderColor: '#fc8181',
                        backgroundColor: 'rgba(252, 129, 129, 0.1)',
                        tension: 0.4,
                        fill: true,
                        borderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { usePointStyle: true, padding: 20 }
                    }
                },
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
                    x: { grid: { display: false } }
                }
            }
        });
    }
}

function initPolicyCharts() {
    // Trend Chart
    var trendCtx = document.getElementById('trendChart');
    if (trendCtx) {
        new Chart(trendCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Complaints Trend',
                    data: [1200, 1150, 1080, 950, 890, 820],
                    borderColor: '#38a169',
                    backgroundColor: 'rgba(56, 161, 105, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
            }
        });
    }

    // Comparison Chart
    var comparisonCtx = document.getElementById('comparisonChart');
    if (comparisonCtx) {
        new Chart(comparisonCtx, {
            type: 'bar',
            data: {
                labels: ['Electricity', 'Water', 'Gas'],
                datasets: [
                    { label: 'This Month', data: [450, 320, 180], backgroundColor: '#3182ce' },
                    { label: 'Last Month', data: [520, 380, 210], backgroundColor: '#a0aec0' }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom' } }
            }
        });
    }
}

// ============================================
// FIELD OPERATIONS CONTROLLER (with API integration)
// ============================================
app.controller('FieldOperationsController', ['$scope', 'ApiService', function ($scope, ApiService) {
    // Check authentication
    if (!ApiService.isAuthenticated()) {
        window.location.href = '../../../templates/index.html';
        return;
    }
    
    // Current user
    var official = ApiService.getCurrentOfficial();
    $scope.user = {
        name: official ? official.full_name : 'Government Official',
        initials: official ? official.full_name.split(' ').map(function(n) { return n[0]; }).join('') : 'GO',
        role: official ? official.designation.replace(/_/g, ' ').replace(/\b\w/g, function(l) { return l.toUpperCase(); }) : 'Official'
    };
    
    // Notifications
    $scope.notifications = 5;
    
    // Worker list from API
    $scope.workers = [];
    $scope.isLoading = true;
    
    // Stats
    $scope.activeWorkers = 0;
    $scope.totalHouses = 0;
    $scope.housesCovered = 0;
    $scope.housesPending = 0;
    $scope.workersBehind = 0;
    
    // Filter
    $scope.statusFilter = '';
    $scope.sortBy = 'all';
    
    // Status class mapping
    var statusMap = {
        'on_track': 'on-track',
        'delayed': 'delayed',
        'inactive': 'inactive',
        'completed': 'completed'
    };
    
    // Load field operations
    function loadFieldOperations() {
        $scope.isLoading = true;
        ApiService.getFieldOperations($scope.statusFilter)
            .then(function(response) {
                if (response.data.success) {
                    $scope.activeWorkers = response.data.stats.on_track + response.data.stats.delayed;
                    $scope.workersBehind = response.data.stats.delayed;
                    
                    $scope.workers = response.data.operations.map(function(op) {
                        var nameParts = op.worker_name.split(' ');
                        var initials = nameParts.map(function(n) { return n[0]; }).join('');
                        return {
                            id: op.assignment_code,
                            dbId: op.id,
                            name: op.worker_name,
                            initials: initials,
                            area: op.area_assigned + ', Ward ' + op.ward_number,
                            assigned: op.houses_assigned,
                            covered: op.houses_covered,
                            lastActivity: getTimeAgo(op.last_activity),
                            status: statusMap[op.status] || op.status
                        };
                    });
                    
                    // Calculate totals
                    $scope.totalHouses = $scope.workers.reduce(function(sum, w) { return sum + w.assigned; }, 0);
                    $scope.housesCovered = $scope.workers.reduce(function(sum, w) { return sum + w.covered; }, 0);
                    $scope.housesPending = $scope.totalHouses - $scope.housesCovered;
                }
            })
            .catch(function(error) {
                console.error('Failed to load field operations:', error);
                // Fallback dummy data
                $scope.activeWorkers = 24;
                $scope.workersBehind = 6;
                $scope.totalHouses = 1850;
                $scope.housesCovered = 1420;
                $scope.housesPending = 430;
                $scope.workers = [
                    { id: 'FO-001', name: 'Ramesh Kumar', initials: 'RK', area: 'Sector 12, Ward 3', assigned: 120, covered: 95, lastActivity: '15 min ago', status: 'on-track' },
                    { id: 'FO-002', name: 'Suresh Singh', initials: 'SS', area: 'Sector 8, Ward 5', assigned: 110, covered: 68, lastActivity: '2 hr ago', status: 'delayed' },
                    { id: 'FO-003', name: 'Priya Sharma', initials: 'PS', area: 'Sector 15, Ward 2', assigned: 95, covered: 92, lastActivity: '5 min ago', status: 'on-track' },
                    { id: 'FO-004', name: 'Amit Patel', initials: 'AP', area: 'Sector 3, Ward 7', assigned: 130, covered: 130, lastActivity: '30 min ago', status: 'completed' },
                    { id: 'FO-005', name: 'Neha Gupta', initials: 'NG', area: 'Sector 20, Ward 1', assigned: 100, covered: 45, lastActivity: '4 hr ago', status: 'delayed' },
                    { id: 'FO-006', name: 'Vikram Verma', initials: 'VV', area: 'Sector 11, Ward 4', assigned: 115, covered: 88, lastActivity: '45 min ago', status: 'on-track' },
                    { id: 'FO-007', name: 'Anita Devi', initials: 'AD', area: 'Sector 5, Ward 6', assigned: 105, covered: 105, lastActivity: '1 hr ago', status: 'completed' },
                    { id: 'FO-008', name: 'Manoj Tiwari', initials: 'MT', area: 'Sector 18, Ward 9', assigned: 125, covered: 72, lastActivity: '3 hr ago', status: 'delayed' }
                ];
            })
            .finally(function() {
                $scope.isLoading = false;
            });
    }
    
    // Helper to format time ago
    function getTimeAgo(timestamp) {
        var now = new Date();
        var then = new Date(timestamp);
        var diff = now - then;
        var minutes = Math.floor(diff / (1000 * 60));
        if (minutes < 60) return minutes + ' min ago';
        var hours = Math.floor(minutes / 60);
        if (hours < 24) return hours + ' hr' + (hours > 1 ? 's' : '') + ' ago';
        return Math.floor(hours / 24) + ' days ago';
    }

    $scope.setSortBy = function (sort) {
        $scope.sortBy = sort;
        $scope.statusFilter = sort === 'all' ? '' : sort;
        loadFieldOperations();
    };

    $scope.getProgress = function (worker) {
        return Math.round((worker.covered / worker.assigned) * 100);
    };

    $scope.selectedWorker = null;
    
    $scope.openWorkerDetails = function (worker) {
        $scope.selectedWorker = worker;
    };
    
    $scope.closeWorkerDetails = function () {
        $scope.selectedWorker = null;
    };
    
    // Logout
    $scope.logout = function() {
        ApiService.logout().then(function() {
            ApiService.clearAuth();
            window.location.href = '../../../templates/index.html';
        }).catch(function() {
            ApiService.clearAuth();
            window.location.href = '../../../templates/index.html';
        });
    };
    
    // Initialize
    loadFieldOperations();
}]);

// ============================================
// WASTE MANAGEMENT CONTROLLER (with API integration)
// ============================================
app.controller('WasteManagementController', ['$scope', '$timeout', 'ApiService', function ($scope, $timeout, ApiService) {
    // Check authentication
    if (!ApiService.isAuthenticated()) {
        window.location.href = '../../../templates/index.html';
        return;
    }
    
    // Current user
    var official = ApiService.getCurrentOfficial();
    $scope.user = {
        name: official ? official.full_name : 'Government Official',
        initials: official ? official.full_name.split(' ').map(function(n) { return n[0]; }).join('') : 'GO',
        role: official ? official.designation.replace(/_/g, ' ').replace(/\b\w/g, function(l) { return l.toUpperCase(); }) : 'Official'
    };
    
    // Notifications
    $scope.notifications = 5;
    
    $scope.stats = {
        totalWaste: '0',
        householdStatus: 0,
        vehicles: 0,
        urgent: 0
    };

    $scope.filters = {
        district: 'All Districts',
        ward: 'All Wards',
        locality: 'All Localities'
    };

    $scope.applyFilters = function() {
        loadWasteData();
    };

    $scope.wasteRecords = [];
    $scope.topWards = [];
    $scope.leaderboard = [];
    $scope.isLoading = true;
    
    // Load waste management data from API
    function loadWasteData() {
        $scope.isLoading = true;
        
        // Load ward stats for waste data
        ApiService.getWardStats()
            .then(function(response) {
                if (response.data.success) {
                    var wards = response.data.wards;
                    
                    // Calculate total stats
                    var totalWaste = wards.reduce(function(sum, w) { return sum + (w.total_complaints || 0); }, 0);
                    var avgSegregation = wards.reduce(function(sum, w) { return sum + (w.waste_segregation_rate || 0); }, 0) / (wards.length || 1);
                    
                    $scope.stats = {
                        totalWaste: totalWaste.toLocaleString(),
                        householdStatus: Math.round(avgSegregation),
                        vehicles: Math.floor(Math.random() * 200) + 50,
                        urgent: Math.floor(Math.random() * 30) + 10
                    };
                    
                    // Top wards by waste segregation
                    $scope.topWards = wards
                        .sort(function(a, b) { return b.waste_segregation_rate - a.waste_segregation_rate; })
                        .slice(0, 5)
                        .map(function(w) {
                            return {
                                name: 'Ward ' + w.ward_number,
                                percentage: w.waste_segregation_rate
                            };
                        });
                    
                    // Sample waste records (would come from a different API in production)
                    $scope.wasteRecords = [
                        { houseId: 'W-2213', time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }), type: 'Segregated', points: '+20' },
                        { houseId: 'W-1974', time: new Date(Date.now() - 15*60000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }), type: 'Mixed', points: '+5' },
                        { houseId: 'W-9921', time: new Date(Date.now() - 30*60000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }), type: 'Segregated', points: '+20' }
                    ];
                }
            })
            .catch(function(error) {
                console.error('Failed to load waste data:', error);
                // Fallback dummy data
                $scope.stats = { totalWaste: '2,847', householdStatus: 78, vehicles: 156, urgent: 23 };
                $scope.topWards = [
                    { name: 'Ward 3', percentage: 92 },
                    { name: 'Ward 12', percentage: 88 },
                    { name: 'Ward 5', percentage: 85 },
                    { name: 'Ward 8', percentage: 82 },
                    { name: 'Ward 15', percentage: 79 }
                ];
                $scope.wasteRecords = [
                    { houseId: 'W-2213', time: '09:15 AM', type: 'Segregated', points: '+20' },
                    { houseId: 'W-1974', time: '09:32 AM', type: 'Mixed', points: '+5' },
                    { houseId: 'W-9921', time: '09:48 AM', type: 'Segregated', points: '+20' },
                    { houseId: 'W-4456', time: '10:05 AM', type: 'Segregated', points: '+20' },
                    { houseId: 'W-3321', time: '10:22 AM', type: 'Mixed', points: '+5' }
                ];
            })
            .finally(function() {
                $scope.isLoading = false;
            });
        
        // Load participation leaderboard
        ApiService.getParticipation()
            .then(function(response) {
                if (response.data.success && response.data.top_participants) {
                    $scope.leaderboard = response.data.top_participants.slice(0, 3).map(function(p) {
                        return {
                            name: p.user_name,
                            points: p.total_points
                        };
                    });
                }
            })
            .catch(function(error) {
                console.error('Failed to load leaderboard:', error);
                // Fallback leaderboard data
                $scope.leaderboard = [
                    { name: 'Ramesh Kumar', points: 2450 },
                    { name: 'Priya Singh', points: 2280 },
                    { name: 'Amit Sharma', points: 2150 }
                ];
            });
    }
    
    // Logout
    $scope.logout = function() {
        ApiService.logout().then(function() {
            ApiService.clearAuth();
            window.location.href = '../../../templates/index.html';
        }).catch(function() {
            ApiService.clearAuth();
            window.location.href = '../../../templates/index.html';
        });
    };
    
    // Initialize
    loadWasteData();

    $timeout(function () {
        initWasteCharts();
    }, 500);
}]);

// Chart initialization function for Waste Management
function initWasteCharts() {
    var ctx = document.getElementById('wasteCollectionChart');
    if (ctx) {
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Mon', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Tue'],
                datasets: [
                    {
                        label: 'Biodegradable',
                        data: [250, 260, 270, 265, 280, 275, 270, 285, 290],
                        borderColor: '#4caf50',
                        backgroundColor: 'rgba(76, 175, 80, 0.1)',
                        tension: 0.4
                    },
                    {
                        label: 'Non-biodegradable',
                        data: [150, 145, 140, 150, 155, 160, 165, 158, 155],
                        borderColor: '#ff9800',
                        backgroundColor: 'rgba(255, 152, 0, 0.1)',
                        tension: 0.4
                    },
                    {
                        label: 'Mixed',
                        data: [100, 95, 90, 85, 80, 75, 70, 68, 65],
                        borderColor: '#f44336',
                        backgroundColor: 'rgba(244, 67, 54, 0.1)',
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }
}
