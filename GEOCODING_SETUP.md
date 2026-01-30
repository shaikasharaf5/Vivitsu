# Geocoding Setup Guide

## Features Implemented

### 1. City Persistence
- Citizens and contractors can switch between cities
- Selected city persists across page navigation
- Automatically cleared on logout
- Defaults to user's assigned city on login

### 2. Location Services
- **Use My Location**: Get GPS coordinates and reverse geocode to address
- **Address Autocomplete**: Search addresses with live suggestions
- **Geocoding**: Convert addresses to lat/long for map pinpointing

## Geocoding API Options

### Option 1: Nominatim (OpenStreetMap) - FREE ✅ RECOMMENDED FOR TESTING
**No API key needed!**
- Completely free
- No registration required
- Rate limit: 1 request/second
- Good for development and testing

**Setup:**
```env
VITE_GEOCODING_PROVIDER=nominatim
```

**Pros:** Free, no setup
**Cons:** Rate limited, less reliable than paid services

---

### Option 2: LocationIQ - FREE TIER
**5,000 requests/day free**

**Setup:**
1. Go to https://locationiq.com/
2. Sign up for free account
3. Get API key from dashboard
4. Add to `.env`:
```env
VITE_GEOCODING_PROVIDER=locationiq
VITE_LOCATIONIQ_API_KEY=your_api_key_here
```

**Pros:** More reliable than Nominatim, good autocomplete
**Cons:** Requires registration

---

### Option 3: Mapbox - FREE TIER
**100,000 requests/month free**

**Setup:**
1. Go to https://www.mapbox.com/
2. Sign up for free account
3. Create access token
4. Add to `.env`:
```env
VITE_GEOCODING_PROVIDER=mapbox
VITE_MAPBOX_API_KEY=your_api_key_here
```

**Pros:** Best autocomplete, very accurate, generous free tier
**Cons:** Requires credit card for registration

---

## How to Configure

### Step 1: Copy environment file
```bash
cd frontend
cp .env.example .env
```

### Step 2: Choose your provider

For **Nominatim** (recommended for testing):
```env
VITE_GEOCODING_PROVIDER=nominatim
```
No other configuration needed!

For **LocationIQ**:
```env
VITE_GEOCODING_PROVIDER=locationiq
VITE_LOCATIONIQ_API_KEY=pk.your_key_here
```

For **Mapbox**:
```env
VITE_GEOCODING_PROVIDER=mapbox
VITE_MAPBOX_API_KEY=pk.your_key_here
```

### Step 3: Restart frontend server
```bash
npm run dev
```

## Usage in Application

### Report Issue Modal
1. **Use My Location Button**: 
   - Click to get current GPS coordinates
   - Automatically fetches address name from coordinates
   - Shows lat/long on map

2. **Address Search**:
   - Type address in the input field
   - Get autocomplete suggestions after 3 characters
   - Click suggestion to set location
   - Automatically gets lat/long for map marker

### City Selection
- Dropdown in navbar shows current city
- Switch between cities anytime
- Selection persists across navigation
- Automatically shows issues from selected city
- Cleared on logout

## API Response Formats

All geocoding functions return standardized format:

```javascript
{
  formattedAddress: "123 Main St, Bangalore, Karnataka, India",
  street: "Main St",
  city: "Bangalore",
  state: "Karnataka",
  country: "India",
  postalCode: "560001",
  latitude: 12.9716,
  longitude: 77.5946
}
```

## Rate Limits

| Provider | Free Tier Limit | Rate Limit |
|----------|----------------|------------|
| Nominatim | Unlimited | 1 req/sec |
| LocationIQ | 5,000/day | 2 req/sec |
| Mapbox | 100,000/month | 600 req/min |

## Troubleshooting

### Location not working
- Browser may block location on HTTP (use HTTPS or localhost)
- Check browser permissions for location access
- Make sure user granted location permission

### Geocoding errors
- Check API key is correct in `.env`
- Verify rate limits not exceeded
- Check internet connection
- Try switching to Nominatim for testing

### Address autocomplete not showing
- Type at least 3 characters
- Wait ~500ms for API response
- Check browser console for errors
- Verify GEOCODING_PROVIDER is set correctly

## Files Modified

1. `frontend/src/utils/geocoding.js` - Geocoding utility functions
2. `frontend/src/components/ReportIssueModal.jsx` - Location features in report form
3. `frontend/src/pages/CitizenDashboard.jsx` - City persistence
4. `frontend/src/pages/ContractorDashboard.jsx` - City persistence
5. `frontend/.env.example` - Environment configuration

## Testing

Start with Nominatim (no API key needed):
```env
VITE_GEOCODING_PROVIDER=nominatim
```

Test features:
1. Login as citizen/contractor
2. Click "Use My Location" when reporting issue
3. Type address and see autocomplete suggestions
4. Switch cities using dropdown
5. Navigate between pages - city selection persists
6. Logout - city selection clears
