# Citizen Portal - Database Integration Guide

## Overview
The SUVIDHA citizen portal is fully integrated with the SQLite backend database. All user data, bills, service reports, and community information are stored and retrieved from the database.

---

## Database Models Used

### 1. **User Model** (Primary Citizen Data)
```python
class User(db.Model):
    - id: Unique identifier
    - full_name: User's full name
    - email: Email address (unique)
    - phone: Phone number (unique)
    - password: Hashed password
    - user_type: 'general' or 'senior_citizen'
    - preferred_language: en, hi, ta, te, bn
    - aadhaar: Aadhaar number (optional)
    - date_of_birth: Date of birth
    - state, city, ward, locality: Location data
    - electricity_provider_id, water_provider_id, gas_provider_id: References to utility vendors
    - alerts_enabled: Boolean for notifications
    - is_verified: Email verified status
    - account_created: Account creation timestamp
    - last_login: Last login timestamp
```

### 2. **Bill Model** (Utility Bills)
```python
class Bill(db.Model):
    - id: Unique identifier
    - user_id: References User
    - utility_type: 'electricity', 'water', or 'gas'
    - bill_id: Unique bill reference
    - consumption: Amount consumed (kWh, kL, SCM)
    - amount: Bill amount
    - due_date: Payment due date
    - status: 'pending', 'paid', 'overdue'
    - created_at: Bill creation date
```

### 3. **ServiceReport Model** (Service Requests/Complaints)
```python
class ServiceReport(db.Model):
    - id: Unique identifier
    - user_id: References User
    - report_type: Type of complaint
    - utility_type: 'electricity', 'water', 'gas', 'general'
    - description: Complaint details
    - status: 'open', 'in_progress', 'resolved', 'closed'
    - priority: 'low', 'medium', 'high', 'critical'
    - created_at: Report creation date
    - updated_at: Last update timestamp
```

### 4. **Community Model** (Community Engagement)
```python
class Community(db.Model):
    - id: Unique identifier
    - user_id: References User (one-to-one)
    - points_earned: Community participation points
    - challenges_participated: Number of challenges joined
    - reports_submitted: Environmental reports submitted
    - badges: Earned badges (comma-separated)
    - created_at: Community membership date
```

### 5. **Vendor Model** (Service Providers)
```python
class Vendor(db.Model):
    - id: Unique identifier
    - name: Vendor name
    - service_type: 'electricity', 'water', 'gas'
    - description: Service description
    - contact: Contact information
    - website: Website URL
    - availability: 'active' or 'inactive'
    - coverage_areas: Service coverage areas
```

---

## API Endpoints - Complete Database Integration

### 🔐 Authentication Endpoints
| Endpoint | Method | Database Operation | Data Stored |
|----------|--------|-------------------|------------|
| `/api/auth/signup` | POST | CREATE User | Full user profile, location, preferences |
| `/api/auth/login` | POST | READ User | Session user_id |
| `/api/auth/logout` | POST | UPDATE User | last_login timestamp |
| `/api/auth/forgot-password` | POST | UPDATE User | password_reset_token |

**Example - Signup**
```python
@app.route('/api/auth/signup', methods=['POST'])
def signup():
    # Creates new User record in database
    # Stores: full_name, email, phone, password_hash, location, language, providers
    user = User(
        full_name=data['fullName'],
        email=data['email'],
        phone=data['phone'],
        password=generate_password_hash(data['password']),
        state=data['state'],
        city=data['city'],
        ward=data['ward'],
        locality=data['locality'],
        preferred_language=data.get('language', 'en'),
        electricity_provider_id=data.get('electricityProvider'),
        water_provider_id=data.get('waterProvider'),
        gas_provider_id=data.get('gasProvider')
    )
    db.session.add(user)
    db.session.commit()
```

---

### 📊 Dashboard Endpoints
| Endpoint | Method | Database Query | Returns |
|----------|--------|---------------|---------|
| `/api/dashboard` | GET | Multi-table JOIN | User profile + all consumption data |
| `/api/utilities` | GET | Bill.query by utility_type | Current bills for each utility |
| `/api/insights` | GET | Bill.query + aggregate | Consumption trends & analysis |
| `/api/records` | GET | Bill.query all | Complete bill history |

**Example - Dashboard**
```python
@app.route('/api/dashboard')
def dashboard():
    user = User.query.get(session.get('user_id'))
    
    # Fetch latest bills for each utility
    electricity_bill = Bill.query.filter_by(
        user_id=user.id,
        utility_type='electricity'
    ).order_by(Bill.created_at.desc()).first()
    
    # Fetch service reports stats
    open_reports = ServiceReport.query.filter_by(
        user_id=user.id,
        status='open'
    ).count()
    
    # Fetch community data
    community = Community.query.filter_by(user_id=user.id).first()
    
    # Return aggregated dashboard data
    return {
        'user': user.to_dict(),
        'consumption': {
            'electricity': electricity_bill.to_dict() if electricity_bill else {},
            'water': water_bill.to_dict() if water_bill else {},
            'gas': gas_bill.to_dict() if gas_bill else {}
        },
        'reports': {
            'open': open_reports,
            'resolved': resolved_reports
        },
        'community': community.to_dict() if community else {}
    }
```

