import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    ShieldCheckIcon
} from '@heroicons/react/24/outline';
import GlassCard from '@/Components/GlassCard';


import logo from '../../../public/assets/images/logo.png';

// Custom theme object for styling
const theme = {
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    spacing: (factor) => `${factor * 0.5}rem`,
    palette: {
        text: {
            primary: 'hsl(var(--foreground))',
            secondary: 'hsl(var(--foreground) / 0.7)'
        }
    }
};

const AuthLayout = ({ children, title, subtitle }) => {
    const [isDesktop, setIsDesktop] = useState(false);

    // Check if screen is desktop for showing floating elements
    useEffect(() => {
        const checkScreenSize = () => {
            setIsDesktop(window.innerWidth > 768);
        };
        
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center p-1 sm:p-2 relative overflow-hidden">
            {/* Floating Background Elements - Responsive positioning */}
            {isDesktop && (
                <>
                    <motion.div
                        className="absolute w-12 h-12 rounded-full"
                        style={{
                            top: '10%',
                            left: '8%',
                            background: `linear-gradient(135deg, ${theme.primary}15, ${theme.secondary}15)`,
                            backdropFilter: 'blur(8px)'
                        }}
                        animate={{ 
                            y: [-10, 10, -10],
                            rotate: [0, 180, 360] 
                        }}
                        transition={{ 
                            duration: 12, 
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />
                    <motion.div
                        className="absolute w-8 h-8 rounded-full"
                        style={{
                            bottom: '15%',
                            right: '10%',
                            background: `linear-gradient(135deg, ${theme.secondary}20, ${theme.primary}20)`,
                            backdropFilter: 'blur(6px)'
                        }}
                        animate={{ 
                            x: [-8, 8, -8],
                            scale: [1, 1.1, 1]
                        }}
                        transition={{ 
                            duration: 8, 
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: 2
                        }}
                    />
                </>
            )}

            <div className="w-full max-w-md px-1 sm:px-2">
                <div className="flex flex-col items-center justify-center min-h-screen sm:min-h-[80vh] py-2 sm:py-4">
                    {/* Auth Form Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="w-full max-w-[420px]"
                    >
                        <GlassCard className="p-3 sm:p-4 md:p-6 relative overflow-visible w-full rounded-2xl sm:rounded-3xl">
                            {/* Logo at top of form card */}
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.3 }}
                                className="text-center mb-3 sm:mb-4"
                            >
                                <div className="flex justify-center mb-2 sm:mb-3">
                                    <motion.div
                                        className="inline-flex items-center justify-center rounded-xl"
                                        whileHover={{ scale: 1.05 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    >
                                        <img 
                                            src={logo} 
                                            alt="Logo" 
                                            className="w-40 h-40 object-contain"
                                            onError={(e) => {
                                                // Fallback to text logo if image fails to load
                                                e.target.style.display = 'none';
                                                e.target.nextSibling.style.display = 'block';
                                            }}
                                        />
                                    </motion.div>
                                </div>
                            </motion.div>

                            {/* Header */}
                            <div className="mb-3 sm:mb-4 text-center">
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: 0.4 }}
                                >
                                    <h1
                                        className="text-2xl sm:text-3xl md:text-4xl font-semibold mb-1 sm:mb-2"
                                        style={{
                                            background: `linear-gradient(135deg, ${theme.palette.text.primary}, ${theme.primary})`,
                                            backgroundClip: 'text',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                        }}
                                    >
                                        {title}
                                    </h1>
                                    {subtitle && (
                                        <p className="text-foreground-600 text-sm sm:text-base leading-relaxed px-1 sm:px-0">
                                            {subtitle}
                                        </p>
                                    )}
                                </motion.div>
                            </div>

                            {/* Form Content */}
                            <motion.div
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.6 }}
                            >
                                {children}
                            </motion.div>

                            {/* Decorative Elements - Minimized */}
                            <motion.div
                                className="absolute -top-1 -right-1 w-3 h-3 rounded-full opacity-40"
                                style={{
                                    background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`
                                }}
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 3, repeat: Infinity }}
                            />
                            <motion.div
                                className="absolute -bottom-1 -left-1 w-2 h-2 rounded-full opacity-40"
                                style={{
                                    background: `linear-gradient(135deg, ${theme.secondary}, ${theme.primary})`
                                }}
                                animate={{ scale: [1, 1.3, 1] }}
                                transition={{ duration: 4, repeat: Infinity, delay: 1.5 }}
                            />
                        </GlassCard>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;
