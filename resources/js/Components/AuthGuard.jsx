import React, { useEffect, useState, useRef } from 'react';
import { router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Spinner } from '@heroui/react';

/**
 * Global Authentication Guard
 * 
 * This component ensures that no authenticated content is rendered
 * when the user is not authenticated or session has expired.
 * It provides a seamless loading experience while checking auth status.
 */
const AuthGuard = ({ children, auth, url }) => {
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const hasInitialized = useRef(false);

    // List of routes that don't require authentication
    const publicRoutes = [
        '/login',
        '/register', 
        '/forgot-password',
        '/reset-password',
        '/verify-email'
    ];

    // Check if current route is public
    const isPublicRoute = publicRoutes.some(route => 
        url === route || url.startsWith(route + '/')
    );

    useEffect(() => {
        const checkAuthStatus = async () => {
            try {
                // If it's a public route, skip auth check
                if (isPublicRoute) {
                    setIsAuthenticated(true);
                    setIsCheckingAuth(false);
                    hasInitialized.current = true;
                    return;
                }

                // If already initialized and user is authenticated, skip re-check for route changes
                if (hasInitialized.current && auth?.isAuthenticated && auth?.user?.id) {
                    setIsAuthenticated(true);
                    setIsCheckingAuth(false);
                    return;
                }

                // Only do full auth check on initial load or when auth state changes
                if (!hasInitialized.current || !auth?.user?.id) {
                    // Check server-provided auth status first
                    if (auth?.isAuthenticated && auth?.sessionValid && auth?.user?.id) {
                        setIsAuthenticated(true);
                        setIsCheckingAuth(false);
                        hasInitialized.current = true;
                        
                        // Optional background session check for security (non-blocking)
                        setTimeout(async () => {
                            try {
                                const response = await fetch('/session-check', {
                                    method: 'GET',
                                    headers: {
                                        'X-Requested-With': 'XMLHttpRequest',
                                        'Accept': 'application/json',
                                    },
                                    credentials: 'same-origin'
                                });

                                if (response.ok) {
                                    const data = await response.json();
                                    if (!data.authenticated) {
                                        router.visit('/login', {
                                            method: 'get',
                                            preserveState: false,
                                            preserveScroll: false,
                                            replace: true
                                        });
                                    }
                                }
                            } catch (error) {
                                console.warn('Background session check failed:', error);
                            }
                        }, 100);
                        
                        return;
                    }

                    // If no valid auth data, do immediate session check
                    const response = await fetch('/session-check', {
                        method: 'GET',
                        headers: {
                            'X-Requested-With': 'XMLHttpRequest',
                            'Accept': 'application/json',
                        },
                        credentials: 'same-origin'
                    });

                    if (response.ok) {
                        const data = await response.json();
                        if (data.authenticated) {
                            setIsAuthenticated(true);
                            hasInitialized.current = true;
                        } else {
                            router.visit('/login', {
                                method: 'get',
                                preserveState: false,
                                preserveScroll: false,
                                replace: true
                            });
                            return;
                        }
                    } else {
                        router.visit('/login', {
                            method: 'get', 
                            preserveState: false,
                            preserveScroll: false,
                            replace: true
                        });
                        return;
                    }
                }
            } catch (error) {
                console.error('Auth check failed:', error);
                router.visit('/login', {
                    method: 'get',
                    preserveState: false,
                    preserveScroll: false, 
                    replace: true
                });
                return;
            }

            setIsCheckingAuth(false);
        };

        checkAuthStatus();
    }, [auth?.user?.id, auth?.isAuthenticated, auth?.sessionValid, isPublicRoute]); // Removed 'url' dependency

    // Show loading screen only on initial auth check, not on route changes
    if (isCheckingAuth && !isPublicRoute && !hasInitialized.current) {
        return (
            <div className="fixed inset-0 z-9999 flex items-center justify-center bg-linear-to-br from-slate-900 via-blue-900 to-slate-900">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="flex flex-col items-center space-y-6 text-center"
                >
                    {/* Logo or App Name */}
                    <motion.div
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                        className="text-3xl font-bold text-white mb-4"
                    >
                        aeos365
                    </motion.div>

                    {/* Spinner */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3, duration: 0.4 }}
                    >
                        <Spinner 
                            size="lg" 
                            color="primary"
                            className="w-12 h-12"
                        />
                    </motion.div>

                    {/* Loading text */}
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.6 }}
                        className="text-white/80 text-lg"
                    >
                        Verifying session...
                    </motion.div>

                    {/* Progress indicator */}
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ delay: 0.5, duration: 1.5, ease: "easeInOut" }}
                        className="h-1 bg-blue-500 rounded-full"
                        style={{ maxWidth: "200px" }}
                    />
                </motion.div>
            </div>
        );
    }

    // If authenticated or public route, render children
    if (isAuthenticated || isPublicRoute) {
        return children;
    }

    // Fallback loading state (should rarely be seen)
    return (
        <div className="fixed inset-0 z-9999 flex items-center justify-center bg-slate-900">
            <Spinner size="lg" color="primary" />
        </div>
    );
};

export default AuthGuard;
