/**
 * Suvidha Waste Collection Worker App
 * AngularJS Application
 */

var app = angular.module('wasteWorkerApp', ['ngRoute']);

// Configure hash prefix for AngularJS 1.6+
app.config(['$locationProvider', function ($locationProvider) {
    $locationProvider.hashPrefix('');
}]);

// Route Configuration
app.config(['$routeProvider', function ($routeProvider) {
    $routeProvider
        .when('/', {
            templateUrl: 'app/views/route.html',
            controller: 'RouteController'
        })
        .when('/collection', { redirectTo: '/' })
        .when('/collection/:houseId', { redirectTo: '/' })
        .when('/summary', {
            templateUrl: 'app/views/summary.html',
            controller: 'SummaryController'
        })
        .when('/wallet', {
            templateUrl: 'app/views/wallet.html',
            controller: 'WalletController'
        })
        .when('/settings', {
            templateUrl: 'app/views/settings.html',
            controller: 'SettingsController'
        })
        .otherwise({
            redirectTo: '/'
        });
}]);

// ============================================
// Sidebar Controller
// ============================================
app.controller('SidebarController', ['$scope', '$location', function ($scope, $location) {
    $scope.isActive = function (path) {
        if (path === '/') {
            return $location.path() === '/' || $location.path() === '';
        }
        return $location.path().indexOf(path) === 0;
    };

    $scope.user = {
        name: 'Ravi Kumar',
        initials: 'RK',
        role: 'Waste Collector'
    };

    // Try load from localStorage
    var storedUser = JSON.parse(localStorage.getItem('wasteWorkerUser') || 'null');
    if (storedUser) {
        var uName = storedUser.full_name || storedUser.name || 'Ravi Kumar';
        $scope.user = {
            name: uName,
            initials: uName.split(' ').map(function(n) { return n[0]; }).join('').toUpperCase().substring(0, 2) || 'RK',
            role: 'Waste Collector'
        };
    }

    $scope.logout = function () {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('wasteWorkerUser');
            window.location.href = '/';
        }
    };
}]);

// ============================================
// Main Controller (Topbar)
// ============================================
app.controller('MainController', ['$scope', '$location', function ($scope, $location) {
    $scope.selectedLang = 'EN';
    $scope.showLangMenu = false;
    $scope.showNotifications = false;
    $scope.notificationsCount = 2;

    $scope.languages = [
        { code: 'EN', name: 'English' },
        { code: 'HI', name: 'हिन्दी (Hindi)' },
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
        { code: 'SA', name: 'संस्कृतम् (Sanskrit)' },
        { code: 'KS', name: 'कॉशुर (Kashmiri)' },
        { code: 'NE', name: 'नेपाली (Nepali)' },
        { code: 'SD', name: 'سنڌي (Sindhi)' },
        { code: 'KOK', name: 'कोंकणी (Konkani)' },
        { code: 'MNI', name: 'মৈতৈলোন্ (Manipuri)' },
        { code: 'DOG', name: 'डोगरी (Dogri)' },
        { code: 'MAI', name: 'मैथिली (Maithili)' },
        { code: 'BOD', name: 'བོད་སྐད། (Bodo)' },
        { code: 'SAT', name: 'ᱥᱟᱱᱛᱟᱲᱤ (Santali)' }
    ];

    $scope.notifications = [
        { sender: '🏛️ Supervisor', text: 'Route updated: 3 new houses added to Ward 12 Sector B.', time: 'Just now', unread: true },
        { sender: '⚠️ Alert', text: 'H-108 reported overflowing bin yesterday. Check on arrival.', time: '15 min ago', unread: true },
        { sender: '⭐ Points', text: 'You earned 13 bonus points this week! Keep it up.', time: '1 hr ago', unread: false },
        { sender: '📋 System', text: 'Sync your data before 4:00 PM deadline today.', time: '2 hrs ago', unread: false },
        { sender: '🏛️ Supervisor', text: 'Area meeting scheduled for tomorrow 9 AM at Ward Office.', time: 'Yesterday', unread: false }
    ];
    $scope.notificationsCount = $scope.notifications.filter(function(n){ return n.unread; }).length;

    // Page titles based on route
    $scope.$on('$routeChangeSuccess', function () {
        var path = $location.path();
        if (path === '/' || path === '') {
            $scope.pageTitle = "Today's Route";
            $scope.pageSubtitle = 'Ward 12 – Sector B';
        } else if (path.indexOf('/collection') === 0) {
            $scope.pageTitle = 'Waste Collection';
            $scope.pageSubtitle = 'Collect waste from assigned houses';
        } else if (path === '/summary') {
            $scope.pageTitle = 'Daily Summary';
            $scope.pageSubtitle = 'Your performance today';
        } else if (path === '/wallet') {
            $scope.pageTitle = 'My Wallet';
            $scope.pageSubtitle = 'Points, earnings & bills';
        } else if (path === '/settings') {
            $scope.pageTitle = 'Settings';
            $scope.pageSubtitle = 'Profile, preferences & account';
        }
    });

    $scope.toggleLangMenu = function ($event) {
        $event.stopPropagation();
        $scope.showLangMenu = !$scope.showLangMenu;
        $scope.showNotifications = false;
    };

    $scope.selectLang = function (lang) {
        $scope.selectedLang = lang.code;
        $scope.showLangMenu = false;
    };

    $scope.toggleNotifications = function ($event) {
        $event.stopPropagation();
        $scope.showNotifications = !$scope.showNotifications;
        $scope.showLangMenu = false;
    };

    $scope.markRead = function (notif) {
        notif.unread = false;
        $scope.notificationsCount = $scope.notifications.filter(function(n){ return n.unread; }).length;
    };

    $scope.markAllRead = function () {
        $scope.notifications.forEach(function(n){ n.unread = false; });
        $scope.notificationsCount = 0;
    };

    // Close dropdowns on outside click
    document.addEventListener('click', function () {
        $scope.$apply(function () {
            $scope.showLangMenu = false;
            $scope.showNotifications = false;
        });
    });
}]);

