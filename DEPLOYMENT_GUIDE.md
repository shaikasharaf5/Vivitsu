# FixMyCity Deployment Guide (Free Tier)

## Overview
Complete guide to deploy FixMyCity using free tier services:
- **Frontend**: Vercel (free)
- **Backend**: Railway or Render (free)
- **Database**: MongoDB Atlas (free)
- **Image Storage**: Cloudinary (free)

---

## 1. MongoDB Atlas Setup (Free)

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up for free account
3. Create free tier cluster
4. Whitelist IP: 0.0.0.0/0 (for development)
5. Create database user
6. Copy connection string:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/fixmycity
   ```
7. Add to `.env`

**Free Tier Limits:**
- 512 MB storage
- Shared RAM
- No backups
- OK for MVP with <10k documents

---

## 2. Cloudinary Setup (Free)

1. Go to [cloudinary.com](https://cloudinary.com)
2. Sign up (free tier includes 25 GB/month)
3. Go to Dashboard → Settings → API Keys
4. Copy:
   - CLOUDINARY_CLOUD_NAME
   - CLOUDINARY_API_KEY
   - CLOUDINARY_API_SECRET
5. Add to `.env`

**Free Tier Limits:**
- 25 GB bandwidth/month
- 300,000 transformations/month
- OK for MVP with ~500 images

---

## 3. Backend Deployment (Railway)

### Option A: Railway (Recommended, simpler)

1. Go to [railway.app](https://railway.app)
2. Login with GitHub
3. Create new project
4. Connect GitHub repo
5. Configure environment:
   ```
   PORT=3000
   MONGODB_URI=mongodb+srv://...
   JWT_SECRET=your-secret
   CLOUDINARY_CLOUD_NAME=...
   CLOUDINARY_API_KEY=...
   CLOUDINARY_API_SECRET=...
   NODE_ENV=production
   FRONTEND_URL=https://your-frontend.vercel.app
   ```
6. Deploy automatically on git push

**Free Tier:**
- 500 hours/month
- OK for MVP

---

### Option B: Render (Alternative)

1. Go to [render.com](https://render.com)
2. New Web Service → Connect repo
3. Build: `npm install`
4. Start: `npm start`
5. Set environment variables in dashboard
6. Deploy

**Free Tier:**
- Auto-pauses after 15 min inactivity
- Slow cold start (30s)
- Good for low-traffic

---

## 4. Frontend Deployment (Vercel)

1. Go to [vercel.com](https://vercel.com)
2. Import project from GitHub
3. Framework: Vite
4. Root Directory: `frontend`
5. Build Command: `npm run build`
6. Output Directory: `dist`
7. Environment Variables:
   ```
   VITE_API_URL=https://your-backend.railway.app
   VITE_SOCKET_URL=https://your-backend.railway.app
   ```
8. Deploy

**Free Tier:**
- Unlimited deployments
- Automatic SSL
- Edge caching
- Perfect for frontend

---

## 5. Complete Environment Variables

### Backend `.env`
```env
PORT=3000
NODE_ENV=production

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/fixmycity

# Auth
JWT_SECRET=your-super-secret-key-min-32-chars

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Images
MAX_IMAGE_SIZE=5242880
PHASH_THRESHOLD=10
IMAGE_SIMILARITY_THRESHOLD=0.85

# CORS
FRONTEND_URL=https://your-frontend.vercel.app
```

### Frontend `.env`
```env
VITE_API_URL=https://your-backend-url.railway.app
VITE_SOCKET_URL=https://your-backend-url.railway.app
```

---

## 6. MongoDB Atlas Network Access

1. Go to Network Access
2. Add IP Address: `0.0.0.0/0` (allow all)
3. Or add specific IPs:
   - Railway: `auto-allow`
   - Vercel: `auto-allow`

---

## 7. Testing Deployment

```bash
# Test backend
curl https://your-backend.railway.app/health

# Response should be:
# {"status":"OK","timestamp":"..."}

# Test auth
curl -X POST https://your-backend.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","firstName":"Test","lastName":"User"}'
```

---

## 8. Troubleshooting

### Images not uploading
- Check Cloudinary credentials in environment
- Verify API key has upload permissions
- Check free tier usage (25GB/month limit)

### Database connection failing
- Verify IP whitelist (0.0.0.0/0)
- Check connection string format
- Test locally first

### Slow socket.io
- Railway may have connection limits
- Upgrade to paid if needed
- Or use ngrok for testing

### Cold starts on Render
- Expect 30-60s first request
- Use Railway instead for better performance

---

## 9. Monitoring & Scaling

### Free Tier Bottlenecks
1. **MongoDB**: 512 MB storage (upgrade needed for production)
2. **Cloudinary**: 25 GB/month bandwidth
3. **Railway**: 500 hours/month
4. **Vercel**: Generous limits

### When to Upgrade
- >10k issues → upgrade MongoDB
- >500 images → manage Cloudinary storage
- Consistent traffic → upgrade Railway

---

## 10. Demo Setup (Local Testing)

```bash
# Terminal 1: Backend
cd backend
npm install
echo "MONGODB_URI=mongodb+srv://..." > .env
npm run dev

# Terminal 2: Frontend
cd frontend
npm install
npm run dev

# Open http://localhost:5173
```

---

## Quick Deploy Checklist

- [ ] MongoDB Atlas cluster created + connection string
- [ ] Cloudinary account created + credentials
- [ ] GitHub repo created + pushed
- [ ] Railway/Render connected to GitHub
- [ ] Environment variables set on railway
- [ ] Vercel connected to GitHub
- [ ] Environment variables set on vercel
- [ ] Backend deployed and `/health` working
- [ ] Frontend deployed and loading
- [ ] Can register user
- [ ] Can report issue
- [ ] Images uploading to Cloudinary
- [ ] Real-time updates working

---

## Production Considerations (Post-MVP)

1. **Security**
   - Use OAuth instead of password auth
   - Add rate limiting
   - Validate/sanitize all inputs
   - Use HTTPS only (automatic on Vercel/Railway)

2. **Scaling**
   - Migrate to PostgreSQL
   - Add Redis for caching
   - Use CDN for images
   - Implement API rate limiting

3. **Monitoring**
   - Add error tracking (Sentry)
   - Monitor performance (New Relic)
   - Setup alerts

4. **Infrastructure**
   - Use managed database
   - Add backup strategy
   - Geographic redundancy
   - Load balancing

---

## Cost Estimation (Free Tier)

| Service | Free Tier | Usage | Cost |
|---------|-----------|-------|------|
| MongoDB Atlas | 512 MB | <10k docs | Free |
| Cloudinary | 25 GB/mo | <500 images | Free |
| Railway | 500 hrs/mo | Always-on | Free |
| Vercel | Unlimited | Deployments | Free |
| **TOTAL** | | | **$0** |

**Paid Upgrades (if needed)**
- MongoDB M10: $57/mo
- Cloudinary: $99/mo (100 GB)
- Railway Pro: $7/mo
- **Total: ~$160/mo** for production ready

