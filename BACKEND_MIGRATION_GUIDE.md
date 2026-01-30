# Backend Schema Migration Guide

## 🎯 Overview

The backend has been completely revised to support a **multi-city civic issue reporting system** with proper role-based access control, SuperAdmin functionality, and fixed critical bugs.

---

## 🔧 What Changed

### 1. **New Database Models**

#### **City Model** (New)
- `name`, `state`, `country`
- `coordinates` (latitude, longitude)
- `municipalAdmin` reference
- `status` (ACTIVE/INACTIVE)
- Metadata (website, contact info, emergency numbers)

#### **User Model** (Enhanced)
- Added `SUPER_ADMIN` role
- Added `companyName` for contractors
- Changed `city` to `assignedCity` (ObjectId reference)
- Added `isSystemGenerated` flag for workers/inspectors
- Added `username` for system-generated accounts
- Added `createdBy` reference (who created this user)

#### **Issue Model** (Enhanced)
- Changed `city` from String to ObjectId reference
- Added city-based indexing for performance

#### **Assignment Model** (Enhanced)
- Added `city` ObjectId reference
- Added city-based indexing

---

## 👥 User Roles & Access Rules

### 1. **CITIZEN**
- ✅ Can self-register
- ✅ Can select/change city
- ✅ Can report issues in ANY city
- ✅ Can view map and track issues

### 2. **CONTRACTOR**
- ✅ Can self-register
- ✅ Must provide company name
- ✅ Can select/change city
- ✅ Can view and bid on issues in ANY city

### 3. **SUPER_ADMIN** (Central Administration)
- ❌ Cannot self-register (created via migration)
- ✅ Can add new cities
- ✅ Can create municipal admins for cities
- ✅ Can view analytics for ALL cities
- ✅ No city restriction

### 4. **ADMIN** (Municipal Admin)
- ❌ Cannot self-register (created by SuperAdmin)
- ✅ Assigned to ONE specific city
- ✅ Can create workers and inspectors for their city
- ✅ Can assign issues to workers/contractors
- ✅ Can view analytics for their city ONLY
- ⛔ Cannot access other cities

### 5. **WORKER** (Municipal Employee)
- ❌ Cannot self-register (created by Admin)
- ✅ Auto-generated username (e.g., `WRK_BAN_RAJ1`)
- ✅ Auto-generated temporary password
- ✅ Assigned to ONE city (fixed)
- ✅ Can update issue status
- ⛔ Cannot access other cities

### 6. **INSPECTOR** (Municipal Employee)
- ❌ Cannot self-register (created by Admin)
- ✅ Auto-generated username (e.g., `INS_BAN_ANU1`)
- ✅ Auto-generated temporary password
- ✅ Assigned to ONE city (fixed)
- ✅ Can verify completed work
- ⛔ Cannot access other cities

---

## 🐛 Bugs Fixed

### 1. **Duplicate Issue Creation Bug** ✅
**Problem:** Issues were appearing twice on the frontend before refresh.

**Root Cause:** Socket.io was emitting the `issueCreated` event without populated data, causing client-side rendering issues.

**Fix:**
```javascript
// Now we populate the issue before emitting
const populatedIssue = await Issue.findById(issue._id)
  .populate('reportedBy', 'firstName lastName avatar')
  .populate('city', 'name');

io.emit('issueCreated', { issue: populatedIssue });
```

### 2. **Duplicate Detection Redirect Bug** ✅
**Problem:** When a duplicate issue was detected, the user wasn't properly redirected to the existing issue.

**Root Cause:** The response didn't include a clear `redirectToIssue` field with the issue ID.

**Fix:**
```javascript
return res.status(200).json({
  isDuplicate: true,
  redirectToIssue: textDuplicates[0].issue._id,  // ✅ Added this
  duplicateIssue: textDuplicates[0].issue,
  matchScore: (textDuplicates[0].score * 100).toFixed(0),
  message: 'Similar issue already exists. Redirecting...'
});
```

---

## 📡 New API Endpoints

### **Admin Routes** (`/api/admin`)

#### SuperAdmin Endpoints
```
GET    /api/admin/cities                    # Get all cities
POST   /api/admin/cities                    # Add new city
POST   /api/admin/cities/:cityId/admin      # Create municipal admin for city
GET    /api/admin/analytics/all-cities      # Get analytics for all cities
```