// ============================================
// Worker Profile Service
// ============================================
app.factory('WorkerService', function () {
    var storedUser = JSON.parse(localStorage.getItem('wasteWorkerUser') || 'null');
    var uName = (storedUser && (storedUser.full_name || storedUser.name)) || 'Ravi Kumar';
    var initials = uName.split(' ').map(function(n) { return n[0]; }).join('').toUpperCase().substring(0, 2) || 'RK';

    var profile = {
        name:        uName,
        initials:    initials,
        employeeId:  'EMP-' + (storedUser && storedUser.id ? String(storedUser.id).padStart(4,'0') : '0042'),
        ward:        'Ward 12, Sector B',
        role:        'Waste Collector',
        totalPoints: parseInt(localStorage.getItem('workerTotalPoints') || '248', 10),
        tier:        'Silver',
        tierClass:   'tier-silver',
        tierIcon:    '🥈'
    };

    // Tier thresholds
    if (profile.totalPoints >= 500)      { profile.tier = 'Gold';   profile.tierClass = 'tier-gold';   profile.tierIcon = '🥇'; }
    else if (profile.totalPoints >= 100) { profile.tier = 'Silver'; profile.tierClass = 'tier-silver'; profile.tierIcon = '🥈'; }
    else                                 { profile.tier = 'Bronze'; profile.tierClass = 'tier-bronze'; profile.tierIcon = '🥉'; }

    return {
        getProfile: function () { return profile; },
        addPoints: function (pts) {
            profile.totalPoints += pts;
            localStorage.setItem('workerTotalPoints', profile.totalPoints);
            // Re-evaluate tier
            if (profile.totalPoints >= 500)      { profile.tier = 'Gold';   profile.tierClass = 'tier-gold';   profile.tierIcon = '🥇'; }
            else if (profile.totalPoints >= 100) { profile.tier = 'Silver'; profile.tierClass = 'tier-silver'; profile.tierIcon = '🥈'; }
            else                                 { profile.tier = 'Bronze'; profile.tierClass = 'tier-bronze'; profile.tierIcon = '🥉'; }
        }
    };
});

// ============================================
// Wallet Service
// ============================================
app.factory('WalletService', ['WorkerService', function (WorkerService) {
    var PT_RATE   = 2;   // 1 point = ₹2
    var ON_TIME   = 10;  // points for finishing before deadline
    var LATE_PEN  = -5;  // points for being late

    var todayPts  = parseInt(localStorage.getItem('walletTodayPts') || '0', 10);
    var balance   = parseInt(localStorage.getItem('walletBalance')  || '480', 10);

    // Pre-seeded transaction history
    var transactions = JSON.parse(localStorage.getItem('walletTx') || 'null') || [
        { id:1, type:'credit', icon:'🏆', label:'On-Time Bonus – Mon',     date:'Mar 17',  pts:10, amount:20 },
        { id:2, type:'credit', icon:'🏠', label:'40 Houses Collected – Mon', date:'Mar 17', pts:40, amount:80 },
        { id:3, type:'debit',  icon:'⚡', label:'Electricity Bill',          date:'Mar 16', pts:50, amount:100 },
        { id:4, type:'credit', icon:'🏠', label:'35 Houses Collected – Sun', date:'Mar 16', pts:35, amount:70 },
        { id:5, type:'credit', icon:'🏠', label:'38 Houses Collected – Sat', date:'Mar 15', pts:38, amount:76 },
        { id:6, type:'debit',  icon:'📱', label:'Phone Recharge',             date:'Mar 15', pts:25, amount:50 },
        { id:7, type:'credit', icon:'🏆', label:'On-Time Bonus – Sat',       date:'Mar 15', pts:10, amount:20 }
    ];

    function save() {
        localStorage.setItem('walletBalance',  balance);
        localStorage.setItem('walletTodayPts', todayPts);
        localStorage.setItem('walletTx',       JSON.stringify(transactions));
    }

    return {
        PT_RATE:  PT_RATE,
        ON_TIME:  ON_TIME,
        LATE_PEN: LATE_PEN,

        getWalletData: function () {
            return {
                balance:  balance,
                points:   Math.floor(balance / PT_RATE),
                todayPts: todayPts,
                ptRate:   PT_RATE
            };
        },

        getTransactions: function () { return transactions; },

        addCredit: function (label, icon, pts) {
            var amount = pts * PT_RATE;
            balance   += amount;
            todayPts  += pts;
            WorkerService.addPoints(pts);
            var now = new Date();
            transactions.unshift({
                id:     Date.now(),
                type:   'credit',
                icon:   icon,
                label:  label,
                date:   now.toLocaleDateString('en-IN', { month:'short', day:'numeric' }),
                pts:    pts,
                amount: amount
            });
            save();
        },

        addDebit: function (label, icon, amount) {
            var pts = Math.ceil(amount / PT_RATE);
            if (balance < amount) return false;
            balance   -= amount;
            todayPts  -= pts;
            var now = new Date();
            transactions.unshift({
                id:     Date.now(),
                type:   'debit',
                icon:   icon,
                label:  label,
                date:   now.toLocaleDateString('en-IN', { month:'short', day:'numeric' }),
                pts:    pts,
                amount: amount
            });
            save();
            return true;
        },

        getTodayBreakdown: function () {
            var today = new Date().toLocaleDateString('en-IN', { month:'short', day:'numeric' });
            return transactions.filter(function (t) { return t.date === today; });
        }
    };
}]);

