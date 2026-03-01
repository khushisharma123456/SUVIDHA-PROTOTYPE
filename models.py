from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, date
import uuid

db = SQLAlchemy()


# ============================================
# GOVERNMENT OFFICIALS TABLE
# ============================================
class GovOfficial(db.Model):
    __tablename__ = 'gov_officials'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    employee_id = db.Column(db.String(50), unique=True, nullable=False, index=True)  # GOV-XXXX format
    full_name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    phone = db.Column(db.String(20), nullable=True)
    password = db.Column(db.String(255), nullable=False)
    
    # Role and Department
    department = db.Column(db.String(100), nullable=False)  # grievance, utilities, field_ops, policy, audit, waste, rwa, meter
    designation = db.Column(db.String(100), nullable=False)  # junior_officer, senior_officer, assistant_commissioner, etc.
    role = db.Column(db.String(50), default='official')  # admin, official, supervisor
    
    # Assignment
    assigned_state = db.Column(db.String(100), nullable=True)
    assigned_district = db.Column(db.String(100), nullable=True)
    assigned_ward = db.Column(db.String(100), nullable=True)
    
    # Status and Activity
    is_active = db.Column(db.Boolean, default=True)
    is_verified = db.Column(db.Boolean, default=True)
    last_login = db.Column(db.DateTime, nullable=True)
    account_created = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Performance metrics
    grievances_handled = db.Column(db.Integer, default=0)
    grievances_resolved = db.Column(db.Integer, default=0)
    avg_resolution_time = db.Column(db.Float, default=0.0)  # in hours
    satisfaction_score = db.Column(db.Float, default=0.0)  # 0-100
    
    def to_dict(self):
        return {
            'id': self.id,
            'employee_id': self.employee_id,
            'full_name': self.full_name,
            'email': self.email,
            'phone': self.phone,
            'department': self.department,
            'designation': self.designation,
            'role': self.role,
            'assigned_state': self.assigned_state,
            'assigned_district': self.assigned_district,
            'assigned_ward': self.assigned_ward,
            'is_active': self.is_active,
            'is_verified': self.is_verified,
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'account_created': self.account_created.isoformat() if self.account_created else None,
            'grievances_handled': self.grievances_handled,
            'grievances_resolved': self.grievances_resolved,
            'avg_resolution_time': self.avg_resolution_time,
            'satisfaction_score': self.satisfaction_score
        }


