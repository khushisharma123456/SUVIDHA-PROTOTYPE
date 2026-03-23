// Dashboard Controller
(function() {
    'use strict';

    angular.module('suvidhaApp')
        .controller('DashboardController', ['$scope', '$timeout', 'ApiService', 'TranslationService', DashboardController]);

    function DashboardController($scope, $timeout, ApiService, TranslationService) {
        var vm = this;
        var $rootScope = $scope.$root;
        vm.loading = true;
        vm.userData = {};
        vm.userLocation = null;

        // ===== LANGUAGE SELECTOR FUNCTIONALITY =====
        vm.currentLanguage = TranslationService.getCurrentLanguage() || 'en';
        vm.showLanguageMenu = false;
        vm.availableLanguages = [
            { code: 'en', name: 'English', flag: '🇬🇧' },
            { code: 'hi', name: 'हिन्दी (Hindi)', flag: '🇮🇳' },
            { code: 'bn', name: 'বাংলা (Bengali)', flag: '🇮🇳' },
            { code: 'pa', name: 'ਪੰਜਾਬੀ (Punjabi)', flag: '🇮🇳' },
            { code: 'ta', name: 'தமிழ் (Tamil)', flag: '🇮🇳' },
            { code: 'te', name: 'తెలుగు (Telugu)', flag: '🇮🇳' },
            { code: 'kn', name: 'ಕನ್ನಡ (Kannada)', flag: '🇮🇳' },
            { code: 'gu', name: 'ગુજરાતી (Gujarati)', flag: '🇮🇳' },
            { code: 'ml', name: 'മലയാളം (Malayalam)', flag: '🇮🇳' },
            { code: 'mr', name: 'मराठी (Marathi)', flag: '🇮🇳' },
            { code: 'or', name: 'ଓଡ଼ିଆ (Odia)', flag: '🇮🇳' }
        ];

        vm.getCurrentLanguageLabel = function() {
            var lang = vm.availableLanguages.find(function(l) {
                return l.code === vm.currentLanguage;
            });
            return lang ? lang.name : 'English';
        };

        vm.switchLanguage = function(langCode) {
            vm.currentLanguage = langCode;
            TranslationService.setLanguage(langCode);
            vm.showLanguageMenu = false;
            // Persist language preference
            if ($rootScope.currentUser && $rootScope.currentUser.id) {
                ApiService.updateUserPreference('language', langCode).then(function() {
                    console.log('Language preference saved:', langCode);
                });
            }
        };

        vm.toggleLanguageMenu = function() {
            vm.showLanguageMenu = !vm.showLanguageMenu;
        };

        vm.closeLanguageMenu = function() {
            vm.showLanguageMenu = false;
        };

        // Listen for language changes from translation service
        $scope.$on('languageChanged', function(event, newLanguage) {
            vm.currentLanguage = newLanguage;
        });
        
        // ===== Utility Consumption Section =====
        vm.selectedUtility = 'electricity';
        vm.selectedPeriod = '6months';
        vm.utilitiesData = {};
        vm.utilityStats = {
            consumption: 0,
            unit: 'kWh',
            currentMonth: 'March 2026',
            pendingBills: 0,
            currentBill: 0,
            average: 0,
            chartSubtitle: 'Trend analysis for the past 6 months',
            peakMonth: '—',
            lowestMonth: '—',
            trendText: '—',
            trendClass: '',
            dataSource: 'Official Meter Readings',
            ratePlanTip: 'Loading rate plan data...'
        };

        // Rate Plan Data (from utilities controller)
        vm.ratePlanData = {
            electricity: {
                provider: 'BRPL (BSES Rajdhani)',
                slabs: [
                    { range: '0 – 200 units', rate: '₹3.00/kWh', type: 'Subsidized', highlight: false },
                    { range: '201 – 400 units', rate: '₹4.50/kWh', type: 'Standard', highlight: true },
                    { range: '401 – 800 units', rate: '₹6.50/kWh', type: 'Higher', highlight: false },
                    { range: '800+ units', rate: '₹7.00/kWh', type: 'Peak', highlight: false }
                ],
                fixedCharge: '₹25/kW/month',
                surcharge: '8% on energy charges',
                lastUpdated: 'Oct 2025'
            },
            gas: {
                provider: 'IGL (Indraprastha Gas)',
                slabs: [
                    { range: '0 – 30 SCM', rate: '₹28.82/SCM', type: 'Domestic', highlight: true },
                    { range: '30+ SCM', rate: '₹34.50/SCM', type: 'Above quota', highlight: false }
                ],
                fixedCharge: '₹45/month',
                lastUpdated: 'Nov 2025'
            },
            water: {
                provider: 'Delhi Jal Board',
                slabs: [
                    { range: '0 – 20 kL', rate: '₹2.58/kL', type: 'Essential', highlight: false },
                    { range: '20 – 30 kL', rate: '₹3.90/kL', type: 'Standard', highlight: true },
                    { range: '30+ kL', rate: '₹15.00/kL', type: 'Excess', highlight: false }
                ],
                fixedCharge: '₹98.82/month (sewage)',
                lastUpdated: 'Sep 2025'
            }
        };

        vm.showRatePlanModal = false;

        vm.viewRatePlanDetails = function() {
            vm.showRatePlanModal = true;
            $timeout(function() {
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            }, 50);
        };

        vm.closeRatePlanModal = function() {
            vm.showRatePlanModal = false;
        };

        // ===== NEW DASHBOARD WIDGETS DATA =====
        // Utility Health Score
        vm.healthScore = 82;

        // Unpaid Bills Tracking
        vm.unpaidBills = [
            { type: 'electricity', period: 'Feb 2026', amount: 1200, dueDate: '2026-02-28' },
            { type: 'water', period: 'Feb 2026', amount: 340, dueDate: '2026-02-28' },
            { type: 'gas', period: 'Jan 2026', amount: 680, dueDate: '2026-01-31' }
        ];

        vm.getTotalUnpaidBills = function() {
            return vm.unpaidBills.reduce(function(total, bill) {
                return total + bill.amount;
            }, 0);
        };

        vm.downloadBill = function(bill) {
            $rootScope.showDialog('Download Bill', 
                'Bill for ' + bill.type + ' (' + bill.period + ') for ₹' + bill.amount + ' is ready to download.', 
                'info', 'OK');
            // In real implementation, this would generate and download a PDF
        };

        vm.payBillIndividually = function(bill) {
            vm.showPayBillDialog = true;
            vm.payBillData = {
                amount: bill.amount,
                label: bill.type.charAt(0).toUpperCase() + bill.type.slice(1) + ' Bill',
                period: bill.period,
                dueDate: bill.dueDate
            };
            vm.payMethod = 'upi';
            $timeout(function() { if (typeof lucide !== 'undefined') lucide.createIcons(); }, 50);
        };

        vm.payAllBills = function() {
            var totalAmount = vm.getTotalUnpaidBills();
            vm.showPayBillDialog = true;
            vm.payBillData = {
                amount: totalAmount,
                label: 'All Outstanding Bills',
                period: 'Electricity + Water + Gas',
                dueDate: 'Immediate'
            };
            vm.payMethod = 'upi';
            $timeout(function() { if (typeof lucide !== 'undefined') lucide.createIcons(); }, 50);
        };

        // Monthly cost breakdown
        vm.monthlyMaxCosts = {
            electricity: 1850,
            water: 340,
            gas: 280
        };

        vm.getTotalMonthlyCost = function() {
            return vm.monthlyMaxCosts.electricity + vm.monthlyMaxCosts.water + vm.monthlyMaxCosts.gas;
        };

        // Sustainability & Environmental Contribution Data
        vm.totalPoints = 2450;
        vm.electricitySaved = 1250;
        vm.waterSaved = 3680;
        vm.gasSaved = 285;
        vm.coalSaved = 425;
        vm.carbonReduction = 520;
        vm.waterProjection = 3.2;

        // Government Schemes Data (State-specific)
        vm.userState = 'Delhi';
        vm.currentSchemeIndex = 0;
        vm.governmentSchemes = [
            {
                name: 'Electricity Subsidy Scheme',
                description: 'Subsidized electricity rates for domestic consumers up to 400 units',
                icon: '⚡',
                subsidy: 'Up to ₹3000/year',
                link: 'https://sites.google.com/site/brpldelhionline/'
            },
            {
                name: 'Solar Rooftop Subsidy',
                description: 'Government subsidy for installing solar panels on residential rooftops',
                icon: '☀️',
                subsidy: 'Up to 40% grant',
                link: 'https://mnre.gov.in/solar/current_status/status-of-grid-connected-rooftop-solar-and-other-schemes'
            },
            {
                name: 'Water Conservation Grant',
                description: 'Rebate on water bills for households implementing water-saving measures',
                icon: '💧',
                subsidy: 'Up to ₹2000/year',
                link: 'https://dwcd.delhi.gov.in/'
            },
            {
                name: 'Affordable Housing Scheme',
                description: 'Affordable housing units with subsidized utility connections',
                icon: '🏠',
                subsidy: '50% connection fee waived',
                link: 'https://housing.delhi.gov.in/'
            },
            {
                name: 'LPG Subsidy Scheme',
                description: 'Direct benefit transfer for cooking gas cylinder subsidy',
                icon: '🔥',
                subsidy: '₹200-300 per cylinder',
                link: 'https://www.pmuy.gov.in/'
            },
            {
                name: 'Drinking Water Scheme',
                description: 'Pure drinking water supply in all households with minimal charges',
                icon: '🚰',
                subsidy: 'Free installation',
                link: 'https://jal.delhi.gov.in/'
            },
            {
                name: 'Pollution Control Incentive',
                description: 'Incentive for switching to CNG or electric vehicles',
                icon: '🌿',
                subsidy: 'Up to ₹5000 subsidy',
                link: 'https://parivesh.nic.in/'
            },
            {
                name: 'Elderly Utility Discount',
                description: 'Special discount on electricity and water bills for senior citizens',
                icon: '👴',
                subsidy: '5-10% discount',
                link: 'https://social.delhi.gov.in/'
            }
        ];

        // Set up carousel auto-scroll
        vm.setCurrentScheme = function(index) {
            vm.currentSchemeIndex = index;
        };

        vm.openSchemeLink = function(scheme) {
            if (scheme && scheme.link) {
                window.open(scheme.link, '_blank');
            }
        };

        // Auto-rotate carousel every 5 seconds
        var schemeAutoRotate = $timeout(function rotateScheme() {
            vm.currentSchemeIndex = (vm.currentSchemeIndex + 1) % vm.governmentSchemes.length;
            schemeAutoRotate = $timeout(rotateScheme, 5000);
        }, 5000);

        // Cleanup on controller destroy
        $scope.$on('$destroy', function() {
            if (schemeAutoRotate) {
                $timeout.cancel(schemeAutoRotate);
            }
        });

        // Bill Forecast (estimated next bill)
        vm.forecastElectricity = 950;
        vm.forecastWater = 210;
        vm.forecastGas = 480;

        // Utility consumption chart instance
        var utilityChartInstance = null;

        // Default consumption data (will be overridden by API)
        var defaultConsumptionData = {
            electricity: {
                months: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
                monthly_data: [280, 310, 290, 350, 310, 295, 285, 305, 342, 245, 260, 275],
                provider: 'BRPL (BSES Rajdhani)',
                unit: 'kWh'
            },
            gas: {
                months: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
                monthly_data: [18, 14, 10, 10, 12, 14, 16, 20, 24, 22, 20, 18],
                provider: 'IGL (Indraprastha Gas)',
                unit: 'SCM'
            },
            water: {
                months: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
                monthly_data: [18, 20, 22, 25, 22, 20, 19, 18, 18, 20, 19, 21],
                provider: 'Delhi Jal Board',
                unit: 'kL'
            }
        };

        // Switch utility tab
        vm.switchUtility = function(utility) {
            vm.selectedUtility = utility;
            updateUtilityStats();
            updateUtilityChart();
            $timeout(function() {
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            }, 50);
        };

        // On period change
        vm.onPeriodChange = function() {
            updateUtilityStats();
            updateUtilityChart();
        };

        // Get months count from period
        function getMonthsForPeriod(period) {
            switch(period) {
                case '3months': return 3;
                case '6months': return 6;
                case '1year': return 12;
                default: return 6;
            }
        }

        // Update utility stats based on selected utility and period
        function updateUtilityStats() {
            var utility = vm.selectedUtility;
            var data = vm.utilitiesData[utility] || defaultConsumptionData[utility];
            if (!data) return;

            var monthsCount = getMonthsForPeriod(vm.selectedPeriod);
            var monthlyData = data.monthly_data || [];
            var months = data.months || [];

            // Slice to period
            var slicedData = monthlyData.slice(-monthsCount);
            var slicedMonths = months.slice(-monthsCount);

            // Consumption total
            var total = slicedData.reduce(function(a, b) { return a + b; }, 0);
            var avg = slicedData.length > 0 ? Math.round(total / slicedData.length) : 0;

            // Peak and lowest
            var peakVal = Math.max.apply(null, slicedData.length > 0 ? slicedData : [0]);
            var lowestVal = Math.min.apply(null, slicedData.length > 0 ? slicedData : [0]);
            var peakIdx = slicedData.indexOf(peakVal);
            var lowestIdx = slicedData.indexOf(lowestVal);

            // Unit
            var unitMap = { electricity: 'kWh', gas: 'SCM', water: 'kL' };
            var unit = data.unit || unitMap[utility] || 'Units';

            // Data source
            var sourceMap = {
                electricity: 'Data Source: BRPL Official Meter Readings',
                gas: 'Data Source: IGL Meter Readings',
                water: 'Data Source: Delhi Jal Board'
            };

            // Trend calculation
            var trendText = '—';
            var trendClass = '';
            if (slicedData.length >= 2) {
                var last = slicedData[slicedData.length - 1];
                var prev = slicedData[slicedData.length - 2];
                if (prev > 0) {
                    var change = Math.round(((last - prev) / prev) * 100);
                    if (change > 0) {
                        trendText = '+' + change + '% from last month';
                        trendClass = 'trend-up';
                    } else if (change < 0) {
                        trendText = change + '% from last month';
                        trendClass = 'trend-down';
                    } else {
                        trendText = 'No change from last month';
                        trendClass = '';
                    }
                }
            }

            // Current bill estimation
            var currentConsumption = monthlyData.length > 0 ? monthlyData[monthlyData.length - 1] : 0;
            var billAmount = 0;
            if (utility === 'electricity') {
                billAmount = Math.round(currentConsumption * 4.5);
            } else if (utility === 'water') {
                billAmount = Math.round(currentConsumption * 20);
            } else if (utility === 'gas') {
                billAmount = Math.round(currentConsumption * 50);
            }

            // Pending bills
            var pendingBills = 0;
            if (vm.userData.consumption) {
                var statuses = ['pending', 'overdue'];
                if (statuses.indexOf((vm.userData.consumption[utility] || {}).status) !== -1) {
                    pendingBills = 1;
                }
            }

            // Rate plan tip
            var tipMap = {
                electricity: 'Your current usage places you in Slab 2. Save 45 units to get subsidized rates!',
                gas: 'Your usage is within the domestic quota at ₹28.82/SCM.',
                water: 'Your usage is in the standard range. Keep it below 20 kL for essential rates!'
            };

            // Chart subtitle
            var subtitleMap = {
                '3months': 'Trend for the past 3 months',
                '6months': 'Trend for the past 6 months',
                '1year': 'Trend for the past 12 months'
            };

            var now = new Date();
            var currentMonthStr = now.toLocaleString('default', { month: 'long', year: 'numeric' });

            vm.utilityStats = {
                consumption: total,
                unit: unit,
                currentMonth: currentMonthStr,
                pendingBills: pendingBills,
                currentBill: billAmount,
                average: avg,
                chartSubtitle: subtitleMap[vm.selectedPeriod] || 'Trend analysis',
                peakMonth: (slicedMonths[peakIdx] || '—') + ' (' + peakVal + ' ' + unit + ')',
                lowestMonth: (slicedMonths[lowestIdx] || '—') + ' (' + lowestVal + ' ' + unit + ')',
                trendText: trendText,
                trendClass: trendClass,
                dataSource: sourceMap[utility] || 'Official Meter Readings',
                ratePlanTip: tipMap[utility] || ''
            };
        }

        // Update utility chart
        function updateUtilityChart() {
            var utility = vm.selectedUtility;
            var data = vm.utilitiesData[utility] || defaultConsumptionData[utility];
            if (!data) return;

            var monthsCount = getMonthsForPeriod(vm.selectedPeriod);
            var slicedData = (data.monthly_data || []).slice(-monthsCount);
            var slicedMonths = (data.months || []).slice(-monthsCount);

            var colorMap = {
                electricity: { bg: '#0F52BA', border: '#0F52BA' },
                gas: { bg: '#FF9933', border: '#FF9933' },
                water: { bg: '#00A86B', border: '#00A86B' }
            };
            var chartType = utility === 'gas' ? 'line' : 'bar';
            var colors = colorMap[utility] || colorMap.electricity;

            $timeout(function() {
                var canvas = document.getElementById('utilityConsumptionChart');
                if (!canvas) return;

                if (utilityChartInstance) {
                    utilityChartInstance.destroy();
                    utilityChartInstance = null;
                }

                var unitMap = { electricity: 'kWh', gas: 'SCM', water: 'kL' };
                var unit = data.unit || unitMap[utility] || 'Units';

                var dataset = {
                    label: 'Units (' + unit + ')',
                    data: slicedData,
                    backgroundColor: chartType === 'line' ? 'rgba(' + hexToRgb(colors.bg) + ', 0.1)' : colors.bg,
                    borderColor: colors.border,
                    borderRadius: chartType === 'bar' ? 4 : 0,
                    fill: chartType === 'line',
                    tension: chartType === 'line' ? 0.4 : 0
                };

                utilityChartInstance = new Chart(canvas, {
                    type: chartType,
                    data: {
                        labels: slicedMonths,
                        datasets: [dataset]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                grid: { display: true, color: '#f0f0f0' }
                            },
                            x: {
                                grid: { display: false }
                            }
                        }
                    }
                });
            }, 100);
        }

        function hexToRgb(hex) {
            hex = hex.replace('#', '');
            var r = parseInt(hex.substring(0,2), 16);
            var g = parseInt(hex.substring(2,4), 16);
            var b = parseInt(hex.substring(4,6), 16);
            return r + ', ' + g + ', ' + b;
        }

        // Default dummy data for display
        var defaultData = {
            consumption: {
                electricity: { current: 245, current_bill: 1850, unit: 'kWh', billing_period: 'Jan 2026', due_date: '15 Feb 2026', status: 'pending' },
                water: { current: 12, current_bill: 420, unit: 'kL', billing_period: 'Jan 2026', due_date: '10 Feb 2026', status: 'paid' },
                gas: { current: 8, current_bill: 650, unit: 'SCM', billing_period: 'Jan 2026', due_date: '20 Feb 2026', status: 'pending' }
            },
            reports: { total: 3, open: 1, in_progress: 1, resolved: 1 },
            community: { points: 120 }
        };

        function deriveDisplayName(dashboardData, stored) {
            var fromBackend = dashboardData && dashboardData.user &&
                (dashboardData.user.full_name || dashboardData.user.name || dashboardData.user.username);
            var fromRoot = dashboardData && (dashboardData.full_name || dashboardData.name || dashboardData.username);
            var fromStored = stored && (stored.full_name || stored.name || stored.username);
            return fromBackend || fromRoot || fromStored || 'Citizen';
        }

        // Load user from localStorage immediately for fast display
        var storedUser = JSON.parse(localStorage.getItem('suvidhaUser') || 'null');
        if (storedUser) {
            vm.userData = {
                username: storedUser.full_name || storedUser.name || 'Citizen',
                user: {
                    full_name: storedUser.full_name || storedUser.name || '',
                    email: storedUser.email || '',
                    phone: storedUser.phone || '',
                    locality: storedUser.locality || '',
                    ward: storedUser.ward || '',
                    city: storedUser.city || ''
                },
                consumption: defaultData.consumption,
                reports: defaultData.reports,
                community: defaultData.community
            };
        } else {
            vm.userData = angular.extend({ username: 'Citizen', user: {} }, defaultData);
        }
        vm.userData.username = deriveDisplayName(vm.userData, storedUser);
        // Set initial urgent alert + notification count from stored/default data
        $timeout(function() { updateUrgentAlert(); }, 0);
        
        // Request browser geolocation
        vm.requestLocation = function() {
            if (!navigator.geolocation) {
                $rootScope.showDialog('Location Unavailable', 'Your browser does not support geolocation.', 'warning');
                return;
            }
            navigator.geolocation.getCurrentPosition(
                function(position) {
                    var lat = position.coords.latitude.toFixed(4);
                    var lon = position.coords.longitude.toFixed(4);
                    // Try reverse geocoding via free API
                    fetch('https://nominatim.openstreetmap.org/reverse?format=json&lat=' + lat + '&lon=' + lon + '&zoom=16')
                        .then(function(r) { return r.json(); })
                        .then(function(data) {
                            $scope.$apply(function() {
                                var addr = data.address || {};
                                vm.userLocation = (addr.neighbourhood || addr.suburb || addr.road || '') + 
                                    (addr.city || addr.town || addr.state_district ? ', ' + (addr.city || addr.town || addr.state_district) : '') +
                                    (addr.state ? ', ' + addr.state : '');
                                if (!vm.userLocation || vm.userLocation === ', ') {
                                    vm.userLocation = data.display_name ? data.display_name.split(',').slice(0, 3).join(',') : lat + ', ' + lon;
                                }
                            });
                        })
                        .catch(function() {
                            $scope.$apply(function() {
                                vm.userLocation = lat + ', ' + lon;
                            });
                        });
                },
                function(error) {
                    $rootScope.showDialog('Location Access', 'Please allow location access in your browser to detect your current location.', 'info');
                },
                { enableHighAccuracy: true, timeout: 10000 }
            );
        };
        
        // Helper functions for cost calculations
        vm.getTotalCost = function() {
            if (!vm.userData.consumption) return 0;
            var elec = vm.userData.consumption.electricity?.current_bill || 0;
            var water = vm.userData.consumption.water?.current_bill || 0;
            var gas = vm.userData.consumption.gas?.current_bill || 0;
            return elec + water + gas;
        };
        
        vm.getPercentage = function(utility) {
            var total = vm.getTotalCost();
            if (total === 0) return 0;
            var amount = vm.userData.consumption?.[utility]?.current_bill || 0;
            return Math.round((amount / total) * 100);
        };

        // Modal state
        vm.showUtilityModal = false;
        vm.modalData = {};

        // Close modal
        vm.closeModal = function() {
            vm.showUtilityModal = false;
        };

        // Open modal for specific utility
        vm.openModal = function(utility) {
            var utilityKey = utility || 'electricity';
            var consumptionData = vm.userData.consumption ? vm.userData.consumption[utilityKey] : null;
            var defaultData = defaultConsumptionData[utilityKey] || {};
            var usageInsights = getUtilityUsageInsights(utilityKey);
            var iconClass = utilityKey === 'electricity' ? 'zap' : (utilityKey === 'gas' ? 'flame' : 'droplet');
            
            vm.modalData = {
                title: (utilityKey === 'electricity' ? 'Electricity' : (utilityKey === 'gas' ? 'Gas' : 'Water')),
                icon: iconClass,
                type: utilityKey,
                currentBill: consumptionData ? ('₹' + (consumptionData.current_bill || 0)) : '₹0',
                lastMonth: consumptionData ? ('₹' + (consumptionData.last_bill || 0)) : 'N/A',
                units: (consumptionData ? (consumptionData.current || 0) : 0) + ' ' + (defaultData.unit || 'units'),
                status: consumptionData ? (consumptionData.status || 'N/A').charAt(0).toUpperCase() + (consumptionData.status || 'N/A').slice(1) : 'N/A',
                dueDate: consumptionData ? (consumptionData.due_date || 'N/A') : 'N/A',
                trend: consumptionData ? (consumptionData.trend || '+5% from last month') : '+5% from last month',
                leastUsageMonth: usageInsights.leastMonth,
                highestUsageMonth: usageInsights.highestMonth,
                leastUsageSeason: usageInsights.leastSeason,
                highestUsageSeason: usageInsights.highestSeason
            };
            
            vm.showUtilityModal = true;
            vm.bandhuUtility = utilityKey;
            
            $timeout(function() {
                if (typeof lucide !== 'undefined') lucide.createIcons();
            }, 50);
        };

        // ===== NOTIFICATION PANEL =====
        vm.showNotifDropdown = false;
        vm.pendingNotifCount = 0;

        vm.toggleNotifications = function() {
            vm.showNotifDropdown = !vm.showNotifDropdown;
            vm.showAllNotifDialog = false;
        };

        vm.closeNotifications = function() {
            vm.showNotifDropdown = false;
        };

        vm.showAllNotifDialog = false;

        vm.openAllNotifDialog = function() {
            vm.showNotifDropdown = false;
            vm.showAllNotifDialog = true;
            $timeout(function() { if (typeof lucide !== 'undefined') lucide.createIcons(); }, 50);
        };

        vm.closeAllNotifDialog = function() {
            vm.showAllNotifDialog = false;
        };

        // ===== SERVICE STATUS DIALOG =====
        vm.showServiceDialog = false;

        vm.openServiceStatusDialog = function() {
            vm.showServiceDialog = true;
            $timeout(function() { if (typeof lucide !== 'undefined') lucide.createIcons(); }, 50);
        };

        vm.closeServiceDialog = function() {
            vm.showServiceDialog = false;
        };

        // ===== PAY BILL DIALOG =====
        vm.showPayBillDialog = false;
        vm.payBillData = {};
        vm.payMethod = 'upi';
        vm.payBillProcessing = false;

        vm.openPayBillDialog = function() {
            vm.payBillData = {
                amount: (vm.userData.consumption && vm.userData.consumption.electricity.current_bill) || 0,
                label: 'Electricity Bill',
                period: (vm.userData.consumption && vm.userData.consumption.electricity.billing_period) || 'Current Period',
                dueDate: (vm.userData.consumption && vm.userData.consumption.electricity.due_date) || 'N/A'
            };
            vm.showPayBillDialog = true;
            $timeout(function() { if (typeof lucide !== 'undefined') lucide.createIcons(); }, 50);
        };

        vm.closePayBillDialog = function() {
            vm.showPayBillDialog = false;
            vm.payBillProcessing = false;
        };

        vm.confirmPayBill = function() {
            vm.payBillProcessing = true;
            $timeout(function() {
                if (vm.userData.consumption) {
                    vm.userData.consumption.electricity.status = 'paid';
                }
                vm.payBillProcessing = false;
                vm.showPayBillDialog = false;
                updateUrgentAlert();
                $rootScope.showDialog('Payment Successful',
                    'Electricity bill payment of \u20b9' + vm.payBillData.amount + ' processed successfully!',
                    'success', 'Great!');
            }, 1500);
        };

        // ===== URGENT ALERT BANNER =====
        vm.urgentAlert = false;

        function updateUrgentAlert() {
            var e = vm.userData.consumption && vm.userData.consumption.electricity;
            var g = vm.userData.consumption && vm.userData.consumption.gas;
            vm.urgentAlert = (e && (e.status === 'pending' || e.status === 'overdue')) ||
                             (g && (g.status === 'pending' || g.status === 'overdue'));
            vm.pendingNotifCount = 0;
            if (e && (e.status === 'pending' || e.status === 'overdue')) vm.pendingNotifCount++;
            if (g && (g.status === 'pending' || g.status === 'overdue')) vm.pendingNotifCount++;
            if (vm.userData.reports && vm.userData.reports.resolved > 0) vm.pendingNotifCount++;
        }

        function monthKeyToIndex(monthLabel) {
            if (!monthLabel) return -1;
            var m = String(monthLabel).toLowerCase().slice(0, 3);
            var map = {
                jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
                jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
            };
            return map[m] !== undefined ? map[m] : -1;
        }

        function getSeason(monthLabel) {
            var idx = monthKeyToIndex(monthLabel);
            if (idx === -1) return 'N/A';
            if (idx === 11 || idx <= 1) return 'Winter';
            if (idx >= 2 && idx <= 4) return 'Summer';
            if (idx >= 5 && idx <= 8) return 'Monsoon';
            return 'Autumn';
        }

        function getUtilityUsageInsights(utilityKey) {
            var source = vm.utilitiesData[utilityKey] || defaultConsumptionData[utilityKey] || {};
            var months = source.months || [];
            var values = source.monthly_data || [];

            if (!months.length || !values.length) {
                return {
                    leastMonth: 'N/A',
                    highestMonth: 'N/A',
                    leastSeason: 'N/A',
                    highestSeason: 'N/A'
                };
            }

            var minValue = Math.min.apply(null, values);
            var maxValue = Math.max.apply(null, values);
            var minIndex = values.indexOf(minValue);
            var maxIndex = values.indexOf(maxValue);

            var seasonTotals = {
                Winter: 0,
                Summer: 0,
                Monsoon: 0,
                Autumn: 0
            };

            for (var i = 0; i < months.length; i++) {
                var seasonName = getSeason(months[i]);
                if (seasonTotals[seasonName] !== undefined) {
                    seasonTotals[seasonName] += Number(values[i]) || 0;
                }
            }

            var leastSeason = 'Winter';
            var highestSeason = 'Winter';
            Object.keys(seasonTotals).forEach(function(seasonName) {
                if (seasonTotals[seasonName] < seasonTotals[leastSeason]) {
                    leastSeason = seasonName;
                }
                if (seasonTotals[seasonName] > seasonTotals[highestSeason]) {
                    highestSeason = seasonName;
                }
            });

            return {
                leastMonth: (months[minIndex] || 'N/A') + ' (' + minValue + ')',
                highestMonth: (months[maxIndex] || 'N/A') + ' (' + maxValue + ')',
                leastSeason: leastSeason,
                highestSeason: highestSeason
            };
        }

        // ===== MARKDOWN HELPER =====
        function mdToHtml(text) {
            if (!text) return '';
            // Escape HTML first
            var s = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            // Bold: **text**
            s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
            // Italic: *text*
            s = s.replace(/\*(.+?)\*/g, '<em>$1</em>');
            // Line breaks
            s = s.replace(/\n/g, '<br>');
            return s;
        }

        // ===== GLOBAL ASK SUVIDHA CHAT =====
        vm.showGlobalChat = false;
        vm.globalChatInput = '';
        vm.globalChatHistory = [];
        vm.globalChatLoading = false;

        vm.openGlobalChat = function() {
            vm.showGlobalChat = true;
            $timeout(function() { if (typeof lucide !== 'undefined') lucide.createIcons(); }, 50);
        };

        vm.closeGlobalChat = function() {
            vm.showGlobalChat = false;
            vm.globalChatLoading = false;
        };

        vm.sendGlobalChat = function() {
            if (!vm.globalChatInput || vm.globalChatLoading) return;
            var question = vm.globalChatInput;
            vm.globalChatHistory.push({ role: 'user', text: question });
            vm.globalChatInput = '';
            vm.globalChatLoading = true;

            var totalCost = vm.getTotalCost();
            var context = [
                'User: ' + (vm.userData.username || 'Citizen'),
                'State: ' + (vm.userState || 'N/A'),
                'Total monthly utility cost: ₹' + totalCost,
                'Electricity: ' + ((vm.userData.consumption && vm.userData.consumption.electricity.current) || 0) + ' ' + ((vm.userData.consumption && vm.userData.consumption.electricity.unit) || 'kWh') + ', Bill: ₹' + ((vm.userData.consumption && vm.userData.consumption.electricity.current_bill) || 0),
                'Water: ' + ((vm.userData.consumption && vm.userData.consumption.water.current) || 0) + ' ' + ((vm.userData.consumption && vm.userData.consumption.water.unit) || 'kL') + ', Bill: ₹' + ((vm.userData.consumption && vm.userData.consumption.water.current_bill) || 0),
                'Gas: ' + ((vm.userData.consumption && vm.userData.consumption.gas.current) || 0) + ' ' + ((vm.userData.consumption && vm.userData.consumption.gas.unit) || 'SCM') + ', Bill: ₹' + ((vm.userData.consumption && vm.userData.consumption.gas.current_bill) || 0),
                'Question: ' + question
            ].join('\n');

            fetch('/api/ask-suvidha', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: context,
                    system: 'You are Suvidha, a friendly Indian civic services AI assistant. Help citizens with utility bills, government schemes, consumption tips, and civic services. Be concise and helpful. Use 3-5 short bullet points when giving advice.'
                })
            })
            .then(function(res) { return res.json(); })
            .then(function(data) {
                $scope.$apply(function() {
                    vm.globalChatLoading = false;
                    var text = (data && data.success && data.response) ? mdToHtml(data.response) : ((data && data.error) || 'Sorry, I could not process that. Please try again.');
                    vm.globalChatHistory.push({ role: 'ai', text: text });
                    $timeout(function() {
                        var el = document.querySelector('.global-chat-messages');
                        if (el) el.scrollTop = el.scrollHeight;
                        if (typeof lucide !== 'undefined') lucide.createIcons();
                    }, 50);
                });
            })
            .catch(function() {
                $scope.$apply(function() {
                    vm.globalChatLoading = false;
                    vm.globalChatHistory.push({ role: 'ai', text: 'Unable to connect right now. Please try again later.' });
                });
            });
        };

        // ===== ASK SUVIDHA BANDHU (AI) =====
        vm.showBandhuDialog = false;
        vm.bandhuUtility = 'electricity';
        vm.suvidhaInput = '';
        vm.suvidhaResponse = '';
        vm.suvidhaLoading = false;

        vm.openBandhuDialog = function() {
            vm.showBandhuDialog = true;
            vm.bandhuUtility = (vm.modalData && vm.modalData.type) ? vm.modalData.type : 'electricity';
            vm.suvidhaInput = '';
            vm.suvidhaResponse = '';
            $timeout(function() { if (typeof lucide !== 'undefined') lucide.createIcons(); }, 50);
        };

        vm.closeBandhuDialog = function() {
            vm.showBandhuDialog = false;
            vm.suvidhaLoading = false;
        };

        vm.askSuvidhaBandhu = function() {
            if (!vm.suvidhaInput || vm.suvidhaLoading) return;
            var question = vm.suvidhaInput;
            vm.suvidhaLoading = true;
            vm.suvidhaResponse = '';

            var utility = vm.bandhuUtility || 'electricity';
            var utilityTitle = utility.charAt(0).toUpperCase() + utility.slice(1);
            var insights = getUtilityUsageInsights(utility);
            var utilityData = (vm.userData.consumption && vm.userData.consumption[utility]) || {};
            var totalCost = vm.getTotalCost();

            var composedContext = [
                'You are Suvidha Bandhu, an Indian civic utility advisor.',
                'Analyze citizen utility trends and provide practical monthly cost reduction tips.',
                'Utility: ' + utilityTitle,
                'Current usage: ' + (utilityData.current || 0) + ' ' + (utilityData.unit || 'units'),
                'Current bill: ₹' + (utilityData.current_bill || 0),
                'Status: ' + (utilityData.status || 'N/A') + ', Due: ' + (utilityData.due_date || 'N/A'),
                'Least usage month: ' + (insights.leastMonth || 'N/A'),
                'Highest usage month: ' + (insights.highestMonth || 'N/A'),
                'Least usage season: ' + (insights.leastSeason || 'N/A'),
                'Highest usage season: ' + (insights.highestSeason || 'N/A'),
                'Total monthly cost across utilities: ₹' + totalCost,
                'User question: ' + question,
                'Respond in concise plain English (4-6 short bullet points), mention both highest and lowest month/season, and give action steps for this month.'
            ].join('\n');

            fetch('/api/ask-suvidha', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: composedContext,
                    system: 'You are Suvidha Bandhu, an Indian civic utility advisor. Analyze citizen utility trends and provide practical monthly cost reduction tips. Respond in concise plain English (4-6 short bullet points), mention both highest and lowest month/season, and give action steps for this month.'
                })
            })
            .then(function(res) { return res.json(); })
            .then(function(data) {
                $scope.$apply(function() {
                    vm.suvidhaLoading = false;
                    if (data && data.success && data.response) {
                        vm.suvidhaResponse = mdToHtml(data.response);
                    } else {
                        vm.suvidhaResponse = (data && data.error) || 'I could not process your query right now. Please try again.';
                    }
                    vm.suvidhaInput = '';
                });
            })
            .catch(function() {
                $scope.$apply(function() {
                    vm.suvidhaLoading = false;
                    vm.suvidhaResponse = 'Unable to connect to Suvidha AI right now. Please try again later.';
                });
            });
        };

        // Chart period toggle
        vm.chartPeriod = '6M';
        var trendChartInstance = null;

        var chartData = {
            '6M': {
                labels: ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'],
                electricity: [310, 295, 285, 305, 342, 245],
                water: [17, 16, 14, 15, 15.2, 12]
            },
            '1Y': {
                labels: ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'],
                electricity: [280, 310, 290, 275, 320, 350, 310, 295, 285, 305, 342, 245],
                water: [14, 15, 16, 18, 22, 25, 17, 16, 14, 15, 15.2, 12]
            }
        };

        vm.switchChartPeriod = function(period) {
            vm.chartPeriod = period;
            updateTrendChart(period);
        };

        function updateTrendChart(period) {
            if (!trendChartInstance) return;
            var data = chartData[period];
            trendChartInstance.data.labels = data.labels;
            trendChartInstance.data.datasets[0].data = data.electricity;
            trendChartInstance.data.datasets[1].data = data.water;
            trendChartInstance.update();
        }

        // Initialize
        function init() {
            loadDashboardData();
            loadUtilitiesData();
            $timeout(function() {
                initializeHelixVisualization();
            }, 100);
        }

        function loadDashboardData() {
            ApiService.getDashboardData()
                .then(function(response) {
                    // Handle response from main.py API
                    if (response.data.success && response.data.dashboard) {
                        vm.userData = response.data.dashboard;
                        vm.userData.username = deriveDisplayName(response.data.dashboard, storedUser);
                        vm.user = response.data.dashboard.user;
                        vm.billsSummary = response.data.dashboard.bills_summary;
                        vm.complaintsSummary = response.data.dashboard.complaints_summary;
                        vm.community = response.data.dashboard.community;
                        vm.recentBills = response.data.dashboard.recent_bills;
                        vm.recentComplaints = response.data.dashboard.recent_complaints;
                    } else {
                        vm.userData = response.data;
                    }
                    vm.loading = false;
                    updateUtilityStats();
                    updateUrgentAlert();
                })
                .catch(function(error) {
                    console.error('Error loading dashboard data:', error);
                    vm.loading = false;
                    // Set default data to prevent errors
                    vm.userData = angular.extend(vm.userData || {}, defaultData);
                    vm.userData.username = deriveDisplayName(vm.userData, storedUser);
                    if (!vm.userData.reports) vm.userData.reports = defaultData.reports;
                    if (!vm.userData.community) vm.userData.community = defaultData.community;
                    updateUtilityStats();
                    updateUrgentAlert();
                });
        }

        function loadUtilitiesData() {
            ApiService.getUtilitiesData()
                .then(function(response) {
                    vm.utilitiesData = response.data;
                    updateUtilityStats();
                    updateUtilityChart();
                })
                .catch(function(error) {
                    console.error('Error loading utilities data:', error);
                    // Use default data
                    vm.utilitiesData = defaultConsumptionData;
                    updateUtilityStats();
                    updateUtilityChart();
                });
        }

        function initializeHelixVisualization() {
            const canvas = document.getElementById('dna-canvas');
            if (!canvas) {
                console.warn('Canvas element not found');
                return;
            }
            
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                console.warn('Canvas context not available');
                return;
            }
            
            const container = document.getElementById('dna-container');
            const tooltip = document.getElementById('dna-tooltip');
            
            if (!container || !tooltip) {
                console.warn('Container or tooltip not found');
                return;
            }
            
            // Utility data
            const utilityData = {
                electricity: {
                    color: {r: 34, g: 197, b: 94},
                    name: 'Electricity',
                    currentBill: '₹1,850',
                    lastMonth: '₹1,720',
                    units: '285 kWh',
                    status: 'Active',
                    dueDate: '15th Feb 2026',
                    trend: '+7.5%'
                },
                gas: {
                    color: {r: 239, g: 68, b: 68},
                    name: 'Gas',
                    currentBill: '₹800',
                    lastMonth: '₹750',
                    units: '12 SCM',
                    status: 'Active',
                    dueDate: '20th Feb 2026',
                    trend: '+6.7%'
                },
                water: {
                    color: {r: 59, g: 130, b: 246},
                    name: 'Water',
                    currentBill: '₹420',
                    lastMonth: '₹400',
                    units: '15,000 L',
                    status: 'Active',
                    dueDate: '10th Feb 2026',
                    trend: '+5%'
                }
            };

            const strandColors = [
                utilityData.electricity.color,
                utilityData.gas.color,
                utilityData.water.color
            ];
            
            const strandKeys = ['electricity', 'gas', 'water'];
            
            // Canvas setup
            function resizeCanvas() {
                canvas.width = container.offsetWidth;
                canvas.height = container.offsetHeight;
            }
            
            resizeCanvas();
            window.addEventListener('resize', resizeCanvas);
            
            // Animation parameters
            const rotationSpeed = 0.6;
            const helixRadius = 4;
            const strandThickness = 1.2;
            let rotationAngle = 0;
            let animationId = null;
            let hoveredStrand = null;
            
            // Store strand paths for click detection
            let strandPaths = [];
            
            // Draw strand
            function drawStrand(color, phaseOffset, depthOffset, isHighlighted, strandIndex) {
                const centerX = canvas.width / 2;
                const centerY = canvas.height / 2;
                const horizontalScale = 12;
                const segments = 80;
                const radius = helixRadius * 18;
                const thickness = strandThickness * (isHighlighted ? 14 : 10);
                
                // Store points for this strand
                const points = [];
                
                ctx.beginPath();
                for (let i = 0; i <= segments; i++) {
                    const t = i / segments * Math.PI * 3.5;
                    const x = i * horizontalScale - segments * horizontalScale / 2 + depthOffset;
                    const y = radius * Math.sin(t + rotationAngle + phaseOffset);
                    const z = radius * Math.cos(t + rotationAngle + phaseOffset) + 100;
                    
                    const scale = 300 / (z + 300);
                    const projectedX = centerX + x * scale;
                    const projectedY = centerY + y * scale;
                    
                    // Store point for hit detection
                    points.push({ x: projectedX, y: projectedY, thickness: thickness });
                    
                    if (i === 0) {
                        ctx.moveTo(projectedX, projectedY);
                    } else {
                        ctx.lineTo(projectedX, projectedY);
                    }
                }
                
                // Store strand path for click detection
                strandPaths[strandIndex] = { points: points, utility: strandKeys[strandIndex] };
                
                const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
                const alpha = isHighlighted ? 1 : 0.7;
                gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha * 0.5})`);
                gradient.addColorStop(0.5, `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`);
                gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha * 0.5})`);
                
                ctx.strokeStyle = gradient;
                ctx.lineWidth = thickness;
                ctx.lineCap = 'round';
                
                if (isHighlighted) {
                    ctx.shadowColor = `rgba(${color.r}, ${color.g}, ${color.b}, 0.6)`;
                    ctx.shadowBlur = 20;
                }
                
                ctx.stroke();
                ctx.shadowBlur = 0;
            }
            
            // Draw DNA
            function drawDNA() {
                ctx.fillStyle = 'rgba(249, 250, 251, 0.95)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // Reset strand paths for new frame
                strandPaths = [];
                
                for (let i = 0; i < strandColors.length; i++) {
                    const phaseOffset = (i / strandColors.length) * Math.PI * 2;
                    const depthOffset = (i - 1) * 12;
                    const isHighlighted = hoveredStrand === strandKeys[i];
                    drawStrand(strandColors[i], phaseOffset, depthOffset, isHighlighted, i);
                }
            }
            
            // Animation loop
            function animate() {
                rotationAngle += 0.008 * rotationSpeed;
                drawDNA();
                animationId = requestAnimationFrame(animate);
            }
            
            animate();
            
            // Show tooltip
            function showTooltip(utility, x, y) {
                const data = utilityData[utility];
                tooltip.querySelector('.tooltip-title').textContent = data.name;
                tooltip.querySelector('.tooltip-content').innerHTML = `
                    <div class="tooltip-row"><span>Current Bill:</span><strong>${data.currentBill}</strong></div>
                    <div class="tooltip-row"><span>Last Month:</span><span>${data.lastMonth}</span></div>
                    <div class="tooltip-row"><span>Usage:</span><span>${data.units}</span></div>
                    <div class="tooltip-row"><span>Status:</span><span class="status-active">${data.status}</span></div>
                    <div class="tooltip-row"><span>Due Date:</span><span>${data.dueDate}</span></div>
                    <div class="tooltip-row"><span>Trend:</span><span class="trend-up">${data.trend}</span></div>
                `;
                
                tooltip.className = `dna-tooltip ${utility} active`;
                
                const tooltipRect = tooltip.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();
                
                // Calculate position relative to viewport (for fixed positioning)
                let left = containerRect.left + x - tooltipRect.width / 2;
                let top = containerRect.top + y - tooltipRect.height - 15;
                
                // Boundary checks for viewport
                if (left < 10) left = 10;
                if (left + tooltipRect.width > window.innerWidth - 10) {
                    left = window.innerWidth - tooltipRect.width - 10;
                }
                if (top < 10) top = containerRect.top + y + 20;
                
                tooltip.style.left = left + 'px';
                tooltip.style.top = top + 'px';
            }
            
            function hideTooltip() {
                tooltip.classList.remove('active');
            }
            
            // Show utility modal
            function showUtilityModal(utility, data) {
                const iconClass = utility === 'electricity' ? 'zap' : (utility === 'gas' ? 'flame' : 'droplet');
                const usageInsights = getUtilityUsageInsights(utility);
                
                vm.modalData = {
                    title: data.name,
                    icon: iconClass,
                    type: utility,
                    currentBill: data.currentBill,
                    lastMonth: data.lastMonth,
                    units: data.units,
                    status: data.status,
                    dueDate: data.dueDate,
                    trend: data.trend,
                    leastUsageMonth: usageInsights.leastMonth,
                    highestUsageMonth: usageInsights.highestMonth,
                    leastUsageSeason: usageInsights.leastSeason,
                    highestUsageSeason: usageInsights.highestSeason
                };
                vm.showUtilityModal = true;
                vm.bandhuUtility = utility;
                
                $scope.$applyAsync(function() {
                    if (typeof lucide !== 'undefined') {
                        lucide.createIcons();
                    }
                });
            }
            
            // Legend hover/click events
            document.querySelectorAll('.dna-legend-item').forEach(item => {
                item.addEventListener('mouseenter', function() {
                    hoveredStrand = this.dataset.utility;
                    const rect = this.getBoundingClientRect();
                    const containerRect = container.getBoundingClientRect();
                    showTooltip(hoveredStrand, rect.left - containerRect.left + rect.width / 2, containerRect.height / 2);
                });
                
                item.addEventListener('mouseleave', function() {
                    hoveredStrand = null;
                    hideTooltip();
                });
                
                item.addEventListener('click', function() {
                    const utility = this.dataset.utility;
                    $scope.$apply(function() {
                        showUtilityModal(utility, utilityData[utility]);
                    });
                });
            });
            
            // Canvas click detection - detect which strand was clicked
            function getClickedStrand(mouseX, mouseY) {
                let closestStrand = null;
                let minDistance = Infinity;
                const hitThreshold = 25; // pixels within strand to register click
                
                for (let s = 0; s < strandPaths.length; s++) {
                    const strand = strandPaths[s];
                    if (!strand || !strand.points) continue;
                    
                    for (let p = 0; p < strand.points.length; p++) {
                        const point = strand.points[p];
                        const dx = mouseX - point.x;
                        const dy = mouseY - point.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        
                        if (distance < hitThreshold && distance < minDistance) {
                            minDistance = distance;
                            closestStrand = strand.utility;
                        }
                    }
                }
                
                return closestStrand;
            }
            
            // Canvas click handler
            canvas.addEventListener('click', function(e) {
                const rect = canvas.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;
                
                const clickedUtility = getClickedStrand(mouseX, mouseY);
                if (clickedUtility && utilityData[clickedUtility]) {
                    $scope.$apply(function() {
                        showUtilityModal(clickedUtility, utilityData[clickedUtility]);
                    });
                }
            });
            
            // Canvas hover handler for cursor feedback
            canvas.addEventListener('mousemove', function(e) {
                const rect = canvas.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;
                
                const nearStrand = getClickedStrand(mouseX, mouseY);
                if (nearStrand) {
                    canvas.style.cursor = 'pointer';
                    hoveredStrand = nearStrand;
                    showTooltip(nearStrand, mouseX, mouseY - 10);
                } else {
                    canvas.style.cursor = 'default';
                    if (hoveredStrand && !document.querySelector('.dna-legend-item:hover')) {
                        hoveredStrand = null;
                        hideTooltip();
                    }
                }
            });
            
            canvas.addEventListener('mouseleave', function() {
                canvas.style.cursor = 'default';
                if (!document.querySelector('.dna-legend-item:hover')) {
                    hoveredStrand = null;
                    hideTooltip();
                }
            });
            
            // Modal close via Escape key
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape' && vm.showUtilityModal) {
                    $scope.$apply(function() {
                        vm.closeModal();
                    });
                }
            });
            
            // Pause on hidden
            document.addEventListener('visibilitychange', function() {
                if (document.hidden) {
                    cancelAnimationFrame(animationId);
                } else {
                    animate();
                }
            });
            
            // Initialize trend chart
            $timeout(function() {
                initializeTrendChart();
                initializeBillingCycleChart();
            }, 200);
        }
        
        function initializeBillingCycleChart() {
            const canvas = document.getElementById('billingCycleChart');
            if (!canvas || typeof Chart === 'undefined') {
                console.warn('Billing cycle chart canvas not found or Chart.js not loaded');
                return;
            }
            
            const ctx = canvas.getContext('2d');
            const currentDay = 18;
            const totalDays = 30;
            const percentage = (currentDay / totalDays) * 100;
            
            new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Completed', 'Remaining'],
                    datasets: [{
                        data: [percentage, 100 - percentage],
                        backgroundColor: [
                            '#F59E0B', // Yellow/Orange for completed days
                            'rgba(229, 231, 235, 0.3)' // Light gray for remaining
                        ],
                        borderWidth: 0,
                        cutout: '75%',
                        rotation: -90
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            enabled: false
                        }
                    }
                }
            });
        }
        
        function initializeTrendChart() {
            const canvas = document.getElementById('trendChart');
            if (!canvas || typeof Chart === 'undefined') {
                console.warn('Trend chart canvas not found or Chart.js not loaded');
                return;
            }
            
            const ctx = canvas.getContext('2d');
            var initData = chartData['6M'];
            
            trendChartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: initData.labels,
                    datasets: [{
                        label: 'Electricity',
                        data: initData.electricity,
                        borderColor: '#F59E0B',
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: '#F59E0B',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    }, {
                        label: 'Water',
                        data: initData.water,
                        borderColor: '#3B82F6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: '#3B82F6',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            padding: 12,
                            cornerRadius: 8,
                            titleFont: {
                                size: 13,
                                weight: '600'
                            },
                            bodyFont: {
                                size: 12
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(0, 0, 0, 0.05)',
                                drawBorder: false
                            },
                            ticks: {
                                color: '#6B7280',
                                font: {
                                    size: 11
                                }
                            }
                        },
                        x: {
                            grid: {
                                display: false,
                                drawBorder: false
                            },
                            ticks: {
                                color: '#6B7280',
                                font: {
                                    size: 11
                                }
                            }
                        }
                    },
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    }
                }
            });
        }

        // ===== SUVIDHA INSIGHTS MODAL =====
        vm.showSuvidhaInsights = false;
        vm.insightUtility = 'electricity';
        vm.insightPeriod = '6months';
        vm.insightHealthScore = 82;
        vm.insightHealthStatus = 'Good - Keep it up!';
        vm.insightTrendData = [
            { month: 'Oct', value: 285 },
            { month: 'Nov', value: 305 },
            { month: 'Dec', value: 342 },
            { month: 'Jan', value: 245 },
            { month: 'Feb', value: 260 },
            { month: 'Mar', value: 275 }
        ];
        vm.insightTrendMax = 350;
        vm.insightTips = [
            'Use LED bulbs to reduce electricity consumption',
            'Turn off appliances when not in use',
            'Use natural light during the day',
            'Adjust AC temperature to 24°C or above',
            'Maintain regular maintenance of electrical equipment'
        ];
        vm.insightQuestion = '';
        vm.insightLoading = false;

        vm.openSuvidhaInsights = function() {
            vm.showSuvidhaInsights = true;
            vm.insightUtility = vm.selectedUtility || 'electricity';
            vm.insightPeriod = vm.selectedPeriod || '6months';
            vm.insightQuestion = '';
            updateInsightData();
            $timeout(function() {
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            }, 50);
        };

        vm.closeSuvidhaInsights = function() {
            vm.showSuvidhaInsights = false;
            vm.insightLoading = false;
        };

        vm.onInsightUtilityChange = function() {
            updateInsightData();
        };

        vm.onInsightPeriodChange = function() {
            updateInsightData();
        };

        function updateInsightData() {
            var utility = vm.insightUtility || 'electricity';
            var period = vm.insightPeriod || '6months';

            // Sample data based on utility and period
            var healthScores = {
                'electricity': 82,
                'gas': 78,
                'water': 85
            };

            var healthStatuses = {
                'electricity': 'Good - Keep it up!',
                'gas': 'Fair - Room for improvement',
                'water': 'Excellent - Keep conserving!'
            };

            var tips = {
                'electricity': [
                    'Use LED bulbs to reduce consumption',
                    'Turn off appliances when not in use',
                    'Use natural light during day',
                    'Adjust AC to 24°C or above',
                    'Maintain regular equipment maintenance'
                ],
                'gas': [
                    'Check for gas leaks regularly',
                    'Use pressure cookers to save gas',
                    'Maintain appliances properly',
                    'Use thermostat efficiently',
                    'Avoid excessive heating'
                ],
                'water': [
                    'Fix leaking taps immediately',
                    'Use bucket instead of shower',
                    'Collect rainwater when possible',
                    'Use water-efficient fixtures',
                    'Turn off taps while brushing teeth'
                ]
            };

            // Sample trend data
            var trendDataByPeriod = {
                '3months': [
                    { month: 'Jan', value: 245 },
                    { month: 'Feb', value: 260 },
                    { month: 'Mar', value: 275 }
                ],
                '6months': [
                    { month: 'Oct', value: 285 },
                    { month: 'Nov', value: 305 },
                    { month: 'Dec', value: 342 },
                    { month: 'Jan', value: 245 },
                    { month: 'Feb', value: 260 },
                    { month: 'Mar', value: 275 }
                ],
                '1year': [
                    { month: 'Apr', value: 280 },
                    { month: 'May', value: 310 },
                    { month: 'Jun', value: 290 },
                    { month: 'Jul', value: 350 },
                    { month: 'Aug', value: 310 },
                    { month: 'Sep', value: 295 },
                    { month: 'Oct', value: 285 },
                    { month: 'Nov', value: 305 },
                    { month: 'Dec', value: 342 },
                    { month: 'Jan', value: 245 },
                    { month: 'Feb', value: 260 },
                    { month: 'Mar', value: 275 }
                ]
            };

            vm.insightHealthScore = healthScores[utility] || 80;
            vm.insightHealthStatus = healthStatuses[utility] || 'Average';
            vm.insightTips = tips[utility] || [];
            vm.insightTrendData = trendDataByPeriod[period] || trendDataByPeriod['6months'];
            vm.insightTrendMax = Math.max.apply(null, vm.insightTrendData.map(function(d) { return d.value; })) || 350;
        }

        vm.submitInsightQuestion = function() {
            if (!vm.insightQuestion || vm.insightLoading) return;
            
            var question = vm.insightQuestion;
            vm.insightLoading = true;

            var utility = vm.insightUtility || 'electricity';
            var utilityTitle = utility.charAt(0).toUpperCase() + utility.slice(1);
            var period = vm.insightPeriod || '6months';

            var insightContext = [
                'Utility: ' + utilityTitle,
                'Period: ' + period,
                'User question: ' + question,
                'Provide a helpful, concise answer about this utility.'
            ].join('\n');

            fetch('/api/ask-suvidha', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: insightContext,
                    system: 'You are Suvidha, an Indian civic utility advisor. Give concise, helpful insights about utility consumption. Respond in 4-6 short bullet points with actionable advice.'
                })
            })
            .then(function(res) { return res.json(); })
            .then(function(data) {
                $scope.$apply(function() {
                    vm.insightLoading = false;
                    if (data && data.success && data.response) {
                        vm.insightAIResponse = mdToHtml(data.response);
                    } else {
                        vm.insightAIResponse = (data && data.error) || 'Could not process your query. Please try again.';
                    }
                    vm.insightQuestion = '';
                });
            })
            .catch(function() {
                $scope.$apply(function() {
                    vm.insightLoading = false;
                    vm.insightAIResponse = 'Unable to connect to Suvidha AI right now. Please try again later.';
                });
            });
        };

        init();
    }
})();