// ============================================
// Shared Houses Data Service
// ============================================
app.factory('HousesService', function () {
    var houses = [
        { id: 'H-101', address: 'Plot 12, Lane 3', status: 'pending', distance: '20m' },
        { id: 'H-102', address: 'Plot 14, Lane 3', status: 'pending', distance: '45m' },
        { id: 'H-103', address: 'Plot 16, Lane 3', status: 'completed', distance: '70m' },
        { id: 'H-104', address: 'Plot 18, Lane 3', status: 'pending', distance: '95m' },
        { id: 'H-105', address: 'Plot 20, Lane 4', status: 'pending', distance: '120m' },
        { id: 'H-106', address: 'Plot 22, Lane 4', status: 'completed', distance: '150m' },
        { id: 'H-107', address: 'Plot 24, Lane 4', status: 'pending', distance: '175m' },
        { id: 'H-108', address: 'Plot 26, Lane 5', status: 'completed', distance: '200m' },
        { id: 'H-109', address: 'Plot 28, Lane 5', status: 'pending', distance: '230m' },
        { id: 'H-110', address: 'Plot 30, Lane 5', status: 'completed', distance: '260m' },
        { id: 'H-111', address: 'Plot 32, Lane 6', status: 'pending', distance: '290m' },
        { id: 'H-112', address: 'Plot 34, Lane 6', status: 'completed', distance: '320m' },
        { id: 'H-113', address: 'Plot 36, Lane 6', status: 'pending', distance: '350m' },
        { id: 'H-114', address: 'Plot 38, Lane 7', status: 'completed', distance: '380m' },
        { id: 'H-115', address: 'Plot 40, Lane 7', status: 'completed', distance: '410m' },
        { id: 'H-116', address: 'Plot 42, Lane 7', status: 'pending', distance: '440m' },
        { id: 'H-117', address: 'Plot 44, Lane 8', status: 'completed', distance: '470m' },
        { id: 'H-118', address: 'Plot 46, Lane 8', status: 'pending', distance: '500m' },
        { id: 'H-119', address: 'Plot 48, Lane 8', status: 'completed', distance: '530m' },
        { id: 'H-120', address: 'Plot 50, Lane 9', status: 'pending', distance: '560m' },
        { id: 'H-121', address: 'Plot 52, Lane 9', status: 'completed', distance: '590m' },
        { id: 'H-122', address: 'Plot 54, Lane 9', status: 'completed', distance: '620m' },
        { id: 'H-123', address: 'Plot 56, Lane 10', status: 'pending', distance: '650m' },
        { id: 'H-124', address: 'Plot 58, Lane 10', status: 'completed', distance: '680m' },
        { id: 'H-125', address: 'Plot 60, Lane 10', status: 'pending', distance: '710m' },
        { id: 'H-126', address: 'Plot 62, Lane 11', status: 'pending', distance: '740m' },
        { id: 'H-127', address: 'Plot 64, Lane 11', status: 'completed', distance: '770m' },
        { id: 'H-128', address: 'Plot 66, Lane 11', status: 'pending', distance: '800m' },
        { id: 'H-129', address: 'Plot 68, Lane 12', status: 'pending', distance: '830m' },
        { id: 'H-130', address: 'Plot 70, Lane 12', status: 'pending', distance: '860m' },
        { id: 'H-131', address: 'Plot 72, Lane 12', status: 'pending', distance: '890m' },
        { id: 'H-132', address: 'Plot 74, Lane 13', status: 'pending', distance: '920m' },
        { id: 'H-133', address: 'Plot 76, Lane 13', status: 'pending', distance: '950m' },
        { id: 'H-134', address: 'Plot 78, Lane 13', status: 'pending', distance: '980m' },
        { id: 'H-135', address: 'Plot 80, Lane 14', status: 'pending', distance: '1.0km' },
        { id: 'H-136', address: 'Plot 82, Lane 14', status: 'pending', distance: '1.1km' },
        { id: 'H-137', address: 'Plot 84, Lane 14', status: 'pending', distance: '1.1km' },
        { id: 'H-138', address: 'Plot 86, Lane 15', status: 'pending', distance: '1.2km' },
        { id: 'H-139', address: 'Plot 88, Lane 15', status: 'pending', distance: '1.2km' },
        { id: 'H-140', address: 'Plot 90, Lane 15', status: 'pending', distance: '1.3km' }
    ];

    var issues = [];

    return {
        getHouses: function () {
            return houses;
        },
        getHouseById: function (id) {
            return houses.find(function (h) { return h.id === id; });
        },
        markCompleted: function (id, wasteType, note) {
            var house = houses.find(function (h) { return h.id === id; });
            if (house) {
                house.status    = 'completed';
                house.wasteType = wasteType || '';
                house.note      = note || '';
            }
        },
        markIssue: function (id, issueType, label) {
            var house = houses.find(function (h) { return h.id === id; });
            if (house) house.status = 'issue';
            issues.push({ houseId: id, type: issueType, label: label || issueType, time: new Date() });
        },
        getStats: function () {
            var total = houses.length;
            var completed = houses.filter(function (h) { return h.status === 'completed'; }).length;
            var issueCount = houses.filter(function (h) { return h.status === 'issue'; }).length;
            var pending = total - completed - issueCount;
            return {
                total: total,
                completed: completed,
                issues: issueCount,
                pending: pending,
                percent: Math.round((completed / total) * 100)
            };
        },
        getNextPending: function () {
            return houses.find(function (h) { return h.status === 'pending'; });
        },
        getIssues: function () {
            return issues;
        }
    };
});

