import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Head} from '@inertiajs/react';
import { 
    Button, 
    Card, 
    CardBody, 
    CardHeader, 
    Input, 
    Pagination 
} from "@heroui/react";
import {
    CalendarIcon,
    ChartBarIcon,
    CheckCircleIcon,
    ClipboardDocumentListIcon,
    ClockIcon,
    DocumentArrowDownIcon,
    ExclamationTriangleIcon,
    PresentationChartLineIcon,
    UserGroupIcon,
    UserIcon,
    XCircleIcon
} from "@heroicons/react/24/outline";
import {MagnifyingGlassIcon} from '@heroicons/react/24/solid';
import StatsCards from '@/Components/StatsCards.jsx';
import App from "@/Layouts/App.jsx";
import AttendanceAdminTable from '@/Tables/AttendanceAdminTable.jsx';
import { motion } from 'framer-motion';
import axios from "axios";
import {toast} from "react-toastify";
import dayjs from "dayjs";

// Theme utility function
const getThemeRadius = () => {
    if (typeof window === 'undefined') return 'lg';
    
    const rootStyles = getComputedStyle(document.documentElement);
    const borderRadius = rootStyles.getPropertyValue('--borderRadius')?.trim() || '12px';
    
    const radiusValue = parseInt(borderRadius);
    if (radiusValue === 0) return 'none';
    if (radiusValue <= 4) return 'sm';
    if (radiusValue <= 8) return 'md';
    if (radiusValue <= 12) return 'lg';
    return 'xl';
};


