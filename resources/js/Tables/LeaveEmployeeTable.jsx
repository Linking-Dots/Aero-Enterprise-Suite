import React, { useState, useCallback } from "react";
import {
    PencilIcon as EditIcon,
    TrashIcon as DeleteIcon,
    EllipsisVerticalIcon as MoreVertIcon
} from '@heroicons/react/24/outline';
import { useTheme } from '@/Contexts/ThemeContext.jsx';
import { useMediaQuery } from '@/Hooks/useMediaQuery.js';

// Alpha utility function for creating transparent colors
const alpha = (color, opacity) => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};
import { usePage } from "@inertiajs/react";
import { toast } from "react-toastify";
import {
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    User,
    Tooltip,
    Pagination,
    Chip,
    Button,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Card,
    CardBody,
    Divider,
    ScrollShadow,
    Link,
    Avatar 
} from "@heroui/react";
import {
    CalendarDaysIcon,
    UserIcon,
    ClockIcon,
    DocumentTextIcon,
    EllipsisVerticalIcon,
    PencilIcon,
    TrashIcon,
    ClockIcon as ClockIconOutline,
    SunIcon,
    HeartIcon,
    BriefcaseIcon,
} from '@heroicons/react/24/outline';
import {
    CheckCircleIcon as CheckCircleSolid,
    XCircleIcon as XCircleSolid,
    ClockIcon as ClockSolid,
    ExclamationTriangleIcon as ExclamationTriangleSolid
} from '@heroicons/react/24/solid';
import axios from 'axios';
import GlassCard from "@/Components/GlassCard";
import { PhoneOff } from "lucide-react";




