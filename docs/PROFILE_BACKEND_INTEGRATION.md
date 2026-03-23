# Profile Backend Integration - Implementation Guide

## Overview
Successfully connected the **SUVIDHA Citizen Profile** to the Flask backend with complete CRUD functionality for user profile data and utility connections.

## Architecture Overview

### Backend Components

#### 1. Profile API Endpoints

**GET `/api/citizen/profile`**
- **Purpose**: Retrieve complete user profile information
- **Authentication**: Required (session-based)
- **Response**:
```json
{
  "success": true,
  "profile": {
    "id": "user-uuid",
    "full_name": "John Doe",
    "email": "john@example.com",
    "phone": "+91-9876543210",
    "user_type": "general",
    "date_of_birth": "1990-05-15",
    "preferred_language": "en",
    "state": "Delhi",
    "city": "New Delhi",
    "ward": "1",
    "locality": "Sector 12",
    "alerts_enabled": true,
    "is_verified": true,
    "account_created": "2025-03-23T10:30:00",
    "last_login": "2026-03-23T14:25:00",
    "aadhaar_consent": true
  }
}
```

**PUT `/api/citizen/profile`**
- **Purpose**: Update user profile information
- **Authentication**: Required (session-based)
- **Request Body**:
```json
{
  "full_name": "Updated Name",
  "phone": "+91-9876543211",
  "locality": "New Locality",
  "state": "Delhi",
  "city": "New Delhi",
  "ward": "2",
  "date_of_birth": "1990-05-16",
  "alerts_enabled": false
}
```
- **Response**:
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "profile": {...}
}
```
- **Error Handling**:
  - Returns 401 if not authenticated
  - Returns 400 if phone number already in use by another user
  - Returns 404 if user not found

**GET `/api/citizen/profile/connections`**
- **Purpose**: Retrieve user's utility service connections
- **Authentication**: Required (session-based)
- **Response**:
```json
{
  "success": true,
  "connections": [
    {
      "utility": "Electricity",
      "provider": "BRPL (BSES Rajdhani)",
      "status": "Active",
      "statusClass": "badge-success"
    },
    {
      "utility": "Water",
      "provider": "Delhi Jal Board",
      "status": "Active",
      "statusClass": "badge-success"
    },
    {
      "utility": "Gas",
      "provider": "IGL (Indraprastha Gas)",
      "status": "Active",
      "statusClass": "badge-success"
    }
  ],
  "total_connections": 3
}
```

### Database Models

**User Model** (from `models.py` - lines 506-564):
```python
class User(db.Model):
    id = db.Column(db.String(36), primary_key=True)
    full_name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    phone = db.Column(db.String(20), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    user_type = db.Column(db.String(20), default='general')
    preferred_language = db.Column(db.String(10), default='en')
    date_of_birth = db.Column(db.Date, nullable=True)
    state = db.Column(db.String(100), nullable=False)
    city = db.Column(db.String(100), nullable=False)
    ward = db.Column(db.String(100), nullable=False)
    locality = db.Column(db.String(255), nullable=False)
    electricity_provider_id = db.Column(db.String(36), db.ForeignKey('vendors.id'))
    water_provider_id = db.Column(db.String(36), db.ForeignKey('vendors.id'))
    gas_provider_id = db.Column(db.String(36), db.ForeignKey('vendors.id'))
    alerts_enabled = db.Column(db.Boolean, default=True)
    is_verified = db.Column(db.Boolean, default=False)
    account_created = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime, nullable=True)
    aadhaar_consent = db.Column(db.Boolean, default=False)

    # Relationships
    electricity_provider = db.relationship('Vendor', foreign_keys=[electricity_provider_id])
    water_provider = db.relationship('Vendor', foreign_keys=[water_provider_id])
    gas_provider = db.relationship('Vendor', foreign_keys=[gas_provider_id])
```

## Frontend Components

### Service Layer (`api.service.js`)

**New Methods Added**:

```javascript
// Get profile data
self.getProfileData = function() {
    return self.get('/citizen/profile');
};

// Update profile data
self.updateProfileData = function(data) {
    return self.put('/citizen/profile', data);
};