# ============================================
# GRIEVANCES TABLE (for admin dashboard)
# ============================================
class Grievance(db.Model):
    __tablename__ = 'grievances'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    grievance_id = db.Column(db.String(50), unique=True, nullable=False, index=True)  # GRV-2026-XXXXX
    
    # Complainant details (can be from users table or anonymous)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=True)
    complainant_name = db.Column(db.String(255), nullable=True)
    complainant_phone = db.Column(db.String(20), nullable=True)
    
    # Location
    state = db.Column(db.String(100), nullable=False, index=True)
    district = db.Column(db.String(100), nullable=False, index=True)
    ward = db.Column(db.String(100), nullable=False, index=True)
    locality = db.Column(db.String(255), nullable=True)
    
    # Grievance details
    utility_type = db.Column(db.String(50), nullable=False)  # electricity, water, gas, general
    category = db.Column(db.String(100), nullable=False)  # billing, outage, quality, safety, etc.
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=False)
    
    # Status and Priority
    status = db.Column(db.String(50), default='pending')  # pending, assigned, in_progress, escalated, resolved, closed
    severity = db.Column(db.String(20), default='medium')  # low, medium, high, critical
    priority = db.Column(db.Integer, default=3)  # 1 = highest, 5 = lowest
    
    # SLA tracking
    sla_hours = db.Column(db.Integer, default=24)  # SLA deadline in hours
    sla_deadline = db.Column(db.DateTime, nullable=True)
    sla_breached = db.Column(db.Boolean, default=False)
    
    # Assignment
    assigned_official_id = db.Column(db.String(36), db.ForeignKey('gov_officials.id'), nullable=True)
    assigned_at = db.Column(db.DateTime, nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = db.Column(db.DateTime, nullable=True)
    
    # Resolution
    resolution_notes = db.Column(db.Text, nullable=True)
    resolution_time_hours = db.Column(db.Float, nullable=True)
    
    # Relationships
    assigned_official = db.relationship('GovOfficial', backref='assigned_grievances')
    user = db.relationship('User', backref='grievances')
    
    def to_dict(self):
        return {
            'id': self.id,
            'grievance_id': self.grievance_id,
            'user_id': self.user_id,
            'complainant_name': self.complainant_name,
            'complainant_phone': self.complainant_phone,
            'state': self.state,
            'district': self.district,
            'ward': self.ward,
            'locality': self.locality,
            'utility_type': self.utility_type,
            'category': self.category,
            'title': self.title,
            'description': self.description,
            'status': self.status,
            'severity': self.severity,
            'priority': self.priority,
            'sla_hours': self.sla_hours,
            'sla_deadline': self.sla_deadline.isoformat() if self.sla_deadline else None,
            'sla_breached': self.sla_breached,
            'assigned_official_id': self.assigned_official_id,
            'assigned_at': self.assigned_at.isoformat() if self.assigned_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None,
            'resolution_notes': self.resolution_notes,
            'resolution_time_hours': self.resolution_time_hours
        }


# ============================================
# METER READINGS TABLE (for meter integrity)
# ============================================
class MeterReading(db.Model):
    __tablename__ = 'meter_readings'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    meter_id = db.Column(db.String(50), unique=False, nullable=False, index=True)  # MTR-XXXX
    
    # Location
    ward = db.Column(db.String(100), nullable=False, index=True)
    locality = db.Column(db.String(255), nullable=True)
    block = db.Column(db.String(100), nullable=True)
    sector = db.Column(db.String(100), nullable=True)
    
    # Reading details
    reading_value = db.Column(db.Float, nullable=False)
    reading_unit = db.Column(db.String(20), default='kWh')  # kWh, kL, SCM
    utility_type = db.Column(db.String(50), default='electricity')
    
    # AI Verification
    ai_confidence = db.Column(db.Float, default=100.0)  # 0-100%
    status = db.Column(db.String(50), default='verified')  # verified, review, suspicious, re-verifying
    
    # Timestamps
    reading_time = db.Column(db.DateTime, default=datetime.utcnow)
    verified_at = db.Column(db.DateTime, nullable=True)
    verified_by = db.Column(db.String(36), db.ForeignKey('gov_officials.id'), nullable=True)
    
    verifier = db.relationship('GovOfficial', backref='verified_readings')
    
    def to_dict(self):
        return {
            'id': self.id,
            'meter_id': self.meter_id,
            'ward': self.ward,
            'locality': self.locality,
            'block': self.block,
            'sector': self.sector,
            'reading_value': self.reading_value,
            'reading_unit': self.reading_unit,
            'utility_type': self.utility_type,
            'ai_confidence': self.ai_confidence,
            'status': self.status,
            'reading_time': self.reading_time.isoformat() if self.reading_time else None,
            'verified_at': self.verified_at.isoformat() if self.verified_at else None,
            'verified_by': self.verified_by
        }


# ============================================
# RWA PROJECTS TABLE (for RWA oversight)
# ============================================
class RWAProject(db.Model):
    __tablename__ = 'rwa_projects'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_name = db.Column(db.String(255), nullable=False)
    rwa_name = db.Column(db.String(255), nullable=False)
    
    # Location
    ward = db.Column(db.String(100), nullable=False, index=True)
    sector = db.Column(db.String(100), nullable=True)
    
    # Budget and Purpose
    allocated_budget = db.Column(db.Float, nullable=False)  # in rupees
    utilized_budget = db.Column(db.Float, default=0.0)
    purpose = db.Column(db.String(100), nullable=False)  # Green Spaces, Infrastructure, Maintenance, etc.
    
    # Timeline
    start_date = db.Column(db.DateTime, nullable=True)
    deadline = db.Column(db.DateTime, nullable=False)
    completed_date = db.Column(db.DateTime, nullable=True)
    
    # Progress
    progress = db.Column(db.Integer, default=0)  # 0-100%
    status = db.Column(db.String(50), default='not_started')  # not_started, in_progress, delayed, near_complete, completed
    
    # Oversight
    supervised_by = db.Column(db.String(36), db.ForeignKey('gov_officials.id'), nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    supervisor = db.relationship('GovOfficial', backref='supervised_projects')
    
    def to_dict(self):
        return {
            'id': self.id,
            'project_name': self.project_name,
            'rwa_name': self.rwa_name,
            'ward': self.ward,
            'sector': self.sector,
            'allocated_budget': self.allocated_budget,
            'utilized_budget': self.utilized_budget,
            'purpose': self.purpose,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'deadline': self.deadline.isoformat() if self.deadline else None,
            'completed_date': self.completed_date.isoformat() if self.completed_date else None,
            'progress': self.progress,
            'status': self.status,
            'supervised_by': self.supervised_by
        }


# ============================================
# AUDIT LOGS TABLE (for audit vault)
# ============================================
class AuditLog(db.Model):
    __tablename__ = 'audit_logs'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    log_id = db.Column(db.String(50), unique=True, nullable=False, index=True)  # LOG-YYYYMMDD-XXXXX
    
    # Action details
    action = db.Column(db.String(100), nullable=False)  # Grievance Resolved, Policy Updated, etc.
    action_type = db.Column(db.String(50), nullable=False)  # success, warning, danger, info
    
    # Actor
    official_id = db.Column(db.String(36), db.ForeignKey('gov_officials.id'), nullable=True)
    official_name = db.Column(db.String(255), nullable=True)
    department = db.Column(db.String(100), nullable=True)
    
    # Details
    reason = db.Column(db.Text, nullable=True)
    related_id = db.Column(db.String(100), nullable=True)  # Related grievance ID, policy ID, etc.
    impact = db.Column(db.String(255), nullable=True)
    severity = db.Column(db.String(20), default='Normal')  # Normal, Medium, High
    source = db.Column(db.String(50), default='Manual')  # Manual, System (AUTO)
    
    # Timestamp
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    
    official = db.relationship('GovOfficial', backref='audit_logs')
    
    def to_dict(self):
        return {
            'id': self.id,
            'log_id': self.log_id,
            'action': self.action,
            'action_type': self.action_type,
            'official_id': self.official_id,
            'official_name': self.official_name,
            'department': self.department,
            'reason': self.reason,
            'related_id': self.related_id,
            'impact': self.impact,
            'severity': self.severity,
            'source': self.source,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }


# ============================================
# FIELD OPERATIONS TABLE
# ============================================
class FieldOperation(db.Model):
    __tablename__ = 'field_operations'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    operation_id = db.Column(db.String(50), unique=True, nullable=False, index=True)
    
    # Operation details
    operation_type = db.Column(db.String(100), nullable=False)  # inspection, repair, installation, maintenance
    utility_type = db.Column(db.String(50), nullable=False)  # electricity, water, gas
    description = db.Column(db.Text, nullable=True)
    
    # Location
    ward = db.Column(db.String(100), nullable=False, index=True)
    locality = db.Column(db.String(255), nullable=True)
    address = db.Column(db.Text, nullable=True)
    
    # Assignment
    assigned_team = db.Column(db.String(100), nullable=True)
    assigned_official_id = db.Column(db.String(36), db.ForeignKey('gov_officials.id'), nullable=True)
    field_agent_id = db.Column(db.String(36), db.ForeignKey('field_agents.id'), nullable=True)  # Link to field worker
    
    # Status
    status = db.Column(db.String(50), default='scheduled')  # scheduled, in_progress, completed, cancelled
    priority = db.Column(db.String(20), default='medium')
    
    # Timeline
    scheduled_date = db.Column(db.DateTime, nullable=False)
    start_time = db.Column(db.DateTime, nullable=True)
    end_time = db.Column(db.DateTime, nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    assigned_official = db.relationship('GovOfficial', backref='field_operations')
    field_agent = db.relationship('FieldAgent', backref='field_operations')
    
    def to_dict(self):
        return {
            'id': self.id,
            'operation_id': self.operation_id,
            'operation_type': self.operation_type,
            'utility_type': self.utility_type,
            'description': self.description,
            'ward': self.ward,
            'locality': self.locality,
            'address': self.address,
            'assigned_team': self.assigned_team,
            'assigned_official_id': self.assigned_official_id,
            'status': self.status,
            'priority': self.priority,
            'scheduled_date': self.scheduled_date.isoformat() if self.scheduled_date else None,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None
        }


# ============================================
# WARD STATISTICS TABLE (for dashboard analytics)
# ============================================
class WardStats(db.Model):
    __tablename__ = 'ward_stats'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    ward = db.Column(db.String(100), nullable=False, unique=True, index=True)
    ward_name = db.Column(db.String(255), nullable=True)  # e.g., "Ward 15 - Rohini"
    
    # Complaint metrics
    total_complaints = db.Column(db.Integer, default=0)
    pending_complaints = db.Column(db.Integer, default=0)
    resolved_complaints = db.Column(db.Integer, default=0)
    sla_breaches = db.Column(db.Integer, default=0)
    
    # Performance
    avg_resolution_time = db.Column(db.Float, default=0.0)  # hours
    satisfaction_score = db.Column(db.Float, default=0.0)  # 0-100
    participation_rate = db.Column(db.Float, default=0.0)  # 0-100%
    
    # Utility metrics
    electricity_complaints = db.Column(db.Integer, default=0)
    water_complaints = db.Column(db.Integer, default=0)
    gas_complaints = db.Column(db.Integer, default=0)
    
    # Stress levels
    electricity_stress = db.Column(db.String(20), default='low')  # low, medium, high
    water_stress = db.Column(db.String(20), default='low')
    gas_stress = db.Column(db.String(20), default='low')
    
    # Active outages
    active_outages = db.Column(db.Integer, default=0)
    
    # Trend
    trend = db.Column(db.String(50), default='+0.0%')
    
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'ward': self.ward,
            'ward_name': self.ward_name,
            'total_complaints': self.total_complaints,
            'pending_complaints': self.pending_complaints,
            'resolved_complaints': self.resolved_complaints,
            'sla_breaches': self.sla_breaches,
            'avg_resolution_time': self.avg_resolution_time,
            'satisfaction_score': self.satisfaction_score,
            'participation_rate': self.participation_rate,
            'electricity_complaints': self.electricity_complaints,
            'water_complaints': self.water_complaints,
            'gas_complaints': self.gas_complaints,
            'electricity_stress': self.electricity_stress,
            'water_stress': self.water_stress,
            'gas_stress': self.gas_stress,
            'active_outages': self.active_outages,
            'trend': self.trend
        }


# ============================================
# PARTICIPATION SCHEMES TABLE
# ============================================
class ParticipationScheme(db.Model):
    __tablename__ = 'participation_schemes'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    scheme_name = db.Column(db.String(255), nullable=False)
    
    # Coverage
    active_wards = db.Column(db.Integer, default=0)
    total_participants = db.Column(db.Integer, default=0)
    participation_rate = db.Column(db.Float, default=0.0)  # percentage
    
    # Cost
    cost_per_engagement = db.Column(db.Float, default=0.0)
    total_budget = db.Column(db.Float, default=0.0)
    utilized_budget = db.Column(db.Float, default=0.0)
    
    # Impact
    impact_status = db.Column(db.String(50), default='medium')  # low, medium, high
    abuse_rate = db.Column(db.String(20), default='low')  # low, medium, high
    
    # Status
    is_active = db.Column(db.Boolean, default=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'scheme_name': self.scheme_name,
            'active_wards': self.active_wards,
            'total_participants': self.total_participants,
            'participation_rate': self.participation_rate,
            'cost_per_engagement': self.cost_per_engagement,
            'total_budget': self.total_budget,
            'utilized_budget': self.utilized_budget,
            'impact_status': self.impact_status,
            'abuse_rate': self.abuse_rate,
            'is_active': self.is_active
        }


# ============================================
# REDEMPTIONS TABLE (for participation tracking)
# ============================================
class Redemption(db.Model):
    __tablename__ = 'redemptions'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_name = db.Column(db.String(100), nullable=False)  # Masked name like "Amit S."
    
    # Reward details
    reward_type = db.Column(db.String(100), nullable=False)  # Movie Ticket, Shopping Voucher, etc.
    points_used = db.Column(db.Integer, nullable=False)
    
    # Location
    ward = db.Column(db.String(100), nullable=False, index=True)
    
    # Verification
    is_verified = db.Column(db.Boolean, default=False)
    verified_by = db.Column(db.String(36), db.ForeignKey('gov_officials.id'), nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    verifier = db.relationship('GovOfficial', backref='verified_redemptions')
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_name': self.user_name,
            'reward_type': self.reward_type,
            'points_used': self.points_used,
            'ward': self.ward,
            'is_verified': self.is_verified,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

# ============================================
# USERS TABLE
# ============================================
class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    full_name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    phone = db.Column(db.String(20), unique=True, nullable=False, index=True)
    password = db.Column(db.String(255), nullable=False)
    
    # User Type
    user_type = db.Column(db.String(20), default='general')  # general, senior_citizen
    
    # Personal Details
    preferred_language = db.Column(db.String(10), default='en')  # en, hi, ta, te, bn
    aadhaar = db.Column(db.String(14), nullable=True, unique=True)
    aadhaar_consent = db.Column(db.Boolean, default=False)
    date_of_birth = db.Column(db.Date, nullable=True)
    
    # Location Details
    state = db.Column(db.String(100), nullable=False)
    city = db.Column(db.String(100), nullable=False)
    ward = db.Column(db.String(100), nullable=False)
    locality = db.Column(db.String(255), nullable=False)
    
    # Service Providers
    electricity_provider_id = db.Column(db.String(36), db.ForeignKey('vendors.id'), nullable=True)
    water_provider_id = db.Column(db.String(36), db.ForeignKey('vendors.id'), nullable=True)
    gas_provider_id = db.Column(db.String(36), db.ForeignKey('vendors.id'), nullable=True)
    
    # Account Settings
    alerts_enabled = db.Column(db.Boolean, default=True)
    is_verified = db.Column(db.Boolean, default=False)
    account_created = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime, nullable=True)
    
    # Relationships
    electricity_provider = db.relationship('Vendor', foreign_keys=[electricity_provider_id], backref='electricity_users')
    water_provider = db.relationship('Vendor', foreign_keys=[water_provider_id], backref='water_users')
    gas_provider = db.relationship('Vendor', foreign_keys=[gas_provider_id], backref='gas_users')
    community_member = db.relationship('Community', backref='user', uselist=False, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'full_name': self.full_name,
            'email': self.email,
            'phone': self.phone,
            'user_type': self.user_type,
            'date_of_birth': self.date_of_birth.isoformat() if self.date_of_birth else None,
            'preferred_language': self.preferred_language,
            'state': self.state,
            'city': self.city,
            'ward': self.ward,
            'locality': self.locality,
            'alerts_enabled': self.alerts_enabled,
            'is_verified': self.is_verified,
            'account_created': self.account_created.isoformat(),
            'electricity_provider_id': self.electricity_provider_id,
            'water_provider_id': self.water_provider_id,
            'gas_provider_id': self.gas_provider_id
        }


# ============================================
# VENDORS TABLE
# ============================================
class Vendor(db.Model):
    __tablename__ = 'vendors'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(255), nullable=False, unique=True, index=True)
    service_type = db.Column(db.String(50), nullable=False)  # 'electricity', 'water', 'gas'
    description = db.Column(db.String(500), nullable=True)
    contact = db.Column(db.String(20), nullable=True)
    website = db.Column(db.String(255), nullable=True)
    availability = db.Column(db.String(50), default='active')  # 'active', 'inactive'
    coverage_areas = db.Column(db.Text, nullable=True)  # JSON: list of areas/states served
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'service_type': self.service_type,
            'description': self.description,
            'contact': self.contact,
            'website': self.website,
            'availability': self.availability,
            'coverage_areas': self.coverage_areas
        }


