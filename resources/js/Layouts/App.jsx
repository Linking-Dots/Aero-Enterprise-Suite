import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { usePage } from "@inertiajs/react";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Inertia } from '@inertiajs/inertia';
import { getPages } from '@/Props/pages.jsx';
import { getSettingsPages } from '@/Props/settings.jsx';
import { ScrollShadow, Divider } from "@heroui/react";
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
import AuthGuard from '@/Components/AuthGuard.jsx';
import { useMediaQuery } from '@/Hooks/useMediaQuery.js';

// Import service worker manager to trigger registration
import '@/utils/serviceWorkerManager.js';

import axios from 'axios';

/**
 * Enhanced App Layout Component following HeroUI best practices
 * Redesigned with proper modal portaling and clean layout structure
 */
const App = React.memo(({ children }) => {
    // ===== STATE MANAGEMENT =====
    const [sessionExpired, setSessionExpired] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [themeDrawerOpen, setThemeDrawerOpen] = useState(false);
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
    
    // Sidebar state with localStorage persistence for layout preference
    const [sideBarOpen, setSideBarOpen] = useState(() => {
        try {
            const stored = localStorage.getItem('sidebarOpen');
            return stored ? JSON.parse(stored) : false;
        } catch {
            return false;
        }
    });
    
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

    // ===== LAYOUT COMPONENTS & THEME =====
    // Responsive breakpoints
    const isMobile = useMediaQuery('(max-width: 768px)'); // md breakpoint

    // ===== LAYOUT TOGGLE HANDLERS (Memoized for Performance) =====
    const toggleThemeDrawer = useCallback(() => {
        setThemeDrawerOpen(prev => !prev);
    }, []);
    
    const toggleSideBar = useCallback(() => {
        setSideBarOpen(prev => {
            const newValue = !prev;
            try {
                localStorage.setItem('sidebarOpen', JSON.stringify(newValue));
                localStorage.setItem('sidebar_has_interacted', 'true');
            } catch (error) {
                console.warn('Failed to save sidebar state to localStorage:', error);
            }
            return newValue;
        });
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
        // Initialize background pattern from localStorage
        const savedBackground = localStorage.getItem('aero-hr-background');
        const backgroundPattern = savedBackground || 'pattern-glass-1'; 
        
        // Apply background pattern immediately
        document.documentElement.setAttribute('data-background', backgroundPattern);
    }, []);

    // Handle responsive sidebar behavior
    useEffect(() => {
        // Close sidebar automatically on mobile when screen becomes small
        if (isMobile && sideBarOpen) {
            // Only auto-close if user manually made it mobile (not on initial load)
            const hasInteracted = localStorage.getItem('sidebar_has_interacted');
            if (hasInteracted) {
                setSideBarOpen(false);
                try {
                    localStorage.setItem('sidebarOpen', JSON.stringify(false));
                } catch (error) {
                    console.warn('Failed to save responsive sidebar state:', error);
                }
            }
        }
    }, [isMobile]); // Only trigger when screen size changes
    
    // Session check is now handled by AuthGuard for better UX
    // This keeps the existing modal as a fallback for edge cases
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
                console.error('Background session check failed:', error);
                // Don't show modal for background check failures
                // Let AuthGuard handle auth redirects
            }
        };

        // Check every 30 seconds for background session validation
        // Reduced frequency since AuthGuard handles primary auth
        const initialTimeout = setTimeout(() => {
            checkSession();
            sessionCheckRef.current = setInterval(checkSession, 30000);
        }, 10000);

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
                sideBarOpen={sideBarOpen}
                toggleSideBar={toggleSideBar}
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
        <>
            {/* Theme Settings Drawer - Rendered outside layout to avoid z-index conflicts */}
            <ThemeSettingDrawer
                isOpen={themeDrawerOpen}
                onClose={toggleThemeDrawer}
            />
            
            <AuthGuard auth={auth} url={url}>
                {/* HeroUI Layout Container - No background to allow theme system control */}
                <div className="relative w-full h-screen overflow-hidden">
                    {/* Global Overlays and Modals - Positioned outside main layout */}
                    <UpdateNotification
                        isVisible={isUpdateAvailable}
                        onUpdate={handleUpdate}
                        onDismiss={dismissUpdate}
                        isUpdating={isUpdating}
                        version={currentVersion}
                    />
                    
                    {sessionExpired && (
                        <SessionExpiredModal setSessionExpired={setSessionExpired}/>
                    )}
                    
                    {/* Toast Notifications - Global positioning */}
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

                {/* Floating Theme Settings Button - Only show for authenticated users */}
                {currentAuth?.user && (
                    <div className="fixed bottom-8 right-8 z-50">
                        <motion.button
                            onClick={toggleThemeDrawer}
                            className="
                                flex items-center justify-center
                                w-16 h-16 
                                bg-primary text-primary-foreground
                                rounded-full shadow-xl hover:shadow-2xl
                                transition-all duration-300 ease-out
                                hover:scale-110 active:scale-95
                                border-3 border-primary-200
                                backdrop-blur-sm
                                relative
                            "
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5, duration: 0.4, type: "spring", stiffness: 260, damping: 20 }}
                        >
                            <svg 
                                className="w-6 h-6" 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                            >
                                <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth={2} 
                                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" 
                                />
                                <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth={2} 
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
                                />
                            </svg>
                        </motion.button>
                    </div>
                )}
                
                {/* Main Application Layout */}
                <div className="flex h-full overflow-hidden">
                    {/* Mobile Sidebar Overlay */}
                    <AnimatePresence>
                        {isMobile && sideBarOpen && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                onClick={toggleSideBar}
                                className="fixed inset-0 bg-black/50 z-[40] lg:hidden"
                            />
                        )}
                    </AnimatePresence>
                    
                    {/* Sidebar Container - Different behavior for desktop vs mobile */}
                    {sideBarOpen && (
                        <aside
                            className={`
                                ${isMobile 
                                    ? 'fixed top-0 left-0 h-full z-[50] w-[280px] transform transition-transform duration-300 ease-out translate-x-0' 
                                    : 'relative w-[280px] h-full'
                                }
                                border-r border-divider
                            `}
                        >
                            {sidebarContent}
                        </aside>
                    )}

                    {/* Main Content Container - Expands when sidebar is hidden */}
                    <main
                        ref={contentRef}
                        className="flex flex-1 flex-col h-full overflow-hidden"
                        style={{ 
                            paddingBottom: `${bottomNavHeight}px`
                        }}
                    >
                        {/* Header Section */}
                        <header className="sticky top-0 z-[30] border-b border-divider">
                            {headerContent}
                            <Divider />
                            {breadcrumbContent}
                        </header>
                        
                        {/* Page Content Section - No background to allow theme control */}
                        <section 
                            ref={mainContentRef}
                            className="flex-1 overflow-auto"
                            role="main"
                            aria-label="Main content"
                        >
                            <ScrollShadow 
                                className="h-full"
                                hideScrollBar={false}
                                size={40}
                            >
                                <div className="min-h-full p-4">
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={url}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ 
                                                opacity: 1, 
                                                y: 0,
                                                transition: {
                                                    duration: 0.3,
                                                    ease: "easeOut"
                                                }
                                            }}
                                            exit={{ 
                                                opacity: 0, 
                                                y: -10,
                                                transition: {
                                                    duration: 0.2,
                                                    ease: "easeIn"
                                                }
                                            }}
                                            className="w-full"
                                        >
                                            {children}
                                        </motion.div>
                                    </AnimatePresence>
                                </div>
                            </ScrollShadow>
                        </section>
                        
                        {/* Bottom Navigation */}
                        {bottomNavContent}
                    </main>
                </div>
            </div>
        </AuthGuard>
        </>
    );
});

// Add display name for debugging
App.displayName = 'App';

// Export memoized layout component for layout performance
export default App;