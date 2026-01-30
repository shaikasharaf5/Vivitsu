# 🚀 Quick Start - Backend Migration

## Immediate Next Steps

### 1. Run the Migration

```powershell
cd backend
npm run migrate
```

**Expected Output:**
```
🔄 Starting database migration to multi-city schema...
🔗 Connecting to MongoDB...
✅ Connected to MongoDB

👑 Step 1: Creating Super Admin...
✅ Super Admin created
   Email: superadmin@fixmycity.gov.in
   Password: SuperAdmin@123

🏙️  Step 2: Creating default cities...
✅ Created 5 default cities
   - Bangalore, Karnataka
   - Mumbai, Maharashtra
   - Delhi, Delhi
   - Chennai, Tamil Nadu
   - Kolkata, West Bengal

👥 Step 3: Migrating existing users...
✅ Migrated X users with city assignments

📋 Step 4: Migrating existing issues...
✅ Migrated X issues with city references

📑 Step 5: Updating assignments...
✅ Updated X assignments with city references

🏛️  Step 6: Creating municipal admins...
   ✅ Created admin for Bangalore
      Email: admin@bangalore.gov.in
      Password: Admin@Bangalore123
   ...

🎉 Migration completed successfully!
```

### 2. Test the API

#### Test SuperAdmin Login
```powershell
# Using curl
curl -X POST http://localhost:5000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"superadmin@fixmycity.gov.in\",\"password\":\"SuperAdmin@123\"}'

# Or use Postman/Thunder Client
```

#### Test Getting Cities
```powershell
# Public endpoint (no auth required)
curl http://localhost:5000/api/admin/cities/public
```

### 3. Frontend Changes Required

Update your frontend code to handle the fixed duplicate detection:

**In your issue creation component:**

```javascript
// OLD CODE (BROKEN):
const response = await axios.post('/api/issues', formData);
if (response.data.isDuplicate) {
  // This wasn't working properly
  toast.warning('Duplicate issue found');
}

// NEW CODE (WORKING):
const response = await axios.post('/api/issues', formData);
if (response.data.isDuplicate && response.data.redirectToIssue) {
  // Redirect to the existing issue
  navigate(`/issue/${response.data.redirectToIssue}`);
  toast.info(`Similar issue found (${response.data.matchScore}% match). Redirecting...`);
  return; // Don't create new issue
}
```

**For Socket.io duplicate prevention:**

```javascript
// In your context or component where you listen to socket events
useEffect(() => {
  if (!socket) return;
  
  // Track recently added issues to prevent duplicates
  const recentlyAdded = new Set();
  
  socket.on('issueCreated', (data) => {
    const issueId = data.issue._id;
    
    // Prevent duplicate rendering
    if (recentlyAdded.has(issueId)) {
      console.log('Duplicate socket event ignored');
      return;
    }
    
    recentlyAdded.add(issueId);
    
    // Add to your state
    setIssues(prev => [data.issue, ...prev]);
    
    // Clean up after 5 seconds
    setTimeout(() => recentlyAdded.delete(issueId), 5000);
  });
  
  return () => socket.off('issueCreated');
}, [socket]);
```

---

## 🔑 Default Credentials Summary

| Role | Email | Password |
|------|-------|----------|
| **Super Admin** | superadmin@fixmycity.gov.in | SuperAdmin@123 |
| **Bangalore Admin** | admin@bangalore.gov.in | Admin@Bangalore123 |
| **Mumbai Admin** | admin@mumbai.gov.in | Admin@Mumbai123 |
| **Delhi Admin** | admin@delhi.gov.in | Admin@Delhi123 |
| **Chennai Admin** | admin@chennai.gov.in | Admin@Chennai123 |
| **Kolkata Admin** | admin@kolkata.gov.in | Admin@Kolkata123 |

⚠️ **CHANGE ALL PASSWORDS IMMEDIATELY AFTER FIRST LOGIN!**

---

## 🧪 Quick Testing Checklist

### Backend Tests

