# FixMyCity - Setup and Run Guide

## ✅ All Code Fixed and Ready!

The codebase has been checked and all errors have been fixed. You're ready to run the application.

---

## 📦 Installation Steps

### 1. Install Backend Dependencies

```powershell
cd backend
npm install
```

### 2. Install Frontend Dependencies

```powershell
cd ../frontend
npm install
```

**Note:** All dependencies are now compatible with React 18.

---

## 🔧 Configuration

### Backend Environment Variables

Create a `.env` file in the `backend` folder with:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/fixmycity
# or use MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/fixmycity

# JWT Secret (change this to a random string)
JWT_SECRET=your-super-secret-jwt-key-change-this

# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Cloudinary (for image uploads - optional for testing)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Important:** If you don't have Cloudinary credentials yet, you can:
1. Sign up for free at https://cloudinary.com
2. Or comment out image upload features for initial testing

### Frontend Environment Variables

Create a `.env` file in the `frontend` folder with:

```env
VITE_API_URL=http://localhost:5000
```

---

## 🚀 Running the Application

### Option 1: Run Both Servers Separately (Recommended for Development)

**Terminal 1 - Backend:**
```powershell
cd backend
npm run dev
```

You should see:
```
✅ MongoDB Connected
🚀 Server running on port 5000
📍 Frontend URL: http://localhost:5173
📚 API: http://localhost:5000/api
```

**Terminal 2 - Frontend:**
```powershell
cd frontend
npm run dev
```

You should see:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### Option 2: Using the PowerShell Scripts

**Start Backend:**
```powershell
cd backend
npm run dev
```

**Start Frontend (in a new terminal):**
```powershell
cd frontend
npm run dev
```

---

## 🌐 Access the Application

Once both servers are running:

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000/api
- **Health Check:** http://localhost:5000/health

---

## 👥 User Roles & Test Accounts

You'll need to create accounts for different roles:

### 1. Admin Account
- Register as a regular user first
- Manually update the role in MongoDB:
```javascript
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "ADMIN" } }
)
```

### 2. Citizen Account
- Regular user registration (default role)
- Can report issues, upvote, comment

### 3. Worker Account
- Created through Admin Dashboard > Employee Management
- Role: WORKER
- Assign work location (lat, lng, radius)
- Set capacity (max issues)

### 4. Inspector Account
- Created through Admin Dashboard > Employee Management
- Role: INSPECTOR
- Can verify worker updates

### 5. Contractor Account
- Created through Admin Dashboard > Employee Management
- Role: CONTRACTOR
- Can bid on open issues

---

## 🔄 Testing the Complete Workflow

### Step 1: Create Admin User
1. Register a new account at http://localhost:5173/signup
2. Use MongoDB Compass or mongosh to update the role:
   ```javascript
   use fixmycity
   db.users.updateOne(
     { email: "your-email@example.com" },
     { $set: { role: "ADMIN", assignedCity: ObjectId("your-city-id") } }
   )
   ```

### Step 2: Create City (as Admin)
1. Login as admin
2. Go to Admin Dashboard
3. Create a new city (e.g., "Mumbai")

### Step 3: Add Employees (as Admin)
1. Go to Admin Dashboard > Employees Tab
2. Add a Worker:
   - Role: WORKER
   - Assign city
   - Set work location (e.g., 19.0760, 72.8777, radius: 5km)
   - Max capacity: 5
3. Add an Inspector:
   - Role: INSPECTOR
   - Assign city
4. Add a Contractor:
   - Role: CONTRACTOR
   - Assign city

### Step 4: Report Issue (as Citizen)
1. Register a new citizen account
2. Click "Report Issue"
3. Add title, description, photos
4. Select category and location
5. Submit

### Step 5: Categorize & Assign (as Admin)
1. Login as admin
2. View the reported issue
3. Option A: Auto-assign to nearest worker
4. Option B: Open for contractor bidding

### Step 6A: Worker Workflow (if assigned to worker)
1. Login as worker
2. View assigned issue in Worker Dashboard
3. Click "Submit Work Update"
4. Add progress notes and photos
5. Mark as "Completed"

### Step 6B: Contractor Workflow (if open for bidding)
1. Login as contractor
2. Go to Contractor Dashboard
3. View "Open Issues" tab
4. Submit bid with:
   - Bid amount
   - Estimated days
   - Proposal
   - Methodology
   - Materials breakdown
5. Wait for admin approval

### Step 7: Admin Reviews Bids (for contractor path)
1. Login as admin
2. Click "Review Bids" button
3. Review all pending bids
4. Approve one bid (others auto-rejected)
5. Issue assigned to contractor

### Step 8: Inspector Verification (for both paths)
1. Login as inspector
2. Go to Inspector Dashboard
3. View completed work updates
4. Review photos and description
5. Approve or Reject
6. If approved, issue status → RESOLVED

### Step 9: View on Map (as Admin)
1. Login as admin
2. Click "Map View" button
3. See all issues with color-coded markers
4. Toggle worker service areas
5. Click markers for details

---

## 🛠️ Troubleshooting

### Backend won't start

**Issue:** MongoDB connection failed
```
❌ MongoDB connection failed: connect ECONNREFUSED
```

**Solution:**
- Make sure MongoDB is running: `net start MongoDB` (Windows)
- Or use MongoDB Atlas cloud database
- Check MONGODB_URI in .env file

---

**Issue:** Cloudinary errors
```
⚠️ Cloudinary check failed (image uploads will not work)
```

**Solution:**
- Sign up for free at https://cloudinary.com
- Add credentials to .env file
- Or disable image upload features temporarily

---

### Frontend won't start

**Issue:** Module not found: 'react-leaflet-cluster'
```
Error: Cannot find module 'react-leaflet-cluster'
```

