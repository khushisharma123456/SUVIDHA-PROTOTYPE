# Suvidha - AngularJS Conversion

This application has been converted from a Flask+Jinja2 template application to a Flask REST API + AngularJS Single Page Application (SPA).

## Architecture

### Backend (Flask)
- **File**: `app.py`
- **Purpose**: REST API server that provides JSON data to the frontend
- **API Endpoints**:
  - `GET /api/dashboard` - Dashboard data
  - `GET /api/utilities` - Utilities consumption data
  - `GET /api/insights` - Usage insights
  - `GET /api/records` - Billing records
  - `GET /api/community` - Community data
  - `GET /api/profile` - User profile
  - `POST /api/services/submit` - Submit service request

### Frontend (AngularJS)
- **Entry Point**: `templates/index.html`
- **App Module**: `static/app/app.js`
- **Structure**:
  ```
  static/app/
  ├── app.js                      # Main AngularJS module and routing config
  ├── controllers/                # Page controllers
  │   ├── dashboard.controller.js
  │   ├── utilities.controller.js
  │   ├── insights.controller.js
  │   ├── simulator.controller.js
  │   ├── services.controller.js
  │   ├── community.controller.js
  │   ├── records.controller.js
  │   └── profile.controller.js
  ├── services/                   # Shared services
  │   ├── api.service.js         # REST API communication
  │   └── translation.service.js # i18n support
  └── views/                      # HTML templates for each page
      ├── dashboard.html
      ├── utilities.html
      ├── insights.html
      ├── simulator.html
      ├── services.html
      ├── community.html
      ├── records.html
      └── profile.html
  ```

## Key Changes Made

### 1. Template Conversion
- Removed Jinja2 templating (`{% %}` syntax)
- Converted to AngularJS expressions (`{{ }}`)
- Changed `{{ url_for('page') }}` to `#!/page` for client-side routing
- Converted `{% if %}` to `ng-if`
- Converted `{% for %}` to `ng-repeat`

### 2. Routing
- **Old**: Server-side routing with Flask `@app.route()`
- **New**: Client-side routing with AngularJS `$routeProvider`
- URLs now use hash-based routing (e.g., `#!/dashboard`)

### 3. Data Flow
- **Old**: Server renders templates with data
- **New**: API returns JSON, AngularJS controllers bind data to views

### 4. State Management
- Controllers manage page state (`vm` pattern)
- Services handle API calls and shared state
- Translation service manages multi-language support

## Running the Application

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Start the Flask Server
```bash
python app.py
```

### 3. Access the Application
Open your browser and navigate to:
```
http://localhost:5000
```

The AngularJS app will load and handle all routing on the client side.

## Development

### Adding a New Page

1. **Create a controller** in `static/app/controllers/newpage.controller.js`:
```javascript
(function() {
    'use strict';
    angular.module('suvidhaApp')
        .controller('NewPageController', ['$scope', 'ApiService', NewPageController]);
    
    function NewPageController($scope, ApiService) {
        var vm = this;
        // Controller logic
    }
})();
```

2. **Create a view** in `static/app/views/newpage.html`:
```html
<div class="page-content">
    <h1>{{t('new_page')}}</h1>
    <!-- Page content -->
</div>
```

3. **Add route** in `static/app/app.js`:
```javascript
.when('/newpage', {
    templateUrl: '/static/app/views/newpage.html',
    controller: 'NewPageController',
    controllerAs: 'vm'
})
```

4. **Add API endpoint** in `app.py`:
```python
@app.route('/api/newpage')
def api_newpage():
    return jsonify({'data': 'value'})
```

5. **Include controller script** in `templates/index.html`:
```html
<script src="/static/app/controllers/newpage.controller.js"></script>
```

## Technologies Used

- **Backend**: Python Flask 2.x
- **Frontend Framework**: AngularJS 1.8.2
- **Routing**: ngRoute
- **HTTP**: Angular's $http service
- **Icons**: Lucide Icons
- **Charts**: Chart.js
- **Styling**: Custom CSS

## API Communication

All API calls go through the `ApiService`:
```javascript
// In a controller
ApiService.getDashboardData()
    .then(function(response) {
        vm.data = response.data;
    });
```

## Translation Support

The app supports multiple languages. Translations are loaded from `static/translations.json`:
```javascript
// In templates
{{t('translation_key')}}

// In controllers
$rootScope.t('translation_key')
```

## Browser Support

- Modern browsers (Chrome, Firefox, Edge, Safari)
- AngularJS 1.8.2 requires at least:
  - Chrome 41+
  - Firefox 52+
  - Edge 15+
  - Safari 10+

## Notes

- The old Jinja2 templates are preserved in `templates/` folder (except `index.html` which is the new Angular entry point)
- Static assets (CSS, JS, images) remain in the `static/` folder
- All client-side routes use hash-based URLs (e.g., `#!/dashboard`)
- To enable HTML5 mode (remove `#`), uncomment `$locationProvider.html5Mode(true)` in `app.js` and configure server-side URL rewriting

## Future Enhancements

- Add user authentication/authorization
- Implement real database integration
- Add form validation
- Enhance error handling
- Add loading indicators
- Implement pagination for records
- Add unit tests for controllers and services