const AttendanceAdmin = React.memo(({title}) => {
    // Custom media query logic - matching AttendanceEmployee
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

    const [loading, setLoading] = useState(false);

    const [attendanceData, setAttendanceData] = useState([]);
    const [leaveCounts, setLeaveCounts] = useState([]);
    const [leaveTypes, setLeaveTypes] = useState([]);

    const [totalRows, setTotalRows] = useState(0);
    const [lastPage, setLastPage] = useState(0);
    const [employee, setEmployee] = useState('');
    const [perPage, setPerPage] = useState(30);
    const [currentPage, setCurrentPage] = useState(1);
    const [downloading, setDownloading] = useState('');

    const [filterData, setFilterData] = useState({
        currentMonth: dayjs().format('YYYY-MM'),
    });    // Enhanced attendance stats state
    const [attendanceStats, setAttendanceStats] = useState({
        // Basic metrics
        totalEmployees: 0,
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

        // Today's stats
        presentToday: 0,
        absentToday: 0,
        lateToday: 0,

        // Meta
        month: '',
        generated_at: null
    });


    const handleFilterChange = useCallback((key, value) => {
        setFilterData(prevState => ({
            ...prevState,
            [key]: value,
        }));
    }, []);

    const fetchData = async (page = 1, perPage = 30, filterData) => {
        setLoading(true);

        try {
            const currentMonth = filterData.currentMonth
                ? dayjs(filterData.currentMonth).format('MM')
                : dayjs().format('MM');
            const currentYear = filterData.currentMonth
                ? dayjs(filterData.currentMonth).year()
                : dayjs().year();

            // Fetch attendance data
            const response = await axios.get(route('attendancesAdmin.paginate'), {
                params: {
                    page,
                    perPage,
                    employee: employee,
                    currentYear,
                    currentMonth,
                }
            });

            setAttendanceData(response.data.data);
            setTotalRows(response.data.total);
            setLastPage(response.data.last_page);
            setLeaveTypes(response.data.leaveTypes);
            setLeaveCounts(response.data.leaveCounts);

            // Fetch stats (optional but aligned)
            const statsResponse = await axios.get(route('attendance.monthlyStats'), {
                params: {
                    currentYear,
                    currentMonth,
                }
            });

            if (statsResponse.data.success) {
                setAttendanceStats(statsResponse.data.data);
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to fetch data.', {
                icon: '🔴',
                style: {
                    backdropFilter: 'blur(16px) saturate(200%)',
                    fontFamily: `var(--fontFamily, "Inter")`,
                    background: `var(--theme-content1, #FFFFFF)`,
                    border: `var(--borderWidth, 1px) solid var(--theme-divider, #E4E4E7)`,
                    color: `var(--theme-foreground, #000000)`,
                }
            });
        } finally {
            setLoading(false);
        }
    };


    const handleSearch = (event) => {
        const value = event.target.value.toLowerCase();
        setEmployee(value);
    };

    useEffect(() => {
        fetchData(currentPage, perPage, filterData).then(r => '');
    }, [currentPage, perPage, filterData, employee]);


    const handlePageChange = (page) => {
        setCurrentPage(page);
    };


    const exportToExcel = async () => {
        setDownloading('excel');
        try {
            const currentMonth = filterData.currentMonth
                ? dayjs(filterData.currentMonth).format('YYYY-MM')
                : dayjs().format('YYYY-MM');

            const response = await axios.get(route('attendance.exportAdminExcel'), {
                params: {month: currentMonth},
                responseType: 'blob',
            });


            // Create blob link to download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.download = `Admin_Attendance_${currentMonth}.xlsx`;
            document.body.appendChild(link);
            link.click();
            setDownloading('');
            link.remove();
            window.URL.revokeObjectURL(url);

        } catch (error) {
            console.error('Download failed:', error);
            setDownloading('');
            alert('Failed to download attendance sheet.');
        }
    };

    const exportToPdf = async () => {
        setDownloading('pdf');
        try {
            const currentMonth = filterData.currentMonth
                ? dayjs(filterData.currentMonth).format('YYYY-MM')
                : dayjs().format('YYYY-MM');

            const response = await axios.get(route('attendance.exportAdminPdf'), {
                params: {month: currentMonth},
                responseType: 'blob',
            });

            // Create a blob link for download
            const url = window.URL.createObjectURL(new Blob([response.data], {type: 'application/pdf'}));
            const link = document.createElement('a');
            link.href = url;
            link.download = `Admin_Attendance_${currentMonth}.pdf`;
            document.body.appendChild(link);
            link.click();
            setDownloading('');
            link.remove();
            window.URL.revokeObjectURL(url);

        } catch (error) {
            console.error('PDF download failed:', error);
            setDownloading('');
            alert('Failed to download attendance PDF.');
        }
    };


    // Prepare all stats data for StatsCards component - Combined into one array
    const allStatsData = useMemo(() => [
        {
            title: "Total Employees",
            value: attendanceStats.totalEmployees,
            icon: <UserGroupIcon/>,
            color: "text-blue-400",
            iconBg: "bg-blue-500/20",
            description: "Active employees"
        },
        {
            title: "Working Days",
            value: attendanceStats.totalWorkingDays,
            icon: <CalendarIcon/>,
            color: "text-indigo-600",
            iconBg: "bg-indigo-500/20",
            description: `This month (${attendanceStats.month})`
        },
        {
            title: "Present Today",
            value: attendanceStats.presentToday,
            icon: <CheckCircleIcon/>,
            color: "text-green-400",
            iconBg: "bg-green-500/20",
            description: attendanceStats.presentToday > 0
                ? `${((attendanceStats.presentToday / attendanceStats.totalEmployees) * 100).toFixed(1)}% of employees`
                : 'No attendance yet'
        },
        {
            title: "Absent Today",
            value: attendanceStats.absentToday,
            icon: <XCircleIcon/>,
            color: "text-red-400",
            iconBg: "bg-red-500/20",
            description: attendanceStats.absentToday > 0
                ? `${((attendanceStats.absentToday / attendanceStats.totalEmployees) * 100).toFixed(1)}% absent`
                : 'All present'
        },
        {
            title: "Late Today",
            value: attendanceStats.lateToday,
            icon: <ExclamationTriangleIcon/>,
            color: "text-orange-400",
            iconBg: "bg-orange-500/20",
            description: "Late arrivals today"
        },
        {
            title: "Attendance Rate",
            value: `${attendanceStats.attendancePercentage}%`,
            icon: <ChartBarIcon/>,
            color: "text-emerald-600",
            iconBg: "bg-emerald-500/20",
            description: "Monthly average"
        }, {
            title: "Avg Work Hours",
            value: `${attendanceStats.averageWorkHours}h`,
            icon: <ClockIcon/>,
            color: "text-blue-400",
            iconBg: "bg-blue-500/20",
            description: "Daily average this month"
        },
        {
            title: "Overtime",
            value: `${attendanceStats.overtimeHours}h`,
            icon: <ClockIcon/>,
            color: "text-purple-400",
            iconBg: "bg-purple-500/20",
            description: "Total overtime this month"
        },
        {
            title: "Leave Days",
            value: attendanceStats.totalLeaveDays,
            icon: <UserIcon/>,
            color: "text-amber-600",
            iconBg: "bg-amber-500/20",
            description: "Total leaves this month"
        }
    ], [attendanceStats.totalEmployees, attendanceStats.totalWorkingDays, attendanceStats.month, attendanceStats.presentToday, attendanceStats.absentToday, attendanceStats.lateToday, attendanceStats.attendancePercentage, attendanceStats.averageWorkHours, attendanceStats.overtimeHours, attendanceStats.totalLeaveDays]);


    return (
        <>
            <Head title={title || "Attendance Management"} />
            <div 
                className="flex flex-col w-full h-full p-4"
                role="main"
                aria-label="Attendance Management"
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
                                                            Attendance Management
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
                                                            Monitor and manage employee attendance records
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="flex flex-wrap gap-2 lg:gap-3">
                                                    <Button
                                                        size={isMobile ? "sm" : "md"}
                                                        variant="bordered"
                                                        startContent={<DocumentArrowDownIcon className="w-4 h-4" />}
                                                        onPress={exportToExcel}
                                                        isLoading={downloading === 'excel'}
                                                        radius={getThemeRadius()}
                                                        style={{
                                                            background: `color-mix(in srgb, var(--theme-primary) 10%, transparent)`,
                                                            border: `1px solid color-mix(in srgb, var(--theme-primary) 30%, transparent)`,
                                                            color: 'var(--theme-primary)',
                                                            fontFamily: `var(--fontFamily, "Inter")`,
                                                        }}
                                                        className="min-w-0"
                                                    >
                                                        Excel
                                                    </Button>
                                                    <Button
                                                        size={isMobile ? "sm" : "md"}
                                                        variant="bordered"
                                                        startContent={<DocumentArrowDownIcon className="w-4 h-4" />}
                                                        onPress={exportToPdf}
                                                        isLoading={downloading === 'pdf'}
                                                        radius={getThemeRadius()}
                                                        style={{
                                                            background: `color-mix(in srgb, var(--theme-danger) 10%, transparent)`,
                                                            border: `1px solid color-mix(in srgb, var(--theme-danger) 30%, transparent)`,
                                                            color: 'var(--theme-danger)',
                                                            fontFamily: `var(--fontFamily, "Inter")`,
                                                        }}
                                                        className="min-w-0"
                                                    >
                                                        PDF
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardBody className="p-6">
                                    {/* All Stats - Responsive Layout for 9 cards */}
                                    <StatsCards
                                        stats={allStatsData}
                                        className="mb-6"
                                    />

                                    {/* Filters Section */}
                                    <div className="mb-6">
                                        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                                            <div className="w-full sm:w-auto sm:min-w-[200px]">
                                                <Input
                                                    label="Search Employee"
                                                    type="text"
                                                    value={employee}
                                                    onValueChange={handleSearch}
                                                    placeholder="Enter employee name..."
                                                    variant="bordered"
                                                    size={isMobile ? "sm" : "md"}
                                                    radius={getThemeRadius()}
                                                    startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                                                    classNames={{
                                                        inputWrapper: "border-default-200 hover:border-default-300",
                                                    }}
                                                    style={{
                                                        fontFamily: `var(--fontFamily, "Inter")`,
                                                    }}
                                                />
                                            </div>

                                            <div className="w-full sm:w-auto sm:min-w-[200px]">
                                                <Input
                                                    label="Month/Year"
                                                    type="month"
                                                    value={filterData.currentMonth}
                                                    onValueChange={(value) => handleFilterChange('currentMonth', value)}
                                                    variant="bordered"
                                                    size={isMobile ? "sm" : "md"}
                                                    radius={getThemeRadius()}
                                                    startContent={<CalendarIcon className="w-4 h-4 text-default-400" />}
                                                    classNames={{
                                                        inputWrapper: "border-default-200 hover:border-default-300",
                                                    }}
                                                    style={{
                                                        fontFamily: `var(--fontFamily, "Inter")`,
                                                    }}
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
                                                    Employee Attendance Records
                                                </h1>
                                            </div>
                                        </CardHeader>
                                        <CardBody>
                                            <div className="max-h-[84vh] overflow-y-auto">
                                                <AttendanceAdminTable
                                                    attendanceData={attendanceData}
                                                    currentYear={filterData.currentYear}
                                                    currentMonth={filterData.currentMonth}
                                                    leaveTypes={leaveTypes}
                                                    leaveCounts={leaveCounts}
                                                    loading={loading}
                                                />

                                                {/* Pagination */}
                                                {totalRows >= 30 && (
                                                    <div className="py-4 px-2 flex justify-center items-center">
                                                        <Pagination
                                                            initialPage={1}
                                                            isCompact
                                                            showControls
                                                            showShadow
                                                            color="primary"
                                                            variant="bordered"
                                                            page={currentPage}
                                                            total={lastPage}
                                                            onChange={handlePageChange}
                                                            radius={getThemeRadius()}
                                                            style={{
                                                                fontFamily: `var(--fontFamily, "Inter")`,
                                                            }}
                                                        />
                                                    </div>
                                                )}
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
AttendanceAdmin.layout = (page) => <App>{page}</App>;

export default AttendanceAdmin;
