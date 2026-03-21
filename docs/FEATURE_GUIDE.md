# Suvidha Portal - Quick Feature Guide

## 🎨 Color Palette Reference

### Primary Colors
```css
--primary-blue: #1D70B8        /* Main navigation, buttons, headings */
--primary-blue-dark: #0055A4   /* Sidebar background, hover states */
--primary-blue-light: #3B8FD8  /* Gradient accents */
```

### Secondary Colors
```css
--success-green: #00703C       /* Success states, positive metrics */
--accent-saffron: #F47738      /* Active indicators, alerts */
--accent-gold: #FFB84D         /* Highlights */
```

### Status Colors
```css
--status-success: #10B981      /* Good performance */
--status-warning: #F59E0B      /* Moderate alerts */
--status-error: #EF4444        /* Critical alerts */
--status-info: #3B82F6         /* Information */
```

## 🏗️ Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│  SIDEBAR (260px)         │  MAIN WRAPPER                │
│  ┌───────────────────┐   │  ┌────────────────────────┐  │
│  │ Logo + Toggle     │   │  │ TOP BAR (64px)         │  │
│  ├───────────────────┤   │  │ • Page Title           │  │
│  │ Notice Banner     │   │  │ • Language Toggle      │  │
│  ├───────────────────┤   │  │ • Notifications        │  │
│  │ Navigation Menu   │   │  └────────────────────────┘  │
│  │ • Dashboard       │   │                              │
│  │ • Utilities       │   │  ┌────────────────────────┐  │
│  │ • Insights        │   │  │ MAIN CONTENT           │  │
│  │ • Simulator       │   │  │ • Cards                │  │
│  │ • Services        │   │  │ • Charts               │  │
│  │ • Community       │   │  │ • Forms                │  │
│  │ • Records         │   │  │ • Tables               │  │
│  ├───────────────────┤   │  └────────────────────────┘  │
│  │ User Profile      │   │                              │
│  │ Logout Button     │   │  ┌────────────────────────┐  │
│  └───────────────────┘   │  │ FOOTER                 │  │
│                           │  └────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## 📱 Responsive Behavior

### Desktop (> 1024px)
- Full sidebar (260px) with all text visible
- Multi-column content grids
- Top bar with all actions

### Tablet (769px - 1024px)
- Narrower sidebar (200px)
- Single column content
- Adjusted padding

### Mobile (< 768px)
- Sidebar off-canvas (slides in/out)
- Hamburger menu toggle
- Mobile header replaces top bar
- Single column layouts
- Larger touch targets

## 🎯 Key Interactive Features

### Sidebar Collapse
```javascript
// Click toggle button in sidebar header
// State persists using localStorage
sidebar.classList.toggle('collapsed');
// Width: 260px → 70px
// Icons remain visible, text hidden
```

### Mobile Menu
```javascript
// Tap hamburger icon
sidebar.classList.toggle('mobile-open');
overlay.classList.toggle('active');
// Sidebar slides in from left
// Semi-transparent overlay appears
```

### Active Link States
- **Active page:** Left border accent (4px saffron)
- **Hover:** Subtle background color change
- **Focus:** Visible focus outline for accessibility

## 🔧 Component Examples

### Button Styles
```html
<!-- Primary Action -->
<button class="btn-primary">Pay Bill</button>

<!-- Secondary Action -->
<button class="btn-secondary">View Details</button>

<!-- Icon Button -->
<button class="icon-btn">
    <i data-lucide="bell"></i>
</button>
```

### Card Structure
```html
<div class="card">
    <div class="card-header">
        <h3>Card Title</h3>
        <span class="badge">Status</span>
    </div>
    <div class="card-body">
        <!-- Content -->
    </div>
    <div class="card-footer">
        <button class="btn-secondary">Action</button>
    </div>
</div>
```

### Status Badges
```html
<span class="badge badge-success">Good</span>
<span class="badge badge-warning">Moderate</span>
<span class="badge badge-error">High</span>
```

## 🎨 Typography Scale

### Headings
- `h1` - 2rem (32px) - Page titles
- `h2` - 1.5rem (24px) - Section headers
- `h3` - 1.125rem (18px) - Card titles
- `h4` - 1rem (16px) - Subsections

### Body Text
- Base: 1rem (16px)
- Small: 0.875rem (14px)
- Tiny: 0.75rem (12px)

### Font Weights
- Normal: 400
- Medium: 500
- Semibold: 600
- Bold: 700
- Extrabold: 800

## 🚀 Quick Customization

### Change Primary Color
```css
:root {
    --primary-blue: #YOUR_COLOR;
    --primary-blue-dark: #DARKER_SHADE;
    --primary-blue-light: #LIGHTER_SHADE;
}
```

### Adjust Sidebar Width
```css
:root {
    --sidebar-width: 280px;  /* Change from 260px */
    --sidebar-collapsed-width: 80px;  /* Change from 70px */
}
```

### Modify Card Shadows
```css
:root {
    --shadow-md: 0 8px 12px -2px rgba(0, 0, 0, 0.15);
}
```

## ✅ Accessibility Features

### Keyboard Navigation
- `Tab` - Navigate between interactive elements
- `Enter/Space` - Activate buttons/links
- `Esc` - Close modals

### Screen Reader Support
- All icons have text labels
- ARIA labels on interactive elements
- Semantic HTML structure
- Skip links for navigation

### Color Contrast
- All text meets WCAG 2.1 AA standards
- Minimum ratio: 4.5:1 for body text
- Minimum ratio: 3:1 for large text

## 🔍 Browser Support

### Fully Supported
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Partial Support
- Chrome 80-89 (no backdrop-filter)
- Firefox 80-87 (fallback styles)
- Safari 13 (graceful degradation)

## 📊 Performance Tips

### Optimize Images
- Use WebP format for logos
- Compress PNG files
- Lazy-load off-screen images

### Reduce CSS
- Already minified structure
- Use CDN for Lucide icons
- Enable gzip compression

### JavaScript
- Minimize DOM manipulation
- Use event delegation
- Cache DOM queries

## 🛠️ Maintenance

### Adding New Navigation Items
1. Edit `templates/base.html`
2. Add new `<a>` in `.sidebar-nav`
3. Include appropriate Lucide icon
4. Add active state check

### Creating New Pages
1. Extend `base.html`
2. Use standard page structure:
   ```html
   {% extends 'base.html' %}
   {% block content %}
   <section class="page-header">
       <h1>Page Title</h1>
       <p>Description</p>
   </section>
   <!-- Content -->
   {% endblock %}
   ```

### Updating Colors
- All colors defined in `:root` CSS variables
- Change once, applies everywhere
- Test contrast after changes

---

**Need Help?**
- Check `UI_UX_OVERHAUL_SUMMARY.md` for detailed implementation notes
- Review `style.css` for component examples
- Test in multiple browsers before deployment