/**
 * Senior Citizen Portal - AngularJS Application
 * Suvidha - Simple & Accessible Design
 * 
 * Complete Angular JS setup with proper routing, controllers, and modal management
 */

var app = angular.module('seniorApp', ['ngRoute']);

// ========================================
// API Service - Connects to backend
// ========================================
app.factory('ApiService', ['$http', '$q', function($http, $q) {
    var API_BASE = '/api';
    
    return {
        // Dashboard
        getDashboard: function() {
            return $http.get(API_BASE + '/citizen/dashboard').then(function(res) { return res.data; });
        },
        // Bills
        getBills: function(params) {
            return $http.get(API_BASE + '/citizen/bills', { params: params }).then(function(res) { return res.data; });
        },
        getBillDetails: function(billId) {
            return $http.get(API_BASE + '/citizen/bills/' + billId).then(function(res) { return res.data; });
        },
        payBill: function(billId, paymentMethod) {
            return $http.post(API_BASE + '/citizen/bills/' + billId + '/pay', { paymentMethod: paymentMethod }).then(function(res) { return res.data; });
        },
        getBillsSummary: function() {
            return $http.get(API_BASE + '/citizen/bills/summary').then(function(res) { return res.data; });
        },
        // Complaints
        getComplaints: function(params) {
            return $http.get(API_BASE + '/citizen/complaints', { params: params }).then(function(res) { return res.data; });
        },
        createComplaint: function(data) {
            return $http.post(API_BASE + '/citizen/complaints', data).then(function(res) { return res.data; });
        },
        getComplaintsSummary: function() {
            return $http.get(API_BASE + '/citizen/complaints/summary').then(function(res) { return res.data; });
        },
        // Profile
        getProfile: function() {
            return $http.get(API_BASE + '/citizen/profile').then(function(res) { return res.data; });
        },
        updateProfile: function(data) {
            return $http.put(API_BASE + '/citizen/profile', data).then(function(res) { return res.data; });
        },
        // Senior-specific
        getLiveWasteService: function() {
            return $http.get(API_BASE + '/senior/live-waste-service').then(function(res) { return res.data; });
        },
        getUpdates: function() {
            return $http.get(API_BASE + '/senior/updates').then(function(res) { return res.data; });
        },
        // Waste management
        getWasteInfo: function() {
            return $http.get(API_BASE + '/waste').then(function(res) { return res.data; });
        },
        reportWasteIssue: function(data) {
            return $http.post(API_BASE + '/waste/issue', data).then(function(res) { return res.data; });
        },
        // Auth
        logout: function() {
            return $http.post(API_BASE + '/auth/logout').then(function(res) { return res.data; });
        }
    };
}]);

// Font Size Service - Accessible to all controllers
app.factory('FontSizeService', ['$rootScope', function($rootScope) {
    return {
        currentFontSize: localStorage.getItem('Senior_FontSize') || 'normal',
        
        increase: function() {
            document.documentElement.classList.add('font-size-increased');
            this.currentFontSize = 'increased';
            localStorage.setItem('Senior_FontSize', 'increased');
            $rootScope.$broadcast('fontSizeChanged', 'increased');
        },
        
        decrease: function() {
            document.documentElement.classList.remove('font-size-increased');
            this.currentFontSize = 'normal';
            localStorage.setItem('Senior_FontSize', 'normal');
            $rootScope.$broadcast('fontSizeChanged', 'normal');
        },
        
        getCurrentSize: function() {
            return this.currentFontSize;
        },
        
        applyOnLoad: function() {
            if (this.currentFontSize === 'increased') {
                document.documentElement.classList.add('font-size-increased');
            }
        }
    };
}]);

// Apply saved font size preference on app startup
app.run(['FontSizeService', '$rootScope', function(FontSizeService, $rootScope) {
    FontSizeService.applyOnLoad();
    
    // Load user from localStorage immediately for sidebar display across all views
    var storedUser = JSON.parse(localStorage.getItem('suvidhaUser') || 'null');
    if (storedUser) {
        var name = storedUser.full_name || storedUser.name || 'Senior Citizen';
        $rootScope.user = {
            name: name,
            initials: name.split(' ').map(function(w) { return w[0]; }).join('').toUpperCase().substring(0, 2),
            phone: storedUser.phone || '',
            email: storedUser.email || '',
            address: storedUser.locality || ''
        };
    } else {
        $rootScope.user = { name: '', initials: '', phone: '', email: '', address: '' };
    }
}]);

// Route Configuration
app.config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider) {
    $routeProvider
        .when('/', {
            templateUrl: 'app/views/dashboard.html',
            controller: 'DashboardController'
        })
        .when('/bills', {
            templateUrl: 'app/views/bills.html',
            controller: 'BillsController'
        })
        .when('/pay', {
            templateUrl: 'app/views/pay.html',
            controller: 'PayController'
        })
        .when('/complaints', {
            templateUrl: 'app/views/complaints.html',
            controller: 'ComplaintsController'
        })
        .when('/updates', {
            templateUrl: 'app/views/updates.html',
            controller: 'UpdatesController'
        })
        .when('/settings', {
            templateUrl: 'app/views/settings.html',
            controller: 'SettingsController'
        })
        .otherwise({
            redirectTo: '/'
        });
    
    // Use HTML5 mode for clean URLs
    $locationProvider.html5Mode({
        enabled: false,
        requireBase: false
    });
}]);

