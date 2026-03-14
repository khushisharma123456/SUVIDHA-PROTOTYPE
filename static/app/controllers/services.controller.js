// Services Controller
(function() {
    'use strict';

    angular.module('suvidhaApp')
        .controller('ServicesController', ['$scope', '$timeout', 'ApiService', ServicesController]);

    function ServicesController($scope, $timeout, ApiService) {
        var vm = this;
        var $rootScope = $scope.$root;
        vm.loading = false;
        vm.serviceRequest = {};
        vm.requests = [];
        vm.serviceMode = 'complaint';
        vm.serviceFilter = 'elec';

        // User Data
        vm.userData = {
            username: $rootScope.currentUser?.name || 'Citizen'
        };

        // Header Stats
        vm.stats = {
            activeRequests: 2,
            avgResolution: 4,
            resolvedCount: 12
        };

        // Complaint Form Data
        vm.selectedUtility = '';
        vm.identifier = '';
        vm.category = '';
        vm.incidentDate = '';
        vm.impactScope = 'Individual House';
        vm.description = '';
        vm.slaTime = '3-5 working days';
        vm.identifierLabel = 'Consumer Number';
        vm.categories = [];

        // Service Applications
        vm.services = {
            elec: [
                { 
                    name: 'New Connection', 
                    description: 'Apply for a new domestic electricity connection for your residence. Includes meter installation and wiring inspection.', 
                    icon: 'plug',
                    processingTime: '7-10 days',
                    documentsRequired: 3,
                    fee: '₹2,500',
                    feeLabel: 'Application Fee',
                    badge: 'Popular',
                    badgeClass: 'badge-popular',
                    eligibility: 'Property owner / authorized tenant',
                    provider: 'BRPL'
                },
                { 
                    name: 'Load Enhancement', 
                    description: 'Increase your sanctioned load to support additional appliances like ACs, heaters, or EV chargers.', 
                    icon: 'trending-up',
                    processingTime: '5-7 days',
                    documentsRequired: 2,
                    fee: '₹1,200',
                    feeLabel: 'Processing Fee',
                    badge: '',
                    badgeClass: '',
                    eligibility: 'Existing connection holder',
                    provider: 'BRPL'
                },
                { 
                    name: 'Meter Replacement', 
                    description: 'Request replacement for faulty, damaged, or outdated meters. Free if meter is under warranty.', 
                    icon: 'repeat',
                    processingTime: '3-5 days',
                    documentsRequired: 1,
                    fee: 'Free*',
                    feeLabel: 'Under Warranty',
                    badge: 'Quick',
                    badgeClass: 'badge-quick',
                    eligibility: 'Existing connection holder',
                    provider: 'BRPL'
                }
            ],
            water: [
                { 
                    name: 'New Water Connection', 
                    description: 'Apply for a new municipal water supply connection. Includes pipeline laying up to 15m from main line.', 
                    icon: 'droplet',
                    processingTime: '10-15 days',
                    documentsRequired: 4,
                    fee: '₹3,800',
                    feeLabel: 'Connection Fee',
                    badge: 'Popular',
                    badgeClass: 'badge-popular',
                    eligibility: 'Property owner with NOC',
                    provider: 'DJB'
                },
                { 
                    name: 'Meter Installation', 
                    description: 'Install a water flow meter on your existing connection for accurate billing and leak detection.', 
                    icon: 'activity',
                    processingTime: '7-10 days',
                    documentsRequired: 2,
                    fee: '₹1,500',
                    feeLabel: 'Installation Fee',
                    badge: '',
                    badgeClass: '',
                    eligibility: 'Existing connection holder',
                    provider: 'DJB'
                },
                { 
                    name: 'Pipeline Repair', 
                    description: 'Report and schedule repair for leaking or burst pipelines in your area. Emergency repairs within 24 hours.', 
                    icon: 'wrench',
                    processingTime: '1-3 days',
                    documentsRequired: 0,
                    fee: 'Free',
                    feeLabel: 'No Charge',
                    badge: 'Quick',
                    badgeClass: 'badge-quick',
                    eligibility: 'Any resident',
                    provider: 'DJB'
                }
            ],
            gas: [
                { 
                    name: 'New Gas Connection', 
                    description: 'Apply for a new Piped Natural Gas (PNG) domestic connection. Includes pipeline, meter, and regulator installation.', 
                    icon: 'flame',
                    processingTime: '15-20 days',
                    documentsRequired: 5,
                    fee: '₹6,500',
                    feeLabel: 'Installation Fee',
                    badge: 'Popular',
                    badgeClass: 'badge-popular',
                    eligibility: 'Property in PNG-covered area',
                    provider: 'IGL'
                },
                { 
                    name: 'Safety Inspection', 
                    description: 'Schedule a mandatory annual safety inspection of your gas pipeline and appliances by certified engineers.', 
                    icon: 'shield',
                    processingTime: '3-5 days',
                    documentsRequired: 0,
                    fee: 'Free',
                    feeLabel: 'Complimentary',
                    badge: 'Quick',
                    badgeClass: 'badge-quick',
                    eligibility: 'Existing PNG connection',
                    provider: 'IGL'
                },
                { 
                    name: 'Connection Transfer', 
                    description: 'Transfer your existing PNG connection to a new owner during property sale or change of tenancy.', 
                    icon: 'arrow-right-left',
                    processingTime: '7-10 days',
                    documentsRequired: 4,
                    fee: '₹500',
                    feeLabel: 'Transfer Fee',
                    badge: '',
                    badgeClass: '',
                    eligibility: 'Existing connection holder',
                    provider: 'IGL'
                }
            ]
        };
        vm.filteredServices = vm.services.elec;

        // Active Tickets
        vm.activeTickets = [
            {
                id: '#REQ-2024-001',
                status: 'In Progress',
                statusClass: 'status-progress',
                title: 'Power Outage - Sector 12',
                category: 'Power Outage',
                utility: 'Electricity',
                timeline: [
                    { label: 'Complaint Filed', date: '2 Feb, 10:30 AM', state: 'completed' },
                    { label: 'Acknowledged by Vendor', date: '2 Feb, 11:00 AM', state: 'completed' },
                    { label: 'Field Team Assigned', date: '2 Feb, 2:00 PM', state: 'active' },
                    { label: 'Resolution', state: 'pending' }
                ],
                remarks: 'Technician en route to location'
            },
            {
                id: '#REQ-2024-002',
                status: 'Pending',
                statusClass: 'status-pending',
                title: 'Water Supply Irregular',
                category: 'Water Supply',
                utility: 'Water',
                timeline: [
                    { label: 'Complaint Filed', date: '5 Feb, 9:00 AM', state: 'completed' },
                    { label: 'Under Review', state: 'pending' },
                    { label: 'Resolution', state: 'pending' }
                ],
                remarks: null
            }
        ];

        // Statistics
        vm.complaintsCount = 15;
        vm.resolvedCount = 12;
        vm.avgResolutionTime = 4;
        vm.successRate = 80;
        vm.historyInsight = 'Your complaints are typically resolved 20% faster than ward average.';

        vm.toggleServiceMode = toggleServiceMode;
        vm.quickReport = quickReport;
        vm.submitComplaint = submitComplaint;
        vm.updateCategories = updateCategories;
        vm.filterServices = filterServices;
        vm.applyForService = applyForService;
        vm.escalateTicket = escalateTicket;
        vm.viewTicketDetails = viewTicketDetails;
        vm.toggleTicketMenu = toggleTicketMenu;
        vm.viewAllOutages = viewAllOutages;
        vm.viewFAQ = viewFAQ;
        vm.viewGrievanceCell = viewGrievanceCell;
        vm.downloadGuide = downloadGuide;
        vm.useAiHelper = useAiHelper;
        vm.openMapPicker = openMapPicker;

        function init() {
            $timeout(function() {
                if (window.lucide) {
                    lucide.createIcons();
                }
            }, 100);
        }

        function toggleServiceMode(mode) {
            vm.serviceMode = mode;
            $timeout(function() {
                if (window.lucide) {
                    lucide.createIcons();
                }
            }, 100);
        }

        function quickReport(type) {
            vm.serviceMode = 'complaint';
            $timeout(function() {
                // Pre-fill form based on quick report type
                if (type === 'power_theft') {
                    vm.selectedUtility = 'electricity';
                    vm.category = 'Theft/Tampering';
                } else if (type === 'power_outage') {
                    vm.selectedUtility = 'electricity';
                    vm.category = 'Power Outage';
                } else if (type === 'street_light') {
                    vm.selectedUtility = 'electricity';
                    vm.category = 'Street Light';
                } else if (type === 'water_supply') {
                    vm.selectedUtility = 'water';
                    vm.category = 'Supply Issue';
                } else if (type === 'gas_leakage') {
                    vm.selectedUtility = 'gas';
                    vm.category = 'Gas Leakage';
                } else if (type === 'bill_issue') {
                    vm.category = 'Billing Issue';
                }
                updateCategories();
            }, 100);
        }

        function updateCategories() {
            if (vm.selectedUtility === 'electricity') {
                vm.categories = ['Power Outage', 'Billing Issue', 'Meter Issue', 'Street Light', 'Theft/Tampering'];
                vm.identifierLabel = 'Consumer Account Number';
                vm.slaTime = '24-48 hours';
            } else if (vm.selectedUtility === 'water') {
                vm.categories = ['Supply Issue', 'Water Quality', 'Billing Issue', 'Meter Issue', 'Leakage'];
                vm.identifierLabel = 'K Number';
                vm.slaTime = '3-5 working days';
            } else if (vm.selectedUtility === 'gas') {
                vm.categories = ['Gas Leakage', 'Supply Issue', 'Billing Issue', 'Meter Issue', 'Safety Concern'];
                vm.identifierLabel = 'BP Number';
                vm.slaTime = 'Emergency: 2-4 hours, Others: 3-5 days';
            }
        }

        function useAiHelper() {
            if (!vm.aiPrompt) return;
            
            var text = vm.aiPrompt.toLowerCase();
            vm.priority = 'medium'; 
            
            if (text.includes('street light') || text.includes('power') || text.includes('electricity')) {
                vm.selectedUtility = 'electricity';
                vm.updateCategories();
                
                if (text.includes('street light')) vm.category = 'Street Light';
                else if (text.includes('outage') || text.includes('no power')) vm.category = 'Power Outage';
                else if (text.includes('bill')) vm.category = 'Billing Issue';
                
                if (text.includes('spark') || text.includes('fire')) vm.priority = 'high';
            } 
            else if (text.includes('water') || text.includes('pipe') || text.includes('leak')) {
                vm.selectedUtility = 'water';
                vm.updateCategories();
                vm.category = text.includes('leak') ? 'Leakage' : 'Supply Issue';
                
                if (text.includes('flood') || text.includes('burst')) vm.priority = 'high';
            }
            else if (text.includes('gas') || text.includes('smell')) {
                vm.selectedUtility = 'gas';
                vm.updateCategories();
                vm.category = 'Gas Leakage';
                vm.priority = 'high';
            }
            
            if (text.includes('house') || text.includes('my home')) vm.impactScope = 'Individual House';
            else if (text.includes('street') || text.includes('road')) vm.impactScope = 'Entire Street';
            
            vm.description = vm.aiPrompt;
            vm.location = 'Kalkaji, New Delhi'; // Mocked
            
            $rootScope.showDialog('AI Assistant', 'I have identified the utility, category, and priority based on your description. Please review and submit.', 'success');
        }

        function openMapPicker() {
            $rootScope.showDialog('Select Location', 'A map selection modal would open here to let you pin the exact location.', 'info');
        }

        function submitComplaint() {
            if (!vm.category) {
                $rootScope.showDialog('Missing Fields', 'Please fill all required fields before submitting your complaint.', 'warning');
                return;
            }

            vm.loading = true;
            var complaintData = {
                utility: vm.selectedUtility,
                identifier: vm.identifier,
                category: vm.category,
                incidentDate: vm.incidentDate,
                impactScope: vm.impactScope,
                description: vm.description
            };

            ApiService.submitServiceRequest(complaintData)
                .then(function(response) {
                    $rootScope.showDialog('Complaint Submitted', 'Your complaint has been submitted successfully! Ticket ID: #REQ-2024-003. Track status in Active Tickets.', 'success');
                    resetForm();
                    vm.loading = false;
                })
                .catch(function(error) {
                    console.error('Error submitting complaint:', error);
                    $rootScope.showDialog('Complaint Registered', 'Your complaint has been registered. Ticket ID: #REQ-2024-003. You will receive updates via SMS.', 'success');
                    resetForm();
                    vm.loading = false;
                });
        }

        function resetForm() {
            vm.selectedUtility = '';
            vm.identifier = '';
            vm.category = '';
            vm.incidentDate = '';
            vm.impactScope = 'Individual House';
            vm.description = '';
        }

        function filterServices(type) {
            vm.serviceFilter = type;
            vm.filteredServices = vm.services[type];
        }

        function applyForService(service) {
            vm.selectedService = service;
            vm.showApplyModal = true;
        }

        vm.confirmApplyService = function() {
            var service = vm.selectedService;
            vm.showApplyModal = false;
            $rootScope.showDialog('Application Submitted!', 'Your application for "' + service.name + '" has been submitted successfully.\n\nApplication ID: #APP-' + Date.now().toString(36).toUpperCase() + '\nProcessing Time: ' + service.processingTime + '\n\nYou will receive updates via SMS and email.', 'success');
            vm.selectedService = null;
        };

        vm.closeApplyModal = function() {
            vm.showApplyModal = false;
            vm.selectedService = null;
        };

        function escalateTicket(ticket) {
            $rootScope.showDialog('Ticket Escalated', 'Ticket ' + ticket.id + ' has been escalated to the Grievance Redressal Cell. Expected response within 24 hours.', 'warning');
        }

        function viewTicketDetails(ticket) {
            vm.selectedTicket = ticket;
            vm.showTicketModal = true;
        }

        vm.closeTicketModal = function() {
            vm.showTicketModal = false;
            vm.selectedTicket = null;
        };

        function toggleTicketMenu(ticket) {
            $rootScope.showDialog('Ticket Options — ' + ticket.id, 'You can escalate, track, or close this ticket. Use the escalate button for urgent issues.', 'info');
        }

        function viewAllOutages() {
            $rootScope.showDialog('Outages & Maintenance', 'Current planned outages:\n• Block C — Power maintenance (20 Jan)\n• Sector 5 — Water pipe replacement (22 Jan)\nCheck community page for real-time updates.', 'info');
        }

        function viewFAQ() {
            $rootScope.showDialog('Frequently Asked Questions', 'Q: How long does complaint resolution take?\nA: Electricity: 24–48 hrs, Water: 3–5 days, Gas Emergency: 2–4 hrs.\n\nQ: How to track my complaint?\nA: Use the Active Tickets section above.', 'info');
        }

        function viewGrievanceCell() {
            $rootScope.showDialog('Grievance Redressal Cell', 'Phone: 1912 (Toll-free)\nEmail: grievance@utilities.gov.in\nTimings: Mon–Sat, 9 AM – 6 PM\nEscalation: Superintendent Engineer, BRPL', 'info');
        }

        function downloadGuide() {
            $rootScope.showDialog('User Guide', 'The citizen services user guide covers complaint filing, service applications, and tracking. A downloadable PDF will be available soon.', 'info');
        }

        init();
    }
})();
