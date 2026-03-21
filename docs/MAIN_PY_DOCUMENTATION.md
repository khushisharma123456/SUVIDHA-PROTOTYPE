# Main.py - Citizen Backend Documentation

## Overview

`main.py` is the Flask backend server for **General Citizens** and **Senior Citizens** in the Suvidha platform. It provides complete RESTful API endpoints for:

- User Authentication (Login/Signup)
- Bill Management (View, Pay)
- Service Complaints/Reports
- Dashboard Data
- Community Engagement
- Consumption Tracking
- Senior Citizen Specific Services

## Database Schema Updates

### User Model Enhancement

The `User` model has been enhanced with:
- `user_type`: Distinguishes between 'general' and 'senior_citizen'
- `date_of_birth`: Used to auto-determine senior citizen status (60+ years)

```python
user_type = db.Column(db.String(20), default='general')  # general, senior_citizen
date_of_birth = db.Column(db.Date, nullable=True)
```

## Getting Started

### 1. Install Dependencies

```bash
pip install flask flask-cors flask-sqlalchemy werkzeug
```

### 2. Initialize Database

The database will be created automatically on first run. The database file will be located at:
```
instance/suvidha.db
```

### 3. Run the Server

```bash
python main.py
```

The server will start on `http://localhost:5000`

### 4. Seed Test Data

To populate the database with test citizens, bills, and complaints:

```bash
python seed_citizens.py
```

#### Test Credentials

After seeding, you can login with these test accounts:

| Email | Password | Type | Age Group |
|-------|----------|------|-----------|
| raj.kumar@example.com | password123 | General | Adult |
| priya.sharma@example.com | password123 | General | Adult |
| ramesh.gupta@example.com | password123 | Senior Citizen | 69 years |
| sushma.verma@example.com | password123 | Senior Citizen | 64 years |
| amit.patel@example.com | password123 | General | Adult |

## API Endpoints

### Authentication

#### 1. Citizen Signup
```http
POST /api/citizen/signup
Content-Type: application/json

{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "password": "securepass123",
  "dateOfBirth": "1955-05-15",  // Optional, auto-determines senior citizen
  "userType": "general",  // Optional: "general" or "senior_citizen"
  "language": "en",
  "state": "Delhi",
  "city": "New Delhi",
  "ward": "Ward 42",
  "locality": "Connaught Place",
  "electricityProvider": "vendor-id",  // Optional
  "waterProvider": "vendor-id",  // Optional
  "gasProvider": "vendor-id",  // Optional
  "aadhaar": "1234-5678-9012",  // Optional
  "consent": true,  // For aadhaar
  "alertsEnabled": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Account created successfully",
  "user_id": "uuid",
  "user_type": "general",
  "token": "auth-token",
  "user": { /* user object */ }
}
```

#### 2. Citizen Login
```http
POST /api/citizen/login
Content-Type: application/json

{
  "identifier": "john@example.com",  // Email or phone
  "password": "securepass123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "user_id": "uuid",
  "user_type": "general",
  "token": "auth-token",
  "user": { /* user object */ }
}
```

#### 3. Logout
```http
POST /api/citizen/logout
```

### Profile Management

#### 4. Get Profile
```http
GET /api/citizen/profile
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "full_name": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "user_type": "general",
    "date_of_birth": "1955-05-15",
    "preferred_language": "en",
    "state": "Delhi",
    "city": "New Delhi",
    "ward": "Ward 42",
    "locality": "Connaught Place",
    "alerts_enabled": true,
    "is_verified": false,
    "account_created": "2025-01-15T10:30:00"
  }
}
```

#### 5. Update Profile
```http
PUT /api/citizen/profile
Content-Type: application/json

{
  "fullName": "John Updated",
  "phone": "9876543211",
  "preferredLanguage": "hi",
  "alertsEnabled": false,
  "locality": "New Locality"
}
```

### Bills Management

#### 6. Get All Bills
```http
GET /api/citizen/bills
GET /api/citizen/bills?utility_type=electricity
GET /api/citizen/bills?status=pending
```

