import React, { useEffect, useState } from 'react';
import { Avatar, AvatarGroup, Skeleton, Card as HeroCard, Chip, Popover, PopoverContent, PopoverTrigger, CardHeader, CardBody, Divider } from "@heroui/react";
import { motion } from 'framer-motion';
import GlassCard from "@/Components/GlassCard.jsx";
import { usePage } from "@inertiajs/react";
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import axios from 'axios';
import {
    CalendarDaysIcon,
    ClockIcon,
    UserGroupIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon,
    CheckCircleIcon,
    XCircleIcon,
    DocumentTextIcon,
    SunIcon,
    UserIcon,
    Bars3BottomLeftIcon
} from '@heroicons/react/24/outline';

dayjs.extend(isBetween);

const UpdateSection = ({ title, items, users, icon: IconComponent, color }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedLeave, setSelectedLeave] = useState(null);

    const handleClick = (event, leave) => {
        setAnchorEl(event.currentTarget);
        setSelectedLeave(leave);
    };

    const handleClose = () => {
        setAnchorEl(null);
        setSelectedLeave(null);
    };

    const open = Boolean(anchorEl);
    const id = open ? 'leave-details-popover' : undefined;

    const getLeaveStatusIcon = (status) => {
        switch (status?.toLowerCase()) {
            case 'approved':
                return <CheckCircleIcon className="w-4 h-4 text-success" />;
            case 'rejected':
                return <XCircleIcon className="w-4 h-4 text-danger" />;
            default:
                return <ClockIcon className="w-4 h-4 text-warning" />;
        }
    };

    const getLeaveStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'approved':
                return 'success';
            case 'rejected':
                return 'danger';
            default:
                return 'warning';
        }
    };

    return (
        <GlassCard className="h-full flex flex-col">
            <CardHeader
                title={
                    <div className="flex items-center gap-3">
                        <div 
                            style={{
                                backgroundColor: `${color}20`,
                                borderRadius: '12px',
                                padding: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minWidth: '40px',
                                minHeight: '40px'
                            }}
                        >
                            <IconComponent 
                                style={{ 
                                    width: '20px', 
                                    height: '20px', 
                                    color: color,
                                    strokeWidth: 2
                                }}
                                aria-hidden="true"
                            />
                        </div>
                        <h2 className="text-base sm:text-lg md:text-xl font-semibold">
                            {title}
                        </h2>
                    </div>
                }
                className="pb-1"
            />
            <Divider />
            <div className="flex-1 overflow-auto">
                {items.map((item, index) => (
                    <React.Fragment key={index}>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: (index * 0.1), duration: 0.3 }}
                            className="flex justify-between items-center py-2"
                        >
                                <div className="flex flex-col flex-1 mr-2">
                                    <p className="text-sm sm:text-base leading-normal text-gray-900">
                                        {item.text}
                                    </p>
                                    {item.leaves && item.leaves.length > 0 && (
                                        <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                                            <UserGroupIcon className="w-3 h-3" />
                                            {item.leaves.length} employee{item.leaves.length > 1 ? 's' : ''}
                                        </p>
                                    )}
                                </div>
                                {item.leaves && (
                                    (() => {
                                        const leaves = item.leaves.filter((leave) => leave.leave_type === item.type);
                                        return leaves.length > 0 && (
                                            <div className="flex gap-1 flex-shrink-0">
                                                <AvatarGroup 
                                                    max={4} 
                                                    isBordered
                                                    size="sm"
                                                >
                                                    {leaves.map((leave, idx) => {
                                                        const user = users.find((user) => String(user.id) === String(leave.user_id));
                                                        return (
                                                            user && (
                                                                <Avatar
                                                                    key={idx}
                                                                    src={user.profile_image_url}
                                                                    name={`${user.name} - on leave`}
                                                                    onClick={(e) => handleClick(e, leave)}
                                                                    className="cursor-pointer hover:scale-110 transition-transform"
                                                                    fallback={<UserIcon className="w-4 h-4" />}
                                                                />
                                                            )
                                                        );
                                                    })}
                                                </AvatarGroup>
                                            </div>
                                        );
                                    })()
                                )}
                        </motion.div>
                        {index < items.length - 1 && <Divider />}
                    </React.Fragment>
                ))}
            </div>

            <Popover
                id={id}
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                PaperProps={{
                    sx: {
                        backdropFilter: 'blur(16px) saturate(200%)',
                        background: theme.glassCard?.background || 'rgba(255, 255, 255, 0.9)',
                        border: theme.glassCard?.border || '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: 2,
                        boxShadow: theme.glassCard?.boxShadow || '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
                        padding: 2,
                        minWidth: '300px'
                    },
                }}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
                role="dialog"
                aria-labelledby="leave-details-title"
                aria-describedby="leave-details-content"
            >
                {selectedLeave && (
                    <section aria-labelledby="leave-details-title">
                        <h3 
                            id="leave-details-title"
                            className="text-lg font-semibold flex items-center gap-2 mb-3"
                        >
                            <DocumentTextIcon className="w-5 h-5 text-primary" />
                            Leave Details
                        </h3>
                        <div id="leave-details-content" className="space-y-2">
                            <div className="flex items-start gap-2">
                                <UserIcon className="w-4 h-4 text-default-500 mt-0.5 shrink-0" />
                                <div>
                                    <span className="text-xs text-gray-600">Employee:</span>
                                    <div className="text-sm font-medium">
                                        {users.find((user) => String(user.id) === String(selectedLeave.user_id))?.name || 'Unknown'}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-start gap-2">
                                <CalendarDaysIcon className="w-4 h-4 text-default-500 mt-0.5 shrink-0" />
                                <div>
                                    <span className="text-xs text-gray-600">Duration:</span>
                                    <div className="text-sm font-medium">
                                        {selectedLeave.from_date !== selectedLeave.to_date ?
                                            `${new Date(selectedLeave.from_date).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })} - ${new Date(selectedLeave.to_date).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}` :
                                            new Date(selectedLeave.from_date).toLocaleDateString('en-US', {
                                                month: 'long',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })
                                        }
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-start gap-2">
                                <DocumentTextIcon className="w-4 h-4 text-default-500 mt-0.5 shrink-0" />
                                <div>
                                    <span className="text-xs text-gray-600">Reason:</span>
                                    <div className="text-sm font-medium">
                                        {selectedLeave.reason || 'No reason provided'}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {getLeaveStatusIcon(selectedLeave.status)}
                                <div>
                                    <span className="text-xs text-gray-600">Status:</span>
                                    <Chip 
                                        label={selectedLeave.status || 'Pending'} 
                                        variant="flat" 
                                        color={getLeaveStatusColor(selectedLeave.status)}
                                        size="sm"
                                        className="ml-2"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>
                )}
            </Popover>
        </GlassCard>
    );
};