**Solution:**
```powershell
cd frontend
npm install react-leaflet-cluster
```

---

**Issue:** Cannot connect to backend
```
Network Error or CORS issues
```

**Solution:**
- Make sure backend is running on port 5000
- Check VITE_API_URL in frontend/.env
- Verify FRONTEND_URL in backend/.env

---

### No issues showing up

**Issue:** Worker dashboard is empty

**Solution:**
- Make sure you're logged in with a worker account
- Check that issues are assigned to your worker ID
- Verify the worker's city matches the issue's city

---

**Issue:** Auto-assignment not working

**Solution:**
- Make sure worker has:
  - Status: ACTIVE
  - Work location set (latitude, longitude, radius)
  - Available capacity (currentLoad < maxCapacity)
- Issue must be within worker's service radius

---

## 📁 Project Structure

```
FixMyCity/
├── backend/
│   ├── src/
│   │   ├── models/         # MongoDB models
│   │   │   ├── User.js
│   │   │   ├── Issue.js
│   │   │   ├── City.js
│   │   │   ├── Employee.js
│   │   │   ├── WorkUpdate.js
│   │   │   └── ContractorBid.js
│   │   ├── routes/         # API routes
│   │   │   ├── auth.js
│   │   │   ├── issues.js
│   │   │   ├── employees.js
│   │   │   ├── workUpdates.js
│   │   │   ├── bids.js
│   │   │   ├── autoAssignment.js
│   │   │   ├── admin.js
│   │   │   └── analytics.js
│   │   ├── middleware/     # Auth, validation
│   │   ├── utils/          # Cloudinary, helpers
│   │   └── server.js       # Main entry point
│   ├── .env               # Environment config
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── pages/         # Main pages
    │   │   ├── Home.jsx
    │   │   ├── IssueDetail.jsx
    │   │   ├── AdminDashboard.jsx
    │   │   ├── WorkerDashboard.jsx
    │   │   ├── InspectorDashboard.jsx
    │   │   └── ContractorDashboard.jsx
    │   ├── components/    # Reusable components
    │   │   ├── EmployeeManagement.jsx
    │   │   ├── WorkUpdateModal.jsx
    │   │   ├── BidReviewModal.jsx
    │   │   └── IssueMapView.jsx
    │   ├── utils/         # Axios, auth context
    │   └── App.jsx
    ├── .env
    └── package.json
```

---

## 🎯 Key Features Implemented

✅ **Multi-City Support**
- Users can select and switch between cities
- City-specific issue tracking
- City-based employee assignment

✅ **Employee Management**
- Admin can add workers, inspectors, contractors
- Location-based worker assignment
- Capacity management

✅ **Auto-Assignment Algorithm**
- Haversine distance calculation
- Finds nearest available worker
- Respects service radius and capacity

✅ **Worker Dashboard**
- View assigned issues
- Submit work updates with photos
- Track progress (ALL/ASSIGNED/IN_PROGRESS/COMPLETED)

✅ **Inspector Verification**
- Review worker updates
- View completion photos
- Approve/reject with notes

✅ **Contractor Bidding**
- View open issues for bidding
- Submit detailed bids (amount, proposal, methodology, materials)
- Track bid status (pending/approved/rejected)

✅ **Public Tender Transparency**
- All bids publicly visible on issue detail page
- Sorted by amount (lowest first)
- Shows contractor info, ratings, proposals
- Statistics dashboard

✅ **Admin Bid Review**
- Modal interface for reviewing bids
- Approve one bid (auto-reject others)
- Add review notes

✅ **Map Visualization**
- Interactive Leaflet map
- Color-coded issue markers
- Worker service area circles
- Clustering for dense areas
- Popups with details

✅ **Photo Verification**
- Workers upload progress photos
- Inspectors verify completion visually
- Multiple photo support

✅ **Complete Issue Lifecycle**
```
REPORTED → CATEGORIZED → ASSIGNED → IN_PROGRESS → COMPLETED → RESOLVED
           └─────────→ OPEN_FOR_BIDDING (contractor path)
```

---

## 🔐 Security Features

- JWT-based authentication
- Role-based access control (RBAC)
- Password hashing (bcrypt)
- Protected API routes
- Input validation
- CORS configuration

---

## 📊 Analytics & Reporting

Admin dashboard provides:
- Total issues by status
- Category distribution
- Trending issues (by upvotes)
- Employee statistics
- Resolution rates

---

## 🌟 Next Steps

1. **Testing:**
   - Test complete citizen → worker → inspector flow
   - Test contractor bidding flow
   - Test auto-assignment with multiple workers
   - Test map view with many issues

2. **Data Seeding:**
   - Create sample cities
   - Add multiple workers per city
   - Create diverse issue categories

3. **Performance:**
   - Add pagination for large issue lists
   - Optimize image loading
   - Cache frequently accessed data

4. **Deployment:**
   - Deploy backend to Heroku/Railway/Render
   - Deploy frontend to Vercel/Netlify
   - Use MongoDB Atlas for production database
   - Configure production environment variables

---

## 🐛 Known Issues & Fixes

All critical bugs have been fixed:
- ✅ WorkerDashboard duplicate code removed
- ✅ IssueDetail broken comment syntax fixed
- ✅ All JSX syntax errors resolved
- ✅ Backend routes properly registered

---

## 📞 Support

If you encounter issues:
1. Check the error messages in browser console (F12)
2. Check backend terminal for API errors
3. Verify all environment variables are set
4. Make sure MongoDB is running
5. Clear browser cache if needed

---

## 🎉 You're All Set!

Run these commands to get started:

```powershell
# Terminal 1 - Backend
cd backend
npm install
npm run dev

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev
```

Then open http://localhost:5173 in your browser!
