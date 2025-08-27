import React, { useState, useEffect, useCallback } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { 
  Card, 
  CardBody, 
  CardHeader,
  Divider,
  Button,
  Input,
  Pagination,
  CircularProgress,
  Spinner
} from "@heroui/react";
import { useTheme } from '@/Contexts/ThemeContext';
import { RefreshCcw, Download, FileText } from 'lucide-react';
import App from "@/Layouts/App.jsx";
import StatsCards from '@/Components/StatsCards.jsx';
import TimeSheetTable from "@/Tables/TimeSheetTable.jsx";
import { 
  ClockIcon, 
  CalendarDaysIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  UserGroupIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  PresentationChartLineIcon,
  DocumentArrowDownIcon,
  UserIcon
} from '@heroicons/react/24/outline';

const AttendanceEmployee = React.memo(({ title, totalWorkingDays, presentDays, absentDays, lateArrivals }) => {
    const { auth } = usePage().props;
    const { isDark } = useTheme();
    
    // Custom media query logic - matching TimeSheetTable
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);
    const [isLargeScreen, setIsLargeScreen] = useState(false);
    const [isMediumScreen, setIsMediumScreen] = useState(false);
    
    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 640);
            setIsTablet(window.innerWidth < 768);
            setIsLargeScreen(window.innerWidth >= 1025);
            setIsMediumScreen(window.innerWidth >= 641 && window.innerWidth <= 1024);
        };
        
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);
    
    // Helper function to convert theme borderRadius to HeroUI radius values - matching TimeSheetTable
    const getThemeRadius = () => {
        if (typeof window === 'undefined') return 'lg';
        
        const rootStyles = getComputedStyle(document.documentElement);
        const borderRadius = rootStyles.getPropertyValue('--borderRadius')?.trim() || '12px';
        
        const radiusValue = parseInt(borderRadius);
        if (radiusValue === 0) return 'none';
        if (radiusValue <= 4) return 'sm';
        if (radiusValue <= 8) return 'md';
        if (radiusValue <= 16) return 'lg';
        return 'full';
    };
    
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [updateTimeSheet, setUpdateTimeSheet] = useState(false);
    const [loading, setLoading] = useState(false);
    
    // Filter data state - matching TimeSheetTable expectations
    const [filterData, setFilterData] = useState({
        currentMonth: new Date().toISOString().slice(0, 7), // YYYY-MM format
    });

    // Enhanced attendance stats state - matching industry standards
    const [attendanceStats, setAttendanceStats] = useState({
        // Basic metrics
        totalWorkingDays: 0,
        totalDaysInMonth: 0,
        holidaysCount: 0,
        weekendsCount: 0,
        
        // Attendance metrics
        presentDays: 0,
        absentDays: 0,
        lateArrivals: 0,
        attendancePercentage: 0,
        
        // Work time metrics
        averageWorkHours: 0,
        overtimeHours: 0,
        totalWorkHours: 0,
        
        // Leave metrics
        totalLeaveDays: 0,
        leaveBreakdown: {},
        
        // Meta
        month: '',
        generated_at: null
    });

    const handleDateChange = (event) => {
        const newDate = event.target.value;
        setSelectedDate(new Date(newDate));
        setUpdateTimeSheet(prev => !prev);
    };

    // Handle filter changes
    const handleFilterChange = useCallback((key, value) => {
        setFilterData(prevState => ({
            ...prevState,
            [key]: value,
        }));
        setUpdateTimeSheet(prev => !prev);
    }, []);

    // Fetch enhanced monthly statistics for the current user
    const fetchMonthlyStats = useCallback(async () => {
        try {
            const statsResponse = await axios.get(route('attendance.myMonthlyStats'), {
                params: {
                    currentYear: filterData.currentMonth ? new Date(filterData.currentMonth).getFullYear() : new Date().getFullYear(),
                    currentMonth: filterData.currentMonth ? String(new Date(filterData.currentMonth).getMonth() + 1).padStart(2, '0') : String(new Date().getMonth() + 1).padStart(2, '0'),
                    // userId is automatically determined from auth in backend
                }
            });
          

            if (statsResponse.data.success) {
                setAttendanceStats(statsResponse.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch monthly stats:', error);
        }
    }, [filterData.currentMonth]);    // Fetch stats when component mounts or filter changes
    useEffect(() => {
        fetchMonthlyStats();
    }, [fetchMonthlyStats]);    // Prepare all stats data for StatsCards component - Combined into one array
    const allStatsData = [
        {
            title: "Working Days",
            value: attendanceStats.totalWorkingDays,
            icon: <CalendarDaysIcon />,
            color: "text-primary",
            iconBg: "bg-primary/20",
            description: `Total for ${attendanceStats.month || 'this month'}`
        },
        {
            title: "Present Days",
            value: attendanceStats.presentDays,
            icon: <CheckCircleIcon />,
            color: "text-success",
            iconBg: "bg-success/20",
            description: "Days attended this month"
        },
        {
            title: "Absent Days",
            value: attendanceStats.absentDays,
            icon: <XCircleIcon />,
            color: "text-danger",
            iconBg: "bg-danger/20",
            description: "Days missed this month"
        },
        {
            title: "Late Arrivals",
            value: attendanceStats.lateArrivals,
            icon: <ExclamationTriangleIcon />,
            color: "text-warning",
            iconBg: "bg-warning/20",
            description: "Times late this month"
        },
        {
            title: "Attendance Rate",
            value: `${attendanceStats.attendancePercentage}%`,
            icon: <ChartBarIcon />,
            color: "text-success",
            iconBg: "bg-success/20",
            description: "Your monthly performance"
        },
        {
            title: "Avg Work Hours",
            value: `${attendanceStats.averageWorkHours}h`,
            icon: <ClockIcon />,
            color: "text-primary",
            iconBg: "bg-primary/20",
            description: "Daily average this month"
        },
        {
            title: "Overtime",
            value: `${attendanceStats.overtimeHours}h`,
            icon: <ClockIcon />,
            color: "text-secondary",
            iconBg: "bg-secondary/20",
            description: "Extra hours this month"
        },
        {
            title: "Leave Days",
            value: attendanceStats.totalLeaveDays,
            icon: <UserIcon />,
            color: "text-warning",
            iconBg: "bg-warning/20",
            description: "Leaves taken this month"
        }
    ];

    return (
        <>
            <Head title={title || "My Attendance"} />
            <div 
                className="flex flex-col w-full h-full p-4"
                role="main"
                aria-label="My Attendance Management"
            >
                <div className="space-y-4">
                    <div className="w-full">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            <Card 
                                className="transition-all duration-200"
                                style={{
                                    border: `var(--borderWidth, 2px) solid transparent`,
                                    borderRadius: `var(--borderRadius, 12px)`,
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                    transform: `scale(var(--scale, 1))`,
                                    background: `linear-gradient(135deg, 
                                        var(--theme-content1, #FAFAFA) 20%, 
                                        var(--theme-content2, #F4F4F5) 10%, 
                                        var(--theme-content3, #F1F3F4) 20%)`,
                                }}
                            >
                                <CardHeader 
                                    className="border-b p-0"
                                    style={{
                                        borderColor: `var(--theme-divider, #E4E4E7)`,
                                        background: `linear-gradient(135deg, 
                                            color-mix(in srgb, var(--theme-content1) 50%, transparent) 20%, 
                                            color-mix(in srgb, var(--theme-content2) 30%, transparent) 10%)`,
                                    }}
                                >
                                    <div className={`${isLargeScreen ? 'p-6' : isMediumScreen ? 'p-4' : 'p-3'} w-full`}>
                                        <div className="flex flex-col space-y-4">
                                            {/* Main Header Content */}
                                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                                {/* Title Section */}
                                                <div className="flex items-center gap-3 lg:gap-4">
                                                    <div 
                                                        className={`
                                                            ${isLargeScreen ? 'p-3' : isMediumScreen ? 'p-2.5' : 'p-2'} 
                                                            rounded-xl flex items-center justify-center
                                                        `}
                                                        style={{
                                                            background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                                                            borderColor: `color-mix(in srgb, var(--theme-primary) 25%, transparent)`,
                                                            borderWidth: `var(--borderWidth, 2px)`,
                                                            borderRadius: `var(--borderRadius, 12px)`,
                                                        }}
                                                    >
                                                        <PresentationChartLineIcon 
                                                            className={`
                                                                ${isLargeScreen ? 'w-8 h-8' : isMediumScreen ? 'w-6 h-6' : 'w-5 h-5'}
                                                            `}
                                                            style={{ color: 'var(--theme-primary)' }}
                                                        />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <h4 
                                                            className={`
                                                                ${isLargeScreen ? 'text-2xl' : isMediumScreen ? 'text-xl' : 'text-lg'}
                                                                font-bold text-foreground
                                                                ${!isLargeScreen ? 'truncate' : ''}
                                                            `}
                                                            style={{
                                                                fontFamily: `var(--fontFamily, "Inter")`,
                                                            }}
                                                        >
                                                            My Attendance
                                                        </h4>
                                                        <p 
                                                            className={`
                                                                ${isLargeScreen ? 'text-sm' : 'text-xs'} 
                                                                text-default-500
                                                                ${!isLargeScreen ? 'truncate' : ''}
                                                            `}
                                                            style={{
                                                                fontFamily: `var(--fontFamily, "Inter")`,
                                                            }}
                                                        >
                                                            View your attendance records and timesheet details
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardBody className="p-6">
                                    {/* All Stats - Responsive Layout for 8 cards */}
                                    <StatsCards stats={allStatsData} className="mb-6" />
                                    
                                    {/* Filters Section */}
                                    <div className="mb-6">
                                        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                                            <div className="w-full sm:w-auto sm:min-w-[200px]">
                                                <Input
                                                    label="Month/Year"
                                                    type="month"
                                                    value={filterData.currentMonth}
                                                    onChange={(e) => handleFilterChange('currentMonth', e.target.value)}
                                                    variant="bordered"
                                                    size="sm"
                                                    radius={getThemeRadius()}
                                                    startContent={<CalendarDaysIcon className="w-4 h-4 text-default-400" />}
                                                    classNames={{
                                                        input: "text-sm",
                                                    }}
                                                    style={{
                                                        fontFamily: `var(--fontFamily, "Inter")`,
                                                    }}
                                                    aria-label="Select month and year for attendance"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Attendance Table Section */}
                                    <Card 
                                        className="transition-all duration-200"
                                        style={{
                                            border: `var(--borderWidth, 2px) solid transparent`,
                                            borderRadius: `var(--borderRadius, 12px)`,
                                            fontFamily: `var(--fontFamily, "Inter")`,
                                            background: `linear-gradient(135deg, 
                                                var(--theme-content1, #FAFAFA) 20%, 
                                                var(--theme-content2, #F4F4F5) 10%, 
                                                var(--theme-content3, #F1F3F4) 20%)`,
                                        }}
                                    >
                                        <CardHeader 
                                            className="border-b pb-2"
                                            style={{
                                                borderColor: `var(--theme-divider, #E4E4E7)`,
                                            }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div 
                                                    className="p-2 rounded-lg flex items-center justify-center"
                                                    style={{
                                                        background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                                                        borderColor: `color-mix(in srgb, var(--theme-primary) 25%, transparent)`,
                                                    }}
                                                >
                                                    <ClockIcon 
                                                        className="w-6 h-6" 
                                                        style={{ color: 'var(--theme-primary)' }}
                                                    />
                                                </div>
                                                <h1 
                                                    className="text-xl sm:text-2xl md:text-3xl font-semibold text-foreground"
                                                    style={{
                                                        fontFamily: `var(--fontFamily, "Inter")`,
                                                    }}
                                                >
                                                    My Attendance Records
                                                </h1>
                                            </div>
                                        </CardHeader>
                                        <CardBody>
                                            <div className="max-h-[84vh] overflow-y-auto">
                                                <TimeSheetTable 
                                                    selectedDate={selectedDate} 
                                                    handleDateChange={handleDateChange}
                                                    updateTimeSheet={updateTimeSheet}
                                                    externalFilterData={filterData}
                                                    key={`${selectedDate}-${filterData.currentMonth}`}
                                                />
                                            </div>
                                        </CardBody>
                                    </Card>
                                </CardBody>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>
        </>
    );
});
AttendanceEmployee.layout = (page) => <App>{page}</App>;

export default AttendanceEmployee;