**Response:**
```json
{
  "success": true,
  "bills": [
    {
      "id": "uuid",
      "utility_type": "electricity",
      "bill_id": "ELEC-9876543210-202602",
      "amount": 1250.50,
      "consumption": 250,
      "consumption_unit": "kWh",
      "billing_period_start": "2026-02-01T00:00:00",
      "billing_period_end": "2026-02-28T00:00:00",
      "due_date": "2026-03-15T00:00:00",
      "paid_date": null,
      "status": "pending"
    }
  ]
}
```

#### 7. Get Bill Details
```http
GET /api/citizen/bills/{bill_id}
```

#### 8. Pay Bill
```http
POST /api/citizen/bills/{bill_id}/pay
Content-Type: application/json

{
  "paymentMethod": "online"  // online, cash, cheque
}
```

**Response:**
```json
{
  "success": true,
  "message": "Bill paid successfully",
  "bill": { /* updated bill object */ }
}
```

#### 9. Get Bills Summary
```http
GET /api/citizen/bills/summary
```

**Response:**
```json
{
  "success": true,
  "summary": {
    "total_bills": 18,
    "pending_bills": 3,
    "paid_bills": 15,
    "overdue_bills": 1,
    "total_pending_amount": 3250.75,
    "total_paid_amount": 12500.00,
    "electricity": {
      "count": 6,
      "pending_amount": 1250.50
    },
    "water": {
      "count": 6,
      "pending_amount": 500.25
    },
    "gas": {
      "count": 6,
      "pending_amount": 1500.00
    }
  }
}
```

### Complaints/Service Reports

#### 10. Get All Complaints
```http
GET /api/citizen/complaints
GET /api/citizen/complaints?status=open
GET /api/citizen/complaints?utility_type=electricity
```

**Response:**
```json
{
  "success": true,
  "complaints": [
    {
      "id": "uuid",
      "report_type": "power_outage",
      "utility_type": "electricity",
      "title": "Power Outage in Area",
      "description": "Frequent power cuts in the last 2 days",
      "status": "open",
      "priority": "high",
      "location": "Connaught Place, Ward 42, New Delhi",
      "created_at": "2026-02-25T10:30:00",
      "updated_at": "2026-02-25T10:30:00",
      "resolved_at": null
    }
  ]
}
```

#### 11. Create Complaint
```http
POST /api/citizen/complaints
Content-Type: application/json

{
  "title": "Power Outage in Area",
  "description": "Frequent power cuts in the last 2 days",
  "utility_type": "electricity",
  "report_type": "power_outage",
  "priority": "high"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Complaint registered successfully",
  "complaint": { /* complaint object */ }
}
```

#### 12. Get Complaint Details
```http
GET /api/citizen/complaints/{complaint_id}
```

#### 13. Get Complaints Summary
```http
GET /api/citizen/complaints/summary
```

**Response:**
```json
{
  "success": true,
  "summary": {
    "total": 8,
    "open": 2,
    "in_progress": 3,
    "resolved": 3
  }
}
```

### Dashboard

#### 14. Get Dashboard Data
```http
GET /api/citizen/dashboard
```

**Response:**
```json
{
  "success": true,
  "dashboard": {
    "user": { /* user object */ },
    "bills_summary": {
      "total": 18,
      "pending": 3,
      "pending_amount": 3250.75
    },
    "complaints_summary": {
      "total": 8,
      "active": 5
    },
    "community": {
      "points_earned": 250,
      "challenges_participated": 5,
      "reports_submitted": 3
    },
    "recent_bills": [ /* 5 most recent bills */ ],
    "recent_complaints": [ /* 5 most recent complaints */ ]
  }
}
```

### Senior Citizen Specific

#### 15. Live Waste Service
```http
GET /api/senior/live-waste-service
```

**Response:**
```json
{
  "success": true,
  "waste_service": {
    "next_collection": {
      "date": "2026-03-01T00:00:00",
      "time": "08:00 AM",
      "type": "General Waste"
    },
    "schedule": [
      {"day": "Monday", "time": "8:00 AM", "type": "General Waste"},
      {"day": "Wednesday", "time": "8:00 AM", "type": "Recyclables"},
      {"day": "Friday", "time": "8:00 AM", "type": "General Waste"}
    ],
    "location": "Connaught Place, Ward 42",
    "contact": "1800-XXX-XXXX"
  }
}
```

#### 16. Get Updates for Seniors
```http
GET /api/senior/updates
```

