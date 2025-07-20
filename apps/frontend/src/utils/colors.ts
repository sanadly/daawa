/**
 * Color System Utilities
 * 
 * This file provides easy-to-use functions and constants for the comprehensive color system.
 * To change the entire app's color scheme, simply update the CSS variables in index.css
 * or use the color utility functions below.
 */

// ===== COLOR SCHEME PRESETS =====
export const COLOR_SCHEMES = {
  // Green Theme (Current)
  green: {
    primary: '158 48% 29%',
    primaryLight: '158 48% 35%',
    primaryDark: '158 48% 23%',
  },
  
  // Blue Theme
  blue: {
    primary: '217 91% 60%',
    primaryLight: '217 91% 66%',
    primaryDark: '217 91% 54%',
  },
  
  // Purple Theme
  purple: {
    primary: '262 83% 58%',
    primaryLight: '262 83% 64%',
    primaryDark: '262 83% 52%',
  },
  
  // Orange Theme
  orange: {
    primary: '25 95% 53%',
    primaryLight: '25 95% 59%',
    primaryDark: '25 95% 47%',
  },
  
  // Teal Theme
  teal: {
    primary: '173 58% 39%',
    primaryLight: '173 58% 45%',
    primaryDark: '173 58% 33%',
  },
  
  // Indigo Theme
  indigo: {
    primary: '238 83% 67%',
    primaryLight: '238 83% 73%',
    primaryDark: '238 83% 61%',
  },
} as const;

// ===== SEMANTIC COLOR CONSTANTS =====
export const SEMANTIC_COLORS = {
  success: {
    light: '142 76% 42%',
    main: '142 76% 36%',
    dark: '142 76% 30%',
  },
  warning: {
    light: '38 92% 56%',
    main: '38 92% 50%',
    dark: '38 92% 44%',
  },
  error: {
    light: '0 84% 66%',
    main: '0 84% 60%',
    dark: '0 84% 54%',
  },
  info: {
    light: '217 91% 66%',
    main: '217 91% 60%',
    dark: '217 91% 54%',
  },
} as const;

// ===== STATUS COLORS =====
export const STATUS_COLORS = {
  pending: SEMANTIC_COLORS.warning.main,
  active: SEMANTIC_COLORS.success.main,
  inactive: SEMANTIC_COLORS.info.main,
  error: SEMANTIC_COLORS.error.main,
} as const;

// ===== UTILITY FUNCTIONS =====

/**
 * Apply a color scheme to the document
 * @param scheme - The color scheme to apply
 */
export function applyColorScheme(scheme: keyof typeof COLOR_SCHEMES): void {
  const colors = COLOR_SCHEMES[scheme];
  const root = document.documentElement;
  
  root.style.setProperty('--brand-primary', colors.primary);
  root.style.setProperty('--brand-primary-light', colors.primaryLight);
  root.style.setProperty('--brand-primary-dark', colors.primaryDark);
  
  // Update all dependent variables
  root.style.setProperty('--primary', colors.primary);
  root.style.setProperty('--ring', colors.primary);
  root.style.setProperty('--sidebar-primary', colors.primary);
  root.style.setProperty('--sidebar-ring', colors.primary);
  root.style.setProperty('--input-focus', colors.primary);
  root.style.setProperty('--button-primary', colors.primary);
  root.style.setProperty('--button-primary-hover', colors.primaryLight);
  root.style.setProperty('--button-primary-active', colors.primaryDark);
}

/**
 * Get the current brand primary color
 */
export function getCurrentBrandColor(): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue('--brand-primary')
    .trim();
}

/**
 * Set a custom brand color
 * @param hue - HSL hue value (0-360)
 * @param saturation - HSL saturation percentage (0-100)
 * @param lightness - HSL lightness percentage (0-100)
 */
export function setCustomBrandColor(
  hue: number,
  saturation: number,
  lightness: number
): void {
  const primary = `${hue} ${saturation}% ${lightness}%`;
  const primaryLight = `${hue} ${saturation}% ${Math.min(lightness + 6, 100)}%`;
  const primaryDark = `${hue} ${saturation}% ${Math.max(lightness - 6, 0)}%`;
  
  const root = document.documentElement;
  root.style.setProperty('--brand-primary', primary);
  root.style.setProperty('--brand-primary-light', primaryLight);
  root.style.setProperty('--brand-primary-dark', primaryDark);
  
  // Update all dependent variables
  root.style.setProperty('--primary', primary);
  root.style.setProperty('--ring', primary);
  root.style.setProperty('--sidebar-primary', primary);
  root.style.setProperty('--sidebar-ring', primary);
  root.style.setProperty('--input-focus', primary);
  root.style.setProperty('--button-primary', primary);
  root.style.setProperty('--button-primary-hover', primaryLight);
  root.style.setProperty('--button-primary-active', primaryDark);
}

/**
 * Get CSS variable value
 * @param variableName - The CSS variable name (without --)
 */
export function getCSSVariable(variableName: string): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(`--${variableName}`)
    .trim();
}

/**
 * Set CSS variable value
 * @param variableName - The CSS variable name (without --)
 * @param value - The value to set
 */
export function setCSSVariable(variableName: string, value: string): void {
  document.documentElement.style.setProperty(`--${variableName}`, value);
}

// ===== TAILWIND CLASS UTILITIES =====

/**
 * Get Tailwind classes for different color variants
 */
export const COLOR_CLASSES = {
  // Brand colors
  brand: {
    primary: 'bg-primary text-primary-foreground',
    primaryHover: 'hover:bg-primary/90',
    primaryLight: 'bg-primary-100 text-primary-800',
    primaryDark: 'bg-primary-700 text-white',
  },
  
  // Semantic colors
  success: {
    light: 'bg-green-100 text-green-800',
    main: 'bg-green-500 text-white',
    dark: 'bg-green-700 text-white',
  },
  
  warning: {
    light: 'bg-yellow-100 text-yellow-800',
    main: 'bg-yellow-500 text-white',
    dark: 'bg-yellow-700 text-white',
  },
  
  error: {
    light: 'bg-red-100 text-red-800',
    main: 'bg-red-500 text-white',
    dark: 'bg-red-700 text-white',
  },
  
  info: {
    light: 'bg-blue-100 text-blue-800',
    main: 'bg-blue-500 text-white',
    dark: 'bg-blue-700 text-white',
  },
  
  // Status colors
  status: {
    pending: 'bg-yellow-100 text-yellow-800',
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    error: 'bg-red-100 text-red-800',
  },
  
  // Button variants
  button: {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  },
} as const;

// ===== REACT HOOK FOR COLOR MANAGEMENT =====
import { useState, useEffect } from 'react';

export function useColorScheme() {
  const [currentScheme, setCurrentScheme] = useState<string>('green');
  
  const changeScheme = (scheme: keyof typeof COLOR_SCHEMES) => {
    applyColorScheme(scheme);
    setCurrentScheme(scheme);
  };
  
  const setCustomColor = (hue: number, saturation: number, lightness: number) => {
    setCustomBrandColor(hue, saturation, lightness);
    setCurrentScheme('custom');
  };
  
  return {
    currentScheme,
    changeScheme,
    setCustomColor,
    availableSchemes: Object.keys(COLOR_SCHEMES),
  };
}

// ===== EXPORT TYPES =====
export type ColorScheme = keyof typeof COLOR_SCHEMES;
export type SemanticColor = keyof typeof SEMANTIC_COLORS;
export type StatusColor = keyof typeof STATUS_COLORS; 