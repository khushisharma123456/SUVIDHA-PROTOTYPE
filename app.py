from flask import Flask, render_template, session, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import secrets
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
# import nyckel  # Commented out - not required for citizen dashboard
import requests
import base64
from image_verification import verify_image, clear_session_hashes
from models import (db, User, Vendor, Community, CommunityStats, Bill, ServiceReport,
                    GovOfficial, Grievance, MeterReading, RWAProject, AuditLog, 
                    FieldOperation, WardStats, ParticipationScheme, Redemption,
                    FieldAgent, TaskAssignment, AgentLocationHistory, AgentPerformance,
                    Household, MeterSubmission, ImageHash)

# Import admin blueprint
from admin_routes import admin_bp, init_admin_models

# Import citizen blueprint
from citizen_routes import citizen_bp, init_citizen_models

# Configure Flask to use different delimiters to avoid conflict with AngularJS
class CustomFlask(Flask):
    jinja_options = Flask.jinja_options.copy()
    jinja_options.update(dict(
        variable_start_string='{$',
        variable_end_string='$}',
        comment_start_string='{#',
        comment_end_string='#}',
    ))

app = CustomFlask(__name__, static_folder='static', static_url_path='/static')
app.secret_key = 'your-secret-key-here-change-in-production'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///suvidha.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_HTTPONLY'] = True

# Initialize database
db.init_app(app)
CORS(app, supports_credentials=True, origins=['http://127.0.0.1:5000', 'http://localhost:5000'])

# Initialize admin models and register blueprint
init_admin_models(db, {
    'GovOfficial': GovOfficial,
    'Grievance': Grievance,
    'MeterReading': MeterReading,
    'RWAProject': RWAProject,
    'AuditLog': AuditLog,
    'FieldOperation': FieldOperation,
    'WardStats': WardStats,
    'ParticipationScheme': ParticipationScheme,
    'Redemption': Redemption,
    'Bill': Bill,
    'FieldAgent': FieldAgent,
    'TaskAssignment': TaskAssignment,
    'AgentLocationHistory': AgentLocationHistory,
    'AgentPerformance': AgentPerformance,
    'Household': Household,
    'MeterSubmission': MeterSubmission
})
app.register_blueprint(admin_bp)

# Initialize citizen models and register blueprint
init_citizen_models(db, {
    'User': User,
    'Vendor': Vendor,
    'Community': Community,
    'CommunityStats': CommunityStats,
    'Bill': Bill,
    'ServiceReport': ServiceReport
})
app.register_blueprint(citizen_bp)

# Create database tables
try:
    with app.app_context():
        db.create_all()
        print("✓ Database tables created")
except Exception as e:
    print(f"✗ Error creating tables: {e}")

# Initialize vendors on first request (lazy loading)
@app.before_request
def init_vendors():
    """Initialize default vendors if they don't exist"""
    if not hasattr(app, '_vendors_initialized'):
        try:
            existing_vendors = Vendor.query.first()
            if not existing_vendors:
                vendors_data = [
                    # Electricity Providers
                    {'name': 'BSES Yamuna Power Ltd', 'service_type': 'electricity', 'description': 'Electricity distribution in Delhi'},
                    {'name': 'Tata Power Delhi', 'service_type': 'electricity', 'description': 'Electricity distribution in Delhi'},
                    {'name': 'CESC Limited', 'service_type': 'electricity', 'description': 'Electricity distribution in Kolkata'},
                    {'name': 'Torrent Power', 'service_type': 'electricity', 'description': 'Electricity distribution in Gujarat'},
                    
                    # Water Providers
                    {'name': 'Delhi Jal Board', 'service_type': 'water', 'description': 'Water supply in Delhi'},
                    {'name': 'Brihanmumbai Municipal Corporation', 'service_type': 'water', 'description': 'Water supply in Mumbai'},
                    {'name': 'Bangalore Water Supply & Sewerage Board', 'service_type': 'water', 'description': 'Water supply in Bangalore'},
                    {'name': 'Chennai Metropolitan Water Supply & Sewerage Board', 'service_type': 'water', 'description': 'Water supply in Chennai'},
                    
                    # Gas Providers
                    {'name': 'Indane (Cylinder)', 'service_type': 'gas', 'description': 'LPG gas cylinders delivery'},
                    {'name': 'HP Gas (Cylinder)', 'service_type': 'gas', 'description': 'LPG gas cylinders delivery'},
                    {'name': 'PNG (Pipeline Natural Gas)', 'service_type': 'gas', 'description': 'Pipeline natural gas supply'},
                    {'name': 'Bharat Gas', 'service_type': 'gas', 'description': 'LPG gas cylinders delivery'},
                ]
                
                for vendor_data in vendors_data:
                    vendor = Vendor(**vendor_data)
                    db.session.add(vendor)
                
                db.session.commit()
                print("✓ Vendors initialized")
        except Exception as e:
            print(f"⚠ Vendors init error: {e}")
        finally:
            app._vendors_initialized = True

# ============================================
# SERVE MAIN APP & ROUTING
# ============================================
@app.route('/')
def landing():
    return render_template('index.html')

@app.route('/app')
def citizen_app():
    # Check if user is logged in
    if 'user_id' not in session:
        return redirect('/login')
    return render_template('index.html')

@app.route('/login')
def login_page():
    return render_template('login.html')

@app.route('/signup')
def signup_page():
    return render_template('signup.html')

@app.route('/waste-worker')
@app.route('/govWaste-worker/')
def waste_worker_portal():
    return send_from_directory('govWaste-worker', 'index.html')

@app.route('/<path:path>')
def catch_all(path):
    # Serve Government Officials Admin files
    if path.startswith('GovOfficials-Admin/'):
        file_path = path[len('GovOfficials-Admin/'):]
        return send_from_directory('GovOfficials-Admin', file_path)
    # Serve Senior Citizen portal files
    if path.startswith('SeniorCitizen/'):
        file_path = path[len('SeniorCitizen/'):]
        return send_from_directory('SeniorCitizen', file_path)
    # Serve Field Worker portal files
    if path.startswith('GovOfficial-Worker/'):
        file_path = path[len('GovOfficial-Worker/'):]
        return send_from_directory('GovOfficial-Worker', file_path)
    if path.startswith('static/'):
        return app.send_static_file(path[7:])
    elif path.startswith('api/'):
        return app.send_static_file(path)
    return render_template('index.html')

@app.after_request
def add_header(response):
    """Add headers to prevent caching during development"""
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, post-check=0, pre-check=0, max-age=0'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '-1'
    return response