---

### 💰 Bills & Payment Endpoints
| Endpoint | Method | Database Operation | Data |
|----------|--------|-------------------|------|
| `/api/utilities` | GET | SELECT bill WHERE user_id | All bills grouped by utility |
| `/api/bills/<bill_id>` | GET | SELECT bill BY id | Single bill details |
| `/api/bills/pay` | POST | UPDATE bill.status | Mark bill as paid |

**Example - Get Utilities/Bills**
```python
@app.route('/api/utilities')
def get_utilities():
    user_id = session.get('user_id')
    
    # Fetch bills by utility type
    electricity = Bill.query.filter_by(
        user_id=user_id,
        utility_type='electricity'
    ).order_by(Bill.created_at.desc()).all()
    
    water = Bill.query.filter_by(
        user_id=user_id,
        utility_type='water'
    ).order_by(Bill.created_at.desc()).all()
    
    gas = Bill.query.filter_by(
        user_id=user_id,
        utility_type='gas'
    ).order_by(Bill.created_at.desc()).all()
    
    return jsonify({
        'electricity': [bill.to_dict() for bill in electricity],
        'water': [bill.to_dict() for bill in water],
        'gas': [bill.to_dict() for bill in gas]
    })
```

---

### 📝 Service Reports/Complaints Endpoints
| Endpoint | Method | Database Operation | Stores |
|----------|--------|-------------------|--------|
| `/api/services/submit` | POST | CREATE ServiceReport | Complaint/service request |
| `/api/services/list` | GET | SELECT ServiceReport | All reports for user |
| `/api/services/<id>` | GET | SELECT ServiceReport | Single report details |
| `/api/services/<id>/update` | PUT | UPDATE ServiceReport | Status, resolution notes |

**Example - Submit Service Report**
```python
@app.route('/api/services/submit', methods=['POST'])
def submit_service():
    user_id = session.get('user_id')
    data = request.get_json()
    
    # Create new service report in database
    report = ServiceReport(
        user_id=user_id,
        report_type=data.get('report_type'),
        utility_type=data.get('utility_type'),
        description=data.get('description'),
        status='open',
        priority=data.get('priority', 'medium')
    )
    
    db.session.add(report)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'report_id': report.id,
        'message': 'Service request submitted'
    })
```

---

### 👥 Community Endpoints
| Endpoint | Method | Database Operation | Returns |
|----------|--------|-------------------|---------|
| `/api/community` | GET | SELECT Community | Community stats & info |
| `/api/community/members` | GET | SELECT all Community | Member list (public) |
| `/api/community/stats` | GET | AGGREGATE Community | Leaderboard & stats |
| `/api/community/update-points` | POST | UPDATE Community | Award points for activities |

**Example - Get Community Data**
```python
@app.route('/api/community')
def get_community():
    user_id = session.get('user_id')
    
    # Fetch user's community record
    community = Community.query.filter_by(user_id=user_id).first()
    
    if not community:
        return jsonify({'error': 'Community record not found'}), 404
    
    return jsonify({
        'points_earned': community.points_earned,
        'challenges_participated': community.challenges_participated,
        'reports_submitted': community.reports_submitted,
        'badges': community.badges.split(',') if community.badges else [],
        'rank': calculate_rank(community.points_earned)
    })
```

---

### 👤 Profile Endpoints
| Endpoint | Method | Database Operation | Returns |
|----------|--------|-------------------|---------|
| `/api/profile` | GET | SELECT User | Complete user profile |
| `/api/users/<id>` | GET | SELECT User by id | User details |
| `/api/users/<id>` | PUT | UPDATE User | Save profile changes |

**Example - Get User Profile**
```python
@app.route('/api/profile')
def get_profile():
    user_id = session.get('user_id')
    user = User.query.get(user_id)
    
    return jsonify({
        'name': user.full_name,
        'email': user.email,
        'phone': user.phone,
        'state': user.state,
        'city': user.city,
        'ward': user.ward,
        'locality': user.locality,
        'alerts_enabled': user.alerts_enabled,
        'preferred_language': user.preferred_language,
        'date_of_birth': user.date_of_birth.isoformat() if user.date_of_birth else None
    })
```

---

## Frontend-to-Backend Data Flow