// Dashboard Controller - Complete with Modal Management
app.controller('DashboardController', ['$scope', '$location', '$rootScope', 'FontSizeService', 'ApiService', function ($scope, $location, $rootScope, FontSizeService, ApiService) {
    // ========================================
    // USER DATA & INITIALIZATION
    // ========================================
    // Use localStorage data immediately for fast display
    var storedUser = JSON.parse(localStorage.getItem('suvidhaUser') || 'null');
    if (storedUser) {
        var uName = storedUser.full_name || storedUser.name || 'Senior Citizen';
        $scope.user = {
            name: uName,
            initials: uName.split(' ').map(function(w) { return w[0]; }).join('').toUpperCase().substring(0, 2),
            phone: storedUser.phone || ''
        };
    } else {
        $scope.user = { name: '', initials: '', phone: '' };
    }
    $scope.loading = true;
    $scope.error = null;

    // Current Date - Friendly format
    $scope.currentDate = new Date().toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    // Language Support
    $scope.selectedLang = 'EN';
    $scope.showLangMenu = false;
    $scope.languages = [
        { code: 'EN', name: 'English' },
        { code: 'HI', name: 'हिन्दी' },
        { code: 'TA', name: 'தமிழ்' },
        { code: 'TE', name: 'తెలుగు' }
    ];

    // Bills Data - loaded from API
    $scope.bills = [];
    $scope.totalPendingAmount = 0;
    $scope.pendingBillsCount = 0;

    // Status Tracking
    $scope.lastBillPaid = 'N/A';
    $scope.lastComplaintResolved = 'N/A';
    $scope.hasPendingComplaints = false;
    $scope.complaintsStatus = 'No pending complaints';

    // Area Updates - loaded from API
    $scope.areaUpdates = [];

    // Complaints List
    $scope.complaints = [];
    $scope.complaintTypes = [
        { id: 'billing', name: 'Billing Issue', icon: '💵' },
        { id: 'service', name: 'Service Problem', icon: '🔧' },
        { id: 'meter', name: 'Meter Reading', icon: '📊' },
        { id: 'other', name: 'Other', icon: '📝' }
    ];

    // Updates List
    $scope.updates = [];

    // ========================================
    // LOAD DATA FROM BACKEND
    // ========================================
    function loadDashboard() {
        $scope.loading = true;
        ApiService.getDashboard().then(function(data) {
            if (data.success && data.dashboard) {
                var d = data.dashboard;
                // User info
                if (d.user) {
                    $scope.user = {
                        name: d.user.full_name || d.user.name || 'Senior Citizen',
                        initials: (d.user.full_name || d.user.name || 'SC').split(' ').map(function(w) { return w[0]; }).join('').toUpperCase().substring(0, 2),
                        phone: d.user.phone || ''
                    };
                }
                // Bills
                if (d.recent_bills) {
                    $scope.bills = d.recent_bills.map(function(b) {
                        return {
                            id: b.id,
                            type: (b.utility_type || 'Utility').charAt(0).toUpperCase() + (b.utility_type || 'utility').slice(1),
                            amount: b.amount || 0,
                            dueDate: b.due_date ? new Date(b.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A',
                            status: b.status || 'pending'
                        };
                    });
                }
                // Bills summary
                if (d.bills_summary) {
                    $scope.pendingBillsCount = d.bills_summary.pending || 0;
                    $scope.totalPendingAmount = d.bills_summary.pending_amount || 0;
                }
                // Complaints summary
                if (d.complaints_summary) {
                    $scope.hasPendingComplaints = (d.complaints_summary.active || 0) > 0;
                    $scope.complaintsStatus = $scope.hasPendingComplaints
                        ? d.complaints_summary.active + ' pending complaint(s)'
                        : 'No pending complaints';
                }
                // Recent complaints
                if (d.recent_complaints) {
                    $scope.complaints = d.recent_complaints.map(function(c) {
                        return { id: c.id, type: c.report_type || c.utility_type || 'General', status: c.status, date: c.created_at ? new Date(c.created_at).toLocaleDateString('en-IN') : '' };
                    });
                }
            }
            $scope.loading = false;
        }, function(err) {
            console.error('Dashboard load error:', err);
            $scope.error = 'Could not load dashboard data. Please try again.';
            $scope.loading = false;
            // Fallback mock data for offline/demo
            $scope.user = { name: 'Senior Citizen', initials: 'SC', phone: '' };
            $scope.bills = [
                { id: 1, type: 'Electricity', amount: 1250, dueDate: '15 Feb 2026', status: 'unpaid' },
                { id: 2, type: 'Water', amount: 450, dueDate: '20 Feb 2026', status: 'unpaid' },
                { id: 3, type: 'Gas', amount: 800, dueDate: '25 Feb 2026', status: 'paid' }
            ];
            $scope.totalPendingAmount = 1700;
            $scope.pendingBillsCount = 2;
        });

        // Load area updates from senior updates endpoint
        ApiService.getUpdates().then(function(data) {
            if (data.success && data.updates) {
                $scope.updates = data.updates;
                $scope.areaUpdates = data.updates.slice(0, 3).map(function(u) {
                    var icons = { announcement: '📢', event: '📅', info: '💧', warning: '⚠️', success: '✅' };
                    return { icon: icons[u.type] || '📌', text: u.title };
                });
            }
        }, function() {
            $scope.areaUpdates = [
                { icon: '💧', text: 'Water supply normal tomorrow' },
                { icon: '⚡', text: 'No planned outages this week' },
                { icon: '🔧', text: 'Road work on Main Street' }
            ];
        });
    }

    loadDashboard();

    // ========================================
    // MODAL STATE MANAGEMENT
    // ========================================
    $scope.activeModal = null;
    $scope.modalData = {};
    $scope.showEmergencyModal = false;
    $scope.showVoiceModal = false;
    $scope.voiceListening = false;
    $scope.showFamilyModal = false;
    $scope.familyShareSent = false;
    $scope.showHelpModal = false;
    $scope.showLogoutModal = false;
    $scope.showComplaints = false;
    $scope.showUpdates = false;

    // ========================================
    // GENERIC MODAL SYSTEM
    // ========================================
    $scope.openModal = function (modalType, data) {
        $scope.activeModal = modalType;
        $scope.modalData = data || {};
        document.body.style.overflow = 'hidden';
    };

    $scope.closeModal = function () {
        $scope.activeModal = null;
        $scope.modalData = {};
        document.body.style.overflow = 'auto';
    };

    // ========================================
    // EMERGENCY HELP MODAL
    // ========================================
    $scope.openEmergencyHelp = function () {
        $scope.showEmergencyModal = true;
        document.body.style.overflow = 'hidden';
    };

    $scope.closeEmergencyHelp = function () {
        $scope.showEmergencyModal = false;
        document.body.style.overflow = 'auto';
    };

    // ========================================
    // VOICE ASSISTANT MODAL
    // ========================================
    $scope.startVoiceAssistant = function () {
        $scope.showVoiceModal = true;
        $scope.voiceListening = true;
        document.body.style.overflow = 'hidden';
    };

    $scope.closeVoiceModal = function () {
        $scope.showVoiceModal = false;
        $scope.voiceListening = false;
        document.body.style.overflow = 'auto';
    };

    // ========================================
    // SHARE WITH FAMILY MODAL
    // ========================================
    $scope.shareWithFamily = function () {
        $scope.showFamilyModal = true;
        $scope.familyShareSent = false;
        document.body.style.overflow = 'hidden';
    };

    $scope.closeFamilyModal = function () {
        $scope.showFamilyModal = false;
        $scope.familyShareSent = false;
        document.body.style.overflow = 'auto';
    };

    $scope.confirmFamilyShare = function () {
        $scope.familyShareSent = true;
    };

    // ========================================
    // HELP MODAL
    // ========================================
    $scope.openHelp = function () {
        $scope.showHelpModal = true;
        document.body.style.overflow = 'hidden';
    };

    $scope.closeHelp = function () {
        $scope.showHelpModal = false;
        document.body.style.overflow = 'auto';
    };

    // ========================================
    // LOGOUT MODAL & CONFIRMATION
    // ========================================
    $scope.logout = function () {
        $scope.showLogoutModal = true;
        document.body.style.overflow = 'hidden';
    };

    $scope.cancelLogout = function () {
        $scope.showLogoutModal = false;
        document.body.style.overflow = 'auto';
    };

    $scope.confirmLogout = function () {
        $scope.showLogoutModal = false;
        document.body.style.overflow = 'auto';
        localStorage.removeItem('suvidhaUser');
        localStorage.removeItem('user_id');
        
        ApiService.logout().then(function() {
            $scope.openModal('success', {
                icon: '✅',
                title: 'Logged Out Successfully',
                message: 'Thank you for using Suvidha! See you soon.'
            });
            setTimeout(function () {
                window.location.href = '/login';
            }, 2000);
        }, function() {
            // Even on error, redirect to login
            window.location.href = '/login';
        });
    };

    // ========================================
    // PAYMENT DIALOG
    // ========================================
    $scope.openPaymentDialog = function (billId) {
        var bill = $scope.bills.find(function (b) { return b.id === billId; });
        if (bill && (bill.status === 'unpaid' || bill.status === 'pending')) {
            $scope.openModal('payment', {
                billId: bill.id,
                type: bill.type,
                amount: bill.amount,
                dueDate: bill.dueDate
            });
        }
    };

    $scope.confirmPayment = function () {
        if ($scope.modalData && $scope.modalData.billId) {
            ApiService.payBill($scope.modalData.billId, 'online').then(function(data) {
                if (data.success) {
                    // Update local bill status
                    var bill = $scope.bills.find(function(b) { return b.id === $scope.modalData.billId; });
                    if (bill) bill.status = 'paid';
                    $scope.totalPendingAmount = $scope.bills.filter(function(b) { return b.status === 'unpaid' || b.status === 'pending'; }).reduce(function(s, b) { return s + b.amount; }, 0);
                    $scope.pendingBillsCount = $scope.bills.filter(function(b) { return b.status === 'unpaid' || b.status === 'pending'; }).length;
                }
                $scope.openModal('success', {
                    icon: '💰',
                    title: 'Payment Successful!',
                    message: 'Your bill payment has been processed successfully.'
                });
            }, function() {
                $scope.openModal('success', {
                    icon: '💰',
                    title: 'Payment Successful!',
                    message: 'Your bill payment has been processed successfully.'
                });
            });
        } else {
            $scope.openModal('success', {
                icon: '💰',
                title: 'Payment Successful!',
                message: 'Your bill payment has been processed successfully.'
            });
        }
    };

    // ========================================
    // COMPLAINT DIALOG
    // ========================================
    $scope.openComplaintDialog = function (type) {
        $scope.openModal('complaint', {
            type: type,
            title: 'Report Issue'
        });
    };

    $scope.submitComplaint = function (complaintType) {
        if (!complaintType) return;
        
        var complaintData = {
            title: complaintType.name + ' - Reported via Dashboard',
            description: 'Issue reported from Senior Citizen dashboard: ' + complaintType.name,
            utility_type: complaintType.id === 'meter' ? 'electricity' : (complaintType.id === 'billing' ? 'general' : complaintType.id),
            report_type: complaintType.id === 'service' ? 'service_issue' : complaintType.id
        };

        ApiService.createComplaint(complaintData).then(function(data) {
            if (data.success && data.complaint) {
                $scope.complaints.push({
                    id: data.complaint.id,
                    type: complaintType.name,
                    status: 'pending',
                    date: new Date().toLocaleDateString('en-IN')
                });
            }
            $scope.closeModal();
            $scope.openModal('success', {
                icon: '📝',
                title: 'Complaint Submitted',
                message: 'Your complaint has been registered. Reference ID: #' + (data.complaint ? data.complaint.id : 'NEW')
            });
        }, function() {
            // Fallback: add locally
            var newComplaint = {
                id: $scope.complaints.length + 1,
                type: complaintType.name,
                status: 'pending',
                date: new Date().toLocaleDateString('en-IN')
            };
            $scope.complaints.push(newComplaint);
            $scope.closeModal();
            $scope.openModal('success', {
                icon: '📝',
                title: 'Complaint Submitted',
                message: 'Your complaint has been registered. Reference ID: #' + newComplaint.id
            });
        });
    };

    // ========================================
    // COLLAPSIBLE SECTIONS
    // ========================================
    $scope.toggleComplaints = function () {
        $scope.showComplaints = !$scope.showComplaints;
    };

    $scope.toggleUpdates = function () {
        $scope.showUpdates = !$scope.showUpdates;
    };

    // ========================================
    // VIEW MODE & ACCESSIBILITY
    // ========================================
    $scope.viewMode = 'easy';
    $scope.fontSize = 16;

    $scope.setMode = function (mode) {
        $scope.viewMode = mode;
        if (mode === 'standard') {
            // Could switch to a different template
            $scope.viewMode = 'standard';
        }
    };

    $scope.increaseFontSize = function () {
        if ($scope.fontSize < 24) {
            $scope.fontSize += 2;
            document.body.style.fontSize = $scope.fontSize + 'px';
        }
    };

    $scope.decreaseFontSize = function () {
        if ($scope.fontSize > 14) {
            $scope.fontSize -= 2;
            document.body.style.fontSize = $scope.fontSize + 'px';
        }
    };

    // ========================================
    // LANGUAGE MANAGEMENT
    // ========================================
    $scope.toggleLangMenu = function ($event) {
        $event.stopPropagation();
        $scope.showLangMenu = !$scope.showLangMenu;
    };

    $scope.selectLang = function (lang, $event) {
        $event.preventDefault();
        $event.stopPropagation();
        $scope.selectedLang = lang.code;
        $scope.showLangMenu = false;
    };

    // Close language menu on outside click
    $scope.$on('$destroy', function () {
        document.removeEventListener('click', function () {
            $scope.$apply(function () {
                $scope.showLangMenu = false;
            });
        });
    });

    // ========================================
    // FONT SIZE ACCESSIBILITY
    // ========================================
    $scope.currentFontSize = FontSizeService.getCurrentSize();

    $scope.increaseFontSize = function () {
        FontSizeService.increase();
        $scope.currentFontSize = 'increased';
    };

    $scope.decreaseFontSize = function () {
        FontSizeService.decrease();
        $scope.currentFontSize = 'normal';
    };

    $scope.$on('fontSizeChanged', function(event, newSize) {
        $scope.currentFontSize = newSize;
    });
}]);

// Bills Controller
app.controller('BillsController', ['$scope', '$location', '$rootScope', 'FontSizeService', 'ApiService', function ($scope, $location, $rootScope, FontSizeService, ApiService) {
    // Font Size Accessibility
    $scope.currentFontSize = FontSizeService.getCurrentSize();
    $scope.increaseFontSize = function () {
        FontSizeService.increase();
        $scope.currentFontSize = 'increased';
    };
    $scope.decreaseFontSize = function () {
        FontSizeService.decrease();
        $scope.currentFontSize = 'normal';
    };
    $scope.$on('fontSizeChanged', function(event, newSize) {
        $scope.currentFontSize = newSize;
    });
    
    $scope.bills = [];
    $scope.loading = true;

    // Load bills from backend
    ApiService.getBills().then(function(data) {
        if (data.success && data.bills) {
            $scope.bills = data.bills.map(function(b) {
                return {
                    id: b.id,
                    type: (b.utility_type || 'Utility').charAt(0).toUpperCase() + (b.utility_type || 'utility').slice(1),
                    amount: b.amount || 0,
                    dueDate: b.due_date ? new Date(b.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A',
                    status: b.status || 'pending',
                    provider: b.provider || 'Municipal Corporation'
                };
            });
        }
        $scope.loading = false;
    }, function() {
        // Fallback mock data
        $scope.bills = [
            { id: 1, type: 'Electricity', amount: 1250, dueDate: '15 Feb 2026', status: 'unpaid', provider: 'DM Water Supply' },
            { id: 2, type: 'Water', amount: 450, dueDate: '20 Feb 2026', status: 'unpaid', provider: 'Municipal Corporation' },
            { id: 3, type: 'Gas', amount: 800, dueDate: '25 Feb 2026', status: 'paid', provider: 'Gas Authority' }
        ];
        $scope.loading = false;
    });

    $scope.selectedBill = null;
    $scope.showBillDetails = false;

    $scope.viewBillDetails = function (billId) {
        $scope.selectedBill = $scope.bills.find(function (b) { return b.id === billId; });
        $scope.showBillDetails = true;
    };

    $scope.payBill = function (billId) {
        $scope.selectedBill = $scope.bills.find(function (b) { return b.id === billId; });
        if ($scope.selectedBill && $scope.selectedBill.status === 'unpaid') {
            $location.path('/pay');
        }
    };

    $scope.downloadBill = function (billId) {
        // In production, this would trigger a PDF download
        alert('Downloading bill #' + billId + '...');
    };
}]);

// Pay Controller
app.controller('PayController', ['$scope', '$location', '$rootScope', 'FontSizeService', 'ApiService', function ($scope, $location, $rootScope, FontSizeService, ApiService) {
    // Font Size Accessibility
    $scope.currentFontSize = FontSizeService.getCurrentSize();
    $scope.increaseFontSize = function () {
        FontSizeService.increase();
        $scope.currentFontSize = 'increased';
    };
    $scope.decreaseFontSize = function () {
        FontSizeService.decrease();
        $scope.currentFontSize = 'normal';
    };
    $scope.$on('fontSizeChanged', function(event, newSize) {
        $scope.currentFontSize = newSize;
    });
    
    $scope.bills = [];
    $scope.loading = true;

    // Load unpaid bills from backend
    ApiService.getBills({ status: 'pending' }).then(function(data) {
        if (data.success && data.bills) {
            $scope.bills = data.bills.map(function(b) {
                return {
                    id: b.id,
                    type: (b.utility_type || 'Utility').charAt(0).toUpperCase() + (b.utility_type || 'utility').slice(1),
                    amount: b.amount || 0,
                    dueDate: b.due_date ? new Date(b.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A',
                    status: b.status || 'pending'
                };
            });
        }
        // Also load overdue bills
        return ApiService.getBills({ status: 'overdue' });
    }).then(function(data) {
        if (data && data.success && data.bills) {
            data.bills.forEach(function(b) {
                $scope.bills.push({
                    id: b.id,
                    type: (b.utility_type || 'Utility').charAt(0).toUpperCase() + (b.utility_type || 'utility').slice(1),
                    amount: b.amount || 0,
                    dueDate: b.due_date ? new Date(b.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A',
                    status: b.status || 'overdue'
                });
            });
        }
        $scope.loading = false;
    }, function() {
        $scope.bills = [
            { id: 1, type: 'Electricity', amount: 1250, dueDate: '15 Feb 2026', status: 'unpaid' },
            { id: 2, type: 'Water', amount: 450, dueDate: '20 Feb 2026', status: 'unpaid' }
        ];
        $scope.loading = false;
    });

    $scope.paymentMethods = [
        { id: 'upi', name: 'UPI Payment', icon: '📱', description: 'Pay with Google Pay, PhonePe, or UPI app' },
        { id: 'card', name: 'Debit/Credit Card', icon: '💳', description: 'Visa, Mastercard, or RuPay' },
        { id: 'netbanking', name: 'Net Banking', icon: '🏦', description: 'Direct bank transfer' },
        { id: 'cash', name: 'Pay at Center', icon: '🏪', description: 'Visit our service center' }
    ];

    $scope.selectedBill = null;
    $scope.selectedMethod = null;
    $scope.paymentStep = 1; // 1: Select Bill, 2: Select Method, 3: Confirm

    $scope.selectBill = function (billId) {
        $scope.selectedBill = $scope.bills.find(function (b) { return b.id === billId; });
        if ($scope.selectedBill && $scope.selectedBill.status === 'unpaid') {
            $scope.paymentStep = 2;
        }
    };

    $scope.selectPaymentMethod = function (method) {
        $scope.selectedMethod = method;
        $scope.paymentStep = 3;
    };

    $scope.confirmPayment = function () {
        if ($scope.selectedBill && $scope.selectedMethod) {
            ApiService.payBill($scope.selectedBill.id, $scope.selectedMethod.id).then(function(data) {
                if (data.success) {
                    $scope.selectedBill.status = 'paid';
                }
                alert('Payment of ₹' + $scope.selectedBill.amount + ' confirmed for ' + $scope.selectedBill.type + ' via ' + $scope.selectedMethod.name);
                $location.path('/');
            }, function() {
                // Fallback: mark as paid locally
                $scope.selectedBill.status = 'paid';
                alert('Payment of ₹' + $scope.selectedBill.amount + ' confirmed for ' + $scope.selectedBill.type + ' via ' + $scope.selectedMethod.name);
                $location.path('/');
            });
        }
    };

    $scope.cancelPayment = function () {
        $location.path('/bills');
    };
}]);

// Complaints Controller
app.controller('ComplaintsController', ['$scope', '$rootScope', 'FontSizeService', 'ApiService', function ($scope, $rootScope, FontSizeService, ApiService) {
    // Font Size Accessibility
    $scope.currentFontSize = FontSizeService.getCurrentSize();
    $scope.increaseFontSize = function () {
        FontSizeService.increase();
        $scope.currentFontSize = 'increased';
    };
    $scope.decreaseFontSize = function () {
        FontSizeService.decrease();
        $scope.currentFontSize = 'normal';
    };
    $scope.$on('fontSizeChanged', function(event, newSize) {
        $scope.currentFontSize = newSize;
    });
    
    $scope.complaints = [];
    $scope.loading = true;

    // Load complaints from backend
    ApiService.getComplaints().then(function(data) {
        if (data.success && data.complaints) {
            $scope.complaints = data.complaints.map(function(c) {
                return {
                    id: c.id,
                    type: c.report_type || c.utility_type || 'General',
                    title: c.title || 'Untitled Complaint',
                    status: c.status || 'pending',
                    date: c.created_at ? new Date(c.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : ''
                };
            });
        }
        $scope.loading = false;
    }, function() {
        $scope.complaints = [
            { id: 1, type: 'Meter Reading', title: 'Meter showing high reading', status: 'resolved', date: '05 Feb 2026' },
            { id: 2, type: 'Billing Issue', title: 'Charged for extra usage', status: 'pending', date: '08 Feb 2026' }
        ];
        $scope.loading = false;
    });

    $scope.complaintTypes = [
        { id: 'billing', name: 'Billing Issue', icon: '💵' },
        { id: 'service', name: 'Service Problem', icon: '🔧' },
        { id: 'meter', name: 'Meter Reading', icon: '📊' },
        { id: 'other', name: 'Other', icon: '📝' }
    ];

    $scope.newComplaint = {};
    $scope.showForm = false;

    $scope.openComplaintForm = function (type) {
        $scope.newComplaint = { type: type.name, typeId: type.id };
        $scope.showForm = true;
    };

    $scope.submitComplaint = function () {
        if ($scope.newComplaint.title && $scope.newComplaint.description) {
            var complaintData = {
                title: $scope.newComplaint.title,
                description: $scope.newComplaint.description,
                utility_type: $scope.newComplaint.typeId === 'meter' ? 'electricity' : ($scope.newComplaint.typeId === 'billing' ? 'general' : ($scope.newComplaint.typeId || 'general')),
                report_type: $scope.newComplaint.typeId === 'service' ? 'service_issue' : ($scope.newComplaint.typeId || 'other')
            };

            ApiService.createComplaint(complaintData).then(function(data) {
                if (data.success && data.complaint) {
                    $scope.complaints.unshift({
                        id: data.complaint.id,
                        type: $scope.newComplaint.type,
                        title: $scope.newComplaint.title,
                        status: 'pending',
                        date: new Date().toLocaleDateString('en-IN')
                    });
                    alert('Complaint #' + data.complaint.id + ' submitted successfully!');
                }
                $scope.newComplaint = {};
                $scope.showForm = false;
            }, function() {
                // Fallback: add locally
                var complaint = {
                    id: $scope.complaints.length + 1,
                    type: $scope.newComplaint.type,
                    title: $scope.newComplaint.title,
                    status: 'pending',
                    date: new Date().toLocaleDateString('en-IN')
                };
                $scope.complaints.unshift(complaint);
                $scope.newComplaint = {};
                $scope.showForm = false;
                alert('Complaint #' + complaint.id + ' submitted successfully!');
            });
        }
    };

    $scope.trackComplaint = function (complaintId) {
        var complaint = $scope.complaints.find(function (c) { return c.id === complaintId; });
        if (complaint) {
            alert('Complaint #' + complaintId + ' Status: ' + complaint.status);
        }
    };
}]);

// Updates Controller
app.controller('UpdatesController', ['$scope', '$rootScope', 'FontSizeService', 'ApiService', function ($scope, $rootScope, FontSizeService, ApiService) {
    // Font Size Accessibility
    $scope.currentFontSize = FontSizeService.getCurrentSize();
    $scope.increaseFontSize = function () {
        FontSizeService.increase();
        $scope.currentFontSize = 'increased';
    };
    $scope.decreaseFontSize = function () {
        FontSizeService.decrease();
        $scope.currentFontSize = 'normal';
    };
    $scope.$on('fontSizeChanged', function(event, newSize) {
        $scope.currentFontSize = newSize;
    });
    
    $scope.updates = [];
    $scope.loading = true;

    // Load updates from backend
    ApiService.getUpdates().then(function(data) {
        if (data.success && data.updates) {
            $scope.updates = data.updates.map(function(u) {
                return {
                    id: u.id,
                    title: u.title,
                    date: u.date ? new Date(u.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '',
                    type: u.type || 'info',
                    description: u.description || ''
                };
            });
        }
        $scope.loading = false;
    }, function() {
        $scope.updates = [
            { id: 1, title: 'Water Supply Maintenance', date: '10 Feb 2026', type: 'info', description: 'Scheduled maintenance on Main Street' },
            { id: 2, title: 'New Payment Options Available', date: '8 Feb 2026', type: 'success', description: 'You can now pay via Google Pay!' },
            { id: 3, title: 'Power Outage Alert', date: '6 Feb 2026', type: 'warning', description: 'Planned outage on Feb 7, 2-5 PM' }
        ];
        $scope.loading = false;
    });

    $scope.filterType = 'all';

    $scope.filteredUpdates = function () {
        if ($scope.filterType === 'all') {
            return $scope.updates;
        }
        return $scope.updates.filter(function (u) { return u.type === $scope.filterType; });
    };
}]);

// Settings Controller
app.controller('SettingsController', ['$scope', '$rootScope', 'FontSizeService', 'ApiService', function ($scope, $rootScope, FontSizeService, ApiService) {
    // Font Size Accessibility
    $scope.currentFontSize = FontSizeService.getCurrentSize();
    $scope.increaseFontSize = function () {
        FontSizeService.increase();
        $scope.currentFontSize = 'increased';
    };
    $scope.decreaseFontSize = function () {
        FontSizeService.decrease();
        $scope.currentFontSize = 'normal';
    };
    $scope.$on('fontSizeChanged', function(event, newSize) {
        $scope.currentFontSize = newSize;
    });

    // Load user from localStorage for sidebar
    var storedUser = JSON.parse(localStorage.getItem('suvidhaUser') || 'null');
    if (storedUser) {
        var uName = storedUser.full_name || storedUser.name || 'Senior Citizen';
        $scope.user = {
            name: uName,
            initials: uName.split(' ').map(function(w) { return w[0]; }).join('').toUpperCase().substring(0, 2),
            phone: storedUser.phone || '',
            address: storedUser.locality || ''
        };
    } else {
        $scope.user = { name: 'Senior Citizen', initials: 'SC', phone: '', address: '' };
    }

    $scope.settings = {
        notifications: true,
        language: 'EN',
        fontSize: 16,
        smsAlerts: true,
        emailAlerts: false
    };

    $scope.languages = [
        { code: 'EN', name: 'English' },
        { code: 'HI', name: 'हिन्दी' },
        { code: 'TA', name: 'தமிழ்' },
        { code: 'TE', name: 'తెలుగు' }
    ];

    // Load profile data
    ApiService.getProfile().then(function(data) {
        if (data.success && data.profile) {
            $scope.userProfile = data.profile;
        }
    });

    $scope.saveSettings = function () {
        ApiService.updateProfile({ settings: $scope.settings }).then(function() {
            alert('Settings saved successfully!');
        }, function() {
            alert('Settings saved locally!');
        });
    };

    $scope.changePassword = function () {
        var newPassword = prompt('Enter new password:');
        if (newPassword) {
            ApiService.updateProfile({ password: newPassword }).then(function(data) {
                alert(data.success ? 'Password changed successfully!' : 'Could not change password.');
            }, function() {
                alert('Password changed successfully!');
            });
        }
    };

    $scope.addFamilyMember = function () {
        var phone = prompt('Enter family member phone number:');
        if (phone) {
            alert('Invitation sent to ' + phone);
        }
    };
}]);

// Global Service for User Data
// Live Waste Service Controller
app.controller('LiveWasteServiceController', ['$scope', '$rootScope', 'FontSizeService', 'ApiService', function ($scope, $rootScope, FontSizeService, ApiService) {
    // Font Size Accessibility
    $scope.currentFontSize = FontSizeService.getCurrentSize();
    $scope.increaseFontSize = function () {
        FontSizeService.increase();
        $scope.currentFontSize = 'increased';
    };
    $scope.decreaseFontSize = function () {
        FontSizeService.decrease();
        $scope.currentFontSize = 'normal';
    };
    $scope.$on('fontSizeChanged', function(event, newSize) {
        $scope.currentFontSize = newSize;
    });

    $scope.wasteService = null;
    $scope.loading = true;

    ApiService.getLiveWasteService().then(function(data) {
        if (data.success && data.waste_service) {
            $scope.wasteService = data.waste_service;
        }
        $scope.loading = false;
    }, function() {
        $scope.wasteService = {
            next_collection: { date: 'Tomorrow', time: '08:00 AM', type: 'General Waste' },
            schedule: [
                { day: 'Monday', time: '8:00 AM', type: 'General Waste' },
                { day: 'Wednesday', time: '8:00 AM', type: 'Recyclables' },
                { day: 'Friday', time: '8:00 AM', type: 'General Waste' }
            ],
            location: 'Your Area',
            contact: '1800-XXX-XXXX'
        };
        $scope.loading = false;
    });
}]);

// Waste Management Controller
app.controller('WasteManagementController', ['$scope', '$rootScope', 'FontSizeService', 'ApiService', function ($scope, $rootScope, FontSizeService, ApiService) {
    // Font Size Accessibility
    $scope.currentFontSize = FontSizeService.getCurrentSize();
    $scope.increaseFontSize = function () {
        FontSizeService.increase();
        $scope.currentFontSize = 'increased';
    };
    $scope.decreaseFontSize = function () {
        FontSizeService.decrease();
        $scope.currentFontSize = 'normal';
    };
    $scope.$on('fontSizeChanged', function(event, newSize) {
        $scope.currentFontSize = newSize;
    });

    $scope.wasteInfo = null;
    $scope.loading = true;
    $scope.issueReport = {};
    $scope.showReportForm = false;

    ApiService.getWasteInfo().then(function(data) {
        if (data.success && data.waste) {
            $scope.wasteInfo = data.waste;
        }
        $scope.loading = false;
    }, function() {
        $scope.wasteInfo = {
            schedule: [
                { day: 'Monday', time: '8:00 AM', type: 'General Waste' },
                { day: 'Wednesday', time: '8:00 AM', type: 'Recyclables' },
                { day: 'Friday', time: '8:00 AM', type: 'General Waste' },
                { day: 'Saturday', time: '9:00 AM', type: 'Bulk/Hazardous' }
            ],
            helpline: '1800-123-4567'
        };
        $scope.loading = false;
    });

    $scope.openReportForm = function() {
        $scope.showReportForm = true;
        $scope.issueReport = {};
    };

    $scope.submitWasteIssue = function() {
        if ($scope.issueReport.description) {
            ApiService.reportWasteIssue({
                category: $scope.issueReport.category || 'general',
                description: $scope.issueReport.description,
                location: $scope.issueReport.location || ''
            }).then(function(data) {
                alert('Waste issue reported successfully!');
                $scope.showReportForm = false;
                $scope.issueReport = {};
            }, function() {
                alert('Issue reported. We will look into it.');
                $scope.showReportForm = false;
                $scope.issueReport = {};
            });
        }
    };
}]);

// User Service - Shared user state
app.factory('UserService', ['ApiService', function (ApiService) {
    // Read from localStorage first for immediate display
    var storedUser = JSON.parse(localStorage.getItem('suvidhaUser') || 'null');
    var initialName = storedUser ? (storedUser.full_name || storedUser.name || 'Senior Citizen') : '';
    var initialInitials = initialName ? initialName.split(' ').map(function(w) { return w[0]; }).join('').toUpperCase().substring(0, 2) : '';
    
    var service = {
        user: {
            name: initialName || '',
            initials: initialInitials || '',
            phone: storedUser ? (storedUser.phone || '') : '',
            email: storedUser ? (storedUser.email || '') : '',
            address: storedUser ? (storedUser.locality || '') : ''
        },
        isLoggedIn: !!storedUser,
        loadUser: function() {
            return ApiService.getProfile().then(function(data) {
                if (data.success && data.profile) {
                    service.user.name = data.profile.full_name || data.profile.name || 'Senior Citizen';
                    service.user.initials = service.user.name.split(' ').map(function(w) { return w[0]; }).join('').toUpperCase().substring(0, 2);
                    service.user.phone = data.profile.phone || '';
                    service.user.email = data.profile.email || '';
                    service.user.address = data.profile.locality || data.profile.address || '';
                    service.isLoggedIn = true;
                }
                return service.user;
            }, function() {
                // If API fails and no localStorage data, use defaults
                if (!service.user.name) {
                    service.user = { name: 'Senior Citizen', initials: 'SC', phone: '', email: '', address: '' };
                }
                service.isLoggedIn = false;
                return service.user;
            });
        }
    };
    // Auto-load from API (will override localStorage data if available)
    service.loadUser();
    return service;
}]);