# ============================================
# COMMUNITY TABLE (organized by location)
# ============================================
class Community(db.Model):
    __tablename__ = 'communities'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, unique=True)
    
    # Location grouping
    state = db.Column(db.String(100), nullable=False, index=True)
    city = db.Column(db.String(100), nullable=False, index=True)
    ward = db.Column(db.String(100), nullable=False, index=True)
    locality = db.Column(db.String(255), nullable=False, index=True)
    
    # Community engagement
    points_earned = db.Column(db.Integer, default=0)
    challenges_participated = db.Column(db.Integer, default=0)
    reports_submitted = db.Column(db.Integer, default=0)
    
    # Community status
    is_active = db.Column(db.Boolean, default=True)
    joined_date = db.Column(db.DateTime, default=datetime.utcnow)
    last_activity = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Badges/Recognition
    badges = db.Column(db.String(500), nullable=True)  # CSV: 'water_steward,grid_supporter,peak_saver'
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'state': self.state,
            'city': self.city,
            'ward': self.ward,
            'locality': self.locality,
            'points_earned': self.points_earned,
            'challenges_participated': self.challenges_participated,
            'reports_submitted': self.reports_submitted,
            'is_active': self.is_active,
            'joined_date': self.joined_date.isoformat(),
            'badges': self.badges.split(',') if self.badges else []
        }


