/**
 * Simplified Theme Manager for HeroUI
 * Manages theme settings through localStorage and CSS variables
 */

// Available themes
export const themes = {
  heroui: {
    name: 'HeroUI',
    colors: {
      primary: '#006FEE',
      secondary: '#17C964',
      success: '#17C964',
      warning: '#F5A524',
      danger: '#F31260'
    }
  },
  modern: {
    name: 'Modern',
    colors: {
      primary: '#0070F3',
      secondary: '#7928CA',
      success: '#10B981',
      warning: '#FF4785',
      danger: '#FF0080'
    }
  },
  elegant: {
    name: 'Elegant',
    colors: {
      primary: '#1F2937',
      secondary: '#F59E0B',
      success: '#10B981',
      warning: '#F59E0B',
      danger: '#EF4444'
    }
  },
  coffee: {
    name: 'Coffee',
    colors: {
      primary: '#8B4513',
      secondary: '#D2691E',
      success: '#CD853F',
      warning: '#DEB887',
      danger: '#F5DEB3'
    }
  },
  emerald: {
    name: 'Emerald',
    colors: {
      primary: '#047857',
      secondary: '#059669',
      success: '#10B981',
      warning: '#34D399',
      danger: '#6EE7B7'
    }
  }
};

// Default settings
const defaultSettings = {
  theme: 'heroui',
  mode: 'light'
};

/**
 * Get current theme settings from localStorage
 */
export const getThemeSettings = () => {
  try {
    const saved = localStorage.getItem('heroui-theme-settings');
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  } catch {
    return defaultSettings;
  }
};

/**
 * Save theme settings to localStorage
 */
export const saveThemeSettings = (settings) => {
  try {
    localStorage.setItem('heroui-theme-settings', JSON.stringify(settings));
  } catch (error) {
    console.warn('Failed to save theme settings:', error);
  }
};

/**
 * Apply theme to document
 */
export const applyTheme = (settings) => {
  const root = document.documentElement;
  const selectedTheme = themes[settings.theme] || themes.heroui;
  
  // Set data attributes
  root.setAttribute('data-theme', settings.mode);
  root.setAttribute('data-active-theme', settings.theme);
  
  // Apply dark/light mode
  if (settings.mode === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  
  // Apply theme colors as CSS variables for custom components
  Object.entries(selectedTheme.colors).forEach(([key, value]) => {
    root.style.setProperty(`--theme-${key}`, value);
  });
};

/**
 * Generate HeroUI theme configuration
 */
export const generateHeroUITheme = (settings) => {
  const selectedTheme = themes[settings.theme] || themes.heroui;
  
  return {
    extend: 'light', // or 'dark' based on settings.mode
    colors: selectedTheme.colors
  };
};

/**
 * Initialize theme on app start
 */
export const initializeTheme = () => {
  const settings = getThemeSettings();
  applyTheme(settings);
  return settings;
};
