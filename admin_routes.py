"""
Admin API Routes Blueprint for Government Officials Dashboard
Contains all admin endpoints (extracted from admin_seed.py)
"""

from flask import Blueprint, request, jsonify, session
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import secrets

# Initialize Blueprint for admin routes
admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

# These will be set when blueprint is registered
db = None
GovOfficial = None
Grievance = None
MeterReading = None
RWAProject = None
AuditLog = None
FieldOperation = None
WardStats = None
ParticipationScheme = None
Redemption = None
Bill = None

def init_admin_models(database, models):
    """Initialize database and models for the blueprint"""
    global db, GovOfficial, Grievance, MeterReading, RWAProject, AuditLog
    global FieldOperation, WardStats, ParticipationScheme, Redemption, Bill
    
    db = database
    GovOfficial = models['GovOfficial']
    Grievance = models['Grievance']
    MeterReading = models['MeterReading']
    RWAProject = models['RWAProject']
    AuditLog = models['AuditLog']
    FieldOperation = models['FieldOperation']
    WardStats = models['WardStats']
    ParticipationScheme = models['ParticipationScheme']
    Redemption = models['Redemption']
    Bill = models['Bill']


# ============================================
# GOVERNMENT OFFICIAL ADMIN ENDPOINTS
# ============================================