# ============================================
# COMMUNITY STATS (for aggregated data by region)
# ============================================
class CommunityStats(db.Model):
    __tablename__ = 'community_stats'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Location aggregation
    state = db.Column(db.String(100), nullable=False, index=True)
    city = db.Column(db.String(100), nullable=False, index=True)
    ward = db.Column(db.String(100), nullable=False, index=True)
    locality = db.Column(db.String(255), nullable=True, index=True)
    
    # Aggregated metrics
    total_members = db.Column(db.Integer, default=0)
    active_members = db.Column(db.Integer, default=0)
    total_points = db.Column(db.Integer, default=0)
    avg_points_per_member = db.Column(db.Float, default=0.0)
    total_challenges = db.Column(db.Integer, default=0)
    water_stress_level = db.Column(db.String(50), default='low')  # low, medium, high
    electricity_stress_level = db.Column(db.String(50), default='low')
    gas_stress_level = db.Column(db.String(50), default='low')
    
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'state': self.state,
            'city': self.city,
            'ward': self.ward,
            'locality': self.locality,
            'total_members': self.total_members,
            'active_members': self.active_members,
            'total_points': self.total_points,
            'avg_points_per_member': self.avg_points_per_member,
            'total_challenges': self.total_challenges,
            'water_stress_level': self.water_stress_level,
            'electricity_stress_level': self.electricity_stress_level,
            'gas_stress_level': self.gas_stress_level
        }