#### Municipal Admin Endpoints
```
POST   /api/admin/employees                 # Create worker/inspector
GET    /api/admin/employees                 # Get all employees for admin's city
GET    /api/admin/analytics/city            # Get analytics for admin's city
```

#### Public Endpoints
```
GET    /api/admin/cities/public             # Get list of active cities (for citizens)
```

### **Updated Auth Routes** (`/api/auth`)

```
POST   /api/auth/register                   # Self-registration (CITIZEN/CONTRACTOR only)
POST   /api/auth/login                      # Login (supports email or username)
```

**Register Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "CITIZEN",        // or "CONTRACTOR"
  "cityId": "city_object_id",
  "companyName": "ABC Corp" // Required for CONTRACTOR
}
```

---

## 🚀 Migration & Setup

### Step 1: Run Migration Script

```bash
cd backend
npm run migrate
```

This will:
1. Create Super Admin account
2. Create default cities (Bangalore, Mumbai, Delhi, Chennai, Kolkata)
3. Migrate existing users to new schema
4. Migrate existing issues to city references
5. Create municipal admins for each city

### Step 2: Default Credentials

**Super Admin:**
```
Email: superadmin@fixmycity.gov.in
Password: SuperAdmin@123
```

**Municipal Admins:**
```
Bangalore: admin@bangalore.gov.in / Admin@Bangalore123
Mumbai:    admin@mumbai.gov.in    / Admin@Mumbai123
Delhi:     admin@delhi.gov.in     / Admin@Delhi123
Chennai:   admin@chennai.gov.in   / Admin@Chennai123
Kolkata:   admin@kolkata.gov.in   / Admin@Kolkata123
```

⚠️ **CHANGE ALL DEFAULT PASSWORDS AFTER FIRST LOGIN!**

---

## 💻 Example Usage

### 1. SuperAdmin Adds New City

```javascript
POST /api/admin/cities
Authorization: Bearer <super_admin_token>

{
  "name": "Pune",
  "state": "Maharashtra",
  "country": "India",
  "latitude": 18.5204,
  "longitude": 73.8567
}
```

### 2. SuperAdmin Creates Municipal Admin

```javascript
POST /api/admin/cities/676eec6c86eaa9b04e8e39e0/admin
Authorization: Bearer <super_admin_token>

{
  "email": "admin@pune.gov.in",
  "firstName": "Pune",
  "lastName": "Municipal Admin",
  "password": "Admin@Pune123",
  "phone": "+91-9876543210"
}
```

### 3. Municipal Admin Creates Worker

```javascript
POST /api/admin/employees
Authorization: Bearer <municipal_admin_token>

{
  "firstName": "Rajesh",
  "lastName": "Kumar",
  "role": "WORKER",
  "phone": "+91-9876543211",
  "email": "rajesh.kumar@bangalore.gov.in"  // Optional
}

// Response includes auto-generated username and password:
{
  "message": "worker created successfully",
  "employee": {
    "username": "WRK_BAN_RAJ1",
    "temporaryPassword": "aB3$xY9@mP2#",  // Show this to admin ONCE
    "email": "rajesh.kumar@bangalore.gov.in"
  }
}
```

### 4. Worker Logs In

```javascript
POST /api/auth/login

{
  "username": "WRK_BAN_RAJ1",
  "password": "aB3$xY9@mP2#"
}
```

### 5. Citizen Reports Issue

```javascript
POST /api/issues
Authorization: Bearer <citizen_token>
Content-Type: multipart/form-data

{
  "title": "Pothole on MG Road",
  "description": "Large pothole causing accidents",
  "category": "ROADS",
  "latitude": 12.9716,
  "longitude": 77.5946,
  "address": "MG Road, Bangalore",
  "priority": "HIGH",
  "photos": [<file>, <file>]
}