// Get utility connections
self.getProfileConnections = function() {
    return self.get('/citizen/profile/connections');
};
```

### Controller Layer (`profile.controller.js`)

**Key Properties**:
```javascript
vm.loading = true;              // Profile data loading state
vm.loadingConnections = true;   // Connections loading state
vm.editMode = false;            // Toggle edit/view mode
vm.saving = false;              // Profile save in progress
vm.user = {...};                // User object
vm.connections = [];            // Utility connections array
vm.preferences = {...};         // User preferences
```

**Key Methods**:

```javascript
// Load profile data from backend
function loadProfileData() {
    ApiService.getProfileData()
        .then(function(response) {
            vm.user = {
                fullName: response.data.profile.full_name,
                email: response.data.profile.email,
                phone: response.data.profile.phone,
                ...
            };
            vm.loading = false;
        });
}

// Load utility connections
function loadConnections() {
    ApiService.getProfileConnections()
        .then(function(response) {
            vm.connections = response.data.connections;
            vm.loadingConnections = false;
        });
}

// Update profile with validation
vm.updateProfile = function() {
    vm.saving = true;
    var profileData = {
        full_name: vm.user.fullName,
        phone: vm.user.phone,
        locality: vm.user.address,
        state: vm.user.state,
        city: vm.user.city,
        ward: vm.user.ward
    };
    
    ApiService.updateProfileData(profileData)
        .then(function(response) {
            if (response.data.success) {
                vm.editMode = false;
                // Show success notification
            }
            vm.saving = false;
        });
}

// Cancel edit and reload from backend
vm.cancelEdit = function() {
    vm.editMode = false;
    loadProfileData();
}
```

### Template Layer (`profile.html`)

**Profile Section Features**:
1. **View Mode**
   - Displays user information in read-only format
   - Shows all profile fields with fallback values
   - Edit button to enter edit mode

2. **Edit Mode**
   - Inline form inputs for all editable fields
   - Full Name, Phone, City, State, Ward, Locality
   - Save/Cancel buttons with loading states
   - Input validation feedback

3. **Utility Connections Display**
   - Shows all linked utility services
   - Displays provider name and connection status
   - Icon indicators for each utility type (⚡ 💧 🔥)
   - Loading state while fetching connections
   - Empty state message when no connections exist

## Data Flow

### Profile Loading Flow
```
Application Init
    ↓
ProfileController ($onInit)
    ↓
loadProfileData() + loadConnections()
    ↓
ApiService.getProfileData() + getProfileConnections()
    ↓
Flask Backend: GET /api/citizen/profile
               GET /api/citizen/profile/connections
    ↓
Database Query (User + Vendor Tables)
    ↓
Return JSON Response
    ↓
Update vm.user and vm.connections
    ↓
Template Bindings Update
    ↓
Display in Profile View
```

### Profile Update Flow
```
User Clicks "Edit" Button
    ↓
vm.editMode = true
    ↓
User Modifies Fields
    ↓
User Clicks "Save Changes"
    ↓
vm.updateProfile() Called
    ↓
Build profileData Object from vm.user
    ↓
ApiService.updateProfileData(profileData)
    ↓
Flask Backend: PUT /api/citizen/profile
    ↓
Database Update (User Model)
    ↓
Return Success/Error Response
    ↓
Update localStorage
    ↓
vm.editMode = false
    ↓
Display Success Message
    ↓
