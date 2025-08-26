import React, { useState, useEffect } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import {
    Card,
    CardBody,
    Avatar,
    Chip,
    Button,
    Progress,
    Tooltip
} from '@heroui/react';
import {
    ShieldCheckIcon,
    ShieldExclamationIcon,
    DevicePhoneMobileIcon,
    MapPinIcon,
    ClockIcon,
    UserIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
    XCircleIcon,
    InformationCircleIcon,
    CogIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { useMediaQuery } from '@/Hooks/useMediaQuery';
import App from '@/Layouts/App.jsx';
import GlassCard from "@/Components/GlassCard.jsx";

const SecurityDashboard = () => {
    const isMobile = useMediaQuery('(max-width: 768px)');
    const { auth } = usePage().props;
    const [securityScore, setSecurityScore] = useState(85);
    const [activeSessions, setActiveSessions] = useState(2);
    const [recentEvents, setRecentEvents] = useState([]);
    const [securityFeatures, setSecurityFeatures] = useState([]);

    useEffect(() => {
        // Initialize security data
        setSecurityFeatures([
            { icon: ShieldCheckIcon, label: 'Two-Factor Authentication', status: 'enabled', color: 'success' },
            { icon: DevicePhoneMobileIcon, label: 'Device Tracking', status: 'active', color: 'primary' },
            { icon: MapPinIcon, label: 'Location Monitoring', status: 'active', color: 'warning' },
            { icon: ClockIcon, label: 'Session Management', status: 'active', color: 'secondary' }
        ]);

        setRecentEvents([
            { type: 'login_success', time: '2 minutes ago', status: 'success' },
            { type: 'session_created', time: '5 minutes ago', status: 'info' },
            { type: 'device_recognized', time: '1 hour ago', status: 'success' }
        ]);
    }, []);

    const getStatusIcon = (status) => {
        const iconClass = "w-5 h-5";
        switch (status) {
            case 'success': return <CheckCircleIcon className={`${iconClass} text-success`} />;
            case 'warning': return <ExclamationTriangleIcon className={`${iconClass} text-warning`} />;
            case 'error': return <XCircleIcon className={`${iconClass} text-danger`} />;
            default: return <InformationCircleIcon className={`${iconClass} text-primary`} />;
        }
    };

    const getEventDescription = (type) => {
        const descriptions = {
            'login_success': 'Successful login from new device',
            'session_created': 'New session established',
            'device_recognized': 'Device fingerprint verified'
        };
        return descriptions[type] || type;
    };

    return (
        <App>
            <Head title="Security Dashboard - Enhanced Protection" />
            
            <div className="p-6">
                {/* Header */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
                                🛡️ Security Dashboard
                            </h1>
                            <p className="text-default-600">
                                Monitor and manage your account security settings
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="bordered"
                                startContent={<CogIcon className="w-4 h-4" />}
                                onPress={() => router.visit('/settings/security')}
                            >
                                Settings
                            </Button>
                            <Button
                                variant="bordered"
                                startContent={<ArrowPathIcon className="w-4 h-4" />}
                                onPress={() => {
                                    // Instead of full reload, refresh the page data
                                    router.reload({ only: ['stats', 'logs', 'alerts'] });
                                }}
                            >
                                Refresh
                            </Button>
                        </div>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Security Score */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full"
                    >
                        <GlassCard className="h-full">
                            <CardBody>
                                <div className="flex items-center gap-4">
                                    <Avatar
                                        className="w-14 h-14 bg-success/10 text-success"
                                        icon={<ShieldCheckIcon className="w-7 h-7" />}
                                    />
                                    <div className="flex-1">
                                        <h3 className="text-3xl font-bold text-success">
                                            {securityScore}%
                                        </h3>
                                        <p className="text-default-600 text-sm">
                                            Security Score
                                        </p>
                                        <Progress 
                                            value={securityScore} 
                                            color="success"
                                            className="mt-2"
                                            size="lg"
                                        />
                                    </div>
                                </div>
                            </CardBody>
                        </GlassCard>
                    </motion.div>

                    {/* Active Sessions */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="w-full"
                    >
                        <GlassCard className="h-full">
                            <CardBody>
                                <div className="flex items-center gap-4">
                                    <Avatar
                                        className="w-14 h-14 bg-primary/10 text-primary"
                                        icon={<DevicePhoneMobileIcon className="w-7 h-7" />}
                                    />
                                    <div>
                                        <h3 className="text-3xl font-bold text-primary">
                                            {activeSessions}
                                        </h3>
                                        <p className="text-default-600 text-sm mb-2">
                                            Active Sessions
                                        </p>
                                        <Chip size="sm" color="success" variant="bordered">All Secure</Chip>
                                    </div>
                                </div>
                            </CardBody>
                        </GlassCard>
                    </motion.div>

                    {/* User Info */}
                    <Grid item xs={12} md={4}>
                        <GlassCard>
                            <CardContent>
                                <Stack direction="row" alignItems="center" spacing={2}>
                                    <Avatar sx={{ 
                                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                                        color: 'primary.main',
                                        width: 56,
                                        height: 56
                                    }}>
                                        <VerifiedUser sx={{ fontSize: 28 }} />
                                    </Avatar>
                                    <div>
                                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                            {auth.user?.name || 'User'}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {auth.user?.email || 'email@example.com'}
                                        </Typography>
                                        <Chip size="small" label="Verified" color="success" variant="outlined" />
                                    </div>
                                </Stack>
                            </CardContent>
                        </GlassCard>
                    </Grid>

                    {/* Security Features */}
                    <Grid item xs={12} md={8}>
                        <GlassCard>
                            <CardContent>
                                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                                    🔒 Security Features
                                </Typography>
                                <Grid container spacing={2}>
                                    {securityFeatures.map((feature, index) => (
                                        <Grid item xs={12} sm={6} key={index}>
                                            <div className="p-2 border border-primary/20 rounded-lg bg-primary/5">
                                                <Stack direction="row" alignItems="center" spacing={2}>
                                                    <feature.icon color={feature.color} />
                                                    <div>
                                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                            {feature.label}
                                                        </Typography>
                                                        <Chip 
                                                            size="small" 
                                                            label={feature.status} 
                                                            color={feature.color} 
                                                            variant="outlined" 
                                                        />
                                                    </div>
                                                </Stack>
                                            </div>
                                        </Grid>
                                    ))}
                                </Grid>
                            </CardContent>
                        </GlassCard>
                    </Grid>

                    {/* Recent Security Events */}
                    <Grid item xs={12} md={4}>
                        <GlassCard>
                            <CardContent>
                                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                                    📊 Recent Events
                                </Typography>
                                <Stack spacing={2}>
                                    {recentEvents.map((event, index) => (
                                        <div key={index} className="p-2 border border-divider/10 rounded-lg bg-background/50">
                                            <Stack direction="row" alignItems="center" spacing={2}>
                                                {getStatusIcon(event.status)}
                                                <div className="flex-1">
                                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                        {getEventDescription(event.type)}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {event.time}
                                                    </Typography>
                                                </Box>
                                            </Stack>
                                        </Box>
                                    ))}
                                </Stack>
                            </CardContent>
                        </GlassCard>
                    </Grid>

                    {/* Quick Actions */}
                    <Grid item xs={12}>
                        <Alert 
                            severity="info" 
                            sx={{ 
                                bgcolor: alpha(theme.palette.info.main, 0.1),
                                border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
                            }}
                        >
                            <Typography variant="body2">
                                <strong>Enhanced Security Active:</strong> Your account is protected with enterprise-grade security features including 
                                device fingerprinting, session monitoring, and real-time threat detection.
                            </Typography>
                        </Alert>
                    </Grid>
                </div>
            </div>
        </App>
    );
};

export default SecurityDashboard;