# ============================================
# BILLS TABLE (for tracking utility consumption)
# ============================================
class Bill(db.Model):
    __tablename__ = 'bills'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    
    # Bill details
    utility_type = db.Column(db.String(50), nullable=False)  # 'electricity', 'water', 'gas'
    bill_id = db.Column(db.String(100), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    consumption = db.Column(db.Float, nullable=False)  # units/kL/SCM
    consumption_unit = db.Column(db.String(20), nullable=False)  # 'kWh', 'kL', 'SCM'
    
    # Dates
    billing_period_start = db.Column(db.DateTime, nullable=False)
    billing_period_end = db.Column(db.DateTime, nullable=False)
    due_date = db.Column(db.DateTime, nullable=False)
    paid_date = db.Column(db.DateTime, nullable=True)
    
    # Status
    status = db.Column(db.String(20), default='pending')  # 'pending', 'paid', 'overdue'
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref='bills')
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'utility_type': self.utility_type,
            'bill_id': self.bill_id,
            'amount': self.amount,
            'consumption': self.consumption,
            'consumption_unit': self.consumption_unit,
            'billing_period_start': self.billing_period_start.isoformat(),
            'billing_period_end': self.billing_period_end.isoformat(),
            'due_date': self.due_date.isoformat(),
            'paid_date': self.paid_date.isoformat() if self.paid_date else None,
            'status': self.status
        }


# ============================================
# SERVICE REPORTS TABLE (for tracking complaints/requests)
# ============================================
class ServiceReport(db.Model):
    __tablename__ = 'service_reports'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    
    # Report details
    report_type = db.Column(db.String(50), nullable=False)  # 'power_outage', 'water_supply', 'gas_leakage', etc.
    utility_type = db.Column(db.String(50), nullable=False)  # 'electricity', 'water', 'gas', 'general'
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=False)
    
    # Status tracking
    status = db.Column(db.String(20), default='open')  # 'open', 'in_progress', 'resolved', 'closed'
    priority = db.Column(db.String(20), default='medium')  # 'low', 'medium', 'high', 'urgent'
    
    # Location
    location = db.Column(db.String(500), nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = db.Column(db.DateTime, nullable=True)
    
    # Relationships
    user = db.relationship('User', backref='service_reports')
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'report_type': self.report_type,
            'utility_type': self.utility_type,
            'title': self.title,
            'description': self.description,
            'status': self.status,
            'priority': self.priority,
            'location': self.location,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None
        }


