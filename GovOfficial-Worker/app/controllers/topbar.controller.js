/**
 * TopBar Controller for Reusable Header Component
 * Used across: Dashboard, Search, Report, Settings pages
 * Manages: Language selection, notifications, sync operations
 */

app.controller('TopbarController', ['$scope', '$timeout', function ($scope, $timeout) {
    
    // =============================================
    // USER & PAGE INFO
    // =============================================
    $scope.user = {
        name: 'Vikram Singh',
        initials: 'VS',
        category: 'Field Agent'
    };

    $scope.pageTitle = $scope.pageTitle || 'Suvidha Control Room';
    $scope.pageSubtitle = $scope.pageSubtitle || 'Government Field Agent Management System';

    // =============================================
    // LOCALIZATION
    // =============================================
    $scope.selectedLang = 'EN';
    $scope.showLangMenu = false;
    $scope.languages = [
        { code: 'EN', name: 'English' },
        { code: 'HI', name: 'Hindi' },
        { code: 'TA', name: 'Tamil' },
        { code: 'TE', name: 'Telugu' },
        { code: 'KN', name: 'Kannada' },
        { code: 'BN', name: 'Bengali' },
        { code: 'MR', name: 'Marathi' },
        { code: 'GU', name: 'Gujarati' },
        { code: 'ML', name: 'Malayalam' },
        { code: 'PA', name: 'Punjabi' },
        { code: 'OR', name: 'Odia' },
        { code: 'AS', name: 'Assamese' }
    ];

    // =============================================
    // NOTIFICATIONS & MENU STATE
    // =============================================
    $scope.notificationsCount = 3;
    $scope.showNotifications = false;
    $scope.govMessages = [
        {
            id: 1,
            sender: 'Admin Office',
            text: 'Please complete the Block A survey by 5 PM today.',
            time: '10 mins ago',
            unread: true
        },
        {
            id: 2,
            sender: 'Supervisor',
            text: 'Accuracy score improved by 15%! Keep it up.',
            time: '2 hours ago',
            unread: true
        },
        {
            id: 3,
            sender: 'Gov Portal',
            text: 'System maintenance scheduled for 11 PM tonight.',
            time: '5 hours ago',
            unread: false
        }
    ];

    $scope.showUserMenu = true;

    // =============================================
    // LANGUAGE FUNCTIONS
    // =============================================

    /**
     * Toggle language selector dropdown
     */
    $scope.toggleLangMenu = function ($event) {
        $event.stopPropagation();
        $scope.showLangMenu = !$scope.showLangMenu;
        $scope.showNotifications = false;
    };

    /**
     * Select language and apply translations
     */
    $scope.selectLang = function (lang, $event) {
        if ($event) $event.preventDefault();
        $scope.selectedLang = lang.code;
        $scope.showLangMenu = false;
        
        // TODO: Emit event or call translation service
        console.log('Language changed to: ' + lang.name + ' (' + lang.code + ')');
    };

    // =============================================
    // NOTIFICATION FUNCTIONS
    // =============================================

    /**
     * Toggle notifications panel
     */
    $scope.toggleNotifications = function ($event) {
        if ($event) $event.stopPropagation();
        $scope.showNotifications = !$scope.showNotifications;
        $scope.showLangMenu = false;
    };

    /**
     * Mark notification as read
     */
    $scope.markAsRead = function (msg) {
        if (msg.unread) {
            msg.unread = false;
            $scope.notificationsCount--;
        }
    };

    // =============================================
    // USER MENU FUNCTIONS
    // =============================================

    /**
     * Toggle user menu
     */
    $scope.toggleUserMenu = function ($event) {
        $event.stopPropagation();
        // TODO: Implement user menu
    };

    /**
     * Logout user
     */
    $scope.logout = function () {
        if (confirm('Are you sure you want to logout?')) {
            window.location.href = '/login.html';
        }
    };

    // =============================================
    // SYNC FUNCTIONS
    // =============================================

    /**
     * Sync data with server
     */
    $scope.syncNow = function () {
        console.log('Syncing data with server...');
        // Show loading state
        var originalText = '🔄';
        var syncButton = document.querySelector('.sync-btn');
        
        if (syncButton) {
            syncButton.classList.add('syncing');
        }

        // Simulate sync delay
        $timeout(function () {
            console.log('Data synced successfully');
            if (syncButton) {
                syncButton.classList.remove('syncing');
            }
        }, 1500);

        // TODO: Implement actual server sync
    };

    // =============================================
    // EVENT LISTENERS
    // =============================================

    /**
     * Close menus on outside click
     */
    document.addEventListener('click', function (event) {
        // Check if click is outside the lang menu
        var langMenu = document.querySelector('.lang-dropdown');
        if (langMenu && !langMenu.contains(event.target)) {
            $scope.$apply(function () {
                $scope.showLangMenu = false;
            });
        }
    });

    // =============================================
    // INITIALIZATION
    // =============================================

    /**
     * Initialize topbar controller
     */
    function init() {
        console.log('TopBar Controller initialized');
    }

    init();
}]);
