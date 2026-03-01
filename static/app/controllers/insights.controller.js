// Insights Controller
(function() {
    'use strict';

    angular.module('suvidhaApp')
        .controller('InsightsController', ['$scope', '$timeout', 'ApiService', InsightsController]);

    function InsightsController($scope, $timeout, ApiService) {
        var vm = this;
        var $rootScope = $scope.$root;
        vm.loading = true;
        vm.insightsData = {};
        vm.activeSection = 'profile';
        
        // Header Stats
        vm.stats = {
            efficiency: 0,
            analysisMonths: 6,
            wardRank: 0
        };
        vm.wardName = 'Loading...';

        // Profile Data
        vm.profile = {
            electricity: {
                score: 0,
                avgMonthly: 0,
                trend: 'stable'
            },
            water: {
                score: 0,
                avgMonthly: 0,
                trend: 'stable'
            },
            gas: {
                score: 0,
                avgMonthly: 0,
                trend: 'stable'
            }
        };

        // Recommendations
        vm.recommendations = {
            electricity: {
                savings: 0
            }
        };
        
        // Helper functions
        vm.getWardComparison = function(utility) {
            if (!vm.insightsData.comparisons) return '0%';
            var userAvg = vm.profile[utility]?.avgMonthly || 0;
            var wardAvg = vm.insightsData.comparisons.ward_avg || 0;
            
            if (wardAvg === 0 || userAvg === 0) return '±0%';
            
            var diff = ((userAvg - wardAvg) / wardAvg * 100).toFixed(0);
            if (diff > 0) return '+' + diff + '%';
            if (diff < 0) return diff + '%';
            return '±0%';
        };
        
        vm.getEfficiencyLabel = function(utility) {
            if (!vm.insightsData.efficiency) return 'unknown';
            return vm.insightsData.efficiency[utility] || 'unknown';
        };
        
        vm.getUserPositionPercent = function() {
            if (!vm.insightsData.comparisons) return 0;
            var userAvg = vm.profile.electricity.avgMonthly || 0;
            var wardAvg = vm.insightsData.comparisons.ward_avg || 1;
            if (wardAvg === 0) wardAvg = 1;
            var position = Math.min((userAvg / (wardAvg * 2)) * 100, 100);
            return position.toFixed(0);
        };
        
        vm.getUserPercentile = function() {
            if (!vm.insightsData.comparisons) return 50;
            var userAvg = vm.profile.electricity.avgMonthly || 0;
            var wardAvg = vm.insightsData.comparisons.ward_avg || 1;
            if (wardAvg === 0 || userAvg === 0) return 50;
            if (userAvg <= wardAvg) {
                return Math.max(((userAvg / wardAvg) * 50), 0).toFixed(0);
            } else {
                return Math.min((50 + ((userAvg - wardAvg) / wardAvg * 50)), 100).toFixed(0);
            }
        };
        
        vm.getTrendLabel = function(utility) {
            if (!vm.profile[utility]) return 'stable';
            var trend = vm.profile[utility].trend || 'stable';
            if (trend === 'improving') return 'improving';
            if (trend === 'warning') return 'warning';
            return 'stable';
        };
        
        vm.getTrendDescription = function(utility) {
            if (!vm.profile[utility] || vm.profile[utility].avgMonthly === 0) {
                return 'No consumption data available';
            }
            var trend = vm.profile[utility].trend || 'stable';
            if (trend === 'improving') return 'Usage reduced consistently';
            if (trend === 'warning') return 'Steady increase observed';
            return 'Minimal consumption variance';
        };
        
        vm.getTrendBadgeText = function(utility) {
            var trend = vm.getTrendLabel(utility);
            if (trend === 'improving') return 'Improving';
            if (trend === 'warning') return 'Increasing';
            return 'Stable';
        };
        
        vm.getTrendIcon = function(utility) {
            var trend = vm.getTrendLabel(utility);
            if (trend === 'improving') return 'trending-down';
            if (trend === 'warning') return 'trending-up';
            return 'minus';
        };

        // Methods
        vm.switchSection = switchSection;
        vm.viewDataDisclaimer = viewDataDisclaimer;
        vm.exportTrendData = exportTrendData;
        vm.viewMethodology = viewMethodology;
        vm.viewGovernmentAdvisory = viewGovernmentAdvisory;
        vm.raiseServiceRequest = raiseServiceRequest;
        vm.viewSafetyGuidelines = viewSafetyGuidelines;
        vm.viewProgramme = viewProgramme;

        function init() {
            loadInsightsData();
            $timeout(function() {
                initCharts();
                if (window.lucide) {
                    lucide.createIcons();
                }
            }, 100);
        }

        function switchSection(section) {
            vm.activeSection = section;
            $timeout(function() {
                if (section === 'trends') {
                    initCharts();
                }
                if (window.lucide) {
                    lucide.createIcons();
                }
            }, 100);
        }

        function loadInsightsData() {
            ApiService.getInsightsData()
                .then(function(response) {
                    vm.insightsData = response.data;
                    
                    // Update stats from API data
                    if (response.data.profile && response.data.profile.electricity) {
                        vm.stats.efficiency = Math.round(response.data.profile.electricity.score * 10);
                        vm.profile.electricity.score = response.data.profile.electricity.score;
                        vm.profile.electricity.avgMonthly = response.data.profile.electricity.avgMonthly;
                        vm.profile.electricity.trend = response.data.profile.electricity.trend;
                    }
                    
                    if (response.data.profile && response.data.profile.water) {
                        vm.profile.water.score = response.data.profile.water.score;
                        vm.profile.water.avgMonthly = response.data.profile.water.avgMonthly;
                        vm.profile.water.trend = response.data.profile.water.trend;
                    }
                    
                    if (response.data.profile && response.data.profile.gas) {
                        vm.profile.gas.score = response.data.profile.gas.score;
                        vm.profile.gas.avgMonthly = response.data.profile.gas.avgMonthly;
                        vm.profile.gas.trend = response.data.profile.gas.trend;
                    }
                    
                    if (response.data.recommendations && response.data.recommendations.electricity) {
                        vm.recommendations.electricity.savings = response.data.recommendations.electricity.savings;
                    }
                    
                    vm.loading = false;
                    
                    // Fetch ward name from community API
                    ApiService.getCommunityData()
                        .then(function(communityResponse) {
                            vm.wardName = communityResponse.data.ward || 'Unknown Ward';
                        });
                })
                .catch(function(error) {
                    console.error('Error loading insights data:', error);
                    vm.loading = false;
                });
        }

        function initCharts() {
            // Electricity Trend Chart
            var elecCtx = document.getElementById('electricityTrendChart');
            if (elecCtx && typeof Chart !== 'undefined') {
                new Chart(elecCtx.getContext('2d'), {
                    type: 'line',
                    data: {
                        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                        datasets: [{
                            data: [280, 265, 250, 240, 235, 225],
                            borderColor: 'rgb(16, 185, 129)',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            tension: 0.4,
                            fill: true
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false }
                        },
                        scales: {
                            y: { beginAtZero: false, display: false },
                            x: { display: true, grid: { display: false } }
                        }
                    }
                });
            }

            // Water Trend Chart
            var waterCtx = document.getElementById('waterTrendChart');
            if (waterCtx && typeof Chart !== 'undefined') {
                new Chart(waterCtx.getContext('2d'), {
                    type: 'line',
                    data: {
                        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                        datasets: [{
                            data: [16000, 16500, 17200, 17800, 18200, 18500],
                            borderColor: 'rgb(245, 158, 11)',
                            backgroundColor: 'rgba(245, 158, 11, 0.1)',
                            tension: 0.4,
                            fill: true
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false }
                        },
                        scales: {
                            y: { beginAtZero: false, display: false },
                            x: { display: true, grid: { display: false } }
                        }
                    }
                });
            }

            // Gas Trend Chart
            var gasCtx = document.getElementById('gasTrendChart');
            if (gasCtx && typeof Chart !== 'undefined') {
                new Chart(gasCtx.getContext('2d'), {
                    type: 'line',
                    data: {
                        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                        datasets: [{
                            data: [45, 42, 44, 40, 43, 42],
                            borderColor: 'rgb(59, 130, 246)',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            tension: 0.4,
                            fill: true
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false }
                        },
                        scales: {
                            y: { beginAtZero: false, display: false },
                            x: { display: true, grid: { display: false } }
                        }
                    }
                });
            }
        }

        function viewDataDisclaimer() {
            $rootScope.showDialog('Data Disclaimer', 'All insights are based on official utility billing records and ward-level benchmarks provided by government agencies. Data is updated monthly and verified against BRPL, DJB, and IGL records.', 'info');
        }

        function exportTrendData() {
            $rootScope.showDialog('Export Trend Data', 'Your 6-month consumption trend data for all utilities is being compiled into a downloadable CSV report. This includes monthly readings, cost breakdowns, and ward comparisons.', 'info');
        }

        function viewMethodology() {
            $rootScope.showDialog('Analysis Methodology', 'We analyze your consumption patterns against ward averages, seasonal trends, and household size benchmarks. Efficiency scores use a weighted average across 3 utilities with a 6-month rolling window.', 'info');
        }

        function viewGovernmentAdvisory(utility) {
            $rootScope.showDialog(utility + ' — Government Advisory', 'The latest government advisory for ' + utility + ' includes updated tariff schedules, conservation guidelines, and subsidy information. Visit your local utility office for detailed documentation.', 'info');
        }

        function raiseServiceRequest(utility) {
            window.location.href = '#!/services';
        }

        function viewSafetyGuidelines(utility) {
            $rootScope.showDialog(utility + ' Safety Guidelines', 'Essential safety guidelines for ' + utility + ': Regular maintenance schedules, emergency contact numbers, safety inspection procedures, and compliance requirements. For emergencies, call 112.', 'warning');
        }

        function viewProgramme(programme) {
            $rootScope.showDialog('Programme Details', 'The "' + programme + '" programme offers subsidies and incentives for efficient utility usage. Eligible households can save up to 15% on monthly bills.', 'success');
        }

        init();
    }
})();
