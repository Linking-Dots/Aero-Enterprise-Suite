import React, { useState, useEffect } from 'react';
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    Button,
    Card,
    CardBody,
    Select,
    SelectItem,
    Chip,
    Input,
    Tabs,
    Tab,
    Switch,
    Slider,
} from '@heroui/react';
import { useTheme } from '../Contexts/ThemeContext';
import { 
    fontFamilies, 
    radiusOptions, 
    borderWidthOptions, 
    scalingOptions, 
    opacityOptions 
} from '../theme/index.js';
import GlassDialog from './GlassDialog';

const ThemeSettingDrawer = ({ 
    isOpen,
    onClose
}) => {
    const { themeSettings, updateTheme, toggleMode, resetTheme, prebuiltThemes } = useTheme();

    // Background settings state
    const [backgroundType, setBackgroundType] = useState(themeSettings?.background?.type || 'color');
    const [backgroundImage, setBackgroundImage] = useState(themeSettings?.background?.image || '');
    const [backgroundColor, setBackgroundColor] = useState(themeSettings?.background?.color || '#ffffff');
    const [backgroundSize, setBackgroundSize] = useState(themeSettings?.background?.size || 'cover');
    const [backgroundPosition, setBackgroundPosition] = useState(themeSettings?.background?.position || 'center');
    const [backgroundRepeat, setBackgroundRepeat] = useState(themeSettings?.background?.repeat || 'no-repeat');
    const [backgroundOpacity, setBackgroundOpacity] = useState(themeSettings?.background?.opacity || 100);
    const [backgroundBlur, setBackgroundBlur] = useState(themeSettings?.background?.blur || 0);

    // Ensure prebuiltThemes is an array
    const themeOptions = Array.isArray(prebuiltThemes) ? prebuiltThemes : [];

    // Apply current background settings on mount
    useEffect(() => {
        if (themeSettings?.background) {
            console.log('ThemeSettingDrawer mounted, applying background:', themeSettings.background);
            applyBackgroundToDocument(themeSettings.background);
        }
    }, [themeSettings?.background]);

    // Base colors for custom theming (these can remain hardcoded as they're UI choices)
    const baseColors = [
        { name: 'Black', value: '#000000' },
        { name: 'Purple', value: '#9353D3' },
        { name: 'Green', value: '#17C964' },
        { name: 'Orange', value: '#F5A524' },
        { name: 'Pink', value: '#F31260' }
    ];

    // Content colors (semantic colors)
    const contentColors = [
        { name: 'content-1', value: '#F4F4F5' },
        { name: 'content-2', value: '#E4E4E7' },
        { name: 'content-3', value: '#D4D4D8' },
        { name: 'content-4', value: '#A1A1AA' }
    ];

    // Layout colors
    const layoutColors = [
        { name: 'background', value: '#FFFFFF' },
        { name: 'orange', value: '#F97316' },
        { name: 'black', value: '#000000' }
    ];

    // Convert theme file options to format expected by UI
    const fontOptions = fontFamilies.map(font => ({
        name: font.name,
        value: font.name // Use just the name for simplicity
    }));

    const radiusValues = radiusOptions.map(radius => ({
        name: radius.name,
        value: radius.value,
        label: radius.name
    }));

    const borderWidthValues = borderWidthOptions.map(borderWidth => ({
        name: borderWidth.name,
        value: borderWidth.value,
        label: borderWidth.name
    }));

    // Background size options
    const backgroundSizeOptions = [
        { value: 'cover', label: 'Cover', description: 'Scale to cover entire area' },
        { value: 'contain', label: 'Contain', description: 'Scale to fit within area' },
        { value: 'auto', label: 'Auto', description: 'Original size' },
        { value: 'stretch', label: 'Stretch', description: 'Stretch to fill area' },
        { value: '100% 100%', label: 'Fill', description: 'Fill area completely' }
    ];

    // Background position options
    const backgroundPositionOptions = [
        { value: 'center', label: 'Center' },
        { value: 'top', label: 'Top' },
        { value: 'bottom', label: 'Bottom' },
        { value: 'left', label: 'Left' },
        { value: 'right', label: 'Right' },
        { value: 'top left', label: 'Top Left' },
        { value: 'top right', label: 'Top Right' },
        { value: 'bottom left', label: 'Bottom Left' },
        { value: 'bottom right', label: 'Bottom Right' }
    ];

    // Background repeat options
    const backgroundRepeatOptions = [
        { value: 'no-repeat', label: 'No Repeat' },
        { value: 'repeat', label: 'Repeat' },
        { value: 'repeat-x', label: 'Repeat X' },
        { value: 'repeat-y', label: 'Repeat Y' },
        { value: 'space', label: 'Space' },
        { value: 'round', label: 'Round' }
    ];

    const handlePrebuiltThemeSelect = (themeId) => {
        updateTheme({
            ...themeSettings,
            activeTheme: themeId
        });
    };

    const handleColorChange = (property, value) => {
        // Color changes are handled automatically by the HeroUI theme system
        // No need to manually update colors as they come from prebuilt themes
    };

    const handleLayoutChange = (property, value) => {
        updateTheme({
            ...themeSettings,
            layout: {
                ...themeSettings.layout,
                [property]: value
            }
        });
    };

    const handleModeToggle = () => {
        toggleMode();
    };

    const handleBackgroundUpdate = (property, value) => {
        console.log('handleBackgroundUpdate called:', property, typeof value === 'string' && value.length > 100 ? value.substring(0, 100) + '...' : value);
        
        const newBackgroundSettings = {
            ...themeSettings.background,
            [property]: value
        };

        console.log('New background settings:', newBackgroundSettings);

        // Update local state
        switch(property) {
            case 'type':
                setBackgroundType(value);
                break;
            case 'image':
                setBackgroundImage(value);
                break;
            case 'color':
                setBackgroundColor(value);
                break;
            case 'size':
                setBackgroundSize(value);
                break;
            case 'position':
                setBackgroundPosition(value);
                break;
            case 'repeat':
                setBackgroundRepeat(value);
                break;
            case 'opacity':
                setBackgroundOpacity(value);
                break;
            case 'blur':
                setBackgroundBlur(value);
                break;
        }

        // Update theme context
        updateTheme({
            ...themeSettings,
            background: newBackgroundSettings
        });

        // Apply background to document body immediately (duplicate call for immediate feedback)
        console.log('Applying background immediately:', newBackgroundSettings);
        applyBackgroundToDocument(newBackgroundSettings);
    };

    const applyBackgroundToDocument = (backgroundSettings) => {
        console.log('applyBackgroundToDocument called with:', backgroundSettings);
        const body = document.body;
        
        if (backgroundSettings.type === 'image' && backgroundSettings.image) {
            console.log('Applying image background locally:', backgroundSettings.image.substring(0, 100) + '...');
            // Apply image background
            body.style.backgroundImage = `url(${backgroundSettings.image})`;
            body.style.backgroundSize = backgroundSettings.size || 'cover';
            body.style.backgroundPosition = backgroundSettings.position || 'center';
            body.style.backgroundRepeat = backgroundSettings.repeat || 'no-repeat';
            body.style.backgroundAttachment = 'fixed';
            body.style.backgroundColor = '';
            
            console.log('Applied image background styles:', {
                backgroundImage: body.style.backgroundImage ? 'SET' : 'NOT SET',
                backgroundSize: body.style.backgroundSize,
                backgroundPosition: body.style.backgroundPosition,
                backgroundRepeat: body.style.backgroundRepeat
            });
            
            // Apply opacity and blur through overlay
            let overlay = document.getElementById('background-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.id = 'background-overlay';
                overlay.style.position = 'fixed';
                overlay.style.top = '0';
                overlay.style.left = '0';
                overlay.style.width = '100%';
                overlay.style.height = '100%';
                overlay.style.pointerEvents = 'none';
                overlay.style.zIndex = '-1';
                body.appendChild(overlay);
            }
            
            const opacity = (backgroundSettings.opacity || 100) / 100;
            const blur = backgroundSettings.blur || 0;
            overlay.style.backdropFilter = blur > 0 ? `blur(${blur}px)` : 'none';
            overlay.style.backgroundColor = `rgba(0, 0, 0, ${1 - opacity})`;
            
        } else if (backgroundSettings.type === 'color' && backgroundSettings.color) {
            // Apply solid color background
            body.style.backgroundImage = '';
            body.style.backgroundSize = '';
            body.style.backgroundPosition = '';
            body.style.backgroundRepeat = '';
            body.style.backgroundAttachment = '';
            
            // Apply color with opacity
            const color = backgroundSettings.color;
            const opacity = (backgroundSettings.opacity || 100) / 100;
            
            if (color.startsWith('linear-gradient') || color.startsWith('radial-gradient')) {
                // Handle gradient backgrounds with overlay for opacity
                body.style.background = color;
                body.style.backgroundColor = '';
                body.style.opacity = '';
                
                // Create overlay for gradient opacity if needed
                if (opacity < 1) {
                    let overlay = document.getElementById('background-overlay');
                    if (!overlay) {
                        overlay = document.createElement('div');
                        overlay.id = 'background-overlay';
                        overlay.style.position = 'fixed';
                        overlay.style.top = '0';
                        overlay.style.left = '0';
                        overlay.style.width = '100%';
                        overlay.style.height = '100%';
                        overlay.style.pointerEvents = 'none';
                        overlay.style.zIndex = '-1';
                        body.appendChild(overlay);
                    }
                    overlay.style.backgroundColor = `rgba(255, 255, 255, ${1 - opacity})`;
                    overlay.style.backdropFilter = 'none';
                } else {
                    // Remove overlay if opacity is 100%
                    const overlay = document.getElementById('background-overlay');
                    if (overlay) {
                        overlay.remove();
                    }
                }
            } else {
                // Handle solid colors with rgba for proper opacity
                body.style.background = '';
                body.style.opacity = '';
                
                if (opacity < 1) {
                    // Convert hex to rgba if needed
                    let rgba = color;
                    if (color.startsWith('#')) {
                        const hex = color.replace('#', '');
                        const r = parseInt(hex.substr(0, 2), 16);
                        const g = parseInt(hex.substr(2, 2), 16);
                        const b = parseInt(hex.substr(4, 2), 16);
                        rgba = `rgba(${r}, ${g}, ${b}, ${opacity})`;
                    }
                    body.style.backgroundColor = rgba;
                } else {
                    body.style.backgroundColor = color;
                }
                
                // Remove image overlay if it exists
                const overlay = document.getElementById('background-overlay');
                if (overlay) {
                    overlay.remove();
                }
            }
            const overlay = document.getElementById('background-overlay');
            if (overlay) {
                overlay.remove();
            }
            
        } else {
            // Reset to default
            body.style.backgroundImage = '';
            body.style.backgroundSize = '';
            body.style.backgroundPosition = '';
            body.style.backgroundRepeat = '';
            body.style.backgroundAttachment = '';
            body.style.backgroundColor = '';
            body.style.background = '';
            body.style.opacity = '';
            
            // Remove overlay
            const overlay = document.getElementById('background-overlay');
            if (overlay) {
                overlay.remove();
            }
        }
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            console.log('File selected:', file.name, file.type, file.size);
            const reader = new FileReader();
            reader.onload = (e) => {
                const imageUrl = e.target.result;
                console.log('File read as data URL, length:', imageUrl.length);
                console.log('Setting background image to:', imageUrl.substring(0, 100) + '...');
                handleBackgroundUpdate('image', imageUrl);
                handleBackgroundUpdate('type', 'image');
            };
            reader.readAsDataURL(file);
        }
    };



    const SectionHeader = ({ icon, title, info = false }) => (
        <div className="flex items-center gap-2 mb-3">
            {icon}
            <span className="text-sm font-medium text-default-600">{title}</span>
            {info && (
                <svg className="w-4 h-4 text-default-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )}
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="lg"
            placement="center"
            hideCloseButton
        
      
            scrollBehavior="inside"
        
           
        >
            <ModalContent>
                <ModalHeader className="flex items-center justify-between px-6 py-4 border-b border-default-200">
                    <div className="flex items-center gap-3">
                        <h2 className="text-lg font-semibold text-default-700">Theme</h2>
                        <Button
                            variant="light"
                            size="sm"
                            className="text-default-500 hover:text-default-700"
                            onPress={resetTheme || (() => {})}
                            startContent={
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            }
                        >
                            Reset
                        </Button>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            isIconOnly
                            variant="light"
                            className="text-default-500 hover:text-default-700"
                            onPress={handleModeToggle}
                        >
                            {themeSettings?.mode === 'dark' ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                </svg>
                            )}
                        </Button>
                        <Button
                            isIconOnly
                            variant="light"
                            className="text-default-500 hover:text-default-700"
                            onPress={onClose}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </Button>
                    </div>
                </ModalHeader>

                <ModalBody>
                    <Tabs 
                        aria-label="Theme Settings" 
                        className="w-full"
                        variant="underlined"
                    >
                        {/* Themes Tab */}
                        <Tab key="themes" title="Themes">
                            <div className="p-6 space-y-6">
                                {/* Prebuilt Themes Section */}
                                <div>
                                    <SectionHeader 
                                        icon={
                                            <svg className="w-4 h-4 text-default-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                                            </svg>
                                        } 
                                        title="Prebuilt Themes" 
                                    />

                                    <Select
                                        placeholder="Select a theme"
                                        selectedKeys={[themeSettings?.activeTheme || 'heroui']}
                                        onSelectionChange={(keys) => handlePrebuiltThemeSelect(Array.from(keys)[0])}
                                        classNames={{
                                            base: "mb-4",
                                            trigger: "bg-default-100 border border-default-200 hover:bg-default-200 transition-colors"
                                        }}
                                    >
                                        {themeOptions.map((themeOption) => (
                                            <SelectItem key={themeOption.id} value={themeOption.id}>
                                                {themeOption.name}
                                            </SelectItem>
                                        ))}
                                    </Select>

                                    {/* Theme Preview List */}
                                    <div className="space-y-2">
                                        {themeOptions.slice(0, 5).map((themeOption) => (
                                            <div
                                                key={themeOption.id}
                                                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all hover:bg-default-50 ${
                                                    (themeSettings?.activeTheme || 'heroui') === themeOption.id 
                                                        ? 'border-primary bg-primary/5' 
                                                        : 'border-default-200 bg-white'
                                                }`}
                                                onClick={() => handlePrebuiltThemeSelect(themeOption.id)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="flex gap-1">
                                                        {themeOption.colors.slice(0, 4).map((color, index) => (
                                                            <div
                                                                key={index}
                                                                className="w-3 h-3 rounded-sm border border-default-200"
                                                                style={{ backgroundColor: color }}
                                                            />
                                                        ))}
                                                    </div>
                                                    <span className="text-sm font-medium text-default-700">{themeOption.name}</span>
                                                </div>
                                                {(themeSettings?.activeTheme || 'heroui') === themeOption.id && (
                                                    <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </Tab>

                        {/* Background Tab */}
                        <Tab key="background" title="Background">
                            <div className="p-6 space-y-6">
                                {/* Background Type Selection */}
                                <div>
                                    <SectionHeader 
                                        icon={
                                            <svg className="w-4 h-4 text-default-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        } 
                                        title="Background Type" 
                                    />
                                    <div className="flex gap-3">
                                        <Button
                                            variant={backgroundType === 'color' ? 'solid' : 'bordered'}
                                            color={backgroundType === 'color' ? 'primary' : 'default'}
                                            onPress={() => handleBackgroundUpdate('type', 'color')}
                                        >
                                            Solid Color
                                        </Button>
                                        <Button
                                            variant={backgroundType === 'image' ? 'solid' : 'bordered'}
                                            color={backgroundType === 'image' ? 'primary' : 'default'}
                                            onPress={() => handleBackgroundUpdate('type', 'image')}
                                        >
                                            Image
                                        </Button>
                                    </div>
                                </div>

                                {/* Image Background Options */}
                                {backgroundType === 'image' && (
                                    <>
                                        {/* Image Upload/URL Input */}
                                        <div>
                                            <SectionHeader 
                                                icon={
                                                    <svg className="w-4 h-4 text-default-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                    </svg>
                                                } 
                                                title="Upload Image or Enter URL" 
                                            />
                                            
                                            <div className="space-y-3">
                                                <div className="flex gap-3">
                                                    <Input
                                                        placeholder="Enter image URL"
                                                        value={backgroundImage}
                                                        onChange={(e) => handleBackgroundUpdate('image', e.target.value)}
                                                        className="flex-1"
                                                    />
                                                    <Button
                                                        variant="bordered"
                                                        onPress={() => document.getElementById('background-file-input').click()}
                                                    >
                                                        Upload
                                                    </Button>
                                                </div>
                                                <input
                                                    id="background-file-input"
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleFileUpload}
                                                    style={{ display: 'none' }}
                                                />
                                                
                                                {backgroundImage && (
                                                    <div className="w-full h-32 rounded-lg border border-default-200 overflow-hidden">
                                                        <img 
                                                            src={backgroundImage} 
                                                            alt="Background preview" 
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Background Size */}
                                        <div>
                                            <SectionHeader 
                                                icon={
                                                    <svg className="w-4 h-4 text-default-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                                    </svg>
                                                } 
                                                title="Background Size" 
                                            />
                                            <div className="grid grid-cols-2 gap-2">
                                                {backgroundSizeOptions.map((option) => (
                                                    <Button
                                                        key={option.value}
                                                        variant={backgroundSize === option.value ? 'solid' : 'bordered'}
                                                        color={backgroundSize === option.value ? 'primary' : 'default'}
                                                        onPress={() => handleBackgroundUpdate('size', option.value)}
                                                        className="flex flex-col gap-1 h-auto py-3"
                                                    >
                                                        <span className="font-medium">{option.label}</span>
                                                        <span className="text-xs text-default-500">{option.description}</span>
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Background Position */}
                                        <div>
                                            <SectionHeader 
                                                icon={
                                                    <svg className="w-4 h-4 text-default-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                                    </svg>
                                                } 
                                                title="Background Position" 
                                            />
                                            <div className="grid grid-cols-3 gap-2">
                                                {backgroundPositionOptions.map((option) => (
                                                    <Button
                                                        key={option.value}
                                                        variant={backgroundPosition === option.value ? 'solid' : 'bordered'}
                                                        color={backgroundPosition === option.value ? 'primary' : 'default'}
                                                        onPress={() => handleBackgroundUpdate('position', option.value)}
                                                        size="sm"
                                                    >
                                                        {option.label}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Background Repeat */}
                                        <div>
                                            <SectionHeader 
                                                icon={
                                                    <svg className="w-4 h-4 text-default-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                    </svg>
                                                } 
                                                title="Background Repeat" 
                                            />
                                            <div className="grid grid-cols-2 gap-2">
                                                {backgroundRepeatOptions.map((option) => (
                                                    <Button
                                                        key={option.value}
                                                        variant={backgroundRepeat === option.value ? 'solid' : 'bordered'}
                                                        color={backgroundRepeat === option.value ? 'primary' : 'default'}
                                                        onPress={() => handleBackgroundUpdate('repeat', option.value)}
                                                        size="sm"
                                                    >
                                                        {option.label}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Background Opacity */}
                                        <div>
                                            <SectionHeader 
                                                icon={
                                                    <svg className="w-4 h-4 text-default-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                                    </svg>
                                                } 
                                                title="Background Opacity" 
                                            />
                                            <div className="space-y-3">
                                                <Slider
                                                    aria-label="Background Opacity"
                                                    size="md"
                                                    step={5}
                                                    minValue={0}
                                                    maxValue={100}
                                                    value={backgroundOpacity}
                                                    onChange={(value) => handleBackgroundUpdate('opacity', value)}
                                                    className="max-w-md"
                                                    showTooltip={true}
                                                    tooltipProps={{
                                                        content: `${backgroundOpacity}%`
                                                    }}
                                                />
                                                <div className="text-sm text-default-500">
                                                    Current: {backgroundOpacity}%
                                                </div>
                                            </div>
                                        </div>

                                        {/* Background Blur */}
                                        <div>
                                            <SectionHeader 
                                                icon={
                                                    <svg className="w-4 h-4 text-default-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                } 
                                                title="Background Blur" 
                                            />
                                            <div className="space-y-3">
                                                <Slider
                                                    aria-label="Background Blur"
                                                    size="md"
                                                    step={1}
                                                    minValue={0}
                                                    maxValue={20}
                                                    value={backgroundBlur}
                                                    onChange={(value) => handleBackgroundUpdate('blur', value)}
                                                    className="max-w-md"
                                                    showTooltip={true}
                                                    tooltipProps={{
                                                        content: `${backgroundBlur}px`
                                                    }}
                                                />
                                                <div className="text-sm text-default-500">
                                                    Current: {backgroundBlur}px
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Solid Color Background Options */}
                                {backgroundType === 'color' && (
                                    <>
                                        {/* Predefined Colors */}
                                        <div>
                                            <SectionHeader 
                                                icon={
                                                    <svg className="w-4 h-4 text-default-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                                                    </svg>
                                                } 
                                                title="Predefined Colors" 
                                            />
                                            
                                            {/* Popular Background Colors */}
                                            <div className="grid grid-cols-6 gap-3 mb-4">
                                                {[
                                                    { name: 'Default', value: '#ffffff', description: 'Clean white' },
                                                    { name: 'Dark', value: '#0f0f23', description: 'Deep dark' },
                                                    { name: 'Slate', value: '#1e293b', description: 'Professional slate' },
                                                    { name: 'Blue', value: '#1e40af', description: 'Corporate blue' },
                                                    { name: 'Purple', value: '#7c3aed', description: 'Modern purple' },
                                                    { name: 'Green', value: '#059669', description: 'Nature green' },
                                                    { name: 'Orange', value: '#ea580c', description: 'Energetic orange' },
                                                    { name: 'Red', value: '#dc2626', description: 'Bold red' },
                                                    { name: 'Gray', value: '#6b7280', description: 'Neutral gray' },
                                                    { name: 'Indigo', value: '#4338ca', description: 'Deep indigo' },
                                                    { name: 'Pink', value: '#ec4899', description: 'Vibrant pink' },
                                                    { name: 'Teal', value: '#0d9488', description: 'Calming teal' }
                                                ].map((color) => (
                                                    <div
                                                        key={color.value}
                                                        className="flex flex-col items-center gap-2"
                                                    >
                                                        <button
                                                            className={`w-12 h-12 rounded-lg border-2 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary ${
                                                                (themeSettings?.background?.color || '#ffffff') === color.value 
                                                                    ? 'border-primary ring-2 ring-primary/20' 
                                                                    : 'border-default-200 hover:border-default-300'
                                                            }`}
                                                            style={{ backgroundColor: color.value }}
                                                            onClick={() => handleBackgroundUpdate('color', color.value)}
                                                            title={`${color.name} - ${color.description}`}
                                                        />
                                                        <span className="text-xs text-default-500 text-center">{color.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            
                                            {/* Gradient Options */}
                                            <div className="mt-6">
                                                <h4 className="text-sm font-medium text-default-700 mb-3">Gradient Backgrounds</h4>
                                                <div className="grid grid-cols-3 gap-3">
                                                    {[
                                                        { name: 'Blue Wave', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
                                                        { name: 'Purple Rain', value: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
                                                        { name: 'Sunset', value: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)' },
                                                        { name: 'Ocean', value: 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)' },
                                                        { name: 'Forest', value: 'linear-gradient(135deg, #00b894 0%, #55a3ff 100%)' },
                                                        { name: 'Night', value: 'linear-gradient(135deg, #2d3748 0%, #1a202c 100%)' }
                                                    ].map((gradient) => (
                                                        <button
                                                            key={gradient.name}
                                                            className={`h-16 rounded-lg border-2 transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary flex items-end p-2 ${
                                                                (themeSettings?.background?.color || '#ffffff') === gradient.value 
                                                                    ? 'border-primary ring-2 ring-primary/20' 
                                                                    : 'border-default-200 hover:border-default-300'
                                                            }`}
                                                            style={{ background: gradient.value }}
                                                            onClick={() => handleBackgroundUpdate('color', gradient.value)}
                                                        >
                                                            <span className="text-xs text-white font-medium bg-black/20 px-2 py-1 rounded backdrop-blur-sm">
                                                                {gradient.name}
                                                            </span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Custom Color Picker */}
                                        <div>
                                            <SectionHeader 
                                                icon={
                                                    <svg className="w-4 h-4 text-default-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                                                    </svg>
                                                } 
                                                title="Custom Color Picker" 
                                            />
                                            
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-4">
                                                    {/* Only show color picker for hex colors, not gradients */}
                                                    {(!themeSettings?.background?.color || 
                                                      (!themeSettings.background.color.startsWith('linear-gradient') && 
                                                       !themeSettings.background.color.startsWith('radial-gradient'))) && (
                                                        <Input
                                                            type="color"
                                                            value={themeSettings?.background?.color?.startsWith('#') ? themeSettings.background.color : '#ffffff'}
                                                            onChange={(e) => handleBackgroundUpdate('color', e.target.value)}
                                                            className="w-16 h-16"
                                                            style={{ 
                                                                padding: 0,
                                                                border: 'none'
                                                            }}
                                                        />
                                                    )}
                                                    <div className="flex-1">
                                                        <Input
                                                            label="Hex Color"
                                                            placeholder="#ffffff"
                                                            value={themeSettings?.background?.color?.startsWith('#') ? themeSettings.background.color : ''}
                                                            onChange={(e) => {
                                                                const value = e.target.value.startsWith('#') ? e.target.value : `#${e.target.value}`;
                                                                if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                                                                    handleBackgroundUpdate('color', value);
                                                                }
                                                            }}
                                                            startContent={<span className="text-default-400">#</span>}
                                                        />
                                                    </div>
                                                </div>
                                                
                                                {/* Show current gradient info if applicable */}
                                                {themeSettings?.background?.color && 
                                                 (themeSettings.background.color.startsWith('linear-gradient') || 
                                                  themeSettings.background.color.startsWith('radial-gradient')) && (
                                                    <div className="p-4 bg-default-100 rounded-lg">
                                                        <div className="text-sm text-default-600 mb-2">Current gradient:</div>
                                                        <div 
                                                            className="h-8 rounded border"
                                                            style={{ background: themeSettings.background.color }}
                                                        />
                                                        <div className="text-xs text-default-500 mt-2 font-mono break-all">
                                                            {themeSettings.background.color}
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                {/* Color Preview for hex colors */}
                                                {themeSettings?.background?.color?.startsWith('#') && (
                                                    <div className="mt-4">
                                                        <div 
                                                            className="w-full h-20 rounded-lg border border-default-200 flex items-center justify-center"
                                                            style={{ 
                                                                background: themeSettings.background.color
                                                            }}
                                                        >
                                                            <span className="text-sm font-medium px-3 py-1 rounded bg-black/10 backdrop-blur-sm">
                                                                Color Preview
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Background Opacity for Solid Colors */}
                                        <div>
                                            <SectionHeader 
                                                icon={
                                                    <svg className="w-4 h-4 text-default-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                                    </svg>
                                                } 
                                                title="Color Opacity" 
                                            />
                                            <div className="space-y-3">
                                                <Slider
                                                    aria-label="Color Opacity"
                                                    size="md"
                                                    step={5}
                                                    minValue={0}
                                                    maxValue={100}
                                                    value={backgroundOpacity}
                                                    onChange={(value) => handleBackgroundUpdate('opacity', value)}
                                                    className="max-w-md"
                                                    showTooltip={true}
                                                    tooltipProps={{
                                                        content: `${backgroundOpacity}%`
                                                    }}
                                                />
                                                <div className="text-sm text-default-500">
                                                    Current: {backgroundOpacity}%
                                                </div>
                                            </div>
                                        </div>
                                    
                                
                                    
                                        {/* Image Upload/URL Input */}
                                        <div>
                                            <SectionHeader 
                                                icon={
                                                    <svg className="w-4 h-4 text-default-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                    </svg>
                                                } 
                                                title="Upload Image or Enter URL" 
                                            />
                                            
                                            <div className="space-y-3">
                                                <div className="flex gap-3">
                                                    <Input
                                                        placeholder="Enter image URL"
                                                        value={backgroundImage}
                                                        onChange={(e) => handleBackgroundUpdate('image', e.target.value)}
                                                        className="flex-1"
                                                    />
                                                    <Button
                                                        variant="bordered"
                                                        onPress={() => document.getElementById('background-file-input').click()}
                                                    >
                                                        Upload
                                                    </Button>
                                                </div>
                                                <input
                                                    id="background-file-input"
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleFileUpload}
                                                    style={{ display: 'none' }}
                                                />
                                                
                                                {backgroundImage && (
                                                    <div className="w-full h-32 rounded-lg border border-default-200 overflow-hidden">
                                                        <img 
                                                            src={backgroundImage} 
                                                            alt="Background preview" 
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Background Size */}
                                        <div>
                                            <SectionHeader 
                                                icon={
                                                    <svg className="w-4 h-4 text-default-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                                    </svg>
                                                } 
                                                title="Background Size" 
                                            />
                                            <div className="grid grid-cols-2 gap-2">
                                                {backgroundSizeOptions.map((option) => (
                                                    <Button
                                                        key={option.value}
                                                        variant={backgroundSize === option.value ? 'solid' : 'bordered'}
                                                        color={backgroundSize === option.value ? 'primary' : 'default'}
                                                        onPress={() => handleBackgroundUpdate('size', option.value)}
                                                        className="flex flex-col gap-1 h-auto py-3"
                                                    >
                                                        <span className="font-medium">{option.label}</span>
                                                        <span className="text-xs text-default-500">{option.description}</span>
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Background Position */}
                                        <div>
                                            <SectionHeader 
                                                icon={
                                                    <svg className="w-4 h-4 text-default-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                                    </svg>
                                                } 
                                                title="Background Position" 
                                            />
                                            <div className="grid grid-cols-3 gap-2">
                                                {backgroundPositionOptions.map((option) => (
                                                    <Button
                                                        key={option.value}
                                                        variant={backgroundPosition === option.value ? 'solid' : 'bordered'}
                                                        color={backgroundPosition === option.value ? 'primary' : 'default'}
                                                        onPress={() => handleBackgroundUpdate('position', option.value)}
                                                        size="sm"
                                                    >
                                                        {option.label}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Background Repeat */}
                                        <div>
                                            <SectionHeader 
                                                icon={
                                                    <svg className="w-4 h-4 text-default-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                    </svg>
                                                } 
                                                title="Background Repeat" 
                                            />
                                            <div className="grid grid-cols-2 gap-2">
                                                {backgroundRepeatOptions.map((option) => (
                                                    <Button
                                                        key={option.value}
                                                        variant={backgroundRepeat === option.value ? 'solid' : 'bordered'}
                                                        color={backgroundRepeat === option.value ? 'primary' : 'default'}
                                                        onPress={() => handleBackgroundUpdate('repeat', option.value)}
                                                        size="sm"
                                                    >
                                                        {option.label}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Background Opacity */}
                                        <div>
                                            <SectionHeader 
                                                icon={
                                                    <svg className="w-4 h-4 text-default-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                                    </svg>
                                                } 
                                                title="Background Opacity" 
                                            />
                                            <div className="space-y-3">
                                                <Slider
                                                    aria-label="Background Opacity"
                                                    size="md"
                                                    step={5}
                                                    minValue={0}
                                                    maxValue={100}
                                                    value={backgroundOpacity}
                                                    onChange={(value) => handleBackgroundUpdate('opacity', value)}
                                                    className="max-w-md"
                                                    showTooltip={true}
                                                    tooltipProps={{
                                                        content: `${backgroundOpacity}%`
                                                    }}
                                                />
                                                <div className="text-sm text-default-500">
                                                    Current: {backgroundOpacity}%
                                                </div>
                                            </div>
                                        </div>

                                        {/* Background Blur */}
                                        <div>
                                            <SectionHeader 
                                                icon={
                                                    <svg className="w-4 h-4 text-default-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                } 
                                                title="Background Blur" 
                                            />
                                            <div className="space-y-3">
                                                <Slider
                                                    aria-label="Background Blur"
                                                    size="md"
                                                    step={1}
                                                    minValue={0}
                                                    maxValue={20}
                                                    value={backgroundBlur}
                                                    onChange={(value) => handleBackgroundUpdate('blur', value)}
                                                    className="max-w-md"
                                                    showTooltip={true}
                                                    tooltipProps={{
                                                        content: `${backgroundBlur}px`
                                                    }}
                                                />
                                                <div className="text-sm text-default-500">
                                                    Current: {backgroundBlur}px
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </Tab>

                        {/* Layout Tab */}
                        <Tab key="layout" title="Layout">
                            <div className="p-6 space-y-6">
                                {/* Font Family Section */}
                                <div>
                                    <SectionHeader 
                                        icon={
                                            <svg className="w-4 h-4 text-default-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 20V4c0-1.1.9-2 2-2h3.5c1.8 0 3.5 1 3.5 3.5s-1.7 3.5-3.5 3.5H8v1h2.5c1.8 0 3.5 1 3.5 3.5s-1.7 3.5-3.5 3.5H8z" />
                                            </svg>
                                        } 
                                        title="Font Family" 
                                        info={true}
                                    />
                                    <div className="grid grid-cols-2 gap-3">
                                        {fontOptions.map((font) => (
                                            <button
                                                key={font.name}
                                                className={`p-4 rounded-lg border-2 transition-all hover:bg-default-50 focus:outline-none focus:ring-2 focus:ring-primary ${
                                                    (themeSettings?.layout?.fontFamily || 'Inter') === font.value 
                                                        ? 'border-primary bg-primary/5' 
                                                        : 'border-default-200 bg-white'
                                                }`}
                                                onClick={() => handleLayoutChange('fontFamily', font.value)}
                                            >
                                                <div className="text-center">
                                                    <div className="text-xl font-bold mb-1" style={{ fontFamily: font.value }}>
                                                        Ag12
                                                    </div>
                                                    <div className="text-xs text-default-500">{font.name}</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Radius Section */}
                                <div>
                                    <SectionHeader 
                                        icon={
                                            <svg className="w-4 h-4 text-default-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12a3 3 0 003-3m-3 3a3 3 0 003 3m-3-3H3m6 0l6-6m6 6a3 3 0 01-3 3m3-3a3 3 0 01-3-3m3 3H15" />
                                            </svg>
                                        } 
                                        title="Radius" 
                                        info={true}
                                    />
                                    <div className="grid grid-cols-3 gap-3">
                                        {radiusValues.map((radius) => (
                                            <button
                                                key={radius.name}
                                                className={`p-4 rounded-lg border-2 transition-all hover:bg-default-50 focus:outline-none focus:ring-2 focus:ring-primary ${
                                                    (themeSettings?.layout?.borderRadius || '8px') === radius.value 
                                                        ? 'border-primary bg-primary/5' 
                                                        : 'border-default-200 bg-white'
                                                }`}
                                                onClick={() => handleLayoutChange('borderRadius', radius.value)}
                                            >
                                                <div className="text-center">
                                                    <div 
                                                        className="w-6 h-6 bg-primary mx-auto mb-2"
                                                        style={{ borderRadius: radius.value }}
                                                    />
                                                    <div className="text-xs text-default-500">{radius.label}</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Border Width Section */}
                                <div>
                                    <SectionHeader 
                                        icon={
                                            <svg className="w-4 h-4 text-default-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12a3 3 0 003-3m-3 3a3 3 0 003 3m-3-3H3m6 0l6-6m6 6a3 3 0 01-3 3m3-3a3 3 0 01-3-3m3 3H15" />
                                            </svg>
                                        } 
                                        title="Border width" 
                                        info={true}
                                    />
                                    <div className="grid grid-cols-3 gap-3">
                                        {borderWidthValues.map((borderWidth) => (
                                            <button
                                                key={borderWidth.name}
                                                className={`p-4 rounded-lg border-2 transition-all hover:bg-default-50 focus:outline-none focus:ring-2 focus:ring-primary ${
                                                    (themeSettings?.layout?.borderWidth || '2px') === borderWidth.value 
                                                        ? 'border-primary bg-primary/5' 
                                                        : 'border-default-200 bg-white'
                                                }`}
                                                onClick={() => handleLayoutChange('borderWidth', borderWidth.value)}
                                            >
                                                <div className="text-center">
                                                    <div 
                                                        className="w-6 h-6 bg-transparent mx-auto mb-2 border-primary rounded-md"
                                                        style={{ 
                                                            borderWidth: borderWidth.value, 
                                                            borderStyle: 'solid',
                                                            borderColor: 'currentColor'
                                                        }}
                                                    />
                                                    <div className="text-xs text-default-500">{borderWidth.label}</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Scaling Section */}
                                <div>
                                    <SectionHeader 
                                        icon={
                                            <svg className="w-4 h-4 text-default-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                            </svg>
                                        } 
                                        title="Scaling" 
                                        info={true}
                                    />
                                    <div className="flex gap-2 flex-wrap">
                                        {scalingOptions.map((scale) => (
                                            <button
                                                key={scale}
                                                className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all hover:bg-default-50 focus:outline-none focus:ring-2 focus:ring-primary ${
                                                    (themeSettings?.layout?.scale || '100%') === scale 
                                                        ? 'border-primary bg-primary text-white' 
                                                        : 'border-default-200 bg-white text-default-700'
                                                }`}
                                                onClick={() => handleLayoutChange('scale', scale)}
                                            >
                                                {scale}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Disable Opacity Section */}
                                <div>
                                    <SectionHeader 
                                        icon={
                                            <svg className="w-4 h-4 text-default-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                            </svg>
                                        } 
                                        title="Disable Opacity" 
                                    />
                                    <div className="flex gap-2 flex-wrap">
                                        {opacityOptions.map((opacity) => (
                                            <button
                                                key={opacity}
                                                className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all hover:bg-default-50 focus:outline-none focus:ring-2 focus:ring-primary ${
                                                    (themeSettings?.layout?.disabledOpacity || '0.5') === opacity 
                                                        ? 'border-primary bg-primary text-white' 
                                                        : 'border-default-200 bg-white text-default-700'
                                                }`}
                                                onClick={() => handleLayoutChange('disabledOpacity', opacity)}
                                            >
                                                {opacity}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </Tab>
                    </Tabs>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};

export default ThemeSettingDrawer;