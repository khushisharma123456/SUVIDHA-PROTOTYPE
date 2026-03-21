# Quick Start Guide - Citizen Backend (main.py)

## ✅ Setup Complete!

The citizen backend (`main.py`) has been successfully created with the following features:

### 🎯 Features Implemented

1. **User Authentication**
   - Citizen Signup (General & Senior Citizens)
   - Login/Logout
   - Session Management
   - Auto-detection of Senior Citizens (60+ years)

2. **Bill Management**
   - View all bills
   - Filter by utility type (electricity, water, gas)
   - Pay bills
   - Bills summary dashboard

3. **Complaints/Service Reports**
   - submit complaints
   - View complaint history
   - Track complaint status
   - Complaints summary

4. **Dashboard**
   - Overview of bills and complaints
   - Community stats
   - Recent activities

5. **Senior Citizen Features**
   - Live waste collection service
   - Senior-specific updates and announcements

6. **Community Engagement**
   - Community statistics
   - Leaderboard

7. **Utilities**
   - Consumption tracking
   - Vendor information

### 📊 Database Changes

**User Model Enhanced:**
- Added `user_type` field: 'general' or 'senior_citizen'
- Added `date_of_birth` field for age verification

### 🚀 Running the Application

**Option 1: Use main.py (NEW - Citizen Backend Only)**
```bash
python main.py
```
Server runs on: http://localhost:5000

**Option 2: Use app.py (EXISTING - Full Application)**
```bash
python app.py
```
Server runs on: http://localhost:5000

### 📝 Differences Between app.py and main.py

| Feature | app.py | main.py |
|---------|--------|---------|
| General Citizens | ✅ | ✅ |
| Senior Citizens | ❌ | ✅ |
| Government Officials | ✅ | ❌ |
| Field Agents | ✅ | ❌ |
| Admin Dashboard | ✅ | ❌ |
| User Type Detection | ❌ | ✅ |

**Recommendation:** Use `main.py` for citizen-focused development and testing.

### 🧪 Testing the Backend

#### 1. Seed Test Data
```bash
python seed_citizens.py
```

This creates 5 test accounts:
- 3 General Citizens
- 2 Senior Citizens

**Test Credentials:**
```
Email: raj.kumar@example.com
Password: password123
Type: General Citizen

Email: ramesh.gupta@example.com
Password: password123
Type: Senior Citizen
```

#### 2. Test API Endpoints

**Using curl:**

```bash
# Login
curl -X POST http://localhost:5000/api/citizen/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"raj.kumar@example.com","password":"password123"}' \
  -c cookies.txt

# Get Dashboard
curl http://localhost:5000/api/citizen/dashboard -b cookies.txt

# Get Bills
curl http://localhost:5000/api/citizen/bills -b cookies.txt

# Get Complaints
curl http://localhost:5000/api/citizen/complaints -b cookies.txt
```

**Using Postman:**
1. Import the API collection (see MAIN_PY_DOCUMENTATION.md)
2. Test each endpoint
3. Session cookies are automatically handled

#### 3. Test with Frontend

**General Citizen:**
- Navigate to: `http://localhost:5000/`
- Login with general citizen credentials
- Access dashboard at: `/dashboard`

**Senior Citizen:**
- Navigate to: `http://localhost:5000/SeniorCitizen/app/views/dashboard.html`
- Login with senior citizen credentials
- Access specialized senior features

### 🔧 Configuration

**Database Location:**
```
instance/suvidha.db
```

**Secret Key:** 
Change `app.secret_key` in production!

**CORS:**
Currently allows all origins. Restrict in production.

### 📱 Frontend Integration

**AngularJS Services:**

```javascript
// In your auth.service.js
this.login = function(identifier, password) {
    return $http.post('/api/citizen/login', {
        identifier: identifier,
        password: password
    });
};

this.signup = function(userData) {
    return $http.post('/api/citizen/signup', userData);
};

// In your bills.service.js  
this.getBills = function(utilityType) {
    var url = '/api/citizen/bills';
    if (utilityType) {
        url += '?utility_type=' + utilityType;
    }
    return $http.get(url);
};

// In your complaints.service.js
this.createComplaint = function(complaint) {
    return $http.post('/api/citizen/complaints', complaint);
};
```

### 🛠️ Development Workflow

1. **Start the server:**
   ```bash
   python main.py
   ```

2. **Seed test data (first time only):**
   ```bash
   python seed_citizens.py
   ```

3. **Test API endpoints:**
   - Use Postman/curl or
   - Use the frontend

4. **Make changes:**
   - Edit `main.py` for backend logic
   - Edit `models.py` for database schema
   - Frontend files in `static/` and `SeniorCitizen/`

5. **Restart server** to apply changes

### 📚 Documentation

- **Full API Documentation:** `MAIN_PY_DOCUMENTATION.md`
- **All Endpoints:** See documentation for complete list
- **Error Handling:** Consistent error responses across all endpoints

### 🐛 Troubleshooting

**Database Error:**
- Ensure `instance/` folder exists
- Check file permissions
- Delete `instance/suvidha.db` and restart to recreate

**Import Errors:**
- Install dependencies: `pip install flask flask-cors flask-sqlalchemy werkzeug`

**Port Already in Use:**
- Change port in `main.py`: `app.run(debug=True, port=5001)`
- Or kill existing process on port 5000

**Session Issues:**
- Clear browser cookies
- Check session configuration
- Ensure secret_key is set

### ✨ Next Steps

1. **Test the API:** Run seed script and test all endpoints
2. **Connect Frontend:** Update AngularJS controllers to use new endpoints
3. **Add Features:** Extend with additional citizen services
4. **Deploy:** Follow production checklist in documentation

### 📞 Support

For detailed API documentation, see: `MAIN_PY_DOCUMENTATION.md`

---

**Status:** ✅ Ready for Development and Testing

**Last Updated:** February 28, 2026
