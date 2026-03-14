app.controller('walletController', ['$scope', '$http', '$window', '$timeout', function($scope, $http, $window, $timeout) {
    var vm = this;

    // Wallet Balance Data
    vm.walletBalance = 4000;
    vm.pointsEarned = 850;
    vm.pointsUsed = 450;
    vm.pointsExpiring = 150;

    // Initialize
    vm.selectedMonth = 'current';
    vm.transactionFilter = 'all';

    // Transaction History Data
    vm.transactions = [
        {
            type: 'earned',
            title: 'Energy Conservation Reward',
            description: 'March electricity consumption was 15% below average',
            date: new Date(2026, 2, 12),
            points: 75,
            icon: 'zap'
        },
        {
            type: 'used',
            title: 'Electricity Bill Payment',
            description: 'Paid ₹850 electricity bill with points',
            date: new Date(2026, 2, 10),
            points: 850,
            icon: 'credit-card'
        },
        {
            type: 'earned',
            title: 'Community Participation',
            description: 'Attended RWA meeting on waste management',
            date: new Date(2026, 2, 8),
            points: 150,
            icon: 'users'
        },
        {
            type: 'used',
            title: 'DMRC Coupon Redeemed',
            description: 'Purchased ₹200 worth metro pass coupon',
            date: new Date(2026, 2, 5),
            points: 200,
            icon: 'train'
        },
        {
            type: 'earned',
            title: 'Water Conservation Achievement',
            description: 'Maintained water usage below threshold',
            date: new Date(2026, 2, 3),
            points: 75,
            icon: 'droplet'
        },
        {
            type: 'earned',
            title: 'Waste Segregation Completed',
            description: 'Successfully segregated waste for pickup',
            date: new Date(2026, 2, 1),
            points: 100,
            icon: 'trash-2'
        },
        {
            type: 'used',
            title: 'Coupons Discount Applied',
            description: 'Used points for shopping voucher',
            date: new Date(2026, 1, 28),
            points: 150,
            icon: 'gift'
        },
        {
            type: 'earned',
            title: 'On-Time Bill Payment',
            description: 'Water bill paid before due date',
            date: new Date(2026, 1, 25),
            points: 25,
            icon: 'check-circle'
        }
    ];

    vm.filteredTransactions = vm.transactions;

    /**
     * Filter transactions by type
     */
    vm.filterTransactions = function(filter) {
        vm.transactionFilter = filter;
        if (filter === 'all') {
            vm.filteredTransactions = vm.transactions;
        } else {
            vm.filteredTransactions = vm.transactions.filter(function(t) {
                return t.type === filter;
            });
        }
        $timeout(function() {
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }, 50);
    };

    /**
     * Handle month change
     */
    vm.onMonthChange = function() {
        console.log('Month changed to:', vm.selectedMonth);
        // Filter transactions based on selected month
        // This would typically call a backend API
        vm.filterTransactions(vm.transactionFilter);
    };

    /**
     * Refresh balance
     */
    vm.refreshBalance = function() {
        console.log('Refreshing balance...');
        // Simulate API call
        $timeout(function() {
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }, 100);
    };

    /**
     * Open redemption dialog for specific service
     */
    vm.openRedeemDialog = function(service) {
        console.log('Opening redeem dialog for:', service);
        
        var redeemData = {
            electricity: {
                title: 'Pay Electricity Bill',
                description: 'How many points would you like to use?',
                rate: '100 points = ₹10',
                currentBill: 1850
            },
            water: {
                title: 'Pay Water Bill',
                description: 'How many points would you like to use?',
                rate: '100 points = ₹8',
                currentBill: 340
            },
            transport: {
                title: 'Recharge Metro/Bus Card',
                description: 'Choose your preferred recharge amount',
                rate: '100 points = ₹12',
                options: [100, 200, 500]
            },
            coupons: {
                title: 'Browse Coupons',
                description: 'Select from available discounts',
                coupons: [
                    { name: 'Grocery Store Coupon', value: 50, points: 500 },
                    { name: 'Restaurant Voucher', value: 100, points: 800 },
                    { name: 'Shopping Mall Coupon', value: 200, points: 1500 }
                ]
            },
            govapps: {
                title: 'Government Services',
                description: 'Use points for various government applications',
                services: [
                    { name: 'Municipal Tax Payment', rate: '100 points = ₹15' },
                    { name: 'Parking Passes', rate: '100 points = ₹20' },
                    { name: 'Utility Connection Requests', rate: 'Variable' }
                ]
            },
            charity: {
                title: 'Donate to Charity',
                description: 'Contribute points to community welfare programs',
                charities: [
                    { name: 'Elderly Care Fund', icon: '👴' },
                    { name: 'Child Education Fund', icon: '📚' },
                    { name: 'Environment Project', icon: '🌱' }
                ]
            }
        };

        // Simulate showing dialog/modal
        var selectedData = redeemData[service];
        console.log('Service Data:', selectedData);
        
        var message = selectedData.title + '\n\n' + selectedData.description;
        if (selectedData.rate) {
            message += '\n\nConversion Rate: ' + selectedData.rate;
        }
        if (selectedData.currentBill) {
            message += '\nCurrent Bill: ₹' + selectedData.currentBill;
        }
        
        alert(message + '\n\nThis feature will open a detailed redemption dialog in the full implementation.');
    };

    /**
     * Export E-Statement
     */
    vm.exportStatement = function() {
        console.log('Exporting statement for:', vm.selectedMonth);
        
        // Create CSV content
        var csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Wallet Transaction Statement\n";
        csvContent += "Period: " + vm.selectedMonth + "\n";
        csvContent += "Total Balance: " + vm.walletBalance + " points\n";
        csvContent += "Points Earned This Month: " + vm.pointsEarned + "\n";
        csvContent += "Points Used This Month: " + vm.pointsUsed + "\n\n";
        csvContent += "Date,Type,Description,Points\n";
        
        vm.filteredTransactions.forEach(function(transaction) {
            var date = transaction.date.toLocaleDateString();
            var type = transaction.type.toUpperCase();
            var desc = transaction.description.replace(/,/g, ';');
            var points = (transaction.type === 'earned' ? '+' : '-') + transaction.points;
            csvContent += date + "," + type + "," + desc + "," + points + "\n";
        });

        // Download file
        var encodedUri = encodeURI(csvContent);
        var link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "wallet_statement_" + vm.selectedMonth + ".csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        console.log('Statement exported successfully');
    };

    /**
     * Redeem points for specific amount
     */
    vm.redeemPoints = function(amount, service) {
        if (amount > vm.walletBalance) {
            alert('Insufficient points! You have ' + vm.walletBalance + ' points.');
            return;
        }

        // Deduct points
        vm.walletBalance -= amount;
        
        // Add transaction
        vm.transactions.unshift({
            type: 'used',
            title: 'Redeemed for ' + service,
            description: 'Points converted to service credit',
            date: new Date(),
            points: amount,
            icon: 'trending-down'
        });

        vm.filterTransactions(vm.transactionFilter);

        console.log('Successfully redeemed ' + amount + ' points for ' + service);
        alert('Successfully redeemed ' + amount + ' points!');
    };

    /**
     * Get total points used
     */
    vm.getTotalPointsUsed = function() {
        var total = 0;
        vm.transactions.forEach(function(t) {
            if (t.type === 'used') {
                total += t.points;
            }
        });
        return total;
    };

    /**
     * Get total points earned
     */
    vm.getTotalPointsEarned = function() {
        var total = 0;
        vm.transactions.forEach(function(t) {
            if (t.type === 'earned') {
                total += t.points;
            }
        });
        return total;
    };

    // Initialize Lucide icons
    $timeout(function() {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }, 100);

}]);
