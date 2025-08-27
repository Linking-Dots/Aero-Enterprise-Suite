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
  const [isInitialized, setIsInitialized] = useState(false);
  const [themeSettings, setThemeSettings] = useState({
    mode: 'light', // 'light' or 'dark'
    activeTheme: 'heroui', // Current prebuilt theme
    customColors: {
      primary: '#006FEE',
      secondary: '#17C964',
      success: '#17C964',
      warning: '#F5A524',
      danger: '#F31260',
      content1: '#FFFFFF',
      content2: '#F4F4F5',
      content3: '#E4E4E7',
      content4: '#D4D4D8',
      background: '#FFFFFF',
      foreground: '#000000',
      divider: '#E4E4E7'
    },
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
        console.log('Loading saved theme:', {
          ...parsedTheme,
          background: {
            ...parsedTheme.background,
            image: parsedTheme.background?.image ? `[IMAGE DATA ${parsedTheme.background.image.length} chars]` : ''
          }
        });
        setThemeSettings(prev => ({ ...prev, ...parsedTheme }));
      } catch (error) {
        console.warn('Failed to parse saved theme:', error);
        // Reset to default if parsing fails
        localStorage.removeItem('heroui-theme-settings');
      }
    }
    // Mark as initialized after loading (or if no saved theme exists)
    setIsInitialized(true);
  }, []);

  // Apply theme immediately when initialized (for initial load)
  useEffect(() => {
    if (isInitialized) {
      console.log('🎨 Applying theme on initialization');
      applyThemeToDocument(themeSettings);
    }
  }, [isInitialized]);

  // Save theme to localStorage and apply when changed (but not during initial load)
  useEffect(() => {
    // Don't save during initialization
    if (!isInitialized) {
      return;
    }

    console.log('🎨 Theme changed - saving and applying');

    // Save to localStorage
    try {
      localStorage.setItem('heroui-theme-settings', JSON.stringify(themeSettings));
      console.log('💾 Saved theme to localStorage:', {
        ...themeSettings,
        background: {
          ...themeSettings.background,
          image: themeSettings.background?.image ? `[IMAGE DATA ${themeSettings.background.image.length} chars]` : ''
        }
      });
    } catch (error) {
      console.error('Failed to save theme to localStorage:', error);
      // If storage fails (likely due to size), save without the image
      const themeWithoutImage = {
        ...themeSettings,
        background: {
          ...themeSettings.background,
          image: ''
        }
      };
      try {
        localStorage.setItem('heroui-theme-settings', JSON.stringify(themeWithoutImage));
        console.warn('Saved theme without image due to storage limitations');
      } catch (error2) {
        console.error('Failed to save theme even without image:', error2);
      }
    }
    
    // Apply theme once
    applyThemeToDocument(themeSettings);
  }, [themeSettings, isInitialized]);

  const updateTheme = (newSettings) => {
    console.log('ThemeContext updateTheme called with:', newSettings);
    setThemeSettings(prev => {
      let updatedSettings = {
        ...prev,
        ...newSettings
      };

      // If activeTheme is being changed, apply the complete prebuilt theme configuration
      if (newSettings.activeTheme && newSettings.activeTheme !== prev.activeTheme) {
        const selectedTheme = heroUIThemes[newSettings.activeTheme];
        if (selectedTheme) {
          console.log('Applying complete prebuilt theme:', newSettings.activeTheme, selectedTheme);
          updatedSettings = {
            ...prev,
            ...newSettings,
            // Apply layout properties from the selected theme
            layout: selectedTheme.layout ? {
              ...prev.layout,
              ...selectedTheme.layout
            } : prev.layout,
            // Apply background properties from the selected theme
            background: selectedTheme.background ? {
              ...prev.background,
              ...selectedTheme.background
            } : prev.background,
            // Keep custom colors but update activeTheme
            customColors: prev.customColors
          };
        }
      }

      console.log('ThemeContext updated settings:', updatedSettings);
      return updatedSettings;
    });
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
      customColors: {
        primary: '#006FEE',
        secondary: '#17C964',
        success: '#17C964',
        warning: '#F5A524',
        danger: '#F31260',
        content1: '#FFFFFF',
        content2: '#F4F4F5',
        content3: '#E4E4E7',
        content4: '#D4D4D8',
        background: '#FFFFFF',
        foreground: '#000000',
        divider: '#E4E4E7'
      },
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
