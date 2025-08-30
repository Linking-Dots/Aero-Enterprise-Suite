import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Head } from "@inertiajs/react";
import { 
    DatePicker,
    ButtonGroup,
    Select,
    SelectItem,
    Button,
    Card,
    CardHeader,
    CardBody,
    Input,
    ScrollShadow
} from "@heroui/react";
import { 
    CalendarIcon, 
    ChartBarIcon, 
    ClockIcon,
    UserIcon,
    PlusIcon,
    DocumentArrowDownIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    BriefcaseIcon,
    BuildingOfficeIcon,
    DocumentTextIcon,
    ArrowPathIcon
} from "@heroicons/react/24/outline";
import App from "@/Layouts/App.jsx";
import DailyWorkSummaryTable from '@/Tables/DailyWorkSummaryTable.jsx';
import StatsCards from "@/Components/StatsCards.jsx";
import DailyWorkSummaryDownloadForm from "@/Forms/DailyWorkSummaryDownloadForm.jsx";
import { motion } from 'framer-motion';
import { useMediaQuery } from '@/Hooks/useMediaQuery.js';
import dayjs from 'dayjs';
import minMax from 'dayjs/plugin/minMax';
import axios from 'axios';
import { toast } from 'react-toastify';

dayjs.extend(minMax);