const LeaveEmployeeTable = React.forwardRef(({
    leaves,
    allUsers,
    handleClickOpen,
    setCurrentLeave,
    openModal,
    setLeaves,
    setCurrentPage,
    currentPage,
    totalRows,
    lastPage,
    perPage,
    selectedMonth,
    employee,
    isAdminView = false,
    onBulkApprove,
    onBulkReject,
    onBulkDelete,
    canApproveLeaves = false,
    canEditLeaves = false,
    canDeleteLeaves = false,
    fetchLeavesStats 
}, ref) => {
    const { auth } = usePage().props;
    const theme = useTheme(false, "OCEAN"); // Using default theme - you may want to get dark mode from context
    const isLargeScreen = useMediaQuery('(min-width: 1025px)');
    const isMediumScreen = useMediaQuery('(min-width: 641px) and (max-width: 1024px)');
    const isMobile = useMediaQuery('(max-width: 640px)');

    const [isUpdating, setIsUpdating] = useState(false);
    const [updatingLeave, setUpdatingLeave] = useState(null);

    const [selectedKeys, setSelectedKeys] = useState(new Set());

    const selectedValue = React.useMemo(
        () => Array.from(selectedKeys).join(", ").replaceAll("_", " "),
        [selectedKeys]
    );

    const topContent = React.useMemo(() => {
        const isAllSelected = selectedKeys === "all";
        const hasSelection = isAllSelected || selectedKeys.size > 0;
        const selectedCount = isAllSelected ? leaves.length : selectedKeys.size;
        
        return (
            <div className="flex flex-col gap-4">
                <div className="flex justify-between gap-3 items-end">
                    <div className="flex gap-3">
                        {hasSelection && onBulkDelete && (
                            <Button
                                color="danger"
                                variant="flat"
                                startContent={<TrashIcon className="w-4 h-4" />}
                                onPress={() => {
                                    const selectedLeavesArray = isAllSelected 
                                        ? leaves 
                                        : leaves.filter(leave => selectedKeys.has(leave.id.toString()));
                                    onBulkDelete(selectedLeavesArray);
                                }}
                            >
                                Delete {selectedCount} selected
                            </Button>
                        )}
                    </div>
                </div>
                {hasSelection && (
                    <span className="text-default-400 text-small">
                        {selectedCount} of {leaves.length} selected
                    </span>
                )}
            </div>
        );
    }, [selectedKeys, leaves, onBulkDelete]);
    const canViewLeaves = auth.permissions?.includes('leaves.view') || false;
    const canManageOwnLeaves = auth.permissions?.includes('leave.own.view') || false;
    const hasAdminAccess = isAdminView && (canApproveLeaves || canEditLeaves || canDeleteLeaves);

    // Permission-based access control (replacing role-based checks)
    const userIsAdmin = isAdminView || hasAdminAccess;
    const userIsSE = canApproveLeaves; // SE/Manager can approve leaves

    // Status configuration
    const statusConfig = {
        'New': {
            color: 'primary',
            icon: ExclamationTriangleSolid,
            bgColor: alpha(theme.colors.primary, 0.1),
            textColor: theme.colors.primary
        },
        'Pending': {
            color: 'warning',
            icon: ClockSolid,
            bgColor: alpha('#f59e0b', 0.1), // warning color
            textColor: '#f59e0b'
        },
        'Approved': {
            color: 'success',
            icon: CheckCircleSolid,
            bgColor: alpha('#10b981', 0.1), // success color
            textColor: '#10b981'
        },
        'Declined': {
            color: 'danger',
            icon: XCircleSolid,
            bgColor: alpha('#ef4444', 0.1), // danger color
            textColor: '#ef4444'
        }
    };

    const getLeaveTypeIcon = (type) => {
        switch (type?.toLowerCase()) {
            case "casual":
                return <BriefcaseIcon className="w-3 h-3 text-blue-500" />;
            case "weekend":
                return <SunIcon className="w-3 h-3 text-yellow-500" />;
            case "sick":
                return <HeartIcon className="w-3 h-3 text-red-500" />;
            case "earned":
                return <ClockIcon className="w-3 h-3 text-green-500" />;
            default:
                return <DocumentTextIcon className="w-3 h-3 text-primary" />;
        }
    };

    const handlePageChange = useCallback((page) => {
     
        if (setCurrentPage) {
            // When page changes, this will trigger fetchLeavesData in the parent component
            // which will load the correct data for the requested page
            setCurrentPage(page);
        }
    }, [setCurrentPage]);

    


    const updateLeaveStatus = useCallback(async (leave, newStatus) => {
    // If the leave is already in the desired status, resolve early and do not trigger loader or API
    if (leave.status === newStatus) {
        toast.info(`Leave is already ${newStatus}.`);
        return Promise.resolve(`The leave status is already updated to ${newStatus}`);
    }

    // Prevent multiple updates for the same leave/status action
    const actionKey = `${leave.id}-${newStatus}`;
    if (updatingLeave === actionKey) return;

    setUpdatingLeave(actionKey);

    const promise = new Promise(async (resolve, reject) => {
        try {
            const response = await axios.post(route("leave-update-status"), {
                id: leave.id,
                status: newStatus
            });

            if (response.status === 200) {
                setLeaves((prevLeaves) =>
                    prevLeaves.map((l) =>
                        l.id === leave.id ? { ...l, status: newStatus } : l
                    )
                );
                fetchLeavesStats();
                resolve(response.data.message || "Leave status updated successfully");
            } else {
                reject(response.data?.message || "Failed to update leave status");
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message ||
                error.response?.statusText ||
                "Failed to update leave status";
            reject(errorMsg);
        } finally {
            setUpdatingLeave(null);
        }
    });

    toast.promise(promise, {
        pending: "Updating leave status...",
        success: "Leave status updated successfully!",
        error: "Failed to update leave status"
    });

    return promise;
    }, [setLeaves, updatingLeave, fetchLeavesStats]);
    
    const getStatusChip = (status) => {
        const config = statusConfig[status] || statusConfig['New'];
        const StatusIcon = config.icon;

        return (
            <Chip
                size="sm"
                variant="flat"
                color={config.color}
                startContent={<StatusIcon className="w-3 h-3" />}
                classNames={{
                    base: "h-6",
                    content: "text-xs font-medium"
                }}
            >
                {status}
            </Chip>
        );
    };

    const getLeaveDuration = (fromDate, toDate) => {
        const from = new Date(fromDate);
        const to = new Date(toDate);
        const diffTime = Math.abs(to - from);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return diffDays === 1 ? '1 day' : `${diffDays} days`;
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
    };

    const getUserInfo = (userId) => {
        return allUsers?.find((u) => String(u.id) === String(userId)) || { name: 'Unknown User', phone: '' };
    };

    // Mobile card component for better mobile experience
    const MobileLeaveCard = ({ leave, updatingLeave, setCurrentLeave, openModal, handleClickOpen, updateLeaveStatus, canEditLeaves, canDeleteLeaves, canApproveLeaves, isAdminView }) => {
        const user = getUserInfo(leave.user_id);
        const duration = getLeaveDuration(leave.from_date, leave.to_date);
        const statusConf = statusConfig[leave.status] || statusConfig['New'];


        return (
            <GlassCard className="mb-2" shadow="sm">
                <CardBody className="p-3">
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3 flex-1">
                            {isAdminView && (
                                <User
                        avatarProps={{
                        radius: "lg",
                        size: "sm",
                        src: user?.profile_image_url || user?.profile_image,
                        showFallback: true, // Ensure fallback is always available
                        name: user?.name || "Unnamed User",
                        isBordered: true,
                        }}
                        description={
                        user?.phone ? (
                            <Link
                            href={`tel:${user?.phone}`}
                            size="sm"
                            className="text-xs text-blue-500 hover:underline"
                            >
                            {user?.phone}
                            </Link>
                        ) : (
                            <span className="flex items-center gap-1 text-xs text-gray-400 italic">
                            <PhoneOff className="w-3 h-3" /> No Phone
                            </span>
                        )
                        }
                        name={
                        <span className="text-sm font-medium">
                            {user?.name || "Unnamed User"}
                        </span>
                        }
                    />
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {getStatusChip(leave.status)}
                            {(canEditLeaves || canDeleteLeaves) && ( // Check specific permissions for dropdown
                                <Dropdown>
                                    <DropdownTrigger>
                                        <Button
                                            isIconOnly
                                            size="sm"
                                            variant="light"
                                            className="min-w-8 h-8"
                                        >
                                            <EllipsisVerticalIcon className="w-4 h-4" />
                                        </Button>
                                    </DropdownTrigger>
                                    <DropdownMenu aria-label="Leave actions">
                                        {canEditLeaves && (
                                            <DropdownItem
                                                key="edit"
                                                startContent={<PencilIcon className="w-4 h-4" />}
                                                onPress={() => {
                                           
                                                    setCurrentLeave(leave);
                                                    openModal("edit_leave");
                                                }}
                                            >
                                                Edit Leave
                                            </DropdownItem>
                                        )}
                                        {canDeleteLeaves && (
                                            <DropdownItem
                                                key="delete"
                                                className="text-danger"
                                                color="danger"
                                                startContent={<TrashIcon className="w-4 h-4" />}
                                                onPress={() => handleClickOpen(leave.id, "delete_leave")}
                                            >
                                                Delete Leave
                                            </DropdownItem>
                                        )}
                                    </DropdownMenu>
                                </Dropdown>
                            )}
                        </div>
                    </div>

                    <Divider className="my-3" />

                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <DocumentTextIcon className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium">
                                {leave.leave_type}
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <CalendarDaysIcon className="w-4 h-4 text-default-500" />
                            <span className="text-sm text-default-500">
                                {formatDate(leave.from_date)} - {formatDate(leave.to_date)}
                            </span>
                            <Chip size="sm" variant="bordered" color="default">
                                {duration}
                            </Chip>
                        </div>

                        {leave.reason && (
                            <div className="flex items-start gap-2">
                                <ClockIconOutline className="w-4 h-4 text-default-500 mt-0.5" />
                                <span className="text-sm text-default-500 flex-1">
                                    {leave.reason}
                                </span>
                            </div>
                        )}
                    </div>

                    {isAdminView && canApproveLeaves && (
                        <>
                            <Divider className="my-3" />
                            <div className="flex gap-2">
                                {['Approved', 'Declined'].map((status) => (
                                    <Button
                                        key={status}
                                        size="sm"
                                        variant={leave.status === status ? "solid" : "bordered"}
                                        color={statusConfig[status].color}
                                        isLoading={updatingLeave === `${leave.id}-${status}`}
                                        onPress={() => {
                                            if (updatingLeave === `${leave.id}-${status}`) return; // Prevent multiple clicks
                                            updateLeaveStatus(leave, status);
                                        }}
                                        startContent={
                                            updatingLeave !== `${leave.id}-${status}` ? 
                                            React.createElement(statusConfig[status].icon, {
                                                className: "w-3 h-3"
                                            }) : null
                                        }
                                        classNames={{
                                            base: "flex-1"
                                        }}
                                    >
                                        {status}
                                    </Button>
                                ))}
                            </div>
                        </>
                    )}
                </CardBody>
            </GlassCard>
        );
    };

    const renderCell = useCallback((leave, columnKey) => {
        
        const user = getUserInfo(leave.user_id);

        switch (columnKey) {
            case "employee":
                return (
                    <TableCell className="whitespace-nowrap">
                    <User
                        avatarProps={{
                        radius: "lg",
                        size: "sm",
                        src: user?.profile_image_url || user?.profile_image,
                        showFallback: true, // Ensure fallback is always available
                        name: user?.name || "Unnamed User",
                        isBordered: true,
                        }}
                        description={
                        user?.phone ? (
                            <Link
                            href={`tel:${user?.phone}`}
                            size="sm"
                            className="text-xs text-blue-500 hover:underline"
                            >
                            {user?.phone}
                            </Link>
                        ) : (
                            <span className="flex items-center gap-1 text-xs text-gray-400 italic">
                            <PhoneOff className="w-3 h-3" /> No Phone
                            </span>
                        )
                        }
                        name={
                        <span className="text-sm font-medium">
                            {user?.name || "Unnamed User"}
                        </span>
                        }
                    />
                    </TableCell>
                );

            case "leave_type":
                return (
                    <TableCell>
                        <div className="flex items-center gap-1">
                            {getLeaveTypeIcon(leave.leave_type)}
                            <span className="text-sm font-medium capitalize">
                                {leave.leave_type}
                            </span>
                        </div>
                    </TableCell>
                );
            case "from_date":
         
            case "to_date":
 
                return (
                    <TableCell>
                        <div className="flex items-center gap-1">
                            <CalendarDaysIcon className="w-3 h-3 text-default-500" />
                            <div>
                                <span className="text-sm">
                                    {formatDate(leave[columnKey])}
                                </span>
                                {columnKey === "from_date" && (
                                    <div className="text-xs text-default-500">
                                        {getLeaveDuration(leave.from_date, leave.to_date)}
                                    </div>
                                )}
                            </div>
                        </div>
                    </TableCell>
                );

            case "status":
                return (
                    <TableCell>
                        <div className="flex items-center gap-2">
                            {getStatusChip(leave.status)}
                            {isAdminView && canApproveLeaves && (
                                <Dropdown>
                                    <DropdownTrigger>
                                        <Button 
                                            isIconOnly 
                                            size="sm" 
                                            variant="light"
                                            isDisabled={updatingLeave && updatingLeave.startsWith(`${leave.id}-`)}
                                            onPress={() => {}} // Empty function for dropdown trigger
                                            className="min-w-8 h-8"
                                        >
                                            <EllipsisVerticalIcon className="w-4 h-4" />
                                        </Button>
                                    </DropdownTrigger>
                                    <DropdownMenu
                                        aria-label="Status actions"
                                        onAction={(key) => updateLeaveStatus(leave, key)}
                                    >
                                        {Object.keys(statusConfig).map((status) => {
                                            const config = statusConfig[status];
                                            const StatusIcon = config.icon;
                                            return (
                                                <DropdownItem
                                                    key={status}
                                                    startContent={<StatusIcon className="w-4 h-4" />}
                                                    color={config.color}
                                                >
                                                    {status}
                                                </DropdownItem>
                                            );
                                        })}
                                    </DropdownMenu>
                                </Dropdown>
                            )}
                        </div>
                    </TableCell>
                );

            case "reason":
                return (
                    <TableCell>
                        <Tooltip content={leave.reason || "No reason provided"}>
                            <span className="max-w-xs truncate cursor-help text-xs text-default-500">
                                {leave.reason || "No reason provided"}
                            </span>
                        </Tooltip>
                    </TableCell>
                );

            case "actions":
          
                return (
                    <TableCell>
                        <div className="flex items-center gap-1">
                            {canEditLeaves && (
                                <Tooltip content="Edit Leave">
                                    <Button
                                        isIconOnly
                                        size="sm"
                                        variant="light"
                                        color="primary"
                                        isDisabled={updatingLeave && updatingLeave.startsWith(`${leave.id}-`)}
                                        onPress={() => {
                                            if (updatingLeave && updatingLeave.startsWith(`${leave.id}-`)) return;
                                            setCurrentLeave(leave);
                                            openModal("edit_leave");
                                        }}
                                        className="min-w-8 h-8"
                                    >
                                        <PencilIcon className="w-4 h-4" />
                                    </Button>
                                </Tooltip>
                            )}
                            {canDeleteLeaves && (
                                <Tooltip content="Delete Leave" color="danger">
                                    <Button
                                        isIconOnly
                                        size="sm"
                                        variant="light"
                                        color="danger"
                                        isDisabled={updatingLeave && updatingLeave.startsWith(`${leave.id}-`)}
                                        onPress={() => {
                                            if (updatingLeave && updatingLeave.startsWith(`${leave.id}-`)) return;
                                            setCurrentLeave(leave);
                                            handleClickOpen(leave.id, "delete_leave");
                                        }}
                                        className="min-w-8 h-8"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </Button>
                                </Tooltip>
                            )}
                        </div>
                    </TableCell>
                );

            default:
                return <TableCell>{leave[columnKey]}</TableCell>;
        }
    }, [isAdminView, canApproveLeaves, isLargeScreen, updatingLeave, theme, setCurrentLeave, openModal, handleClickOpen, updateLeaveStatus]);

    const columns = [
        ...(isAdminView ? [{ name: "Employee", uid: "employee", icon: UserIcon }] : []),
        { name: "Leave Type", uid: "leave_type", icon: DocumentTextIcon },
        { name: "From Date", uid: "from_date", icon: CalendarDaysIcon },
        { name: "To Date", uid: "to_date", icon: CalendarDaysIcon },
        { name: "Status", uid: "status", icon: ClockIconOutline },
        { name: "Reason", uid: "reason", icon: DocumentTextIcon },
        ...(isAdminView ? [{ name: "Actions", uid: "actions" }] : [])
    ];

    if (isMobile) {
        return (
            <div className="space-y-4">
                <ScrollShadow className="max-h-[70vh]">
                    {leaves.map((leave) => (
                        <MobileLeaveCard
                            key={leave.id}
                            leave={leave}
                            updatingLeave={updatingLeave}
                            setCurrentLeave={setCurrentLeave}
                            openModal={openModal}
                            handleClickOpen={handleClickOpen}
                            updateLeaveStatus={updateLeaveStatus}
                            canEditLeaves={canEditLeaves}
                            canDeleteLeaves={canDeleteLeaves}
                            canApproveLeaves={canApproveLeaves}
                            isAdminView={isAdminView}
                        />
                    ))}
                </ScrollShadow>
                {totalRows > perPage && (
                    <div className="flex justify-center pt-4">
                        <Pagination
                            showControls
                            showShadow
                            color="primary"
                            variant="bordered"
                            page={currentPage}
                            total={lastPage}
                            onChange={handlePageChange}
                            size="sm"
                        />
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="max-h-[84vh] overflow-y-auto">
            <ScrollShadow className="max-h-[70vh]">
                <Table
                    isStriped
                    selectionMode="multiple"
                    selectedKeys={selectedKeys}
                    onSelectionChange={setSelectedKeys}
                    topContent={topContent}
                    topContentPlacement="outside"
                    isCompact
                    isHeaderSticky
                    removeWrapper
                    aria-label="Leave Management Table"
                    disabledBehavior="selection"
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
                                align={column.uid === "actions" ? "center" : "start"}
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
                        items={leaves}
                        emptyContent={
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <CalendarDaysIcon className="w-12 h-12 text-default-300 mb-4" />
                                <h6 className="text-lg font-semibold text-default-500">
                                    No leaves found
                                </h6>
                                <p className="text-sm text-default-500">
                                    {employee ? `No leaves found for "${employee}"` : "No leave requests for the selected period"}
                                </p>
                            </div>
                        }
                    >
                        {(leave) => (
                            <TableRow 
                                key={leave.id} 
                            >
                                {(columnKey) => renderCell(leave, columnKey)}
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </ScrollShadow>
            {totalRows > perPage && (
                <div className="py-4 flex justify-center">
                    <Pagination
                        showControls
                        showShadow
                        color="primary"
                        variant="bordered"
                        page={currentPage}
                        total={lastPage}
                        onChange={handlePageChange}
                        size={isMediumScreen ? "sm" : "md"}
                    />
                    <div className="ml-4 text-xs text-gray-500">
                        Page {currentPage} of {lastPage} (Total: {totalRows} records)
                    </div>
                </div>
            )}
        </div>
    );
});

LeaveEmployeeTable.displayName = 'LeaveEmployeeTable';

export default LeaveEmployeeTable;