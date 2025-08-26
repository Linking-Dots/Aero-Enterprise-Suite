import React, { createContext, useContext, useState, useEffect } from 'react';
import { heroUIThemes, applyThemeToDocument, generateHeroUIConfig } from '../theme/index.js';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [themeSettings, setThemeSettings] = useState({
    mode: 'light', // 'light' or 'dark'
    activeTheme: 'heroui', // Current prebuilt theme
    layout: {
      fontFamily: 'Inter',
      borderRadius: '8px',
      borderWidth: '2px',
      scale: '100%',
      disabledOpacity: '0.5'
    },
    background: {
      type: 'color', // 'color' or 'image'
      color: '#ffffff', // Background color or gradient
      image: '', // Background image URL
      size: 'cover', // Background size for images
      position: 'center', // Background position for images
      repeat: 'no-repeat', // Background repeat for images
      opacity: 100, // Background opacity (0-100)
      blur: 0 // Background blur (0-20px)
    }
  });

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('heroui-theme-settings');
    if (savedTheme) {
      try {
        const parsedTheme = JSON.parse(savedTheme);
        setThemeSettings(prev => ({ ...prev, ...parsedTheme }));
      } catch (error) {
        console.warn('Failed to parse saved theme:', error);
      }
    }
  }, []);

  // Save theme to localStorage when changed
  useEffect(() => {
    localStorage.setItem('heroui-theme-settings', JSON.stringify(themeSettings));
    
    // Apply theme to document root for global CSS variables
    console.log('ThemeContext applying theme:', themeSettings);
    applyThemeToDocument(themeSettings);
    
    // Force a small delay to ensure DOM is ready for background application
    setTimeout(() => {
      applyThemeToDocument(themeSettings);
    }, 100);
  }, [themeSettings]);

  const updateTheme = (newSettings) => {
    setThemeSettings(prev => ({
      ...prev,
      ...newSettings
    }));
  };

  const toggleMode = () => {
    setThemeSettings(prev => ({
      ...prev,
      mode: prev.mode === 'light' ? 'dark' : 'light'
    }));
  };

  const resetTheme = () => {
    setThemeSettings({
      mode: 'light',
      activeTheme: 'heroui',
      layout: {
        fontFamily: 'Inter',
        borderRadius: '8px',
        borderWidth: '2px',
        scale: '100%',
        disabledOpacity: '0.5'
      },
      background: {
        type: 'color',
        color: '#ffffff',
        image: '',
        size: 'cover',
        position: 'center',
        repeat: 'no-repeat',
        opacity: 100,
        blur: 0
      }
    });
  };

  // Convert heroUIThemes object to array format expected by ThemeSettingDrawer
  const prebuiltThemes = Object.keys(heroUIThemes || {}).map(key => ({
    id: key,
    name: heroUIThemes[key]?.name || key,
    colors: [
      heroUIThemes[key]?.colors?.primary?.DEFAULT || heroUIThemes[key]?.colors?.primary || '#006FEE',
      heroUIThemes[key]?.colors?.secondary?.DEFAULT || heroUIThemes[key]?.colors?.secondary || '#17C964',
      heroUIThemes[key]?.colors?.success?.DEFAULT || heroUIThemes[key]?.colors?.success || '#17C964',
      heroUIThemes[key]?.colors?.warning?.DEFAULT || heroUIThemes[key]?.colors?.warning || '#F5A524',
      heroUIThemes[key]?.colors?.danger?.DEFAULT || heroUIThemes[key]?.colors?.danger || '#F31260'
    ],
    isDefault: key === 'heroui'
  }));

  // Generate the actual HeroUI theme object
  const getHeroUITheme = () => {
    return generateHeroUIConfig(themeSettings, themeSettings.mode === 'dark');
  };

  const value = {
    themeSettings,
    updateTheme,
    toggleMode,
    resetTheme,
    getHeroUITheme,
    prebuiltThemes,
    heroUIThemes // Add this so components can access the themes directly
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export { ThemeContext };