@admin_bp.route('/auth/login', methods=['POST'])
def admin_login():
    """Login for government officials"""
    try:
        data = request.get_json()
        identifier = data.get('identifier', '')  # Email or Employee ID
        password = data.get('password', '')
        
        # Find official by email or employee_id
        official = GovOfficial.query.filter(
            (GovOfficial.email == identifier) | (GovOfficial.employee_id == identifier)
        ).first()
        
        if not official:
            return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
        
        if not check_password_hash(official.password, password):
            return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
        
        if not official.is_active:
            return jsonify({'success': False, 'message': 'Account is deactivated'}), 403
        
        # Update last login
        official.last_login = datetime.utcnow()
        db.session.commit()
        
        # Store in session
        session['admin_id'] = official.id
        session['admin_employee_id'] = official.employee_id
        
        # Generate auth token
        auth_token = secrets.token_hex(32)
        session['admin_token'] = auth_token
        
        return jsonify({
            'success': True,
            'message': 'Login successful',
            'token': auth_token,
            'official': official.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@admin_bp.route('/auth/signup', methods=['POST'])
def admin_signup():
    """Signup for government officials"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['fullName', 'email', 'employeeId', 'password', 'department', 'designation']
        if not all(field in data for field in required_fields):
            return jsonify({'success': False, 'message': 'Missing required fields'}), 400
        
        # Check if official exists
        if GovOfficial.query.filter_by(email=data['email']).first():
            return jsonify({'success': False, 'message': 'Email already registered'}), 400
        
        if GovOfficial.query.filter_by(employee_id=data['employeeId']).first():
            return jsonify({'success': False, 'message': 'Employee ID already registered'}), 400
        
        # Create new official
        official = GovOfficial(
            employee_id=data['employeeId'],
            full_name=data['fullName'],
            email=data['email'],
            phone=data.get('phone', ''),
            password=generate_password_hash(data['password']),
            department=data['department'],
            designation=data['designation'],
            role='official',
            assigned_state=data.get('state', 'Delhi'),
            assigned_district=data.get('district', 'South Delhi'),
            assigned_ward=data.get('ward', 'Ward 15')
        )
        
        db.session.add(official)
        db.session.commit()
        
        # Store in session
        session['admin_id'] = official.id
        session['admin_employee_id'] = official.employee_id
        
        # Generate auth token
        auth_token = secrets.token_hex(32)
        session['admin_token'] = auth_token
        
        return jsonify({
            'success': True,
            'message': 'Account created successfully',
            'token': auth_token,
            'official': official.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@admin_bp.route('/auth/logout', methods=['POST'])
def admin_logout():
    """Logout for government officials"""
    session.pop('admin_id', None)
    session.pop('admin_employee_id', None)
    session.pop('admin_token', None)
    return jsonify({'success': True, 'message': 'Logged out successfully'}), 200


@admin_bp.route('/auth/me', methods=['GET'])
def admin_get_current():
    """Get current logged in official"""
    admin_id = session.get('admin_id')
    if not admin_id:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401
    
    official = GovOfficial.query.get(admin_id)
    if not official:
        return jsonify({'success': False, 'message': 'Official not found'}), 404
    
    return jsonify({'success': True, 'official': official.to_dict()}), 200


@admin_bp.route('/dashboard', methods=['GET'])
def admin_dashboard():
    """Get dashboard statistics for admin"""
    try:
        # Get filter parameters
        state = request.args.get('state', 'all')
        district = request.args.get('district', 'all')
        ward = request.args.get('ward', 'all')
        
        # Build base query filters
        grievance_query = Grievance.query
        if state != 'all':
            grievance_query = grievance_query.filter_by(state=state)
        if district != 'all':
            grievance_query = grievance_query.filter_by(district=district)
        if ward != 'all':
            grievance_query = grievance_query.filter_by(ward=ward)
        
        # Calculate statistics
        active_complaints = grievance_query.filter(Grievance.status.in_(['pending', 'assigned', 'in_progress', 'escalated'])).count()
        sla_breaches = grievance_query.filter_by(sla_breached=True).count()
        
        # Get areas under stress
        ward_stats = WardStats.query.all()
        stress_areas = sum(1 for ws in ward_stats if ws.electricity_stress == 'high' or ws.water_stress == 'high' or ws.gas_stress == 'high')
        active_outages = sum(ws.active_outages for ws in ward_stats)
        
        # Revenue statistics
        today = datetime.utcnow().date()
        month_start = today.replace(day=1)
        
        today_collections = Bill.query.filter(
            Bill.paid_date >= datetime.combine(today, datetime.min.time()),
            Bill.status == 'paid'
        ).with_entities(db.func.sum(Bill.amount)).scalar() or 0
        
        month_collections = Bill.query.filter(
            Bill.paid_date >= datetime.combine(month_start, datetime.min.time()),
            Bill.status == 'paid'
        ).with_entities(db.func.sum(Bill.amount)).scalar() or 0
        
        pending_amount = Bill.query.filter_by(status='pending').with_entities(db.func.sum(Bill.amount)).scalar() or 0
        
        def format_revenue(amount):
            if amount >= 10000000:
                return f'{amount/10000000:.2f}Cr'
            elif amount >= 100000:
                return f'{amount/100000:.2f}L'
            else:
                return f'₹{amount:,.0f}'
        
        return jsonify({
            'success': True,
            'stats': {
                'activeComplaints': active_complaints,
                'slaBreaches': sla_breaches,
                'areasStress': stress_areas,
                'activeOutages': active_outages
            },
            'revenue': {
                'todayCollections': format_revenue(today_collections),
                'monthToDate': format_revenue(month_collections),
                'pending': format_revenue(pending_amount),
                'syncAlerts': 2
            }
        }), 200
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': str(e)}), 500


@admin_bp.route('/grievances', methods=['GET'])
def admin_get_grievances():
    """Get all grievances with filters"""
    try:
        status = request.args.get('status', 'all')
        severity = request.args.get('severity', 'all')
        utility_type = request.args.get('utility_type', 'all')
        ward = request.args.get('ward', 'all')
        limit = request.args.get('limit', 50, type=int)
        
        query = Grievance.query
        
        if status != 'all':
            query = query.filter_by(status=status)
        if severity != 'all':
            query = query.filter_by(severity=severity)
        if utility_type != 'all':
            query = query.filter_by(utility_type=utility_type)
        if ward != 'all':
            query = query.filter_by(ward=ward)
        
        grievances = query.order_by(Grievance.created_at.desc()).limit(limit).all()
        
        result = []
        for g in grievances:
            g_dict = g.to_dict()
            if g.sla_deadline:
                time_remaining = g.sla_deadline - datetime.utcnow()
                hours = int(time_remaining.total_seconds() // 3600)
                minutes = int((time_remaining.total_seconds() % 3600) // 60)
                if hours < 0:
                    g_dict['slaTime'] = 'Breached'
                    g_dict['slaClass'] = 'critical'
                elif hours < 2:
                    g_dict['slaTime'] = f'{hours}h {minutes}m'
                    g_dict['slaClass'] = 'critical'
                elif hours < 6:
                    g_dict['slaTime'] = f'{hours}h {minutes}m'
                    g_dict['slaClass'] = 'warning'
                else:
                    g_dict['slaTime'] = f'{hours}h {minutes}m'
                    g_dict['slaClass'] = 'safe'
            result.append(g_dict)
        
        stats = {
            'pending': Grievance.query.filter_by(status='pending').count(),
            'slaRisk': Grievance.query.filter(
                Grievance.sla_deadline <= datetime.utcnow() + timedelta(hours=4),
                Grievance.status.in_(['pending', 'assigned', 'in_progress'])
            ).count(),
            'escalated': Grievance.query.filter_by(status='escalated').count(),
            'resolved': Grievance.query.filter_by(status='resolved').count()
        }
        
        return jsonify({
            'success': True,
            'grievances': result,
            'stats': stats
        }), 200
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': str(e)}), 500


@admin_bp.route('/meter-readings', methods=['GET'])
def admin_get_meter_readings():
    """Get meter readings with filters"""
    try:
        status = request.args.get('status', 'all')
        limit = request.args.get('limit', 50, type=int)
        
        query = MeterReading.query
        if status != 'all':
            query = query.filter_by(status=status)
        
        readings = query.order_by(MeterReading.reading_time.desc()).limit(limit).all()
        
        stats = {
            'verified': MeterReading.query.filter_by(status='verified').count(),
            'review': MeterReading.query.filter_by(status='review').count(),
            'suspicious': MeterReading.query.filter_by(status='suspicious').count(),
            'aiConfidence': db.session.query(db.func.avg(MeterReading.ai_confidence)).scalar() or 0
        }
        
        return jsonify({
            'success': True,
            'readings': [r.to_dict() for r in readings],
            'stats': stats
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@admin_bp.route('/meter-readings/<reading_id>/approve', methods=['POST'])
def admin_approve_meter(reading_id):
    """Approve a meter reading"""
    try:
        reading = MeterReading.query.get(reading_id)
        if not reading:
            return jsonify({'success': False, 'message': 'Reading not found'}), 404
        
        reading.status = 'verified'
        reading.ai_confidence = 100
        reading.verified_at = datetime.utcnow()
        reading.verified_by = session.get('admin_id')
        
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Reading approved', 'reading': reading.to_dict()}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@admin_bp.route('/rwa-projects', methods=['GET'])
def admin_get_rwa_projects():
    """Get RWA projects"""
    try:
        status = request.args.get('status', 'all')
        
        query = RWAProject.query
        if status != 'all':
            query = query.filter_by(status=status)
        
        projects = query.order_by(RWAProject.deadline).all()
        
        stats = {
            'total': RWAProject.query.count(),
            'completed': RWAProject.query.filter_by(status='completed').count(),
            'inProgress': RWAProject.query.filter(RWAProject.status.in_(['in_progress', 'near_complete'])).count(),
            'delayed': RWAProject.query.filter_by(status='delayed').count()
        }
        
        return jsonify({
            'success': True,
            'projects': [p.to_dict() for p in projects],
            'stats': stats
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@admin_bp.route('/audit-logs', methods=['GET'])
def admin_get_audit_logs():
    """Get audit logs"""
    try:
        action_type = request.args.get('type', 'all')
        source = request.args.get('source', 'all')
        limit = request.args.get('limit', 50, type=int)
        
        query = AuditLog.query
        
        if action_type != 'all':
            query = query.filter_by(action_type=action_type)
        if source != 'all':
            query = query.filter_by(source=source)
        
        logs = query.order_by(AuditLog.timestamp.desc()).limit(limit).all()
        
        return jsonify({
            'success': True,
            'logs': [log.to_dict() for log in logs]
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@admin_bp.route('/field-operations', methods=['GET'])
def admin_get_field_operations():
    """Get field operations"""
    try:
        status = request.args.get('status', 'all')
        
        query = FieldOperation.query
        if status != 'all':
            query = query.filter_by(status=status)
        
        operations = query.order_by(FieldOperation.scheduled_date.desc()).all()
        
        return jsonify({
            'success': True,
            'operations': [op.to_dict() for op in operations]
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@admin_bp.route('/ward-stats', methods=['GET'])
def admin_get_ward_stats():
    """Get ward statistics"""
    try:
        ward_stats = WardStats.query.all()
        
        return jsonify({
            'success': True,
            'wardStats': [ws.to_dict() for ws in ward_stats]
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@admin_bp.route('/participation', methods=['GET'])
def admin_get_participation():
    """Get participation and incentive data"""
    try:
        schemes = ParticipationScheme.query.filter_by(is_active=True).all()
        redemptions = Redemption.query.order_by(Redemption.created_at.desc()).limit(20).all()
        
        ward_stats = WardStats.query.all()
        wards = []
        for ws in ward_stats:
            wards.append({
                'id': ws.ward,
                'name': ws.ward_name,
                'participation': ws.participation_rate,
                'level': 'very-high' if ws.participation_rate >= 80 else 'high' if ws.participation_rate >= 60 else 'medium' if ws.participation_rate >= 40 else 'low'
            })
        
        stats = {
            'totalParticipants': sum(s.total_participants for s in schemes),
            'activeSchemes': len(schemes),
            'pendingRedemptions': Redemption.query.filter_by(is_verified=False).count(),
            'abuseAlerts': sum(1 for s in schemes if s.abuse_rate == 'high')
        }
        
        return jsonify({
            'success': True,
            'schemes': [s.to_dict() for s in schemes],
            'redemptions': [r.to_dict() for r in redemptions],
            'wards': wards,
            'stats': stats
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@admin_bp.route('/policy/ward-rankings', methods=['GET'])
def admin_get_ward_rankings():
    """Get ward rankings for policy insights"""
    try:
        ward_stats = WardStats.query.order_by(WardStats.satisfaction_score.desc()).all()
        
        rankings = []
        grades = ['A+', 'A', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F']
        for i, ws in enumerate(ward_stats):
            grade_index = min(i // 3, len(grades) - 1)
            rankings.append({
                'name': ws.ward_name or ws.ward,
                'resolved': ws.resolved_complaints,
                'avgTime': f'{ws.avg_resolution_time:.1f} hrs',
                'satisfaction': ws.satisfaction_score,
                'score': grades[grade_index],
                'scoreClass': 'success' if grade_index < 2 else 'info' if grade_index < 4 else 'warning' if grade_index < 6 else 'danger',
                'participationScore': ws.participation_rate,
                'waterComplaints': ws.water_complaints,
                'electricityComplaints': ws.electricity_complaints,
                'gasComplaints': ws.gas_complaints,
                'trend': ws.trend
            })
        
        return jsonify({
            'success': True,
            'rankings': rankings
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@admin_bp.route('/officials', methods=['GET'])
def admin_get_officials():
    """Get all government officials"""
    try:
        department = request.args.get('department', 'all')
        
        query = GovOfficial.query
        if department != 'all':
            query = query.filter_by(department=department)
        
        officials = query.order_by(GovOfficial.full_name).all()
        
        return jsonify({
            'success': True,
            'officials': [o.to_dict() for o in officials]
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@admin_bp.route('/utility-trends', methods=['GET'])
def admin_get_utility_trends():
    """Get utility consumption trends for charts"""
    try:
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        
        daily_data = db.session.query(
            db.func.date(Bill.billing_period_end).label('date'),
            Bill.utility_type,
            db.func.sum(Bill.consumption).label('total_consumption')
        ).filter(
            Bill.billing_period_end >= thirty_days_ago
        ).group_by(
            db.func.date(Bill.billing_period_end),
            Bill.utility_type
        ).all()
        
        labels = []
        for i in range(6, -1, -1):
            date = datetime.utcnow() - timedelta(days=i)
            labels.append(date.strftime('%a'))
        
        electricity_data = [850, 920, 880, 950, 830, 890, 910]
        water_data = [420, 380, 450, 410, 390, 430, 400]
        gas_data = [120, 150, 130, 140, 125, 135, 145]
        
        return jsonify({
            'success': True,
            'labels': labels,
            'electricity': electricity_data,
            'water': water_data,
            'gas': gas_data
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