# ============================================
# AUTHENTICATION ENDPOINTS (Unified - role-aware)
# ============================================
@app.route('/api/auth/signup', methods=['POST'])
def api_signup():
    """Unified signup endpoint - routes to correct table based on role"""
    try:
        data = request.get_json()
        role = data.get('role', 'citizen')
        
        # ---------- AGENT SIGNUP ----------
        if role == 'agent':
            required_fields = ['fullName', 'email', 'phone', 'password', 'employeeId', 'department']
            if not all(data.get(f) for f in required_fields):
                return jsonify({'success': False, 'message': 'Missing required fields for agent signup'}), 400
            
            if FieldAgent.query.filter_by(email=data['email']).first():
                return jsonify({'success': False, 'message': 'Email already registered'}), 400
            if FieldAgent.query.filter_by(employee_id=data['employeeId']).first():
                return jsonify({'success': False, 'message': 'Employee ID already registered'}), 400
            
            # Determine category from department
            dept_to_category = {
                'electricity': 'electric_meter',
                'water': 'water_meter',
                'gas': 'gas_cylinder',
                'rwa': 'rwa_work',
                'field_ops': 'electric_meter'
            }
            category = dept_to_category.get(data['department'], 'electric_meter')
            
            agent = FieldAgent(
                employee_id=data['employeeId'],
                full_name=data['fullName'],
                email=data['email'],
                phone=data['phone'],
                password=generate_password_hash(data['password']),
                category=category,
                assigned_state=data.get('state', 'Delhi'),
                assigned_district=data.get('city', 'South Delhi'),
                assigned_ward=data.get('ward', ''),
                status='offline',
                performance_score=50.0
            )
            
            db.session.add(agent)
            db.session.commit()
            
            session['agent_id'] = agent.id
            auth_token = secrets.token_hex(32)
            session['auth_token'] = auth_token
            
            return jsonify({
                'success': True,
                'message': 'Field agent account created successfully',
                'user_id': agent.id,
                'token': auth_token,
                'user': agent.to_dict()
            }), 201
        
        # ---------- OFFICIAL SIGNUP ----------
        elif role == 'official':
            required_fields = ['fullName', 'email', 'employeeId', 'password', 'department']
            if not all(data.get(f) for f in required_fields):
                return jsonify({'success': False, 'message': 'Missing required fields for official signup'}), 400
            
            if GovOfficial.query.filter_by(email=data['email']).first():
                return jsonify({'success': False, 'message': 'Email already registered'}), 400
            if GovOfficial.query.filter_by(employee_id=data['employeeId']).first():
                return jsonify({'success': False, 'message': 'Employee ID already registered'}), 400
            
            official = GovOfficial(
                employee_id=data['employeeId'],
                full_name=data['fullName'],
                email=data['email'],
                phone=data.get('phone', ''),
                password=generate_password_hash(data['password']),
                department=data['department'],
                designation=data.get('designation', 'junior_officer'),
                role='official',
                assigned_state=data.get('state', 'Delhi'),
                assigned_district=data.get('city', 'South Delhi'),
                assigned_ward=data.get('ward', '')
            )
            
            db.session.add(official)
            db.session.commit()
            
            session['admin_id'] = official.id
            session['admin_employee_id'] = official.employee_id
            auth_token = secrets.token_hex(32)
            session['admin_token'] = auth_token
            
            return jsonify({
                'success': True,
                'message': 'Government official account created successfully',
                'user_id': official.id,
                'token': auth_token,
                'user': official.to_dict()
            }), 201
        
        # ---------- CITIZEN / SENIOR CITIZEN SIGNUP ----------
        else:
            required_fields = ['fullName', 'email', 'phone', 'password', 'state', 'city', 'ward', 'locality']
            if not all(data.get(f) for f in required_fields):
                return jsonify({'success': False, 'message': 'Missing required fields'}), 400
            
            if User.query.filter_by(email=data['email']).first():
                return jsonify({'success': False, 'message': 'Email already registered'}), 400
            
            if User.query.filter_by(phone=data['phone']).first():
                return jsonify({'success': False, 'message': 'Phone number already registered'}), 400
            
            # Determine user type
            user_type = 'senior_citizen' if role == 'senior' else 'general'
            date_of_birth = None
            if data.get('dob'):
                try:
                    from datetime import date as dt_date
                    date_of_birth = datetime.strptime(data['dob'], '%Y-%m-%d').date()
                    today = dt_date.today()
                    age = today.year - date_of_birth.year - ((today.month, today.day) < (date_of_birth.month, date_of_birth.day))
                    if age >= 60:
                        user_type = 'senior_citizen'
                except ValueError:
                    pass
            
            user = User(
                full_name=data['fullName'],
                email=data['email'],
                phone=data['phone'],
                password=generate_password_hash(data['password']),
                user_type=user_type,
                date_of_birth=date_of_birth,
                preferred_language=data.get('language', 'en'),
                aadhaar=data.get('aadhaar', None) or None,
                aadhaar_consent=data.get('consent', False),
                state=data['state'],
                city=data['city'],
                ward=data['ward'],
                locality=data['locality'],
                electricity_provider_id=data.get('electricityProvider', None) or None,
                water_provider_id=data.get('waterProvider', None) or None,
                gas_provider_id=data.get('gasProvider', None) or None,
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
            
            session['user_id'] = user.id
            session['user_email'] = user.email
            session['user_type'] = user_type
            
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

@app.route('/api/auth/login', methods=['POST'])
def api_login():
    """Unified login endpoint - routes to correct table based on role"""
    try:
        data = request.get_json()
        role = data.get('role', 'citizen')
        identifier = data.get('identifier', '')
        password = data.get('password', '')
        
        # ---------- AGENT LOGIN ----------
        if role == 'agent':
            agent = FieldAgent.query.filter(
                (FieldAgent.email == identifier) | (FieldAgent.employee_id == identifier)
            ).first()
            
            if not agent or not check_password_hash(agent.password, password):
                return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
            
            if not agent.is_active:
                return jsonify({'success': False, 'message': 'Account is deactivated'}), 403
            
            agent.last_login = datetime.utcnow()
            agent.status = 'online'
            db.session.commit()
            
            session['agent_id'] = agent.id
            auth_token = secrets.token_hex(32)
            session['auth_token'] = auth_token
            
            return jsonify({
                'success': True,
                'message': 'Login successful',
                'user_id': agent.id,
                'token': auth_token,
                'user': agent.to_dict()
            }), 200
        
        # ---------- OFFICIAL LOGIN ----------
        elif role == 'official':
            official = GovOfficial.query.filter(
                (GovOfficial.email == identifier) | (GovOfficial.employee_id == identifier)
            ).first()
            
            if not official or not check_password_hash(official.password, password):
                return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
            
            if not official.is_active:
                return jsonify({'success': False, 'message': 'Account is deactivated'}), 403
            
            official.last_login = datetime.utcnow()
            db.session.commit()
            
            session['admin_id'] = official.id
            session['admin_employee_id'] = official.employee_id
            auth_token = secrets.token_hex(32)
            session['admin_token'] = auth_token
            
            return jsonify({
                'success': True,
                'message': 'Login successful',
                'user_id': official.id,
                'token': auth_token,
                'user': official.to_dict()
            }), 200
        
        # ---------- CITIZEN / SENIOR CITIZEN LOGIN ----------
        else:
            user = User.query.filter(
                (User.email == identifier) | (User.phone == identifier)
            ).first()
            
            if not user or not check_password_hash(user.password, password):
                return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
            
            user.last_login = datetime.utcnow()
            db.session.commit()
            
            session['user_id'] = user.id
            session['user_email'] = user.email
            session['user_type'] = user.user_type
            
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

@app.route('/api/auth/logout', methods=['POST'])
def api_logout():
    """Unified logout endpoint"""
    # If agent is logged in, set them offline
    agent_id = session.get('agent_id')
    if agent_id:
        agent = FieldAgent.query.get(agent_id)
        if agent:
            agent.status = 'offline'
            db.session.commit()
    session.clear()
    return jsonify({'success': True, 'message': 'Logged out successfully'}), 200

# ============================================
# PASSWORD RESET & OTP VERIFICATION ENDPOINTS
# ============================================
@app.route('/api/auth/forgot-password', methods=['POST'])
def api_forgot_password():
    """Request password reset - sends reset token (simulated)"""
    try:
        data = request.get_json()
        email = data.get('email', '')
        
        if not email:
            return jsonify({'success': False, 'message': 'Email is required'}), 400
        
        # Check all user tables for the email
        user = User.query.filter_by(email=email).first()
        agent = FieldAgent.query.filter_by(email=email).first()
        official = GovOfficial.query.filter_by(email=email).first()
        
        if not user and not agent and not official:
            # Don't reveal whether email exists (security best practice)
            return jsonify({
                'success': True,
                'message': 'If an account with this email exists, a password reset link has been sent.'
            }), 200
        
        # Generate reset token
        reset_token = secrets.token_hex(32)
        
        # Store token in session (in production, store in DB with expiry + send via email)
        session['reset_token'] = reset_token
        session['reset_email'] = email
        session['reset_expires'] = (datetime.utcnow() + timedelta(hours=1)).isoformat()
        
        # In production, send email with reset link containing the token
        # For now, return the token for testing
        return jsonify({
            'success': True,
            'message': 'If an account with this email exists, a password reset link has been sent.',
            'token': reset_token  # Remove in production - only for testing
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/api/auth/reset-password', methods=['POST'])
def api_reset_password():
    """Reset password using reset token"""
    try:
        data = request.get_json()
        token = data.get('token', '')
        new_password = data.get('password', '')
        
        if not token or not new_password:
            return jsonify({'success': False, 'message': 'Token and new password are required'}), 400
        
        if len(new_password) < 6:
            return jsonify({'success': False, 'message': 'Password must be at least 6 characters'}), 400
        
        # Validate token
        stored_token = session.get('reset_token')
        reset_email = session.get('reset_email')
        reset_expires = session.get('reset_expires')
        
        if not stored_token or stored_token != token:
            return jsonify({'success': False, 'message': 'Invalid or expired reset token'}), 400
        
        if reset_expires and datetime.fromisoformat(reset_expires) < datetime.utcnow():
            session.pop('reset_token', None)
            session.pop('reset_email', None)
            session.pop('reset_expires', None)
            return jsonify({'success': False, 'message': 'Reset token has expired'}), 400
        
        # Find user across all tables and update password
        hashed_password = generate_password_hash(new_password)
        updated = False
        
        user = User.query.filter_by(email=reset_email).first()
        if user:
            user.password = hashed_password
            updated = True
        
        agent = FieldAgent.query.filter_by(email=reset_email).first()
        if agent:
            agent.password = hashed_password
            updated = True
        
        official = GovOfficial.query.filter_by(email=reset_email).first()
        if official:
            official.password = hashed_password
            updated = True
        
        if updated:
            db.session.commit()
            # Clear reset session data
            session.pop('reset_token', None)
            session.pop('reset_email', None)
            session.pop('reset_expires', None)
            return jsonify({'success': True, 'message': 'Password reset successfully'}), 200
        else:
            return jsonify({'success': False, 'message': 'Account not found'}), 404
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/api/auth/verify-otp', methods=['POST'])
def api_verify_otp():
    """Verify OTP for email/phone verification (simulated)"""
    try:
        data = request.get_json()
        otp_type = data.get('type', 'email')  # 'email' or 'phone'
        value = data.get('value', '')  # email address or phone number
        otp = data.get('otp', '')
        
        if not value or not otp:
            return jsonify({'success': False, 'message': 'Value and OTP are required'}), 400
        
        # In production, validate OTP against stored value from SMS/email service
        # For demo/development, accept any 6-digit OTP or "123456"
        if len(otp) == 6 and otp.isdigit():
            # Mark user as verified
            user = None
            if otp_type == 'email':
                user = User.query.filter_by(email=value).first()
            elif otp_type == 'phone':
                user = User.query.filter_by(phone=value).first()
            
            if user:
                user.is_verified = True
                db.session.commit()
            
            return jsonify({
                'success': True,
                'message': f'{otp_type.capitalize()} verified successfully',
                'verified': True
            }), 200
        else:
            return jsonify({'success': False, 'message': 'Invalid OTP'}), 400
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# ============================================
# VENDORS ENDPOINTS
# ============================================
@app.route('/api/vendors', methods=['GET'])
def api_get_vendors():
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

@app.route('/api/vendors/<vendor_id>', methods=['GET'])
def api_get_vendor(vendor_id):
    try:
        vendor = Vendor.query.get(vendor_id)
        
        if not vendor:
            return jsonify({'success': False, 'message': 'Vendor not found'}), 404
        
        return jsonify({
            'success': True,
            'vendor': vendor.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# ============================================
# COMMUNITY ENDPOINTS
# ============================================
@app.route('/api/community/members', methods=['GET'])
def api_get_community_members():
    try:
        state = request.args.get('state')
        city = request.args.get('city')
        ward = request.args.get('ward')
        locality = request.args.get('locality')
        
        query = Community.query
        if state:
            query = query.filter_by(state=state)
        if city:
            query = query.filter_by(city=city)
        if ward:
            query = query.filter_by(ward=ward)
        if locality:
            query = query.filter_by(locality=locality)
        
        members = query.all()
        
        return jsonify({
            'success': True,
            'members': [member.to_dict() for member in members],
            'total': len(members)
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/community/stats', methods=['GET'])
def api_get_community_stats():
    try:
        state = request.args.get('state')
        city = request.args.get('city')
        ward = request.args.get('ward')
        
        query = CommunityStats.query
        if state:
            query = query.filter_by(state=state)
        if city:
            query = query.filter_by(city=city)
        if ward:
            query = query.filter_by(ward=ward)
        
        stats = query.all()
        
        return jsonify({
            'success': True,
            'stats': [stat.to_dict() for stat in stats]
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/community/user/<user_id>', methods=['GET'])
def api_get_user_community(user_id):
    try:
        community = Community.query.filter_by(user_id=user_id).first()
        
        if not community:
            return jsonify({'success': False, 'message': 'Community member not found'}), 404
        
        return jsonify({
            'success': True,
            'community': community.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/community/update-points', methods=['POST'])
def api_update_community_points():
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        points = data.get('points', 0)
        
        community = Community.query.filter_by(user_id=user_id).first()
        if not community:
            return jsonify({'success': False, 'message': 'Community member not found'}), 404
        
        community.points_earned += points
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Points updated',
            'points': community.points_earned
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

# ============================================
# USER ENDPOINTS
# ============================================
@app.route('/api/users/<user_id>', methods=['GET'])
def api_get_user(user_id):
    try:
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        return jsonify({
            'success': True,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/users/<user_id>', methods=['PUT'])
def api_update_user(user_id):
    try:
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        data = request.get_json()
        
        # Update user fields
        if 'full_name' in data:
            user.full_name = data['full_name']
        if 'preferred_language' in data:
            user.preferred_language = data['preferred_language']
        if 'alerts_enabled' in data:
            user.alerts_enabled = data['alerts_enabled']
        if 'electricity_provider_id' in data:
            user.electricity_provider_id = data['electricity_provider_id']
        if 'water_provider_id' in data:
            user.water_provider_id = data['water_provider_id']
        if 'gas_provider_id' in data:
            user.gas_provider_id = data['gas_provider_id']
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'User updated successfully',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

# ============================================
# EXISTING MOCK API ROUTES (for compatibility)
# ============================================
@app.route('/api/dashboard')
def api_dashboard():
    """Get comprehensive dashboard data for logged-in user"""
    user_id = session.get('user_id')
    
    # For demo purposes, use a default user if not logged in
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401
    
    
    try:
        # Get user details
        user = User.query.get(user_id)
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        # Get recent bills for each utility type
        electricity_bill = Bill.query.filter_by(
            user_id=user_id, 
            utility_type='electricity'
        ).order_by(Bill.created_at.desc()).first()
        
        water_bill = Bill.query.filter_by(
            user_id=user_id,
            utility_type='water'
        ).order_by(Bill.created_at.desc()).first()
        
        gas_bill = Bill.query.filter_by(
            user_id=user_id,
            utility_type='gas'
        ).order_by(Bill.created_at.desc()).first()
        
        # Get service reports stats
        total_reports = ServiceReport.query.filter_by(user_id=user_id).count()
        open_reports = ServiceReport.query.filter_by(user_id=user_id, status='open').count()
        resolved_reports = ServiceReport.query.filter_by(user_id=user_id, status='resolved').count()
        in_progress_reports = ServiceReport.query.filter_by(user_id=user_id, status='in_progress').count()
        
        # Get community data
        community = Community.query.filter_by(user_id=user_id).first()
        
        # Prepare response with actual DB values (0 if no data)
        data = {
            'username': user.full_name,
            'user': {
                'id': user.id,
                'full_name': user.full_name,
                'email': user.email,
                'phone': user.phone,
                'state': user.state,
                'city': user.city,
                'ward': user.ward,
                'locality': user.locality,
                'account_created': user.account_created.isoformat() if user.account_created else None
            },
            'consumption': {
                'electricity': {
                    'current': electricity_bill.consumption if electricity_bill else 0,
                    'unit': 'kWh',
                    'current_bill': electricity_bill.amount if electricity_bill else 0,
                    'due_date': electricity_bill.due_date.strftime('%d %b %Y') if electricity_bill else 'N/A',
                    'status': electricity_bill.status if electricity_bill else 'none'
                },
                'gas': {
                    'current': gas_bill.consumption if gas_bill else 0,
                    'unit': 'SCM',
                    'current_bill': gas_bill.amount if gas_bill else 0,
                    'status': gas_bill.status if gas_bill else 'none'
                },
                'water': {
                    'current': water_bill.consumption if water_bill else 0,
                    'unit': 'kL',
                    'current_bill': water_bill.amount if water_bill else 0,
                    'status': water_bill.status if water_bill else 'none'
                }
            },
            'reports': {
                'total': total_reports,
                'open': open_reports,
                'resolved': resolved_reports,
                'in_progress': in_progress_reports
            },
            'community': {
                'points': community.points_earned if community else 0,
                'challenges': community.challenges_participated if community else 0,
                'reports_submitted': community.reports_submitted if community else 0,
                'badges': community.badges.split(',') if (community and community.badges) else []
            }
        }
        
        return jsonify(data)
        
    except Exception as e:
        print(f"Dashboard error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/utilities')
def api_utilities():
    """Get utility consumption data from database"""
    user_id = session.get('user_id')
    
    # For demo, get first user if not logged in
    if not user_id:
        demo_user = User.query.first()
        if demo_user:
            user_id = demo_user.id
    
    if user_id:
        try:
            # Get last 12 months of electricity bills
            electricity_bills = Bill.query.filter_by(
                user_id=user_id,
                utility_type='electricity'
            ).order_by(Bill.billing_period_end.desc()).limit(12).all()
            
            # Get last 12 months of gas bills
            gas_bills = Bill.query.filter_by(
                user_id=user_id,
                utility_type='gas'
            ).order_by(Bill.billing_period_end.desc()).limit(12).all()
            
            # Get last 12 months of water bills
            water_bills = Bill.query.filter_by(
                user_id=user_id,
                utility_type='water'
            ).order_by(Bill.billing_period_end.desc()).limit(12).all()
            
            # Prepare monthly data (reverse to show oldest first)
            electricity_data = [b.consumption for b in reversed(electricity_bills)] if electricity_bills else [0]
            gas_data = [b.consumption for b in reversed(gas_bills)] if gas_bills else [0]
            water_data = [b.consumption for b in reversed(water_bills)] if water_bills else [0]
            
            # Get user details for provider info
            user = User.query.get(user_id)
            
            # Get provider names
            elec_provider = Vendor.query.get(user.electricity_provider_id) if user.electricity_provider_id else None
            gas_provider = Vendor.query.get(user.gas_provider_id) if user.gas_provider_id else None
            water_provider = Vendor.query.get(user.water_provider_id) if user.water_provider_id else None
            
            data = {
                'electricity': {
                    'monthly_data': electricity_data,
                    'months': ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][-len(electricity_data):],
                    'provider': elec_provider.name if elec_provider else 'Not Set',
                    'tariff': {
                        'slab1': 3.00,
                        'slab2': 4.50,
                        'slab3': 6.50
                    }
                },
                'gas': {
                    'monthly_data': gas_data,
                    'months': ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][-len(gas_data):],
                    'provider': gas_provider.name if gas_provider else 'Not Set'
                },
                'water': {
                    'monthly_data': water_data,
                    'months': ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][-len(water_data):],
                    'provider': water_provider.name if water_provider else 'Not Set'
                }
            }
            return jsonify(data)
            
        except Exception as e:
            print(f"Utilities API error: {str(e)}")
            import traceback
            traceback.print_exc()
    
    # Fallback to empty data
    data = {
        'electricity': {
            'monthly_data': [0],
            'months': ['No Data'],
            'provider': 'Not Set',
            'tariff': {
                'slab1': 3.00,
                'slab2': 4.50,
                'slab3': 6.50
            }
        },
        'gas': {
            'monthly_data': [0],
            'months': ['No Data'],
            'provider': 'Not Set'
        },
        'water': {
            'monthly_data': [0],
            'months': ['No Data'],
            'provider': 'Not Set'
        }
    }
    return jsonify(data)

@app.route('/api/insights')
def api_insights():
    """Get insights data calculated from user's consumption"""
    user_id = session.get('user_id')
    
    # For demo, use first user if not logged in
    if not user_id:
        demo_user = User.query.first()
        if demo_user:
            user_id = demo_user.id
    
    if not user_id:
        return jsonify({
            'efficiency': {'electricity': 'unknown', 'gas': 'unknown', 'water': 'unknown'},
            'comparisons': {'ward_avg': 0, 'user_avg': 0},
            'profile': {
                'electricity': {'score': 0, 'avgMonthly': 0, 'trend': 'stable'},
                'water': {'score': 0, 'avgMonthly': 0, 'trend': 'stable'},
                'gas': {'score': 0, 'avgMonthly': 0, 'trend': 'stable'}
            },
            'recommendations': {'electricity': {'savings': 0}}
        })
    
    try:
        user = User.query.get(user_id)
        
        # Calculate electricity insights
        elec_bills = Bill.query.filter_by(user_id=user_id, utility_type='electricity').order_by(Bill.created_at.desc()).limit(6).all()
        elec_avg = sum(b.consumption for b in elec_bills) / len(elec_bills) if elec_bills else 0
        if not elec_bills or elec_avg == 0:
            elec_efficiency = 'unknown'
            elec_score = 0
        else:
            elec_efficiency = 'efficient' if elec_avg < 200 else 'average' if elec_avg < 300 else 'high'
            elec_score = max(0, min(10, 10 - (elec_avg / 30)))  # Score out of 10
        
        # Determine trend (comparing first 3 vs last 3 bills)
        if len(elec_bills) >= 3:
            recent_avg = sum(b.consumption for b in elec_bills[:3]) / 3
            older_avg = sum(b.consumption for b in elec_bills[3:6]) / len(elec_bills[3:6]) if len(elec_bills) > 3 else recent_avg
            elec_trend = 'improving' if recent_avg < older_avg else 'warning' if recent_avg > older_avg else 'stable'
        else:
            elec_trend = 'stable'
        
        # Calculate water insights
        water_bills = Bill.query.filter_by(user_id=user_id, utility_type='water').order_by(Bill.created_at.desc()).limit(6).all()
        water_avg = sum(b.consumption for b in water_bills) / len(water_bills) if water_bills else 0
        if not water_bills or water_avg == 0:
            water_efficiency = 'unknown'
            water_score = 0
        else:
            water_efficiency = 'efficient' if water_avg < 15 else 'average' if water_avg < 25 else 'high'
            water_score = max(0, min(10, 10 - (water_avg / 3)))  # Score out of 10
        
        if len(water_bills) >= 3:
            recent_avg = sum(b.consumption for b in water_bills[:3]) / 3
            older_avg = sum(b.consumption for b in water_bills[3:6]) / len(water_bills[3:6]) if len(water_bills) > 3 else recent_avg
            water_trend = 'improving' if recent_avg < older_avg else 'warning' if recent_avg > older_avg else 'stable'
        else:
            water_trend = 'stable'
        
        # Calculate gas insights
        gas_bills = Bill.query.filter_by(user_id=user_id, utility_type='gas').order_by(Bill.created_at.desc()).limit(6).all()
        gas_avg = sum(b.consumption for b in gas_bills) / len(gas_bills) if gas_bills else 0
        if not gas_bills or gas_avg == 0:
            gas_efficiency = 'unknown'
            gas_score = 0
        else:
            gas_efficiency = 'efficient' if gas_avg < 20 else 'average' if gas_avg < 30 else 'high'
            gas_score = max(0, min(10, 10 - (gas_avg / 4)))  # Score out of 10
        
        if len(gas_bills) >= 3:
            recent_avg = sum(b.consumption for b in gas_bills[:3]) / 3
            older_avg = sum(b.consumption for b in gas_bills[3:6]) / len(gas_bills[3:6]) if len(gas_bills) > 3 else recent_avg
            gas_trend = 'improving' if recent_avg < older_avg else 'warning' if recent_avg > older_avg else 'stable'
        else:
            gas_trend = 'stable'
        
        # Calculate ward average (from all users in same ward)
        ward_bills = db.session.query(Bill).join(User).filter(
            User.ward == user.ward,
            Bill.utility_type == 'electricity'
        ).all()
        ward_avg = sum(b.consumption for b in ward_bills) / len(ward_bills) if ward_bills else 0
        
        # Calculate potential savings
        if elec_avg > 200:
            potential_savings = (elec_avg - 200) * 5 * 12  # Assuming ₹5 per unit saved over a year
        else:
            potential_savings = 0
        
        data = {
            'efficiency': {
                'electricity': elec_efficiency,
                'gas': gas_efficiency,
                'water': water_efficiency
            },
            'comparisons': {
                'ward_avg': round(ward_avg, 1),
                'user_avg': round(elec_avg, 1)
            },
            'profile': {
                'electricity': {
                    'score': round(elec_score, 1),
                    'avgMonthly': round(elec_avg, 1),
                    'trend': elec_trend
                },
                'water': {
                    'score': round(water_score, 1),
                    'avgMonthly': round(water_avg, 1),
                    'trend': water_trend
                },
                'gas': {
                    'score': round(gas_score, 1),
                    'avgMonthly': round(gas_avg, 1),
                    'trend': gas_trend
                }
            },
            'recommendations': {
                'electricity': {
                    'savings': round(potential_savings, 0)
                }
            }
        }
        return jsonify(data)
        
    except Exception as e:
        print(f"Insights API error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'efficiency': {'electricity': 'unknown', 'gas': 'unknown', 'water': 'unknown'},
            'comparisons': {'ward_avg': 0, 'user_avg': 0},
            'profile': {
                'electricity': {'score': 0, 'avgMonthly': 0, 'trend': 'stable'},
                'water': {'score': 0, 'avgMonthly': 0, 'trend': 'stable'},
                'gas': {'score': 0, 'avgMonthly': 0, 'trend': 'stable'}
            },
            'recommendations': {'electricity': {'savings': 0}}
        })

@app.route('/api/records')
def api_records():
    """Get billing records from database"""
    user_id = session.get('user_id')
    
    # For demo, get first user if not logged in
    if not user_id:
        demo_user = User.query.first()
        if demo_user:
            user_id = demo_user.id
    
    if user_id:
        try:
            # Get all bills for the user
            bills = Bill.query.filter_by(user_id=user_id).order_by(Bill.created_at.desc()).limit(50).all()
            
            bills_data = []
            for bill in bills:
                bills_data.append({
                    'date': bill.created_at.strftime('%b %d, %Y'),
                    'utility': bill.utility_type,
                    'bill_id': bill.bill_id,
                    'reading': f'{bill.consumption} {bill.consumption_unit}',
                    'amount': f'₹ {bill.amount:,.0f}',
                    'status': bill.status
                })
            
            return jsonify({'bills': bills_data})
            
        except Exception as e:
            print(f"Records API error: {str(e)}")
            import traceback
            traceback.print_exc()
    
    # Fallback to empty data
    return jsonify({'bills': []})

@app.route('/api/community')
def api_community():
    """Get community data from database"""
    user_id = session.get('user_id')
    
    # For demo, use first user if not logged in
    if not user_id:
        demo_user = User.query.first()
        if demo_user:
            user_id = demo_user.id
    
    if not user_id:
        return jsonify({
            'ward': 'Unknown',
            'health_score': 0,
            'stress_map': [0, 0, 0, 0],
            'active_participants': 0,
            'recent_reports': 0
        })
    
    try:
        user = User.query.get(user_id)
        
        # Get community stats for this ward
        ward_stats = CommunityStats.query.filter_by(
            ward=user.ward,
            city=user.city
        ).first()
        
        # Calculate health score based on available data
        if ward_stats:
            # Health score calculation (0-100)
            # Based on: active participation, low stress levels, member engagement
            stress_weights = {
                'low': 100,
                'medium': 60,
                'high': 20
            }
            elec_score = stress_weights.get(ward_stats.electricity_stress_level, 60)
            water_score = stress_weights.get(ward_stats.water_stress_level, 60)
            gas_score = stress_weights.get(ward_stats.gas_stress_level, 60)
            
            # Average the scores
            health_score = round((elec_score + water_score + gas_score) / 3)
            
            # Stress map (numeric representation for charts)
            stress_map = [
                stress_weights.get(ward_stats.electricity_stress_level, 60),
                stress_weights.get(ward_stats.water_stress_level, 60),
                stress_weights.get(ward_stats.gas_stress_level, 60),
                health_score
            ]
            
            active_participants = ward_stats.active_members
        else:
            health_score = 0
            stress_map = [0, 0, 0, 0]
            active_participants = 0
        
        # Get recent reports count for this ward (last 7 days)
        from datetime import timedelta
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        recent_reports = db.session.query(ServiceReport).join(User).filter(
            User.ward == user.ward,
            ServiceReport.created_at >= seven_days_ago
        ).count()
        
        data = {
            'ward': user.ward,
            'health_score': health_score,
            'stress_map': stress_map,
            'active_participants': active_participants,
            'recent_reports': recent_reports
        }
        return jsonify(data)
        
    except Exception as e:
        print(f"Community API error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'ward': 'Unknown',
            'health_score': 0,
            'stress_map': [0, 0, 0, 0],
            'active_participants': 0,
            'recent_reports': 0
        })

@app.route('/api/profile')
def api_profile():
    """Get user profile from database"""
    user_id = session.get('user_id')
    
    # For demo, use first user if not logged in
    if not user_id:
        demo_user = User.query.first()
        if demo_user:
            user_id = demo_user.id
    
    if not user_id:
        return jsonify({
            'name': 'Guest User',
            'phone': 'N/A',
            'address': 'N/A',
            'email': 'N/A'
        })
    
    try:
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        # Construct full address
        address = f"{user.locality}, {user.ward}, {user.city}, {user.state}"
        
        data = {
            'name': user.full_name,
            'phone': user.phone,
            'address': address,
            'email': user.email,
            'state': user.state,
            'city': user.city,
            'ward': user.ward,
            'locality': user.locality,
            'alerts_enabled': user.alerts_enabled,
            'preferred_language': user.preferred_language
        }
        return jsonify(data)
        
    except Exception as e:
        print(f"Profile API error: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/services/submit', methods=['POST'])
def api_submit_service():
    """Submit a new service request"""
    user_id = session.get('user_id')
    
    # For demo, use first user if not logged in
    if not user_id:
        demo_user = User.query.first()
        if demo_user:
            user_id = demo_user.id
        else:
            return jsonify({'success': False, 'message': 'No user found'}), 400
    
    try:
        data = request.get_json()
        
        # Create service report
        report = ServiceReport(
            user_id=user_id,
            report_type=data.get('report_type', 'general'),
            utility_type=data.get('utility_type', 'general'),
            title=data.get('title', 'Service Request'),
            description=data.get('description', ''),
            status='open',
            priority=data.get('priority', 'medium'),
            location=data.get('location', '')
        )
        db.session.add(report)
        
        # Update community report count
        community = Community.query.filter_by(user_id=user_id).first()
        if community:
            community.reports_submitted += 1
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Service request submitted successfully',
            'request_id': report.id
        })
        
    except Exception as e:
        db.session.rollback()
        print(f"Service submit error: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500


# ============================================
# BILL MANAGEMENT ENDPOINTS
# ============================================
@app.route('/api/bills/add', methods=['POST'])
def api_add_bill():
    """Add a new bill (for testing/demo purposes)"""
    user_id = session.get('user_id')
    
    # For demo, use first user if not logged in
    if not user_id:
        demo_user = User.query.first()
        if demo_user:
            user_id = demo_user.id
        else:
            return jsonify({'success': False, 'message': 'No user found'}), 400
    
    try:
        data = request.get_json()
        
        bill = Bill(
            user_id=user_id,
            utility_type=data['utility_type'],
            bill_id=data.get('bill_id', f'{data["utility_type"].upper()}-{datetime.now().strftime("%Y%m%d")}'),
            amount=float(data['amount']),
            consumption=float(data['consumption']),
            consumption_unit=data['consumption_unit'],
            billing_period_start=datetime.strptime(data['billing_period_start'], '%Y-%m-%d') if 'billing_period_start' in data else datetime.now() - timedelta(days=30),
            billing_period_end=datetime.strptime(data['billing_period_end'], '%Y-%m-%d') if 'billing_period_end' in data else datetime.now(),
            due_date=datetime.strptime(data['due_date'], '%Y-%m-%d') if 'due_date' in data else datetime.now() + timedelta(days=15),
            status=data.get('status', 'pending')
        )
        
        db.session.add(bill)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Bill added successfully',
            'bill': bill.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Add bill error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/api/bills', methods=['GET'])
def api_get_bills():
    """Get all bills for current user"""
    user_id = session.get('user_id')
    
    # For demo, use first user if not logged in
    if not user_id:
        demo_user = User.query.first()
        if demo_user:
            user_id = demo_user.id
    
    if user_id:
        try:
            utility_type = request.args.get('utility_type')
            
            query = Bill.query.filter_by(user_id=user_id)
            if utility_type:
                query = query.filter_by(utility_type=utility_type)
            
            bills = query.order_by(Bill.created_at.desc()).all()
            
            return jsonify({
                'success': True,
                'bills': [bill.to_dict() for bill in bills]
            })
        except Exception as e:
            return jsonify({'success': False, 'message': str(e)}), 500
    
    return jsonify({'success': False, 'message': 'No user found'}), 400


# ============================================
# FIELD AGENT ENDPOINTS (Government Official Worker)
# ============================================

@app.route('/api/field-agents', methods=['GET'])
def api_get_field_agents():
    """Get all field agents with optional filters"""
    try:
        category = request.args.get('category')
        status = request.args.get('status')
        ward = request.args.get('ward')
        supervisor_id = request.args.get('supervisor_id')
        
        query = FieldAgent.query
        
        if category:
            query = query.filter_by(category=category)
        if status:
            query = query.filter_by(status=status)
        if ward:
            query = query.filter_by(assigned_ward=ward)
        if supervisor_id:
            query = query.filter_by(supervisor_id=supervisor_id)
        
        agents = query.filter_by(is_active=True).order_by(FieldAgent.full_name).all()
        
        return jsonify({
            'success': True,
            'agents': [agent.to_dict() for agent in agents],
            'count': len(agents)
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/api/field-agents/<agent_id>', methods=['GET'])
def api_get_field_agent(agent_id):
    """Get specific field agent by ID"""
    try:
        agent = FieldAgent.query.get(agent_id)
        if not agent:
            return jsonify({'success': False, 'message': 'Agent not found'}), 404
        
        # Also get recent tasks and performance
        recent_tasks = TaskAssignment.query.filter_by(agent_id=agent_id)\
            .order_by(TaskAssignment.assigned_at.desc()).limit(10).all()
        
        current_month = datetime.now().month
        current_year = datetime.now().year
        performance = AgentPerformance.query.filter_by(
            agent_id=agent_id, month=current_month, year=current_year
        ).first()
        
        return jsonify({
            'success': True,
            'agent': agent.to_dict(),
            'recent_tasks': [t.to_dict() for t in recent_tasks],
            'current_performance': performance.to_dict() if performance else None
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/api/field-agents', methods=['POST'])
def api_create_field_agent():
    """Create a new field agent"""
    try:
        data = request.get_json()
        
        # Generate employee ID
        count = FieldAgent.query.count() + 1
        employee_id = f"FA-{datetime.now().year}-{count:05d}"
        
        agent = FieldAgent(
            employee_id=employee_id,
            full_name=data['full_name'],
            email=data['email'],
            phone=data['phone'],
            password=generate_password_hash(data.get('password', 'temp123')),
            category=data['category'],
            supervisor_id=data.get('supervisor_id'),
            assigned_state=data.get('assigned_state', 'Delhi'),
            assigned_district=data.get('assigned_district', 'South Delhi'),
            assigned_ward=data.get('assigned_ward'),
            status='offline',
            gps_enabled=data.get('gps_enabled', False),
            performance_score=50.0
        )
        
        db.session.add(agent)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Field agent created successfully',
            'agent': agent.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/api/field-agents/<agent_id>', methods=['PUT'])
def api_update_field_agent(agent_id):
    """Update field agent details"""
    try:
        agent = FieldAgent.query.get(agent_id)
        if not agent:
            return jsonify({'success': False, 'message': 'Agent not found'}), 404
        
        data = request.get_json()
        
        # Update allowed fields
        if 'full_name' in data:
            agent.full_name = data['full_name']
        if 'phone' in data:
            agent.phone = data['phone']
        if 'category' in data:
            agent.category = data['category']
        if 'supervisor_id' in data:
            agent.supervisor_id = data['supervisor_id']
        if 'assigned_ward' in data:
            agent.assigned_ward = data['assigned_ward']
        if 'assigned_district' in data:
            agent.assigned_district = data['assigned_district']
        if 'status' in data:
            agent.status = data['status']
        if 'gps_enabled' in data:
            agent.gps_enabled = data['gps_enabled']
        if 'is_active' in data:
            agent.is_active = data['is_active']
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Agent updated successfully',
            'agent': agent.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/api/field-agents/<agent_id>/location', methods=['POST'])
def api_update_agent_location(agent_id):
    """Update agent location (GPS tracking)"""
    try:
        agent = FieldAgent.query.get(agent_id)
        if not agent:
            return jsonify({'success': False, 'message': 'Agent not found'}), 404
        
        data = request.get_json()
        
        # Update current location on agent
        agent.current_latitude = data['latitude']
        agent.current_longitude = data['longitude']
        agent.current_address = data.get('address')
        agent.location_updated_at = datetime.utcnow()
        
        # Log to history
        location_log = AgentLocationHistory(
            agent_id=agent_id,
            latitude=data['latitude'],
            longitude=data['longitude'],
            address=data.get('address'),
            accuracy=data.get('accuracy'),
            activity=data.get('activity', 'traveling'),
            task_id=data.get('task_id')
        )
        
        db.session.add(location_log)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Location updated'
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/api/field-agents/<agent_id>/status', methods=['PUT'])
def api_update_agent_status(agent_id):
    """Update agent status (online, on_task, offline, break)"""
    try:
        agent = FieldAgent.query.get(agent_id)
        if not agent:
            return jsonify({'success': False, 'message': 'Agent not found'}), 404
        
        data = request.get_json()
        agent.status = data['status']
        
        if data['status'] == 'online':
            agent.last_login = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Status updated',
            'agent': agent.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


# ============================================
# TASK ASSIGNMENT ENDPOINTS
# ============================================

@app.route('/api/tasks', methods=['GET'])
def api_get_tasks():
    """Get tasks with optional filters"""
    try:
        agent_id = request.args.get('agent_id')
        status = request.args.get('status')
        task_type = request.args.get('task_type')
        ward = request.args.get('ward')
        date = request.args.get('date')  # YYYY-MM-DD format
        
        query = TaskAssignment.query
        
        if agent_id:
            query = query.filter_by(agent_id=agent_id)
        if status:
            query = query.filter_by(status=status)
        if task_type:
            query = query.filter_by(task_type=task_type)
        if ward:
            query = query.filter_by(ward=ward)
        if date:
            date_obj = datetime.strptime(date, '%Y-%m-%d')
            query = query.filter(
                TaskAssignment.assigned_at >= date_obj,
                TaskAssignment.assigned_at < date_obj + timedelta(days=1)
            )
        
        tasks = query.order_by(TaskAssignment.assigned_at.desc()).all()
        
        return jsonify({
            'success': True,
            'tasks': [task.to_dict() for task in tasks],
            'count': len(tasks)
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/api/tasks/<task_id>', methods=['GET'])
def api_get_task(task_id):
    """Get specific task details"""
    try:
        task = TaskAssignment.query.filter(
            (TaskAssignment.id == task_id) | (TaskAssignment.task_id == task_id)
        ).first()
        
        if not task:
            return jsonify({'success': False, 'message': 'Task not found'}), 404
        
        # Include agent details
        agent = FieldAgent.query.get(task.agent_id)
        
        return jsonify({
            'success': True,
            'task': task.to_dict(),
            'agent': agent.to_dict() if agent else None
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/api/tasks', methods=['POST'])
def api_create_task():
    """Create a new task assignment"""
    try:
        data = request.get_json()
        
        # Generate task ID
        today = datetime.now().strftime('%Y%m%d')
        count = TaskAssignment.query.filter(
            TaskAssignment.task_id.like(f'TASK-{today}%')
        ).count() + 1
        task_id = f"TASK-{today}-{count:05d}"
        
        task = TaskAssignment(
            task_id=task_id,
            agent_id=data['agent_id'],
            assigned_by=data['assigned_by'],
            task_type=data['task_type'],
            house_number=data['house_number'],
            ward=data['ward'],
            city=data.get('city', 'Delhi'),
            full_address=data.get('full_address'),
            latitude=data.get('latitude'),
            longitude=data.get('longitude'),
            description=data.get('description'),
            priority=data.get('priority', 'normal'),
            meter_id=data.get('meter_id')
        )
        
        db.session.add(task)
        
        # Update agent status
        agent = FieldAgent.query.get(data['agent_id'])
        if agent:
            agent.status = 'on_task'
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Task assigned successfully',
            'task': task.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/api/tasks/<task_id>/status', methods=['PUT'])
def api_update_task_status(task_id):
    """Update task status"""
    try:
        task = TaskAssignment.query.filter(
            (TaskAssignment.id == task_id) | (TaskAssignment.task_id == task_id)
        ).first()
        
        if not task:
            return jsonify({'success': False, 'message': 'Task not found'}), 404
        
        data = request.get_json()
        old_status = task.status
        task.status = data['status']
        
        # Update timestamps based on status
        if data['status'] == 'in_progress' and not task.started_at:
            task.started_at = datetime.utcnow()
        elif data['status'] == 'completed':
            task.completed_at = datetime.utcnow()
            if task.started_at:
                task.completion_time_minutes = int((task.completed_at - task.started_at).total_seconds() / 60)
            
            # Update agent metrics
            agent = FieldAgent.query.get(task.agent_id)
            if agent:
                agent.tasks_completed_today += 1
                agent.total_tasks_completed += 1
                agent.status = 'online'
        
        # Handle additional data
        if 'meter_reading' in data:
            task.meter_reading = data['meter_reading']
        if 'photo_url' in data:
            task.photo_url = data['photo_url']
            task.photos_added = True
        if 'problem_raised' in data:
            task.problem_raised = data['problem_raised']
            task.problem_type = data.get('problem_type')
            task.problem_description = data.get('problem_description')
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Task status updated',
            'task': task.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/api/tasks/bulk-assign', methods=['POST'])
def api_bulk_assign_tasks():
    """Bulk assign tasks to an agent"""
    try:
        data = request.get_json()
        agent_id = data['agent_id']
        assigned_by = data['assigned_by']
        households = data['households']  # List of house details
        
        today = datetime.now().strftime('%Y%m%d')
        tasks_created = []
        
        for i, house in enumerate(households):
            count = TaskAssignment.query.filter(
                TaskAssignment.task_id.like(f'TASK-{today}%')
            ).count() + 1
            task_id = f"TASK-{today}-{count:05d}"
            
            task = TaskAssignment(
                task_id=task_id,
                agent_id=agent_id,
                assigned_by=assigned_by,
                task_type=data.get('task_type', 'electric_meter'),
                house_number=house['house_number'],
                ward=house.get('ward', data.get('ward')),
                city=house.get('city', 'Delhi'),
                full_address=house.get('full_address'),
                priority=house.get('priority', 'normal')
            )
            db.session.add(task)
            tasks_created.append(task)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'{len(tasks_created)} tasks assigned successfully',
            'tasks': [t.to_dict() for t in tasks_created]
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


# ============================================
# AGENT PERFORMANCE ENDPOINTS
# ============================================

@app.route('/api/field-agents/<agent_id>/performance', methods=['GET'])
def api_get_agent_performance(agent_id):
    """Get agent performance history"""
    try:
        year = request.args.get('year', datetime.now().year)
        
        performance = AgentPerformance.query.filter_by(
            agent_id=agent_id, year=int(year)
        ).order_by(AgentPerformance.month.desc()).all()
        
        return jsonify({
            'success': True,
            'performance': [p.to_dict() for p in performance]
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/api/field-agents/<agent_id>/performance', methods=['POST'])
def api_calculate_agent_performance(agent_id):
    """Calculate/update agent performance for current month"""
    try:
        agent = FieldAgent.query.get(agent_id)
        if not agent:
            return jsonify({'success': False, 'message': 'Agent not found'}), 404
        
        current_month = datetime.now().month
        current_year = datetime.now().year
        
        # Calculate metrics from tasks
        month_start = datetime(current_year, current_month, 1)
        month_tasks = TaskAssignment.query.filter(
            TaskAssignment.agent_id == agent_id,
            TaskAssignment.assigned_at >= month_start
        ).all()
        
        tasks_assigned = len(month_tasks)
        tasks_completed = len([t for t in month_tasks if t.status == 'completed'])
        tasks_failed = len([t for t in month_tasks if t.status == 'failed'])
        completion_rate = (tasks_completed / tasks_assigned * 100) if tasks_assigned > 0 else 0
        
        completed_tasks = [t for t in month_tasks if t.completion_time_minutes]
        avg_completion_time = sum(t.completion_time_minutes for t in completed_tasks) / len(completed_tasks) if completed_tasks else 0
        
        problems_flagged = len([t for t in month_tasks if t.problem_raised])
        photos_uploaded = len([t for t in month_tasks if t.photos_added])
        photo_compliance_rate = (photos_uploaded / tasks_completed * 100) if tasks_completed > 0 else 0
        
        # Calculate AI score (simple formula for now)
        score = min(100, max(0, 
            completion_rate * 0.4 +
            (100 - min(100, avg_completion_time / 30 * 100)) * 0.2 +  # Faster is better
            photo_compliance_rate * 0.2 +
            (100 - problems_flagged / max(1, tasks_completed) * 100) * 0.2
        ))
        
        # Determine rating
        if score >= 90:
            rating = 'excellent'
        elif score >= 70:
            rating = 'good'
        elif score >= 50:
            rating = 'average'
        else:
            rating = 'poor'
        
        # Get or create performance record
        performance = AgentPerformance.query.filter_by(
            agent_id=agent_id, month=current_month, year=current_year
        ).first()
        
        if not performance:
            # Get previous month score for change calculation
            prev_month = current_month - 1 if current_month > 1 else 12
            prev_year = current_year if current_month > 1 else current_year - 1
            prev_performance = AgentPerformance.query.filter_by(
                agent_id=agent_id, month=prev_month, year=prev_year
            ).first()
            score_change = score - (prev_performance.score if prev_performance else 50)
            
            performance = AgentPerformance(
                agent_id=agent_id,
                month=current_month,
                year=current_year
            )
            db.session.add(performance)
        else:
            score_change = score - performance.score
        
        # Update performance record
        performance.tasks_assigned = tasks_assigned
        performance.tasks_completed = tasks_completed
        performance.tasks_failed = tasks_failed
        performance.completion_rate = completion_rate
        performance.avg_completion_time = avg_completion_time
        performance.problems_flagged = problems_flagged
        performance.photos_uploaded = photos_uploaded
        performance.photo_compliance_rate = photo_compliance_rate
        performance.score = score
        performance.rating = rating
        performance.score_change = score_change
        performance.calculated_at = datetime.utcnow()
        
        # Update agent's current score
        agent.performance_score = score
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'performance': performance.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


# ============================================
# DASHBOARD STATISTICS ENDPOINTS
# ============================================

@app.route('/api/admin/field-stats', methods=['GET'])
def api_get_field_stats():
    """Get field operations statistics for admin dashboard"""
    try:
        # Agent counts by status
        online_agents = FieldAgent.query.filter_by(status='online', is_active=True).count()
        on_task_agents = FieldAgent.query.filter_by(status='on_task', is_active=True).count()
        offline_agents = FieldAgent.query.filter_by(status='offline', is_active=True).count()
        total_agents = FieldAgent.query.filter_by(is_active=True).count()
        
        # Agent counts by category
        category_counts = {}
        for category in ['electric_meter', 'water_meter', 'gas_cylinder', 'rwa_work']:
            category_counts[category] = FieldAgent.query.filter_by(category=category, is_active=True).count()
        
        # Today's task stats
        today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        today_tasks = TaskAssignment.query.filter(TaskAssignment.assigned_at >= today_start).all()
        
        tasks_pending = len([t for t in today_tasks if t.status == 'pending'])
        tasks_in_progress = len([t for t in today_tasks if t.status == 'in_progress'])
        tasks_completed = len([t for t in today_tasks if t.status == 'completed'])
        problems_raised = len([t for t in today_tasks if t.problem_raised])
        
        # Top performing agents
        top_agents = FieldAgent.query.filter_by(is_active=True)\
            .order_by(FieldAgent.performance_score.desc()).limit(5).all()
        
        return jsonify({
            'success': True,
            'stats': {
                'agents': {
                    'total': total_agents,
                    'online': online_agents,
                    'on_task': on_task_agents,
                    'offline': offline_agents,
                    'by_category': category_counts
                },
                'tasks_today': {
                    'total': len(today_tasks),
                    'pending': tasks_pending,
                    'in_progress': tasks_in_progress,
                    'completed': tasks_completed,
                    'problems_raised': problems_raised,
                    'completion_rate': (tasks_completed / len(today_tasks) * 100) if today_tasks else 0
                },
                'top_agents': [a.to_dict() for a in top_agents]
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/api/worker/dashboard', methods=['GET'])
def api_get_worker_dashboard():
    """Get dashboard data for field worker"""
    try:
        agent_id = request.args.get('agent_id')
        
        if not agent_id:
            return jsonify({'success': False, 'message': 'Agent ID required'}), 400
        
        agent = FieldAgent.query.get(agent_id)
        if not agent:
            return jsonify({'success': False, 'message': 'Agent not found'}), 404
        
        # Today's stats
        today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        today_tasks = TaskAssignment.query.filter(
            TaskAssignment.agent_id == agent_id,
            TaskAssignment.assigned_at >= today_start
        ).all()
        
        pending = [t for t in today_tasks if t.status == 'pending']
        in_progress = [t for t in today_tasks if t.status == 'in_progress']
        completed = [t for t in today_tasks if t.status == 'completed']
        
        # Current performance
        current_month = datetime.now().month
        current_year = datetime.now().year
        performance = AgentPerformance.query.filter_by(
            agent_id=agent_id, month=current_month, year=current_year
        ).first()
        
        return jsonify({
            'success': True,
            'agent': agent.to_dict(),
            'today': {
                'total_tasks': len(today_tasks),
                'pending': len(pending),
                'in_progress': len(in_progress),
                'completed': len(completed),
                'pending_tasks': [t.to_dict() for t in pending],
                'current_task': in_progress[0].to_dict() if in_progress else None
            },
            'performance': performance.to_dict() if performance else {
                'score': agent.performance_score,
                'rating': 'average'
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


# ============================================
# WORKER AUTHENTICATION
# ============================================

@app.route('/api/worker/login', methods=['POST'])
def api_worker_login():
    """Field agent login"""
    try:
        data = request.get_json()
        
        agent = FieldAgent.query.filter_by(email=data['email']).first()
        
        if not agent or not check_password_hash(agent.password, data['password']):
            return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
        
        if not agent.is_active:
            return jsonify({'success': False, 'message': 'Account is deactivated'}), 403
        
        # Update login time and status
        agent.last_login = datetime.utcnow()
        agent.status = 'online'
        db.session.commit()
        
        session['agent_id'] = agent.id
        
        return jsonify({
            'success': True,
            'message': 'Login successful',
            'agent': agent.to_dict()
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/api/worker/logout', methods=['POST'])
def api_worker_logout():
    """Field agent logout"""
    try:
        agent_id = session.get('agent_id')
        if agent_id:
            agent = FieldAgent.query.get(agent_id)
            if agent:
                agent.status = 'offline'
                db.session.commit()
        
        session.pop('agent_id', None)
        
        return jsonify({'success': True, 'message': 'Logged out successfully'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


# ============================================
# HOUSEHOLD API ENDPOINTS
# ============================================
@app.route('/api/households', methods=['GET'])
def api_get_households():
    """Get households with optional filtering by area"""
    try:
        ward = request.args.get('ward')
        district = request.args.get('district')
        state = request.args.get('state')
        meter_type = request.args.get('meter_type')
        
        query = Household.query
        
        if ward:
            query = query.filter(Household.ward.ilike(f'%{ward}%'))
        if district:
            query = query.filter(Household.district.ilike(f'%{district}%'))
        if state:
            query = query.filter(Household.state.ilike(f'%{state}%'))
        if meter_type:
            query = query.filter(Household.meter_type == meter_type)
        
        households = query.order_by(Household.house_number).all()
        
        return jsonify({
            'success': True,
            'households': [h.to_dict() for h in households],
            'total': len(households)
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/api/households', methods=['POST'])
def api_create_household():
    """Create a new household"""
    try:
        data = request.get_json()
        
        household = Household(
            house_number=data['house_number'],
            ward=data['ward'],
            district=data['district'],
            state=data['state'],
            locality=data.get('locality'),
            full_address=data['full_address'],
            block=data.get('block'),
            sector=data.get('sector'),
            latitude=data.get('latitude'),
            longitude=data.get('longitude'),
            resident_name=data['resident_name'],
            contact_phone=data.get('contact_phone'),
            num_residents=data.get('num_residents', 1),
            resident_category=data.get('resident_category', 'general'),
            meter_id=data.get('meter_id'),
            meter_type=data.get('meter_type', 'electric')
        )
        
        db.session.add(household)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Household created successfully',
            'household': household.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/api/households/<household_id>', methods=['GET'])
def api_get_household(household_id):
    """Get a specific household"""
    try:
        household = Household.query.get(household_id)
        if not household:
            return jsonify({'success': False, 'message': 'Household not found'}), 404
        
        # Get recent submissions for this household
        submissions = MeterSubmission.query.filter_by(household_id=household_id)\
            .order_by(MeterSubmission.submitted_at.desc()).limit(5).all()
        
        return jsonify({
            'success': True,
            'household': household.to_dict(),
            'recent_submissions': [s.to_dict() for s in submissions]
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


# ============================================
# METER SUBMISSION API ENDPOINTS
# ============================================
@app.route('/api/submissions', methods=['GET'])
def api_get_submissions():
    """Get submissions with optional filtering"""
    try:
        agent_id = request.args.get('agent_id')
        task_id = request.args.get('task_id')
        date = request.args.get('date')
        status = request.args.get('status')
        
        query = MeterSubmission.query
        
        if agent_id:
            query = query.filter(MeterSubmission.agent_id == agent_id)
        if task_id:
            query = query.filter(MeterSubmission.task_id == task_id)
        if status:
            query = query.filter(MeterSubmission.status == status)
        if date:
            date_obj = datetime.strptime(date, '%Y-%m-%d')
            query = query.filter(db.func.date(MeterSubmission.submitted_at) == date_obj.date())
        
        submissions = query.order_by(MeterSubmission.submitted_at.desc()).all()
        
        return jsonify({
            'success': True,
            'submissions': [s.to_dict() for s in submissions],
            'total': len(submissions)
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/api/submissions', methods=['POST'])
def api_create_submission():
    """Create a meter reading submission with photo"""
    try:
        data = request.get_json()
        
        # Generate submission ID
        submission_id = f"SUB-{datetime.utcnow().strftime('%Y%m%d')}-{secrets.token_hex(4).upper()}"
        
        submission = MeterSubmission(
            submission_id=submission_id,
            task_id=data.get('task_id'),
            agent_id=data['agent_id'],
            household_id=data.get('household_id'),
            meter_reading=data.get('meter_reading'),
            meter_type=data.get('meter_type', 'electric'),
            reading_unit=data.get('reading_unit', 'kWh'),
            photo_data=data.get('photo_data'),  # Base64 encoded image
            photo_filename=data.get('photo_filename'),
            photo_captured_at=datetime.utcnow() if data.get('photo_data') else None,
            latitude=data.get('latitude'),
            longitude=data.get('longitude'),
            address=data.get('address'),
            status='submitted',
            submission_type=data.get('submission_type', 'reading'),
            skip_reason=data.get('skip_reason')
        )
        
        db.session.add(submission)
        
        # Update task status if task_id provided
        if data.get('task_id'):
            task = TaskAssignment.query.filter(
                (TaskAssignment.id == data['task_id']) | (TaskAssignment.task_id == data['task_id'])
            ).first()
            if task:
                if data.get('submission_type') == 'skip':
                    task.status = 'skipped'
                    task.problem_raised = True
                    task.problem_description = data.get('skip_reason')
                else:
                    task.status = 'completed'
                    task.completed_at = datetime.utcnow()
                    task.meter_reading = data.get('meter_reading')
                    task.photo_url = f"submission:{submission_id}"
                    task.photos_added = True
                    
                    if task.started_at:
                        task.completion_time_minutes = int((datetime.utcnow() - task.started_at).total_seconds() / 60)
                
                # Update agent metrics
                agent = FieldAgent.query.get(data['agent_id'])
                if agent and data.get('submission_type') != 'skip':
                    agent.tasks_completed_today += 1
                    agent.total_tasks_completed += 1
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Submission recorded successfully',
            'submission': submission.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/api/submissions/<submission_id>', methods=['GET'])
def api_get_submission(submission_id):
    """Get a specific submission with full details"""
    try:
        submission = MeterSubmission.query.filter(
            (MeterSubmission.id == submission_id) | (MeterSubmission.submission_id == submission_id)
        ).first()
        
        if not submission:
            return jsonify({'success': False, 'message': 'Submission not found'}), 404
        
        result = submission.to_dict()
        
        # Include task and household info
        if submission.task:
            result['task'] = submission.task.to_dict()
        if submission.household:
            result['household'] = submission.household.to_dict()
        if submission.agent:
            result['agent'] = {
                'id': submission.agent.id,
                'full_name': submission.agent.full_name,
                'employee_id': submission.agent.employee_id
            }
        
        return jsonify({
            'success': True,
            'submission': result
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/api/agent/<agent_id>/performance', methods=['GET'])
def api_get_agent_performance_detailed(agent_id):
    """Get detailed performance metrics with improvement tips"""
    try:
        agent = FieldAgent.query.get(agent_id)
        if not agent:
            return jsonify({'success': False, 'message': 'Agent not found'}), 404
        
        # Get current month performance
        current_month = datetime.utcnow().month
        current_year = datetime.utcnow().year
        
        perf = AgentPerformance.query.filter_by(
            agent_id=agent_id,
            month=current_month,
            year=current_year
        ).first()
        
        # Calculate improvement areas
        improvement_tips = []
        lagging_areas = []
        
        if perf:
            if perf.completion_rate < 90:
                lagging_areas.append({'area': 'Completion Rate', 'current': f'{perf.completion_rate:.1f}%', 'target': '90%'})
                improvement_tips.append('Complete more assigned tasks to improve your completion rate')
            if perf.on_time_rate < 85:
                lagging_areas.append({'area': 'On-Time Delivery', 'current': f'{perf.on_time_rate:.1f}%', 'target': '85%'})
                improvement_tips.append('Finish readings faster - use optimized routes')
            if perf.photo_compliance_rate < 95:
                lagging_areas.append({'area': 'Photo Upload Rate', 'current': f'{perf.photo_compliance_rate:.1f}%', 'target': '95%'})
                improvement_tips.append('Always upload clear photos of meter readings')
            if perf.avg_rating < 4.0:
                lagging_areas.append({'area': 'Customer Rating', 'current': f'{perf.avg_rating:.1f}/5', 'target': '4.0/5'})
                improvement_tips.append('Be courteous with residents for better ratings')
        else:
            # Default tips for new agents
            improvement_tips = [
                'Complete all assigned tasks daily',
                'Upload clear photos of every meter reading',
                'Follow the optimized route suggestions',
                'Report issues accurately when houses are inaccessible'
            ]
        
        return jsonify({
            'success': True,
            'agent': {
                'id': agent.id,
                'full_name': agent.full_name,
                'performance_score': agent.performance_score,
                'tasks_completed_today': agent.tasks_completed_today,
                'total_tasks_completed': agent.total_tasks_completed,
                'category': agent.category
            },
            'performance': perf.to_dict() if perf else None,
            'improvement_tips': improvement_tips,
            'lagging_areas': lagging_areas,
            'score_breakdown': {
                'completion_rate': perf.completion_rate if perf else 0,
                'on_time_rate': perf.on_time_rate if perf else 0,
                'photo_compliance': perf.photo_compliance_rate if perf else 0,
                'customer_rating': perf.avg_rating if perf else 0
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/api/agent/<agent_id>/tasks/today', methods=['GET'])
def api_get_agent_tasks_today(agent_id):
    """Get today's tasks for an agent with submission status"""
    try:
        today = datetime.utcnow().date()
        
        tasks = TaskAssignment.query.filter(
            TaskAssignment.agent_id == agent_id,
            db.func.date(TaskAssignment.assigned_at) == today
        ).order_by(TaskAssignment.assigned_at).all()
        
        # Get submissions for these tasks
        task_ids = [t.id for t in tasks]
        submissions = MeterSubmission.query.filter(
            MeterSubmission.task_id.in_(task_ids)
        ).all()
        
        submission_map = {s.task_id: s.to_dict() for s in submissions}
        
        result = []
        for task in tasks:
            task_dict = task.to_dict()
            task_dict['submission'] = submission_map.get(task.id)
            result.append(task_dict)
        
        # Calculate stats
        completed = len([t for t in tasks if t.status == 'completed'])
        pending = len([t for t in tasks if t.status == 'pending'])
        skipped = len([t for t in tasks if t.status == 'skipped' or t.status == 'failed'])
        
        return jsonify({
            'success': True,
            'tasks': result,
            'stats': {
                'assigned': len(tasks),
                'completed': completed,
                'pending': pending,
                'skipped': skipped,
                'completedPercent': round(completed / len(tasks) * 100) if tasks else 0,
                'pendingPercent': round(pending / len(tasks) * 100) if tasks else 0,
                'skippedPercent': round(skipped / len(tasks) * 100) if tasks else 0
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


# ============================================
# WASTE CLASSIFICATION WITH NYCKEL ML
# ============================================
@app.route('/api/waste/classify', methods=['POST'])
def classify_waste():
    """Classify waste type using Nyckel ML model"""
    try:
        # Nyckel is not available - return demo response
        return jsonify({
            'success': True,
            'message': 'Waste classification demo response',
            'wasteType': 'Organic Waste',
            'category': 'organic',
            'icon': 'leaf',
            'tips': [
                'Place in green bin for composting',
                'Drain liquids from food waste',
                'Wrap in newspaper if wet',
                'Do not include cooked food with meat'
            ],
            'points': 15,
            'bin_color': 'Green'
        }), 200
        
        # Map Nyckel classification to bin types
        waste_mapping = {
            'organic': {
                'wasteType': 'Organic Waste',
                'category': 'organic',
                'icon': 'leaf',
                'tips': [
                    'Place in green bin for composting',
                    'Drain liquids from food waste',
                    'Wrap in newspaper if wet',
                    'Do not include cooked food with meat'
                ],
                'points': 15,
                'bin_color': 'Green'
            },
            'plastic': {
                'wasteType': 'Plastic Waste',
                'category': 'dry',
                'icon': 'box',
                'tips': [
                    'Rinse plastic bottles before disposal',
                    'Place in blue bin for recycling',
                    'Remove caps and labels',
                    'Crush bottles to save space'
                ],
                'points': 20,
                'bin_color': 'Blue'
            },
            'glass': {
                'wasteType': 'Glass Waste',
                'category': 'hazardous',
                'icon': 'alert-circle',
                'tips': [
                    'Wrap glass carefully in newspaper',
                    'Place in separate container',
                    'Keep away from organic waste',
                    'Inform collection staff about glass'
                ],
                'points': 25,
                'bin_color': 'Red'
            },
            'paper': {
                'wasteType': 'Paper Waste',
                'category': 'dry',
                'icon': 'file-text',
                'tips': [
                    'Bundle paper together with twine',
                    'Place in blue recycling bin',
                    'Remove plastic coatings/laminates',
                    'Compress to save space'
                ],
                'points': 15,
                'bin_color': 'Blue'
            },
            'metal': {
                'wasteType': 'Metal Waste',
                'category': 'dry',
                'icon': 'box',
                'tips': [
                    'Remove any food residue from metal containers',
                    'Place metal cans in blue bin',
                    'Rinse containers thoroughly',
                    'Separate aluminum from steel if possible'
                ],
                'points': 20,
                'bin_color': 'Blue'
            },
            'electronics': {
                'wasteType': 'Electronic Waste',
                'category': 'hazardous',
                'icon': 'alert-circle',
                'tips': [
                    'Do NOT mix with regular waste',
                    'Take to e-waste collection center',
                    'Keep in safe location until collection',
                    'Ensure safe handling for toxins'
                ],
                'points': 50,
                'bin_color': 'Red'
            },
            'food': {
                'wasteType': 'Food Waste',
                'category': 'organic',
                'icon': 'leaf',
                'tips': [
                    'Place in green bin',
                    'Drain all liquids',
                    'Avoid meat and fish in composting',
                    'Wrap in biodegradable material'
                ],
                'points': 15,
                'bin_color': 'Green'
            },
            'textiles': {
                'wasteType': 'Textile Waste',
                'category': 'dry',
                'icon': 'box',
                'tips': [
                    'Bundle textiles together',
                    'Check if items can be donated',
                    'Place in recyclable bin',
                    'Separate worn items for composting'
                ],
                'points': 15,
                'bin_color': 'Blue'
            }
        }
        
        # Parse Nyckel result
        if result and isinstance(result, dict):
            # Get classification label
            classification = result.get('label', 'unknown').lower()
            confidence = result.get('confidence', 0)
            
            # Find matching waste type
            matched_waste = None
            for key in waste_mapping:
                if key in classification:
                    matched_waste = waste_mapping[key]
                    break
            
            # If no exact match, use closest match
            if not matched_waste:
                if 'organic' in classification or 'food' in classification:
                    matched_waste = waste_mapping['organic']
                elif 'plastic' in classification:
                    matched_waste = waste_mapping['plastic']
                elif 'glass' in classification:
                    matched_waste = waste_mapping['glass']
                else:
                    matched_waste = waste_mapping['paper']
            
            return jsonify({
                'success': True,
                'classification': matched_waste,
                'confidence': confidence,
                'nyckel_label': classification
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': 'Failed to classify image'
            }), 400
            
    except Exception as e:
        print(f"Waste classification error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': str(e)}), 500


# ========== Voice Navigation - Dialogflow ES Proxy ==========

# Configure these with your Dialogflow ES credentials
DIALOGFLOW_PROJECT_ID = os.environ.get('DIALOGFLOW_PROJECT_ID', 'your-dialogflow-project-id')
DIALOGFLOW_API_KEY = os.environ.get('DIALOGFLOW_API_KEY', '')  # API key for Dialogflow ES v2

@app.route('/api/voice/detect-intent', methods=['POST'])
def voice_detect_intent():
    """Proxy endpoint for Dialogflow ES detectIntent API.
    Keeps credentials server-side and avoids CORS issues."""
    try:
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({'error': 'Missing text field'}), 400

        text = data['text'][:256]  # Limit input length
        session_id = data.get('sessionId', 'default')[:64]
        language_code = data.get('languageCode', 'en')[:5]

        # If no API key configured, use local keyword fallback
        if not DIALOGFLOW_API_KEY or DIALOGFLOW_PROJECT_ID == 'your-dialogflow-project-id':
            result = _local_intent_match(text)
            return jsonify(result), 200

        # Dialogflow ES v2 REST API
        df_url = (
            f'https://dialogflow.googleapis.com/v2/projects/{DIALOGFLOW_PROJECT_ID}'
            f'/agent/sessions/{session_id}:detectIntent'
        )

        payload = {
            'queryInput': {
                'text': {
                    'text': text,
                    'languageCode': language_code
                }
            }
        }

        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {DIALOGFLOW_API_KEY}'
        }

        resp = requests.post(df_url, json=payload, headers=headers, timeout=5)

        if resp.status_code == 200:
            df_data = resp.json()
            query_result = df_data.get('queryResult', {})
            intent_info = query_result.get('intent', {})
            return jsonify({
                'intent': intent_info.get('displayName', ''),
                'fulfillmentText': query_result.get('fulfillmentText', ''),
                'confidence': query_result.get('intentDetectionConfidence', 0)
            }), 200
        else:
            # Dialogflow call failed, use local fallback
            result = _local_intent_match(text)
            return jsonify(result), 200

    except requests.exceptions.Timeout:
        result = _local_intent_match(data.get('text', ''))
        return jsonify(result), 200
    except Exception as e:
        print(f"Voice detect-intent error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


def _local_intent_match(text):
    """Local keyword-based intent matching as fallback when Dialogflow is unavailable."""
    lower = text.lower()

    keyword_map = [
        (['dashboard', 'home', 'main page'],        'open_dashboard',       'Opening dashboard'),
        (['service', 'services', 'complaint', 'register a complaint', 'register complaint', 'grievance'], 'open_services', 'Opening services'),
        (['waste', 'garbage', 'trash', 'dustbin'],   'open_wastemanagement', 'Opening waste management'),
        (['wallet', 'payment', 'pay', 'bill', 'money'], 'open_wallet',      'Taking you to wallet'),
        (['record', 'records', 'history'],            'open_record',          'Opening records'),
        (['insight', 'insights', 'analytics', 'stats'], 'open_insight',      'Opening insights'),
        (['utility', 'utilities', 'electricity', 'water', 'gas'], 'open_utilities', 'Opening utilities'),
        (['community', 'forum', 'neighbor'],          'open_community',       'Opening community'),
        (['profile', 'account', 'setting', 'settings'], 'open_profile',      'Opening profile'),
    ]

    for keywords, intent, fulfillment in keyword_map:
        for kw in keywords:
            if kw in lower:
                return {
                    'intent': intent,
                    'fulfillmentText': fulfillment,
                    'confidence': 0.85
                }

    return {
        'intent': '',
        'fulfillmentText': "Sorry, I didn't understand that command.",
        'confidence': 0
    }


# ═══════════════════════════════════════════════════════════════════════════════
#  IMAGE VERIFICATION API
# ═══════════════════════════════════════════════════════════════════════════════

@app.route('/api/verify-image', methods=['POST'])
def api_verify_image():
    """Verify an uploaded image — used by GovOfficial-Worker and govWaste-worker."""
    try:
        data = request.get_json()
        if not data or 'image' not in data:
            return jsonify({'success': False, 'message': 'No image provided'}), 400

        # Decode base64 image (strip data URI prefix if present)
        image_b64 = data['image']
        if ',' in image_b64:
            image_b64 = image_b64.split(',', 1)[1]
        image_bytes = base64.b64decode(image_b64)

        # Current GPS from device
        current_gps = None
        if data.get('latitude') is not None and data.get('longitude') is not None:
            current_gps = (float(data['latitude']), float(data['longitude']))

        # Current timestamp
        current_timestamp = datetime.utcnow()
        if data.get('timestamp'):
            try:
                current_timestamp = datetime.fromisoformat(data['timestamp'].replace('Z', '+00:00')).replace(tzinfo=None)
            except (ValueError, AttributeError):
                pass

        # Source context (which portal, what kind of upload)
        source = data.get('source', 'unknown')
        source_ref = data.get('source_ref', '')
        uploaded_by = data.get('uploaded_by', '')

        # Fetch existing hashes from DB for this source category
        db_hash_rows = ImageHash.query.filter_by(source=source).all()
        db_hashes = [row.phash for row in db_hash_rows]

        # Run verification pipeline
        result = verify_image(
            image_bytes=image_bytes,
            current_timestamp=current_timestamp,
            current_gps=current_gps,
            db_hashes=db_hashes
        )

        # Persist the new hash to DB
        new_hash = ImageHash(
            phash=result['phash'],
            source=source,
            source_ref=source_ref,
            uploaded_by=uploaded_by,
            verification_score=result['score'],
            verification_status=result['status']
        )
        db.session.add(new_hash)
        db.session.commit()
        result['success'] = True
        return jsonify(result), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


# ===== SERVER-SIDE TRANSLATIONS API =====
import json as _json

_translations_cache = None

def _load_translations():
    global _translations_cache
    if _translations_cache is None:
        try:
            with open(os.path.join(app.static_folder, 'translations.json'), 'r', encoding='utf-8') as f:
                _translations_cache = _json.load(f)
        except Exception:
            _translations_cache = {}
    return _translations_cache

@app.route('/api/translations', methods=['GET'])
def api_get_translations():
    """Serve translations from server. Optional ?lang=hi to get single language."""
    translations = _load_translations()
    lang = request.args.get('lang', '').strip().lower()
    if lang and lang in translations:
        return jsonify({'success': True, 'language': lang, 'translations': translations[lang]})
    return jsonify({'success': True, 'languages': list(translations.keys()), 'translations': translations})

@app.route('/api/translations/reload', methods=['POST'])
def api_reload_translations():
    """Force reload translations from file (admin use)."""
    global _translations_cache
    _translations_cache = None
    _load_translations()
    return jsonify({'success': True, 'languages': list(_translations_cache.keys())})


# ===== ASK SUVIDHA (Cohere AI Proxy) =====
COHERE_API_KEY = os.environ.get('COHERE_API_KEY', '')

@app.route('/api/ask-suvidha', methods=['POST'])
def ask_suvidha():
    """Proxy endpoint for Cohere AI chat to avoid CORS issues."""
    data = request.get_json()
    if not data or not data.get('message'):
        return jsonify({'success': False, 'error': 'Message is required'}), 400

    user_message = data['message']
    system_prompt = data.get('system', 'You are Suvidha Bandhu, an Indian civic utility advisor.')

    if not COHERE_API_KEY:
        return jsonify({'success': False, 'error': 'AI service is not configured. Please set COHERE_API_KEY.'}), 503

    # Limit message length to prevent abuse
    if len(user_message) > 2000:
        return jsonify({'success': False, 'error': 'Message too long'}), 400

    try:
        response = requests.post(
            'https://api.cohere.com/v2/chat',
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {COHERE_API_KEY}'
            },
            json={
                'model': 'command-a-03-2025',
                'messages': [
                    {'role': 'system', 'content': system_prompt},
                    {'role': 'user', 'content': user_message}
                ],
                'temperature': 0.6,
                'max_tokens': 450
            },
            timeout=30
        )

        result = response.json()

        if response.status_code != 200:
            error_msg = result.get('message', 'Cohere API error')
            return jsonify({'success': False, 'error': error_msg}), 502

        text = ''
        if result.get('message') and result['message'].get('content'):
            parts = result['message']['content']
            if isinstance(parts, list) and len(parts) > 0:
                text = parts[0].get('text', '')
            elif isinstance(parts, str):
                text = parts

        return jsonify({'success': True, 'response': text})

    except requests.exceptions.Timeout:
        return jsonify({'success': False, 'error': 'Request timed out'}), 504
    except Exception as e:
        return jsonify({'success': False, 'error': 'Failed to connect to AI service'}), 502


if __name__ == '__main__':
    app.run(debug=True)
