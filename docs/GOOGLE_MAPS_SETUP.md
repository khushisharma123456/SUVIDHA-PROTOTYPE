# Google Maps Integration Setup

## Overview
The Community page now includes an interactive map feature that displays when you select a city. To enable this feature, you need to add a Google Maps API key.

## Steps to Get Google Maps API Key

### 1. Go to Google Cloud Console
Visit: https://console.cloud.google.com/

### 2. Create a New Project (or select existing)
- Click on the project dropdown at the top
- Click "New Project"
- Give it a name like "Suvidha-Maps"
- Click "Create"

### 3. Enable Maps Embed API
- Go to "APIs & Services" > "Library"
- Search for "Maps Embed API"
- Click on it and press "Enable"

### 4. Create API Key
- Go to "APIs & Services" > "Credentials"
- Click "Create Credentials" > "API Key"
- Copy the generated API key

### 5. Restrict the API Key (Recommended for Security)
- Click on the API key you just created
- Under "Application restrictions":
  - Select "HTTP referrers (web sites)"
  - Add your domain (e.g., `yourdomain.com/*`)
  - For local development, add: `localhost/*` and `127.0.0.1/*`
- Under "API restrictions":
  - Select "Restrict key"
  - Choose "Maps Embed API"
- Click "Save"

## Implementation

### Update the Controller
Open `static/app/controllers/community.controller.js` and find this line:

```javascript
vm.mapUrl = 'https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=' + 
```

Replace `YOUR_API_KEY` with your actual Google Maps API key:

```javascript
vm.mapUrl = 'https://www.google.com/maps/embed/v1/place?key=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX&q=' + 
```

## Alternative: Use OpenStreetMap (Free, No API Key Required)

If you don't want to use Google Maps, you can use OpenStreetMap instead. Update the `showCityMap` function:

```javascript
vm.showCityMap = function() {
    var coords = vm.cityCoordinates[vm.selectedCity];
    if (coords) {
        vm.showMap = true;
        // OpenStreetMap embed (no API key needed)
        vm.mapUrl = 'https://www.openstreetmap.org/export/embed.html?bbox=' + 
            (coords.lng - 0.1) + ',' + (coords.lat - 0.1) + ',' + 
            (coords.lng + 0.1) + ',' + (coords.lat + 0.1) + 
            '&layer=mapnik&marker=' + coords.lat + ',' + coords.lng;
        $timeout(function() {
            vm.showMap = true;
        }, 100);
    }
};
```

## Testing

1. Open the Community page
2. Select a state from the dropdown
3. Select a city
4. A map modal should appear showing the selected city
5. Click the X button or outside the modal to close it

## Troubleshooting

### Map doesn't load
- Check browser console for errors
- Verify API key is correct
- Ensure Maps Embed API is enabled in Google Cloud Console
- Check API key restrictions

### "This page can't load Google Maps correctly"
- Your API key might not have billing enabled
- Check if you've exceeded the free tier quota
- Verify the API key restrictions allow your domain

## Free Tier Limits

Google Maps offers:
- $200 free credit per month
- Maps Embed API: 28,000 loads per month for free
- This should be sufficient for most applications

## Cost Optimization

To minimize costs:
1. Set up API key restrictions
2. Implement caching where possible
3. Only load maps when needed (already implemented)
4. Monitor usage in Google Cloud Console

## Support

For more information:
- Google Maps Platform Documentation: https://developers.google.com/maps/documentation
- Pricing: https://mapsplatform.google.com/pricing/
