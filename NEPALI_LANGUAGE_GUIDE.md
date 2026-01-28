# Nepali Language Support Implementation Guide

## Overview
This website now supports Nepali (नेपाली) language in Devanagari script. The implementation is simple and non-breaking - it adds language switching without affecting any existing functionality.

## What's Been Done

### 1. **Translation Files Created**
- `/server/public/i18n/ne.json` - Nepali translations (Devanagari)
- `/server/public/i18n/en.json` - English translations (reference)

### 2. **Language Switcher Module**
- `/server/public/i18n/i18n.js` - i18n utility class
  - Detects user's browser language preference
  - Saves language preference to localStorage
  - Loads and applies translations dynamically
  - Creates language switcher buttons (नेपाली | English)

### 3. **Integration Points**
- **Admin Panel** (`/server/public/admin/index.html`): Language switcher in header
- **Main Site** (`/server/public/site/index.html`): Language switcher in header

## How It Works

### Language Detection
1. Checks localStorage for saved language preference
2. Falls back to browser language (if it starts with 'ne' → Nepali)
3. Defaults to English if neither applies

### Translation Application
Uses `data-i18n` HTML attribute to mark translatable strings:
```html
<button data-i18n="admin.save">Save</button>
<span data-i18n="common.welcome">Welcome</span>
```

### Language Switching
Buttons automatically apply translations when language changes:
- नेपाली (Nepali) - Shows all text in Devanagari script
- English - Shows all text in English

## Translation File Structure

```json
{
  "common": {
    "save": "Save",
    "delete": "Delete",
    "search": "Search",
    ...
  },
  "site": {
    "welcome": "Welcome to RODB",
    "categories": "Categories",
    ...
  },
  "admin": {
    "dashboard": "Dashboard",
    "articles": "Articles",
    ...
  },
  "errors": {
    "loading": "Failed to load",
    "network": "Network error",
    ...
  }
}
```

## Adding Translations to UI Elements

### Method 1: Using data-i18n attribute (Preferred)
```html
<!-- For buttons/text content -->
<button data-i18n="admin.save">Save</button>

<!-- For input placeholders -->
<input type="text" data-i18n="common.search" placeholder="Search">

<!-- For labels -->
<label data-i18n="admin.title">Article Title</label>
```

### Method 2: Using i18n.t() in JavaScript
```javascript
const label = i18n.t('admin.dashboard');
console.log(label); // "ड्यासबोर्ड" (if Nepali) or "Dashboard" (if English)
```

### Method 3: Using in element creation
```javascript
const button = document.createElement('button');
button.textContent = i18n.t('admin.save');
button.className = 'btn';
document.body.appendChild(button);
```

## Current Translation Coverage

### Supported Sections
- **common**: 15+ key UI terms
- **site**: 20+ website-specific terms
- **admin**: 30+ admin panel terms
- **errors**: 8+ error messages

### Translations for Common Areas
- Dashboard statistics
- Article management
- Navigation menu
- Categories
- Users & Settings
- Ads & Analytics
- Error messages

## Features

✅ **Non-Breaking**: All existing functionality preserved
✅ **Seamless**: Automatic language detection from browser
✅ **Persistent**: Language preference saved to localStorage
✅ **Responsive**: Works on desktop and mobile
✅ **Easy to Extend**: Simple JSON file format for adding more translations
✅ **Fonts Already Supported**: Mukta font in use supports Devanagari script
✅ **Database Compatible**: UTF-8 charset already in place

## Browser Compatibility

Works on all modern browsers:
- Chrome/Edge (99+)
- Firefox (95+)
- Safari (15+)
- Mobile browsers (iOS Safari, Chrome for Android)

## To Use the Language Switcher

1. Open the website (both admin panel and main site)
2. Look for the language buttons in the top-right header area
3. Click "नेपाली" to switch to Nepali
4. Click "English" to switch to English
5. Your preference is saved automatically

## Adding More Translations

1. Open `/server/public/i18n/ne.json` (for Nepali) or `en.json` (for English)
2. Add your translation entries:
   ```json
   "section": {
     "key": "translation text"
   }
   ```
3. In HTML, add `data-i18n="section.key"` to elements
4. The translation will apply automatically when the language is switched

## Technical Details

### File Locations
```
/server/public/i18n/
├── ne.json         # Nepali translations
├── en.json         # English translations
└── i18n.js         # i18n utility library
```

### Integration Files Modified
- `/server/public/admin/index.html` - Added language switcher UI
- `/server/public/admin/js/admin.js` - Initialize switcher on dashboard load
- `/server/public/site/index.html` - Added language switcher UI
- `/server/public/site/js/main.js` - Initialize switcher on page load

### localStorage Keys
- `language` - Stores user's selected language (value: 'en' or 'ne')

### API Integration
The i18n module is **client-side only** - no API changes needed.

## Next Steps (Optional)

If you want to enhance this further:

1. **Add more languages**: Create new JSON files (e.g., `es.json` for Spanish)
2. **Persist translations on server**: Store user language preference in user profile
3. **Server-side translations**: Add i18n to email templates and API responses
4. **Dynamic translation loading**: Lazy-load translation files on demand
5. **Keyboard shortcuts**: Add Alt+N for Nepali, Alt+E for English

## Troubleshooting

### Translations not appearing?
1. Check browser console for errors
2. Verify `i18n.js` is loaded
3. Check that `data-i18n` attributes match keys in JSON files
4. Ensure JSON files are in `/server/public/i18n/` directory

### Language not persisting?
- Check if localStorage is enabled in browser
- Look for any localStorage errors in console
- Try clearing browser cache and refreshing

### Devanagari script not displaying?
- Verify browser has Mukta font installed (it's loaded from Google Fonts)
- Check HTML lang attribute is set to 'ne'
- Ensure UTF-8 charset in HTML head

## Support

The language switcher is fully functional and requires no additional setup. It will automatically:
- Detect user's preferred language
- Apply translations to all marked elements
- Save preference for future visits
- Switch between languages instantly

Nepali users will see the website in their native script without any manual configuration needed.