# ============================================
# FIELD AGENTS TABLE (Workers - Meter Reading, Water, Gas, RWA)
# ============================================
class FieldAgent(db.Model):
    __tablename__ = 'field_agents'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    employee_id = db.Column(db.String(50), unique=True, nullable=False, index=True)  # FA-XXXX format
    
    # Personal Info
    full_name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    phone = db.Column(db.String(20), nullable=False)
    password = db.Column(db.String(255), nullable=False)
    
    # Category of Work
    category = db.Column(db.String(50), nullable=False)  # electric_meter, water_meter, gas_cylinder, rwa_work
    
    # Supervisor (Government Official Admin)
    supervisor_id = db.Column(db.String(36), db.ForeignKey('gov_officials.id'), nullable=True)
    
    # Assignment Area
    assigned_state = db.Column(db.String(100), nullable=True)
    assigned_district = db.Column(db.String(100), nullable=True)
    assigned_ward = db.Column(db.String(100), nullable=True)
    
    # Status
    status = db.Column(db.String(20), default='offline')  # online, on_task, offline, break
    is_active = db.Column(db.Boolean, default=True)
    is_verified = db.Column(db.Boolean, default=True)
    
    # GPS Tracking
    gps_enabled = db.Column(db.Boolean, default=False)
    current_latitude = db.Column(db.Float, nullable=True)
    current_longitude = db.Column(db.Float, nullable=True)
    current_address = db.Column(db.String(500), nullable=True)
    location_updated_at = db.Column(db.DateTime, nullable=True)
    
    # Performance (current snapshot)
    performance_score = db.Column(db.Float, default=50.0)  # 0-100, AI-calculated like credit score
    tasks_completed_today = db.Column(db.Integer, default=0)
    total_tasks_completed = db.Column(db.Integer, default=0)
    avg_task_time = db.Column(db.Float, default=0.0)  # in minutes
    
    # Timestamps
    last_login = db.Column(db.DateTime, nullable=True)
    account_created = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    supervisor = db.relationship('GovOfficial', backref='field_agents')
    
    def to_dict(self):
        return {
            'id': self.id,
            'employee_id': self.employee_id,
            'full_name': self.full_name,
            'email': self.email,
            'phone': self.phone,
            'category': self.category,
            'supervisor_id': self.supervisor_id,
            'assigned_state': self.assigned_state,
            'assigned_district': self.assigned_district,
            'assigned_ward': self.assigned_ward,
            'status': self.status,
            'is_active': self.is_active,
            'is_verified': self.is_verified,
            'gps_enabled': self.gps_enabled,
            'current_latitude': self.current_latitude,
            'current_longitude': self.current_longitude,
            'current_address': self.current_address,
            'location_updated_at': self.location_updated_at.isoformat() if self.location_updated_at else None,
            'performance_score': self.performance_score,
            'tasks_completed_today': self.tasks_completed_today,
            'total_tasks_completed': self.total_tasks_completed,
            'avg_task_time': self.avg_task_time,
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'account_created': self.account_created.isoformat() if self.account_created else None
        }


# ============================================
# TASK ASSIGNMENTS TABLE (Tasks assigned to Field Agents)
# ============================================
class TaskAssignment(db.Model):
    __tablename__ = 'task_assignments'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    task_id = db.Column(db.String(50), unique=True, nullable=False, index=True)  # TASK-YYYYMMDD-XXXXX
    
    # Assignment
    agent_id = db.Column(db.String(36), db.ForeignKey('field_agents.id'), nullable=False)
    assigned_by = db.Column(db.String(36), db.ForeignKey('gov_officials.id'), nullable=False)
    
    # Task Type
    task_type = db.Column(db.String(50), nullable=False)  # electric_meter, water_meter, gas_cylinder, rwa_work, grievance, inspection
    
    # Location Details
    house_number = db.Column(db.String(100), nullable=False)
    ward = db.Column(db.String(100), nullable=False, index=True)
    city = db.Column(db.String(100), nullable=False)
    full_address = db.Column(db.String(500), nullable=True)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    
    # Task Details
    description = db.Column(db.Text, nullable=True)
    priority = db.Column(db.String(20), default='normal')  # low, normal, high, urgent
    
    # Status
    status = db.Column(db.String(20), default='pending')  # pending, in_progress, completed, cancelled, failed
    
    # Work Evidence
    photo_url = db.Column(db.String(500), nullable=True)
    photos_added = db.Column(db.Boolean, default=False)
    
    # Problem Reporting
    problem_raised = db.Column(db.Boolean, default=False)
    problem_type = db.Column(db.String(100), nullable=True)  # meter_tampering, leakage, damaged, inaccessible, etc.
    problem_description = db.Column(db.Text, nullable=True)
    
    # Meter Reading (if applicable)
    meter_reading = db.Column(db.Float, nullable=True)
    meter_id = db.Column(db.String(50), nullable=True)
    
    # Timestamps
    assigned_at = db.Column(db.DateTime, default=datetime.utcnow)
    started_at = db.Column(db.DateTime, nullable=True)
    arrived_at = db.Column(db.DateTime, nullable=True)
    completed_at = db.Column(db.DateTime, nullable=True)
    
    # Time tracking
    completion_time_minutes = db.Column(db.Integer, nullable=True)
    
    # Relationships
    agent = db.relationship('FieldAgent', backref='task_assignments')
    assigner = db.relationship('GovOfficial', backref='assigned_tasks')
    
    def to_dict(self):
        return {
            'id': self.id,
            'task_id': self.task_id,
            'agent_id': self.agent_id,
            'assigned_by': self.assigned_by,
            'task_type': self.task_type,
            'house_number': self.house_number,
            'ward': self.ward,
            'city': self.city,
            'full_address': self.full_address,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'description': self.description,
            'priority': self.priority,
            'status': self.status,
            'photo_url': self.photo_url,
            'photos_added': self.photos_added,
            'problem_raised': self.problem_raised,
            'problem_type': self.problem_type,
            'problem_description': self.problem_description,
            'meter_reading': self.meter_reading,
            'meter_id': self.meter_id,
            'assigned_at': self.assigned_at.isoformat() if self.assigned_at else None,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'arrived_at': self.arrived_at.isoformat() if self.arrived_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'completion_time_minutes': self.completion_time_minutes
        }


