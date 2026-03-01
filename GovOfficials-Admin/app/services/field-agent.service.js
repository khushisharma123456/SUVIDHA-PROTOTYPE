/**
 * Field Operations API Service
 * Handles all API calls for field agents and task management
 */
angular.module('adminApp').factory('FieldAgentService', ['$http', '$q', function($http, $q) {
    var API_BASE = '/api';
    
    return {
        // ============================================
        // FIELD AGENTS
        // ============================================
        
        /**
         * Get all field agents with optional filters
         */
        getAgents: function(filters) {
            var params = {};
            if (filters) {
                if (filters.category) params.category = filters.category;
                if (filters.status) params.status = filters.status;
                if (filters.ward) params.ward = filters.ward;
            }
            return $http.get(API_BASE + '/field-agents', { params: params })
                .then(function(response) {
                    return response.data;
                });
        },
        
        /**
         * Get single agent details with tasks and performance
         */
        getAgent: function(agentId) {
            return $http.get(API_BASE + '/field-agents/' + agentId)
                .then(function(response) {
                    return response.data;
                });
        },
        
        /**
         * Create a new field agent
         */
        createAgent: function(agentData) {
            return $http.post(API_BASE + '/field-agents', agentData)
                .then(function(response) {
                    return response.data;
                });
        },
        
        /**
         * Update field agent details
         */
        updateAgent: function(agentId, updateData) {
            return $http.put(API_BASE + '/field-agents/' + agentId, updateData)
                .then(function(response) {
                    return response.data;
                });
        },
        
        /**
         * Update agent status (online, on_task, offline)
         */
        updateAgentStatus: function(agentId, status) {
            return $http.put(API_BASE + '/field-agents/' + agentId + '/status', { status: status })
                .then(function(response) {
                    return response.data;
                });
        },
        
        /**
         * Get agent performance history
         */
        getAgentPerformance: function(agentId, year) {
            var params = year ? { year: year } : {};
            return $http.get(API_BASE + '/field-agents/' + agentId + '/performance', { params: params })
                .then(function(response) {
                    return response.data;
                });
        },
        
        // ============================================
        // TASKS
        // ============================================
        
        /**
         * Get tasks with optional filters
         */
        getTasks: function(filters) {
            var params = {};
            if (filters) {
                if (filters.agent_id) params.agent_id = filters.agent_id;
                if (filters.status) params.status = filters.status;
                if (filters.task_type) params.task_type = filters.task_type;
                if (filters.ward) params.ward = filters.ward;
                if (filters.date) params.date = filters.date;
            }
            return $http.get(API_BASE + '/tasks', { params: params })
                .then(function(response) {
                    return response.data;
                });
        },
        
        /**
         * Get single task details
         */
        getTask: function(taskId) {
            return $http.get(API_BASE + '/tasks/' + taskId)
                .then(function(response) {
                    return response.data;
                });
        },
        
        /**
         * Create a new task assignment
         */
        createTask: function(taskData) {
            return $http.post(API_BASE + '/tasks', taskData)
                .then(function(response) {
                    return response.data;
                });
        },
        
        /**
         * Update task status
         */
        updateTaskStatus: function(taskId, statusData) {
            return $http.put(API_BASE + '/tasks/' + taskId + '/status', statusData)
                .then(function(response) {
                    return response.data;
                });
        },
        
        /**
         * Bulk assign tasks to an agent
         */
        bulkAssignTasks: function(data) {
            return $http.post(API_BASE + '/tasks/bulk-assign', data)
                .then(function(response) {
                    return response.data;
                });
        },
        
        // ============================================
        // DASHBOARD STATISTICS
        // ============================================
        
        /**
         * Get field operations dashboard statistics
         */
        getFieldStats: function() {
            return $http.get(API_BASE + '/admin/field-stats')
                .then(function(response) {
                    return response.data;
                });
        },
        
        // ============================================
        // HELPER FUNCTIONS
        // ============================================
        
        /**
         * Format agent data for display
         */
        formatAgentForDisplay: function(agent) {
            var categoryMap = {
                'electric_meter': { name: 'Electric Meter', class: 'electric' },
                'water_meter': { name: 'Water Meter', class: 'water' },
                'gas_cylinder': { name: 'Gas Cylinder', class: 'gas' },
                'rwa_work': { name: 'RWA Work', class: 'info' }
            };
            
            var statusMap = {
                'online': { name: 'Online', class: 'online' },
                'on_task': { name: 'On Task', class: 'busy' },
                'offline': { name: 'Offline', class: 'offline' },
                'break': { name: 'Break', class: 'offline' }
            };
            
            var cat = categoryMap[agent.category] || { name: agent.category, class: 'info' };
            var stat = statusMap[agent.status] || { name: agent.status, class: 'offline' };
            
            var performanceClass = 'average';
            if (agent.performance_score >= 90) performanceClass = 'excellent';
            else if (agent.performance_score >= 70) performanceClass = 'good';
            
            return {
                id: agent.id,
                employeeId: agent.employee_id,
                name: agent.full_name,
                initials: agent.full_name.split(' ').map(function(n) { return n[0]; }).join(''),
                category: cat.name,
                categoryClass: cat.class,
                status: stat.name,
                statusClass: stat.class,
                currentTask: agent.status === 'on_task' ? 'Working' : 'Available',
                taskClass: agent.status === 'on_task' ? 'warning' : 'success',
                location: agent.assigned_ward || 'N/A',
                tasksCompleted: agent.tasks_completed_today || 0,
                tasksAssigned: 10, // Will be calculated from tasks
                performanceScore: Math.round(agent.performance_score),
                performanceClass: performanceClass,
                gpsEnabled: agent.gps_enabled,
                currentLocation: agent.current_address || 'Unknown',
                latitude: agent.current_latitude,
                longitude: agent.current_longitude,
                lastUpdate: agent.location_updated_at ? 
                    new Date(agent.location_updated_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 
                    'N/A',
                phone: agent.phone,
                email: agent.email,
                totalTasksCompleted: agent.total_tasks_completed
            };
        },
        
        /**
         * Format task data for display
         */
        formatTaskForDisplay: function(task) {
            var statusMap = {
                'pending': { name: 'Pending', class: 'warning' },
                'in_progress': { name: 'In Progress', class: 'info' },
                'completed': { name: 'Completed', class: 'success' },
                'failed': { name: 'Failed', class: 'danger' },
                'cancelled': { name: 'Cancelled', class: 'secondary' }
            };
            
            var stat = statusMap[task.status] || { name: task.status, class: 'secondary' };
            
            return {
                id: task.id,
                taskId: task.task_id,
                houseNumber: task.house_number,
                ward: task.ward,
                address: task.full_address || task.house_number + ', ' + task.ward,
                status: stat.name,
                statusClass: stat.class,
                time: task.completed_at ? 
                    new Date(task.completed_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) :
                    new Date(task.assigned_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
                photoAdded: task.photos_added,
                problemRaised: task.problem_raised,
                problemType: task.problem_type,
                problemDescription: task.problem_description,
                meterReading: task.meter_reading,
                completionTime: task.completion_time_minutes
            };
        }
    };
}]);
