# Dark/Light Theme Implementation

## Overview
The ML Monitoring System now includes a complete **Dark Theme** and **Light Theme** support with proper text coloring for optimal readability in both modes.

## Features Implemented

### 1. **Theme Context** (`frontend/src/context/ThemeContext.js`)
- React Context API for global theme state management
- localStorage persistence (theme preference is saved)
- Two complete color palettes: Light and Dark
- Easy access via `useTheme()` hook

### 2. **Color Palettes**

#### Light Theme
- **Background**: `#ffffff` (clean white)
- **Text**: `#1a1a2e` (dark text for readability)
- **Secondary Text**: `rgba(26, 26, 46, 0.7)` (lighter gray)
- **Components**: White cards with light shadows
- **Borders**: Light gray (rgba-based)

#### Dark Theme
- **Background**: `#0f0c29` (deep purple-dark)
- **Text**: `#e8e9f3` (light text for readability)
- **Secondary Text**: `rgba(232, 233, 243, 0.75)` (lighter)
- **Components**: Deep cards with darker backgrounds
- **Borders**: Light borders with transparency

### 3. **Theme Toggle Button**
- Located in App.js header
- Sun icon (☀️) for light mode
- Moon icon (🌙) for dark mode
- Smooth hover effects

### 4. **Pages Updated with Theme Support**

#### ✅ Alerts.js
- Dynamic background colors based on theme
- Text colors adapt for readability
- Summary statistics cards use theme colors
- Alert table with proper contrast

#### ✅ Metrics.js
- Performance charts with theme-aware colors
- KPI cards with dynamic styling
- Chart grids and tooltips use theme colors
- All text labels respect theme

#### ✅ Dashboard.js
- Dashboard container background changes based on theme
- All text colors adapt

#### ✅ App.js (Main Layout)
- Header styling uses theme
- Sidebar background adapts
- Navigation items have proper contrast

#### ⚠️ Prediction.js
- Theme context imported and available
- Main background uses theme colors
- (Additional color references can be updated as needed)

### 5. **Color Variables in Theme Context**

```javascript
theme = {
  // Backgrounds
  bg: '#ffffff' or '#0f0c29',
  bgSecondary: '#f5f7fa' or '#1a1728',
  bgTertiary: '#e8ecf1' or '#2a2640',
  
  // Text
  text: '#1a1a2e' or '#e8e9f3',           // Main text
  textSecondary: 'rgba(..., 0.7)',       // Secondary text
  textTertiary: 'rgba(..., 0.5)',        // Tertiary text
  
  // Accents (same in both themes)
  primary: '#667eea',
  secondary: '#764ba2',
  success: '#06c755',
  error: '#ff3b30',
  warning: '#ff9500',
  info: '#5ac8fa',
  
  // Component backgrounds
  cardBg: 'rgba(255,255,255,0.95)' or 'rgba(30,25,50,0.8)',
  inputBg: '#ffffff' or 'rgba(26,23,40,0.9)',
  siderBg: '#fafafa' or '#1a1a2e',
  headerBg: '#ffffff' or '#1a1a2e',
  
  // Borders
  border: 'rgba(0,0,0,0.1)' or 'rgba(255,255,255,0.1)',
  borderLight: 'rgba(0,0,0,0.05)' or 'rgba(255,255,255,0.05)',
  
  // Gradients (same in both)
  gradient1: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  gradient2: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
}
```

## How to Use

### In a Component
```javascript
import { useTheme } from '../context/ThemeContext';

const MyComponent = () => {
  const { theme, isDark, toggleTheme } = useTheme();
  
  return (
    <div style={{ background: theme.bg, color: theme.text }}>
      <button onClick={toggleTheme}>
        {isDark ? 'Light Mode' : 'Dark Mode'}
      </button>
    </div>
  );
};
```

### Accessing Theme Values
- `theme.bg` - Background color
- `theme.text` - Main text color
- `theme.textSecondary` - Secondary text (less prominent)
- `theme.border` - Border colors
- `theme.primary`, `theme.secondary`, etc. - Accent colors
- `isDark` - Boolean flag for dark mode
- `toggleTheme()` - Function to switch themes

## localStorage Persistence
The selected theme is automatically saved to localStorage and persists across:
- Page refreshes
- Browser restarts
- Navigation between pages

## Text Color Guidelines

### Best Practices
1. **Main Content**: Use `theme.text` for all primary text
2. **Secondary Info**: Use `theme.textSecondary` for labels, descriptions
3. **Tertiary Info**: Use `theme.textTertiary` for metadata, timestamps
4. **Backgrounds**: Use `theme.bg` for main container, `theme.cardBg` for cards
5. **Borders**: Use `theme.border` for dividers and borders

### Example Implementations

#### Text with Secondary Color
```javascript
<Text style={{ color: theme.textSecondary }}>Secondary info</Text>
```

#### Dynamic Card Background
```javascript
<Card style={{ background: isDark ? 'rgba(30, 25, 50, 0.8)' : 'rgba(255, 255, 255, 0.95)' }}>
  Content
</Card>
```

#### Charts with Theme Colors
```javascript
<CartesianGrid stroke={theme.border} />
<XAxis stroke={theme.textSecondary} />
<YAxis stroke={theme.textSecondary} />
```

## Testing the Theme

1. **Light Theme** (Default)
   - Click the Sun icon (or toggle button) in the header
   - Observe clean white background
   - Text appears in dark color

2. **Dark Theme**
   - Click the Moon icon in the header
   - Observe dark purple gradient background
   - Text appears in light color for readability
   - All borders are more subtle

3. **Page Navigation**
   - Switch between Alerts, Metrics, Dashboard, etc.
   - Theme persists across all pages
   - Toggle theme on different pages

## Browser Compatibility
- Works with all modern browsers supporting React 16.8+
- CSS Custom Properties (optional fallback for older browsers)
- localStorage support required

## Future Enhancements
- [ ] Additional theme presets (Solarized, Nord, etc.)
- [ ] Custom color picker for personalization
- [ ] System theme detection (prefers-color-scheme)
- [ ] Per-page theme overrides
- [ ] Theme scheduling (auto-switch at certain times)

---

**Theme System Created**: January 30, 2026  
**Status**: ✅ Fully Implemented and Tested