// ============================================
// Route Controller (Home Screen)
// ============================================
app.controller('RouteController', ['$scope', '$location', '$timeout', 'HousesService', 'WorkerService', 'WalletService',
function ($scope, $location, $timeout, HousesService, WorkerService, WalletService) {
    $scope.houses = HousesService.getHouses();
    $scope.stats  = HousesService.getStats();
    $scope.filter = 'all';

    var workerProfile = WorkerService.getProfile();
    $scope.userName  = workerProfile.name.split(' ')[0];
    $scope.ward      = workerProfile.ward;
    $scope.todayPoints = WalletService.getWalletData().todayPts;

    // Deadline: 4:00 PM today
    var deadlineHour = 16;
    var now          = new Date();
    var deadlineDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), deadlineHour, 0, 0);
    $scope.deadline  = '4:00 PM';
    $scope.deadlinePast = now > deadlineDate;

    // Current time
    $scope.currentTime = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    $scope.currentDate = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

    $scope.setFilter = function (f) {
        $scope.filter = f;
    };

    $scope.filteredHouses = function () {
        if ($scope.filter === 'all') return $scope.houses;
        return $scope.houses.filter(function (h) { return h.status === $scope.filter; });
    };

    $scope.selectHouse = function (house) {
        if (house.status === 'pending') {
            $scope.currentHouse = house;
        }
    };

    $scope.startNextHouse = function () {
        if ($scope.stats.pending === 0) {
            $location.path('/summary');
        } else {
            $scope.currentHouse = HousesService.getNextPending();
        }
    };

    $scope.refreshStats = function () {
        $scope.stats = HousesService.getStats();
    };

    // ─── Quick Actions (from route screen) ──────────────────────────────
    $scope.currentHouse     = HousesService.getNextPending();
    $scope.quickDoneFeedback = null;

    $scope.quickDone = function () {
        if (!$scope.currentHouse) return;
        var h = $scope.currentHouse;
        HousesService.markCompleted(h.id, 'mixed', '');
        WalletService.addCredit('House ' + h.id + ' Collected', '🏠', 1);
        $scope.stats        = HousesService.getStats();
        $scope.todayPoints  = WalletService.getWalletData().todayPts;
        $scope.currentHouse = HousesService.getNextPending();
        // Brief toast feedback
        $scope.quickDoneFeedback = h.id;
        $timeout(function () { $scope.quickDoneFeedback = null; }, 1600);
    };

    $scope.quickSkip = function () {
        if (!$scope.currentHouse) return;
        var skippedId = $scope.currentHouse.id;
        var next = HousesService.getHouses().find(function (h) {
            return h.status === 'pending' && h.id !== skippedId;
        });
        $scope.currentHouse = next || null;
    };

    $scope.quickIssue = function () {
        if (!$scope.currentHouse) return;
        $scope.issueTargetHouse = $scope.currentHouse;
        $scope.selectedIssue    = '';
        $scope.showIssueSheet   = true;
    };

    // ── Issue Sheet ──────────────────────────────────────────────────────
    $scope.showIssueSheet   = false;
    $scope.selectedIssue    = '';
    $scope.issueTargetHouse = null;

    $scope.issueTypes = [
        { id: 'mixed_waste',   label: 'Mixed Waste',          icon: '♻️' },
        { id: 'not_available', label: 'Not Available',        icon: '🚫' },
        { id: 'access_denied', label: 'Access Denied',        icon: '🔒' },
        { id: 'overflowing',   label: 'Bin Overflowing',      icon: '🗑️' },
        { id: 'other',         label: 'Other Issue',          icon: '📋' }
    ];

    $scope.selectIssue = function (id) {
        $scope.selectedIssue = id;
    };

    $scope.closeIssueSheet = function () {
        $scope.showIssueSheet = false;
        $scope.selectedIssue  = '';
    };

    $scope.submitIssue = function () {
        if (!$scope.selectedIssue || !$scope.issueTargetHouse) return;
        var h    = $scope.issueTargetHouse;
        var type = $scope.issueTypes.find(function (t) { return t.id === $scope.selectedIssue; });
        HousesService.markIssue(h.id, $scope.selectedIssue, type ? type.label : $scope.selectedIssue);
        $scope.stats            = HousesService.getStats();
        $scope.todayPoints      = WalletService.getWalletData().todayPts;
        $scope.currentHouse     = HousesService.getNextPending();
        $scope.showIssueSheet   = false;
        $scope.selectedIssue    = '';
        $scope.issueTargetHouse = null;
        $scope.quickDoneFeedback = '⚠️ Issue logged for ' + h.id;
        $timeout(function () { $scope.quickDoneFeedback = null; }, 2200);
    };
    // ─────────────────────────────────────────────────────────────────────

    // Compute lat/lng for a house by index (grid layout)
    function houseCoords(i) {
        return {
            lat: 28.6300 - Math.floor(i / 10) * 0.0006,
            lng: 77.2100 + (i % 10) * 0.00035
        };
    }

    // Init Leaflet map after DOM is ready
    $timeout(function () {
        var mapEl = document.getElementById('route-map');
        if (!mapEl) return;

        var map = L.map('route-map', { zoomControl: true, scrollWheelZoom: false });
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>'
        }).addTo(map);

        var truckCoords = null;
        var allCoords = [];

        $scope.houses.forEach(function (house, i) {
            var c = houseCoords(i);
            allCoords.push([c.lat, c.lng]);

            var color = house.status === 'completed' ? '#10b981' :
                        house.status === 'issue'     ? '#ef4444' : '#f59e0b';

            L.circleMarker([c.lat, c.lng], {
                radius: 8,
                fillColor: color,
                color: '#ffffff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.9
            }).bindPopup(
                '<div style="font-family:Inter,sans-serif;min-width:120px">' +
                '<b style="color:#1e293b">' + house.id + '</b><br>' +
                '<span style="font-size:0.8rem;color:#64748b">' + house.address + '</span><br>' +
                '<span style="font-size:0.75rem;font-weight:600;color:' + color + '">' + house.status.toUpperCase() + '</span>' +
                '</div>'
            ).addTo(map);

            if (!truckCoords && house.status === 'pending') {
                truckCoords = c;
            }
        });

        if (truckCoords) {
            var truckIcon = L.divIcon({
                html: '<div class="map-truck-icon">🚛</div>',
                iconSize: [40, 40],
                iconAnchor: [20, 20],
                className: ''
            });
            L.marker([truckCoords.lat, truckCoords.lng], { icon: truckIcon })
             .bindPopup('<b>Your Location</b><br>Next pickup here')
             .addTo(map);
            map.setView([truckCoords.lat, truckCoords.lng], 15);
        } else if (allCoords.length) {
            map.fitBounds(allCoords, { padding: [24, 24] });
        }
    }, 250);
}]);

