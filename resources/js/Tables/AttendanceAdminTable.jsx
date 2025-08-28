import React, {useMemo} from 'react';
import {
    Chip,
    Divider,
    ScrollShadow,
    Skeleton,
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow,
    Tooltip,
    User,
    Button,
    Card,
    CardBody,
    CardHeader
} from "@heroui/react";
import { useMediaQuery } from '@/Hooks/useMediaQuery.js';

import {CalendarDaysIcon, DocumentChartBarIcon, UserIcon, ArrowPathIcon} from '@heroicons/react/24/outline';
import {
    CheckCircleIcon as CheckSolid,
    ExclamationTriangleIcon as ExclamationSolid,
    MinusCircleIcon as MinusSolid,
    XCircleIcon as XSolid
} from '@heroicons/react/24/solid';
import dayjs from 'dayjs';

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


const AttendanceAdminTable = ({
                                  loading,
                                  attendanceData,
                                  currentYear,
                                  currentMonth,
                                  leaveTypes,
                                  leaveCounts,
                                  onRefresh
                              }) => {
    const isLargeScreen = useMediaQuery('(min-width: 1025px)');
    const isMediumScreen = useMediaQuery('(min-width: 641px) and (max-width: 1024px)');
    const isMobile = useMediaQuery('(max-width: 640px)');

    // Get the number of days in the current month
    const daysInMonth = dayjs(`${currentYear}-${currentMonth}-01`).daysInMonth();

    // Status mapping for different symbols with theme colors
    const statusMapping = {
        '√': {
            icon: CheckSolid, 
            color: 'var(--theme-success)', 
            bg: 'color-mix(in srgb, var(--theme-success) 20%, transparent)', 
            label: '√', 
            short: 'P'
        },
        '▼': {
            icon: XSolid, 
            color: 'var(--theme-danger)', 
            bg: 'color-mix(in srgb, var(--theme-danger) 20%, transparent)', 
            label: '▼', 
            short: 'A'
        },
        '#': {
            icon: ExclamationSolid, 
            color: 'var(--theme-warning)', 
            bg: 'color-mix(in srgb, var(--theme-warning) 20%, transparent)', 
            label: '#', 
            short: 'H'
        },
        '/': {
            icon: MinusSolid, 
            color: 'var(--theme-secondary)', 
            bg: 'color-mix(in srgb, var(--theme-secondary) 20%, transparent)', 
            label: '/', 
            short: 'L'
        },
    };

    // Memoized columns for better performance
    const columns = useMemo(() => [
        {label: 'No.', key: 'sl', icon: DocumentChartBarIcon, width: 60},
        {label: 'Employee', key: 'name', icon: UserIcon, width: 200},
        ...Array.from({length: daysInMonth}, (_, i) => {
            const day = i + 1;
            const date = dayjs(`${currentYear}-${currentMonth}-${day}`);
            return {
                label: `${day}`,
                sublabel: date.format('ddd'),
                key: `day-${day}`,
                width: 40,
                isWeekend: date.day() === 0 || date.day() === 6
            };
        }),
        ...(leaveTypes ? leaveTypes.map((type) => ({
            label: type.type,
            key: type.type,
            icon: CalendarDaysIcon,
            width: 80
        })) : [])
    ], [daysInMonth, currentYear, currentMonth, leaveTypes]);

    // Helper function to get status info
    const getStatusInfo = (status) => {
        return statusMapping[status] || {
            icon: null,
            color: 'var(--theme-foreground-500)',
            bg: 'color-mix(in srgb, var(--theme-content2) 50%, transparent)',
            label: 'No Data',
            short: '-'
        };
    };

    // Mobile card component for better mobile experience
    const MobileAttendanceCard = ({
                                      data,
                                      index,
                                      daysInMonth,
                                      currentMonth,
                                      currentYear,
                                      leaveTypes,
                                      leaveCounts,
                                  }) => {
        return (
            <Card 
                className="mb-2"
                style={{
                    background: `color-mix(in srgb, var(--theme-content1) 85%, transparent)`,
                    backdropFilter: 'blur(16px)',
                    border: `1px solid color-mix(in srgb, var(--theme-content2) 50%, transparent)`,
                    borderRadius: getThemeRadius(),
                }}
            >
                <CardBody className="p-3">
                    {/* User Info */}
                    <div className="flex items-center gap-3 mb-4">
                        <User
                            avatarProps={{
                                radius: getThemeRadius(),
                                size: "md",
                                src: data.profile_image_url || data.profile_image,
                                fallback: <UserIcon className="w-6 h-6"/>
                            }}
                            name={
                                <span className="text-sm font-medium" style={{
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                    color: `var(--theme-foreground, #000000)`,
                                }}>
                                    {data.name || 'Unknown'}
                                </span>
                            }
                            description={
                                <span className="text-xs" style={{
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                    color: `var(--theme-foreground-600, #71717A)`,
                                }}>
                                    Employee #{index + 1}
                                </span>
                            }
                        />
                    </div>

                    <Divider style={{
                        borderColor: `var(--theme-divider, #E4E4E7)`,
                    }} />

                    {/* Attendance Grid */}
                    <div className="grid grid-cols-7 gap-1 my-4">
                        {Array.from({ length: daysInMonth }, (_, i) => {
                            const day = i + 1;
                            const dateKey = dayjs(`${currentYear}-${currentMonth}-${day}`).format('YYYY-MM-DD');
                            const cellData = data[dateKey];
                            const isWeekend = dayjs(dateKey).day() === 0 || dayjs(dateKey).day() === 6;

                            const status = typeof cellData === 'object' ? (cellData?.status || '▼') : '▼';
                            const statusInfo = getStatusInfo(status);

                            return (
                                <Tooltip
                                    key={day}
                                    placement="top"
                                    content={
                                        <div className="text-sm space-y-1" style={{
                                            fontFamily: `var(--fontFamily, "Inter")`,
                                        }}>
                                            <div><strong>Status:</strong> {status}</div>
                                            <div><strong>Punch In:</strong> {cellData?.punch_in || '-'}</div>
                                            <div><strong>Punch Out:</strong> {cellData?.punch_out || '-'}</div>
                                            <div><strong>Work Hours:</strong> {cellData?.total_work_hours || '00:00'}</div>
                                            <div><strong>Remarks:</strong> {cellData?.remarks || 'N/A'}</div>
                                        </div>
                                    }
                                >
                                    <div
                                        className={`
                                        flex flex-col items-center justify-center p-1 rounded text-xs cursor-pointer
                                        transition-colors
                                        ${isWeekend ? 'bg-default-100' : 'bg-default-50'}
                                    `}
                                        style={{
                                            borderRadius: `var(--borderRadius, 6px)`,
                                            fontFamily: `var(--fontFamily, "Inter")`,
                                            backgroundColor: statusInfo.bg,
                                        }}
                                    >
                                        <span className="font-medium">{day}</span>
                                        <span>
                                            {statusInfo.icon ? (
                                                <statusInfo.icon 
                                                    className="w-3 h-3"
                                                    style={{ color: statusInfo.color }}
                                                />
                                            ) : (
                                                <span style={{ color: statusInfo.color }}>{status}</span>
                                            )}
                                        </span>
                                    </div>
                                </Tooltip>
                            );
                        })}
                    </div>

                    {/* Leave Summary */}
                    {leaveTypes?.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {leaveTypes.map((type) => {
                                const leaveCount = leaveCounts?.[data.user_id]?.[type.type] || 0;
                                return (
                                    <Chip
                                        key={type.type}
                                        size="sm"
                                        variant="flat"
                                        startContent={<CalendarDaysIcon className="w-3 h-3"/>}
                                        radius={getThemeRadius()}
                                        style={{
                                            background: leaveCount > 0 
                                                ? 'color-mix(in srgb, var(--theme-warning) 20%, transparent)'
                                                : 'color-mix(in srgb, var(--theme-content2) 50%, transparent)',
                                            border: `1px solid ${leaveCount > 0 
                                                ? 'color-mix(in srgb, var(--theme-warning) 40%, transparent)'
                                                : 'color-mix(in srgb, var(--theme-content3) 50%, transparent)'}`,
                                            color: leaveCount > 0 ? 'var(--theme-warning)' : 'var(--theme-foreground)',
                                            fontFamily: `var(--fontFamily, "Inter")`,
                                        }}
                                    >
                                        {type.type}: {leaveCount}
                                    </Chip>
                                );
                            })}
                        </div>
                    )}
                </CardBody>
            </Card>
        );
    };


    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Skeleton className="w-full h-full rounded-lg"/>
            </div>
        );
    }

    if (!attendanceData || attendanceData.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-8">
                <DocumentChartBarIcon className="w-12 h-12 text-default-300 mb-4"/>
                <span className="text-default-500" style={{
                    fontFamily: `var(--fontFamily, "Inter")`,
                }}>
                    No attendance data found
                </span>
            </div>
        );
    }

    if (isMobile) {
        return (
            <div className="space-y-4">
                <ScrollShadow className="max-h-[70vh]">
                    {attendanceData.map((data, index) => (
                        <MobileAttendanceCard
                            key={data.user_id || index}
                            data={data}
                            index={index}
                            daysInMonth={daysInMonth}
                            currentMonth={currentMonth}
                            currentYear={currentYear}
                            leaveTypes={leaveTypes}
                            leaveCounts={leaveCounts}
                        />
                    ))}
                </ScrollShadow>
            </div>
        );
    }

    return (
        <div>
            <ScrollShadow className="max-h-[70vh]">
                <Table
                    isStriped
                    isCompact={!isLargeScreen}
                    isHeaderSticky
                    removeWrapper
                    aria-label="Monthly Attendance Table"
                    radius={getThemeRadius()}
                    classNames={{
                        base: "max-h-[520px] overflow-auto",
                        table: "min-h-[200px] w-full",
                        thead: "z-10",
                        tbody: "overflow-y-auto",
                        th: "backdrop-blur-md",
                        td: "text-default-600",
                    }}
                    style={{
                        borderRadius: `var(--borderRadius, 12px)`,
                        fontFamily: `var(--fontFamily, "Inter")`,
                    }}
                >
                    <TableHeader columns={columns}>
                        {(column) => (
                            <TableColumn
                                key={column.key}
                                align={column.key === 'sl' || column.key.startsWith('day-') ? 'center' : 'start'}
                                className="bg-default-100/50 backdrop-blur-md"
                                width={column.width}
                                style={{
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                }}
                            >
                                <div className="flex flex-col items-center gap-1">
                                    <div className="flex items-center gap-1">
                                        {column.icon && <column.icon className="w-3 h-3"/>}
                                        <span className="text-xs font-medium">{column.label}</span>
                                    </div>
                                    {column.sublabel && (
                                        <span
                                            className={`text-xs ${column.isWeekend ? 'text-warning' : 'text-default-400'}`}>
                                            {column.sublabel}
                                        </span>
                                    )}
                                </div>
                            </TableColumn>
                        )}
                    </TableHeader>
                    <TableBody
                        items={attendanceData}
                        emptyContent={
                            <div className="flex flex-col items-center justify-center py-8">
                                <DocumentChartBarIcon className="w-12 h-12 text-default-300 mb-4"/>
                                <span className="text-default-500" style={{
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                }}>
                                    No attendance data found
                                </span>
                            </div>
                        }
                    >
                        {(data) => (
                            <TableRow key={data.user_id || data.id}>
                                {(columnKey) => {
                                    const index = attendanceData.findIndex(item =>
                                        (item.user_id || item.id) === (data.user_id || data.id)
                                    );

                                    switch (columnKey) {
                                        case 'sl':
                                            return (
                                                <TableCell className="text-center font-medium">
                                                    {index + 1}
                                                </TableCell>
                                            );

                                        case 'name':
                                            return (
                                                <TableCell className="whitespace-nowrap">
                                                    <User
                                                        avatarProps={{
                                                            radius: "lg",
                                                            size: isLargeScreen ? "md" : "sm",
                                                            src: data.profile_image_url || data.profile_image,
                                                            fallback: <UserIcon className="w-6 h-6"/>
                                                        }}
                                                        name={data.name || 'Unknown User'}
                                                        description={`Employee ID: ${data.employee_id}` || `ID: ${data.user_id}`}
                                                    />
                                                </TableCell>
                                            );

                                        default:
                                            // Handle day columns
                                            if (columnKey.startsWith('day-')) {
                                                const day = parseInt(columnKey.split('-')[1]);
                                                const dateKey = dayjs(`${currentYear}-${currentMonth}-${day}`).format('YYYY-MM-DD');
                                                const cellData = data[dateKey];
                                                const isWeekend = dayjs(dateKey).day() === 0 || dayjs(dateKey).day() === 6;

                                                const status = typeof cellData === 'object' ? cellData?.status || '▼' : '▼';
                                                const statusInfo = getStatusInfo(status);

                                                return (
                                                    <TableCell
                                                        className={`text-center ${isWeekend ? 'bg-default-50' : ''}`}>
                                                        <Tooltip
                                                            content={
                                                                <div className="text-sm space-y-1" style={{
                                                                    fontFamily: `var(--fontFamily, "Inter")`,
                                                                }}>
                                                                    <div><strong>Status:</strong> {status}</div>
                                                                    <div><strong>Punch In:</strong> {cellData?.punch_in || '-'}</div>
                                                                    <div><strong>Punch Out:</strong> {cellData?.punch_out || '-'}</div>
                                                                    <div><strong>Work Hours:</strong> {cellData?.total_work_hours || '00:00'}</div>
                                                                    <div><strong>Remarks:</strong> {cellData?.remarks || 'N/A'}</div>
                                                                </div>
                                                            }
                                                            placement="top"
                                                        >
                                                            <div className="flex items-center justify-center cursor-help">
                                                                {statusInfo.icon ? (
                                                                    <statusInfo.icon
                                                                        className="w-4 h-4"
                                                                        style={{ color: statusInfo.color }}
                                                                    />
                                                                ) : (
                                                                    <span
                                                                        className="text-xs"
                                                                        style={{ color: statusInfo.color }}
                                                                    >
                                                                        {status}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </Tooltip>
                                                    </TableCell>
                                                );

                                            }

                                            // Leave count columns
                                            const leaveType = leaveTypes?.find(type => type.type === columnKey);
                                            if (leaveType) {
                                                const leaveCount = leaveCounts?.[data.user_id]?.[leaveType.type] || 0;
                                                return (
                                                    <TableCell className="text-center">
                                                        <Chip
                                                            size="sm"
                                                            variant={leaveCount > 0 ? "flat" : "bordered"}
                                                            color={leaveCount > 0 ? "warning" : "default"}
                                                            className="min-w-8"
                                                            radius={getThemeRadius()}
                                                            style={{
                                                                fontFamily: `var(--fontFamily, "Inter")`,
                                                            }}
                                                        >
                                                            {leaveCount}
                                                        </Chip>
                                                    </TableCell>
                                                );
                                            }

                                            return <TableCell>-</TableCell>;
                                    }
                                }}
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </ScrollShadow>
        </div>
    );
};

export default AttendanceAdminTable;
