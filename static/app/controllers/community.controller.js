(function () {
    'use strict';

    angular.module('suvidhaApp')
        .controller('CommunityController', ['$scope', '$timeout', '$sce', 'ApiService', CommunityController]);

    function CommunityController($scope, $timeout, $sce, ApiService) {
        var vm = this;
        var $rootScope = $scope.$root;

        // Basics
        vm.loading = true;
        vm.activeSection = 'overview';
        vm.citizenName = 'Citizen'; // Mock user name

        // --- Selectors ---
        vm.selectedUtility = 'electricity'; // electricity, water, gas, waste
        // Used in dropdown lists mock data from before
        // Comprehensive State → City → Ward filter data
        vm.filterData = {
            'Delhi': {
                'New Delhi': [
                    { value: 'Kalkaji', label: 'Kalkaji (South)' },
                    { value: 'Nehru Place', label: 'Nehru Place' },
                    { value: 'Greater Kailash II', label: 'Greater Kailash II' }
                ],
                'South Delhi': [
                    { value: 'Saket', label: 'Saket' },
                    { value: 'Hauz Khas', label: 'Hauz Khas' }
                ]
            },
            'Maharashtra': {
                'Mumbai': [
                    { value: 'Andheri', label: 'Andheri' },
                    { value: 'Bandra', label: 'Bandra' }
                ]
            }
        };

        vm.stateList = Object.keys(vm.filterData);
        vm.selectedState = 'Delhi';
        vm.cityList = Object.keys(vm.filterData['Delhi']);
        vm.selectedCity = 'New Delhi';
        vm.wardList = vm.filterData['Delhi']['New Delhi'];
        vm.selectedWard = 'Kalkaji';

        // Map iframe URL - updates when ward changes
        vm.updateMapUrl = function() {
            vm.mapIframeSrc = $sce.trustAsResourceUrl('/static/map-embed.html?ward=' + encodeURIComponent(vm.selectedWard));
        };
        vm.updateMapUrl();

        // Filters
        vm.challengeFilter = 'current'; // past, current, future
        
        vm.onStateChange = function () {
            vm.cityList = Object.keys(vm.filterData[vm.selectedState] || {});
            vm.selectedCity = vm.cityList[0] || '';
            vm.onCityChange();
        };

        vm.onCityChange = function () {
            vm.wardList = (vm.filterData[vm.selectedState] || {})[vm.selectedCity] || [];
            vm.selectedWard = vm.wardList.length ? vm.wardList[0].value : '';
            vm.loadWardData();
        };

        vm.showSection = function(section) {
            vm.activeSection = section;
            $timeout(function() {
                if (typeof lucide !== 'undefined') lucide.createIcons();
            }, 50);
        };

        vm.selectUtility = function(util) {
            vm.selectedUtility = util;
            vm.updateUtilityGraphs();
        };

        vm.wardSavingsGraphData = [];
        vm.userStandingGraphData = {};
        
        // Dynamic Update of Graphs based on Utility
        vm.updateUtilityGraphs = function() {
            var unit = '', savedRes = '';
            if (vm.selectedUtility === 'electricity') {
                unit = 'kWh'; savedRes = 'Coal';
            } else if (vm.selectedUtility === 'water') {
                unit = 'kL'; savedRes = 'Groundwater';
            } else if (vm.selectedUtility === 'gas') {
                unit = 'kg'; savedRes = 'Fossil Fuels';
            } else {
                unit = 'kg'; savedRes = 'Landfill Space';
            }

            // Per-utility savings data for each ward (dummy)
            var allWardData = {
                electricity: {
                    'Kalkaji':            { score: '145 kWh', percent: 78 },
                    'Nehru Place':        { score: '88 kWh',  percent: 48 },
                    'Greater Kailash II': { score: '162 kWh', percent: 88 },
                    'Saket':              { score: '120 kWh', percent: 65 },
                    'Hauz Khas':          { score: '134 kWh', percent: 72 }
                },
                water: {
                    'Kalkaji':            { score: '24 kL',  percent: 77 },
                    'Nehru Place':        { score: '12 kL',  percent: 39 },
                    'Greater Kailash II': { score: '31 kL',  percent: 100 },
                    'Saket':              { score: '22 kL',  percent: 71 },
                    'Hauz Khas':          { score: '27 kL',  percent: 87 }
                },
                gas: {
                    'Kalkaji':            { score: '18 kg', percent: 72 },
                    'Nehru Place':        { score: '22 kg', percent: 88 },
                    'Greater Kailash II': { score: '14 kg', percent: 56 },
                    'Saket':              { score: '19 kg', percent: 76 },
                    'Hauz Khas':          { score: '16 kg', percent: 64 }
                },
                waste: {
                    'Kalkaji':            { score: '72%', percent: 89 },
                    'Nehru Place':        { score: '55%', percent: 68 },
                    'Greater Kailash II': { score: '81%', percent: 100 },
                    'Saket':              { score: '68%', percent: 84 },
                    'Hauz Khas':          { score: '74%', percent: 91 }
                }
            };

            var nearbyWards = ['Kalkaji', 'Nehru Place', 'Greater Kailash II'];
            if (nearbyWards.indexOf(vm.selectedWard) === -1) {
                nearbyWards = [vm.selectedWard, 'Kalkaji', 'Nehru Place'];
            }

            var utilData = allWardData[vm.selectedUtility] || allWardData.electricity;

            var wardColors = {
                'Kalkaji':            'linear-gradient(to top, #1D70B8, #3b9de8)',
                'Nehru Place':        'linear-gradient(to top, #7C3AED, #a78bfa)',
                'Greater Kailash II': 'linear-gradient(to top, #D97706, #fbbf24)',
                'Saket':              'linear-gradient(to top, #be185d, #f472b6)',
                'Hauz Khas':          'linear-gradient(to top, #0891b2, #67e8f9)'
            };
            var greyGradient = 'linear-gradient(to top, #6b7280, #9ca3af)';

            vm.wardSavingsGraphData = nearbyWards.map(function(w) {
                var d = utilData[w] || { score: '—', percent: 50 };
                var shortLabel = w === 'Greater Kailash II' ? 'GK II' : w;
                return {
                    label: shortLabel,
                    score: d.score,
                    percent: d.percent,
                    isCurrent: w === vm.selectedWard,
                    barColor: w === vm.selectedWard ? (wardColors[w] || 'linear-gradient(to top, #1D70B8, #3b9de8)') : greyGradient,
                    tooltip: w + ': ' + d.score + ' saved this month'
                };
            });

            // Right chart: user consumption vs ward average
            var wardAvg = utilData[vm.selectedWard] || { score: '—', percent: 70 };
            var userPct = Math.max(15, wardAvg.percent - 28);
            vm.userStandingGraphData = {
                avgVal: wardAvg.score,
                avgPercent: wardAvg.percent,
                userVal: Math.round(userPct * 0.8) + ' ' + unit,
                userPercent: userPct,
                tooltip: 'You are consuming less than the ward average!',
                summaryText: '🎉 You\'re below the ' + vm.selectedWard + ' average — keep it up! Saved ~' + Math.round(userPct * 0.5) + ' units of ' + savedRes + '.'
            };
        };

        // Initialize graphs
        vm.updateUtilityGraphs();

        // 3. Stress Map Blocks
        vm.heatmapBlocks = [
            { label: 'A', score: 92, stressClass: 'low-stress' },
            { label: 'B', score: 68, stressClass: 'med-stress' },
            { label: 'C', score: 41, stressClass: 'high-stress' },
            { label: 'D', score: 88, stressClass: 'low-stress' },
            { label: 'E', score: 95, stressClass: 'low-stress' },
            { label: 'F', score: 60, stressClass: 'med-stress' },
            { label: 'G', score: 83, stressClass: 'low-stress' },
            { label: 'H', score: 35, stressClass: 'high-stress' }
        ];
        // Calculate progress bar widths
        vm.overallStress = { success: 60, warning: 25, danger: 15 };

        vm.openMapModal = function(level) {
            $rootScope.showDialog('Map Opened', 'Opening ' + level + ' level map in a detailed view.', 'info');
        };

        // 4. Challenges Mock Data
        var allChallenges = [
            { id: 1, type: 'current', title: 'Peak Hour Saver',     points: 50,  desc: 'Cut your electricity usage during 6–10 PM peak hours to reduce grid overload and earn reward points.', icon: 'zap',     img: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=700&h=220&fit=crop&q=80', tag: '⚡ Electricity' },
            { id: 2, type: 'past',    title: 'Summer Water Saver',  points: 100, desc: 'Saved 5,000 litres of water across the ward by fixing leaks and reducing garden watering.',              icon: 'droplet', img: 'https://images.unsplash.com/photo-1548608762-4ab94b24dda6?w=700&h=220&fit=crop&q=80', tag: '💧 Water'       },
            { id: 3, type: 'future',  title: 'Winter Gas Reserve',  points: 150, desc: 'Avoid using gas heaters on high-demand days in January. Use district heating or layers instead.',         icon: 'flame',   img: 'https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=700&h=220&fit=crop&q=80', tag: '🔥 Gas'         },
            { id: 4, type: 'current', title: 'Waste Segregation',   points: 30,  desc: 'Sort household waste into wet, dry, and hazardous bins every day for a month to earn a clean ward badge.', icon: 'trash-2', img: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=700&h=220&fit=crop&q=80', tag: '♻️ Waste'       },
            { id: 5, type: 'future',  title: 'Solar Adoption Drive', points: 200, desc: 'Register interest in rooftop solar panels. Ward gets a collective discount when 50 households sign up.', icon: 'sun',     img: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=700&h=220&fit=crop&q=80', tag: '☀️ Solar'       },
            { id: 6, type: 'past',    title: 'Green Commute Week',  points: 75,  desc: 'Walk, cycle, or take public transit for 5 consecutive days. 340 residents participated in July.',          icon: 'bike',    img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700&h=220&fit=crop&q=80', tag: '🚲 Mobility'   }
        ];
        vm.filteredChallenges = [];
        
        $scope.$watch('vm.challengeFilter', function() {
            vm.filteredChallenges = allChallenges.filter(function(c) { return c.type === vm.challengeFilter; });
        });

        // 5. Advisories
        vm.activeAdvisories = [
            { cat: 'electricity', icon: '⚡', title: 'Grid Overload · Block C', desc: 'Feeder tripping due to high demand. Partial outage in C-3, C-4. Crews dispatched.', detail: 'Estimated fix: 10:45 PM tonight', date: '18 Mar, 21:30', status: 'critical', statusLabel: '🔴 Critical', pulse: true },
            { cat: 'water',       icon: '💧', title: 'Water Main Leak · ' + vm.selectedWard + ' Ext.', desc: 'Line damaged near local market. Low pressure in blocks E, F, G.', detail: 'Repair crew on-site', date: '2 hours ago', status: 'critical', statusLabel: '🔴 Critical', pulse: false },
            { cat: 'waste',       icon: '🗑️', title: 'Collection Delayed · Sector 7', desc: 'Vehicle breakdown. Alternate route arranged, collected by midnight.', detail: 'Temporary bins at corner', date: '18 Mar – 19 Mar', status: 'informational', statusLabel: '🔵 Info', pulse: false }
        ];
        vm.upcomingAdvisories = [
            { cat: 'electricity', icon: '⚡', title: 'Feeder Upgrade · A Block', desc: 'Planned shutdown for cable replacement. Backup generator covers essential supply.', detail: '4hrs, no residential outage', date: '21 Mar, 09:00–13:00', status: 'scheduled', statusLabel: '🟡 Scheduled', pulse: false },
            { cat: 'water',       icon: '💧', title: 'Hydrant Test · ' + vm.selectedWard, desc: 'Temporary discoloration possible. Safe after running tap 2 min.', detail: 'Water quality unaffected', date: '22 Mar, 8:00–17:00', status: 'informational', statusLabel: '🔵 Info', pulse: false },
            { cat: 'solar',       icon: '☀️', title: 'Solar Panel Cleaning', desc: 'Community centre rooftop. Power remains on via battery backup.', detail: '2 hour window', date: '20 Mar, 10:00–12:00', status: 'scheduled', statusLabel: '🟡 Scheduled', pulse: false },
            { cat: 'waste',       icon: '🗑️', title: 'Zero Waste Workshop', desc: 'Community hall · composting & segregation demo. Open to all residents.', detail: 'Free compost bin giveaway', date: '23 Mar, 4:00 PM', status: 'informational', statusLabel: '🔵 Info', pulse: false }
        ];
        // keep old vm.advisories for loadWardData title updates
        vm.advisories = vm.activeAdvisories;

        // 6. Ward Insights
        vm.stats = { solarAdoptionCount: 250 };
        vm.wardInsights = {
            coalSaved: '1,450',
            gasSaved: '890',
            waterSaved: '32,000'
        };

        vm.loadWardData = function() {
            vm.updateUtilityGraphs();
            vm.updateMapUrl();
            vm.activeAdvisories[1].title = 'Water Main Leak · ' + vm.selectedWard + ' Ext.';
            vm.upcomingAdvisories[1].title = 'Hydrant Test · ' + vm.selectedWard;
        };

        setTimeout(function(){ vm.loading = false; }, 500);
    }
})();