// ============================================
// Collection Controller
// ============================================
app.controller('CollectionController', ['$scope', '$location', '$routeParams', '$timeout', '$interval', 'HousesService', 'WalletService',
    function ($scope, $location, $routeParams, $timeout, $interval, HousesService, WalletService) {
        var houseId = $routeParams.houseId;

        if (houseId) {
            $scope.house = HousesService.getHouseById(houseId);
        }

        if (!$scope.house) {
            var next = HousesService.getNextPending();
            if (next) {
                $scope.house = next;
            } else {
                $scope.house = { id: 'N/A', address: 'No pending houses', distance: '0m' };
            }
        }

        // Progress: how many have already been done / issued
        $scope.stats        = HousesService.getStats();
        $scope.pendingDone  = $scope.stats.completed + $scope.stats.issues;

        $scope.wasteType       = '';
        $scope.collectionNote  = '';
        $scope.showIssuePanel  = false;
        $scope.selectedIssue   = '';
        $scope.showSuccess     = false;
        $scope.successMessage  = '';
        $scope.successTitle    = '';
        $scope.successIcon     = '';
        $scope.pointsAwarded   = 0;

        // Face status flow
        $scope.faceStatus      = 'todo';
        $scope.setFaceStatus   = function (s) { $scope.faceStatus = s; };

        // Photo upload
        $scope.photoPreview    = null;
        $scope.photoVerification = null;
        $scope.photoVerifying    = false;
        $scope.triggerPhoto    = function () {
            document.getElementById('photoInput').click();
        };
        $scope.removePhoto     = function ($event) {
            $event.stopPropagation();
            $scope.photoPreview = null;
            $scope.photoVerification = null;
            $scope.photoVerifying = false;
            document.getElementById('photoInput').value = '';
        };
        // File input change handled via vanilla JS to avoid AngularJS $scope.$apply issues
        $timeout(function () {
            var input = document.getElementById('photoInput');
            if (input) {
                input.addEventListener('change', function (e) {
                    var file = e.target.files[0];
                    if (!file) return;
                    var reader = new FileReader();
                    reader.onload = function (ev) {
                        $scope.$apply(function () {
                            $scope.photoPreview = ev.target.result;
                            $scope.photoVerifying = true;
                            $scope.photoVerification = null;
                        });
                        // Run verification
                        if (window.verifyImage) {
                            var workerId = '';
                            try { workerId = JSON.parse(localStorage.getItem('wasteWorkerUser') || '{}').id || ''; } catch(x) {}
                            window.verifyImage(ev.target.result, 'waste_worker_collection', '', workerId)
                                .then(function (result) {
                                    $scope.$apply(function () {
                                        $scope.photoVerifying = false;
                                        $scope.photoVerification = result;
                                    });
                                });
                        }
                    };
                    reader.readAsDataURL(file);
                });
            }
        }, 200);

        // House timer
        $scope.timerSeconds  = 0;
        $scope.timeSpent     = '0:00';
        var timerInterval = $interval(function () {
            $scope.timerSeconds++;
            var m = Math.floor($scope.timerSeconds / 60);
            var s = $scope.timerSeconds % 60;
            $scope.timeSpent = m + ':' + (s < 10 ? '0' : '') + s;
        }, 1000);

        $scope.$on('$destroy', function () {
            $interval.cancel(timerInterval);
            if (collectionMap) { collectionMap.remove(); collectionMap = null; }
        });

        // ── Live Route Mini-Map ──────────────────────────────────
        var collectionMap    = null;
        var truckMarker      = null;
        var currentHouseIdx  = null;

        function houseCoords(i) {
            return {
                lat: 28.6300 - Math.floor(i / 10) * 0.0006,
                lng: 77.2100 + (i % 10) * 0.00035
            };
        }

        $timeout(function () {
            var mapEl = document.getElementById('collection-map');
            if (!mapEl || typeof L === 'undefined') return;

            var allHouses = HousesService.getHouses();
            var currentIdx = allHouses.findIndex(function (h) { return h.id === $scope.house.id; });
            currentHouseIdx = currentIdx;

            var centerCoords = houseCoords(currentIdx >= 0 ? currentIdx : 0);

            collectionMap = L.map('collection-map', { zoomControl: true, scrollWheelZoom: false });
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://openstreetmap.org">OSM</a>'
            }).addTo(collectionMap);

            // Plot all houses
            allHouses.forEach(function (h, i) {
                var c = houseCoords(i);
                var isCurrent = (h.id === $scope.house.id);
                var color = isCurrent    ? '#2563eb' :
                            h.status === 'completed' ? '#10b981' :
                            h.status === 'issue'     ? '#ef4444' : '#f59e0b';
                var radius = isCurrent ? 12 : 7;
                L.circleMarker([c.lat, c.lng], {
                    radius: radius,
                    fillColor: color,
                    color: isCurrent ? '#1d4ed8' : '#fff',
                    weight: isCurrent ? 3 : 2,
                    opacity: 1,
                    fillOpacity: isCurrent ? 1 : 0.85
                }).bindPopup(
                    '<div style="font-family:Inter,sans-serif;min-width:110px">' +
                    '<b style="color:#1e293b">' + h.id + '</b>' +
                    (isCurrent ? ' <span style="color:#2563eb;font-size:0.7rem">(Current)</span>' : '') +
                    '<br><span style="font-size:0.75rem;color:#64748b">' + h.address + '</span>' +
                    '</div>'
                ).addTo(collectionMap);
            });

            // Truck marker on current house
            var truckIcon = L.divIcon({
                html: '<div class="map-truck-icon">🚛</div>',
                iconSize: [36, 36], iconAnchor: [18, 18], className: ''
            });
            truckMarker = L.marker([centerCoords.lat, centerCoords.lng], { icon: truckIcon })
                .bindPopup('<b>You are here</b><br>' + $scope.house.address)
                .addTo(collectionMap);

            collectionMap.setView([centerCoords.lat, centerCoords.lng], 16);
        }, 300);
        // ────────────────────────────────────────────────────────

        $scope.issueTypes = [
            { id: 'mixed_waste',   label: 'Mixed / Unsegregated Waste', icon: '♻️' },
            { id: 'not_available', label: 'Resident Not Available',     icon: '🚫' },
            { id: 'access_denied', label: 'Access Denied',              icon: '🔒' },
            { id: 'overflowing',   label: 'Bin Overflowing',            icon: '🗑️' },
            { id: 'other',         label: 'Other Issue',                icon: '📋' }
        ];

        $scope.markCollected = function () {
            $interval.cancel(timerInterval);
            HousesService.markCompleted($scope.house.id, $scope.wasteType, $scope.collectionNote);

            // Award 1 point per house
            WalletService.addCredit('House Collected – ' + $scope.house.id, '🏠', 1);
            $scope.pointsAwarded  = 1;

            $scope.successIcon    = '✅';
            $scope.successTitle   = 'Collected!';
            $scope.successMessage = $scope.house.id + ' marked as collected.';
            if ($scope.wasteType) {
                $scope.successMessage += ' (' + $scope.wasteType + ' waste)';
            }
            $scope.stats       = HousesService.getStats();
            $scope.pendingDone = $scope.stats.completed + $scope.stats.issues;
            $scope.showSuccess = true;
        };

        $scope.openIssuePanel = function () {
            $scope.showIssuePanel = true;
        };

        $scope.closeIssuePanel = function () {
            $scope.showIssuePanel  = false;
            $scope.selectedIssue   = '';
        };

        $scope.selectIssue = function (issue) {
            $scope.selectedIssue = issue.id;
        };

        $scope.submitIssue = function () {
            if (!$scope.selectedIssue) return;
            var issueLabel = $scope.issueTypes.find(function (t) { return t.id === $scope.selectedIssue; });
            HousesService.markIssue($scope.house.id, $scope.selectedIssue, issueLabel ? issueLabel.label : $scope.selectedIssue);
            $scope.showIssuePanel  = false;
            $scope.successIcon     = '⚠️';
            $scope.successTitle    = 'Issue Reported';
            $scope.successMessage  = 'Issue logged for ' + $scope.house.id + ': ' + (issueLabel ? issueLabel.label : $scope.selectedIssue);
            $scope.showSuccess     = true;
        };

        $scope.continueToNext = function () {
            $scope.showSuccess = false;
            var next = HousesService.getNextPending();
            if (next) {
                $location.path('/collection/' + next.id);
            } else {
                $location.path('/summary');
            }
        };

        $scope.goBack = function () {
            $location.path('/');
        };
    }
]);

