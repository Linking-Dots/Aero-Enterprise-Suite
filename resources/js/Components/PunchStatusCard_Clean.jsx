import React, { useState, useEffect } from 'react';
import {
    Card,
    CardBody,
    CardHeader,
    Button,
    Spinner,
    Chip,
    Divider,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Avatar,
    Tooltip,
    Badge,
    Progress
} from '@heroui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '@/Components/GlassCard';
import {
    Clock,
    MapPin,
    Wifi,
    WifiOff,
    MapPinOff,
    QrCode,
    CheckCircle,
    AlertCircle,
    Play,
    Square,
    Calendar,
    CalendarDays,
    User,
    Settings,
    RotateCcw,
    Timer,
    Briefcase,
    TrendingUp,
    ChevronDown,
    ChevronUp,
    Shield,
    Signal,
    Navigation,
    Globe,
    X
} from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { usePage } from '@inertiajs/react';
import Card from './Card';
import ProfileAvatar from './ProfileAvatar';


const PunchStatusCard = () => {
    const { auth } = usePage().props;
    const user = auth.user;

    // State management
    const [currentStatus, setCurrentStatus] = useState(null);
    const [loading, setLoading] = useState(false);
    const [todayPunches, setTodayPunches] = useState([]);
    const [totalWorkTime, setTotalWorkTime] = useState('00:00:00');
    const [realtimeWorkTime, setRealtimeWorkTime] = useState('00:00:00');
    const [userOnLeave, setUserOnLeave] = useState(null);
    const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [expandedSections, setExpandedSections] = useState({
        punches: false,
        summary: false
    });
    const [connectionStatus, setConnectionStatus] = useState({
        network: navigator.onLine,
        location: false
    });
    const [sessionInfo, setSessionInfo] = useState({
        punchInTime: null,
        location: null,
        sessionId: null
    });

    // Time update effect - Realtime clock and work time
    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            setCurrentTime(now);
            calculateRealtimeWorkTime(now);
        }, 1000);

        return () => clearInterval(timer);
    }, [todayPunches, currentStatus]);

    // Window focus and network status monitoring
    useEffect(() => {
        const handleFocus = () => {
            fetchPunchStatus();
            checkLocationConnectionStatus();
        };

        const handleOnline = () => {
            setConnectionStatus(prev => ({ ...prev, network: true }));
        };

        const handleOffline = () => {
            setConnectionStatus(prev => ({ ...prev, network: false }));
        };

        window.addEventListener('focus', handleFocus);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Initial data fetch
        fetchPunchStatus();
        checkLocationConnectionStatus();

        return () => {
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const calculateRealtimeWorkTime = (currentTime) => {
        if (!todayPunches.length) {
            setRealtimeWorkTime('00:00:00');
            return;
        }

        let totalMilliseconds = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        todayPunches.forEach(punch => {
            const punchInTime = new Date(punch.punchin_time || punch.punch_in_time || punch.time_in);
            let punchOutTime = punch.punchout_time || punch.punch_out_time || punch.time_out;

            if (punchInTime >= today) {
                if (punchOutTime) {
                    punchOutTime = new Date(punchOutTime);
                    totalMilliseconds += punchOutTime - punchInTime;
                } else if (currentStatus === 'punched_in') {
                    totalMilliseconds += currentTime - punchInTime;
                }
            }
        });

        const totalSeconds = Math.floor(totalMilliseconds / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        setRealtimeWorkTime(
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
    };

    const fetchPunchStatus = async () => {
        try {
            const response = await axios.get('/api/punch-status');
            const data = response.data;

            setCurrentStatus(data.current_status);
            setTodayPunches(data.today_punches || []);
            setTotalWorkTime(data.total_work_time || '00:00:00');
            setUserOnLeave(data.user_on_leave);

            if (data.current_status === 'punched_in' && data.session_info) {
                setSessionInfo({
                    punchInTime: data.session_info.punch_in_time,
                    location: data.session_info.location,
                    sessionId: data.session_info.session_id
                });
            }
        } catch (error) {
            console.error('Error fetching punch status:', error);
            toast.error('Unable to fetch punch status. Please refresh the page.');
        }
    };

    const checkLocationConnectionStatus = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                () => {
                    setConnectionStatus(prev => ({ ...prev, location: true }));
                },
                () => {
                    setConnectionStatus(prev => ({ ...prev, location: false }));
                },
                { timeout: 5000, enableHighAccuracy: false }
            );
        } else {
            setConnectionStatus(prev => ({ ...prev, location: false }));
        }
    };

    const getLocationOptions = (highAccuracy = true, timeout = 15000) => ({
        enableHighAccuracy,
        timeout,
        maximumAge: highAccuracy ? 0 : 60000
    });

    const getCurrentLocation = () => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported by this browser.'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    });
                },
                (error) => {
                    let message = 'Location access failed. ';
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            message += 'Please allow location access when prompted.';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            message += 'Location information unavailable.';
                            break;
                        case error.TIMEOUT:
                            message += 'Location request timed out.';
                            break;
                        default:
                            message += 'Unknown error occurred.';
                            break;
                    }
                    reject(new Error(message));
                },
                getLocationOptions(true, 15000)
            );
        });
    };

    const handlePunch = async () => {
        if (loading) return;

        try {
            setLoading(true);

            if (!connectionStatus.network) {
                toast.error('No internet connection. Please check your network and try again.');
                return;
            }

            let location = null;
            try {
                location = await getCurrentLocation();
                setConnectionStatus(prev => ({ ...prev, location: true }));
            } catch (locationError) {
                console.warn('Location access failed:', locationError);
                setConnectionStatus(prev => ({ ...prev, location: false }));
                
                const allowProceed = window.confirm(
                    `Location access failed: ${locationError.message}\n\nDo you want to proceed without location data?`
                );
                
                if (!allowProceed) {
                    return;
                }
            }

            const endpoint = currentStatus === 'punched_in' ? '/api/punch-out' : '/api/punch-in';
            const response = await axios.post(endpoint, {
                location: location ? {
                    latitude: location.latitude,
                    longitude: location.longitude,
                    accuracy: location.accuracy
                } : null,
                timestamp: new Date().toISOString()
            });

            if (response.data.success) {
                toast.success(response.data.message || 
                    (currentStatus === 'punched_in' ? 'Punched out successfully!' : 'Punched in successfully!'));
                
                // Update local state immediately for better UX
                setCurrentStatus(currentStatus === 'punched_in' ? 'punched_out' : 'punched_in');
                
                // Fetch fresh data to sync with server
                setTimeout(() => {
                    fetchPunchStatus();
                }, 1000);
            } else {
                toast.error(response.data.message || 'Punch operation failed. Please try again.');
            }
        } catch (error) {
            console.error('Punch operation error:', error);
            
            if (error.response) {
                const serverMessage = error.response.data?.message || 'Server error occurred.';
                toast.error(`Punch failed: ${serverMessage}`);
            } else if (error.request) {
                toast.error('Network error. Please check your connection and try again.');
            } else {
                toast.error('An unexpected error occurred. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    // Helper functions
    const getStatusColor = () => {
        if (currentStatus === 'punched_in') return 'success';
        if (currentStatus === 'punched_out') return 'default';
        return 'warning';
    };

    const getStatusText = () => {
        if (currentStatus === 'punched_in') return 'Active';
        if (currentStatus === 'punched_out') return 'Off Duty';
        return 'Unknown';
    };

    const getActionButtonText = () => {
        if (loading) return 'Processing...';
        if (userOnLeave) return 'On Leave';
        return currentStatus === 'punched_in' ? 'Punch Out' : 'Punch In';
    };

    const displayTime = (timeString) => {
        if (!timeString) return 'N/A';
        try {
            return new Date(timeString).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        } catch {
            return 'Invalid Time';
        }
    };

    const formatLocation = (location) => {
        if (!location) return 'No location';
        if (typeof location === 'string') return location.length > 30 ? location.substring(0, 30) : location;
        if (location.latitude && location.longitude) {
            return `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
        }
        return 'Unknown location';
    };

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    return (
        <div className="w-full h-full">
            {/* Main Punch Status Card */}
            <GlassCard>
                <div className="p-6 space-y-6">
                    {/* Header Section */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Badge
                                overlap="circular"
                                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                badgeContent={
                                    <div
                                        className="w-3 h-3 rounded-full border-2 border-background"
                                        style={{
                                            backgroundColor: getStatusColor() === 'success' ? '#22c55e' : 
                                                           getStatusColor() === 'warning' ? '#f59e0b' : '#9ca3af',
                                        }}
                                    />
                                }
                            >
                                <ProfileAvatar
                                    src={user?.profile_image_url || user?.profile_image}
                                    name={user?.name}
                                    className="w-14 h-14"
                                />
                            </Badge>

                            <div className="flex-1">
                                <h2 className="text-lg font-semibold text-foreground leading-tight">
                                    {user?.name}
                                </h2>
                                <p className="text-sm text-default-500">
                                    ID: {user?.employee_id || user?.id}
                                </p>
                            </div>
                        </div>

                        <div className="text-right">
                            <div className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                                {currentTime.toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: true
                                })}
                            </div>
                            <p className="text-sm text-default-500">
                                {currentTime.toLocaleDateString('en-US', { 
                                    weekday: 'short', 
                                    month: 'short',
                                    day: 'numeric' 
                                })}
                            </p>
                        </div>
                    </div>

                    {/* Status Section */}
                    <div className="text-center space-y-4">
                        <Chip
                            size="lg"
                            variant="flat"
                            color={getStatusColor()}
                            className="px-6 py-2 font-semibold uppercase tracking-wide"
                            startContent={currentStatus === 'punched_in' ? <Play size={18} /> : <Square size={18} />}
                        >
                            {getStatusText()}
                        </Chip>
                    </div>

                    {/* Work Stats Section */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 text-center bg-primary/5 border border-primary/10 rounded-xl">
                            <Timer className="text-primary w-6 h-6 mx-auto mb-2" />
                            <h3 className="text-primary font-bold text-xl font-mono tracking-wide">
                                {realtimeWorkTime}
                            </h3>
                            <p className="text-sm text-default-600 mt-1">
                                Hours Today
                            </p>
                        </div>
                        <div className="p-4 text-center bg-secondary/5 border border-secondary/10 rounded-xl">
                            <Briefcase className="text-secondary w-6 h-6 mx-auto mb-2" />
                            <h3 className="text-secondary font-bold text-xl">
                                {todayPunches.length}
                            </h3>
                            <p className="text-sm text-default-600 mt-1">
                                Total Punches
                            </p>
                        </div>
                    </div>

                    {/* Action Button Section */}
                    <div className="flex flex-col items-center gap-4">
                        <Button
                            className={`w-full h-14 font-bold text-lg tracking-wide transition-all duration-200 ${
                                currentStatus === 'punched_out' || !currentStatus
                                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg hover:shadow-xl'
                                    : 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg hover:shadow-xl'
                            }`}
                            isLoading={loading}
                            disabled={loading}
                            onPress={handlePunch}
                            size="lg"
                            radius="lg"
                        >
                            {currentStatus === 'punched_out' || !currentStatus ? 'Punch In' : 'Punch Out'}
                        </Button>

                        {/* Connection Status */}
                        <div className="flex items-center justify-center gap-3">
                            <Chip
                                size="sm"
                                variant="flat"
                                color={connectionStatus.network ? 'success' : 'danger'}
                                startContent={
                                    connectionStatus.network ? <Wifi size={12} /> : <WifiOff size={12} />
                                }
                                className="text-xs"
                            >
                                {connectionStatus.network ? 'Online' : 'Offline'}
                            </Chip>
                            
                            <Chip
                                size="sm"
                                variant="flat"
                                color={connectionStatus.location ? 'success' : 'warning'}
                                startContent={
                                    connectionStatus.location ? <MapPin size={12} /> : <MapPinOff size={12} />
                                }
                                className="text-xs"
                            >
                                {connectionStatus.location ? 'Location' : 'No Location'}
                            </Chip>
                        </div>
                    </div>
                </div>
            </GlassCard>
        </div>
    );
};

export default PunchStatusCard;