**Response:**
```json
{
  "success": true,
  "updates": [
    {
      "id": "uuid",
      "title": "New Senior Citizen Discount Scheme",
      "description": "Get 20% discount on electricity bills",
      "date": "2026-02-28T10:00:00",
      "type": "announcement",
      "priority": "high"
    }
  ]
}
```

### Community Engagement

#### 17. Get Community Stats
```http
GET /api/citizen/community/stats
```

#### 18. Get Community Leaderboard
```http
GET /api/citizen/community/leaderboard
```

**Response:**
```json
{
  "success": true,
  "leaderboard": [
    {
      "rank": 1,
      "name": "John Doe",
      "points": 500,
      "badges": ["water_steward", "grid_supporter"]
    }
  ]
}
```

### Utilities

#### 19. Get Consumption Data
```http
GET /api/citizen/consumption?utility_type=electricity&period=monthly
```

**Response:**
```json
{
  "success": true,
  "utility_type": "electricity",
  "consumption": [
    {
      "period": "Feb 2026",
      "consumption": 250,
      "unit": "kWh",
      "amount": 1250.50
    }
  ]
}
```

#### 20. Get Vendors
```http
GET /api/vendors
GET /api/vendors?service_type=electricity
```

## Session Management

The API uses Flask sessions for authentication. After login, the session contains:
- `user_id`: User's UUID
- `user_email`: User's email
- `user_type`: 'general' or 'senior_citizen'
- `auth_token`: Authentication token

All authenticated endpoints check for `user_id` in the session.

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description"
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request (missing fields, validation errors)
- `401`: Unauthorized (not logged in)
- `404`: Not Found
- `500`: Internal Server Error

## User Type Differentiation

The system automatically determines senior citizen status:
- If `dateOfBirth` indicates age 60+, user is marked as `senior_citizen`
- Senior citizens have access to all general citizen features plus:
  - Live waste collection service tracking
  - Senior-specific updates and announcements
  - Potential discounts and special schemes

## Frontend Integration

### AngularJS Controller Example

```javascript
// Login
$http.post('/api/citizen/login', {
  identifier: $scope.email,
  password: $scope.password
}).then(function(response) {
  if (response.data.success) {
    $scope.user = response.data.user;
    $scope.userType = response.data.user_type;
    // Redirect based on user type
    if ($scope.userType === 'senior_citizen') {
      $location.path('/SeniorCitizen/app/views/dashboard.html');
    } else {
      $location.path('/dashboard');
    }
  }
});

// Get Bills
$http.get('/api/citizen/bills?utility_type=electricity')
  .then(function(response) {
    $scope.bills = response.data.bills;
  });

// Create Complaint
$http.post('/api/citizen/complaints', {
  title: $scope.complaintTitle,
  description: $scope.complaintDesc,
  utility_type: $scope.utilityType,
  report_type: $scope.reportType,
  priority: 'high'
}).then(function(response) {
  if (response.data.success) {
    alert('Complaint registered successfully');
  }
});
```

## Database Migration Notes

If you're migrating from the existing `app.py`:

1. **Backup your database** before running main.py
2. The User model has new fields (`user_type`, `date_of_birth`)
3. Run database migrations or recreate tables
4. Existing users will default to `user_type='general'`

## Testing

Use tools like Postman or curl to test endpoints:

```bash
# Signup
curl -X POST http://localhost:5000/api/citizen/signup \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Test User","email":"test@example.com","phone":"1234567890","password":"pass123","state":"Delhi","city":"New Delhi","ward":"Ward 42","locality":"Test Area"}'

# Login
curl -X POST http://localhost:5000/api/citizen/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"test@example.com","password":"pass123"}' \
  -c cookies.txt

# Get Dashboard (with session)
curl http://localhost:5000/api/citizen/dashboard -b cookies.txt
```

## Production Considerations

Before deploying to production:

1. **Change the secret key** in `app.secret_key`
2. Use a production-grade database (PostgreSQL, MySQL)
3. Enable HTTPS
4. Implement proper session management (Redis, database)
5. Add rate limiting
6. Implement proper logging
7. Add input validation and sanitization
8. Use environment variables for configuration
9. Enable CORS only for trusted domains
10. Implement proper authentication (JWT tokens)

## Support

For issues or questions, refer to the main project documentation or contact the development team.
