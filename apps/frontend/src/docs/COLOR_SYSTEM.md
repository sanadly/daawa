# Color System Documentation

## Overview

The app now uses a comprehensive CSS variable-based color system that makes it extremely easy to change colors globally. Instead of hardcoded colors scattered throughout the codebase, all colors are now managed through semantic CSS variables.

## Quick Start

### Changing the Entire App's Color Scheme

To change the entire app's color scheme, you have several options:

#### Option 1: Use the Color Utility Functions

```typescript
import { applyColorScheme } from '../utils/colors';

// Change to blue theme
applyColorScheme('blue');

// Change to purple theme
applyColorScheme('purple');

// Change to orange theme
applyColorScheme('orange');
```

#### Option 2: Use the React Hook

```typescript
import { useColorScheme } from '../utils/colors';

function MyComponent() {
  const { changeScheme, setCustomColor } = useColorScheme();
  
  return (
    <div>
      <button onClick={() => changeScheme('blue')}>Blue Theme</button>
      <button onClick={() => changeScheme('purple')}>Purple Theme</button>
      <button onClick={() => setCustomColor(280, 70, 50)}>Custom Purple</button>
    </div>
  );
}
```

#### Option 3: Modify CSS Variables Directly

Edit `src/index.css` and change the brand primary color:

```css
:root {
  /* Change this to update the entire app */
  --brand-primary: 217 91% 60%; /* Blue */
  --brand-primary-light: 217 91% 66%;
  --brand-primary-dark: 217 91% 54%;
}
```

## Available Color Schemes

The system includes several pre-built color schemes:

- **green** (default) - Professional dark green
- **blue** - Trustworthy blue
- **purple** - Creative purple
- **orange** - Energetic orange
- **teal** - Modern teal
- **indigo** - Premium indigo

## Color System Architecture

### CSS Variables Structure

```css
:root {
  /* ===== MAIN BRAND COLORS ===== */
  --brand-primary: 158 48% 29%;      /* Main brand color */
  --brand-primary-light: 158 48% 35%; /* Hover states */
  --brand-primary-dark: 158 48% 23%;  /* Active states */
  
  /* ===== SEMANTIC COLORS ===== */
  --color-success: 142 76% 36%;       /* Success states */
  --color-warning: 38 92% 50%;        /* Warning states */
  --color-error: 0 84% 60%;           /* Error states */
  --color-info: 217 91% 60%;          /* Info states */
  
  /* ===== UI COLORS ===== */
  --background: 0 0% 100%;
  --foreground: 0 0% 3.9%;
  --card: 0 0% 100%;
  --border: 0 0% 89.8%;
  /* ... and many more */
}
```

### How Colors Cascade

When you change `--brand-primary`, it automatically updates:

- `--primary` (for Tailwind compatibility)
- `--ring` (focus rings)
- `--sidebar-primary` (sidebar active states)
- `--input-focus` (form inputs)
- `--button-primary` (primary buttons)

## Usage Examples

### In Components

```typescript
// ✅ Good - Uses semantic color classes
<div className="bg-primary text-primary-foreground">
  Primary Button
</div>

// ✅ Good - Uses semantic status colors
<span className="bg-green-100 text-green-800">
  Success Status
</span>

// ❌ Avoid - Hardcoded colors
<div className="bg-green-600 text-white">
  Hardcoded Button
</div>
```

### Using the Color Utility Classes

```typescript
import { COLOR_CLASSES } from '../utils/colors';

// Brand colors
<div className={COLOR_CLASSES.brand.primary}>
  Primary Action
</div>

// Status colors
<span className={COLOR_CLASSES.status.active}>
  Active Status
</span>

// Button variants
<button className={COLOR_CLASSES.button.primary}>
  Primary Button
</button>
```

### Custom Color Functions

```typescript
import { setCustomBrandColor, getCSSVariable } from '../utils/colors';

// Set custom brand color (HSL values)
setCustomBrandColor(280, 70, 50); // Purple

// Get current color value
const currentColor = getCSSVariable('brand-primary');

// Set any CSS variable
setCSSVariable('color-success', '142 76% 36%');
```

## Best Practices

### 1. Use Semantic Color Names

```typescript
// ✅ Good
className="bg-primary text-primary-foreground"
className="bg-success text-success-foreground"
className="bg-error text-error-foreground"

// ❌ Avoid
className="bg-green-600 text-white"
className="bg-red-500 text-white"
```

### 2. Use Status Colors for States

```typescript
// ✅ Good
const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-800';
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'error': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};
```

### 3. Use the Color Utility Classes

```typescript
import { COLOR_CLASSES } from '../utils/colors';

// ✅ Good
<Badge className={COLOR_CLASSES.status.active}>
  Active
</Badge>

// ❌ Avoid
<Badge className="bg-green-100 text-green-800">
  Active
</Badge>
```

## Migration Guide

### From Hardcoded Colors

**Before:**
```typescript
<div className="bg-green-600 text-white hover:bg-green-700">
  Button
</div>
```

**After:**
```typescript
<div className="bg-primary text-primary-foreground hover:bg-primary/90">
  Button
</div>
```

### From Inline Styles

**Before:**
```typescript
<div style={{ backgroundColor: '#256D5A', color: 'white' }}>
  Button
</div>
```

**After:**
```typescript
<div className="bg-primary text-primary-foreground">
  Button
</div>
```

## Advanced Usage

### Creating Custom Color Schemes

```typescript
// Add to COLOR_SCHEMES in utils/colors.ts
export const COLOR_SCHEMES = {
  // ... existing schemes
  custom: {
    primary: '280 70% 50%',
    primaryLight: '280 70% 56%',
    primaryDark: '280 70% 44%',
  },
} as const;
```

### Dynamic Color Changes

```typescript
import { useColorScheme } from '../utils/colors';

function ThemeSwitcher() {
  const { changeScheme, setCustomColor } = useColorScheme();
  
  const handleColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const color = event.target.value;
    // Convert hex to HSL and set
    const hsl = hexToHsl(color);
    setCustomColor(hsl.h, hsl.s, hsl.l);
  };
  
  return (
    <input 
      type="color" 
      onChange={handleColorChange}
      defaultValue="#256D5A"
    />
  );
}
```

## Troubleshooting

### Colors Not Updating

1. Check that you're using the correct CSS variable names
2. Ensure the color utility functions are being called
3. Verify that Tailwind is rebuilding after CSS changes

### Inconsistent Colors

1. Make sure all components use semantic color classes
2. Check for hardcoded color values in components
3. Use the color utility classes for consistency

### Dark Mode Issues

1. Ensure dark mode colors are defined in the `.dark` selector
2. Check that color variables are properly mapped for dark mode
3. Verify that the dark mode class is applied to the document

## File Structure

```
src/
├── index.css                    # Main color variables
├── utils/
│   └── colors.ts               # Color utility functions
├── components/
│   └── ColorSchemeSwitcher.tsx # Example color switcher
└── docs/
    └── COLOR_SYSTEM.md         # This documentation
```

## Benefits

1. **Easy Global Changes** - Change the entire app's color scheme with one line
2. **Consistent Colors** - All colors are managed centrally
3. **Semantic Meaning** - Colors have clear, meaningful names
4. **Dark Mode Support** - Automatic dark mode color handling
5. **Type Safety** - TypeScript support for color schemes
6. **Performance** - CSS variables are more performant than JavaScript color changes

## Future Enhancements

- Color scheme persistence in localStorage
- User preference-based color schemes
- Accessibility-aware color selection
- Brand color extraction from logos
- Color palette generation tools 