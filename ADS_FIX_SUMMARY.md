# Ads Display Issue - Root Cause & Fix

## Problem
Ads were not displaying on the main website even though they were uploaded from the admin panel.

## Root Cause
**Placement Value Mismatch** - There was a disconnect between the frontend and admin panel:

### Frontend Expected Placements (main.js):
- `header` - Header area
- `content_top` - Left sidebar top
- `content_bottom` - Right sidebar bottom

### Admin Panel Offered Placements (admin.js):
- `leaderboard`, `large_rectangle`, `medium_rectangle`, `wide_skyscraper`, `skyscraper`, `button1`, `button2`, `microbar`

When ads were created in the admin panel with these mismatched placement values, the frontend `loadAds()` function couldn't find any ads with the expected placements, so nothing was displayed.

## Solution
Updated the admin panel to use the correct placement values that match what the frontend expects:

### Changes Made:

1. **[server/public/admin/index.html](server/public/admin/index.html)** - Updated ad placement dropdown options:
   - ✅ `header` → Header Banner (728 × 90 px)
   - ✅ `content_top` → Left Sidebar (336 × 280 px)
   - ✅ `content_bottom` → Right Sidebar (300 × 250 px)

2. **[server/public/admin/js/admin.js](server/public/admin/js/admin.js)** - Updated the ad size mapping:
   - Removed: `leaderboard`, `large_rectangle`, `medium_rectangle`, etc.
   - Added: `header`, `content_top`, `content_bottom`

## How Ads Display Now:
1. **Header Banner** - Displays in the header area (top of page)
2. **Left Sidebar Ad** - Displays below the news feed on the left side
3. **Right Sidebar Ad** - Displays below the hot news on the right side

## Mobile Responsiveness:
- On mobile (width ≤ 768px), the layout switches to a mobile view
- Ads are positioned appropriately for mobile screens
- The header ad is responsive and adapts to screen width

## Next Steps:
1. Upload new ads from the admin panel using the corrected placement options
2. Ads should now appear on both desktop and mobile versions
3. Impressions and clicks will be tracked automatically for analytics

## Database Note:
Existing ads with old placement values (leaderboard, etc.) will need to be deleted and re-created with the new placement values, or a database migration could be run to update them.
