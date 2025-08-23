import { usePage, router } from '@inertiajs/react';
import { useEffect, useCallback } from 'react';
import axios from 'axios';

export function useAuth() {
    const { auth } = usePage().props;
    
    const isAuthenticated = useCallback(() => {
        return !!(auth?.user && auth?.authenticated);
    }, [auth]);
    
    const user = auth?.user || null;
    const roles = auth?.roles || [];
    const permissions = auth?.permissions || [];
    
    const logout = useCallback(() => {
        router.post('/logout', {}, {
            onSuccess: () => {
                window.location.href = '/login';
            }
        });
    }, []);
    
    const checkPermission = useCallback((permission) => {
        return permissions.includes(permission);
    }, [permissions]);
    
    const hasRole = useCallback((role) => {
        return roles.includes(role);
    }, [roles]);
    
    // Validate session periodically
    const validateSession = useCallback(async () => {
        if (!isAuthenticated()) return false;
        
        try {
            const response = await axios.get('/session-check', {
                timeout: 5000,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            return response.data.authenticated;
        } catch (error) {
            console.error('Session validation failed:', error);
            return false;
        }
    }, [isAuthenticated]);
    
    return {
        user,
        roles,
        permissions,
        isAuthenticated,
        logout,
        checkPermission,
        hasRole,
        validateSession
    };
}