const DailyWorkSummary = ({ auth, title, summary, jurisdictions, inCharges }) => {
    // Responsive handling
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

    const [dailyWorkSummary, setDailyWorkSummary] = useState(summary);
    const [filteredData, setFilteredData] = useState(summary);
    const [loading, setLoading] = useState(false);
    const dates = dailyWorkSummary.map(work => dayjs(work.date));
    const [openModalType, setOpenModalType] = useState(null);

    const openModal = useCallback((modalType) => {
        setOpenModalType(modalType);
    }, []);

    const closeModal = useCallback(() => {
        setOpenModalType(null);
    }, []);

    // Refresh summary data
    const handleRefresh = useCallback(async () => {
        setLoading(true);
        try {
            // Get date range for refresh
            const startDate = filterData.startDate?.format('YYYY-MM-DD') || dayjs().subtract(30, 'days').format('YYYY-MM-DD');
            const endDate = filterData.endDate?.format('YYYY-MM-DD') || dayjs().format('YYYY-MM-DD');
            
            const response = await axios.post(route('daily-works-summary.refresh'), {
                startDate,
                endDate
            });
            
            if (response.data && response.data.message) {
                // Refresh the page data
                window.location.reload();
                toast.success('Summary data refreshed successfully');
            }
        } catch (error) {
            console.error('Failed to refresh summary:', error);
            toast.error('Failed to refresh summary data');
        } finally {
            setLoading(false);
        }
    }, [filterData]);

    const [filterData, setFilterData] = useState({
        startDate: dayjs.min(...dates),
        endDate: dayjs.max(...dates),
        status: 'all',
        incharge: 'all',
    });

    const handleFilterChange = useCallback((key, value) => {
        setFilterData(prevState => ({
            ...prevState,
            [key]: value,
        }));
    }, []);

    // Statistics
    const stats = useMemo(() => {
        const totalWorks = filteredData.reduce((sum, work) => sum + work.totalDailyWorks, 0);
        const totalCompleted = filteredData.reduce((sum, work) => sum + work.completed, 0);
        const totalPending = filteredData.reduce((sum, work) => sum + work.pending, 0);
        const totalRFI = filteredData.reduce((sum, work) => sum + work.rfiSubmissions, 0);
        const avgCompletion = totalWorks > 0 ? ((totalCompleted / totalWorks) * 100).toFixed(1) : 0;

        return [
            {
                title: 'Total Works',
                value: totalWorks,
                icon: <ChartBarIcon className="w-5 h-5" />,
                color: 'text-blue-600',
                description: 'All logged works'
            },
            {
                title: 'Completed',
                value: totalCompleted,
                icon: <CheckCircleIcon className="w-5 h-5" />,
                color: 'text-green-600',
                description: `${avgCompletion}% completion rate`
            },
            {
                title: 'Pending',
                value: totalPending,
                icon: <ClockIcon className="w-5 h-5" />,
                color: 'text-orange-600',
                description: 'In progress'
            },
            {
                title: 'RFI Submissions',
                value: totalRFI,
                icon: <DocumentTextIcon className="w-5 h-5" />,
                color: 'text-purple-600',
                description: 'Ready for inspection'
            }
        ];
    }, [filteredData]);

    // Action buttons configuration
    const actionButtons = [
        {
            label: "Refresh",
            icon: <ArrowPathIcon className="w-4 h-4" />,
            variant: "flat", 
            color: "primary",
            onPress: handleRefresh,
            isLoading: loading,
            className: "bg-linear-to-r from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30"
        },
        ...(auth.roles.includes('Administrator') || auth.designation === 'Supervision Engineer' ? [{
            label: "Export",
            icon: <DocumentArrowDownIcon className="w-4 h-4" />,
            variant: "flat", 
            color: "success",
            onPress: () => openModal('exportDailyWorkSummary'),
            className: "bg-linear-to-r from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30"
        }] : [])
    ];


    useEffect(() => {
        // Set initial startDate and endDate only if not manually changed
        if (!filterData.startDate || !filterData.endDate) {
            setFilterData(prevState => ({
                ...prevState,
                startDate: dayjs.min(...dates),
                endDate: dayjs.max(...dates),
            }));
        }
    }, [dates]);

    useEffect(() => {
        const filteredWorks = dailyWorkSummary.filter(work => {
            const workDate = dayjs(work.date);

            return (
                workDate.isBetween(filterData.startDate, filterData.endDate, null, '[]') &&
                (filterData.incharge === 'all' || !filterData.incharge || work.incharge === filterData.incharge)
            );
        });

        const merged = filteredWorks.reduce((acc, work) => {
            const date = dayjs(work.date).format('YYYY-MM-DD');

            if (!acc[date]) {
                acc[date] = { ...work };
            } else {
                acc[date].totalDailyWorks += work.totalDailyWorks;
                acc[date].resubmissions += work.resubmissions;
                acc[date].embankment += work.embankment;
                acc[date].structure += work.structure;
                acc[date].pavement += work.pavement;
                acc[date].pending += work.pending;
                acc[date].completed += work.completed;
                acc[date].rfiSubmissions += work.rfiSubmissions;
                acc[date].completionPercentage =
                    (acc[date].totalDailyWorks > 0 ? (acc[date].completed / acc[date].totalDailyWorks) * 100 : 0);
                acc[date].rfiSubmissionPercentage =
                    (acc[date].totalDailyWorks > 0 ? (acc[date].rfiSubmissions / acc[date].totalDailyWorks) * 100 : 0);
            }

            return acc;
        }, {});

        setFilteredData(Object.values(merged));
    }, [filterData, dailyWorkSummary]);

    return (
        <>
            <Head title={title} />

            {/* Modals */}
            {openModalType === 'exportDailyWorkSummary' && (
                <DailyWorkSummaryDownloadForm
                    open={openModalType === 'exportDailyWorkSummary'}
                    closeModal={closeModal}
                    filteredData={filteredData}
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
                        radius={getThemeRadius()}
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
                                                <ChartBarIcon 
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
                                                    Daily Work Summary
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
                                                    Overview of daily work statistics and progress
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
                                                        isLoading={button.isLoading}
                                                        className={`${button.className || ''} font-medium`}
                                                        radius={getThemeRadius()}
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
                        
                        <CardBody className="pt-6" style={{
                            fontFamily: `var(--fontFamily, "Inter")`,
                        }}>
                            {/* Quick Stats */}
                            <StatsCards stats={stats} />
                            
                            {/* Filters Section */}
                            <Card 
                                className="mb-6"
                                radius={getThemeRadius()}
                                style={{
                                    border: `var(--borderWidth, 1px) solid var(--theme-divider, #E4E4E7)`,
                                    borderRadius: `var(--borderRadius, 12px)`,
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                    backgroundColor: 'var(--theme-content2)',
                                }}
                            >
                                <CardBody className="p-4">
                                    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
                                        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center flex-1">
                                            <div className="flex items-center gap-2 mb-2 sm:mb-0">
                                                <CalendarIcon className="w-5 h-5 text-default-400" />
                                                <span className="text-sm text-default-600 whitespace-nowrap" style={{
                                                    fontFamily: `var(--fontFamily, "Inter")`,
                                                }}>
                                                    Date Range:
                                                </span>
                                            </div>
                                            <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                                                <DatePicker
                                                    label="Start date"
                                                    value={filterData.startDate}
                                                    onChange={(value) => handleFilterChange('startDate', value)}
                                                    size="sm"
                                                    variant="bordered"
                                                    radius={getThemeRadius()}
                                                    style={{
                                                        fontFamily: `var(--fontFamily, "Inter")`,
                                                    }}
                                                />
                                                <span className="text-sm text-default-500 px-2" style={{
                                                    fontFamily: `var(--fontFamily, "Inter")`,
                                                }}>
                                                    to
                                                </span>
                                                <DatePicker
                                                    label="End date"
                                                    value={filterData.endDate}
                                                    onChange={(value) => handleFilterChange('endDate', value)}
                                                    size="sm"
                                                    variant="bordered"
                                                    radius={getThemeRadius()}
                                                    style={{
                                                        fontFamily: `var(--fontFamily, "Inter")`,
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {(auth.roles.includes('Administrator') || auth.designation === 'Supervision Engineer') && (
                                            <div className="flex gap-2 items-center">
                                                <UserIcon className="w-5 h-5 text-default-400" />
                                                <Select
                                                    label="In Charge"
                                                    selectedKeys={filterData.incharge ? [String(filterData.incharge)] : ["all"]}
                                                    onSelectionChange={(keys) => {
                                                        const value = Array.from(keys)[0];
                                                        handleFilterChange('incharge', value === "all" ? "all" : value);
                                                    }}
                                                    size="sm"
                                                    variant="bordered"
                                                    radius={getThemeRadius()}
                                                    className="min-w-48"
                                                    style={{
                                                        fontFamily: `var(--fontFamily, "Inter")`,
                                                    }}
                                                >
                                                    <SelectItem key="all" value="all">All</SelectItem>
                                                    {inCharges.map(inCharge => (
                                                        <SelectItem key={inCharge.id} value={inCharge.id}>
                                                            {inCharge.name}
                                                        </SelectItem>
                                                    ))}
                                                </Select>
                                            </div>
                                        )}
                                    </div>
                                </CardBody>
                            </Card>

                            {/* Daily Work Summary Table */}
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
                                    <DailyWorkSummaryTable
                                        filteredData={filteredData}
                                        onRefresh={handleRefresh}
                                    />
                                </CardBody>
                            </Card>
                        </CardBody>
                    </Card>
                </motion.div>
            </div>
        </>
    );
};
DailyWorkSummary.layout = (page) => <App>{page}</App>;
export default DailyWorkSummary;
