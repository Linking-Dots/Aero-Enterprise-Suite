import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Box, CssBaseline, ThemeProvider, useMediaQuery } from '@mui/material';
import { usePage } from "@inertiajs/react";
import useTheme from "@/theme.jsx";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../../css/theme-transitions.css';
import '../../css/smooth-animations.css';
import { Inertia } from '@inertiajs/inertia';
import { getPages } from '@/Props/pages.jsx';
import { getSettingsPages } from '@/Props/settings.jsx';
import { HeroUIProvider } from "@heroui/react";
import { applyThemeToRoot } from "@/utils/themeUtils.js";
import {ScrollShadow} from "@heroui/react";
import { motion, AnimatePresence } from 'framer-motion';

// Direct imports - eager loading with smooth animations
import Header from "@/Layouts/Header.jsx";
import Sidebar from "@/Layouts/Sidebar.jsx";
import Breadcrumb from "@/Components/Breadcrumb.jsx";
import BottomNav from "@/Layouts/BottomNav.jsx";
import SessionExpiredModal from '@/Components/SessionExpiredModal.jsx';
import ThemeSettingDrawer from "@/Components/ThemeSettingDrawer.jsx";
import UpdateNotification from '@/Components/UpdateNotification.jsx';
import { FadeIn, SlideIn } from '@/Components/Animations/SmoothAnimations';
import { useVersionManager } from '@/Hooks/useVersionManager.js';

// Import service worker manager to trigger registration
import '@/utils/serviceWorkerManager.js';

import axios from 'axios';

/**
 * Enhanced App Layout Component with selective memoization
 * Layout preferences are memoized for performance, but page data is always fresh
 */
