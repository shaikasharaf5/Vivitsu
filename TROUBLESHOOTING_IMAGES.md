# Troubleshooting Image Display Issues

## Problem: Images Not Displaying (Broken Image Icon)

### Check 1: Verify Cloudinary URL in Database

**MongoDB:**
```javascript
// Connect to MongoDB and check an issue
db.issues.findOne({ photos: { $exists: true, $ne: [] } })

// Look for the 'photos' field
// Should look like:
{
  photos: [
    "https://res.cloudinary.com/dtozhvijc/image/upload/v1234567890/fixmycity/issues/..."
  ]
}

// ❌ WRONG: Local path
{
  photos: ["/uploads/1234567890-image.jpg"]
}
```

**If photos are local paths (`/uploads/...`):**
- Cloudinary upload failed
- Check backend logs for Cloudinary errors
- Verify Cloudinary credentials in `.env`

---

### Check 2: Browser Console

Open browser DevTools (F12) → Console tab

**Look for errors:**
```
Failed to load resource: net::ERR_FAILED
```

**Check the URL trying to load:**
```
❌ WRONG: http://localhost:5000/https://res.cloudinary.com/...
✅ CORRECT: https://res.cloudinary.com/dtozhvijc/image/upload/...
```

**If URL is doubled:**
- Frontend is prepending `VITE_API_URL` to Cloudinary URL
- Check `getImageUrl()` function in components

---

### Check 3: Network Tab

DevTools → Network tab → Filter: Img

**Click on failed image request:**

**Status Code 404:**
- Image doesn't exist on Cloudinary
- Upload failed but URL was saved
- Check Cloudinary dashboard: Media Library

**Status Code 403:**
- Cloudinary permissions issue
- Check Cloudinary settings → Upload → Access Control

**Status Code Mixed Content:**
- Frontend is HTTPS, backend is HTTP
- Change backend URL to HTTPS or frontend to HTTP

---

### Check 4: Cloudinary Dashboard

1. Go to https://cloudinary.com/console
2. Media Library → Search
3. Search for: `fixmycity/issues`

**Should see uploaded images:**
- If empty → uploads are failing
- If images exist → frontend display issue

---

## Solutions

### Solution 1: Fix Frontend Image Helper

**File:** `frontend/src/components/IssueCard.jsx`

```jsx
const getImageUrl = (photoUrl) => {
  // If it's already a full URL (Cloudinary), return as-is
  if (photoUrl && (photoUrl.startsWith('http://') || photoUrl.startsWith('https://'))) {
    return photoUrl;
  }
  // Otherwise, it's a local file, prepend API URL
  return `${import.meta.env.VITE_API_URL}${photoUrl}`;
};

// Use it:
<img src={getImageUrl(issue.photos[0])} />
```

---

### Solution 2: Add Error Handling to Images

```jsx
<img
  src={getImageUrl(issue.photos[0])}
  alt="Issue"
  onError={(e) => {
    console.error('Image failed to load:', issue.photos[0]);
    e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Found';
  }}
/>
```

---

### Solution 3: Verify Backend Saves Cloudinary URLs

**File:** `backend/src/routes/issues.js`

```javascript
// After Cloudinary upload
console.log(`✅ Cloudinary URL: ${cloudinaryResult.url}`);

// Before saving to database
issue.photos = processedPhotos.map(p => p.url);
console.log(`Saving photos:`, issue.photos);

await issue.save();
```

**Check logs:**
```
✅ Cloudinary URL: https://res.cloudinary.com/dtozhvijc/image/upload/...
Saving photos: [ 'https://res.cloudinary.com/dtozhvijc/...' ]
```

---

### Solution 4: Test Cloudinary URL Directly

**Copy a photo URL from MongoDB:**
```
https://res.cloudinary.com/dtozhvijc/image/upload/v1738108800/fixmycity/issues/...
```

**Paste in browser address bar:**
- ✅ Image loads → Frontend issue
- ❌ 404 error → Cloudinary upload issue

---

## Quick Fixes

### Fix 1: Clear Uploads Folder

```bash
cd backend
rm -rf uploads/*
```

Restart backend and try uploading again.

---

### Fix 2: Check `.env` Variables

```bash
# Backend .env
CLOUDINARY_CLOUD_NAME=dtozhvijc  # ✅ Your actual cloud name
CLOUDINARY_API_KEY=123456789    # ✅ Your actual API key
CLOUDINARY_API_SECRET=abc123    # ✅ Your actual secret

# Frontend .env
VITE_API_URL=http://localhost:5000  # ✅ No trailing slash
```

---

### Fix 3: Restart Everything

```bash
# Stop backend (Ctrl+C)
# Stop frontend (Ctrl+C)

# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm run dev
```

---

## Test Upload Flow

**Step 1: Upload image via frontend**

**Step 2: Check backend logs:**
```
📤 Uploading image 1 to Cloudinary...
✅ Image uploaded successfully
   URL: https://res.cloudinary.com/dtozhvijc/image/upload/...
```

**Step 3: Check MongoDB:**
```javascript
db.issues.findOne().photos
// Should return array of Cloudinary URLs
```

**Step 4: Check frontend Network tab:**
```
Request URL: https://res.cloudinary.com/...
Status: 200 OK
```

---

## Common Mistakes

### ❌ Mistake 1: Prepending API URL to Cloudinary URL

```jsx
// WRONG
<img src={`${import.meta.env.VITE_API_URL}${issue.photos[0]}`} />
// Results in: http://localhost:5000/https://res.cloudinary.com/...

// CORRECT
<img src={getImageUrl(issue.photos[0])} />
```

---

### ❌ Mistake 2: Missing Image Upload to Cloudinary

```javascript
// Backend saves local path instead of Cloudinary URL
issue.photos = ['/uploads/1234567890-image.jpg'];  // WRONG

// Should be:
issue.photos = ['https://res.cloudinary.com/...'];  // CORRECT
```

---

### ❌ Mistake 3: Cloudinary Upload Fails Silently

```javascript
// Add error handling
try {
  const cloudinaryResult = await uploadToCloudinary(filePath, issue._id, i);
  console.log('✅ Upload success:', cloudinaryResult.url);
} catch (error) {
  console.error('❌ Cloudinary upload failed:', error.message);
  throw error;  // Don't continue if upload fails
}
```

---

## Still Not Working?

**Contact:**
1. Check Cloudinary Status: https://status.cloudinary.com/
2. Cloudinary Support: https://support.cloudinary.com/
3. Check free tier limits:
   - 25 GB bandwidth/month
   - 10 GB storage
   - If exceeded, uploads fail silently

**Logs to share:**
- Backend console output (during upload)
- Browser console errors
- Network tab (failed requests)
- MongoDB document (issue.photos field)
