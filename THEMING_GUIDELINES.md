# Aero Enterprise Suite - Component Theming Guidelines

## Overview
This document provides comprehensive guidelines for applying consistent theming across all components in the Aero Enterprise Suite. These guidelines ensure visual consistency, accessibility, and maintainability.

## Core Theme Variables

### Layout Properties
```css
--borderRadius: 8px-16px (default: 12px)
--fontFamily: "Inter" (default font family)
--scale: 1 (default scale factor)
--borderWidth: 1px-3px (default: 2px)
--disabledOpacity: 0.5-0.8 (default: 0.5)
```

### Spacing Standards
```css
--spacing-xs: 0.5rem (8px) - tiny gaps
--spacing-sm: 1rem (16px) - small gaps
--spacing-md: 1.5rem (24px) - medium gaps
--spacing-lg: 2rem (32px) - large gaps
--spacing-xl: 3rem (48px) - extra large gaps
```

### Component Spacing Guidelines
- **Card Internal Padding**: Use `p-4` (16px) for consistency
- **Grid Gaps**: Use `gap-4` (16px) for card grids
- **Component Margins**: Use `gap-6` (24px) between major sections
- **Container Padding**: Use `p-4` or `p-6` for consistent page margins

### Color Palette
```css
--theme-primary: #006FEE (primary blue)
--theme-secondary: #7C3AED (secondary purple)
--theme-success: #17C964 (success green)
--theme-warning: #F5A524 (warning orange)
--theme-danger: #F31260 (danger red)
--theme-foreground: #11181C (main text color)
--theme-foreground-600: #666 (secondary text)
--theme-background: #FFFFFF (main background)
--theme-content1: #FAFAFA (light background)
--theme-content2: #F4F4F5 (lighter background)
--theme-content3: #F1F3F4 (lightest background)
--theme-divider: #E4E4E7 (border/divider color)
```

## Component Theming Patterns

### 1. Basic Layout Properties
Always apply these to all interactive components:
```jsx
style={{
  borderRadius: `var(--borderRadius, 12px)`,
  fontFamily: `var(--fontFamily, "Inter")`,
  transform: `scale(var(--scale, 1))`,
  borderWidth: `var(--borderWidth, 2px)`
}}
```

### 2. Interactive Elements (Buttons, Menu Items, Cards)

