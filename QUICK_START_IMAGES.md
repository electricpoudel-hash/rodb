# Quick Start Guide - How to Fix Broken Images

## The Problem
❌ Images show as broken icons on the main website

## The Solution
✅ Use the new image upload feature in the admin panel

---

## Step-by-Step Instructions

### Step 1: Login to Admin Panel
- Go to: http://localhost:3000/admin
- Login with your credentials

### Step 2: Create or Edit an Article
1. Click on "Articles" in the left menu
2. Click "Create Article" button OR edit an existing article

### Step 3: Upload Featured Image (NEW FEATURE)
Look for the "Featured Image" section. It now has:
```
┌─────────────────────────────────────────┐
│ Featured Image                          │
├─────────────────────────────────────────┤
│ [Image URL input field] [Upload Image]  │
│ (optional: paste image URL here)   ↓    │
│                                    └─ Click this button
│ [Preview will appear below]
└─────────────────────────────────────────┘
```

### Step 4: Click "Upload Image" Button
- A file picker dialog opens
- Select an image from your computer (JPG, PNG, etc.)
- Click "Open"

### Step 5: See the Magic ✨
- Image is uploaded to server
- Image URL is automatically filled in the field
- Image preview appears below
- No more broken images!

### Step 6: Save the Article
- Fill in headline, category, summary, body
- Click "Create Article" or "Update Article"
- Done! ✓

---

## For Ads (Similar Process)

### Upload Ads with Correct Placement
1. Click "Ad Management" in left menu
2. Click "Add New Ad" button
3. Fill in ad details:
   - **Ad Size & Placement:** Choose ONE of these:
     - ✓ Header Banner (728 × 90 px) - displays in header
     - ✓ Left Sidebar (336 × 280 px) - displays in left sidebar
     - ✓ Right Sidebar (300 × 250 px) - displays in right sidebar
   - **Image URL:** Paste your ad image URL
   - **Link URL:** Where the ad should link to
4. Click "Save"
5. Ads appear immediately on the main website!

---

## What Changed?

### Before (Broken)
```
Only had text input:
┌──────────────────────────────────┐
│ Featured Image URL              │
│ [Paste URL here_______________] │
│                                 │
│ (User had to manually find      │
│  and paste image URLs)          │
└──────────────────────────────────┘
```

### After (Fixed)
```
Now has upload button:
┌──────────────────────────────────┐
│ Featured Image                   │
│ [URL input] [Upload Image] ← NEW │
│            ↑ Click to upload
│ [Preview Image Here]
│ (Automatic URL, image preview,
│  and validation!)
└──────────────────────────────────┘
```

---

## Why This Works

**Image Upload Flow:**
1. You select image file
2. Server automatically saves it
3. Server returns a working URL: `/uploads/image-name.jpg`
4. URL is stored in database
5. Website displays the image!

**No more:**
- ❌ Broken external URLs
- ❌ Paste errors
- ❌ Broken image icons
- ❌ Inefficient base64 strings

**Now you get:**
- ✅ One-click uploads
- ✅ Automatic compression (92% quality)
- ✅ Automatic image resizing
- ✅ Working URLs
- ✅ Image preview

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Upload Image" button doesn't work | Refresh page (Ctrl+F5) |
| Image doesn't upload | Check file size (max 10MB) |
| Image doesn't appear in preview | Check browser console for errors |
| Image appears broken on website | Clear browser cache (Ctrl+Shift+Del) |

---

## Summary

✅ **Images are now easy to upload**
✅ **Ads placement is now simple**  
✅ **No more broken image icons**

Just use the new "Upload Image" button and you're done!

