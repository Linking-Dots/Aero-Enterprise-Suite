import { useAuth } from '@/Hooks/useAuth';
import { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { Card as HeroCard } from "@heroui/react";
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function AuthenticatedWrapper({ children, fallback = null }) {
    const { isAuthenticated, validateSession } = useAuth();
    const [sessionValid, setSessionValid] = useState(false);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            if (!isAuthenticated()) {
                setSessionValid(false);
                setChecking(false);
                return;
            }

            try {
                const valid = await validateSession();
                setSessionValid(valid);
            } catch (error) {
                console.error('Session validation error:', error);
                setSessionValid(false);
            } finally {
                setChecking(false);
            }
        };

        checkAuth();
    }, [isAuthenticated, validateSession]);

    if (checking) {
        return fallback || (
            <Box className="flex items-center justify-center p-4">
                <Typography variant="body2" color="text.secondary">
                    Verifying authentication...
                </Typography>
            </Box>
        );
    }

    if (!isAuthenticated() || !sessionValid) {
        return fallback || (
            <Box className="flex items-center justify-center p-4">
                <HeroCard className="p-4 bg-warning-50 border-warning-200">
                    <Box className="flex items-center gap-3">
                        <ExclamationTriangleIcon className="w-5 h-5 text-warning" />
                        <Typography color="warning" variant="body1">
                            Authentication required. Please log in.
                        </Typography>
                    </Box>
                </HeroCard>
            </Box>
        );
    }

    return children;
}
