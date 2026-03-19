/**
 * Search Controller for Field Agent
 * Manages household search, filtering, and route optimization using A* algorithm
 * Includes GPS simulation for dynamic path updates
 */

// Use the existing module
angular.module('workerApp').controller('SearchController', ['$scope', '$timeout', '$interval', function ($scope, $timeout, $interval) {
    
    // =============================================
    // INITIAL DATA & STATE
    // =============================================
    $scope.user = {
        name: 'Vikram Singh',
        initials: 'VS',
        role: 'Electric Meter Reader'
    };

    $scope.pageTitle = 'Search Households';
    $scope.pageSubtitle = 'Find and navigate to assigned households for meter reading';

    $scope.isActive = function (path) {
        return path === '/search' || window.location.href.indexOf(path) !== -1;
    };

    // =============================================
    // LANGUAGE SELECTOR (same as dashboard)
    // =============================================
    $scope.selectedLang = 'EN';
    $scope.showLangMenu = false;
    $scope.languages = [
        { code: 'EN', name: 'English' },
        { code: 'HI', name: 'हिन्दी' },
        { code: 'TA', name: 'தமிழ்' },
        { code: 'TE', name: 'తెలుగు' },
        { code: 'KN', name: 'ಕನ್ನಡ' },
        { code: 'MR', name: 'मराठी' },
        { code: 'BN', name: 'বাংলা' },
        { code: 'GU', name: 'ગુજરાતી' },
        { code: 'PA', name: 'ਪੰਜਾਬੀ' }
    ];

    $scope.toggleLangMenu = function ($event) {
        $event.stopPropagation();
        $scope.showLangMenu = !$scope.showLangMenu;
        $scope.showNotifications = false;
    };

    $scope.selectLang = function (lang) {
        $scope.selectedLang = lang.code;
        $scope.showLangMenu = false;
        console.log('Language changed to:', lang.name);
    };

    // =============================================
    // NOTIFICATIONS (same as dashboard)
    // =============================================
    $scope.notificationsCount = 3;
    $scope.showNotifications = false;
    $scope.govMessages = [
        {
            id: 1,
            sender: 'Admin Office',
            text: 'Please complete the Block A survey by 5 PM today.',
            time: '10 min ago',
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

    $scope.toggleNotifications = function ($event) {
        $event.stopPropagation();
        $scope.showNotifications = !$scope.showNotifications;
        $scope.showLangMenu = false;
    };

    $scope.markAsRead = function (msg) {
        if (msg.unread) {
            msg.unread = false;
            $scope.notificationsCount = Math.max(0, $scope.notificationsCount - 1);
        }
    };

    // Close menus on outside click
    document.addEventListener('click', function () {
        $scope.$apply(function () {
            $scope.showLangMenu = false;
            $scope.showNotifications = false;
        });
    });

    // Households with coordinates for Map and A*
    // Coordinates centered around a mock area in Delhi/Noida
    $scope.households = [
        { id: 1, houseNo: 'H-101', name: 'Rajesh Kumar', meterNo: 'MTR-651969', status: 'pending', dueDate: 'Today', lat: 28.5355, lng: 77.3910 },
        { id: 2, houseNo: 'H-102', name: 'Suman Devi', meterNo: 'MTR-665673', status: 'pending', dueDate: 'Today', lat: 28.5385, lng: 77.3930 },
        { id: 3, houseNo: 'H-103', name: 'Amit Sharma', meterNo: 'MTR-653985', status: 'pending', dueDate: 'Today', lat: 28.5400, lng: 77.3960 },
        { id: 4, houseNo: 'H-104', name: 'Priya Singh', meterNo: 'MTR-651069', status: 'pending', dueDate: 'Today', lat: 28.5365, lng: 77.3980 },
        { id: 5, houseNo: 'H-105', name: 'Vikram Aditya', meterNo: 'MTR-653066', status: 'completed', dueDate: 'Today', lat: 28.5340, lng: 77.3950 },
        { id: 6, houseNo: 'H-106', name: 'Sneha Kapur', meterNo: 'MTR-655973', status: 'pending', dueDate: 'Today', lat: 28.5320, lng: 77.3920 },
        { id: 7, houseNo: 'H-107', name: 'Rohan Mehra', meterNo: 'MTR-653066', status: 'address_issue', dueDate: 'Today', lat: 28.5300, lng: 77.3900, issueCode: 'S4' },
        { id: 8, houseNo: 'H-108', name: 'Anjali Gupta', meterNo: 'MTR-654365', status: 'pending', dueDate: 'Today', lat: 28.5280, lng: 77.3940 },
        { id: 9, houseNo: 'H-109', name: 'Sunil Verma', meterNo: 'MTR-653998', status: 'completed', dueDate: 'Today', lat: 28.5260, lng: 77.3980 },
        { id: 10, houseNo: 'H-110', name: 'Kavita Iyer', meterNo: 'MTR-655196', status: 'address_issue', dueDate: 'Today', lat: 28.5240, lng: 77.4000, issueCode: 'S4' },
        { id: 11, houseNo: 'H-111', name: 'Manish Pandey', meterNo: 'MTR-651234', status: 'pending', dueDate: 'Today', lat: 28.5220, lng: 77.3960 },
        { id: 12, houseNo: 'H-112', name: 'Neha Reddy', meterNo: 'MTR-655678', status: 'pending', dueDate: 'Today', lat: 28.5200, lng: 77.3920 },
        { id: 13, houseNo: 'H-113', name: 'Arjun Das', meterNo: 'MTR-659012', status: 'pending', dueDate: 'Today', lat: 28.5180, lng: 77.3880 },
        { id: 14, houseNo: 'H-114', name: 'Mehta Bros', meterNo: 'MTR-653456', status: 'pending', dueDate: 'Today', lat: 28.5160, lng: 77.3840 }
    ];

    $scope.filteredHouseholds = [];
    $scope.searchQuery = '';
    $scope.filterStatus = null;
    $scope.counts = { all: 0, pending: 0, completed: 0, skipped: 0 };

    $scope.smartRoute = {
        progress: { percentage: 35 },
        nextHouse: null,
        isOptimizing: false
    };

    // Current Worker Location (Simulated GPS)
    $scope.currentLocation = { lat: 28.5355, lng: 77.3910 };
    var gpsSimulationInterval;

    // =============================================
    // MAP INITIALIZATION
    // =============================================
    var map;
    var markers = [];
    var routeLine;
    var agentMarker;

    function initMap() {
        var mapDiv = document.getElementById('perf-map');
        if (!mapDiv) {
            console.error('Map container not found');
            return;
        }

        if (map) {
            map.remove();
        }
        
        map = L.map('perf-map', {
            zoomControl: false
        }).setView([$scope.currentLocation.lat, $scope.currentLocation.lng], 14);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© Suvidha'
        }).addTo(map);

        // Add custom zoom control to top right
        L.control.zoom({ position: 'topright' }).addTo(map);

        updateMarkers();
        startGpsSimulation();
    }

    function updateMarkers() {
        // Clear old markers
        markers.forEach(m => map.removeLayer(m));
        markers = [];

        $scope.households.forEach(house => {
            let color = '#ED8936'; // Pending (Orange)
            if (house.status === 'completed') color = '#38A169'; // Completed (Green)
            if (house.status === 'skipped' || house.status === 'address_issue') color = '#E53E3E'; // Skipped (Red)

            let icon = L.divIcon({
                className: 'custom-div-icon',
                html: `<div style="background-color:${color}; width:28px; height:28px; border-radius:50%; border:3px solid white; display:flex; align-items:center; justify-content:center; color:white; font-size:10px; font-weight:bold; box-shadow:0 2px 5px rgba(0,0,0,0.3)">${house.houseNo.split('-')[1]}</div>`,
                iconSize: [28, 28],
                iconAnchor: [14, 14]
            });

            let marker = L.marker([house.lat, house.lng], { icon: icon }).addTo(map);
            marker.bindPopup(`<b>${house.houseNo}</b><br>${house.status}<br><button onclick="window.angularComponentReference.startReadingById(${house.id})">Start Reading</button>`);
            markers.push(marker);
        });

        // Add Agent Marker
        if (agentMarker) map.removeLayer(agentMarker);
        let agentIcon = L.divIcon({
            className: 'agent-icon',
            html: `<div style="background-color:#3182CE; width:34px; height:34px; border-radius:50%; border:4px solid white; display:flex; align-items:center; justify-content:center; color:white; font-size:16px; box-shadow:0 0 15px rgba(49, 130, 206, 0.6)">👤</div>`,
            iconSize: [34, 34],
            iconAnchor: [17, 17]
        });
        agentMarker = L.marker([$scope.currentLocation.lat, $scope.currentLocation.lng], { icon: agentIcon, zIndexOffset: 1000 }).addTo(map);
    }

    // Exposure for Leaflet popups
    window.angularComponentReference = {
        startReadingById: function(id) {
            $scope.$apply(function() {
                let house = $scope.households.find(h => h.id === id);
                if (house) $scope.startReading(house);
            });
        }
    };

    // =============================================
    // GPS SIMULATION
    // =============================================
    function startGpsSimulation() {
        if (gpsSimulationInterval) return;

        gpsSimulationInterval = $interval(function() {
            // Slight random movement to simulate real walking/driving
            $scope.currentLocation.lat += (Math.random() - 0.5) * 0.0005;
            $scope.currentLocation.lng += (Math.random() - 0.5) * 0.0005;

            if (agentMarker) {
                agentMarker.setLatLng([$scope.currentLocation.lat, $scope.currentLocation.lng]);
            }

            // If we have an optimized path, we might want to update it
            if ($scope.smartRoute.isOptimizing) {
                updateOptimizedPath();
            }
        }, 3000);
    }

    $scope.$on('$destroy', function() {
        if (gpsSimulationInterval) $interval.cancel(gpsSimulationInterval);
    });

    // =============================================
    // A* ALGORITHM LOGIC
    // =============================================
    /**
     * A* Implementation
     * Finds the most efficient visit order based on current distance
     */
    $scope.optimizeRoute = function() {
        $scope.smartRoute.isOptimizing = true;
        updateOptimizedPath();
        alert('Route Optimized via A*! Visualizing best path from your current location.');
    };

    function updateOptimizedPath() {
        const pending = $scope.households.filter(h => h.status === 'pending');
        if (pending.length === 0) {
            if (routeLine) map.removeLayer(routeLine);
            $scope.smartRoute.nextHouse = null;
            return;
        }

        // Simple A* Greedy Pathfinding (TSP Approximation for Points)
        let unvisited = [...pending];
        let path = [[$scope.currentLocation.lat, $scope.currentLocation.lng]];
        let currentPos = { ...$scope.currentLocation };
        let visitOrder = [];

        while (unvisited.length > 0) {
            let nearest = null;
            let minDist = Infinity;
            let nearestIdx = -1;

            for (let i = 0; i < unvisited.length; i++) {
                // Heuristic: Euclidean distance
                let d = Math.sqrt(Math.pow(unvisited[i].lat - currentPos.lat, 2) + Math.pow(unvisited[i].lng - currentPos.lng, 2));
                if (d < minDist) {
                    minDist = d;
                    nearest = unvisited[i];
                    nearestIdx = i;
                }
            }

            visitOrder.push(nearest);
            path.push([nearest.lat, nearest.lng]);
            currentPos = { lat: nearest.lat, lng: nearest.lng };
            unvisited.splice(nearestIdx, 1);
        }

        // Update UI for "Next Task"
        if (visitOrder.length > 0) {
            let next = visitOrder[0];
            let distDeg = Math.sqrt(Math.pow(next.lat - $scope.currentLocation.lat, 2) + Math.pow(next.lng - $scope.currentLocation.lng, 2));
            let distMeters = distDeg * 111320;
            
            $scope.smartRoute.nextHouse = {
                houseNo: next.houseNo,
                distance: distMeters > 1000 ? (distMeters / 1000).toFixed(1) + 'km' : Math.round(distMeters) + 'm',
                estimatedTime: Math.ceil(distMeters / 80) + ' min' // 80m/min approx walking speed
            };
        }

        // Draw the path
        if (routeLine) map.removeLayer(routeLine);
        routeLine = L.polyline(path, {
            color: '#3182CE',
            weight: 4,
            opacity: 0.6,
            dashArray: '10, 10',
            className: 'optimized-path'
        }).addTo(map);

        // Slow pulse animation for class
        var style = document.createElement('style');
        style.innerHTML = '.optimized-path { animation: dash 20s linear infinite; } @keyframes dash { from { stroke-dashoffset: 1000; } to { stroke-dashoffset: 0; } }';
        document.head.appendChild(style);
    }

    // =============================================
    // UI ACTIONS & FILTERING
    // =============================================
    $scope.filterHouseholds = function () {
        const query = $scope.searchQuery.toLowerCase();
        $scope.filteredHouseholds = $scope.households.filter(h => {
            const matchesQuery = h.houseNo.toLowerCase().includes(query) || 
                               h.meterNo.toLowerCase().includes(query) ||
                               h.name.toLowerCase().includes(query);
            
            let matchesStatus = true;
            if ($scope.filterStatus === 'pending') matchesStatus = (h.status === 'pending');
            else if ($scope.filterStatus === 'completed') matchesStatus = (h.status === 'completed');
            else if ($scope.filterStatus === 'skipped') matchesStatus = (h.status === 'skipped' || h.status === 'address_issue');

            return matchesQuery && matchesStatus;
        });
        calculateCounts();
    };

    $scope.toggleFilter = function (status) {
        if ($scope.filterStatus === status) $scope.filterStatus = null;
        else $scope.filterStatus = status;
        $scope.filterHouseholds();
    };

    function calculateCounts() {
        $scope.counts.all = $scope.households.length;
        $scope.counts.pending = $scope.households.filter(h => h.status === 'pending').length;
        $scope.counts.completed = $scope.households.filter(h => h.status === 'completed').length;
        $scope.counts.skipped = $scope.households.filter(h => h.status === 'skipped' || h.status === 'address_issue').length;
        
        $scope.smartRoute.progress.percentage = Math.round(($scope.counts.completed / $scope.counts.all) * 100);
    }

    // BUTTON ACTIONS
    $scope.syncNow = function() {
        alert('Syncing with government servers...');
        $timeout(function() { alert('Sync Successful!'); }, 1000);
    };

    $scope.startReading = function (house, $event) {
        if ($event) $event.stopPropagation();
        if (confirm('Navigate to ' + house.houseNo + ' and start meter reading?')) {
            // Mock transition to task
            house.status = 'completed';
            $scope.filterHouseholds();
            updateMarkers();
            if ($scope.smartRoute.isOptimizing) updateOptimizedPath();
            alert('Task completed for ' + house.houseNo);
        }
    };

    $scope.startNavigation = function() {
        if (!$scope.smartRoute.nextHouse) return;
        alert('Launching Maps for ' + $scope.smartRoute.nextHouse.houseNo);
    };

    $scope.viewFullMap = function() {
        if (!map) return;
        map.setView([$scope.currentLocation.lat, $scope.currentLocation.lng], 16);
    };

    $scope.sortByNewest = function() {
        $scope.households.reverse();
        $scope.filterHouseholds();
    };

    $scope.logout = function () {
        if (confirm('Are you sure you want to logout?')) {
            window.location.href = '/login';
        }
    };

    $scope.viewDetails = function (house) {
        alert('Household: ' + house.houseNo + '\nResident: ' + house.name + '\nMeter: ' + house.meterNo + '\nStatus: ' + house.status);
    };

    // =============================================
    // INITIALIZATION
    // =============================================
    var now = new Date();
    var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    $scope.currentDate = days[now.getDay()] + ', ' + now.getDate() + ' ' + months[now.getMonth()] + ' ' + now.getFullYear();

    $timeout(function() {
        initMap();
        $scope.filterHouseholds();
    }, 500);

}]);