# ============================================
# AGENT LOCATION HISTORY TABLE (GPS Tracking)
# ============================================
class AgentLocationHistory(db.Model):
    __tablename__ = 'agent_location_history'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    agent_id = db.Column(db.String(36), db.ForeignKey('field_agents.id'), nullable=False)
    
    # Location
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    address = db.Column(db.String(500), nullable=True)
    accuracy = db.Column(db.Float, nullable=True)  # GPS accuracy in meters
    
    # Context
    activity = db.Column(db.String(50), nullable=True)  # traveling, arrived, working, idle
    task_id = db.Column(db.String(36), db.ForeignKey('task_assignments.id'), nullable=True)
    
    # Timestamp
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    
    # Relationship
    agent = db.relationship('FieldAgent', backref='location_history')
    task = db.relationship('TaskAssignment', backref='location_logs')
    
    def to_dict(self):
        return {
            'id': self.id,
            'agent_id': self.agent_id,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'address': self.address,
            'accuracy': self.accuracy,
            'activity': self.activity,
            'task_id': self.task_id,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }


# ============================================
# AGENT PERFORMANCE TABLE (Monthly AI-based Scoring History)
# ============================================
class AgentPerformance(db.Model):
    __tablename__ = 'agent_performance'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    agent_id = db.Column(db.String(36), db.ForeignKey('field_agents.id'), nullable=False)
    
    # Period
    month = db.Column(db.Integer, nullable=False)  # 1-12
    year = db.Column(db.Integer, nullable=False)
    
    # Task Metrics
    tasks_assigned = db.Column(db.Integer, default=0)
    tasks_completed = db.Column(db.Integer, default=0)
    tasks_failed = db.Column(db.Integer, default=0)
    completion_rate = db.Column(db.Float, default=0.0)  # percentage
    
    # Time Metrics
    avg_completion_time = db.Column(db.Float, default=0.0)  # minutes
    on_time_rate = db.Column(db.Float, default=0.0)  # percentage of tasks completed within target time
    
    # Quality Metrics
    problems_flagged = db.Column(db.Integer, default=0)
    photos_uploaded = db.Column(db.Integer, default=0)
    photo_compliance_rate = db.Column(db.Float, default=0.0)  # percentage
    
    # Customer Feedback
    feedback_count = db.Column(db.Integer, default=0)
    avg_rating = db.Column(db.Float, default=0.0)  # 1-5 stars
    
    # AI Score (like Credit Score)
    score = db.Column(db.Float, default=50.0)  # 0-100
    rating = db.Column(db.String(20), default='average')  # excellent (90+), good (70-89), average (50-69), poor (<50)
    score_change = db.Column(db.Float, default=0.0)  # change from previous month
    
    # Factors affecting score (AI reasoning)
    score_factors = db.Column(db.Text, nullable=True)  # JSON string of factors
    
    # Timestamp
    calculated_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship
    agent = db.relationship('FieldAgent', backref='performance_history')
    
    # Unique constraint for agent + month + year
    __table_args__ = (
        db.UniqueConstraint('agent_id', 'month', 'year', name='unique_agent_month_year'),
    )
    
    def to_dict(self):
        return {
            'id': self.id,
            'agent_id': self.agent_id,
            'month': self.month,
            'year': self.year,
            'tasks_assigned': self.tasks_assigned,
            'tasks_completed': self.tasks_completed,
            'tasks_failed': self.tasks_failed,
            'completion_rate': self.completion_rate,
            'avg_completion_time': self.avg_completion_time,
            'on_time_rate': self.on_time_rate,
            'problems_flagged': self.problems_flagged,
            'photos_uploaded': self.photos_uploaded,
            'photo_compliance_rate': self.photo_compliance_rate,
            'feedback_count': self.feedback_count,
            'avg_rating': self.avg_rating,
            'score': self.score,
            'rating': self.rating,
            'score_change': self.score_change,
            'score_factors': self.score_factors,
            'calculated_at': self.calculated_at.isoformat() if self.calculated_at else None
        }


