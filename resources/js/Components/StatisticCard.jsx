import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import GlassCard from "@/Components/GlassCard.jsx";
import { 
    ClipboardDocumentListIcon,
    CheckCircleIcon,
    ClockIcon,
    DocumentTextIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';
import { Skeleton, Card } from '@heroui/react';

// Theme colors matching the original
const colors = {
    blue: '#2563eb',
    green: '#16a34a',
    orange: '#ea580c',
    yellow: '#ca8a04'
};

const StatisticCard = ({ title, value, icon: IconComponent, color, isLoaded, testId }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="h-full w-full"
    >
        <GlassCard className="h-full w-full">
            <div className="p-3 sm:p-4 h-full w-full flex flex-col">
                <Skeleton 
                    className="rounded-lg" 
                    isLoaded={isLoaded}
                    data-testid={testId}
                >
                    <div 
                        className="flex flex-col gap-2 h-full"
                        role="region"
                        aria-label={`${title} statistics`}
                    >
                        {/* Header */}
                        <div className="flex justify-between items-start">
                            <h3 className="text-xs sm:text-sm md:text-base font-medium text-foreground-600 leading-tight flex-1 mr-1">
                                {title}
                            </h3>
                            <div
                                className="rounded-xl p-1.5 flex items-center justify-center min-w-[40px] sm:min-w-[48px] min-h-[40px] sm:min-h-[48px] flex-shrink-0"
                                style={{ backgroundColor: `${color}20` }}
                            >
                                <IconComponent 
                                    className="w-6 h-6 stroke-2"
                                    style={{ color: color }}
                                    aria-hidden="true"
                                />
                            </div>
                        </div>

                        {/* Value */}
                        <div className="mt-auto">
                            <div 
                                className="text-2xl sm:text-3xl md:text-4xl lg:text-3xl xl:text-4xl font-bold text-foreground leading-none"
                                aria-live="polite"
                            >
                                {typeof value === 'number' ? value.toLocaleString() : value}
                            </div>
                        </div>
                    </div>
                </Skeleton>
            </div>
        </GlassCard>
    </motion.div>
);

const StatisticsWidgets = () => {
    const [statistics, setStatistics] = useState({
        total: 0,
        completed: 0,
        pending: 0,
        rfi_submissions: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();
        
        const fetchStatistics = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const response = await axios.get(route('stats'), {
                    signal: controller.signal,
                    timeout: 10000 // 10 second timeout
                });
                
                if (isMounted && response.data?.statistics) {
                    setStatistics(response.data.statistics);
                } else {
                    throw new Error('Invalid response structure');
                }
            } catch (err) {
                if (isMounted && !controller.signal.aborted) {
                    console.error('Failed to fetch statistics:', err);
                    setError(err.message);
                    setStatistics({
                        total: 0,
                        completed: 0,
                        pending: 0,
                        rfi_submissions: 0
                    });
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchStatistics();

        return () => {
            isMounted = false;
            controller.abort();
        };
    }, []);

    const statisticsConfig = [
        {
            id: 'total-daily-works',
            title: 'Total Daily Works',
            value: statistics.total,
            icon: ClipboardDocumentListIcon,
            color: colors.blue,
            testId: 'stat-total-works'
        },
        {
            id: 'completed-daily-works',
            title: 'Completed Daily Works',
            value: statistics.completed,
            icon: CheckCircleIcon,
            color: colors.green,
            testId: 'stat-completed-works'
        },
        {
            id: 'pending-daily-works',
            title: 'Pending Daily Works',
            value: statistics.pending,
            icon: ClockIcon,
            color: colors.orange,
            testId: 'stat-pending-works'
        },
        {
            id: 'rfi-submissions',
            title: 'RFI Submissions',
            value: statistics.rfi_submissions,
            icon: DocumentTextIcon,
            color: colors.blue,
            testId: 'stat-rfi-submissions'
        }
    ];

    if (error) {
        return (
            <div className="flex-grow pt-2 pr-2 pl-2 h-full flex items-center justify-center">
                <Card className="p-4 bg-danger-50 border-danger-200">
                    <p className="text-danger text-base">
                        Failed to load statistics: {error}
                    </p>
                </Card>
            </div>
        );
    }

    return (
        <section 
            className="flex-grow pt-2 pr-2 pl-2 h-full w-full"
            aria-label="Statistics Dashboard"
        >
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-2 sm:gap-2 md:gap-2 h-full max-w-7xl mx-auto">
                {statisticsConfig.map((stat, index) => (
                    <div key={stat.id} className="w-full">
                        <StatisticCard
                            title={stat.title}
                            value={stat.value}
                            icon={stat.icon}
                            color={stat.color}
                            isLoaded={!loading}
                            testId={stat.testId}
                        />
                    </div>
                ))}
            </div>
        </section>
    );
};

export default StatisticsWidgets;