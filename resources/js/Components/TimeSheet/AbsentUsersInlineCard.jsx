import React, { useState, useMemo } from 'react';
import {
    Avatar,
    Input,
    Button
} from "@heroui/react";
import { motion, AnimatePresence } from 'framer-motion';

import dayjs from "dayjs";
import { 
    MagnifyingGlassIcon,
    CalendarDaysIcon,
    ClockIcon,
    UserIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
    XCircleIcon,
    ChevronDownIcon,

   
} from '@heroicons/react/24/outline';


import PageHeader from '@/Components/PageHeader';


// Inline AbsentUsersCard component for the combined layout
export const AbsentUsersInlineCard = React.memo(({ absentUsers, selectedDate, getUserLeave }) => {
    const [visibleUsersCount, setVisibleUsersCount] = useState(5);
    const [searchTerm, setSearchTerm] = useState('');

    // Filter absent users based on search term
    const filteredAbsentUsers = useMemo(() => {
        if (!searchTerm.trim()) {
            return absentUsers;
        }
        
        const searchLower = searchTerm.toLowerCase();
        return absentUsers.filter(user => {
            const name = user.name?.toLowerCase() || '';
            const employeeId = user.employee_id?.toString().toLowerCase() || '';
            const email = user.email?.toLowerCase() || '';
            const phone = user.phone?.toString().toLowerCase() || '';
            
            return name.includes(searchLower) ||
                   employeeId.includes(searchLower) ||
                   email.includes(searchLower) ||
                   phone.includes(searchLower);
        });
    }, [absentUsers, searchTerm]);

    const handleLoadMore = () => {
        setVisibleUsersCount((prev) => prev + 5);
    };

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
        setVisibleUsersCount(5); // Reset visible count when searching
    };

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
    const totalRows = filteredAbsentUsers.length;
    if (absentUsers.length === 0) {
        return (
            <div className="h-full">
                <PageHeader
                    title="Perfect Attendance!"
                    subtitle={`No employees are absent on ${dayjs(selectedDate).format('MMMM D, YYYY')}`}
                    icon={<CheckCircleIcon className="w-6 h-6" />}
                    variant="gradient"
                    actionButtons={[
                        {
                            label: "0",
                            variant: "flat",
                            color: "success",
                            icon: <CheckCircleIcon className="w-4 h-4" />,
                            className: "bg-green-500/10 text-green-500 border-green-500/20"
                        }
                    ]}
                />
                <div 
                    role="region"
                    aria-label="No absent employees today"
                    className="text-center py-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg h-96 flex flex-col items-center justify-center"
                >
                    <CheckCircleIcon className="w-12 h-12 text-success mx-auto mb-4" />
                    <p className="text-success mb-2 text-sm font-medium">
                        Perfect Attendance!
                    </p>
                    <p className="text-gray-500 dark:text-gray-400 text-xs">
                        No employees are absent today.
                    </p>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 block text-xs">
                        All employees are either present or on approved leave.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full">
            <div className="mb-4 flex items-center justify-between">
                <div className="mb-4">
                    <h3 className="font-semibold text-red-600 flex items-center gap-2 text-lg">
                        <XCircleIcon className="w-5 h-5" />
                        Absent Employees ({totalRows})
                    </h3>
                </div>
            </div>
            {/* Search Input */}
            <div className="mb-3 m-2">
                <Input
                    type="text"
                    placeholder="Search absent employees..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                    variant="bordered"
                    aria-label="Search absent employees"
                    classNames={{
                        inputWrapper: "bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 h-10",
                        input: "text-sm"
                    }}
                />
            </div>

            {/* Show search results count */}
            {searchTerm && (
                <div className="mb-2">
                    <p className="text-gray-500 dark:text-gray-400 text-xs">
                        {filteredAbsentUsers.length} of {absentUsers.length} employees found
                    </p>
                </div>
            )}

            {/* Show message if no results found */}
            {searchTerm && filteredAbsentUsers.length === 0 && (
                <div className="text-center py-8 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg">
                    <MagnifyingGlassIcon className="w-8 h-8 text-default-300 mx-auto mb-2" />
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                        No employees found matching "{searchTerm}"
                    </p>
                </div>
            )}

            <div 
                role="region"
                aria-label="Absent employees list"
                className="overflow-y-auto max-h-[520px]"
            >
                <AnimatePresence>
                    {filteredAbsentUsers.slice(0, visibleUsersCount).map((user) => {
                        const userLeave = getUserLeave(user.id);
                        
                        return (
                            <motion.div
                                key={user.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.2 }}
                                className="p-3 m-2 bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/15 transition-all duration-200 rounded-lg"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2 flex-1">
                                        <Avatar 
                                            src={user.profile_image_url || user.profile_image} 
                                            name={user.name}
                                            isBordered
                                            size="sm"
                                            showFallback
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                                                {user.name}
                                            </p>
                                            {user.employee_id && (
                                                <p className="block text-xs text-gray-500 dark:text-gray-400">
                                                    ID: {user.employee_id}
                                                </p>
                                            )}
                                            {userLeave ? (
                                                <div className="flex flex-col gap-1 mt-1">
                                                    <p className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                                        <CalendarDaysIcon className="w-3 h-3" />
                                                        {userLeave.from_date === userLeave.to_date 
                                                            ? userLeave.from_date 
                                                            : `${userLeave.from_date} - ${userLeave.to_date}`
                                                        }
                                                    </p>
                                                    <p className="flex items-center gap-1 text-xs text-primary">
                                                        {getLeaveStatusIcon(userLeave.status)}
                                                        {userLeave.leave_type} Leave
                                                    </p>
                                                </div>
                                            ) : (
                                                <p className="flex items-center gap-1 mt-1 text-xs text-red-600">
                                                    <ExclamationTriangleIcon className="w-3 h-3" />
                                                    Absent without leave
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    {userLeave && (
                                        <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-md px-1.5 py-0.5 ml-2">
                                            <div className="flex items-center gap-1">
                                                {getLeaveStatusIcon(userLeave.status)}
                                                <span className={`font-semibold text-xs ${
                                                    userLeave.status?.toLowerCase() === 'approved' ? 'text-green-600' :
                                                    userLeave.status?.toLowerCase() === 'rejected' ? 'text-red-600' :
                                                    'text-orange-600'
                                                }`}>
                                                    {userLeave.status}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
                {visibleUsersCount < filteredAbsentUsers.length && (
                    <div className="text-center mt-4 pb-4">
                        <Button 
                            variant="bordered" 
                            onPress={handleLoadMore}
                            startContent={<ChevronDownIcon className="w-4 h-4" />}
                            size="sm"
                            color="warning"
                            fullWidth
                        >
                            Show More ({filteredAbsentUsers.length - visibleUsersCount} remaining)
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
});