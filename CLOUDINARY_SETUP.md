# Cloudinary Setup Guide

## Step 1: Create Cloudinary Account

1. Go to [cloudinary.com](https://cloudinary.com)
2. Click "Sign Up Free"
3. Sign up with email or Google
4. Verify your email
5. Complete profile setup

## Step 2: Get Your Credentials

1. Go to [Cloudinary Dashboard](https://cloudinary.com/console)
2. Look at the top of the page - you'll see:
   - **Cloud Name**: `xxx_xxxxx`
   - **API Key**: `123456789`
   - **API Secret**: `your-secret-key`

## Step 3: Add to Backend .env

Create `backend/.env` file:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name_from_dashboard
CLOUDINARY_API_KEY=your_api_key_from_dashboard
CLOUDINARY_API_SECRET=your_api_secret_from_dashboard
```

## Step 4: Test Connection

Run backend with logging enabled:

```bash
cd backend
npm run dev
```

You should see:
```
✅ Cloudinary configured
✅ Cloudinary connection successful
```

## Step 5: Upload Settings (Optional)

Go to Settings → Upload:
- Max file size: 5 MB (or higher)
- Auto-optimize delivery: ON
- Auto quality: ON

## Troubleshooting

### Error: "CLOUDINARY_CLOUD_NAME is missing"
- Make sure `.env` file exists in backend folder
- Check spelling: `CLOUDINARY_CLOUD_NAME` (not `CLOUD_NAME`)
- Restart backend: `npm run dev`

### Error: "Authentication failed"
- Verify API Key and Secret from dashboard
- Don't share your API Secret!
- Regenerate keys if unsure

### Images not uploading
- Check file size (max 5MB)
- Check file format (JPEG, PNG, WebP, GIF)
- Check Cloudinary folder structure at dashboard
- Check browser console for specific error

### Cloudinary connection check failed at startup
- This is OK - it will retry when you upload
- Make sure credentials are correct in `.env`

## Free Tier Limits

- **Storage**: 10 GB total
- **Bandwidth**: 25 GB/month
- **Transformations**: 300,000/month
- **Upload**: 300,000 files/month

Should be plenty for hackathon MVP!

## Production Considerations

For production after hackathon:
1. Use environment-specific credentials
2. Enable signed URLs for security
3. Setup auto-delete for old assets
4. Monitor bandwidth usage
5. Consider paid plan if scaling

## Verify Setup

Test with curl:

```bash
curl -X POST \
  -F "file=@/path/to/image.jpg" \
  -F "upload_preset=your_unsigned_preset" \
  https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/image/upload
```

Should return JSON with `secure_url`.