Reload Profile Data (Optional)
```

## Files Modified

### Backend Files
- **citizen_routes.py** (Added lines ~910-1045)
  - `GET /api/citizen/profile` endpoint
  - `PUT /api/citizen/profile` endpoint
  - `GET /api/citizen/profile/connections` endpoint

### Frontend Files
- **static/app/services/api.service.js**
  - Added `getProfileData()`
  - Added `updateProfileData(data)`
  - Added `getProfileConnections()`

- **static/app/controllers/profile.controller.js**
  - Enhanced with TranslateService injection
  - Added edit mode functionality
  - Implemented `loadConnections()` function
  - Enhanced `updateProfile()` with API integration
  - Added `cancelEdit()` method

- **static/app/views/profile.html**
  - Added view/edit mode toggle
  - Created inline edit form
  - Enhanced utility connections display with loading states
  - Added empty state messaging

## Features Implemented

✅ **Profile Retrieval**: Fetch complete user profile from database
✅ **Profile Updates**: Edit and save profile information with validation
✅ **Connections Display**: Show linked utility services with provider info
✅ **View/Edit Toggle**: Smooth transition between view and edit modes
✅ **Loading States**: Visual feedback during data fetching and saving
✅ **Error Handling**: Proper error messages for API failures
✅ **Phone Validation**: Prevent duplicate phone number registration
✅ **Date Conversion**: Proper date formatting for API requests
✅ **LocalStorage Sync**: Synchronize changes with cached data
✅ **Empty States**: User-friendly messages when no data available

## Validation Rules

### Profile Fields
- **Full Name** (Required): Non-empty string
- **Phone** (Required, Unique): Valid format, no duplicates
- **Email** (Display Only): Cannot be edited via this interface
- **Locality** (Required): Non-empty string
- **City** (Required): Non-empty string
- **State** (Required): Non-empty string
- **Ward** (Required): Non-empty string
- **Date of Birth** (Optional): Date format YYYY-MM-DD

### API Response Validation
- HTTP 401: User not authenticated
- HTTP 404: User record not found
- HTTP 400: Phone number already in use
- HTTP 500: Server error with detailed message

## Security Considerations

1. **Authentication**: All endpoints require active session
2. **Authorization**: Users can only access/modify their own profile
3. **Input Validation**: Server-side validation of all fields
4. **Unique Constraints**: Phone number uniqueness enforced at database level
5. **Error Messages**: Safe error messages without exposing internal details
6. **HTTPS Recommended**: All API calls should use HTTPS in production

## Performance Optimizations

1. **Parallel Loading**: Profile and connections load simultaneously
2. **Caching**: localStorage synced with database updates
3. **Lazy Loading**: Connections loaded on profile view
4. **Minimal Data Transfer**: Only required fields returned from API
5. **HTTP Methods**: Proper use of GET/PUT for RESTful operations

## Testing Checklist

- [x] GET /api/citizen/profile returns user data
- [x] PUT /api/citizen/profile updates user data
- [x] GET /api/citizen/profile/connections shows linked utilities
- [x] Phone uniqueness validation works
- [x] Empty state shows when no connections
- [x] Edit mode enables/disables properly
- [x] Save button triggers API call
- [x] Cancel button reverts to view mode
- [x] Loading states display correctly
- [x] Error messages show for failures
- [x] localStorage stays in sync

## API Usage Examples

### Retrieve Full Profile
```bash
curl -X GET http://localhost:5000/api/citizen/profile \
  -H "Content-Type: application/json" \
  -b "session_cookie"
```

### Update Profile
```bash
curl -X PUT http://localhost:5000/api/citizen/profile \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "New Name",
    "phone": "+91-9876543211",
    "locality": "New Locality"
  }' \
  -b "session_cookie"
```

### Get Utility Connections
```bash
curl -X GET http://localhost:5000/api/citizen/profile/connections \
  -H "Content-Type: application/json" \
  -b "session_cookie"
```

## Future Enhancements

- [ ] Profile picture upload to server storage
- [ ] Email field editing with verification
- [ ] Password change functionality
- [ ] Two-factor authentication setup
- [ ] Profile activity history/audit log
- [ ] Account deletion with data export
- [ ] Social media account linking
- [ ] Emergency contact management
- [ ] Document upload (ID, proof of residence)
- [ ] Profile visibility settings

## Troubleshooting

### Issue: Profile data shows as "Not provided"
**Solution**: Ensure user is logged in and session is active. Check browser console for API errors.

### Issue: Edit form fields not updating
**Solution**: Verify ng-model bindings are correct and controller is properly initialized.

### Issue: Connections not showing
**Solution**: Check that user has vendor IDs stored in database. Verify Vendor records exist.

### Issue: Save button not working
**Solution**: Check network tab for API errors. Verify session cookie is being sent. Check phone number uniqueness.

### Issue: Changes not persisting
**Solution**: Verify PUT request succeeds (HTTP 200). Check database transaction commits. Reload page to verify.

---

**Implementation Date**: March 23, 2026
**Status**: Production Ready ✅
**Maintained By**: Suvidha Development Team
**Last Updated**: March 23, 2026
