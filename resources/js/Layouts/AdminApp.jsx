import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { usePage } from "@inertiajs/react";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Inertia } from '@inertiajs/inertia';
import { getAdminPages, getAdminSettingsPages, getDefaultAdminPermissions } from '@/Props/admin.jsx';
import { ScrollShadow, Divider } from "@heroui/react";
import { motion, AnimatePresence } from 'framer-motion';

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

import '@/utils/serviceWorkerManager.js';
import axios from 'axios';

// ===== STATIC LAYOUT CONTEXT =====
// This context provides a stable API for header and sidebar to access layout state
// without causing re-renders when that state changes
const AdminLayoutContext = React.createContext({
  sideBarOpen: false,
  toggleSideBar: () => {},
  currentUrl: '',
  pages: [],
  auth: null,
  app: null
});

// ===== COMPLETELY STATIC HEADER WRAPPER =====
const StaticHeaderWrapper = React.memo(() => {
  const contextValue = React.useContext(AdminLayoutContext);
  const [mounted, setMounted] = useState(false);
  
  // Capture initial context values and freeze them
  const frozenContext = useRef(contextValue);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) return null;
  
  return (
    <Header
      url={frozenContext.current.currentUrl}
      pages={frozenContext.current.pages}
      toggleSideBar={frozenContext.current.toggleSideBar}
      sideBarOpen={frozenContext.current.sideBarOpen}
    />
  );
}, () => true); // Always return true to prevent ANY re-renders

StaticHeaderWrapper.displayName = 'StaticHeaderWrapper';

// ===== COMPLETELY STATIC SIDEBAR WRAPPER =====
const StaticSidebarWrapper = React.memo(() => {
  const contextValue = React.useContext(AdminLayoutContext);
  const [mounted, setMounted] = useState(false);
  
  // Capture initial context values and freeze them
  const frozenContext = useRef(contextValue);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) return null;
  
  return (
    <Sidebar
      url={frozenContext.current.currentUrl}
      pages={frozenContext.current.pages}
      toggleSideBar={frozenContext.current.toggleSideBar}
      sideBarOpen={frozenContext.current.sideBarOpen}
    />
  );
}, () => true); // Always return true to prevent ANY re-renders

StaticSidebarWrapper.displayName = 'StaticSidebarWrapper';

// ===== MEMOIZED PAGE CONTENT =====
const AdminPageContent = React.memo(({ children, url }) => (
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
));
AdminPageContent.displayName = 'AdminPageContent';

