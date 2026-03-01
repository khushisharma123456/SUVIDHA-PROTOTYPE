// Simulator Controller
(function() {
    'use strict';

    angular.module('suvidhaApp')
        .controller('SimulatorController', ['$scope', '$timeout', 'ApiService', SimulatorController]);

    function SimulatorController($scope, $timeout, ApiService) {
        var vm = this;
        
        // Initialize state
        vm.utilityType = 'electricity';
        vm.vendor = 'brpl';
        vm.consumption = 0;
        vm.householdSize = 2;
        vm.applySubsidy = true;
        vm.hasCalculated = false;
        vm.totalSimulations = 0;
        
        // Display properties
        vm.unitLabel = 'kWh';
        vm.chargeLabel = 'Energy Charges';
        vm.placeholderText = 'Enter monthly units';
        vm.maxConsumption = 1000;
        vm.sliderStep = 10;
        
        // Bill components
        vm.totalBill = 0;
        vm.energyCharge = 0;
        vm.fixedCharge = 0;
        vm.subsidy = 0;
        vm.tax = 0;
        vm.hasSubsidy = true;
        vm.subsidyInfo = '';
        
        // Comparison data
        vm.wardAverage = 250;
        vm.efficientUsage = 150;
        vm.comparisonText = '';
        vm.comparisonClass = '';
        vm.comparisonIcon = '';
        
        // Tariff slabs
        vm.tariffSlabs = [];
        
        // Savings tips
        vm.savingsTips = [];
        
        // Utility selection handler
        vm.selectUtility = function(type) {
            vm.utilityType = type;
            vm.consumption = 0;
            vm.hasCalculated = false;
            
            switch(type) {
                case 'electricity':
                    vm.unitLabel = 'kWh';
                    vm.chargeLabel = 'Energy Charges';
                    vm.placeholderText = 'Enter monthly units';
                    vm.maxConsumption = 1000;
                    vm.sliderStep = 10;
                    vm.vendor = 'brpl';
                    vm.wardAverage = 250;
                    vm.efficientUsage = 150;
                    vm.hasSubsidy = true;
                    break;
                case 'water':
                    vm.unitLabel = 'KL';
                    vm.chargeLabel = 'Water Charges';
                    vm.placeholderText = 'Enter monthly kiloliters';
                    vm.maxConsumption = 50;
                    vm.sliderStep = 1;
                    vm.vendor = 'djb';
                    vm.wardAverage = 15;
                    vm.efficientUsage = 10;
                    vm.hasSubsidy = true;
                    break;
                case 'gas':
                    vm.unitLabel = 'SCM';
                    vm.chargeLabel = 'Gas Charges';
                    vm.placeholderText = 'Enter monthly SCM';
                    vm.maxConsumption = 100;
                    vm.sliderStep = 2;
                    vm.vendor = 'igl';
                    vm.wardAverage = 25;
                    vm.efficientUsage = 18;
                    vm.hasSubsidy = false;
                    break;
            }
            
            vm.updateTariff();
            $timeout(function() {
                if (typeof lucide !== 'undefined') lucide.createIcons();
            }, 100);
        };
        
        // Update tariff information based on vendor
        vm.updateTariff = function() {
            if (vm.utilityType === 'electricity') {
                vm.tariffSlabs = [
                    {
                        name: 'Slab 1',
                        range: '0 - 200 kWh',
                        rate: '₹3.00',
                        min: 0,
                        max: 200,
                        rateValue: 3.0,
                        note: 'With subsidy applied',
                        icon: 'home',
                        class: 'slab-low'
                    },
                    {
                        name: 'Slab 2',
                        range: '201 - 400 kWh',
                        rate: '₹4.50',
                        min: 201,
                        max: 400,
                        rateValue: 4.5,
                        note: 'Standard rate',
                        icon: 'building',
                        class: 'slab-medium'
                    },
                    {
                        name: 'Slab 3',
                        range: '401+ kWh',
                        rate: '₹6.50',
                        min: 401,
                        max: 999999,
                        rateValue: 6.5,
                        note: 'Higher consumption',
                        icon: 'factory',
                        class: 'slab-high'
                    }
                ];
            } else if (vm.utilityType === 'water') {
                vm.tariffSlabs = [
                    {
                        name: 'Slab 1',
                        range: '0 - 10 KL',
                        rate: '₹5.50',
                        min: 0,
                        max: 10,
                        rateValue: 5.5,
                        note: 'Domestic usage',
                        icon: 'home',
                        class: 'slab-low'
                    },
                    {
                        name: 'Slab 2',
                        range: '11 - 25 KL',
                        rate: '₹23.00',
                        min: 11,
                        max: 25,
                        rateValue: 23.0,
                        note: 'Standard rate',
                        icon: 'droplet',
                        class: 'slab-medium'
                    },
                    {
                        name: 'Slab 3',
                        range: '26+ KL',
                        rate: '₹61.50',
                        min: 26,
                        max: 999999,
                        rateValue: 61.5,
                        note: 'Higher consumption',
                        icon: 'droplets',
                        class: 'slab-high'
                    }
                ];
            } else if (vm.utilityType === 'gas') {
                vm.tariffSlabs = [
                    {
                        name: 'Domestic PNG',
                        range: 'All consumption',
                        rate: '₹32.67',
                        min: 0,
                        max: 999999,
                        rateValue: 32.67,
                        note: 'Per SCM',
                        icon: 'flame',
                        class: 'slab-medium'
                    }
                ];
            }
            
            $timeout(function() {
                if (typeof lucide !== 'undefined') lucide.createIcons();
            }, 100);
        };
        
        // Calculate bill based on consumption
        vm.calculateBill = function() {
            if (!vm.consumption || vm.consumption <= 0) {
                return;
            }
            
            var consumption = parseFloat(vm.consumption);
            vm.energyCharge = 0;
            vm.fixedCharge = 0;
            vm.subsidy = 0;
            vm.tax = 0;
            
            if (vm.utilityType === 'electricity') {
                // Calculate energy charges based on slabs
                if (consumption <= 200) {
                    vm.energyCharge = consumption * 3.0;
                } else if (consumption <= 400) {
                    vm.energyCharge = (200 * 3.0) + ((consumption - 200) * 4.5);
                } else {
                    vm.energyCharge = (200 * 3.0) + (200 * 4.5) + ((consumption - 400) * 6.5);
                }
                
                // Fixed charges
                vm.fixedCharge = 125;
                
                // Subsidy for consumption <= 200 units
                if (vm.applySubsidy && consumption <= 200) {
                    vm.subsidy = vm.energyCharge * 0.5; // 50% subsidy
                    vm.subsidyInfo = 'Government subsidy of 50% applied for consumption up to 200 units';
                } else if (vm.applySubsidy && consumption <= 400) {
                    vm.subsidy = 300; // Fixed subsidy amount
                    vm.subsidyInfo = 'Partial government subsidy applied';
                } else {
                    vm.subsidyInfo = 'No subsidy available for consumption above 400 units';
                }
                
            } else if (vm.utilityType === 'water') {
                // Calculate water charges based on slabs
                if (consumption <= 10) {
                    vm.energyCharge = consumption * 5.5;
                } else if (consumption <= 25) {
                    vm.energyCharge = (10 * 5.5) + ((consumption - 10) * 23.0);
                } else {
                    vm.energyCharge = (10 * 5.5) + (15 * 23.0) + ((consumption - 25) * 61.5);
                }
                
                // Fixed charges
                vm.fixedCharge = 70;
                
                // Subsidy for low consumption
                if (vm.applySubsidy && consumption <= 10) {
                    vm.subsidy = vm.energyCharge * 0.3; // 30% subsidy
                    vm.subsidyInfo = 'Subsidy of 30% applied for consumption up to 10 KL';
                } else {
                    vm.subsidyInfo = 'No subsidy available for higher consumption';
                }
                
            } else if (vm.utilityType === 'gas') {
                // Calculate gas charges
                vm.energyCharge = consumption * 32.67;
                
                // Fixed charges
                vm.fixedCharge = 150;
                
                vm.subsidyInfo = 'No government subsidy available for PNG';
            }
            
            // Calculate tax (GST @ 18% on energy + fixed charges)
            var taxableAmount = vm.energyCharge + vm.fixedCharge - vm.subsidy;
            vm.tax = taxableAmount * 0.18;
            
            // Calculate total
            vm.totalBill = vm.energyCharge + vm.fixedCharge - vm.subsidy + vm.tax;
            
            // Mark as calculated
            vm.hasCalculated = true;
            vm.calculationDate = new Date().toLocaleDateString('en-IN', { 
                day: 'numeric', 
                month: 'short', 
                year: 'numeric' 
            });
            vm.totalSimulations++;
            
            // Calculate comparison
            vm.calculateComparison();
            
            // Generate savings tips
            vm.generateSavingsTips();
            
            // Update consumption bars
            vm.updateConsumptionBars();
            
            $timeout(function() {
                if (typeof lucide !== 'undefined') lucide.createIcons();
            }, 100);
        };
        
        // Calculate comparison with average
        vm.calculateComparison = function() {
            var consumption = parseFloat(vm.consumption);
            var diff = consumption - vm.wardAverage;
            var percentDiff = Math.abs((diff / vm.wardAverage) * 100).toFixed(0);
            
            if (diff > 0) {
                vm.comparisonText = percentDiff + '% above ward average';
                vm.comparisonClass = 'comparison-high';
                vm.comparisonIcon = 'trending-up';
            } else if (diff < 0) {
                vm.comparisonText = percentDiff + '% below ward average';
                vm.comparisonClass = 'comparison-low';
                vm.comparisonIcon = 'trending-down';
            } else {
                vm.comparisonText = 'Equal to ward average';
                vm.comparisonClass = 'comparison-average';
                vm.comparisonIcon = 'minus';
            }
            
            // Set consumption level for bar chart
            if (consumption <= vm.efficientUsage) {
                vm.consumptionLevel = 'efficient';
            } else if (consumption <= vm.wardAverage) {
                vm.consumptionLevel = 'average';
            } else {
                vm.consumptionLevel = 'high';
            }
        };
        
        // Update consumption comparison bars
        vm.updateConsumptionBars = function() {
            var consumption = parseFloat(vm.consumption);
            var maxValue = Math.max(consumption, vm.wardAverage * 1.5);
            
            vm.yourConsumptionPercent = (consumption / maxValue) * 100;
            vm.wardAveragePercent = (vm.wardAverage / maxValue) * 100;
            vm.efficientPercent = (vm.efficientUsage / maxValue) * 100;
        };
        
        // Generate savings tips based on consumption
        vm.generateSavingsTips = function() {
            vm.savingsTips = [];
            var consumption = parseFloat(vm.consumption);
            
            if (vm.utilityType === 'electricity') {
                if (consumption > 400) {
                    vm.savingsTips.push({
                        icon: 'lightbulb',
                        title: 'Switch to LED Bulbs',
                        description: 'LED bulbs use 75% less energy than traditional bulbs. Potential savings: ₹500/month'
                    });
                    vm.savingsTips.push({
                        icon: 'sun',
                        title: 'Consider Solar Panels',
                        description: 'Solar panels can reduce electricity bills by 30-50%. ROI in 3-5 years.'
                    });
                }
                
                if (consumption > 250) {
                    vm.savingsTips.push({
                        icon: 'thermometer',
                        title: 'Optimize AC Usage',
                        description: 'Set AC to 24-25°C and use timer mode. Can save up to ₹300/month.'
                    });
                }
                
                vm.savingsTips.push({
                    icon: 'zap',
                    title: 'Use Energy-Efficient Appliances',
                    description: '5-star rated appliances consume 30% less power. Replace old appliances.'
                });
                
            } else if (vm.utilityType === 'water') {
                if (consumption > 20) {
                    vm.savingsTips.push({
                        icon: 'droplet',
                        title: 'Fix Leaking Taps',
                        description: 'A dripping tap can waste 15 liters per day. Check for leaks regularly.'
                    });
                    vm.savingsTips.push({
                        icon: 'shower-head',
                        title: 'Install Water-Saving Fixtures',
                        description: 'Low-flow showerheads and aerators can reduce consumption by 30%.'
                    });
                }
                
                vm.savingsTips.push({
                    icon: 'recycle',
                    title: 'Reuse Water',
                    description: 'Use RO reject water for plants and cleaning. Save up to 20 liters daily.'
                });
                
            } else if (vm.utilityType === 'gas') {
                if (consumption > 30) {
                    vm.savingsTips.push({
                        icon: 'flame',
                        title: 'Use Pressure Cooker',
                        description: 'Pressure cooking uses 70% less gas than traditional methods.'
                    });
                }
                
                vm.savingsTips.push({
                    icon: 'wind',
                    title: 'Check for Gas Leaks',
                    description: 'Regular maintenance prevents wastage and ensures safety.'
                });
            }
        };
        
        // Set household size and adjust average consumption
        vm.setHouseholdSize = function(size) {
            vm.householdSize = size;
            
            // Adjust ward average based on household size
            if (vm.utilityType === 'electricity') {
                vm.wardAverage = [150, 250, 350, 500][size - 1];
                vm.efficientUsage = [100, 150, 200, 300][size - 1];
            } else if (vm.utilityType === 'water') {
                vm.wardAverage = [8, 15, 20, 30][size - 1];
                vm.efficientUsage = [6, 10, 15, 20][size - 1];
            } else if (vm.utilityType === 'gas') {
                vm.wardAverage = [15, 25, 35, 45][size - 1];
                vm.efficientUsage = [10, 18, 25, 30][size - 1];
            }
            
            if (vm.hasCalculated) {
                vm.calculateComparison();
                vm.updateConsumptionBars();
            }
            
            $timeout(function() {
                if (typeof lucide !== 'undefined') lucide.createIcons();
            }, 100);
        };
        
        // Apply consumption presets
        vm.applyPreset = function(type) {
            if (vm.utilityType === 'electricity') {
                switch(type) {
                    case 'low':
                        vm.consumption = 150;
                        break;
                    case 'average':
                        vm.consumption = 250;
                        break;
                    case 'high':
                        vm.consumption = 450;
                        break;
                }
            } else if (vm.utilityType === 'water') {
                switch(type) {
                    case 'low':
                        vm.consumption = 10;
                        break;
                    case 'average':
                        vm.consumption = 18;
                        break;
                    case 'high':
                        vm.consumption = 30;
                        break;
                }
            } else if (vm.utilityType === 'gas') {
                switch(type) {
                    case 'low':
                        vm.consumption = 15;
                        break;
                    case 'average':
                        vm.consumption = 25;
                        break;
                    case 'high':
                        vm.consumption = 40;
                        break;
                }
            }
            
            vm.calculateBill();
        };
        
        // Show detailed tariff information
        vm.showTariffDetails = function() {
            var tariffUrl = '';
            
            if (vm.utilityType === 'electricity') {
                tariffUrl = 'https://www.bsesdelhi.com/web/bypl/tariff-schedule';
            } else if (vm.utilityType === 'water') {
                tariffUrl = 'https://www.delhijalboard.nic.in/rates';
            } else if (vm.utilityType === 'gas') {
                tariffUrl = 'https://www.iglonline.net/english/viewtariff.aspx';
            }
            
            if (tariffUrl) {
                window.open(tariffUrl, '_blank');
            }
        };
        
        // Initialize
        function init() {
            vm.selectUtility('electricity');
        }

        init();
    }
})();
