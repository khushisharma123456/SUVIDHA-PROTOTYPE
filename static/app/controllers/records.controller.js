// Records Controller - Enhanced
(function () {
    'use strict';

    angular.module('suvidhaApp')
        .controller('RecordsController', ['$scope', '$timeout', 'ApiService', RecordsController]);

    function RecordsController($scope, $timeout, ApiService) {
        var vm = this;
        var $rootScope = $scope.$root;
        vm.loading = true;
        vm.searchQuery = '';
        vm.utilityFilter = '';
        vm.statusFilter = '';
        vm.periodFilter = 'all';
        vm.viewMode = 'table';
        vm.sortColumn = 'date';
        vm.sortReverse = true;
        vm.currentPage = 1;
        vm.itemsPerPage = 10;

        // Header Stats
        vm.stats = {
            totalBills: 42,
            totalAmount: '₹48,240',
            avgMonthly: '₹4,020',
            pending: 2
        };

        // Sample Records Data
        vm.records = [
            {
                date: '15 Jan 2026',
                utility: 'Electricity',
                utilityClass: 'elec',
                icon: 'zap',
                billId: 'ELEC-2026-001',
                reading: '1245 kWh',
                amount: '1,450',
                status: 'Paid',
                statusClass: 'paid',
                statusIcon: 'check-circle'
            },
            {
                date: '10 Jan 2026',
                utility: 'Water',
                utilityClass: 'water',
                icon: 'droplet',
                billId: 'WAT-2026-001',
                reading: '18 KL',
                amount: '420',
                status: 'Paid',
                statusClass: 'paid',
                statusIcon: 'check-circle'
            },
            {
                date: '05 Jan 2026',
                utility: 'Gas',
                utilityClass: 'gas',
                icon: 'flame',
                billId: 'GAS-2026-001',
                reading: '142 SCM',
                amount: '1,280',
                status: 'Paid',
                statusClass: 'paid',
                statusIcon: 'check-circle'
            },
            {
                date: '15 Dec 2025',
                utility: 'Electricity',
                utilityClass: 'elec',
                icon: 'zap',
                billId: 'ELEC-2025-012',
                reading: '1320 kWh',
                amount: '1,580',
                status: 'Paid',
                statusClass: 'paid',
                statusIcon: 'check-circle'
            },
            {
                date: '10 Dec 2025',
                utility: 'Water',
                utilityClass: 'water',
                icon: 'droplet',
                billId: 'WAT-2025-012',
                reading: '20 KL',
                amount: '480',
                status: 'Paid',
                statusClass: 'paid',
                statusIcon: 'check-circle'
            },
            {
                date: '05 Dec 2025',
                utility: 'Gas',
                utilityClass: 'gas',
                icon: 'flame',
                billId: 'GAS-2025-012',
                reading: '155 SCM',
                amount: '1,395',
                status: 'Pending',
                statusClass: 'pending',
                statusIcon: 'clock'
            },
            {
                date: '15 Nov 2025',
                utility: 'Electricity',
                utilityClass: 'elec',
                icon: 'zap',
                billId: 'ELEC-2025-011',
                reading: '1180 kWh',
                amount: '1,380',
                status: 'Paid',
                statusClass: 'paid',
                statusIcon: 'check-circle'
            },
            {
                date: '10 Nov 2025',
                utility: 'Water',
                utilityClass: 'water',
                icon: 'droplet',
                billId: 'WAT-2025-011',
                reading: '17 KL',
                amount: '390',
                status: 'Paid',
                statusClass: 'paid',
                statusIcon: 'check-circle'
            },
            {
                date: '05 Nov 2025',
                utility: 'Gas',
                utilityClass: 'gas',
                icon: 'flame',
                billId: 'GAS-2025-011',
                reading: '138 SCM',
                amount: '1,242',
                status: 'Overdue',
                statusClass: 'overdue',
                statusIcon: 'alert-circle'
            },
            {
                date: '15 Oct 2025',
                utility: 'Electricity',
                utilityClass: 'elec',
                icon: 'zap',
                billId: 'ELEC-2025-010',
                reading: '1265 kWh',
                amount: '1,495',
                status: 'Paid',
                statusClass: 'paid',
                statusIcon: 'check-circle'
            },
            {
                date: '10 Oct 2025',
                utility: 'Water',
                utilityClass: 'water',
                icon: 'droplet',
                billId: 'WAT-2025-010',
                reading: '19 KL',
                amount: '450',
                status: 'Paid',
                statusClass: 'paid',
                statusIcon: 'check-circle'
            },
            {
                date: '05 Oct 2025',
                utility: 'Gas',
                utilityClass: 'gas',
                icon: 'flame',
                billId: 'GAS-2025-010',
                reading: '148 SCM',
                amount: '1,332',
                status: 'Paid',
                statusClass: 'paid',
                statusIcon: 'check-circle'
            }
        ];

        vm.filteredRecords = vm.records;

        // Methods
        vm.filterRecords = function () {
            vm.filteredRecords = vm.records.filter(function (record) {
                var matchesSearch = !vm.searchQuery ||
                    record.billId.toLowerCase().indexOf(vm.searchQuery.toLowerCase()) !== -1 ||
                    record.utility.toLowerCase().indexOf(vm.searchQuery.toLowerCase()) !== -1;

                var matchesUtility = !vm.utilityFilter ||
                    record.utility.toLowerCase() === vm.utilityFilter.toLowerCase();

                var matchesStatus = !vm.statusFilter ||
                    record.status.toLowerCase() === vm.statusFilter.toLowerCase();

                return matchesSearch && matchesUtility && matchesStatus;
            });

            vm.updatePagination();
            $timeout(function () {
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            }, 50);
        };

        vm.hasActiveFilters = function () {
            return vm.utilityFilter || vm.statusFilter || vm.periodFilter !== 'all';
        };

        vm.clearFilter = function (type) {
            if (type === 'utility') {
                vm.utilityFilter = '';
            } else if (type === 'status') {
                vm.statusFilter = '';
            } else if (type === 'period') {
                vm.periodFilter = 'all';
            }
            vm.filterRecords();
        };

        vm.clearAllFilters = function () {
            vm.searchQuery = '';
            vm.utilityFilter = '';
            vm.statusFilter = '';
            vm.periodFilter = 'all';
            vm.filterRecords();
        };

        vm.setViewMode = function (mode) {
            vm.viewMode = mode;
            $timeout(function () {
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            }, 50);
        };

        vm.sortBy = function (column) {
            if (vm.sortColumn === column) {
                vm.sortReverse = !vm.sortReverse;
            } else {
                vm.sortColumn = column;
                vm.sortReverse = false;
            }
            $timeout(function () {
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            }, 50);
        };

        vm.updatePagination = function () {
            vm.totalPages = Math.ceil(vm.filteredRecords.length / vm.itemsPerPage);
            vm.paginationStart = ((vm.currentPage - 1) * vm.itemsPerPage) + 1;
            vm.paginationEnd = Math.min(vm.currentPage * vm.itemsPerPage, vm.filteredRecords.length);
        };

        vm.previousPage = function () {
            if (vm.currentPage > 1) {
                vm.currentPage--;
                vm.updatePagination();
            }
        };

        vm.nextPage = function () {
            if (vm.currentPage < vm.totalPages) {
                vm.currentPage++;
                vm.updatePagination();
            }
        };

        vm.viewDocument = function (record) {
            vm.selectedRecord = record;
            vm.showBillModal = true;
            $timeout(function () {
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            }, 50);
        };

        vm.closeBillModal = function () {
            vm.showBillModal = false;
            vm.selectedRecord = null;
        };

        // Photo Gallery Modal Functions
        vm.openPhotoDialog = function (record) {
            vm.selectedRecord = record;
            vm.showPhotoDialog = true;
            $timeout(function () {
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            }, 50);
        };

        vm.closePhotoDialog = function () {
            vm.showPhotoDialog = false;
        };

        vm.payBill = function (record) {
            if (!record) return;
            $rootScope.showDialog(
                'Payment Initiated',
                'Processing payment of ₹' + record.amount + ' for ' + record.utility + ' bill (' + record.billId + '). You will be redirected to the payment gateway.\n\nNote: In production, this would integrate with UPI/Net Banking.',
                'success'
            );
            // Mark as paid in UI
            $timeout(function () {
                record.status = 'Paid';
                record.statusClass = 'paid';
                record.statusIcon = 'check-circle';
                // Update pending count
                var pendingCount = 0;
                vm.records.forEach(function (r) {
                    if (r.status === 'Pending' || r.status === 'Overdue') pendingCount++;
                });
                vm.stats.pending = pendingCount;
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            }, 500);
        };

        vm.downloadBill = function (record) {
            var csvContent = 'Bill Receipt - Suvidha Portal\n';
            csvContent += '================================\n\n';
            csvContent += 'Bill ID,' + record.billId + '\n';
            csvContent += 'Utility,' + record.utility + '\n';
            csvContent += 'Date,' + record.date + '\n';
            csvContent += 'Meter Reading,' + record.reading + '\n';
            csvContent += 'Amount,Rs.' + record.amount + '\n';
            csvContent += 'Status,' + record.status + '\n\n';
            csvContent += 'Generated on,' + new Date().toLocaleDateString() + '\n';
            csvContent += 'Source,Suvidha Civic Tech Portal\n';

            var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            var link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = record.billId + '_receipt.csv';
            link.click();
            URL.revokeObjectURL(link.href);
        };

        vm.downloadCSV = function () {
            var csvContent = 'Date,Utility,Bill ID,Reading,Amount,Status\n';
            vm.filteredRecords.forEach(function (record) {
                csvContent += record.date + ',' + record.utility + ',' + record.billId + ',' + record.reading + ',Rs.' + record.amount + ',' + record.status + '\n';
            });

            var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            var link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'billing_records_' + new Date().toISOString().slice(0, 10) + '.csv';
            link.click();
            URL.revokeObjectURL(link.href);
        };

        vm.exportPDF = function () {
            $rootScope.showDialog('Export PDF', 'Generating a comprehensive PDF report of ' + vm.filteredRecords.length + ' billing records with summary statistics. This may take a moment.', 'info');
        };

        vm.showPayBillDialog = false;
        vm.payBillData = {};
        vm.payMethod = 'upi';
        vm.payBillProcessing = false;

        vm.openPayBillDialog = function (record) {
            var targetRecord = record || null;

            if (!targetRecord && vm.records && vm.records.length) {
                for (var i = 0; i < vm.records.length; i++) {
                    if (vm.records[i].status === 'Pending' || vm.records[i].status === 'Overdue') {
                        targetRecord = vm.records[i];
                        break;
                    }
                }
            }

            vm.payBillData = {
                amount: targetRecord ? targetRecord.amount : '0',
                label: targetRecord ? (targetRecord.utility + ' Bill') : 'Utility Bill',
                period: targetRecord ? targetRecord.date : 'Current Period',
                dueDate: targetRecord ? (targetRecord.dueDate || 'See records') : 'N/A',
                record: targetRecord
            };

            vm.showPayBillDialog = true;

            $timeout(function () {
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            }, 50);
        };

        vm.closePayBillDialog = function () {
            vm.showPayBillDialog = false;
            vm.payBillProcessing = false;
        };

        vm.confirmPayBill = function () {
            vm.payBillProcessing = true;

            $timeout(function () {
                if (vm.payBillData.record) {
                    vm.payBillData.record.status = 'Paid';
                    vm.payBillData.record.statusClass = 'paid';
                }

                vm.payBillProcessing = false;
                vm.showPayBillDialog = false;
                vm.selectedRecord = null;

                vm.stats.pending = vm.records.filter(function (r) {
                    return r.status === 'Pending' || r.status === 'Overdue';
                }).length;

                $rootScope.showDialog(
                    'Payment Successful',
                    'Bill payment of ₹' + vm.payBillData.amount + ' processed successfully!',
                    'success',
                    'Great!'
                );

                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            }, 1500);
        };

        function init() {
            loadRecordsData();
            vm.updatePagination();

            // Initialize Lucide icons
            $timeout(function () {
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            }, 100);
        }

        function loadRecordsData() {
            ApiService.getRecordsData()
                .then(function (response) {
                    if (response.data && response.data.length > 0) {
                        vm.records = response.data;
                        vm.filteredRecords = vm.records;
                        vm.updatePagination();
                    }
                    vm.loading = false;
                })
                .catch(function (error) {
                    console.error('Error loading records data:', error);
                    vm.loading = false;
                });
        }

        init();
    }
})();