// ===== MAIN ADMIN LAYOUT =====
const AdminApp = React.memo(({ children }) => {
  // ===== CORE STATE MANAGEMENT =====
  const [sessionExpired, setSessionExpired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sideBarOpen, setSideBarOpen] = useState(() => {
    try {
      const stored = localStorage.getItem('sidebarOpen');
      return stored ? JSON.parse(stored) : false;
    } catch {
      return false;
    }
  });
  const [themeDrawerOpen, setThemeDrawerOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Get global page props
  const { auth, app, url } = usePage().props;

  // Version manager for update notifications
  const {
    currentVersion,
    isUpdateAvailable,
    isChecking,
    forceUpdate,
    dismissUpdate
  } = useVersionManager();

  // ===== STATIC REFERENCE DATA (Never Changes After Initial Calculation) =====
  // These values are calculated ONCE and then frozen to prevent any re-renders
  const staticLayoutData = useMemo(() => {
    const currentAuth = {
      user: auth?.user,
      permissions: getDefaultAdminPermissions(), // Use admin permissions
      id: auth?.user?.id,
      permissionCount: getDefaultAdminPermissions().length
    };

    const permissions = currentAuth?.permissions || [];
    const isSettingsPage = url.startsWith('/admin/settings') || url.includes('admin/settings');
    const pages = isSettingsPage 
      ? getAdminSettingsPages(permissions, currentAuth) 
      : getAdminPages(permissions, currentAuth);

    return {
      currentAuth,
      permissions,
      pages,
      app,
      url
    };
  }, []); // Empty dependency array - calculate ONLY ONCE

  // Responsive breakpoints
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Persistent refs
  const contentRef = useRef(null);
  const mainContentRef = useRef(null);
  const sessionCheckRef = useRef(null);
  const layoutInitialized = useRef(false);

  // ===== STATIC HANDLERS (Never Change Reference) =====
  const staticToggleSideBar = useCallback(() => {
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
  }, []); // Empty dependency array - stable reference

  const staticToggleThemeDrawer = useCallback(() => {
    setThemeDrawerOpen(prev => !prev);
  }, []);

  // ===== STATIC CONTEXT VALUE (Never Changes Reference) =====
  const staticContextValue = useMemo(() => ({
    sideBarOpen,
    toggleSideBar: staticToggleSideBar,
    currentUrl: staticLayoutData.url,
    pages: staticLayoutData.pages,
    auth: staticLayoutData.currentAuth,
    app: staticLayoutData.app
  }), [sideBarOpen, staticToggleSideBar, staticLayoutData]);

  // ===== LAYOUT INITIALIZATION =====
  useEffect(() => {
    if (!layoutInitialized.current) {
      layoutInitialized.current = true;
    }
  }, []);

  // ===== SESSION MANAGEMENT =====
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await axios.get('/api/auth/check', {
          timeout: 5000,
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'application/json'
          }
        });

        if (!response.data.authenticated) {
          setSessionExpired(true);
        }
      } catch (error) {
        if (error.response?.status === 401) {
          setSessionExpired(true);
        }
      }
    };

    // Check immediately and then every 5 minutes
    checkAuthStatus();
    const authInterval = setInterval(checkAuthStatus, 5 * 60 * 1000);

    return () => clearInterval(authInterval);
  }, []);

  // ===== INERTIA LOADING STATES =====
  useEffect(() => {
    const handleStart = () => setLoading(true);
    const handleFinish = () => setLoading(false);

    Inertia.on('start', handleStart);
    Inertia.on('finish', handleFinish);

    return () => {
      Inertia.off('start', handleStart);
      Inertia.off('finish', handleFinish);
    };
  }, []);

  // ===== AUTOMATIC SIDEBAR BEHAVIOR =====
  useEffect(() => {
    const hasInteracted = localStorage.getItem('sidebar_has_interacted');
    if (!hasInteracted && !isMobile) {
      setSideBarOpen(true);
      try {
        localStorage.setItem('sidebarOpen', 'true');
      } catch (error) {
        console.warn('Failed to save sidebar state:', error);
      }
    }
  }, [isMobile]);

  return (
    <AdminLayoutContext.Provider value={staticContextValue}>
      <AuthGuard>
        <div className="min-h-screen bg-background text-foreground">
          <div className="flex h-screen">
            {/* Static Sidebar */}
            <StaticSidebarWrapper />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Static Header */}
              <StaticHeaderWrapper />

              {/* Main Content */}
              <main 
                ref={mainContentRef}
                className="flex-1 overflow-y-auto bg-content1"
              >
                <div className="h-full w-full">
                  <ScrollShadow className="h-full w-full">
                    <div ref={contentRef} className="min-h-full">
                      <AdminPageContent url={staticLayoutData.url}>
                        {children}
                      </AdminPageContent>
                    </div>
                  </ScrollShadow>
                </div>
              </main>
            </div>
          </div>

          {/* Mobile Bottom Navigation */}
          {isMobile && (
            <BottomNav 
              pages={staticLayoutData.pages} 
              currentUrl={staticLayoutData.url} 
            />
          )}

          {/* Global Modals and Notifications */}
          <SessionExpiredModal 
            isOpen={sessionExpired}
            onClose={() => setSessionExpired(false)}
          />

          <ThemeSettingDrawer 
            isOpen={themeDrawerOpen}
            onClose={staticToggleThemeDrawer}
          />

          <UpdateNotification
            isVisible={isUpdateAvailable}
            currentVersion={currentVersion}
            onUpdate={forceUpdate}
            onDismiss={dismissUpdate}
            isUpdating={isUpdating}
          />

          {/* Toast Container */}
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            closeOnClick
            pauseOnHover
            draggable
            theme="colored"
            className="toast-container"
          />
        </div>
      </AuthGuard>
    </AdminLayoutContext.Provider>
  );
});

AdminApp.displayName = 'AdminApp';

export default AdminApp;