// ============================================
// Summary Controller
// ============================================
app.controller('SummaryController', ['$scope', '$location', 'HousesService', 'WorkerService', 'WalletService',
function ($scope, $location, HousesService, WorkerService, WalletService) {
    $scope.stats  = HousesService.getStats();
    $scope.worker = WorkerService.getProfile();

    // Points breakdown
    var deadlineHour = 16;
    var now          = new Date();
    $scope.deadline  = '4:00 PM';
    var isOnTime     = now.getHours() < deadlineHour && $scope.stats.pending === 0;
    $scope.onTimeBonus   = isOnTime ? WalletService.ON_TIME : 0;
    $scope.lateDeduction = (!isOnTime && $scope.stats.pending === 0) ? WalletService.LATE_PEN : 0;

    if (isOnTime) {
        WalletService.addCredit('On-Time Completion Bonus', '🏆', WalletService.ON_TIME);
    }
    $scope.totalPointsToday = WalletService.getWalletData().todayPts;

    // Today's date label
    $scope.todayDate = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

    // Motivational hero text based on completion
    if ($scope.stats.completed === 0) {
        $scope.heroEmoji   = '🚀';
        $scope.heroHeading = 'Let\'s get started!';
        $scope.heroSub     = $scope.stats.total + ' houses on today\'s route';
    } else if ($scope.stats.pending === 0) {
        $scope.heroEmoji   = '🏆';
        $scope.heroHeading = 'Route complete!';
        $scope.heroSub     = 'All ' + $scope.stats.total + ' houses done. Excellent work!';
    } else {
        $scope.heroEmoji   = '🔥';
        $scope.heroHeading = $scope.stats.completed + ' houses done — keep going!';
        $scope.heroSub     = '🚀 ' + $scope.stats.pending + ' left to go';
    }

    // Gauge — radius 65 (matching viewBox 160 circle r=65)
    var circumference = 2 * Math.PI * 65;
    $scope.gaugeCircumference = circumference;
    $scope.gaugeDashoffset    = circumference - (circumference * $scope.stats.percent / 100);

    // Gauge colour
    if ($scope.stats.percent >= 80) {
        $scope.gaugeColor = '#10b981';
    } else if ($scope.stats.percent >= 50) {
        $scope.gaugeColor = '#f59e0b';
    } else {
        $scope.gaugeColor = '#ef4444';
    }

    // Tier progress toward next level
    var tierThresholds = { Bronze: [0, 100], Silver: [100, 500], Gold: [500, 500] };
    var bounds = tierThresholds[$scope.worker.tier] || [0, 100];
    var tierMin = bounds[0], tierMax = bounds[1];
    if ($scope.worker.tier === 'Gold') {
        $scope.tierProgressPct  = 100;
        $scope.tierPtsToNext    = 0;
        $scope.tierNext         = null;
    } else {
        var range = tierMax - tierMin;
        var progress = $scope.worker.totalPoints - tierMin;
        $scope.tierProgressPct = Math.min(100, Math.round((progress / range) * 100));
        $scope.tierPtsToNext   = tierMax - $scope.worker.totalPoints;
        $scope.tierNext        = $scope.worker.tier === 'Bronze' ? 'Silver' : 'Gold';
    }

    // Smart insight — estimated finish time
    var startHour = 8; // assume shift starts at 8 AM
    var elapsedMin = (now.getHours() - startHour) * 60 + now.getMinutes();
    if ($scope.stats.completed > 0) {
        var avgMinPerHouse = elapsedMin / $scope.stats.completed;
        $scope.avgMinPerHouse = Math.round(avgMinPerHouse);
        if ($scope.stats.pending > 0) {
            var estMinLeft = Math.round($scope.stats.pending * avgMinPerHouse);
            var finishDate = new Date(now.getTime() + estMinLeft * 60000);
            var fh = finishDate.getHours(), fm = finishDate.getMinutes();
            var ampm = fh >= 12 ? 'PM' : 'AM';
            fh = fh % 12 || 12;
            $scope.estimatedFinish = 'Finish by ' + fh + ':' + (fm < 10 ? '0' + fm : fm) + ' ' + ampm;
            $scope.smartInsight = $scope.estimatedFinish;
        } else {
            $scope.smartInsight = 'Route done in ' + Math.round(elapsedMin) + ' min 🎉';
        }
        if (avgMinPerHouse < 4) {
            $scope.speedInsight = 'Moving fast! Avg ' + $scope.avgMinPerHouse + ' min/house ⚡';
        } else {
            $scope.speedInsight = 'Avg ' + $scope.avgMinPerHouse + ' min per house';
        }
    } else {
        $scope.smartInsight = 'Start collecting to see insights';
        $scope.speedInsight = null;
    }

    // Issue log with formatted time
    var rawIssues = HousesService.getIssues();
    $scope.issueList = rawIssues.map(function (item) {
        var d = item.time;
        var timeStr = d.getHours().toString().padStart(2,'0') + ':' + d.getMinutes().toString().padStart(2,'0');
        return {
            houseId:   item.houseId,
            typeLabel: item.label || item.type.replace(/_/g, ' ').replace(/\b\w/g, function(c){ return c.toUpperCase(); }),
            timeStr:   timeStr
        };
    });

    // Motivation text
    if ($scope.stats.percent >= 90) {
        $scope.motivationEmoji = '🏆';
        $scope.motivationTitle = 'Outstanding Work!';
        $scope.motivationText  = 'You\'ve covered almost your entire route. Your dedication keeps the city clean!';
    } else if ($scope.stats.percent >= 70) {
        $scope.motivationEmoji = '🔥';
        $scope.motivationTitle = 'Great Work!';
        $scope.motivationText  = 'You completed most of your route today. Keep up the excellent effort!';
    } else if ($scope.stats.percent >= 50) {
        $scope.motivationEmoji = '💪';
        $scope.motivationTitle = 'Good Effort!';
        $scope.motivationText  = 'You\'re making progress. Every house counts towards a cleaner community!';
    } else {
        $scope.motivationEmoji = '🌟';
        $scope.motivationTitle = 'Keep Going!';
        $scope.motivationText  = 'Every step forward helps. Tomorrow is another chance to make a difference!';
    }

    $scope.continueRoute = function () {
        $location.path('/');
    };

    $scope.finishDay = function () {
        if (confirm('Finish your day? This will sync your data.')) {
            $location.path('/wallet');
        }
    };

    $scope.goBack = function () {
        $location.path('/');
    };
}]);

