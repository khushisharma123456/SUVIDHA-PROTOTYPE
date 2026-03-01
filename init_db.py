"""
Database Initialization Script for Suvidha Platform
Creates all 21 tables and pre-populates with 10 realistic users and related data.
Run: python init_db.py
"""

import os
import sys
from datetime import datetime, timedelta, date
from werkzeug.security import generate_password_hash
import uuid

# Setup Flask app context
from flask import Flask

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

from models import (db, User, Vendor, Community, CommunityStats, Bill, ServiceReport,
                    GovOfficial, Grievance, MeterReading, RWAProject, AuditLog,
                    FieldOperation, WardStats, ParticipationScheme, Redemption,
                    FieldAgent, TaskAssignment, AgentLocationHistory, AgentPerformance,
                    Household, MeterSubmission)

db.init_app(app)

# Ensure instance folder exists
if not os.path.exists('instance'):
    os.makedirs('instance')


def delete_old_db():
    """Delete existing database file"""
    db_path = os.path.join('instance', 'suvidha.db')
    if os.path.exists(db_path):
        os.remove(db_path)
        print("✗ Deleted old database")
    else:
        print("  No existing database found")


def create_tables():
    """Create all 21 tables"""
    db.create_all()
    print("✓ Created all 21 tables")


# ============================================
# 1. VENDORS (12 default utility providers)
# ============================================
def seed_vendors():
    vendors_data = [
        # Electricity
        ('BSES Rajdhani', 'electricity', 'Power distribution for South & West Delhi', '1800-103-3310', 'https://bfrljt.com', 'Delhi'),
        ('BSES Yamuna', 'electricity', 'Power distribution for East & Central Delhi', '1800-103-3311', 'https://bfrljt.com', 'Delhi'),
        ('Tata Power DDL', 'electricity', 'Power distribution for North & Northwest Delhi', '1800-208-9100', 'https://tatapower-ddl.com', 'Delhi'),
        ('UPPCL', 'electricity', 'Uttar Pradesh Power Corporation Limited', '1800-180-8752', 'https://uppcl.org', 'Uttar Pradesh'),
        # Water
        ('Delhi Jal Board', 'water', 'Water supply and sewage services for Delhi', '1916', 'https://delhijalboard.nic.in', 'Delhi'),
        ('Haryana Water Supply', 'water', 'Water supply for Haryana state', '1800-180-0707', None, 'Haryana'),
        ('UP Jal Nigam', 'water', 'Water supply for UP', '1800-180-5555', None, 'Uttar Pradesh'),
        ('Rajasthan PHED', 'water', 'Public Health Engineering Dept, Rajasthan', None, None, 'Rajasthan'),
        # Gas
        ('Indraprastha Gas', 'gas', 'PNG and CNG supply for Delhi-NCR', '1800-102-5109', 'https://iglonline.net', 'Delhi'),
        ('Mahanagar Gas', 'gas', 'PNG supply for Mumbai region', '1800-209-4545', 'https://mahanagargas.com', 'Maharashtra'),
        ('Adani Gas', 'gas', 'City gas distribution', '1800-233-3737', 'https://adanigas.com', 'Multiple'),
        ('GAIL Gas', 'gas', 'City gas distribution by GAIL', '1800-180-7270', 'https://gailgas.com', 'Multiple'),
    ]
    
    vendors = []
    for name, stype, desc, contact, website, coverage in vendors_data:
        v = Vendor(name=name, service_type=stype, description=desc,
                   contact=contact, website=website, coverage_areas=coverage)
        vendors.append(v)
    db.session.add_all(vendors)
    db.session.commit()
    print(f"✓ Created {len(vendors)} vendors")
    return vendors


# ============================================
# 2. USERS (5 citizens: 3 general + 2 senior)
# ============================================
def seed_users(vendors):
    elec_id = vendors[0].id  # BSES Rajdhani
    water_id = vendors[4].id  # Delhi Jal Board
    gas_id = vendors[8].id    # Indraprastha Gas
    
    users_data = [
        # (name, email, phone, password, user_type, dob, state, city, ward, locality)
        ('Rajesh Kumar', 'rajesh@citizen.in', '9876543210', 'citizen123', 'general', date(1990, 5, 15), 'Delhi', 'New Delhi', 'Ward 15', 'Saket'),
        ('Priya Sharma', 'priya@citizen.in', '9876543211', 'citizen123', 'general', date(1988, 8, 22), 'Delhi', 'New Delhi', 'Ward 15', 'Saket'),
        ('Amit Gupta', 'amit@citizen.in', '9876543212', 'citizen123', 'general', date(1995, 1, 10), 'Delhi', 'New Delhi', 'Ward 8', 'Dwarka'),
        ('Kamla Devi', 'kamla@citizen.in', '9876543213', 'senior123', 'senior_citizen', date(1955, 3, 20), 'Delhi', 'New Delhi', 'Ward 15', 'Saket'),
        ('Ram Prasad', 'ram@citizen.in', '9876543214', 'senior123', 'senior_citizen', date(1952, 11, 5), 'Delhi', 'New Delhi', 'Ward 8', 'Dwarka'),
    ]
    
    users = []
    for name, email, phone, pwd, utype, dob, state, city, ward, locality in users_data:
        u = User(
            full_name=name, email=email, phone=phone,
            password=generate_password_hash(pwd),
            user_type=utype, date_of_birth=dob,
            state=state, city=city, ward=ward, locality=locality,
            electricity_provider_id=elec_id,
            water_provider_id=water_id,
            gas_provider_id=gas_id,
            is_verified=True,
            last_login=datetime.utcnow() - timedelta(hours=2)
        )
        users.append(u)
    db.session.add_all(users)
    db.session.commit()
    print(f"✓ Created {len(users)} citizens (3 general + 2 senior)")
    return users


