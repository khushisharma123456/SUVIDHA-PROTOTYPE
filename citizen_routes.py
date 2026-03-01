"""
Citizen API Routes Blueprint
Contains all citizen-facing endpoints (extracted from main.py)
Handles: auth, bills, complaints, dashboard, community, consumption, senior citizen features
"""

from flask import Blueprint, request, jsonify, session
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta, date
import secrets
import uuid

# Initialize Blueprint for citizen routes
citizen_bp = Blueprint('citizen', __name__)

# These will be set when blueprint is registered
db = None
User = None
Vendor = None
Community = None
CommunityStats = None
Bill = None
ServiceReport = None

def init_citizen_models(database, models):
    """Initialize database and models for the blueprint"""
    global db, User, Vendor, Community, CommunityStats, Bill, ServiceReport
    
    db = database
    User = models['User']
    Vendor = models['Vendor']
    Community = models['Community']
    CommunityStats = models['CommunityStats']
    Bill = models['Bill']
    ServiceReport = models['ServiceReport']


# ============================================
# AUTHENTICATION ENDPOINTS FOR CITIZENS
# ============================================

@citizen_bp.route('/api/citizen/signup', methods=['POST'])
def citizen_signup():
    """Register a new citizen (general or senior)"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['fullName', 'email', 'phone', 'password', 'state', 'city', 'ward', 'locality']
        if not all(field in data for field in required_fields):
            return jsonify({'success': False, 'message': 'Missing required fields'}), 400
        
        # Check if user exists
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'success': False, 'message': 'Email already registered'}), 400
        
        if User.query.filter_by(phone=data['phone']).first():
            return jsonify({'success': False, 'message': 'Phone number already registered'}), 400
        
        # Determine user type based on age or explicit selection
        user_type = data.get('userType', 'general')
        date_of_birth = None
        
        if 'dateOfBirth' in data:
            try:
                date_of_birth = datetime.strptime(data['dateOfBirth'], '%Y-%m-%d').date()
                today = date.today()
                age = today.year - date_of_birth.year - ((today.month, today.day) < (date_of_birth.month, date_of_birth.day))
                if age >= 60:
                    user_type = 'senior_citizen'
            except ValueError:
                pass
        
        # Create new user
        user = User(
            full_name=data['fullName'],
            email=data['email'],
            phone=data['phone'],
            password=generate_password_hash(data['password']),
            user_type=user_type,
            date_of_birth=date_of_birth,
            preferred_language=data.get('language', 'en'),
            aadhaar=data.get('aadhaar', None),
            aadhaar_consent=data.get('consent', False),
            state=data['state'],
            city=data['city'],
            ward=data['ward'],
            locality=data['locality'],
            electricity_provider_id=data.get('electricityProvider', None),
            water_provider_id=data.get('waterProvider', None),
            gas_provider_id=data.get('gasProvider', None),
            alerts_enabled=data.get('alertsEnabled', True)
        )
        
        db.session.add(user)
        db.session.flush()
        
        # Create community membership
        community = Community(
            user_id=user.id,
            state=data['state'],
            city=data['city'],
            ward=data['ward'],
            locality=data.get('locality', '')
        )
        db.session.add(community)
        
        db.session.commit()
        
        # Store in session
        session['user_id'] = user.id
        session['user_email'] = user.email
        session['user_type'] = user_type
        
        # Generate auth token
        auth_token = secrets.token_hex(32)
        session['auth_token'] = auth_token
        
        return jsonify({
            'success': True,
            'message': 'Account created successfully',
            'user_id': user.id,
            'user_type': user_type,
            'token': auth_token,
            'user': user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@citizen_bp.route('/api/citizen/login', methods=['POST'])
def citizen_login():
    """Login for both general and senior citizens"""
    try:
        data = request.get_json()
        
        # Find user by email or phone
        user = User.query.filter(
            (User.email == data.get('identifier')) | (User.phone == data.get('identifier'))
        ).first()
        
        if not user or not check_password_hash(user.password, data.get('password')):
            return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
        
        # Update last login
        user.last_login = datetime.utcnow()
        db.session.commit()
        
        # Store in session
        session['user_id'] = user.id
        session['user_email'] = user.email
        session['user_type'] = user.user_type
        
        # Generate auth token
        auth_token = secrets.token_hex(32)
        session['auth_token'] = auth_token
        
        return jsonify({
            'success': True,
            'message': 'Login successful',
            'user_id': user.id,
            'user_type': user.user_type,
            'token': auth_token,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@citizen_bp.route('/api/citizen/logout', methods=['POST'])
def citizen_logout():
    """Logout citizen"""
    session.clear()
    return jsonify({'success': True, 'message': 'Logged out successfully'}), 200

@citizen_bp.route('/api/citizen/profile', methods=['GET'])
def get_citizen_profile():
    """Get citizen profile details"""
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'success': False, 'message': 'Not authenticated'}), 401
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        return jsonify({
            'success': True,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@citizen_bp.route('/api/citizen/profile', methods=['PUT'])
def update_citizen_profile():
    """Update citizen profile"""
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'success': False, 'message': 'Not authenticated'}), 401
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        data = request.get_json()
        
        if 'fullName' in data:
            user.full_name = data['fullName']
        if 'phone' in data:
            user.phone = data['phone']
        if 'preferredLanguage' in data:
            user.preferred_language = data['preferredLanguage']
        if 'alertsEnabled' in data:
            user.alerts_enabled = data['alertsEnabled']
        if 'locality' in data:
            user.locality = data['locality']
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Profile updated successfully',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

# ============================================
# BILLS MANAGEMENT ENDPOINTS
# ============================================

@citizen_bp.route('/api/citizen/bills', methods=['GET'])
def get_citizen_bills():
    """Get all bills for the logged-in citizen"""
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'success': False, 'message': 'Not authenticated'}), 401
        
        utility_type = request.args.get('utility_type')
        status = request.args.get('status')
        
        query = Bill.query.filter_by(user_id=user_id)
        
        if utility_type:
            query = query.filter_by(utility_type=utility_type)
        if status:
            query = query.filter_by(status=status)
        
        bills = query.order_by(Bill.created_at.desc()).all()
        
        return jsonify({
            'success': True,
            'bills': [bill.to_dict() for bill in bills]
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@citizen_bp.route('/api/citizen/bills/<bill_id>', methods=['GET'])
def get_bill_details(bill_id):
    """Get details of a specific bill"""
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'success': False, 'message': 'Not authenticated'}), 401
        
        bill = Bill.query.filter_by(id=bill_id, user_id=user_id).first()
        if not bill:
            return jsonify({'success': False, 'message': 'Bill not found'}), 404
        
        return jsonify({
            'success': True,
            'bill': bill.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@citizen_bp.route('/api/citizen/bills/<bill_id>/pay', methods=['POST'])
def pay_bill(bill_id):
    """Mark a bill as paid"""
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'success': False, 'message': 'Not authenticated'}), 401
        
        bill = Bill.query.filter_by(id=bill_id, user_id=user_id).first()
        if not bill:
            return jsonify({'success': False, 'message': 'Bill not found'}), 404
        
        data = request.get_json()
        payment_method = data.get('paymentMethod', 'online')
        
        bill.status = 'paid'
        bill.paid_date = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Bill paid successfully',
            'bill': bill.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@citizen_bp.route('/api/citizen/bills/summary', methods=['GET'])
def get_bills_summary():
    """Get bills summary for dashboard"""
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'success': False, 'message': 'Not authenticated'}), 401
        
        bills = Bill.query.filter_by(user_id=user_id).all()
        
        total_bills = len(bills)
        pending_bills = len([b for b in bills if b.status == 'pending'])
        paid_bills = len([b for b in bills if b.status == 'paid'])
        overdue_bills = len([b for b in bills if b.status == 'overdue'])
        
        total_pending_amount = sum(b.amount for b in bills if b.status in ['pending', 'overdue'])
        total_paid_amount = sum(b.amount for b in bills if b.status == 'paid')
        
        electricity_bills = [b for b in bills if b.utility_type == 'electricity']
        water_bills = [b for b in bills if b.utility_type == 'water']
        gas_bills = [b for b in bills if b.utility_type == 'gas']
        
        return jsonify({
            'success': True,
            'summary': {
                'total_bills': total_bills,
                'pending_bills': pending_bills,
                'paid_bills': paid_bills,
                'overdue_bills': overdue_bills,
                'total_pending_amount': total_pending_amount,
                'total_paid_amount': total_paid_amount,
                'electricity': {
                    'count': len(electricity_bills),
                    'pending_amount': sum(b.amount for b in electricity_bills if b.status in ['pending', 'overdue'])
                },
                'water': {
                    'count': len(water_bills),
                    'pending_amount': sum(b.amount for b in water_bills if b.status in ['pending', 'overdue'])
                },
                'gas': {
                    'count': len(gas_bills),
                    'pending_amount': sum(b.amount for b in gas_bills if b.status in ['pending', 'overdue'])
                }
            }
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# ============================================
# COMPLAINTS/SERVICE REPORTS ENDPOINTS
# ============================================

@citizen_bp.route('/api/citizen/complaints', methods=['GET'])
def get_citizen_complaints():
    """Get all complaints/service reports for the citizen"""
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'success': False, 'message': 'Not authenticated'}), 401
        
        status = request.args.get('status')
        utility_type = request.args.get('utility_type')
        
        query = ServiceReport.query.filter_by(user_id=user_id)
        
        if status:
            query = query.filter_by(status=status)
        if utility_type:
            query = query.filter_by(utility_type=utility_type)
        
        complaints = query.order_by(ServiceReport.created_at.desc()).all()
        
        return jsonify({
            'success': True,
            'complaints': [complaint.to_dict() for complaint in complaints]
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@citizen_bp.route('/api/citizen/complaints', methods=['POST'])
def create_complaint():
    """Create a new complaint/service report"""
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'success': False, 'message': 'Not authenticated'}), 401
        
        data = request.get_json()
        
        if not all(k in data for k in ['title', 'description', 'utility_type', 'report_type']):
            return jsonify({'success': False, 'message': 'Missing required fields'}), 400
        
        user = User.query.get(user_id)
        
        complaint = ServiceReport(
            user_id=user_id,
            report_type=data['report_type'],
            utility_type=data['utility_type'],
            title=data['title'],
            description=data['description'],
            priority=data.get('priority', 'medium'),
            location=f"{user.locality}, {user.ward}, {user.city}, {user.state}"
        )
        
        db.session.add(complaint)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Complaint registered successfully',
            'complaint': complaint.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@citizen_bp.route('/api/citizen/complaints/<complaint_id>', methods=['GET'])
def get_complaint_details(complaint_id):
    """Get details of a specific complaint"""
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'success': False, 'message': 'Not authenticated'}), 401
        
        complaint = ServiceReport.query.filter_by(id=complaint_id, user_id=user_id).first()
        if not complaint:
            return jsonify({'success': False, 'message': 'Complaint not found'}), 404
        
        return jsonify({
            'success': True,
            'complaint': complaint.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@citizen_bp.route('/api/citizen/complaints/summary', methods=['GET'])
def get_complaints_summary():
    """Get complaints summary for dashboard"""
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'success': False, 'message': 'Not authenticated'}), 401
        
        complaints = ServiceReport.query.filter_by(user_id=user_id).all()
        
        total_complaints = len(complaints)
        open_complaints = len([c for c in complaints if c.status == 'open'])
        in_progress = len([c for c in complaints if c.status == 'in_progress'])
        resolved_complaints = len([c for c in complaints if c.status == 'resolved'])
        
        return jsonify({
            'success': True,
            'summary': {
                'total': total_complaints,
                'open': open_complaints,
                'in_progress': in_progress,
                'resolved': resolved_complaints
            }
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# ============================================
# DASHBOARD ENDPOINTS
# ============================================

@citizen_bp.route('/api/citizen/dashboard', methods=['GET'])
def get_citizen_dashboard():
    """Get dashboard data for citizen"""
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'success': False, 'message': 'Not authenticated'}), 401
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        # Get bills summary
        bills = Bill.query.filter_by(user_id=user_id).all()
        pending_bills = [b for b in bills if b.status in ['pending', 'overdue']]
        
        # Get complaints summary
        complaints = ServiceReport.query.filter_by(user_id=user_id).all()
        active_complaints = [c for c in complaints if c.status in ['open', 'in_progress']]
        
        # Get community stats
        community = Community.query.filter_by(user_id=user_id).first()
        
        # Get recent activities
        recent_bills = Bill.query.filter_by(user_id=user_id).order_by(Bill.created_at.desc()).limit(5).all()
        recent_complaints = ServiceReport.query.filter_by(user_id=user_id).order_by(ServiceReport.created_at.desc()).limit(5).all()
        
        return jsonify({
            'success': True,
            'dashboard': {
                'user': user.to_dict(),
                'bills_summary': {
                    'total': len(bills),
                    'pending': len(pending_bills),
                    'pending_amount': sum(b.amount for b in pending_bills)
                },
                'complaints_summary': {
                    'total': len(complaints),
                    'active': len(active_complaints)
                },
                'community': community.to_dict() if community else None,
                'recent_bills': [b.to_dict() for b in recent_bills],
                'recent_complaints': [c.to_dict() for c in recent_complaints]
            }
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# ============================================
# SENIOR CITIZEN SPECIFIC ENDPOINTS
# ============================================

@citizen_bp.route('/api/senior/live-waste-service', methods=['GET'])
def get_live_waste_service():
    """Get live waste collection service info for senior citizens"""
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'success': False, 'message': 'Not authenticated'}), 401
        
        user = User.query.get(user_id)
        
        waste_service = {
            'next_collection': {
                'date': (datetime.utcnow() + timedelta(days=1)).isoformat(),
                'time': '08:00 AM',
                'type': 'General Waste'
            },
            'schedule': [
                {'day': 'Monday', 'time': '8:00 AM', 'type': 'General Waste'},
                {'day': 'Wednesday', 'time': '8:00 AM', 'type': 'Recyclables'},
                {'day': 'Friday', 'time': '8:00 AM', 'type': 'General Waste'},
            ],
            'location': f"{user.locality}, {user.ward}",
            'contact': '1800-XXX-XXXX'
        }
        
        return jsonify({
            'success': True,
            'waste_service': waste_service
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@citizen_bp.route('/api/senior/updates', methods=['GET'])
def get_senior_updates():
    """Get important updates and notifications for senior citizens"""
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'success': False, 'message': 'Not authenticated'}), 401
        
        updates = [
            {
                'id': str(uuid.uuid4()),
                'title': 'New Senior Citizen Discount Scheme',
                'description': 'Get 20% discount on electricity bills',
                'date': datetime.utcnow().isoformat(),
                'type': 'announcement',
                'priority': 'high'
            },
            {
                'id': str(uuid.uuid4()),
                'title': 'Health Camp Scheduled',
                'description': 'Free health checkup camp on March 15, 2026',
                'date': datetime.utcnow().isoformat(),
                'type': 'event',
                'priority': 'medium'
            }
        ]
        
        return jsonify({
            'success': True,
            'updates': updates
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# ============================================
# WASTE MANAGEMENT ENDPOINT
# ============================================

@citizen_bp.route('/api/waste', methods=['GET'])
def get_waste_info():
    """Get waste management info"""
    try:
        user_id = session.get('user_id')
        user = User.query.get(user_id) if user_id else None
        
        location = f"{user.locality}, {user.ward}" if user else "Your Area"
        
        waste_data = {
            'next_collection': {
                'date': (datetime.utcnow() + timedelta(days=1)).isoformat(),
                'time': '08:00 AM',
                'type': 'General Waste'
            },
            'schedule': [
                {'day': 'Monday', 'time': '8:00 AM', 'type': 'General Waste'},
                {'day': 'Wednesday', 'time': '8:00 AM', 'type': 'Recyclables'},
                {'day': 'Friday', 'time': '8:00 AM', 'type': 'General Waste'},
                {'day': 'Saturday', 'time': '9:00 AM', 'type': 'Bulk/Hazardous'}
            ],
            'location': location,
            'helpline': '1800-123-4567',
            'recycling_centers': [
                {'name': 'Green Earth Center', 'address': f'{location}', 'hours': '9 AM - 5 PM'},
                {'name': 'Eco Recycle Hub', 'address': f'{location}', 'hours': '8 AM - 6 PM'}
            ]
        }
        
        return jsonify({
            'success': True,
            'waste': waste_data
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@citizen_bp.route('/api/waste/issue', methods=['POST'])
def report_waste_issue():
    """Report a waste management issue"""
    try:
        user_id = session.get('user_id')
        if not user_id:
            # Allow anonymous reports for accessibility
            user_id = None
        
        data = request.get_json()
        
        if not data.get('issue_type') and not data.get('description'):
            return jsonify({'success': False, 'message': 'Issue type or description is required'}), 400
        
        # Get user location info if available
        user = User.query.get(user_id) if user_id else None
        location = f"{user.locality}, {user.ward}, {user.city}, {user.state}" if user else data.get('location', 'Unknown')
        
        # Create a service report for the waste issue
        report = ServiceReport(
            user_id=user_id or 'anonymous',
            report_type='waste_management',
            utility_type='waste',
            title=data.get('issue_type', 'Waste Management Issue'),
            description=data.get('description', data.get('issue_type', 'Waste issue reported')),
            priority=data.get('priority', 'medium'),
            location=location
        )
        
        db.session.add(report)
        
        # Update community report count if user exists
        if user_id:
            community = Community.query.filter_by(user_id=user_id).first()
            if community:
                community.reports_submitted += 1
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Waste issue reported successfully',
            'report_id': report.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

# ============================================
# VENDORS ENDPOINTS  
# ============================================

@citizen_bp.route('/api/citizen/vendors', methods=['GET'])
def citizen_get_vendors():
    """Get all vendors or filter by service type"""
    try:
        service_type = request.args.get('service_type', None)
        
        if service_type:
            vendors = Vendor.query.filter_by(service_type=service_type).all()
        else:
            vendors = Vendor.query.all()
        
        return jsonify({
            'success': True,
            'vendors': [vendor.to_dict() for vendor in vendors]
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# ============================================
# COMMUNITY ENGAGEMENT ENDPOINTS
# ============================================

@citizen_bp.route('/api/citizen/community/stats', methods=['GET'])
def get_community_stats():
    """Get community statistics for the user's area"""
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'success': False, 'message': 'Not authenticated'}), 401
        
        user = User.query.get(user_id)
        
        ward_stats = CommunityStats.query.filter_by(
            state=user.state,
            city=user.city,
            ward=user.ward
        ).first()
        
        return jsonify({
            'success': True,
            'stats': ward_stats.to_dict() if ward_stats else None
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@citizen_bp.route('/api/citizen/community/leaderboard', methods=['GET'])
def get_community_leaderboard():
    """Get community leaderboard"""
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'success': False, 'message': 'Not authenticated'}), 401
        
        top_contributors = Community.query.order_by(
            Community.points_earned.desc()
        ).limit(10).all()
        
        leaderboard = []
        for idx, member in enumerate(top_contributors, 1):
            user = User.query.get(member.user_id)
            leaderboard.append({
                'rank': idx,
                'name': user.full_name if user else 'Unknown',
                'points': member.points_earned,
                'badges': member.badges.split(',') if member.badges else []
            })
        
        return jsonify({
            'success': True,
            'leaderboard': leaderboard
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# ============================================
# UTILITIES - CONSUMPTION TRACKING
# ============================================

@citizen_bp.route('/api/citizen/consumption', methods=['GET'])
def get_consumption_data():
    """Get consumption data for electricity, water, gas"""
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'success': False, 'message': 'Not authenticated'}), 401
        
        utility_type = request.args.get('utility_type', 'electricity')
        period = request.args.get('period', 'monthly')
        
        bills = Bill.query.filter_by(
            user_id=user_id,
            utility_type=utility_type
        ).order_by(Bill.billing_period_start.desc()).limit(12).all()
        
        consumption_data = []
        for bill in bills:
            consumption_data.append({
                'period': bill.billing_period_start.strftime('%b %Y'),
                'consumption': bill.consumption,
                'unit': bill.consumption_unit,
                'amount': bill.amount
            })
        
        return jsonify({
            'success': True,
            'utility_type': utility_type,
            'consumption': consumption_data
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