# ============================================
# HOUSEHOLD TABLE (Residents in assigned areas)
# ============================================
class Household(db.Model):
    __tablename__ = 'households'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    house_number = db.Column(db.String(50), nullable=False, index=True)
    
    # Location
    ward = db.Column(db.String(100), nullable=False, index=True)
    district = db.Column(db.String(100), nullable=False, index=True)
    state = db.Column(db.String(100), nullable=False, index=True)
    locality = db.Column(db.String(255), nullable=True)
    full_address = db.Column(db.String(500), nullable=False)
    block = db.Column(db.String(100), nullable=True)
    sector = db.Column(db.String(100), nullable=True)
    
    # GPS coordinates
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    
    # Resident Info
    resident_name = db.Column(db.String(255), nullable=False)
    contact_phone = db.Column(db.String(20), nullable=True)
    num_residents = db.Column(db.Integer, default=1)
    resident_category = db.Column(db.String(50), default='general')  # general, senior_citizen, disabled, bpl
    
    # Meter Information
    meter_id = db.Column(db.String(50), nullable=True, index=True)
    meter_type = db.Column(db.String(50), default='electric')  # electric, water, gas
    
    # Status
    is_active = db.Column(db.Boolean, default=True)
    connection_status = db.Column(db.String(50), default='active')  # active, disconnected, pending
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'house_number': self.house_number,
            'ward': self.ward,
            'district': self.district,
            'state': self.state,
            'locality': self.locality,
            'full_address': self.full_address,
            'block': self.block,
            'sector': self.sector,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'resident_name': self.resident_name,
            'contact_phone': self.contact_phone,
            'num_residents': self.num_residents,
            'resident_category': self.resident_category,
            'meter_id': self.meter_id,
            'meter_type': self.meter_type,
            'is_active': self.is_active,
            'connection_status': self.connection_status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


# ============================================
# METER SUBMISSION TABLE (Readings with photos)
# ============================================
class MeterSubmission(db.Model):
    __tablename__ = 'meter_submissions'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    submission_id = db.Column(db.String(50), unique=True, nullable=False, index=True)  # SUB-YYYYMMDD-XXXXX
    
    # Task/Assignment Reference
    task_id = db.Column(db.String(36), db.ForeignKey('task_assignments.id'), nullable=True)
    agent_id = db.Column(db.String(36), db.ForeignKey('field_agents.id'), nullable=False)
    household_id = db.Column(db.String(36), db.ForeignKey('households.id'), nullable=True)
    
    # Reading Details
    meter_reading = db.Column(db.Float, nullable=True)
    meter_type = db.Column(db.String(50), default='electric')  # electric, water, gas
    reading_unit = db.Column(db.String(20), default='kWh')  # kWh, kL, SCM
    
    # Photo Evidence
    photo_data = db.Column(db.Text, nullable=True)  # Base64 encoded image
    photo_filename = db.Column(db.String(255), nullable=True)
    photo_captured_at = db.Column(db.DateTime, nullable=True)
    
    # Location at submission
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    address = db.Column(db.String(500), nullable=True)
    
    # Status
    status = db.Column(db.String(50), default='submitted')  # submitted, verified, rejected, flagged
    submission_type = db.Column(db.String(20), default='reading')  # reading, skip
    skip_reason = db.Column(db.String(255), nullable=True)
    
    # Verification
    verified_by = db.Column(db.String(36), db.ForeignKey('gov_officials.id'), nullable=True)
    verified_at = db.Column(db.DateTime, nullable=True)
    ai_confidence = db.Column(db.Float, default=100.0)  # 0-100%
    
    # Timestamps
    submitted_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    task = db.relationship('TaskAssignment', backref='submissions')
    agent = db.relationship('FieldAgent', backref='meter_submissions')
    household = db.relationship('Household', backref='meter_submissions')
    verifier = db.relationship('GovOfficial', backref='verified_submissions')
    
    def to_dict(self):
        return {
            'id': self.id,
            'submission_id': self.submission_id,
            'task_id': self.task_id,
            'agent_id': self.agent_id,
            'household_id': self.household_id,
            'meter_reading': self.meter_reading,
            'meter_type': self.meter_type,
            'reading_unit': self.reading_unit,
            'photo_data': self.photo_data,
            'photo_filename': self.photo_filename,
            'photo_captured_at': self.photo_captured_at.isoformat() if self.photo_captured_at else None,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'address': self.address,
            'status': self.status,
            'submission_type': self.submission_type,
            'skip_reason': self.skip_reason,
            'verified_by': self.verified_by,
            'verified_at': self.verified_at.isoformat() if self.verified_at else None,
            'ai_confidence': self.ai_confidence,
            'submitted_at': self.submitted_at.isoformat() if self.submitted_at else None
        }