### Example: Dashboard Loading
```
1. User logs in → Session created with user_id
2. Dashboard page loads
3. AngularJS controller calls: ApiService.getDashboardData()
4. GET /api/dashboard (Session: user_id) 
5. Backend queries:
   - User.query.get(user_id) → Get user profile
   - Bill.query.filter_by(user_id=user_id) → Get all bills
   - ServiceReport.query.filter_by(user_id=user_id) → Get reports
   - Community.query.filter_by(user_id=user_id) → Get community data
6. Response returned with all aggregated data
7. AngularJS binds data to templates
8. UI displays user information, consumption, and stats
```

### Example: Service Report Submission
```
1. User fills complaint form on dashboard
2. Form submit → $http.post('/api/services/submit', formData)
3. Backend receives POST request
4. Creates ServiceReport record with:
   - user_id from session
   - description, utility_type, priority from form
   - status = 'open'
   - created_at = current timestamp
5. INSERT into database
6. Returns success response with report_id
7. Frontend shows confirmation and refreshes reports list
8. Reports list calls GET /api/services/list
9. Backend queries and returns all ServiceReports for user
10. UI displays updated list
```

---

## Database Connection Summary

| Feature | Table | Create | Read | Update | Delete |
|---------|-------|--------|------|--------|--------|
| User Registration | Users | ✅ | ✅ | ✅ | ➖ |
| Electricity Bill | Bills | ✅ | ✅ | ✅ | ➖ |
| Water Bill | Bills | ✅ | ✅ | ✅ | ➖ |
| Gas Bill | Bills | ✅ | ✅ | ✅ | ➖ |
| Service Report | ServiceReports | ✅ | ✅ | ✅ | ➖ |
| Community Points | Community | ➖ | ✅ | ✅ | ➖ |
| Vendor Info | Vendors | ✅ | ✅ | ➖ | ➖ |
| Profile Updates | Users | ➖ | ✅ | ✅ | ➖ |

---

## Current Status

✅ **Fully Integrated:**
- User authentication & profile management
- Bill tracking for all utilities
- Service report submission & tracking
- Community engagement tracking
- Vendor information
- Dashboard data aggregation
- Insights & consumption trends
- Records & history

### Data Flow Verification
- Session-based user tracking ✅
- Database reads on page load ✅
- Data persistence on form submit ✅
- Real-time updates via API ✅
- Language preference storage ✅

---

## Testing the Integration

### 1. Create a Test User
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "email": "test@example.com",
    "phone": "9999999999",
    "password": "test123",
    "state": "Delhi",
    "city": "New Delhi",
    "ward": "Ward 1",
    "locality": "Connaught Place"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123"
  }'
```

### 3. Get Dashboard Data
```bash
curl http://localhost:5000/api/dashboard
```

### 4. Submit Service Report
```bash
curl -X POST http://localhost:5000/api/services/submit \
  -H "Content-Type: application/json" \
  -d '{
    "report_type": "complaint",
    "utility_type": "electricity",
    "description": "High bill this month",
    "priority": "medium"
  }'
```

---

## Architecture Diagram
```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (AngularJS)                  │
│  Dashboard | Bills | Services | Community | Profile     │
└────────────────────┬────────────────────────────────────┘
                     │
         ┌───────────▼────────────┐
         │   API Endpoints        │
         │  /api/dashboard        │
         │  /api/utilities        │
         │  /api/services/*       │
         │  /api/community/*      │
         │  /api/profile          │
         └───────────┬────────────┘
                     │
         ┌───────────▼────────────────┐
         │  Flask Backend (app.py)    │
         │  Request processing        │
         │  Business logic            │
         │  Database queries          │
         └───────────┬────────────────┘
                     │
    ┌────────────────▼────────────────┐
    │      SQLite Database            │
    │ ┌──────────────────────────┐    │
    │ │ Users (profiles)         │    │
    │ │ Bills (consumption)      │    │
    │ │ ServiceReports (tickets) │    │
    │ │ Community (engagement)   │    │
    │ │ Vendors (providers)      │    │
    │ └──────────────────────────┘    │
    └─────────────────────────────────┘
```

---

## Next Steps

✅ All citizen portal features are connected to the database.
✅ Data persistence is working for all user interactions.
✅ Session management ensures user isolation.

### Potential Enhancements:
- [ ] Add payment gateway integration for bill payments
- [ ] Implement real-time notifications for bill updates
- [ ] Add data export functionality (PDF, CSV)
- [ ] Implement caching for faster data retrieval
- [ ] Add audit logs for all user actions
- [ ] Implement data backup and recovery procedures

---

**Date:** March 22, 2026  
**Status:** Production Ready ✅  
**Database:** SQLite (suvidha.db)  
**Backend:** Flask + SQLAlchemy