// If duplicate detected:
{
  "isDuplicate": true,
  "redirectToIssue": "676eec6c86eaa9b04e8e39e1",  // Frontend should redirect here
  "matchScore": "87",
  "message": "Similar issue already exists. Redirecting..."
}
```

---

## 🔐 Access Control Rules

### City Access Matrix

| Role | Cross-City Access | Can Report Issues | Can View Issues | Can Assign Work | Can Create Users |
|------|-------------------|-------------------|-----------------|-----------------|------------------|
| CITIZEN | ✅ Yes | ✅ Any City | ✅ Any City | ❌ No | ❌ No |
| CONTRACTOR | ✅ Yes | ✅ Any City | ✅ Any City | ❌ No | ❌ No |
| WORKER | ❌ No (assigned city only) | ❌ No | ✅ City Only | ❌ No | ❌ No |
| INSPECTOR | ❌ No (assigned city only) | ❌ No | ✅ City Only | ❌ No | ❌ No |
| ADMIN | ❌ No (assigned city only) | ❌ No | ✅ City Only | ✅ City Only | ✅ City Only (Workers/Inspectors) |
| SUPER_ADMIN | ✅ Yes (all cities) | ❌ No | ✅ All Cities | ❌ No | ✅ Yes (Admins & Cities) |

---

## 📊 Database Indexes

For performance optimization, the following indexes are created:

**User Model:**
- `email` (unique)
- `username` (unique, sparse)
- `role + assignedCity`
- `assignedCity + status`

**Issue Model:**
- `city + category`
- `city + status`
- `latitude + longitude` (geospatial)

**Assignment Model:**
- `city + status`
- `assignedTo + status`

---

## 🧪 Testing the Migration

### 1. Verify Super Admin
```bash
# Try logging in
POST /api/auth/login
{
  "email": "superadmin@fixmycity.gov.in",
  "password": "SuperAdmin@123"
}
```

### 2. Verify Cities
```bash
GET /api/admin/cities/public
# Should return 5 cities
```

### 3. Verify Municipal Admins
```bash
POST /api/auth/login
{
  "email": "admin@bangalore.gov.in",
  "password": "Admin@Bangalore123"
}
```

### 4. Test Worker Creation
```bash
POST /api/admin/employees
Authorization: Bearer <admin_token>
{
  "firstName": "Test",
  "lastName": "Worker",
  "role": "WORKER"
}
```

---

## 🔄 Rollback Plan

If you need to rollback the migration:

1. **Backup your database first!**
```bash
mongodump --uri="<your_mongodb_uri>" --out=backup_before_migration
```

2. **Restore from backup:**
```bash
mongorestore --uri="<your_mongodb_uri>" backup_before_migration
```

---

## 📝 Pending Frontend Changes

The frontend needs to be updated to:

1. **Handle redirect on duplicate detection:**
```javascript
if (response.data.isDuplicate) {
  navigate(`/issue/${response.data.redirectToIssue}`);
}
```

2. **Show city selector** for citizens/contractors during registration

3. **Update issue creation** to use `cityId` instead of `city` string

4. **Add SuperAdmin dashboard** for:
   - Adding cities
   - Creating municipal admins
   - Viewing all-cities analytics

5. **Add Admin dashboard features** for:
   - Creating workers/inspectors
   - Displaying auto-generated credentials

6. **Remove duplicate issue rendering** in real-time updates

---

## ✅ Checklist

- [x] City model created
- [x] User model enhanced with SuperAdmin and city references
- [x] Issue model updated with city ObjectId
- [x] Assignment model updated with city reference
- [x] Auth routes updated for role-based registration
- [x] Admin routes created for city and employee management
- [x] Migration script created
- [x] Duplicate issue bug fixed
- [x] Duplicate detection redirect fixed
- [x] Socket.io emission fixed with populated data
- [x] Database indexes added for performance
- [ ] Frontend updated to use new API
- [ ] All default passwords changed

---

## 🆘 Troubleshooting

### Migration Fails
```bash
# Check MongoDB connection
mongosh "<your_mongodb_uri>"

# Check env variables
cat backend/.env

# Run migration with verbose logging
node src/migrate.js 2>&1 | tee migration.log
```

### Can't Login After Migration
1. Verify user exists: `db.users.find({ email: "your_email" })`
2. Check password was migrated correctly
3. Verify `assignedCity` reference exists
4. Check JWT_SECRET in .env

### Issues Not Showing Up
1. Verify city reference was migrated
2. Check indexes: `db.issues.getIndexes()`
3. Verify socket.io is emitting populated data

---

## 📧 Support

For issues or questions, contact the development team or create an issue in the repository.

---

**Last Updated:** January 30, 2026  
**Version:** 2.0.0  
**Migration Required:** Yes