#### Default State
```jsx
style={{
  border: `var(--borderWidth, 2px) solid transparent`,
  borderRadius: `var(--borderRadius, 8px)`,
  fontFamily: `var(--fontFamily, "Inter")`,
  transform: `scale(var(--scale, 1))`,
  color: `var(--theme-foreground, #11181C)`
}}
```

#### Hover Effects
Use border-based hover effects (not background colors):
```jsx
onMouseEnter={(e) => {
  e.target.style.border = `var(--borderWidth, 2px) solid color-mix(in srgb, var(--theme-primary, #006FEE) 50%, transparent)`;
  e.target.style.borderRadius = `var(--borderRadius, 8px)`;
}}
onMouseLeave={(e) => {
  e.target.style.border = `var(--borderWidth, 2px) solid transparent`;
}}
```

#### Contextual Colors for Hover
- **Navigation/Primary Actions**: `var(--theme-primary, #006FEE) 50%`
- **Warning Actions**: `var(--theme-warning, #F5A524) 50%`
- **Danger/Destructive Actions**: `var(--theme-danger, #F31260) 50%`
- **Success Actions**: `var(--theme-success, #17C964) 50%`

### 3. Background Colors
Use color-mix for subtle backgrounds:
```jsx
// Subtle backgrounds
background: `color-mix(in srgb, var(--theme-primary, #006FEE) 10%, transparent)`

// Card backgrounds
background: `linear-gradient(135deg, 
  var(--theme-content1, #FAFAFA) 20%, 
  var(--theme-content2, #F4F4F5) 10%, 
  var(--theme-content3, #F1F3F4) 20%)`
```

### 4. Text Colors
```jsx
// Primary text
color: `var(--theme-foreground, #11181C)`

// Secondary text  
color: `var(--theme-foreground-600, #666)`

// With opacity
color: `color-mix(in srgb, var(--theme-foreground, #11181C) 60%, transparent)`

// Colored text
color: `var(--theme-primary, #006FEE)`
```

### 5. Icons
Apply theme colors to icons:
```jsx
<IconComponent 
  className="w-4 h-4"
  style={{ color: `var(--theme-primary, #006FEE)` }}
/>
```

### 6. Disabled States
```jsx
style={{
  opacity: isDisabled ? `var(--disabledOpacity, 0.5)` : '1'
}}
```

### 7. NO HARDCODED CSS
**CRITICAL RULE**: Never use hardcoded CSS values. Always use theme variables or Tailwind classes.

#### ❌ AVOID:
```jsx
// DON'T USE HARDCODED VALUES
style={{
  backdropFilter: 'blur(8px)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
  padding: '16px',
  margin: '24px'
}}
```

#### ✅ CORRECT:
```jsx
// USE THEME VARIABLES AND TAILWIND CLASSES
className="p-4 shadow-lg backdrop-blur-sm"
style={{
  borderRadius: `var(--borderRadius, 12px)`,
  fontFamily: `var(--fontFamily, "Inter")`,
  transform: `scale(var(--scale, 1))`
}}
```

## Implementation Checklist

When updating any component for theming:

### ✅ Required Elements
- [ ] Apply basic layout properties (borderRadius, fontFamily, scale, borderWidth)
- [ ] Use theme color variables instead of hardcoded colors
- [ ] Implement border-based hover effects (not background changes)
- [ ] Apply proper text color variables
- [ ] Use color-mix for transparent backgrounds
- [ ] Apply theme colors to icons
- [ ] Handle disabled states with disabledOpacity

### ✅ Interactive Components (Buttons, Menu Items)
- [ ] Transparent border by default
- [ ] Border hover effects with appropriate contextual colors
- [ ] Proper onMouseEnter/onMouseLeave handlers
- [ ] Respect disabled state in hover handlers

### ✅ Cards/Containers
- [ ] Apply gradient backgrounds using theme content colors
- [ ] Use theme divider colors for borders
- [ ] Apply border radius and other layout properties

### ✅ Text Elements
- [ ] Use theme foreground colors
- [ ] Apply opacity with color-mix for secondary text
- [ ] Use contextual colors for status/action text

## Color Usage Guidelines

### Primary Colors
- **Blue (#006FEE)**: Navigation, primary actions, links
- **Purple (#7C3AED)**: Secondary actions, accent elements
- **Green (#17C964)**: Success states, completed actions
- **Orange (#F5A524)**: Warnings, feedback requests
- **Red (#F31260)**: Errors, destructive actions

### Transparency Levels
- **10%**: Very subtle backgrounds
- **15%**: Hover background effects  
- **20%**: Subtle accents, borders
- **30%**: More prominent accents
- **50%**: Hover borders, active states
- **60%**: Secondary text opacity

## Common Patterns

### Card Component
```jsx
<Card style={{
  background: `linear-gradient(135deg, 
    var(--theme-content1, #FAFAFA) 20%, 
    var(--theme-content2, #F4F4F5) 10%, 
    var(--theme-content3, #F1F3F4) 20%)`,
  borderColor: `var(--theme-divider, #E4E4E7)`,
  borderRadius: `var(--borderRadius, 12px)`,
  borderWidth: `var(--borderWidth, 2px)`,
  fontFamily: `var(--fontFamily, "Inter")`,
  transform: `scale(var(--scale, 1))`
}}>
```

### Interactive Item
```jsx
<div 
  className="transition-all duration-200"
  style={{
    border: `var(--borderWidth, 2px) solid transparent`,
    borderRadius: `var(--borderRadius, 8px)`,
    fontFamily: `var(--fontFamily, "Inter")`,
    transform: `scale(var(--scale, 1))`
  }}
  onMouseEnter={(e) => {
    e.target.style.border = `var(--borderWidth, 2px) solid color-mix(in srgb, var(--theme-primary, #006FEE) 50%, transparent)`;
  }}
  onMouseLeave={(e) => {
    e.target.style.border = `var(--borderWidth, 2px) solid transparent`;
  }}
>
```

## Testing Theming
1. Verify all theme variables are applied
2. Test hover effects work correctly
3. Check disabled states render properly
4. Ensure colors are consistent across components
5. Validate accessibility contrast ratios
6. Test with different theme settings

---

**Note**: This guideline should be followed for all new components and when updating existing components for theme consistency.
