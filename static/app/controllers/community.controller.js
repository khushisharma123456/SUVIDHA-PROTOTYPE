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
            if(vm.selectedUtility === 'electricity') {
                unit = 'kWh'; savedRes = 'Coal';
            } else if(vm.selectedUtility === 'water') {
                unit = 'kL'; savedRes = 'Groundwater';
            } else if(vm.selectedUtility === 'gas') {
                unit = 'kg'; savedRes = 'Fossil Fuels';
            } else {
                unit = 'kg'; savedRes = 'Landfill Space';
            }

            // Mock Data Generator for Near Wards
            vm.wardSavingsGraphData = [
                { label: 'Ward A', score: 65, percent: 65, isCurrent: false, tooltip: 'Saved 65 ' + unit + ' - saved ~120kg ' + savedRes },
                { label: vm.selectedWard, score: 90, percent: 90, isCurrent: true, tooltip: 'Saved 90 ' + unit + ' - saved ~180kg ' + savedRes },
                { label: 'Ward C', score: 50, percent: 50, isCurrent: false, tooltip: 'Saved 50 ' + unit + ' - saved ~80kg ' + savedRes },
                { label: 'Ward D', score: 75, percent: 75, isCurrent: false, tooltip: 'Saved 75 ' + unit + ' - saved ~140kg ' + savedRes }
            ];

            // User vs Ward Avg
            var userMoneySaved = Math.floor(Math.random() * 500) + 200;
            var resourceSaved = Math.floor(Math.random() * 50) + 10;
            var summary = "You saved ₹" + userMoneySaved + " for " + vm.selectedUtility + ", thereby saving " + resourceSaved + " units of " + savedRes + "!";
            
            vm.userStandingGraphData = {
                avgVal: '85 ' + unit,
                avgPercent: 85,
                userVal: '45 ' + unit,
                userPercent: 45,
                tooltip: "You consumed 45 " + unit + ", which is better than average!",
                summaryText: summary
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
            { id: 1, type: 'current', title: 'Peak Hour Saver', points: 50, desc: 'Reduce grid stress', icon: 'zap' },
            { id: 2, type: 'past', title: 'Summer Water Saver', points: 100, desc: 'Saved 5kL water', icon: 'droplet' },
            { id: 3, type: 'future', title: 'Winter Gas Reserve', points: 150, desc: 'Avoid using gas heaters', icon: 'flame' },
            { id: 4, type: 'current', title: 'Waste Segregation', points: 30, desc: 'Sort wet and dry', icon: 'trash-2' }
        ];
        vm.filteredChallenges = [];
        
        $scope.$watch('vm.challengeFilter', function() {
            vm.filteredChallenges = allChallenges.filter(function(c) { return c.type === vm.challengeFilter; });
        });

        // 5. Advisories
        vm.advisories = [
            { priority: 'info', icon: 'zap', title: 'Planned Maintenance for ' + vm.selectedWard, date: '20 Jan 2026', desc: 'Transformer upgrade affecting blocks A & B.' },
            { priority: 'info', icon: 'droplet', title: 'Water Schedule Change - ' + vm.selectedWard, date: 'Seasonal', desc: 'Morning supply active for the entire ward.' }
        ];

        // 6. Ward Insights
        vm.stats = { solarAdoptionCount: 250 };
        vm.wardInsights = {
            coalSaved: '1,450',
            gasSaved: '890',
            waterSaved: '32,000'
        };

        vm.loadWardData = function() {
            vm.updateUtilityGraphs();
            vm.advisories[0].title = 'Planned Maintenance for ' + vm.selectedWard;
            vm.advisories[1].title = 'Water Schedule Change - ' + vm.selectedWard;
        };

        setTimeout(function(){ vm.loading = false; }, 500);
    }
})();
