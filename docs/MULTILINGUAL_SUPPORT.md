# Multilingual Support - Implementation Guide

## Overview
Added comprehensive **4-language support** to the SUVIDHA Citizen Dashboard with English, Hindi, Tamil, and Marathi translations.

## Feature Components

### 1. **Translation Files**
- **File**: `/static/translations-multilingual.json`
- **Languages**: English (en), Hindi (hi), Tamil (ta), Marathi (mr)
- **Coverage**: 6 UI sections covering 40+ translated phrases per language
- **Structure**:
  ```json
  {
    "en": {
      "header": {...},
      "dashboard": {...},
      "utilities": {...},
      "bills": {...},
      "services": {...},
      "profile": {...}
    },
    "hi": {...},
    "ta": {...},
    "mr": {...}
  }
  ```

### 2. **Frontend Components**

#### Language Selector Widget
- **File**: `/static/app/components/language-selector.html`
- **Features**:
  - Globe icon with current language display
  - Dropdown menu with 4 language options (with regional flags)
  - Animated dropdown panel
  - Language persistence on selection
  - Mobile-responsive design
  - Located in top navigation bar

#### Click-Outside Directive
- **File**: `/static/app/directives/click-outside.directive.js`
- **Purpose**: Close language dropdown when clicking outside
- **Usage**: `ng-click-outside="vm.closeLanguageMenu()"`

### 3. **Service Updates**

#### TranslationService (`/static/app/services/translation.service.js`)
**Updated Methods**:
- `initAsync()` - Now loads `translations-multilingual.json` with fallback to `translations.json`
- `translate(key)` - Supports nested key lookup in dot notation (e.g., `'header.language'`)
- `setLanguage(lang)` - Changes language and broadcasts `languageChanged` event
- `getCurrentLanguage()` - Returns currently active language code
- `getLanguage()` - Alternative method for getting current language

**Implementation Details**:
```javascript
// Initialize translations on app startup
TranslationService.initAsync().then(function() {
    // Translations loaded and ready
});

// Use in templates with translate filter
{{ 'header.language' | translate }}

// Change language programmatically
TranslationService.setLanguage('hi');
```

#### ApiService (`/static/app/services/api.service.js`)
**New Methods**:
- `updateUserPreference(key, value)` - Save user preferences (language, theme, etc.)
- `getUserPreferences()` - Retrieve all user preferences

### 4. **Controller Updates**

#### DashboardController (`/static/app/controllers/dashboard.controller.js`)
**New Properties & Methods**:
- `vm.currentLanguage` - Currently active language code
- `vm.availableLanguages` - Array of language objects with code, name, and flag
- `vm.showLanguageMenu` - Toggle state for language dropdown
- `vm.switchLanguage(langCode)` - Change language and persist preference
- `vm.getCurrentLanguageLabel()` - Get friendly name of current language
- `vm.toggleLanguageMenu()` - Open/close language dropdown
- `vm.closeLanguageMenu()` - Close language dropdown
- Event listener: `languageChanged` - Syncs UI when language changes

### 5. **Backend API Endpoints**

#### User Preferences Endpoints (`citizen_routes.py`)
**POST `/api/user/preference`**
- Updates single user preference (language, theme, notifications)
- Request: `{ "key": "language", "value": "ta" }`
- Response: Success confirmation with updated preference

**GET `/api/user/preferences`**
- Retrieves all user preferences
- Returns: `{ "language": "hi", "theme": "light", "notifications": true }`

### 6. **Template Integration**

#### Main Dashboard Template (`/templates/index.html`)
- Language selector added to mobile header
- Responsive layout: hidden on very small screens, accessible on desktop
- Integration: `<ng-include src="'/static/app/components/language-selector.html'"></ng-include>`

## Available Languages

| Code | Language | Native Name | Flag |
|------|----------|------------|------|
| en   | English  | English    | 🇬🇧  |
| hi   | Hindi    | हिन्दी     | 🇮🇳  |
| ta   | Tamil    | தமிழ்     | 🇮🇳  |
| mr   | Marathi  | मराठी     | 🇮🇳  |

## Translation Coverage

### Sections Included
1. **Header**: Language selection, navigation labels
2. **Dashboard**: Overview cards, health score, utility status
3. **Utilities**: Electricity, water, gas, consumption data
4. **Bills**: Payment status, bill information, due dates
5. **Services**: Complaints, reports, service requests
6. **Profile**: User information, settings, preferences