// ============================================
// Wallet Controller
// ============================================
app.controller('WalletController', ['$scope', '$location', 'WalletService', 'WorkerService', 'HousesService',
function ($scope, $location, WalletService, WorkerService, HousesService) {
    $scope.worker  = WorkerService.getProfile();
    $scope.wallet  = WalletService.getWalletData();
    $scope.todayBreakdown = WalletService.getTodayBreakdown();
    $scope.txFilter       = 'all';
    $scope.showPayModal   = false;
    $scope.payModal       = {};

    // Tier progress toward next level
    var tierThresholds = { Bronze: [0, 100], Silver: [100, 500], Gold: [500, 500] };
    var bounds = tierThresholds[$scope.worker.tier] || [0, 100];
    var tierMin = bounds[0], tierMax = bounds[1];
    if ($scope.worker.tier === 'Gold') {
        $scope.tierProgressPct = 100;
        $scope.tierPtsToNext   = 0;
        $scope.tierNext        = null;
    } else {
        var range = tierMax - tierMin;
        var progress = $scope.worker.totalPoints - tierMin;
        $scope.tierProgressPct = Math.min(100, Math.round((progress / range) * 100));
        $scope.tierPtsToNext   = tierMax - $scope.worker.totalPoints;
        $scope.tierNext        = $scope.worker.tier === 'Bronze' ? 'Silver' : 'Gold';
    }

    // Motivational heading based on today's points
    var pts = $scope.wallet.todayPts;
    if (pts >= 10) {
        $scope.walletMotivation = '🏆 Outstanding day — ' + pts + ' pts earned!';
    } else if (pts >= 5) {
        $scope.walletMotivation = '🔥 ' + pts + ' pts today — keep it up!';
    } else if (pts > 0) {
        $scope.walletMotivation = '✅ ' + pts + ' pts earned so far today';
    } else {
        $scope.walletMotivation = '🚀 Head out and start collecting!';
    }

    // Smart insight — potential earnings if route is finished
    var stats = HousesService.getStats();
    $scope.routeStats = stats;
    if (stats.pending > 0) {
        var potentialExtra = stats.pending; // 1 pt per pending house
        $scope.smartInsight = '🏠 ' + stats.pending + ' houses left → earn up to +' + potentialExtra + ' more pts today';
    } else if (stats.total > 0) {
        $scope.smartInsight = '🎉 Route complete! All earnings unlocked for today.';
    } else {
        $scope.smartInsight = null;
    }

    // Issue summary from today
    var rawIssues = HousesService.getIssues();
    $scope.todayIssueCount = rawIssues.length;

    $scope.continueRoute = function () {
        $location.path('/');
    };

    var billConfig = {
        electricity: { name: 'Electricity Bill', icon: '⚡', min: 100 },
        water:       { name: 'Water Bill',        icon: '💧', min: 50  },
        phone:       { name: 'Phone Recharge',    icon: '📱', min: 50  },
        transport:   { name: 'Transport Pass',    icon: '🚌', min: 30  }
    };

    $scope.payBill = function (type) {
        var cfg = billConfig[type];
        if (!cfg) return;
        $scope.payModal = { type: type, name: cfg.name, icon: cfg.icon, min: cfg.min, amount: cfg.min };
        $scope.showPayModal = true;
    };

    $scope.cancelPay = function () {
        $scope.showPayModal = false;
        $scope.payModal = {};
    };

    $scope.confirmPay = function () {
        var cfg = billConfig[$scope.payModal.type];
        var ok  = WalletService.addDebit(cfg.name, cfg.icon, Number($scope.payModal.amount));
        if (ok) {
            $scope.wallet = WalletService.getWalletData();
            $scope.todayBreakdown = WalletService.getTodayBreakdown();
            alert('✅ Payment of ₹' + $scope.payModal.amount + ' for ' + cfg.name + ' done!');
        } else {
            alert('❌ Insufficient balance.');
        }
        $scope.showPayModal = false;
        $scope.payModal = {};
    };

    $scope.filteredTransactions = function () {
        var txns = WalletService.getTransactions();
        if ($scope.txFilter === 'earn')  return txns.filter(function (t) { return t.type === 'credit'; });
        if ($scope.txFilter === 'spend') return txns.filter(function (t) { return t.type === 'debit';  });
        return txns;
    };

    // Weekly insight
    var allTxns = WalletService.getTransactions();
    $scope.weekEarned = allTxns.filter(function(t){ return t.type === 'credit'; }).reduce(function(s,t){ return s + t.pts; }, 0);
    $scope.weekSpent  = allTxns.filter(function(t){ return t.type === 'debit';  }).reduce(function(s,t){ return s + t.pts; }, 0);
    $scope.weekNet    = $scope.weekEarned - $scope.weekSpent;

    // Next milestone motivation
    var totalPts = $scope.wallet.points;
    $scope.nextMilestone = 200 - (totalPts % 200);

    // Reward / redeem options (maps to existing payBill)
    $scope.activeCategory = 'all';
    $scope.rewardCategories = [
        { key: 'all',       label: 'All' },
        { key: 'bills',     label: '🧾 Bills' },
        { key: 'transport', label: '🚌 Transport' },
        { key: 'mobile',    label: '📱 Mobile' }
    ];
    $scope.redeemOptions = [
        { id: 'electricity', name: 'Electricity Bill',  icon: '⚡', pts: 100, category: 'bills',      badge: 'best' },
        { id: 'water',       name: 'Water Bill',         icon: '💧', pts: 50,  category: 'bills' },
        { id: 'phone',       name: 'Phone Recharge',     icon: '📱', pts: 50,  category: 'mobile',     badge: 'top'  },
        { id: 'transport',   name: 'Transport Pass',     icon: '🚌', pts: 30,  category: 'transport' }
    ];
    $scope.setCategory = function(key) { $scope.activeCategory = key; };
    $scope.filteredRewards = function() {
        if ($scope.activeCategory === 'all') return $scope.redeemOptions;
        return $scope.redeemOptions.filter(function(o) { return o.category === $scope.activeCategory; });
    };

    // Transaction filter labels
    $scope.txnFilters = [
        { key: 'all',   label: 'All' },
        { key: 'earn',  label: '🟢 Earned' },
        { key: 'spend', label: '🔴 Spent' }
    ];

    // Scroll helpers
    $scope.scrollToRewards = function() {
        var el = document.getElementById('rewards-section');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    $scope.scrollToHistory = function() {
        var el = document.getElementById('history-section');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
}]);

// ============================================
// Settings Controller
// ============================================
app.controller('SettingsController', ['$scope', '$location', '$timeout', 'WorkerService',
function ($scope, $location, $timeout, WorkerService) {
    $scope.worker = WorkerService.getProfile();

    // Tier progress
    var tierThresholds = { Bronze: [0, 100], Silver: [100, 500], Gold: [500, 500] };
    var bounds = tierThresholds[$scope.worker.tier] || [0, 100];
    var tierMin = bounds[0], tierMax = bounds[1];
    if ($scope.worker.tier === 'Gold') {
        $scope.tierProgressPct = 100;
        $scope.tierPtsToNext   = 0;
        $scope.tierNext        = null;
    } else {
        var range = tierMax - tierMin;
        $scope.tierProgressPct = Math.min(100, Math.round(($scope.worker.totalPoints - tierMin) / range * 100));
        $scope.tierPtsToNext   = tierMax - $scope.worker.totalPoints;
        $scope.tierNext        = $scope.worker.tier === 'Bronze' ? 'Silver' : 'Gold';
    }

    // Load saved preferences from localStorage
    var defaultPrefs = {
        notifications:    true,
        sound:            true,
        deadlineReminder: true,
        language:         'EN',
        showMap:          true,
        showDistances:    true,
        autoAdvance:      false
    };
    var storedPrefs = JSON.parse(localStorage.getItem('workerPrefs') || 'null') || {};
    $scope.prefs = angular.extend({}, defaultPrefs, storedPrefs);

    var langLabels = {
        EN: 'English', HI: 'Hindi', BN: 'Bengali', TE: 'Telugu',
        MR: 'Marathi', TA: 'Tamil', GU: 'Gujarati', KN: 'Kannada',
        ML: 'Malayalam', PA: 'Punjabi'
    };
    $scope.selectedLangLabel = langLabels[$scope.prefs.language] || 'English';

    $scope.onLangChange = function () {
        $scope.selectedLangLabel = langLabels[$scope.prefs.language] || $scope.prefs.language;
        $scope.savePrefs();
    };

    // Name editing
    $scope.editingName = false;
    $scope.editNameVal = $scope.worker.name;

    $scope.startEditName = function () {
        $scope.editNameVal = $scope.worker.name;
        $scope.editingName = true;
    };

    $scope.saveName = function () {
        var trimmed = ($scope.editNameVal || '').trim();
        if (!trimmed) return;
        $scope.worker.name = trimmed;
        var storedUser = JSON.parse(localStorage.getItem('wasteWorkerUser') || '{}');
        storedUser.full_name = trimmed;
        storedUser.name = trimmed;
        localStorage.setItem('wasteWorkerUser', JSON.stringify(storedUser));
        $scope.editingName = false;
        $scope.showToast('Name updated!');
    };

    // Save preferences
    $scope.savePrefs = function () {
        localStorage.setItem('workerPrefs', JSON.stringify($scope.prefs));
        $scope.showToast('Preferences saved');
    };

    // Toast
    $scope.toastMessage = null;
    var toastTimer = null;
    $scope.showToast = function (msg) {
        $scope.toastMessage = msg;
        if (toastTimer) $timeout.cancel(toastTimer);
        toastTimer = $timeout(function () { $scope.toastMessage = null; }, 2200);
    };

    // Actions
    $scope.contactSupervisor = function () {
        $scope.showToast('Contact: supervisor@suvidha.gov.in');
    };

    $scope.openHelp = function () {
        $scope.showToast('Help docs coming soon!');
    };

    $scope.clearData = function () {
        if (confirm('Clear cached route & points data? This cannot be undone.')) {
            localStorage.removeItem('walletBalance');
            localStorage.removeItem('walletTodayPts');
            localStorage.removeItem('walletTx');
            localStorage.removeItem('workerTotalPoints');
            $scope.showToast('Local data cleared');
        }
    };

    $scope.logout = function () {
        if (confirm('Are you sure you want to log out?')) {
            localStorage.removeItem('wasteWorkerUser');
            window.location.href = '/';
        }
    };
}]);
