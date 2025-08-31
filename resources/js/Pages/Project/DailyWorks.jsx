import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { 
    BriefcaseIcon, 
    PlusIcon,
    ChartBarIcon,
    DocumentArrowUpIcon,
    DocumentArrowDownIcon,
    MagnifyingGlassIcon,
    CheckCircleIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    CalendarIcon
} from "@heroicons/react/24/outline";
import { Head } from "@inertiajs/react";
import App from "@/Layouts/App.jsx";
import DailyWorksTable from '@/Tables/DailyWorksTable.jsx';
import { 
    Card, 
    CardHeader, 
    CardBody, 
    Input, 
    Button,
    Spinner,
    ScrollShadow
} from "@heroui/react";
import StatsCards from "@/Components/StatsCards.jsx";
import { useMediaQuery } from '@/Hooks/useMediaQuery.js';
import DailyWorkForm from "@/Forms/DailyWorkForm.jsx";
import DeleteDailyWorkForm from "@/Forms/DeleteDailyWorkForm.jsx";
import EnhancedDailyWorksExportForm from "@/Forms/EnhancedDailyWorksExportForm.jsx";
import DailyWorksUploadForm from "@/Forms/DailyWorksUploadForm.jsx";



const DailyWorks = React.memo(({ auth, title, allData, jurisdictions, users, reports, reports_with_daily_works, overallEndDate, overallStartDate }) => {
    const isLargeScreen = useMediaQuery('(min-width: 1025px)');
    const isMediumScreen = useMediaQuery('(min-width: 641px) and (max-width: 1024px)');
    const isMobile = useMediaQuery('(max-width: 640px)');

    // Helper function to convert theme borderRadius to HeroUI radius values
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

    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [totalRows, setTotalRows] = useState(0);
    const [lastPage, setLastPage] = useState(0);
    const [filteredData, setFilteredData] = useState([]);
    const [currentRow, setCurrentRow] = useState();
    const [taskIdToDelete, setTaskIdToDelete] = useState(null);
    const [openModalType, setOpenModalType] = useState(null);
    const [search, setSearch] = useState('');
    const [perPage, setPerPage] = useState(30);
    const [currentPage, setCurrentPage] = useState(1);
    
    // Date state management
    const [selectedDate, setSelectedDate] = useState(overallEndDate); // Set to last date
    const [dateRange, setDateRange] = useState({
        start: overallStartDate,
        end: overallEndDate
    });
    
    const [filterData, setFilterData] = useState({
        status: 'all',
        incharge: 'all',
        startDate: overallStartDate,
        endDate: overallEndDate
    });

    const fetchData = async (page, perPage, filterData, dateFilter = null) => {
        setLoading(true);
        try {
            const params = {
                search: search,
                status: filterData.status !== 'all' ? filterData.status : '',
                inCharge: filterData.incharge !== 'all' ? filterData.incharge : '',
            };

            // Handle date filtering based on mobile/desktop view
            if (isMobile || (page === undefined && perPage === undefined)) {
                // Mobile: No pagination, fetch all data for selected date
                params.startDate = dateFilter || selectedDate;
                params.endDate = dateFilter || selectedDate;
                // Don't include page and perPage for mobile to get all data
            } else {
                // Desktop: With pagination, use date range
                params.page = page;
                params.perPage = perPage;
                params.startDate = dateRange.start;
                params.endDate = dateRange.end;
            }

            const response = await axios.get('/daily-works-paginate', { params });

     

            setData(response.data.data);
            setTotalRows(response.data.total);
            setLastPage(response.data.last_page);
            setLoading(false);
        } catch (error) {
            console.error(error);
            toast.error('Failed to fetch data.', {
                icon: '🔴',
                style: {
                    backdropFilter: 'blur(16px) saturate(200%)',
                    background: 'var(--theme-content1)',
                    border: '1px solid var(--theme-divider)',
                    color: 'var(--theme-primary)',
                }
            });
            setLoading(false);
        }
    };

    const handleSearch = useCallback((event) => {
        setSearch(event.target.value);
    }, []);

    const handlePageChange = useCallback((page) => {
        setCurrentPage(page);
    }, []);

    // Date change handlers
    const handleDateChange = useCallback((date) => {
        // Ensure date is within bounds
        const constrainedDate = date < overallStartDate ? overallStartDate : 
                               (date > overallEndDate ? overallEndDate : date);
        
        setSelectedDate(constrainedDate);
        if (isMobile) {
            // In mobile, immediately fetch data for the selected date (no pagination)
            fetchData(undefined, undefined, filterData, constrainedDate);
        }
    }, [isMobile, perPage, filterData, overallStartDate, overallEndDate]);

    const handleDateRangeChange = useCallback((range) => {
        // Ensure dates are within bounds
        const constrainedRange = {
            start: range.start < overallStartDate ? overallStartDate : (range.start > overallEndDate ? overallEndDate : range.start),
            end: range.end < overallStartDate ? overallStartDate : (range.end > overallEndDate ? overallEndDate : range.end)
        };
        
        // Ensure start date is not after end date
        if (constrainedRange.start > constrainedRange.end) {
            constrainedRange.end = constrainedRange.start;
        }
        
        setDateRange(constrainedRange);
        if (!isMobile) {
            // In desktop, immediately fetch data for the selected range
            setCurrentPage(1); // Reset to first page when changing date range
            fetchData(1, perPage, filterData);
        }
    }, [isMobile, perPage, filterData, overallStartDate, overallEndDate]);

    const handleDelete = () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await fetch(`/delete-daily-work`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.head.querySelector('meta[name="csrf-token"]').content,
                    },
                    body: JSON.stringify({
                        id: taskIdToDelete,
                        page: currentPage,
                        perPage,
                    }),
                });

                if (response.ok) {
                    const result = await response.json();
                    setData(result.data);
                    setTotalRows(result.total);
                    setLastPage(result.last_page);
                    resolve('Daily work deleted successfully!');
                } else {
                    reject('Failed to delete daily work. Please try again.');
                }
            } catch (error) {
                reject('Failed to delete daily work. Please try again.');
            }
        });

        toast.promise(promise, {
            pending: 'Deleting daily work...',
            success: {
                render({ data }) {
                    return <>{data}</>;
                },
            },
            error: {
                render({ data }) {
                    return <>{data}</>;
                },
            },
        });
    };

    const handleClickOpen = useCallback((taskId, modalType) => {
        setTaskIdToDelete(taskId);
        setOpenModalType(modalType);
    }, []);

    const handleClose = useCallback(() => {
        setOpenModalType(null);
        setTaskIdToDelete(null);
    }, []);

    const openModal = useCallback((modalType) => {
        setOpenModalType(modalType);
    }, []);

    const closeModal = useCallback(() => {
        setOpenModalType(null);
    }, []);

    // Statistics - Fetch comprehensive data from API
    const [apiStats, setApiStats] = useState(null);
    const [statsLoading, setStatsLoading] = useState(false);

    // Fetch comprehensive statistics from API
    const fetchStatistics = useCallback(async () => {
        setStatsLoading(true);
        try {
            const response = await axios.get('/daily-works/statistics');
            setApiStats(response.data);
        } catch (error) {
            console.error('Error fetching statistics:', error);
            toast.error('Failed to load statistics');
        } finally {
            setStatsLoading(false);
        }
    }, []);

    // Load statistics on component mount
    useEffect(() => {
        fetchStatistics();
    }, [fetchStatistics]);

    // Enhanced statistics using API data with fallback to local data
    const stats = useMemo(() => {
        if (apiStats) {
            // Use comprehensive API statistics
            return [
                {
                    title: 'Total Works',
                    value: apiStats.overview?.totalWorks || 0,
                    icon: <ChartBarIcon className="w-5 h-5" />,
                    color: 'text-blue-600',
                    description: `All daily works ${auth.roles?.includes('Super Administrator') || auth.roles?.includes('Administrator') ? '(System-wide)' : '(Your works)'}`
                },
                {
                    title: 'Completed',
                    value: apiStats.overview?.completedWorks || 0,
                    icon: <CheckCircleIcon className="w-5 h-5" />,
                    color: 'text-green-600',
                    description: `${apiStats.performanceIndicators?.completionRate || 0}% completion rate`
                },
                {
                    title: 'In Progress',
                    value: apiStats.overview?.inProgressWorks || 0,
                    icon: <ClockIcon className="w-5 h-5" />,
                    color: 'text-orange-600',
                    description: 'Currently active'
                },
                {
                    title: 'Quality Rate',
                    value: `${apiStats.performanceIndicators?.qualityRate || 0}%`,
                    icon: <DocumentArrowUpIcon className="w-5 h-5" />,
                    color: 'text-purple-600',
                    description: `${apiStats.qualityMetrics?.passedInspections || 0} passed inspections`
                },
                {
                    title: 'RFI Submissions',
                    value: apiStats.qualityMetrics?.rfiSubmissions || 0,
                    icon: <DocumentArrowDownIcon className="w-5 h-5" />,
                    color: 'text-indigo-600',
                    description: `${apiStats.performanceIndicators?.rfiRate || 0}% of total works`
                },
                {
                    title: 'This Month',
                    value: apiStats.recentActivity?.thisMonthWorks || 0,
                    icon: <ExclamationTriangleIcon className="w-5 h-5" />,
                    color: 'text-cyan-600',
                    description: 'Current month activity'
                }
            ];
        } else {
            // Fallback to basic local statistics
            const totalWorks = data.length || totalRows;
            const completedWorks = data.filter(work => work.status === 'completed').length;
            const pendingWorks = data.filter(work => work.status === 'new' || work.status === 'resubmission').length;
            const emergencyWorks = data.filter(work => work.status === 'emergency').length;

            return [
                {
                    title: 'Total',
                    value: totalWorks,
                    icon: <ChartBarIcon className="w-5 h-5" />,
                    color: 'text-blue-600',
                    description: 'All work logs'
                },
                {
                    title: 'Completed',
                    value: completedWorks,
                    icon: <CheckCircleIcon className="w-5 h-5" />,
                    color: 'text-green-600',
                    description: 'Finished tasks'
                },
                {
                    title: 'Pending',
                    value: pendingWorks,
                    icon: <ClockIcon className="w-5 h-5" />,
                    color: 'text-orange-600',
                    description: 'In progress'
                },
                {
                    title: 'Emergency',
                    value: emergencyWorks,
                    icon: <ExclamationTriangleIcon className="w-5 h-5" />,
                    color: 'text-red-600',
                    description: 'Urgent tasks'
                }
            ];
        }
    }, [data, totalRows, apiStats, auth.roles]);

    console.log(auth)

    // Action buttons configuration
    const actionButtons = [
        ...(auth.roles.includes('Administrator') || auth.roles.includes('Super Administrator') || auth.designation === 'Supervision Engineer' ? [{
            label: "Add Work",
            icon: <PlusIcon className="w-4 h-4" />,
            onPress: () => openModal('addDailyWork'),
            className: "bg-linear-to-r from-blue-500 to-purple-500 text-white font-medium"
        }] : []),
        ...(auth.roles.includes('Administrator') || auth.roles.includes('Super Administrator') ? [
            {
                label: "Import",
                icon: <DocumentArrowUpIcon className="w-4 h-4" />,
                variant: "flat",
                color: "warning",
                onPress: () => openModal('importDailyWorks'),
                className: "bg-linear-to-r from-orange-500/20 to-yellow-500/20 hover:from-orange-500/30 hover:to-yellow-500/30"
            },
            {
                label: "Export",
                icon: <DocumentArrowDownIcon className="w-4 h-4" />,
                variant: "flat", 
                color: "success",
                onPress: () => openModal('exportDailyWorks'),
                className: "bg-linear-to-r from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30"
            }
        ] : [])
    ];

    useEffect(() => {
        if (isMobile) {
            // Mobile: No pagination, fetch all data for selected date
            fetchData(undefined, undefined, filterData);
        } else {
            // Desktop: With pagination
            fetchData(currentPage, perPage, filterData);
        }
    }, [currentPage, perPage, search, filterData, selectedDate, dateRange, isMobile]);

    return (
        <>
            <Head title={title} />

            {/* Modals */}
            {openModalType === 'addDailyWork' && (
                <DailyWorkForm
                    modalType="add"
                    open={openModalType === 'addDailyWork'}
                    setData={setData}
                    closeModal={closeModal}
                />
            )}
            {openModalType === 'editDailyWork' && (
                <DailyWorkForm
                    modalType="update"
                    open={openModalType === 'editDailyWork'}
                    currentRow={currentRow}
                    setData={setData}
                    closeModal={closeModal}
                />
            )}
            {openModalType === 'deleteDailyWork' && (
                <DeleteDailyWorkForm
                    open={openModalType === 'deleteDailyWork'}
                    handleClose={handleClose}
                    handleDelete={handleDelete}
                    setData={setData}
                />
            )}
            {openModalType === 'importDailyWorks' && (
                <DailyWorksUploadForm
                    open={openModalType === 'importDailyWorks'}
                    closeModal={closeModal}
                    setData={setData}
                    setTotalRows={setTotalRows}
                    refreshData={() => fetchData(currentPage, perPage, filterData)}
                />
            )}
            {openModalType === 'exportDailyWorks' && (
                <EnhancedDailyWorksExportForm
                    open={openModalType === 'exportDailyWorks'}
                    closeModal={closeModal}
                    filterData={filterData}
                    users={users}
                    inCharges={allData.allInCharges}
                />
            )}

            <div className="flex justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-full max-w-[2000px]"
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
                        {/* Main Card Content */}
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
                                                <BriefcaseIcon 
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
                                                    Project Work Management
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
                                                    Track daily work progress and project activities
                                                </p>
                                            </div>
                                        </div>
                                        {/* Action Buttons */}
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                {actionButtons.map((button, index) => (
                                                    <Button
                                                        key={index}
                                                        size={isLargeScreen ? "md" : "sm"}
                                                        variant={button.variant || "flat"}
                                                        color={button.color || "primary"}
                                                        startContent={button.icon}
                                                        onPress={button.onPress}
                                                        className={`${button.className || ''} font-medium`}
                                                        style={{
                                                            fontFamily: `var(--fontFamily, "Inter")`,
                                                            borderRadius: `var(--borderRadius, 12px)`,
                                                        }}
                                                    >
                                                        {button.label}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        
                        <CardBody className="pt-6">
                            {/* Quick Stats */}
                            <div className="relative">
                                {statsLoading && (
                                    <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
                                        <div className="flex flex-col items-center space-y-2">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                            <span className="text-sm text-gray-600 dark:text-gray-400">Loading statistics...</span>
                                        </div>
                                    </div>
                                )}
                                <StatsCards 
                                    stats={stats} 
                                    onRefresh={fetchStatistics}
                                    isLoading={statsLoading}
                                />
                            </div>
                            
                            {/* Search Section */}
                            <div className="mb-6">
                                <div className="w-full sm:w-auto sm:min-w-[300px]">
                                    <Input
                                        type="text"
                                        placeholder="Search by description, location, or notes..."
                                        value={search}
                                        onChange={(e) => handleSearch(e)}
                                        variant="bordered"
                                        size={isMobile ? "sm" : "md"}
                                        radius={getThemeRadius()}
                                        startContent={
                                            <MagnifyingGlassIcon className="w-4 h-4 text-default-400" />
                                        }
                                        classNames={{
                                            input: "text-foreground",
                                            inputWrapper: `bg-content2/50 hover:bg-content2/70 
                                                         focus-within:bg-content2/90 border-divider/50 
                                                         hover:border-divider data-[focus]:border-primary`,
                                        }}
                                        style={{
                                            fontFamily: `var(--fontFamily, "Inter")`,
                                            borderRadius: `var(--borderRadius, 12px)`,
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Date Selector Section */}
                            <div className="mb-6">
                                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                                    <div className="flex items-center gap-2">
                                        <CalendarIcon className="w-5 h-5 text-default-500" />
                                        <span className="text-sm font-medium text-foreground">
                                            {isMobile ? 'Select Date:' : 'Date Range:'}
                                        </span>
                                    </div>
                                    
                                    {isMobile ? (
                                        // Mobile: Single date picker for current date
                                        <div className="w-full sm:w-auto">
                                            <Input
                                                type="date"
                                                value={selectedDate}
                                                onChange={(e) => handleDateChange(e.target.value)}
                                                variant="bordered"
                                                size="sm"
                                                radius={getThemeRadius()}
                                                min={overallStartDate}
                                                max={overallEndDate}
                                                classNames={{
                                                    input: "text-foreground",
                                                    inputWrapper: `bg-content2/50 hover:bg-content2/70 
                                                                 focus-within:bg-content2/90 border-divider/50 
                                                                 hover:border-divider data-[focus]:border-primary`,
                                                }}
                                                style={{
                                                    fontFamily: `var(--fontFamily, "Inter")`,
                                                    borderRadius: `var(--borderRadius, 12px)`,
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        // Desktop: Date range picker
                                        <div className="flex gap-2 items-center">
                                            <Input
                                                type="date"
                                                label="Start Date"
                                                value={dateRange.start}
                                                onChange={(e) => handleDateRangeChange({
                                                    ...dateRange,
                                                    start: e.target.value
                                                })}
                                                variant="bordered"
                                                size="sm"
                                                radius={getThemeRadius()}
                                                min={overallStartDate}
                                                max={overallEndDate}
                                                classNames={{
                                                    input: "text-foreground",
                                                    inputWrapper: `bg-content2/50 hover:bg-content2/70 
                                                                 focus-within:bg-content2/90 border-divider/50 
                                                                 hover:border-divider data-[focus]:border-primary`,
                                                }}
                                                style={{
                                                    fontFamily: `var(--fontFamily, "Inter")`,
                                                    borderRadius: `var(--borderRadius, 12px)`,
                                                }}
                                            />
                                            <span className="text-default-500">to</span>
                                            <Input
                                                type="date"
                                                label="End Date"
                                                value={dateRange.end}
                                                onChange={(e) => handleDateRangeChange({
                                                    ...dateRange,
                                                    end: e.target.value
                                                })}
                                                variant="bordered"
                                                size="sm"
                                                radius={getThemeRadius()}
                                                min={overallStartDate}
                                                max={overallEndDate}
                                                classNames={{
                                                    input: "text-foreground",
                                                    inputWrapper: `bg-content2/50 hover:bg-content2/70 
                                                                 focus-within:bg-content2/90 border-divider/50 
                                                                 hover:border-divider data-[focus]:border-primary`,
                                                }}
                                                style={{
                                                    fontFamily: `var(--fontFamily, "Inter")`,
                                                    borderRadius: `var(--borderRadius, 12px)`,
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Daily Works Table */}
                            <Card 
                                radius={getThemeRadius()}
                                className="bg-content2/50 backdrop-blur-md border border-divider/30"
                                style={{
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                    borderRadius: `var(--borderRadius, 12px)`,
                                    backgroundColor: 'var(--theme-content2)',
                                    borderColor: 'var(--theme-divider)',
                                }}
                            >
                                <CardBody className="p-4">
                                    <DailyWorksTable
                                        setData={setData}
                                        filteredData={filteredData}
                                        setFilteredData={setFilteredData}
                                        reports={reports}
                                        setCurrentRow={setCurrentRow}
                                        currentPage={currentPage}
                                        setCurrentPage={setCurrentPage}
                                        onPageChange={handlePageChange}
                                        setLoading={setLoading}
                                        refreshStatistics={fetchStatistics}
                                        handleClickOpen={handleClickOpen}
                                        openModal={openModal}
                                        juniors={allData.juniors}
                                        totalRows={totalRows}
                                        lastPage={lastPage}
                                        loading={loading}
                                        allData={data}
                                        allInCharges={allData.allInCharges}
                                        jurisdictions={jurisdictions}
                                        users={users}
                                        reports_with_daily_works={reports_with_daily_works}
                                        isMobile={isMobile}
                                    />
                                </CardBody>
                            </Card>
                        </CardBody>
                    </Card>
                </motion.div>
            </div>
        </>
    );
});

DailyWorks.layout = (page) => <App>{page}</App>;

export default DailyWorks;