## Usage Examples

### In Templates
```html
<!-- Translate dashboard title -->
<h1>{{ 'dashboard.title' | translate }}</h1>

<!-- Translate utility labels -->
<span>{{ 'utilities.electricity' | translate }}</span>
<span>{{ 'utilities.water' | translate }}</span>
<span>{{ 'utilities.gas' | translate }}</span>
```

### In Controllers
```javascript
// Change language programmatically
$scope.switchLanguage = function(lang) {
    TranslationService.setLanguage(lang);
    // Optionally save preference
    ApiService.updateUserPreference('language', lang).then(function() {
        console.log('Language preference saved');
    });
};

// Get translated key
var translatedText = TranslationService.translate('dashboard.title');
```

## How It Works

1. **On App Init**: TranslationService loads `translations-multilingual.json`
2. **On Dashboard Load**: DashboardController initializes language selector with available languages
3. **On Language Selection**: 
   - TranslationService sets new language
   - API call persists preference to database
   - All templates re-evaluate `{{ key | translate }}` expressions
   - UI updates instantly without page reload
4. **On Next Session**: User's preferred language loads from database automatically

## Features

✅ **4-Language Support**: English, Hindi, Tamil, Marathi
✅ **Instant Switching**: No page reload required
✅ **Preference Persistence**: Saves to user profile
✅ **Fallback Support**: Falls back to English if translation missing
✅ **Mobile Responsive**: Optimized for all screen sizes
✅ **Accessibility**: Keyboard navigable, semantic HTML
✅ **Extensible**: Easy to add new languages or translations

## Performance Considerations

- **Translation File Size**: ~50KB (minimal impact)
- **Lazy Loading**: Translations loaded once on app initialization
- **Caching**: Browser caches `translations-multilingual.json`
- **No Page Reloads**: Language changes instantaneous via filter re-evaluation
- **Database Updates**: Only when user changes preference (not on every page load)

## Future Enhancements

- [ ] Add more languages (Tamil Nadu, Bengali, Kannada, etc.)
- [ ] RTL support for future languages
- [ ] Language auto-detection based on browser settings
- [ ] Pluralization and gender-specific translations
- [ ] Date/Time formatting per language
- [ ] Number formatting per language locale
- [ ] Admin panel for managing translations

## Testing Checklist

- [x] Translation file loads successfully
- [x] Language selector displays correctly
- [x] Language switching works without reload
- [x] Preference persists across sessions
- [x] Fallback to English works
- [x] Mobile responsive design works
- [x] All dashboard sections translate
- [x] API endpoints functional

## Files Modified/Created

### New Files
- `/static/translations-multilingual.json` - Comprehensive 4-language translation dictionary
- `/static/app/components/language-selector.html` - Language selector component
- `/static/app/directives/click-outside.directive.js` - Click-outside directive for dropdown

### Modified Files
- `/static/app/services/translation.service.js` - Updated `initAsync()` to load new translation file
- `/static/app/services/api.service.js` - Added `updateUserPreference()` and `getUserPreferences()`
- `/static/app/controllers/dashboard.controller.js` - Added language selector functionality
- `/templates/index.html` - Added language selector to header
- `/citizen_routes.py` - Added `/api/user/preference` and `/api/user/preferences` endpoints

## Support for Additional Languages

To add a new language:
1. Add new language section to `translations-multilingual.json`
2. Add language option to `vm.availableLanguages` in dashboard controller
3. Provide translations for all keys (or use English as fallback)
4. Test with real users for quality assurance

Example:
```json
{
  "ta": {
    "header": {
      "language": "மொழி",
      "english": "ஆங்கிலம்",
      ...
    },
    ...
  }
}
```

## Troubleshooting

### Translations not displaying
- Check browser console for errors loading `translations-multilingual.json`
- Verify TranslationService is properly injected in controller
- Ensure templates use correct key format (e.g., `'section.key'`)

### Language not persisting
- Check that user is logged in (session required)
- Verify `/api/user/preference` endpoint is returning success
- Check browser console for API errors

### Performance issues
- Verify translation file is cached by browser
- Check for console warnings about missing translations

---

**Implementation Date**: March 2026
**Status**: Production Ready
**Maintained By**: Suvidha Development Team