const UpdatesCards = () => {
    const { auth } = usePage().props;
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [users, setUsers] = useState([]);
    const [todayLeaves, setTodayLeaves] = useState([]);
    const [upcomingLeaves, setUpcomingLeaves] = useState([]);
    const [upcomingHoliday, setUpcomingHoliday] = useState(null);

    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();
        
        const fetchUpdates = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const response = await axios.get(route('updates'), {
                    signal: controller.signal,
                    timeout: 10000
                });
                
                if (isMounted && response.data) {
                    setUsers(response.data.users || []);
                    setTodayLeaves(response.data.todayLeaves || []);
                    setUpcomingLeaves(response.data.upcomingLeaves || []);
                    setUpcomingHoliday(response.data.upcomingHoliday || null);
                }
            } catch (err) {
                if (isMounted && !controller.signal.aborted) {
                    console.error('Failed to fetch updates:', err);
                    setError(err.message);
                    setUsers([]);
                    setTodayLeaves([]);
                    setUpcomingLeaves([]);
                    setUpcomingHoliday(null);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchUpdates();

        return () => {
            isMounted = false;
            controller.abort();
        };
    }, []);

    // Helper function to group leaves by type and count
    const getLeaveSummary = (day, leaves) => {
        let leavesData = leaves;

        const userLeaveMessage = (type) => {
            const isCurrentUserOnLeave = leaves.some(leave => String(leave.user_id) === String(auth.user.id) && leave.leave_type === type);
            if (isCurrentUserOnLeave) {
                leavesData = leaves.filter(leave => String(leave.user_id) !== String(auth.user.id));
                return `You ${day === 'today' ? 'are' : 'will be'} on ${type} leave.`;
            }
            return null;
        };

        const userMessages = leaves.reduce((acc, leave) => {
            const message = userLeaveMessage(leave.leave_type);
            if (message && !acc.some(msg => msg.type === leave.leave_type)) {
                acc.push({ text: message, type: leave.leave_type });
            }
            return acc;
        }, []);

        const leaveCountByType = leavesData.reduce((summary, leave) => {
            summary[leave.leave_type] = (summary[leave.leave_type] || 0) + 1;
            return summary;
        }, {});

        const messages = Object.entries(leaveCountByType).map(([type, count]) => ({
            text: `${count} person${count > 1 ? 's' : ''} ${day === 'today' ? 'is' : 'will be'} on ${type} leave`,
            type: type,
            leaves: leavesData.filter(leave => leave.leave_type === type),
        }));

        return [...userMessages, ...messages];
    };

    // Dates
    const today = dayjs();
    const tomorrow = today.add(1, 'day');
    const sevenDaysFromNow = tomorrow.add(7, 'day');

    // Filter leaves for today, tomorrow, and within the next seven days
    const todayLeavesFiltered = todayLeaves.filter((leave) =>
        dayjs(today).isBetween(dayjs(leave.from_date), dayjs(leave.to_date), 'day', '[]')
    );
    const tomorrowLeaves = upcomingLeaves.filter((leave) =>
        dayjs(tomorrow).isBetween(dayjs(leave.from_date), dayjs(leave.to_date), 'day', '[]')
    );
    const nextSevenDaysLeaves = upcomingLeaves.filter(
        (leave) =>
            (dayjs(leave.from_date).isBetween(tomorrow, sevenDaysFromNow, 'day', '[]') ||
                dayjs(leave.to_date).isBetween(tomorrow, sevenDaysFromNow, 'day', '[]')) &&
            !/week/i.test(leave.leave_type)
    );

    // Get summary for each category
    const todayItems = getLeaveSummary('today', todayLeavesFiltered);
    const tomorrowItems = getLeaveSummary('tomorrow', tomorrowLeaves);
    const nextSevenDaysItems = getLeaveSummary('nextSevenDays', nextSevenDaysLeaves);

    // If no items, add default messages
    if (todayItems.length === 0) {
        todayItems.push({ text: 'No one is away today.' });
    }
    if (tomorrowItems.length === 0) {
        tomorrowItems.push({ text: 'No one is away tomorrow.' });
    }
    if (nextSevenDaysItems.length === 0) {
        nextSevenDaysItems.push({ text: 'No one is going to be away in the next seven days.' });
    }

    const sectionConfig = [
        {
            title: 'Today',
            items: todayItems,
            icon: CalendarDaysIcon,
            color: '#3b82f6' // blue
        },
        {
            title: 'Tomorrow',
            items: tomorrowItems,
            icon: ClockIcon,
            color: '#10b981' // green
        },
        {
            title: 'Next Seven Days',
            items: nextSevenDaysItems,
            icon: UserGroupIcon,
            color: '#f59e0b' // amber
        }
    ];

    if (loading) {
        return (
            <section 
                className="p-2"
                aria-label="Employee updates loading"
            >
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {[1, 2, 3].map((_, idx) => (
                        <div key={idx}>
                            <HeroCard className="w-full h-full p-4" radius="lg">
                                <Skeleton className="rounded-lg mb-2" isLoaded={false}>
                                    <div className="h-6 w-2/3 rounded-lg bg-secondary" />
                                </Skeleton>
                                <Skeleton className="rounded-lg" isLoaded={false}>
                                    <div className="h-32 w-full rounded-lg bg-secondary-200" />
                                </Skeleton>
                            </HeroCard>
                        </div>
                    ))}
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <div className="p-2 flex items-center justify-center min-h-[200px]">
                <HeroCard className="p-4 bg-danger-50 border-danger-200">
                    <div className="flex items-center gap-3">
                        <ExclamationTriangleIcon className="w-5 h-5 text-danger" />
                        <p className="text-danger text-base">
                            Failed to load updates: {error}
                        </p>
                    </div>
                </HeroCard>
            </div>
        );
    }

    return (
        <section 
            className="p-2"
            aria-label="Employee Updates Dashboard"
        >
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 items-stretch">
                {sectionConfig.map((section, index) => (
                    <div key={section.title} className="flex">
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: (index * 0.1), duration: 0.3 }}
                            className="w-full"
                        >
                            <div className="flex flex-col flex-grow w-full">
                                <UpdateSection 
                                    title={section.title} 
                                    items={section.items} 
                                    users={users}
                                    icon={section.icon}
                                    color={section.color}
                                />
                            </div>
                        </motion.div>
                    </div>
                ))}
            </div>
            
            {upcomingHoliday && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.3 }}
                >
                    <div className="mt-3">
                        <GlassCard>
                            <CardHeader
                                title={
                                    <div className="flex items-center gap-3">
                                        <div className="bg-amber-100 rounded-xl p-1 flex items-center justify-center min-w-[40px] min-h-[40px]">
                                            <SunIcon 
                                                style={{ 
                                                    width: '20px', 
                                                    height: '20px', 
                                                    color: '#f59e0b',
                                                    strokeWidth: 2
                                                }}
                                                aria-hidden="true"
                                            />
                                        </div>
                                        <h2 className="text-base sm:text-lg md:text-xl font-semibold">
                                            Upcoming Holiday
                                        </h2>
                                    </div>
                                }
                            />
                            <Divider />
                            <CardBody>
                                <div className="flex items-center gap-3">
                                    
                                    <div>
                                        <p className="font-semibold text-gray-900 flex items-center gap-1 mt-1">
                                            <InformationCircleIcon className="w-4 h-4" />
                                            {upcomingHoliday.title}
                                        </p>
                                        
                                        <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                                            <CalendarDaysIcon className="w-4 h-4" />
                                            {new Date(upcomingHoliday.from_date).toLocaleDateString('en-US', {
                                                month: 'long',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })} - {new Date(upcomingHoliday.to_date).toLocaleDateString('en-US', {
                                                month: 'long',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </p>
                                        <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                                            <Bars3BottomLeftIcon className="w-4 h-4" />
                                            {upcomingHoliday.description}
                                        </p>
                                    </div>
                                </div>
                            </CardBody>
                        </GlassCard>
                    </div>
                </motion.div>
            )}
        </section>
    );
};

export default UpdatesCards;