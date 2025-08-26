import React from 'react';
import { useTheme } from '@/Contexts/ThemeContext.jsx';
import { useMediaQuery } from '@/Hooks/useMediaQuery.js';
import { usePage } from "@inertiajs/react";

// Alpha utility function for creating transparent colors
const alpha = (color, opacity) => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};
import {
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Chip,
    Card,
    CardBody,
    Divider,
    ScrollShadow,
    Progress
} from "@heroui/react";
import {
    CalendarDaysIcon,
    ChartBarIcon,
    DocumentTextIcon,
    CheckCircleIcon,
    ClockIcon,
    ArrowPathIcon,
    BuildingOfficeIcon,
    DocumentIcon,
    MapPinIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import {
    CheckCircleIcon as CheckCircleSolid,
    ClockIcon as ClockSolid,
    ArrowPathIcon as ArrowPathSolid
} from '@heroicons/react/24/solid';
import GlassCard from "@/Components/GlassCard";


const DailyWorkSummaryTable = ({ filteredData }) => {
    const { auth } = usePage().props;
    const theme = useTheme(false, "OCEAN"); // Using default theme - you may want to get dark mode from context
    const isLargeScreen = useMediaQuery('(min-width: 1025px)');
    const isMediumScreen = useMediaQuery('(min-width: 641px) and (max-width: 1024px)');
    const isMobile = useMediaQuery('(max-width: 640px)');

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
    };

    const getPercentageColor = (percentage) => {
        if (percentage >= 100) return 'success';
        if (percentage >= 75) return 'warning';
        if (percentage >= 50) return 'primary';
        return 'danger';
    };

    const getPercentageIcon = (percentage) => {
        if (percentage >= 100) return <CheckCircleSolid className="w-3 h-3" />;
        if (percentage >= 50) return <ClockSolid className="w-3 h-3" />;
        return <ExclamationTriangleIcon className="w-3 h-3" />;
    };

    const getWorkTypeIcon = (type, count) => {
        const iconProps = "w-3 h-3";
        const baseColor = count > 0 ? "" : "text-gray-400";
        
        switch (type?.toLowerCase()) {
            case "embankment":
                return <BuildingOfficeIcon className={`${iconProps} text-amber-500 ${baseColor}`} />;
            case "structure":
                return <DocumentIcon className={`${iconProps} text-blue-500 ${baseColor}`} />;
            case "pavement":
                return <MapPinIcon className={`${iconProps} text-gray-500 ${baseColor}`} />;
            default:
                return <DocumentTextIcon className={`${iconProps} text-primary ${baseColor}`} />;
        }
    };

    // Mobile card component - matching the pattern from other tables
    const MobileSummaryCard = ({ summary }) => {
        const completionPercentage = summary.totalDailyWorks > 0
            ? (summary.completed / summary.totalDailyWorks * 100).toFixed(1)
            : 0;
        const rfiSubmissionPercentage = summary.rfiSubmissions > 0 && summary.completed > 0
            ? (summary.rfiSubmissions / summary.completed * 100).toFixed(1)
            : 0;
        const pending = summary.totalDailyWorks - summary.completed;

        return (
            <GlassCard className="mb-2" shadow="sm">
                <CardBody className="p-3">
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3 flex-1">
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-primary">
                                    {formatDate(summary.date)}
                                </span>
                                <span className="text-xs text-default-500">
                                    {summary.totalDailyWorks} total works
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Chip
                                size="sm"
                                variant="flat"
                                color={getPercentageColor(parseFloat(completionPercentage))}
                                startContent={getPercentageIcon(parseFloat(completionPercentage))}
                            >
                                {completionPercentage}%
                            </Chip>
                        </div>
                    </div>

                    <Divider className="my-3" />

                    {/* Progress bars */}
                    <div className="space-y-3 mb-3">
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-xs">
                                    Completion Progress
                                </span>
                                <span className="text-xs font-medium">
                                    {summary.completed}/{summary.totalDailyWorks}
                                </span>
                            </div>
                            <Progress
                                value={parseFloat(completionPercentage)}
                                color={getPercentageColor(parseFloat(completionPercentage))}
                                size="sm"
                                className="w-full"
                            />
                        </div>

                        {summary.rfiSubmissions > 0 && (
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs text-default-600">
                                        RFI Submission
                                    </span>
                                    <span className="text-xs font-medium">
                                        {summary.rfiSubmissions}/{summary.completed}
                                    </span>
                                </div>
                                <Progress
                                    value={parseFloat(rfiSubmissionPercentage)}
                                    color={getPercentageColor(parseFloat(rfiSubmissionPercentage))}
                                    size="sm"
                                    className="w-full"
                                />
                            </div>
                        )}
                    </div>

                    {/* Work type breakdown */}
                    <div className="grid grid-cols-3 gap-2">
                        <div className="flex flex-col items-center p-2 bg-white/5 rounded-lg">
                            {getWorkTypeIcon("embankment", summary.embankment)}
                            <span className="text-xs mt-1 text-default-600">
                                Embankment
                            </span>
                            <span className="text-xs font-medium">
                                {summary.embankment}
                            </span>
                        </div>
                        
                        <div className="flex flex-col items-center p-2 bg-white/5 rounded-lg">
                            {getWorkTypeIcon("structure", summary.structure)}
                            <span className="text-xs mt-1 text-default-600">
                                Structure
                            </span>
                            <span className="text-xs font-medium">
                                {summary.structure}
                            </span>
                        </div>
                        
                        <div className="flex flex-col items-center p-2 bg-white/5 rounded-lg">
                            {getWorkTypeIcon("pavement", summary.pavement)}
                            <span className="text-xs mt-1 text-default-600">
                                Pavement
                            </span>
                            <span className="text-xs font-medium">
                                {summary.pavement}
                            </span>
                        </div>
                    </div>

                    {/* Additional metrics */}
                    <Divider className="my-3" />
                    <div className="flex justify-between text-xs">
                        <div className="flex items-center gap-1">
                            <ArrowPathSolid className="w-3 h-3 text-warning" />
                            <span>Resubmissions: {summary.resubmissions}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <ClockSolid className="w-3 h-3 text-danger" />
                            <span>Pending: {pending}</span>
                        </div>
                    </div>
                </CardBody>
            </GlassCard>
        );
    };

    const renderCell = React.useCallback((summary, columnKey) => {
        const completionPercentage = summary.totalDailyWorks > 0
            ? (summary.completed / summary.totalDailyWorks * 100).toFixed(1)
            : 0;
        const rfiSubmissionPercentage = summary.rfiSubmissions > 0 && summary.completed > 0
            ? (summary.rfiSubmissions / summary.completed * 100).toFixed(1)
            : 0;
        const pending = summary.totalDailyWorks - summary.completed;

        switch (columnKey) {
            case "date":
                return (
                    <TableCell>
                        <div className="flex items-center gap-1">
                            <CalendarDaysIcon className="w-3 h-3 text-default-500" />
                            <span className="text-sm font-medium">
                                {formatDate(summary.date)}
                            </span>
                        </div>
                    </TableCell>
                );

            case "totalDailyWorks":
                return (
                    <TableCell>
                        <div className="flex items-center gap-1">
                            <DocumentTextIcon className="w-3 h-3 text-primary" />
                            <span className="text-sm font-bold">
                                {summary.totalDailyWorks}
                            </span>
                        </div>
                    </TableCell>
                );

            case "resubmissions":
                return (
                    <TableCell>
                        <div className="flex items-center gap-1">
                            <ArrowPathSolid className="w-3 h-3 text-warning" />
                            <span className="text-sm">
                                {summary.resubmissions}
                            </span>
                        </div>
                    </TableCell>
                );

            case "embankment":
            case "structure":
            case "pavement":
                return (
                    <TableCell>
                        <div className="flex items-center gap-1">
                            {getWorkTypeIcon(columnKey, summary[columnKey])}
                            <span className="text-sm">
                                {summary[columnKey]}
                            </span>
                        </div>
                    </TableCell>
                );

            case "completed":
                return (
                    <TableCell>
                        <div className="flex items-center gap-1">
                            <CheckCircleSolid className="w-3 h-3 text-success" />
                            <span className="text-sm font-medium text-success">
                                {summary.completed}
                            </span>
                        </div>
                    </TableCell>
                );

            case "pending":
                return (
                    <TableCell>
                        <div className="flex items-center gap-1">
                            <ClockSolid className="w-3 h-3 text-danger" />
                            <span className="text-sm font-medium text-danger">
                                {pending}
                            </span>
                        </div>
                    </TableCell>
                );

            case "completionPercentage":
                return (
                    <TableCell>
                        <div className="flex items-center gap-2">
                            <Progress
                                value={parseFloat(completionPercentage)}
                                color={getPercentageColor(parseFloat(completionPercentage))}
                                size="sm"
                                className="flex-1 min-w-[80px]"
                            />
                            <Chip
                                size="sm"
                                variant="flat"
                                color={getPercentageColor(parseFloat(completionPercentage))}
                                startContent={getPercentageIcon(parseFloat(completionPercentage))}
                            >
                                {completionPercentage}%
                            </Chip>
                        </div>
                    </TableCell>
                );

            case "rfiSubmissions":
                return (
                    <TableCell>
                        <div className="flex items-center gap-1">
                            <DocumentIcon className="w-3 h-3 text-info" />
                            <span className="text-sm">
                                {summary.rfiSubmissions}
                            </span>
                        </div>
                    </TableCell>
                );

            case "rfiSubmissionPercentage":
                return (
                    <TableCell>
                        <div className="flex items-center gap-2">
                            {summary.rfiSubmissions > 0 ? (
                                <>
                                    <Progress
                                        value={parseFloat(rfiSubmissionPercentage)}
                                        color={getPercentageColor(parseFloat(rfiSubmissionPercentage))}
                                        size="sm"
                                        className="flex-1 min-w-[80px]"
                                    />
                                    <Chip
                                        size="sm"
                                        variant="flat"
                                        color={getPercentageColor(parseFloat(rfiSubmissionPercentage))}
                                        startContent={getPercentageIcon(parseFloat(rfiSubmissionPercentage))}
                                    >
                                        {rfiSubmissionPercentage}%
                                    </Chip>
                                </>
                            ) : (
                                <span className="text-sm text-default-400">
                                    -
                                </span>
                            )}
                        </div>
                    </TableCell>
                );

            default:
                return <TableCell>{summary[columnKey]}</TableCell>;
        }
    }, []);

    const columns = [
        { name: "Date", uid: "date", icon: CalendarDaysIcon },
        { name: "Total Daily Works", uid: "totalDailyWorks", icon: DocumentTextIcon },
        { name: "Resubmissions", uid: "resubmissions", icon: ArrowPathIcon },
        { name: "Embankment", uid: "embankment", icon: BuildingOfficeIcon },
        { name: "Structure", uid: "structure", icon: DocumentIcon },
        { name: "Pavement", uid: "pavement", icon: MapPinIcon },
        { name: "Completed", uid: "completed", icon: CheckCircleIcon },
        { name: "Pending", uid: "pending", icon: ClockIcon },
        { name: "Completion %", uid: "completionPercentage", icon: ChartBarIcon },
        { name: "RFI Submissions", uid: "rfiSubmissions", icon: DocumentIcon },
        { name: "RFI Submission %", uid: "rfiSubmissionPercentage", icon: ChartBarIcon }
    ];

    if (isMobile) {
        return (
            <div className="space-y-4">
                <ScrollShadow className="max-h-[70vh]">
                    {filteredData?.map((summary, index) => (
                        <MobileSummaryCard key={index} summary={summary} />
                    ))}
                </ScrollShadow>
            </div>
        );
    }

    return (
        <div style={{ maxHeight: "70vh", overflowY: "auto" }}>
            <ScrollShadow className="max-h-[70vh]">
                <Table
                    isStriped
                    selectionMode="none"
                    isCompact
                    isHeaderSticky
                    removeWrapper
                    aria-label="Daily Work Summary Table"
                    classNames={{
                        wrapper: "min-h-[200px]",
                        table: "min-h-[300px]",
                        thead: "[&>tr]:first:shadow-small bg-default-100/80",
                        tbody: "divide-y divide-default-200/50",
                        tr: "group hover:bg-default-50/50 transition-colors h-12",
                        td: "py-2 px-3 text-sm",
                        th: "py-2 px-3 text-xs font-semibold"
                    }}
                >
                    <TableHeader columns={columns}>
                        {(column) => (
                            <TableColumn 
                                key={column.uid} 
                                className="bg-default-100/80 backdrop-blur-md"
                            >
                                <div className="flex items-center gap-1">
                                    {column.icon && <column.icon className="w-3 h-3" />}
                                    <span className="text-xs font-semibold">{column.name}</span>
                                </div>
                            </TableColumn>
                        )}
                    </TableHeader>
                    <TableBody 
                        items={filteredData || []}
                        emptyContent={
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <ChartBarIcon className="w-12 h-12 text-default-300 mb-4" />
                                <h6 className="text-lg font-semibold text-default-600 mb-2">
                                    No summary data found
                                </h6>
                                <p className="text-sm text-default-500">
                                    No work summary available for the selected period
                                </p>
                            </div>
                        }
                    >
                        {(summary) => (
                            <TableRow key={summary.date}>
                                {(columnKey) => renderCell(summary, columnKey)}
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </ScrollShadow>
        </div>
    );
};

export default DailyWorkSummaryTable;