# ============================================
# 3. COMMUNITIES (one per citizen, 1:1)
# ============================================
def seed_communities(users):
    communities = []
    points_list = [150, 230, 80, 45, 30]
    badges_list = ['eco_warrior', 'eco_warrior,community_champion', '', 'senior_helper', '']
    
    for i, u in enumerate(users):
        c = Community(
            user_id=u.id,
            state=u.state, city=u.city, ward=u.ward, locality=u.locality,
            points_earned=points_list[i],
            challenges_participated=points_list[i] // 30,
            reports_submitted=max(1, points_list[i] // 50),
            is_active=True,
            badges=badges_list[i] if badges_list[i] else None
        )
        communities.append(c)
    db.session.add_all(communities)
    db.session.commit()
    print(f"✓ Created {len(communities)} community memberships")
    return communities


# ============================================
# 4. COMMUNITY STATS (ward-level aggregates)
# ============================================
def seed_community_stats():
    stats_data = [
        ('Delhi', 'New Delhi', 'Ward 15', 'Saket', 342, 280, 12400, 'low', 'medium', 'low'),
        ('Delhi', 'New Delhi', 'Ward 8', 'Dwarka', 518, 410, 18700, 'medium', 'low', 'low'),
        ('Delhi', 'New Delhi', 'Ward 3', 'Civil Lines', 205, 160, 7300, 'low', 'low', 'medium'),
    ]
    
    stats = []
    for state, city, ward, locality, total, active, pts, elec, water, gas in stats_data:
        s = CommunityStats(
            state=state, city=city, ward=ward, locality=locality,
            total_members=total, active_members=active, total_points=pts,
            avg_points_per_member=round(pts / total, 1),
            total_challenges=total // 5,
            electricity_stress_level=elec,
            water_stress_level=water,
            gas_stress_level=gas
        )
        stats.append(s)
    db.session.add_all(stats)
    db.session.commit()
    print(f"✓ Created {len(stats)} community stats")
    return stats


# ============================================
# 5. BILLS (6-8 per citizen across 3 utilities)
# ============================================
def seed_bills(users):
    now = datetime.utcnow()
    bills = []
    
    for u in users:
        # Electricity bills (last 4 months)
        for m in range(4):
            start = now - timedelta(days=30 * (m + 1))
            end = now - timedelta(days=30 * m)
            consumption = round(150 + m * 20 + (hash(u.id + str(m)) % 50), 1)
            amount = round(consumption * 7.5, 0)
            status = 'paid' if m > 0 else 'pending'
            paid_date = end - timedelta(days=5) if status == 'paid' else None
            
            bills.append(Bill(
                user_id=u.id, utility_type='electricity',
                bill_id=f'ELEC-{end.strftime("%Y%m")}-{u.phone[-4:]}',
                amount=amount, consumption=consumption, consumption_unit='kWh',
                billing_period_start=start, billing_period_end=end,
                due_date=end + timedelta(days=15),
                paid_date=paid_date, status=status
            ))
        
        # Water bills (last 3 months)
        for m in range(3):
            start = now - timedelta(days=30 * (m + 1))
            end = now - timedelta(days=30 * m)
            consumption = round(8 + (hash(u.id + 'w' + str(m)) % 6), 1)
            amount = round(consumption * 45, 0)
            status = 'paid' if m > 0 else 'pending'
            paid_date = end - timedelta(days=3) if status == 'paid' else None
            
            bills.append(Bill(
                user_id=u.id, utility_type='water',
                bill_id=f'WATER-{end.strftime("%Y%m")}-{u.phone[-4:]}',
                amount=amount, consumption=consumption, consumption_unit='kL',
                billing_period_start=start, billing_period_end=end,
                due_date=end + timedelta(days=15),
                paid_date=paid_date, status=status
            ))
        
        # Gas bill (last month)
        start = now - timedelta(days=30)
        end = now
        consumption = round(5 + (hash(u.id + 'g') % 4), 1)
        bills.append(Bill(
            user_id=u.id, utility_type='gas',
            bill_id=f'GAS-{end.strftime("%Y%m")}-{u.phone[-4:]}',
            amount=round(consumption * 55, 0), consumption=consumption, consumption_unit='SCM',
            billing_period_start=start, billing_period_end=end,
            due_date=end + timedelta(days=15),
            status='pending'
        ))
    
    db.session.add_all(bills)
    db.session.commit()
    print(f"✓ Created {len(bills)} bills")
    return bills


# ============================================
# 6. SERVICE REPORTS (complaints)
# ============================================
def seed_service_reports(users):
    reports_data = [
        (0, 'complaint', 'electricity', 'Frequent Power Outages', 'Power cuts every evening for 2-3 hours in our area', 'open', 'high'),
        (0, 'service', 'water', 'Low Water Pressure', 'Very low water pressure since last week', 'in_progress', 'medium'),
        (1, 'complaint', 'water', 'Water Quality Issue', 'Water is yellowish and has bad odor', 'open', 'high'),
        (2, 'service', 'gas', 'Gas Connection Request', 'Need new PNG connection for my house', 'resolved', 'low'),
        (3, 'complaint', 'electricity', 'Incorrect Bill Amount', 'Bill shows double the usual consumption', 'open', 'medium'),
        (4, 'service', 'water', 'Pipe Leakage', 'Water pipe leaking near main road', 'in_progress', 'high'),
    ]
    
    reports = []
    for uidx, rtype, utype, title, desc, status, priority in reports_data:
        u = users[uidx]
        r = ServiceReport(
            user_id=u.id,
            report_type=rtype, utility_type=utype,
            title=title, description=desc,
            status=status, priority=priority,
            location=f"{u.locality}, {u.ward}, {u.city}",
            resolved_at=datetime.utcnow() - timedelta(days=2) if status == 'resolved' else None
        )
        reports.append(r)
    db.session.add_all(reports)
    db.session.commit()
    print(f"✓ Created {len(reports)} service reports")
    return reports


# ============================================
# 7. GOV OFFICIALS (3 admins)
# ============================================
def seed_gov_officials():
    officials_data = [
        ('GOV-0001', 'Vikram Singh', 'vikram@gov.in', '+91-9800000001', 'admin123', 'grievance', 'senior_officer', 'admin', 'Delhi', 'South Delhi', 'Ward 15'),
        ('GOV-0002', 'Sunita Verma', 'sunita@gov.in', '+91-9800000002', 'admin123', 'utilities', 'assistant_commissioner', 'supervisor', 'Delhi', 'South Delhi', 'Ward 8'),
        ('GOV-0003', 'Ankit Jain', 'ankit@gov.in', '+91-9800000003', 'admin123', 'audit', 'senior_officer', 'official', 'Delhi', 'Central Delhi', 'Ward 3'),
    ]
    
    officials = []
    for eid, name, email, phone, pwd, dept, desig, role, state, dist, ward in officials_data:
        o = GovOfficial(
            employee_id=eid, full_name=name, email=email, phone=phone,
            password=generate_password_hash(pwd),
            department=dept, designation=desig, role=role,
            assigned_state=state, assigned_district=dist, assigned_ward=ward,
            is_active=True, is_verified=True,
            last_login=datetime.utcnow() - timedelta(hours=1),
            grievances_handled=45, grievances_resolved=38,
            avg_resolution_time=4.2, satisfaction_score=87.5
        )
        officials.append(o)
    db.session.add_all(officials)
    db.session.commit()
    print(f"✓ Created {len(officials)} government officials")
    return officials


# ============================================
# 8. GRIEVANCES
# ============================================
def seed_grievances(users, officials):
    now = datetime.utcnow()
    grievances_data = [
        ('electricity', 'outage', 'Major Power Outage in Ward 15', 'Complete blackout since 6 PM', 'pending', 'high', 4, 12),
        ('water', 'quality', 'Contaminated Water Supply', 'Water has unusual color and smell', 'assigned', 'critical', 5, 6),
        ('electricity', 'billing', 'Overbilling Complaint', 'Bill amount is 3x normal', 'in_progress', 'medium', 3, 24),
        ('gas', 'leak', 'Gas Leak Near School', 'Strong gas smell near children school', 'escalated', 'critical', 5, 4),
        ('water', 'pressure', 'No Water Supply for 3 Days', 'No water coming from taps', 'resolved', 'high', 4, 12),
        ('electricity', 'meter', 'Faulty Meter Reading', 'Meter spinning even when all appliances off', 'pending', 'medium', 3, 24),
    ]
    
    grievances = []
    for i, (utility, cat, title, desc, status, severity, priority, sla) in enumerate(grievances_data):
        u = users[i % len(users)]
        g = Grievance(
            grievance_id=f'GRV-2026-{str(i+1).zfill(5)}',
            user_id=u.id,
            complainant_name=u.full_name, complainant_phone=u.phone,
            state='Delhi', district='South Delhi',
            ward=u.ward, locality=u.locality,
            utility_type=utility, category=cat,
            title=title, description=desc,
            status=status, severity=severity, priority=priority,
            sla_hours=sla,
            sla_deadline=now + timedelta(hours=sla) if status != 'resolved' else now - timedelta(hours=2),
            sla_breached=(status == 'escalated'),
            assigned_official_id=officials[0].id,
            assigned_at=now - timedelta(hours=3),
            resolved_at=now - timedelta(hours=1) if status == 'resolved' else None,
            resolution_notes='Water supply restored after pump repair' if status == 'resolved' else None,
            resolution_time_hours=8.5 if status == 'resolved' else None
        )
        grievances.append(g)
    db.session.add_all(grievances)
    db.session.commit()
    print(f"✓ Created {len(grievances)} grievances")
    return grievances


# ============================================
# 9. METER READINGS
# ============================================
def seed_meter_readings(officials):
    now = datetime.utcnow()
    readings = []
    for i in range(5):
        r = MeterReading(
            meter_id=f'MTR-{5001+i}',
            ward=f'Ward {15 if i < 3 else 8}',
            locality='Saket' if i < 3 else 'Dwarka',
            reading_value=round(250 + i * 30.5, 1),
            reading_unit='kWh' if i < 3 else 'kL',
            utility_type='electricity' if i < 3 else 'water',
            ai_confidence=round(92 + i * 1.5, 1),
            status='verified' if i < 3 else 'review',
            reading_time=now - timedelta(days=i),
            verified_at=now - timedelta(days=i, hours=2) if i < 3 else None,
            verified_by=officials[0].id if i < 3 else None
        )
        readings.append(r)
    db.session.add_all(readings)
    db.session.commit()
    print(f"✓ Created {len(readings)} meter readings")
    return readings


# ============================================
# 10. RWA PROJECTS
# ============================================
def seed_rwa_projects(officials):
    now = datetime.utcnow()
    projects_data = [
        ('Community Park Renovation', 'Saket RWA', 'Ward 15', 500000, 320000, 'Green Spaces', 65, 'in_progress'),
        ('Street Lighting Upgrade', 'Dwarka RWA', 'Ward 8', 300000, 300000, 'Street Lighting', 100, 'completed'),
        ('Water Tank Installation', 'Civil Lines RWA', 'Ward 3', 800000, 150000, 'Water Supply', 20, 'delayed'),
    ]
    
    projects = []
    for name, rwa, ward, budget, utilized, purpose, progress, status in projects_data:
        p = RWAProject(
            project_name=name, rwa_name=rwa, ward=ward,
            allocated_budget=budget, utilized_budget=utilized,
            purpose=purpose, progress=progress, status=status,
            start_date=now - timedelta(days=90),
            deadline=now + timedelta(days=60),
            completed_date=now - timedelta(days=10) if status == 'completed' else None,
            supervised_by=officials[1].id
        )
        projects.append(p)
    db.session.add_all(projects)
    db.session.commit()
    print(f"✓ Created {len(projects)} RWA projects")
    return projects


# ============================================
# 11. AUDIT LOGS
# ============================================
def seed_audit_logs(officials):
    now = datetime.utcnow()
    logs_data = [
        ('Grievance Resolved', 'success', officials[0], 'Resolved after field inspection', 'GRV-2026-00005', 'Normal'),
        ('Complaint Escalated', 'danger', officials[0], 'SLA breach — escalated to commissioner', 'GRV-2026-00004', 'High'),
        ('Meter Reading Approved', 'success', officials[0], 'AI confidence 95%+, auto-approved', 'MTR-5001', 'Normal'),
        ('Policy Updated', 'warning', officials[2], 'Water tariff schedule revised', None, 'High'),
        ('Report Generated', 'info', officials[2], 'Monthly ward performance report', None, 'Normal'),
    ]
    
    logs = []
    for i, (action, atype, official, reason, related, severity) in enumerate(logs_data):
        l = AuditLog(
            log_id=f'LOG-{now.strftime("%Y%m%d")}-{str(i+1).zfill(5)}',
            action=action, action_type=atype,
            official_id=official.id, official_name=official.full_name,
            department=official.department,
            reason=reason, related_id=related,
            severity=severity, source='System' if i == 2 else 'Manual',
            timestamp=now - timedelta(hours=i * 3)
        )
        logs.append(l)
    db.session.add_all(logs)
    db.session.commit()
    print(f"✓ Created {len(logs)} audit logs")
    return logs


# ============================================
# 12. FIELD AGENTS (2 workers)
# ============================================
def seed_field_agents(officials):
    agents_data = [
        ('FA-0001', 'Deepak Yadav', 'deepak@worker.in', '9700000001', 'worker123', 'electric_meter', 'Delhi', 'South Delhi', 'Ward 15'),
        ('FA-0002', 'Neha Patel', 'neha@worker.in', '9700000002', 'worker123', 'water_meter', 'Delhi', 'South Delhi', 'Ward 8'),
    ]
    
    agents = []
    for eid, name, email, phone, pwd, cat, state, dist, ward in agents_data:
        a = FieldAgent(
            employee_id=eid, full_name=name, email=email, phone=phone,
            password=generate_password_hash(pwd),
            category=cat, supervisor_id=officials[0].id,
            assigned_state=state, assigned_district=dist, assigned_ward=ward,
            status='online', is_active=True, is_verified=True,
            gps_enabled=True,
            current_latitude=28.5245 if ward == 'Ward 15' else 28.5921,
            current_longitude=77.2066 if ward == 'Ward 15' else 77.0460,
            current_address=f'{ward}, Delhi',
            location_updated_at=datetime.utcnow(),
            performance_score=72.5 if cat == 'electric_meter' else 68.0,
            tasks_completed_today=3,
            total_tasks_completed=145 if cat == 'electric_meter' else 98,
            avg_task_time=18.5,
            last_login=datetime.utcnow() - timedelta(minutes=30)
        )
        agents.append(a)
    db.session.add_all(agents)
    db.session.commit()
    print(f"✓ Created {len(agents)} field agents")
    return agents


# ============================================
# 13. FIELD OPERATIONS
# ============================================
def seed_field_operations(officials, agents):
    now = datetime.utcnow()
    ops_data = [
        ('inspection', 'electricity', 'Ward 15', 'Saket', 'Routine meter inspection', officials[0].id, agents[0].id, 'completed'),
        ('repair', 'water', 'Ward 8', 'Dwarka', 'Fix leaking water pipe', officials[1].id, agents[1].id, 'in_progress'),
        ('maintenance', 'gas', 'Ward 15', 'Saket', 'Annual gas line check', officials[0].id, agents[0].id, 'scheduled'),
        ('emergency', 'electricity', 'Ward 3', 'Civil Lines', 'Transformer overload', officials[0].id, None, 'scheduled'),
    ]
    
    ops = []
    for i, (otype, utility, ward, locality, desc, off_id, agent_id, status) in enumerate(ops_data):
        o = FieldOperation(
            operation_id=f'FOP-2026-{str(i+1).zfill(5)}',
            operation_type=otype, utility_type=utility,
            description=desc, ward=ward, locality=locality,
            address=f'{locality}, {ward}, Delhi',
            assigned_official_id=off_id, field_agent_id=agent_id,
            status=status, priority='high' if otype == 'emergency' else 'medium',
            scheduled_date=now + timedelta(days=i),
            start_time=now - timedelta(hours=2) if status in ['completed', 'in_progress'] else None,
            end_time=now - timedelta(hours=1) if status == 'completed' else None
        )
        ops.append(o)
    db.session.add_all(ops)
    db.session.commit()
    print(f"✓ Created {len(ops)} field operations")
    return ops


# ============================================
# 14. WARD STATS
# ============================================
def seed_ward_stats():
    stats_data = [
        ('Ward 15', 'Ward 15 - Saket', 45, 8, 32, 2, 3.5, 82.0, 72.0, 12, 18, 5, 'low', 'medium', 'low', 0, '+2.5%'),
        ('Ward 8', 'Ward 8 - Dwarka', 62, 15, 40, 5, 5.2, 74.0, 65.0, 20, 25, 8, 'medium', 'high', 'low', 1, '-1.2%'),
        ('Ward 3', 'Ward 3 - Civil Lines', 28, 5, 20, 1, 2.8, 90.0, 80.0, 8, 10, 3, 'low', 'low', 'low', 0, '+4.0%'),
    ]
    
    ws_list = []
    for ward, name, total, pending, resolved, sla, avg_time, sat, part, elec_c, water_c, gas_c, elec_s, water_s, gas_s, outages, trend in stats_data:
        ws = WardStats(
            ward=ward, ward_name=name,
            total_complaints=total, pending_complaints=pending, resolved_complaints=resolved,
            sla_breaches=sla, avg_resolution_time=avg_time,
            satisfaction_score=sat, participation_rate=part,
            electricity_complaints=elec_c, water_complaints=water_c, gas_complaints=gas_c,
            electricity_stress=elec_s, water_stress=water_s, gas_stress=gas_s,
            active_outages=outages, trend=trend
        )
        ws_list.append(ws)
    db.session.add_all(ws_list)
    db.session.commit()
    print(f"✓ Created {len(ws_list)} ward stats")
    return ws_list


# ============================================
# 15. PARTICIPATION SCHEMES
# ============================================
def seed_participation_schemes():
    schemes_data = [
        ('Save Power Challenge', 12, 4500, 68.0, 15, 250000, 180000, 'high', 'low'),
        ('Water Conservation Drive', 8, 2800, 55.0, 20, 180000, 120000, 'medium', 'low'),
        ('Community Clean-Up', 15, 6200, 78.0, 10, 100000, 85000, 'high', 'medium'),
    ]
    
    schemes = []
    for name, wards, participants, rate, cost, budget, utilized, impact, abuse in schemes_data:
        s = ParticipationScheme(
            scheme_name=name, active_wards=wards,
            total_participants=participants, participation_rate=rate,
            cost_per_engagement=cost, total_budget=budget, utilized_budget=utilized,
            impact_status=impact, abuse_rate=abuse, is_active=True
        )
        schemes.append(s)
    db.session.add_all(schemes)
    db.session.commit()
    print(f"✓ Created {len(schemes)} participation schemes")
    return schemes


# ============================================
# 16. REDEMPTIONS
# ============================================
def seed_redemptions(officials):
    redemptions_data = [
        ('Rajesh Kumar', 'Shopping Voucher', 100, 'Ward 15', True),
        ('Priya Sharma', 'Bus Pass', 150, 'Ward 15', True),
        ('Amit Gupta', 'Electricity Credit', 200, 'Ward 8', False),
    ]
    
    redemptions = []
    for name, reward, points, ward, verified in redemptions_data:
        r = Redemption(
            user_name=name, reward_type=reward,
            points_used=points, ward=ward,
            is_verified=verified,
            verified_by=officials[1].id if verified else None
        )
        redemptions.append(r)
    db.session.add_all(redemptions)
    db.session.commit()
    print(f"✓ Created {len(redemptions)} redemptions")
    return redemptions


# ============================================
# 17. TASK ASSIGNMENTS (for field agents)
# ============================================
def seed_task_assignments(agents, officials):
    now = datetime.utcnow()
    tasks_data = [
        (agents[0].id, 'electric_meter', 'H-15', 'Ward 15', 'New Delhi', 'Read electricity meter', 'completed', 'normal'),
        (agents[0].id, 'electric_meter', 'H-22', 'Ward 15', 'New Delhi', 'Read electricity meter', 'in_progress', 'high'),
        (agents[0].id, 'electric_meter', 'H-30', 'Ward 15', 'New Delhi', 'Read electricity meter', 'pending', 'normal'),
        (agents[1].id, 'water_meter', 'H-45', 'Ward 8', 'New Delhi', 'Read water meter', 'completed', 'normal'),
        (agents[1].id, 'water_meter', 'H-52', 'Ward 8', 'New Delhi', 'Read water meter', 'pending', 'urgent'),
    ]
    
    tasks = []
    for i, (agent_id, ttype, house, ward, city, desc, status, priority) in enumerate(tasks_data):
        t = TaskAssignment(
            task_id=f'TASK-{now.strftime("%Y%m%d")}-{str(i+1).zfill(5)}',
            agent_id=agent_id, assigned_by=officials[0].id,
            task_type=ttype, house_number=house,
            ward=ward, city=city,
            full_address=f'{house}, {ward}, {city}',
            latitude=28.52 + i * 0.002, longitude=77.20 + i * 0.003,
            description=desc, priority=priority, status=status,
            assigned_at=now - timedelta(hours=6),
            started_at=now - timedelta(hours=4) if status in ['completed', 'in_progress'] else None,
            arrived_at=now - timedelta(hours=3, minutes=30) if status in ['completed', 'in_progress'] else None,
            completed_at=now - timedelta(hours=2) if status == 'completed' else None,
            completion_time_minutes=25 if status == 'completed' else None,
            meter_reading=342.5 if status == 'completed' and ttype == 'electric_meter' else (15.2 if status == 'completed' else None),
            meter_id=f'MTR-{5010+i}'
        )
        tasks.append(t)
    db.session.add_all(tasks)
    db.session.commit()
    print(f"✓ Created {len(tasks)} task assignments")
    return tasks


# ============================================
# 18. AGENT LOCATION HISTORY (GPS trail)
# ============================================
def seed_location_history(agents, tasks):
    now = datetime.utcnow()
    locations = []
    
    # GPS trail for agent Neha (water meter)
    trail = [
        (28.5921, 77.0460, 'Office, Dwarka', 95.0, 'traveling', None),
        (28.5935, 77.0475, 'Block A, Dwarka', 12.0, 'traveling', tasks[3].id if len(tasks) > 3 else None),
        (28.5942, 77.0482, 'H-45, Block A, Dwarka', 5.0, 'arrived', tasks[3].id if len(tasks) > 3 else None),
        (28.5942, 77.0482, 'H-45, Block A, Dwarka', 3.0, 'working', tasks[3].id if len(tasks) > 3 else None),
        (28.5950, 77.0490, 'Block B, Dwarka', 8.0, 'traveling', tasks[4].id if len(tasks) > 4 else None),
    ]
    
    for i, (lat, lng, addr, acc, activity, task_id) in enumerate(trail):
        loc = AgentLocationHistory(
            agent_id=agents[1].id,
            latitude=lat, longitude=lng, address=addr,
            accuracy=acc, activity=activity, task_id=task_id,
            timestamp=now - timedelta(hours=5-i, minutes=i*10)
        )
        locations.append(loc)
    
    db.session.add_all(locations)
    db.session.commit()
    print(f"✓ Created {len(locations)} GPS location records")
    return locations


# ============================================
# 19. AGENT PERFORMANCE (monthly scores)
# ============================================
def seed_agent_performance(agents):
    now = datetime.utcnow()
    perfs = []
    
    for agent in agents:
        is_electric = agent.category == 'electric_meter'
        p = AgentPerformance(
            agent_id=agent.id,
            month=now.month, year=now.year,
            tasks_assigned=48 if is_electric else 35,
            tasks_completed=42 if is_electric else 30,
            tasks_failed=2 if is_electric else 1,
            completion_rate=87.5 if is_electric else 85.7,
            avg_completion_time=18.5 if is_electric else 22.0,
            on_time_rate=91.0 if is_electric else 88.0,
            problems_flagged=3 if is_electric else 2,
            photos_uploaded=40 if is_electric else 28,
            photo_compliance_rate=95.2 if is_electric else 93.3,
            feedback_count=15 if is_electric else 10,
            avg_rating=4.2 if is_electric else 4.0,
            score=72.5 if is_electric else 68.0,
            rating='good' if is_electric else 'average',
            score_change=3.5 if is_electric else -1.2,
            score_factors='{"task_completion": "+5", "on_time": "+3", "photo_quality": "+2", "problems_flagged": "-1"}'
        )
        perfs.append(p)
    
    db.session.add_all(perfs)
    db.session.commit()
    print(f"✓ Created {len(perfs)} agent performance records")
    return perfs


# ============================================
# 20. HOUSEHOLDS
# ============================================
def seed_households():
    hh_data = [
        ('H-15', 'Ward 15', 'South Delhi', 'Delhi', 'Saket', 'H-15, B-Block, Saket, Delhi', 'B-Block', None, 28.524, 77.206, 'Rajesh Kumar', '9876543210', 4, 'general', 'MTR-5010', 'electric'),
        ('H-22', 'Ward 15', 'South Delhi', 'Delhi', 'Saket', 'H-22, C-Block, Saket, Delhi', 'C-Block', None, 28.526, 77.208, 'Priya Sharma', '9876543211', 3, 'general', 'MTR-5011', 'electric'),
        ('H-30', 'Ward 15', 'South Delhi', 'Delhi', 'Saket', 'H-30, D-Block, Saket, Delhi', 'D-Block', None, 28.528, 77.210, 'Kamla Devi', '9876543213', 2, 'senior_citizen', 'MTR-5012', 'electric'),
        ('H-45', 'Ward 8', 'South Delhi', 'Delhi', 'Dwarka', 'H-45, A-Block, Dwarka, Delhi', 'A-Block', 'Sector 7', 28.594, 77.048, 'Amit Gupta', '9876543212', 5, 'general', 'MTR-5013', 'water'),
        ('H-52', 'Ward 8', 'South Delhi', 'Delhi', 'Dwarka', 'H-52, B-Block, Dwarka, Delhi', 'B-Block', 'Sector 7', 28.595, 77.049, 'Ram Prasad', '9876543214', 2, 'senior_citizen', 'MTR-5014', 'water'),
    ]
    
    households = []
    for house, ward, dist, state, locality, addr, block, sector, lat, lng, name, phone, num, cat, meter, mtype in hh_data:
        h = Household(
            house_number=house, ward=ward, district=dist, state=state,
            locality=locality, full_address=addr, block=block, sector=sector,
            latitude=lat, longitude=lng,
            resident_name=name, contact_phone=phone,
            num_residents=num, resident_category=cat,
            meter_id=meter, meter_type=mtype,
            is_active=True, connection_status='active'
        )
        households.append(h)
    db.session.add_all(households)
    db.session.commit()
    print(f"✓ Created {len(households)} households")
    return households


# ============================================
# 21. METER SUBMISSIONS (field readings + photos)
# ============================================
def seed_meter_submissions(agents, tasks, households, officials):
    now = datetime.utcnow()
    subs = []
    
    # Agent Deepak completed task 0 (electric meter at H-15)
    subs.append(MeterSubmission(
        submission_id=f'SUB-{now.strftime("%Y%m%d")}-00001',
        task_id=tasks[0].id, agent_id=agents[0].id,
        household_id=households[0].id,
        meter_reading=342.5, meter_type='electric', reading_unit='kWh',
        latitude=28.524, longitude=77.206,
        address='H-15, B-Block, Saket, Delhi',
        status='verified', submission_type='reading',
        verified_by=officials[0].id,
        verified_at=now - timedelta(hours=1),
        ai_confidence=97.5,
        submitted_at=now - timedelta(hours=2)
    ))
    
    # Agent Neha completed task 3 (water meter at H-45)
    subs.append(MeterSubmission(
        submission_id=f'SUB-{now.strftime("%Y%m%d")}-00002',
        task_id=tasks[3].id, agent_id=agents[1].id,
        household_id=households[3].id,
        meter_reading=15.2, meter_type='water', reading_unit='kL',
        latitude=28.594, longitude=77.048,
        address='H-45, A-Block, Dwarka, Delhi',
        status='submitted', submission_type='reading',
        ai_confidence=94.0,
        submitted_at=now - timedelta(hours=1)
    ))
    
    # A skipped submission
    subs.append(MeterSubmission(
        submission_id=f'SUB-{now.strftime("%Y%m%d")}-00003',
        agent_id=agents[0].id,
        household_id=households[2].id,
        meter_type='electric', reading_unit='kWh',
        latitude=28.528, longitude=77.210,
        address='H-30, D-Block, Saket, Delhi',
        status='submitted', submission_type='skip',
        skip_reason='Resident not available, house locked',
        ai_confidence=100.0,
        submitted_at=now - timedelta(minutes=30)
    ))
    
    db.session.add_all(subs)
    db.session.commit()
    print(f"✓ Created {len(subs)} meter submissions")
    return subs


# ============================================
# MAIN EXECUTION
# ============================================
def run():
    print("\n" + "=" * 50)
    print("  SUVIDHA DATABASE INITIALIZATION")
    print("=" * 50 + "\n")
    
    delete_old_db()
    
    with app.app_context():
        create_tables()
        print()
        
        # Seed in dependency order
        vendors = seed_vendors()
        users = seed_users(vendors)
        communities = seed_communities(users)
        community_stats = seed_community_stats()
        bills = seed_bills(users)
        reports = seed_service_reports(users)
        officials = seed_gov_officials()
        grievances = seed_grievances(users, officials)
        readings = seed_meter_readings(officials)
        projects = seed_rwa_projects(officials)
        audit_logs = seed_audit_logs(officials)
        agents = seed_field_agents(officials)
        field_ops = seed_field_operations(officials, agents)
        ward_stats = seed_ward_stats()
        schemes = seed_participation_schemes()
        redemptions = seed_redemptions(officials)
        tasks = seed_task_assignments(agents, officials)
        locations = seed_location_history(agents, tasks)
        perf = seed_agent_performance(agents)
        households = seed_households()
        submissions = seed_meter_submissions(agents, tasks, households, officials)
        
        # Print summary
        print("\n" + "=" * 50)
        print("  DATABASE READY!")
        print("=" * 50)
        print()
        print("  Pre-built login credentials:")
        print("  ─────────────────────────────")
        print("  CITIZENS:")
        print("    rajesh@citizen.in / citizen123")
        print("    priya@citizen.in  / citizen123")
        print("    amit@citizen.in   / citizen123")
        print("  SENIORS:")
        print("    kamla@citizen.in  / senior123")
        print("    ram@citizen.in    / senior123")
        print("  ADMINS:")
        print("    vikram@gov.in (GOV-0001) / admin123")
        print("    sunita@gov.in (GOV-0002) / admin123")
        print("    ankit@gov.in  (GOV-0003) / admin123")
        print("  WORKERS:")
        print("    deepak@worker.in (FA-0001) / worker123")
        print("    neha@worker.in   (FA-0002) / worker123")
        print()
        
        # Table counts
        table_counts = {
            'vendors': Vendor.query.count(),
            'users': User.query.count(),
            'communities': Community.query.count(),
            'community_stats': CommunityStats.query.count(),
            'bills': Bill.query.count(),
            'service_reports': ServiceReport.query.count(),
            'gov_officials': GovOfficial.query.count(),
            'grievances': Grievance.query.count(),
            'meter_readings': MeterReading.query.count(),
            'rwa_projects': RWAProject.query.count(),
            'audit_logs': AuditLog.query.count(),
            'field_agents': FieldAgent.query.count(),
            'field_operations': FieldOperation.query.count(),
            'ward_stats': WardStats.query.count(),
            'participation_schemes': ParticipationScheme.query.count(),
            'redemptions': Redemption.query.count(),
            'task_assignments': TaskAssignment.query.count(),
            'agent_location_history': AgentLocationHistory.query.count(),
            'agent_performance': AgentPerformance.query.count(),
            'households': Household.query.count(),
            'meter_submissions': MeterSubmission.query.count(),
        }
        
        print("  Table row counts:")
        print("  ─────────────────")
        for table, count in table_counts.items():
            print(f"    {table:<30} {count:>5} rows")
        
        total = sum(table_counts.values())
        print(f"\n  Total: {total} rows across {len(table_counts)} tables")
        print()


if __name__ == '__main__':
    run()