const App = React.memo(({ children }) => {
    // ===== STATE MANAGEMENT =====
    const [sessionExpired, setSessionExpired] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    let { auth, app, url } = usePage().props;
    
    // Initialize version manager
    const {
        currentVersion,
        isUpdateAvailable,
        isChecking,
        forceUpdate,
        dismissUpdate
    } = useVersionManager();
    
    // Fresh auth data - no memoization to prevent stale user state
    const currentAuth = {
        user: auth?.user,
        permissions: auth?.permissions,
        id: auth?.user?.id,
        permissionCount: auth?.permissions?.length
    };
    
    // Simple state without localStorage persistence for fresh data
    const [sideBarOpen, setSideBarOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(() => {
        try {
            return localStorage.getItem('darkMode') === 'true';
        } catch {
            return false;
        }
    });
    
    const [themeColor, setThemeColor] = useState(() => {
        try {
            const stored = localStorage.getItem('themeColor');
            return stored ? JSON.parse(stored) : {
                name: "OCEAN", 
                primary: "#0ea5e9", 
                secondary: "#0284c7",
                gradient: "from-sky-500 to-blue-600",
                description: "Ocean Blue - Professional & Trustworthy"
            };
        } catch {
            return {
                name: "OCEAN", 
                primary: "#0ea5e9", 
                secondary: "#0284c7",
                gradient: "from-sky-500 to-blue-600",
                description: "Ocean Blue - Professional & Trustworthy"
            };
        }
    });
    
    const [themeDrawerOpen, setThemeDrawerOpen] = useState(false);
    const [bottomNavHeight, setBottomNavHeight] = useState(0);
    const [loading, setLoading] = useState(false);

    // Persistent refs
    const contentRef = useRef(null);
    const mainContentRef = useRef(null);
    const sessionCheckRef = useRef(null);
    const layoutInitialized = useRef(false);

    // ===== FRESH DATA COMPUTATIONS (No Memoization) =====
    // Always fresh permissions and pages - recalculate on every render for latest data
    const permissions = currentAuth?.permissions || [];
    
    const pages = (() => {
        const isSettingsPage = url.startsWith('/settings') || url.includes('settings');
        return isSettingsPage ? getSettingsPages(permissions, currentAuth) : getPages(permissions, currentAuth);
    })();

    // ===== LAYOUT PERFORMANCE OPTIMIZATION (Selective Memoization) =====
    // Memoize layout preferences for performance, but keep data fresh
    const theme = useMemo(() => 
        useTheme(darkMode, themeColor), 
        [darkMode, themeColor]
    );
    
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    // ===== LAYOUT TOGGLE HANDLERS (Memoized for Performance) =====
    const toggleDarkMode = useCallback(() => {
        setDarkMode(prev => {
            const newValue = !prev;
            localStorage.setItem('darkMode', newValue);
            return newValue;
        });
    }, []);
    
    const toggleThemeColor = useCallback((color) => {
        setThemeColor(color);
        localStorage.setItem('themeColor', JSON.stringify(color));
    }, []);
    
    const toggleThemeDrawer = useCallback(() => {
        setThemeDrawerOpen(prev => !prev);
    }, []);
    
    const toggleSideBar = useCallback(() => {
        setSideBarOpen(prev => !prev);
    }, []);

    // Handle app update (memoized for layout performance)
    const handleUpdate = useCallback(async () => {
        setIsUpdating(true);
        try {
            await forceUpdate();
        } catch (error) {
            console.error('Update failed:', error);
            setIsUpdating(false);
        }
    }, [forceUpdate]);

    // ===== INITIALIZATION EFFECTS =====
    // Initialize Firebase only when user is authenticated (one-time setup)
    useEffect(() => {
        if (!currentAuth?.user || layoutInitialized.current) return;

        let mounted = true;
        
        const loadFirebase = async () => {
            try {
                const { initFirebase } = await import("@/utils/firebaseInit.js");
                if (mounted) {
                    await initFirebase();
                    layoutInitialized.current = true;
                }
            } catch (error) {
                console.warn('Firebase initialization failed:', error);
            }
        };

        loadFirebase();
        
        return () => {
            mounted = false;
        };
    }, [currentAuth?.user?.id]);

    // Apply theme to root with optimized scheduling
    useEffect(() => {
        // Apply theme immediately
        applyThemeToRoot(themeColor, darkMode);
        
        // Initialize background pattern from localStorage
        const savedBackground = localStorage.getItem('aero-hr-background');
        const backgroundPattern = savedBackground || 'pattern-glass-1'; 
        
        // Apply background pattern immediately
        document.documentElement.setAttribute('data-background', backgroundPattern);
        
        // Apply theme mode for background variations
        document.body.setAttribute('data-theme-mode', darkMode ? 'dark' : 'light');
        
        // Force immediate background application with theme colors for overlays
        const root = document.documentElement;
        root.style.setProperty('--theme-primary-rgb', hexToRgb(themeColor.primary));
        root.style.setProperty('--theme-secondary-rgb', hexToRgb(themeColor.secondary));
        root.style.setProperty('--theme-primary', themeColor.primary);
        root.style.setProperty('--theme-secondary', themeColor.secondary);
    }, [darkMode, themeColor]);

    // Helper function to convert hex to RGB
    const hexToRgb = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (result) {
            const r = parseInt(result[1], 16);
            const g = parseInt(result[2], 16);
            const b = parseInt(result[3], 16);
            return `${r}, ${g}, ${b}`;
        }
        return '14, 165, 233'; // fallback to ocean blue
    };
    
    // Session check with optimized interval (persistent across navigations)
    useEffect(() => {
        if (!currentAuth?.user) return;

        const checkSession = async () => {
            try {
                const response = await axios.get('/session-check');
                if (!response.data.authenticated) {
                    setSessionExpired(true);
                    if (sessionCheckRef.current) {
                        clearInterval(sessionCheckRef.current);
                        sessionCheckRef.current = null;
                    }
                }
            } catch (error) {
                console.error('Session check failed:', error);
                setSessionExpired(true);
                if (sessionCheckRef.current) {
                    clearInterval(sessionCheckRef.current);
                    sessionCheckRef.current = null;
                }
            }
        };

        // Check every 15 seconds for fresh session state
        const initialTimeout = setTimeout(() => {
            checkSession();
            sessionCheckRef.current = setInterval(checkSession, 15000);
        }, 5000);

        return () => {
            clearTimeout(initialTimeout);
            if (sessionCheckRef.current) {
                clearInterval(sessionCheckRef.current);
            }
        };
    }, [currentAuth?.user?.id]);
        


    // Inertia loading state with throttling (optimized for SPA navigation)
    useEffect(() => {
        let loadingTimeout;
        
        const start = () => {
            // Only show loading for longer operations
            loadingTimeout = setTimeout(() => setLoading(true), 250);
        };
        
        const finish = () => {
            clearTimeout(loadingTimeout);
            setLoading(false);
        };
        
        const unStart = Inertia.on('start', start);
        const unFinish = Inertia.on('finish', finish);
        
        return () => {
            clearTimeout(loadingTimeout);
            unStart();
            unFinish();
        };
    }, []);

   

    // Hide app loading screen with improved timing (one-time initialization)
    useEffect(() => {
        if (currentAuth?.user && window.AppLoader) {
            // Give components time to mount and render
            const timer = setTimeout(() => {
                window.AppLoader.updateLoadingMessage('Almost ready...', 'Loading your dashboard');
                
                // Final hide after a brief moment
                setTimeout(() => {
                    window.AppLoader.hideLoading();
                }, 300);
            }, 200);
            
            return () => clearTimeout(timer);
        }
    }, [currentAuth?.user]);

    // ===== FRESH LAYOUT COMPONENTS (No Memoization) =====
    // Components re-render on every update to reflect latest data
    const headerContent = currentAuth?.user ? (
        <FadeIn delay={0.1} direction="down" duration={0.5}>
            <Header
                url={url}
                pages={pages}
                darkMode={darkMode}
                toggleDarkMode={toggleDarkMode}
                toggleThemeDrawer={toggleThemeDrawer}
                sideBarOpen={sideBarOpen}
                toggleSideBar={toggleSideBar}
                themeDrawerOpen={themeDrawerOpen}
            />
        </FadeIn>
    ) : null;

    const sidebarContent = currentAuth?.user ? (
        <SlideIn direction="left" delay={0.2} duration={0.6}>
            <Sidebar 
                url={url} 
                pages={pages} 
                toggleSideBar={toggleSideBar}
                sideBarOpen={sideBarOpen}
            />
        </SlideIn>
    ) : null;

    const breadcrumbContent = currentAuth?.user ? (
        <FadeIn delay={0.3} direction="right" duration={0.4}>
            <Breadcrumb />
        </FadeIn>
    ) : null;

    const bottomNavContent = currentAuth?.user && isMobile ? (
        <SlideIn direction="up" delay={0.4} duration={0.5}>
            <BottomNav
                setBottomNavHeight={setBottomNavHeight}
                contentRef={contentRef}
                auth={currentAuth}
                toggleSideBar={toggleSideBar}
                sideBarOpen={sideBarOpen}
            />
        </SlideIn>
    ) : null;

    // ===== RENDER =====
    return (
        <ThemeProvider theme={theme}>
            <HeroUIProvider>
                {/* Version Update Notification */}
                <UpdateNotification
                    isVisible={isUpdateAvailable}
                    onUpdate={handleUpdate}
                    onDismiss={dismissUpdate}
                    isUpdating={isUpdating}
                    version={currentVersion}
                />
                
                {/* Global modals and overlays */}
                {sessionExpired && (
                    <SessionExpiredModal setSessionExpired={setSessionExpired}/>
                )}
                
                <ThemeSettingDrawer
                    toggleThemeColor={toggleThemeColor}
                    themeColor={themeColor}
                    darkMode={darkMode}
                    toggleDarkMode={toggleDarkMode}
                    toggleThemeDrawer={toggleThemeDrawer}
                    themeDrawerOpen={themeDrawerOpen}
                />
                
                <ToastContainer
                    position="top-center"
                    autoClose={5000}
                    hideProgressBar={false}
                    newestOnTop={false}
                    closeOnClick
                    rtl={false}
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                    theme="colored"
                />
                
                <CssBaseline />
                
                {/* Main layout container */}
                <main id="app-main" className={`${darkMode ? "dark" : "light"}`}>
                    
                    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
                        {/* Mobile overlay */}
                        {isMobile && sideBarOpen && (
                            <Box
                                onClick={toggleSideBar}
                                sx={{
                                    position: 'fixed',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    bgcolor: 'rgba(0,0,0,0.5)',
                                    zIndex: 1199,
                                    transition: 'opacity 0.2s ease',
                                    willChange: 'opacity',
                                }}
                            />
                        )}
                        
                        {/* Persistent Sidebar */}
                        {sidebarContent && (
                            <Box
                                sx={{
                                    position: 'fixed',
                                    top: 0,
                                    left: 0,
                                    height: '100vh', // Fixed to viewport height
                                    zIndex: 1200,
                                    width: isMobile ? '280px' : '280px',
                                    transform: sideBarOpen ? 'translate3d(0, 0, 0)' : 'translate3d(-100%, 0, 0)',
                                    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    overflow: 'hidden', // Prevent container scrolling
                                    willChange: 'transform',
                                    backfaceVisibility: 'hidden',
                                    WebkitBackfaceVisibility: 'hidden',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    boxShadow: sideBarOpen ? '0 0 20px rgba(0,0,0,0.1)' : 'none',
                                }}
                            >
                                {sidebarContent}
                            </Box>
                        )}

                        {/* Main content area - this is where page content updates */}
                        <Box
                            ref={contentRef}
                            sx={{
                                pb: `${bottomNavHeight}px`,
                                display: 'flex',
                                flex: 1,
                                transition: 'margin 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                marginLeft: { 
                                    xs: 0, 
                                    md: sideBarOpen ? '280px' : '0' 
                                },
                                width: { 
                                    xs: '100%', 
                                    md: sideBarOpen ? 'calc(100% - 280px)' : '100%' 
                                },
                                minWidth: 0,
                                maxWidth: '100vw',
                                willChange: 'margin, width',
                                flexDirection: 'column',
                                height: '100vh',
                                overflow: 'hidden', // Changed from 'auto' to 'hidden'
                                position: 'relative',
                            }}
                        >
                        

                            {/* Persistent Header */}
                            <Box
                                sx={{
                                    position: 'sticky',
                                    top: 0,
                                    zIndex: 5,
                                
                                }}
                            >
                                {headerContent}
                                {breadcrumbContent}
                            </Box>
                            
                            {/* Dynamic page content with smooth transitions */}
                            <Box
                                ref={mainContentRef}
                                component="section"
                                sx={{
                                    flex: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    overflow: 'auto',
                                    position: 'relative',
                                    WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
                                    scrollbarWidth: 'thin',
                                    '&::-webkit-scrollbar': {
                                        width: '6px',
                                    },
                                    '&::-webkit-scrollbar-thumb': {
                                        backgroundColor: theme => theme.palette.mode === 'dark' 
                                            ? 'rgba(255,255,255,0.2)' 
                                            : 'rgba(0,0,0,0.2)',
                                        borderRadius: '3px',
                                    },
                                
                                }}
                                role="main"
                                aria-label="Main content"
                            >
                                <ScrollShadow>
                                    <motion.div
                                        key={url} // Re-trigger animation on route change
                                        initial={{ opacity: 0, y: 10, scale: 0.99 }}
                                        animate={{ 
                                            opacity: 1, 
                                            y: 0, 
                                            scale: 1,
                                            transition: {
                                                duration: 0.4,
                                                ease: "easeOut"
                                            }
                                        }}
                                        exit={{ 
                                            opacity: 0, 
                                            y: -5, 
                                            scale: 1.01,
                                            transition: {
                                                duration: 0.2,
                                                ease: "easeIn"
                                            }
                                        }}
                                        style={{
                                            width: '100%',
                                            maxWidth: '100%',
                                            margin: '0 auto'
                                        }}
                                    >
                                        {children}
                                    </motion.div>
                                </ScrollShadow>
                            </Box>
                            
                           
                            
                            {/* Persistent Bottom Navigation */}
                            {bottomNavContent}
                        </Box>
                    </Box>
                </main>
            </HeroUIProvider>
        </ThemeProvider>
    );
});

// Add display name for debugging
App.displayName = 'App';

// Export memoized layout component for layout performance
export default App;