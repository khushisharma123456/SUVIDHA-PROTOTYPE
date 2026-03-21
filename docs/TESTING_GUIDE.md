# 🚀 Quick Start Guide - Testing the Login Flow

## ✅ Setup Complete!

The backend is now running and ready to test the complete login flow:
**Landing Page → Login/Signup → Dashboard**

## 📊 Server Information

- **Server URL:** http://localhost:5000
- **Status:** ✅ Running
- **Database:** Fresh with test data

## 🔑 Test Credentials

### General Citizens
| Email | Password | Type |
|-------|----------|------|
| raj.kumar@example.com | password123 | General |
| priya.sharma@example.com | password123 | General |
| amit.patel@example.com | password123 | General |

### Senior Citizens
| Email | Password | Type |
|-------|----------|------|
| ramesh.gupta@example.com | password123 | Senior |
| sushma.verma@example.com | password123 | Senior |

## 🧪 Testing the Login Flow

### Step 1: Open the Application
1. Open your browser
2. Navigate to: **http://localhost:5000**
3. You should see the **Landing Page** first

### Step 2: Navigate to Login
1. Click on "Citizen Login" or similar button on landing page
2. OR: Directly go to http://localhost:5000/#/landing
3. Click "Login" button to go to login page

### Step 3: Login
1. Enter one of the test emails: `raj.kumar@example.com`
2. Enter password: `password123`
3. Click "Login"
4. You should be **automatically redirected to Dashboard**

### Step 4: View Dashboard
- The dashboard will load with:
  - User profile information
  - Bills summary (pending/paid)
  - Recent complaints
  - Community stats

### Step 5: Test Logout
1. Click the logout button
2. You will be redirected back to the **Landing Page**

## 🎯 Testing Signup Flow

### New User Registration
1. From landing page, click "Sign Up"
2. Fill in the multi-step form:
   - **Step 1:** Full Name & Language
   - **Step 2:** Email & Phone
   - **Step 3:** Aadhaar (optional)
   - **Step 4:** Location (State, City, Ward, Locality)
   - **Step 5:** Service Providers
   - **Step 6:** Password
3. Click "Create Account"
4. Automatically logged in and redirected to Dashboard

## 📱 What Data is Available?

Each test user has:
- ✅ **75 Bills total** (electricity, water, gas)
  - Last 6 months of bills
  - Mix of paid and pending
- ✅ **13 Complaints/Service Reports**
  - Various statuses (open, in-progress, resolved)
  - Different utility types
- ✅ **Community Membership**
  - Points earned
  - Challenges participated

## 🔍 Testing API Endpoints

### Using Browser Console
Open browser console (F12) and try:

```javascript
// After logging in, test dashboard API
fetch('/api/citizen/dashboard', {
  credentials: 'include'
})
.then(r => r.json())
.then(data => console.log(data));

// Get bills
fetch('/api/citizen/bills', {
  credentials: 'include'
})
.then(r => r.json())
.then(data => console.log(data));

// Get complaints
fetch('/api/citizen/complaints', {
  credentials: 'include'
})
.then(r => r.json())
.then(data => console.log(data));
```

### Using Postman or curl

```bash
# Login first
curl -X POST http://localhost:5000/api/citizen/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"raj.kumar@example.com","password":"password123"}' \
  -c cookies.txt

# Get dashboard (using saved cookies)
curl http://localhost:5000/api/citizen/dashboard -b cookies.txt

# Get bills
curl http://localhost:5000/api/citizen/bills -b cookies.txt

# Get specific utility bills
curl "http://localhost:5000/api/citizen/bills?utility_type=electricity" -b cookies.txt
```

## 🎨 URL Routes Available

| Route | Purpose | Auth Required |
|-------|---------|---------------|
| `/#/landing` | Landing page with role selection | No |
| `/#/auth` | Login/Signup page | No |
| `/#/dashboard` | Main dashboard | Yes |
| `/#/utilities` | Utilities management | Yes |
| `/#/services` | Service requests | Yes |
| `/#/community` | Community features | Yes |
| `/#/profile` | User profile | Yes |
| `/#/records` | Bills and records | Yes |

## 🔄 Expected Flow

```
User Opens Browser
       ↓
Landing Page (#/landing)
   Role Selection
       ↓
  Click "Citizen"
       ↓
Auth Page (#/auth)
  Login or Signup
       ↓
  Enter Credentials
       ↓
  API: POST /api/citizen/login
       ↓
Success → Store Token
       ↓
Auto-Redirect to Dashboard
       ↓
API: GET /api/citizen/dashboard
       ↓
Show User Data, Bills, Complaints
```

## ⚡ Features Working

- ✅ Landing page loads first
- ✅ Login with test credentials
- ✅ Session-based authentication
- ✅ Auto-redirect to dashboard after login
- ✅ Dashboard loads user data from API
- ✅ Logout redirects to landing
- ✅ Protected routes require authentication
- ✅ Bills API returns real data
- ✅ Complaints API returns real data
- ✅ User types (general/senior) detected

## 🐛 Troubleshooting

### Landing Page Not Showing?
- Check if you're at http://localhost:5000
- Default route should redirect to `/#/landing`

### Login Not Working?
- Check browser console for errors
- Verify email: `raj.kumar@example.com`
- Verify password: `password123`
- Check Network tab for API response

### Dashboard Not Loading?
- Check if login was successful
- Open browser console and check for errors
- Verify `/api/citizen/dashboard` returns data

### "Not Authenticated" Error?
- Clear localStorage: `localStorage.clear()`
- Refresh page
- Login again

## 📊 View Database Data

If you want to see what's in the database:

```bash
# Install sqlite3 or use an SQLite browser
sqlite3 instance/suvidha.db

# View users
SELECT full_name, email, user_type FROM users;

# View bills count
SELECT COUNT(*) FROM bills;

# View complaints
SELECT title, status FROM service_reports;

# Exit
.exit
```

## 🎯 Next Steps

Once you've tested the basic flow:

1. **Try Senior Citizen Login**
   - Login with: ramesh.gupta@example.com
   - Check if senior-specific features are available

2. **Test Bill Payment**
   - Go to bills page
   - Try marking a bill as paid

3. **Create a Complaint**
   - Go to services/complaints
   - Submit a new complaint
   - Verify it appears in the list

4. **Update Profile**
   - Go to profile page
   - Update user information
   - Save changes

5. **Test Logout/Login Cycle**
   - Logout → redirects to landing
   - Login again → redirects to dashboard

## 🚀 Everything is Ready!

Your authentication flow is now complete and working:
- ✅ main.py server running
- ✅ Database with test data
- ✅ Frontend connected to backend
- ✅ Login/Signup working
- ✅ Dashboard loading data
- ✅ API endpoints integrated

**Open your browser and test at: http://localhost:5000**
