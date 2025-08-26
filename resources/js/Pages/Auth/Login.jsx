import React, { useState, useEffect, useCallback } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    EnvelopeIcon, 
    LockClosedIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
    EyeIcon,
    EyeSlashIcon,
    ShieldCheckIcon,
    CommandLineIcon,
    ComputerDesktopIcon,
    DevicePhoneMobileIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import { 
    Input, 
    Button, 
    Checkbox, 
    Card, 
    Chip, 
    Divider, 
    Tooltip
} from '@heroui/react';
import { toast } from 'react-toastify';

/**
 * Enhanced Login Page - Enterprise ERP System
 * Consistent with Header/Sidebar theming and HeroUI design language
 * 
 * @author Enterprise ERP Team  
 * @version 3.0.0 - Complete HeroUI integration with consistent theming
 */
export default function Login({ status, canResetPassword, deviceBlocked, deviceMessage, blockedDeviceInfo }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    // ===== STATE MANAGEMENT =====
    const [showAlert, setShowAlert] = useState(false);
    const [showDeviceAlert, setShowDeviceAlert] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    // ===== EFFECTS =====
    useEffect(() => {
        setIsLoaded(true);
    }, []);

    useEffect(() => {
        if (status) {
            setShowAlert(true);
            toast.success(status);
            const timer = setTimeout(() => setShowAlert(false), 8000);
            return () => clearTimeout(timer);
        }
    }, [status]);

    useEffect(() => {
        if (deviceBlocked) {
            setShowDeviceAlert(true);
            toast.error('Device access blocked');
            const timer = setTimeout(() => setShowDeviceAlert(false), 12000);
            return () => clearTimeout(timer);
        }
    }, [deviceBlocked]);

    // ===== HANDLERS =====
    const handleSubmit = useCallback((e) => {
        e.preventDefault();
        
        // Create a clean data object to avoid circular references
        const formData = {
            email: data.email,
            password: data.password,
            remember: data.remember
        };
        
        post(route('login'), formData, {
            onFinish: () => reset('password'),
            onError: (errors) => {
                if (errors && typeof errors === 'object') {
                    Object.values(errors).forEach(error => {
                        if (typeof error === 'string') {
                            toast.error(error);
                        }
                    });
                }
            }
        });
    }, [data.email, data.password, data.remember, post, reset]);

    const togglePasswordVisibility = useCallback(() => {
        setIsPasswordVisible(prev => !prev);
    }, []);

    // ===== ANIMATION VARIANTS =====
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                duration: 0.6,
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5, ease: [0.4, 0.0, 0.2, 1] }
        }
    };

    return (
        <>
            <Head title="Sign In - Enterprise ERP" />
            
            {/* Main Login Container */}
            <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
                {/* Background Effects */}
                <div className="absolute inset-0 -z-10">
                    <div 
                        className="absolute inset-0"
                        style={{
                            background: `
                                radial-gradient(circle at 20% 50%, color-mix(in srgb, var(--theme-primary, #006FEE) 10%, transparent) 0%, transparent 50%),
                                radial-gradient(circle at 80% 20%, color-mix(in srgb, var(--theme-secondary, #7C3AED) 8%, transparent) 0%, transparent 50%),
                                radial-gradient(circle at 40% 80%, color-mix(in srgb, var(--theme-primary, #006FEE) 6%, transparent) 0%, transparent 50%)
                            `
                        }}
                    />
                </div>

                {/* Floating Elements */}
                <motion.div
                    className="absolute top-20 left-20 w-20 h-20 rounded-full hidden lg:block"
                    style={{
                        background: `linear-gradient(135deg, 
                            color-mix(in srgb, var(--theme-primary, #006FEE) 15%, transparent),
                            color-mix(in srgb, var(--theme-secondary, #7C3AED) 10%, transparent)
                        )`,
                        backdropFilter: 'blur(20px)'
                    }}
                    animate={{ 
                        y: [-10, 10, -10],
                        rotate: [0, 180, 360] 
                    }}
                    transition={{ 
                        duration: 20, 
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />

                <motion.div
                    className="absolute bottom-20 right-20 w-16 h-16 rounded-full hidden lg:block"
                    style={{
                        background: `linear-gradient(135deg,
                            color-mix(in srgb, var(--theme-secondary, #7C3AED) 12%, transparent),
                            color-mix(in srgb, var(--theme-primary, #006FEE) 8%, transparent)
                        )`,
                        backdropFilter: 'blur(20px)'
                    }}
                    animate={{ 
                        x: [-8, 8, -8],
                        scale: [1, 1.1, 1]
                    }}
                    transition={{ 
                        duration: 15, 
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 5
                    }}
                />

                {/* Login Form Card */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate={isLoaded ? "visible" : "hidden"}
                    className="w-full max-w-md"
                >
                    <Card
                        className="backdrop-blur-xl border-none shadow-2xl"
                        style={{
                            background: `linear-gradient(to bottom right, 
                                color-mix(in srgb, var(--theme-content1, #FAFAFA) 95%, transparent), 
                                color-mix(in srgb, var(--theme-content2, #F4F4F5) 90%, transparent)
                            )`,
                            borderColor: 'color-mix(in srgb, var(--theme-divider, #E4E4E7) 40%, transparent)',
                            borderWidth: '1px',
                            borderStyle: 'solid',
                            borderRadius: '24px',
                            boxShadow: `
                                0 20px 40px color-mix(in srgb, var(--theme-shadow, #000000) 15%, transparent),
                                0 8px 16px color-mix(in srgb, var(--theme-shadow, #000000) 10%, transparent),
                                inset 0 1px 0 color-mix(in srgb, var(--theme-background, #FFFFFF) 40%, transparent)
                            `
                        }}
                    >
                        <div className="p-8">
                            {/* Header Section */}
                            <motion.div
                                variants={itemVariants}
                                className="text-center mb-8"
                            >
                                {/* Logo */}
                                <motion.div
                                    className="flex justify-center mb-6"
                                    whileHover={{ scale: 1.05 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                >
                                    <div 
                                        className="w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden"
                                        style={{
                                            backgroundColor: `var(--theme-primary, #006FEE)10`,
                                            borderColor: `var(--theme-primary, #006FEE)20`,
                                            border: '1px solid',
                                            boxShadow: `0 8px 24px color-mix(in srgb, var(--theme-primary, #006FEE) 30%, transparent)`
                                        }}
                                    >
                                        <img 
                                            src="/assets/images/logo.png" 
                                            alt="Enterprise ERP Logo" 
                                            className="w-12 h-12 object-contain"
                                            onError={(e) => {
                                                // Fallback to text logo if image fails to load
                                                e.target.style.display = 'none';
                                                e.target.nextSibling.style.display = 'flex';
                                            }}
                                        />
                                        <div 
                                            className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-xl absolute inset-0"
                                            style={{ 
                                                display: 'none',
                                                background: `linear-gradient(135deg, 
                                                    var(--theme-primary, #006FEE), 
                                                    color-mix(in srgb, var(--theme-primary, #006FEE) 80%, var(--theme-secondary, #7C3AED))
                                                )`
                                            }}
                                        >
                                            A
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Title */}
                                <h1 
                                    className="text-3xl font-bold mb-2"
                                    style={{ color: 'var(--theme-foreground, #11181C)' }}
                                >
                                    Welcome Back
                                </h1>
                                <p 
                                    className="text-sm"
                                    style={{ color: 'var(--theme-foreground, #11181C)70' }}
                                >
                                    Sign in to your Enterprise ERP account
                                </p>
                            </motion.div>

                            {/* Status Alerts */}
                            <AnimatePresence>
                                {status && showAlert && (
                                    <motion.div
                                        variants={itemVariants}
                                        initial="hidden"
                                        animate="visible"
                                        exit="hidden"
                                        className="mb-6"
                                    >
                                        <Card
                                            className="border-none"
                                            style={{
                                                background: 'color-mix(in srgb, #22C55E 10%, transparent)',
                                                borderColor: 'color-mix(in srgb, #22C55E 30%, transparent)',
                                                borderWidth: '1px',
                                                borderStyle: 'solid'
                                            }}
                                        >
                                            <div className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0" />
                                                    <p className="text-sm font-medium text-green-800">{status}</p>
                                                </div>
                                            </div>
                                        </Card>
                                    </motion.div>
                                )}

                                {deviceBlocked && showDeviceAlert && (
                                    <motion.div
                                        variants={itemVariants}
                                        initial="hidden"
                                        animate="visible"
                                        exit="hidden"
                                        className="mb-6"
                                    >
                                        <Card
                                            className="border-none"
                                            style={{
                                                background: 'color-mix(in srgb, #EF4444 10%, transparent)',
                                                borderColor: 'color-mix(in srgb, #EF4444 30%, transparent)',
                                                borderWidth: '1px',
                                                borderStyle: 'solid'
                                            }}
                                        >
                                            <div className="p-4">
                                                <div className="flex items-start gap-3">
                                                    <ExclamationTriangleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                                    <div className="flex-1">
                                                        <h3 className="text-sm font-semibold text-red-800 mb-1">
                                                            Device Access Blocked
                                                        </h3>
                                                        <p className="text-sm text-red-700 mb-3">
                                                            {deviceMessage || 'You can only be logged in from one device at a time.'}
                                                        </p>
                                                        {blockedDeviceInfo && (
                                                            <Card className="bg-red-50 border-red-200">
                                                                <div className="p-3">
                                                                    <p className="text-xs font-medium text-red-800 mb-2">Currently active device:</p>
                                                                    <div className="space-y-1 text-xs text-red-700">
                                                                        <div className="flex items-center gap-2">
                                                                            <ComputerDesktopIcon className="w-3 h-3" />
                                                                            <span>{blockedDeviceInfo.device_name}</span>
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            <CommandLineIcon className="w-3 h-3" />
                                                                            <span>{blockedDeviceInfo.browser} {blockedDeviceInfo.browser_version}</span>
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            <DevicePhoneMobileIcon className="w-3 h-3" />
                                                                            <span>{blockedDeviceInfo.platform}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </Card>
                                                        )}
                                                    </div>
                                                    <Button
                                                        isIconOnly
                                                        size="sm"
                                                        variant="light"
                                                        onPress={() => setShowDeviceAlert(false)}
                                                    >
                                                        <XMarkIcon className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </Card>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Login Form */}
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Email Field */}
                                <motion.div variants={itemVariants}>
                                    <Input
                                        type="email"
                                        label="Email Address"
                                        placeholder="Enter your email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        isInvalid={!!errors.email}
                                        errorMessage={errors.email}
                                        autoComplete="username"
                                        autoFocus
                                        isRequired
                                        size="lg"
                                        variant="bordered"
                                        color={errors.email ? "danger" : "primary"}
                                        startContent={
                                            <EnvelopeIcon 
                                                className="w-4 h-4"
                                                style={{ color: 'var(--theme-foreground, #11181C)60' }}
                                            />
                                        }
                                        classNames={{
                                            input: [
                                                "bg-transparent",
                                                "text-foreground",
                                                "placeholder:text-foreground/60"
                                            ],
                                            inputWrapper: [
                                                "backdrop-blur-sm",
                                                "border-divider/50",
                                                "hover:border-primary/50",
                                                "focus-within:!border-primary",
                                                "!cursor-text"
                                            ]
                                        }}
                                        style={{
                                            '--input-bg': 'color-mix(in srgb, var(--theme-content2, #F4F4F5) 50%, transparent)'
                                        }}
                                    />
                                </motion.div>

                                {/* Password Field */}
                                <motion.div variants={itemVariants}>
                                    <Input
                                        type={isPasswordVisible ? "text" : "password"}
                                        label="Password"
                                        placeholder="Enter your password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        isInvalid={!!errors.password}
                                        errorMessage={errors.password}
                                        autoComplete="current-password"
                                        isRequired
                                        size="lg"
                                        variant="bordered"
                                        color={errors.password ? "danger" : "primary"}
                                        startContent={
                                            <LockClosedIcon 
                                                className="w-4 h-4"
                                                style={{ color: 'var(--theme-foreground, #11181C)60' }}
                                            />
                                        }
                                        endContent={
                                            <Tooltip content={isPasswordVisible ? "Hide password" : "Show password"}>
                                                <Button
                                                    isIconOnly
                                                    variant="light"
                                                    size="sm"
                                                    onPress={togglePasswordVisibility}
                                                    aria-label={isPasswordVisible ? "Hide password" : "Show password"}
                                                >
                                                    {isPasswordVisible ? (
                                                        <EyeSlashIcon className="w-4 h-4 text-foreground/60" />
                                                    ) : (
                                                        <EyeIcon className="w-4 h-4 text-foreground/60" />
                                                    )}
                                                </Button>
                                            </Tooltip>
                                        }
                                        classNames={{
                                            input: [
                                                "bg-transparent",
                                                "text-foreground",
                                                "placeholder:text-foreground/60"
                                            ],
                                            inputWrapper: [
                                                "backdrop-blur-sm",
                                                "border-divider/50",
                                                "hover:border-primary/50",
                                                "focus-within:!border-primary",
                                                "!cursor-text"
                                            ]
                                        }}
                                        style={{
                                            '--input-bg': 'color-mix(in srgb, var(--theme-content2, #F4F4F5) 50%, transparent)'
                                        }}
                                    />
                                </motion.div>

                                {/* Remember Me & Forgot Password */}
                                <motion.div 
                                    variants={itemVariants}
                                    className="flex items-center justify-between"
                                >
                                    <Checkbox
                                        checked={data.remember}
                                        onChange={(checked) => setData('remember', checked)}
                                        size="sm"
                                        color="primary"
                                    >
                                        <span 
                                            className="text-sm"
                                            style={{ color: 'var(--theme-foreground, #11181C)80' }}
                                        >
                                            Remember me
                                        </span>
                                    </Checkbox>

                                    {canResetPassword && (
                                        <Link
                                            href={route('password.request')}
                                            className="text-sm font-medium transition-colors duration-200 hover:underline"
                                            style={{ color: 'var(--theme-primary, #006FEE)' }}
                                        >
                                            Forgot password?
                                        </Link>
                                    )}
                                </motion.div>

                                {/* Sign In Button */}
                                <motion.div variants={itemVariants}>
                                    <Button
                                        type="submit"
                                        color="primary"
                                        size="lg"
                                        className="w-full font-semibold"
                                        isLoading={processing}
                                        disabled={processing}
                                        style={{
                                            background: processing 
                                                ? 'var(--theme-primary, #006FEE)70' 
                                                : `linear-gradient(135deg, 
                                                    var(--theme-primary, #006FEE), 
                                                    color-mix(in srgb, var(--theme-primary, #006FEE) 90%, var(--theme-secondary, #7C3AED))
                                                  )`,
                                            boxShadow: processing 
                                                ? 'none' 
                                                : `0 8px 24px color-mix(in srgb, var(--theme-primary, #006FEE) 30%, transparent)`
                                        }}
                                    >
                                        {processing ? 'Signing in...' : 'Sign In'}
                                    </Button>
                                </motion.div>

                                <Divider className="my-6" />

                                {/* Sign Up Link */}
                                <motion.div 
                                    variants={itemVariants}
                                    className="text-center"
                                >
                                    <p 
                                        className="text-sm"
                                        style={{ color: 'var(--theme-foreground, #11181C)70' }}
                                    >
                                        Don't have an account?{' '}
                                        <Link
                                            href={route('register')}
                                            className="font-semibold transition-colors duration-200 hover:underline"
                                            style={{ color: 'var(--theme-primary, #006FEE)' }}
                                        >
                                            Sign up here
                                        </Link>
                                    </p>
                                </motion.div>

                                {/* Footer */}
                                <motion.div 
                                    variants={itemVariants}
                                    className="pt-4 border-t border-divider/50"
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <Chip
                                            size="sm"
                                            variant="flat"
                                            color="primary"
                                            startContent={<ShieldCheckIcon className="w-3 h-3" />}
                                        >
                                            Secure Login
                                        </Chip>
                                    </div>
                                    <p 
                                        className="text-xs text-center mt-3 opacity-60"
                                        style={{ color: 'var(--theme-foreground, #11181C)' }}
                                    >
                                        © 2025 Emam Hosen. All rights reserved.
                                    </p>
                                </motion.div>
                            </form>
                        </div>
                    </Card>
                </motion.div>
            </div>
        </>
    );
}