- [ ] Migration ran successfully
- [ ] SuperAdmin can login
- [ ] Municipal Admin can login
- [ ] GET `/api/admin/cities/public` returns 5 cities
- [ ] Citizen can register with city selection
- [ ] Contractor can register with company name
- [ ] Worker/Inspector CANNOT self-register
- [ ] Issue creation returns `redirectToIssue` when duplicate found
- [ ] Real-time updates don't create duplicate issues
- [ ] Admin can create worker (auto-generates username/password)
- [ ] Admin can create inspector (auto-generates username/password)

### API Endpoint Tests

```powershell
# 1. Get public cities
curl http://localhost:5000/api/admin/cities/public

# 2. Register as citizen
curl -X POST http://localhost:5000/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{
    \"email\":\"citizen@test.com\",
    \"password\":\"Test123!\",
    \"firstName\":\"Test\",
    \"lastName\":\"Citizen\",
    \"role\":\"CITIZEN\",
    \"cityId\":\"<city_id_from_step_1>\"
  }'

# 3. Login as SuperAdmin
curl -X POST http://localhost:5000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{
    \"email\":\"superadmin@fixmycity.gov.in\",
    \"password\":\"SuperAdmin@123\"
  }'
# Save the token from response

# 4. Get all cities analytics (SuperAdmin)
curl http://localhost:5000/api/admin/analytics/all-cities `
  -H "Authorization: Bearer <token_from_step_3>"

# 5. Login as Municipal Admin
curl -X POST http://localhost:5000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{
    \"email\":\"admin@bangalore.gov.in\",
    \"password\":\"Admin@Bangalore123\"
  }'
# Save the token

# 6. Create a worker (Municipal Admin)
curl -X POST http://localhost:5000/api/admin/employees `
  -H "Authorization: Bearer <admin_token>" `
  -H "Content-Type: application/json" `
  -d '{
    \"firstName\":\"Rajesh\",
    \"lastName\":\"Kumar\",
    \"role\":\"WORKER\",
    \"phone\":\"+91-9876543210\"
  }'
# Note the username and temporaryPassword from response

# 7. Login as worker
curl -X POST http://localhost:5000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{
    \"username\":\"WRK_BAN_RAJ1\",
    \"password\":\"<temporary_password_from_step_6>\"
  }'
```

---

## ⚡ Common Issues & Solutions

### Issue: Migration fails with "City not found"
**Solution:** Check your MongoDB connection string in `.env`

### Issue: "Cannot self-register" error
**Solution:** Only CITIZEN and CONTRACTOR can self-register. Workers/Inspectors must be created by Admin.

### Issue: "User must be assigned to a city"
**Solution:** Make sure you're passing `cityId` in registration or user has `assignedCity` set.

### Issue: Socket.io still showing duplicates
**Solution:** Update frontend to track recently added issue IDs (see code above)

### Issue: Duplicate detection not redirecting
**Solution:** Check for `response.data.redirectToIssue` in frontend and use `navigate()` to redirect

---

## 📱 Next Frontend Development Steps

1. **Update Registration Forms:**
   - Add city selector dropdown for Citizens/Contractors
   - Add company name field for Contractors
   - Hide self-registration for Workers/Inspectors

2. **Create SuperAdmin Dashboard:**
   - City management (add/view cities)
   - Create municipal admins
   - All-cities analytics

3. **Create Admin Dashboard Features:**
   - Employee creation form (Worker/Inspector)
   - Display auto-generated credentials
   - City-specific analytics

4. **Fix Issue Creation:**
   - Handle `redirectToIssue` in response
   - Show duplicate match score
   - Redirect instead of creating duplicate

5. **Update Socket.io Listeners:**
   - Prevent duplicate rendering
   - Track recently added issues

---

## 📞 Need Help?

- Check [BACKEND_MIGRATION_GUIDE.md](./BACKEND_MIGRATION_GUIDE.md) for detailed documentation
- Review API responses for error messages
- Check server logs for detailed error traces
- Verify .env file has all required variables

---

**Happy Coding! 🚀**
