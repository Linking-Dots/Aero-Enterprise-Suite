import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
    Avatar,
    Button,
    Input,
    Select,
    SelectItem,
    Switch,
    Spinner
} from "@heroui/react";
import { X } from 'lucide-react';
import { 
    CalendarDaysIcon, 
    ExclamationTriangleIcon,
    CheckCircleIcon 
} from '@heroicons/react/24/outline';

import { usePage } from '@inertiajs/react';
import { toast } from 'react-toastify';
import axios from 'axios';
import GlassDialog from "@/Components/GlassDialog.jsx";
import DepartmentEmployeeSelector from "@/Components/DepartmentEmployeeSelector.jsx";
import BulkCalendar from './BulkCalendar';
import BulkValidationPreview from './BulkValidationPreview';

const BulkLeaveModal = ({ 
    open, 
    onClose, 
    onSuccess,
    allUsers = [],
    departments = [],
    leavesData = { leaveTypes: [], leaveCountsByUser: {} },
    isAdmin = false,
    existingLeaves = [],
    publicHolidays = []
}) => {
    const { auth } = usePage().props;

    
    // Form state
    const [selectedDates, setSelectedDates] = useState([]);
    const [selectedDepartmentId, setSelectedDepartmentId] = useState(null);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [selectedLeaveType, setSelectedLeaveType] = useState('');
    const [reason, setReason] = useState('');
    const [allowPartialSuccess, setAllowPartialSuccess] = useState(false);
    
    // Dynamic leave types state (updated per user)
    const [userLeaveTypes, setUserLeaveTypes] = useState([]);
    const [loadingLeaveTypes, setLoadingLeaveTypes] = useState(false);
    
    // Validation state
    const [validationResults, setValidationResults] = useState([]);
    const [balanceImpact, setBalanceImpact] = useState(null);
    const [isValidating, setIsValidating] = useState(false);
    const [hasValidated, setHasValidated] = useState(false);
    
    // Submission state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    // Filter existing leaves for the selected user (only used as fallback)
    const userExistingLeaves = useMemo(() => {
        if (!existingLeaves || existingLeaves.length === 0) return [];
        return existingLeaves.filter(leave => leave.user_id === parseInt(selectedUserId));
    }, [existingLeaves, selectedUserId]);

    // Available leave types and counts
    const leaveTypes = useMemo(() => {
        return userLeaveTypes.length > 0 ? userLeaveTypes : (leavesData?.leaveTypes || []);
    }, [userLeaveTypes, leavesData]);

    const leaveCounts = useMemo(() => {
        // If we have user-specific leave types with balance info, use that
        if (userLeaveTypes.length > 0) {
            return userLeaveTypes.map(type => ({
                leave_type: type.type,
                days_used: type.used,
                total_days: type.days,
                remaining_days: type.remaining
            }));
        }
        // Fallback to leavesData
        return leavesData?.leaveCountsByUser?.[selectedUserId] || [];
    }, [userLeaveTypes, leavesData, selectedUserId]);

    // Fetch leave types with balances for specific user
    const fetchUserLeaveTypes = useCallback(async (userId) => {
        if (!userId) return;
        
        setLoadingLeaveTypes(true);
        try {
            const response = await axios.get(route('leaves.bulk.leave-types'), {
                params: {
                    user_id: userId,
                    year: new Date().getFullYear()
                }
            });

            if (response.data.success) {
                setUserLeaveTypes(response.data.leave_types);
            }
        } catch (error) {
            console.error('Failed to fetch user leave types:', error);
            // Fallback to original leaveTypes
            setUserLeaveTypes([]);
        } finally {
            setLoadingLeaveTypes(false);
        }
    }, []);

    // Fetch leave types when user changes
    useEffect(() => {
        if (open && selectedUserId && isAdmin) {
            fetchUserLeaveTypes(selectedUserId);
        } else if (open && selectedUserId && !isAdmin) {
            // For non-admin users, also fetch their leave types
            fetchUserLeaveTypes(selectedUserId);
        }
    }, [selectedUserId, open, isAdmin, fetchUserLeaveTypes]);

    // Initialize form when modal opens for current user
    useEffect(() => {
        if (open && auth?.user) {
            // Auto-select current user's department and set user
            const currentUser = allUsers?.find(user => user.id === auth.user.id);
            if (currentUser && currentUser.department_id && !isAdmin) {
                setSelectedDepartmentId(currentUser.department_id);
                setSelectedUserId(auth.user.id);
            } else if (isAdmin && !selectedDepartmentId && !selectedUserId) {
                // For admin, set to current user as default
                if (currentUser && currentUser.department_id) {
                    setSelectedDepartmentId(currentUser.department_id);
                    setSelectedUserId(auth.user.id);
                }
            }
        }
    }, [open, auth?.user, allUsers, isAdmin, selectedDepartmentId, selectedUserId]);

    // Reset form when modal closes
    useEffect(() => {
        if (!open) {
            setSelectedDates([]);
            setSelectedDepartmentId(null);
            setSelectedUserId(auth?.user?.id || null);
            setSelectedLeaveType('');
            setReason('');
            setAllowPartialSuccess(false);
            setValidationResults([]);
            setBalanceImpact(null);
            setHasValidated(false);
            setErrors({});
            setUserLeaveTypes([]);
        }
    }, [open, auth?.user?.id]);

    // Set initial leave type when leave types are available (only for new requests)
    useEffect(() => {
        if (leaveTypes.length > 0 && !selectedLeaveType && open && selectedUserId) {
            // Find a leave type with remaining days for the selected user
            const availableLeaveType = leaveTypes.find(lt => {
                // For user-specific leave types (with balance info)
                if (userLeaveTypes.length > 0) {
                    return lt.remaining > 0;
                }
                // For fallback to leavesData
                const leaveCount = leaveCounts?.find(lc => lc.leave_type === lt.type);
                const remaining = leaveCount ? (lt.days - leaveCount.days_used) : lt.days;
                return remaining > 0;
            });
            
            if (availableLeaveType) {
                setSelectedLeaveType(availableLeaveType.type);
            }
        }
    }, [leaveTypes, leaveCounts, userLeaveTypes, selectedLeaveType, open, selectedUserId]);

    // Validate dates
    const handleValidate = useCallback(async () => {
        if (selectedDates.length === 0) {
            const toastPromise = Promise.reject(new Error('No dates selected'));
            toast.promise(toastPromise, {
                error: 'Please select at least one date'
            });
            return;
        }
        
        if (!selectedLeaveType) {
            const toastPromise = Promise.reject(new Error('No leave type selected'));
            toast.promise(toastPromise, {
                error: 'Please select a leave type'
            });
            return;
        }
        
        if (!reason.trim() || reason.trim().length < 5) {
            const toastPromise = new Promise((resolve, reject) => {
                reject('Please provide a reason for leave (at least 5 characters)');
            });
            
            toast.promise(toastPromise, {
                error: {
                    render({ data }) {
                        return <>{data}</>;
                    },
                    icon: '🔴',
                    style: {
                        backdropFilter: 'blur(16px) saturate(200%)',
                        background: theme.glassCard.background,
                        border: theme.glassCard.border,
                        color: theme.palette.text.primary,
                    },
                },
            });
            return;
        }

        setIsValidating(true);
        setErrors({});
        
        try {
            const selectedLeaveTypeData = leaveTypes.find(lt => lt.type === selectedLeaveType);
            
            const response = await axios.post(route('leaves.bulk.validate'), {
                user_id: parseInt(selectedUserId),
                dates: selectedDates,
                leave_type_id: selectedLeaveTypeData?.id,
                reason: reason.trim()
            });

            if (response.data.success) {
                setValidationResults(response.data.validation_results);
                setBalanceImpact(response.data.estimated_balance_impact);
                setHasValidated(true);
                
                const conflictCount = response.data.validation_results.filter(r => r.status === 'conflict').length;
                const warningCount = response.data.validation_results.filter(r => r.status === 'warning').length;
                
                const toastPromise = Promise.resolve();
                if (conflictCount > 0) {
                    toast.promise(toastPromise, {
                        success: `${conflictCount} date(s) have conflicts. Please review before submitting.`
                    });
                } else if (warningCount > 0) {
                    toast.promise(toastPromise, {
                        success: `${warningCount} date(s) have warnings. You may proceed if acceptable.`
                    });
                } else {
                    toast.promise(toastPromise, {
                        success: 'All dates validated successfully!'
                    });
                }
            }
        } catch (error) {
            console.error('Validation error:', error);
            if (error.response?.status === 422) {
                setErrors(error.response.data.errors || {});
            }
            const toastPromise = Promise.reject(error);
            toast.promise(toastPromise, {
                error: error.response?.data?.message || 'Failed to validate dates'
            });
        } finally {
            setIsValidating(false);
        }
    }, [selectedDates, selectedLeaveType, reason, selectedUserId, leaveTypes]);

    // Submit bulk leave request
    const handleSubmit = useCallback(async () => {
        if (!hasValidated) {
            const toastPromise = Promise.reject(new Error('Not validated'));
            toast.promise(toastPromise, {
                error: 'Please validate dates before submitting'
            });
            return;
        }

        const conflictCount = validationResults.filter(r => r.status === 'conflict').length;
        if (conflictCount > 0 && !allowPartialSuccess) {
            const toastPromise = new Promise((resolve, reject) => {
                reject('Please resolve conflicts or enable partial success mode');
            });
            
            toast.promise(toastPromise, {
                error: {
                    render({ data }) {
                        return <>{data}</>;
                    },
                    icon: '🔴',
                    style: {
                        backdropFilter: 'blur(16px) saturate(200%)',
                        background: theme.glassCard.background,
                        border: theme.glassCard.border,
                        color: theme.palette.text.primary,
                    },
                },
            });
            return;
        }

        setIsSubmitting(true);

        // Follow exact same promise pattern as LeaveForm
        const promise = new Promise(async (resolve, reject) => {
            try {
                const selectedLeaveTypeData = leaveTypes.find(lt => lt.type === selectedLeaveType);
                
                const response = await axios.post(route('leaves.bulk.store'), {
                    user_id: parseInt(selectedUserId),
                    dates: selectedDates,
                    leave_type_id: selectedLeaveTypeData?.id,
                    reason: reason.trim(),
                    allow_partial_success: allowPartialSuccess
                });

             

                if (response.status === 200 || response.status === 201) {
                    // Pass the response data to parent component for optimized updates
                    // Follow the same pattern as single leave form
                    onSuccess?.(response.data);
                    onClose();
                    resolve([response.data.message || 'Bulk leave requests created successfully']);
                } else {
                    console.error('Unexpected response status:', response.status);
                    reject(`Unexpected response status: ${response.status}`);
                }
            } catch (error) {
                console.error('Full error object:', error);

                if (error.response) {
                    console.error('Error response status:', error.response.status);
                    console.error('Error response data:', error.response.data);
                    
                    if (error.response.status === 422) {
                        // Handle validation errors
                        setErrors(error.response.data.errors || {});
                        reject(error.response.data.error || 'Failed to submit bulk leave requests');
                    } else {
                        // Handle other HTTP errors
                        reject(`HTTP Error ${error.response.status}: ${error.response.data.message || 'An unexpected error occurred. Please try again later.'}`);
                    }
                } else if (error.request) {
                    console.error('No response received:', error.request);
                    reject('No response received from the server. Please check your internet connection.');
                } else {
                    console.error('Request setup error:', error.message);
                    reject('An error occurred while setting up the request.');
                }
            } finally {
                setIsSubmitting(false);
            }
        });

        // Use exact same toast promise structure as LeaveForm
        toast.promise(
            promise,
            {
                pending: {
                    render() {
                        return (
                                <div className="flex items-center">
                                    <Spinner size="sm" />
                                    <span className="ml-2">Creating bulk leave requests...</span>
                                </div>
                        );
                    },
                    icon: false,
                    style: {
                        backdropFilter: 'blur(16px) saturate(200%)',
                        background: theme.glassCard.background,
                        border: theme.glassCard.border,
                        color: theme.palette.text.primary,
                    },
                },
                success: {
                    render({ data }) {
                        return (
                            <>
                                {data.map((message, index) => (
                                    <div key={index}>{message}</div>
                                ))}
                            </>
                        );
                    },
                    icon: '🟢',
                    style: {
                        backdropFilter: 'blur(16px) saturate(200%)',
                        background: theme.glassCard.background,
                        border: theme.glassCard.border,
                        color: theme.palette.text.primary,
                    },
                },
                error: {
                    render({ data }) {
                        return (
                            <>
                                {data}
                            </>
                        );
                    },
                    icon: '🔴',
                    style: {
                        backdropFilter: 'blur(16px) saturate(200%)',
                        background: theme.glassCard.background,
                        border: theme.glassCard.border,
                        color: theme.palette.text.primary,
                    },
                },
            }
        );
    }, [hasValidated, validationResults, allowPartialSuccess, selectedUserId, selectedDates, selectedLeaveType, reason, onSuccess, onClose, leaveTypes, theme]);

    // Check if form is valid for validation
    const canValidate = selectedDates.length > 0 && selectedLeaveType && reason.trim().length >= 5;
    
    // Check if can submit
    const canSubmit = hasValidated && 
                     (validationResults.filter(r => r.status === 'conflict').length === 0 || allowPartialSuccess);

    return (
        <GlassDialog open={open} onClose={onClose} fullWidth maxWidth="lg">
            <div className="flex items-center p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 flex-1">
                    <CalendarDaysIcon style={{ width: 24, height: 24, color: theme.colors.primary }} />
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Add Bulk Leave
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            Select multiple dates and create leave requests in batch
                        </p>
                    </div>
                </div>
                <Button
                    isIconOnly
                    variant="light"
                    onPress={onClose}
                    isDisabled={isSubmitting}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                    <X size={20} />
                </Button>
            </div>
            
            <div className="py-6 px-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column: Calendar */}
                    <div>
                        <div className="sticky top-0">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <CalendarDaysIcon style={{ width: 20, height: 20 }} />
                                Select Dates
                            </h3>
                            <BulkCalendar
                                selectedDates={selectedDates}
                                onDatesChange={(dates) => {
                                    setSelectedDates(dates);
                                    setHasValidated(false); // Reset validation when dates change
                                }}
                                userId={selectedUserId}
                                fetchFromAPI={true} // Enable API-driven data fetching
                            />
                        </div>
                    </div>
                    
                    {/* Right Column: Form and Validation */}
                    <div>
                        <div className="flex flex-col gap-6">
                            {/* Form Controls */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                    Leave Details
                                </h3>
                                
                                <div className="flex flex-col gap-4">
                                    {/* Department & User Selection (Admin only) */}
                                    {isAdmin && allUsers.length > 0 && (
                                        <DepartmentEmployeeSelector
                                            selectedDepartmentId={selectedDepartmentId}
                                            selectedEmployeeId={selectedUserId}
                                            onDepartmentChange={setSelectedDepartmentId}
                                            onEmployeeChange={(empId) => {
                                                setSelectedUserId(empId);
                                                setSelectedLeaveType(''); // Reset leave type when user changes
                                                setHasValidated(false);
                                                setUserLeaveTypes([]); // Clear current user leave types
                                            }}
                                            allUsers={allUsers}
                                            departments={departments}
                                            showSearch={true}
                                            error={errors}
                                            theme={theme}
                                            variant="outlined"
                                            showAllOption={false}
                                            autoSelectFirstDepartment={false} // Let our initialization effect handle this
                                            required={true}
                                            disabled={isSubmitting || isValidating}
                                        />
                                    )}

                                    {/* Leave Type Selection */}
                                    <div>
                                        <Select
                                            label="Leave Type"
                                            selectedKeys={selectedLeaveType ? [selectedLeaveType] : []}
                                            onSelectionChange={(keys) => {
                                                const value = Array.from(keys)[0];
                                                setSelectedLeaveType(value);
                                                setHasValidated(false);
                                            }}
                                            isDisabled={isSubmitting || isValidating || loadingLeaveTypes}
                                            isInvalid={Boolean(errors.leave_type_id)}
                                            errorMessage={errors.leave_type_id}
                                        >
                                            {loadingLeaveTypes ? (
                                                <SelectItem key="loading" isDisabled>
                                                    Loading leave types...
                                                </SelectItem>
                                            ) : (
                                                leaveTypes.map((type) => {
                                                    // Handle both new structure (with balance info) and old structure
                                                    let remaining, isDisabled;
                                                    
                                                    if (userLeaveTypes.length > 0) {
                                                        // New structure with balance info
                                                        remaining = type.remaining;
                                                        isDisabled = remaining <= 0;
                                                    } else {
                                                        // Fallback to old structure
                                                        const leaveCount = leaveCounts?.find(lc => lc.leave_type === type.type);
                                                        remaining = leaveCount ? (type.days - leaveCount.days_used) : type.days;
                                                        isDisabled = remaining <= 0;
                                                    }
                                                    
                                                    return (
                                                        <SelectItem 
                                                            key={type.type} 
                                                            value={type.type}
                                                            isDisabled={isDisabled}
                                                            title={isDisabled ? 'No remaining leaves available' : ''}
                                                        >
                                                            <div className="flex justify-between w-full">
                                                                <span>{type.type}</span>
                                                                <span>
                                                                    ({remaining} remaining)
                                                                </span>
                                                            </div>
                                                        </SelectItem>
                                                    );
                                                })
                                            )}
                                        </Select>
                                    </div>

                                    {/* Remaining Leaves Display */}
                                    {selectedLeaveType && (
                                        <Input
                                            label="Remaining Leaves"
                                            value={(() => {
                                                const selectedType = leaveTypes.find(lt => lt.type === selectedLeaveType);
                                                
                                                // Handle both new structure (with balance info) and old structure
                                                let remaining, totalDays;
                                                
                                                if (userLeaveTypes.length > 0 && selectedType) {
                                                    // New structure with balance info
                                                    remaining = selectedType.remaining;
                                                    totalDays = selectedType.days;
                                                } else {
                                                    // Fallback to old structure
                                                    const leaveCount = leaveCounts?.find(lc => lc.leave_type === selectedLeaveType);
                                                    remaining = leaveCount ? (selectedType?.days - leaveCount.days_used) : selectedType?.days;
                                                    totalDays = selectedType?.days;
                                                }
                                                
                                                return `${remaining || 0} remaining of ${totalDays || 0} total`;
                                            })()}
                                            isReadOnly
                                        />
                                    )}

                                    {/* Reason */}
                                    <Input
                                        label="Reason for Leave"
                                        placeholder="Please provide a detailed reason for your leave request..."
                                        value={reason}
                                        onChange={(e) => {
                                            setReason(e.target.value);
                                            setHasValidated(false);
                                        }}
                                        isRequired
                                        isInvalid={Boolean(errors.reason) || (reason.length > 0 && reason.length < 5)}
                                        errorMessage={
                                            errors.reason || 
                                            (reason.length > 0 && reason.length < 5 ? "Reason must be at least 5 characters" : 
                                            `${reason.length}/500 characters`)
                                        }
                                        maxLength={500}
                                        isDisabled={isSubmitting || isValidating}
                                    />

                                    {/* Options */}
                                    <div className="flex items-start gap-3">
                                        <Switch
                                            isSelected={allowPartialSuccess}
                                            onValueChange={setAllowPartialSuccess}
                                            size="sm"
                                            isDisabled={isSubmitting || isValidating}
                                        />
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                Allow partial success
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                Valid dates will be processed even if some dates fail validation
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Summary Information */}
                            {selectedDates.length > 0 && (
                                <div 
                                    className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                                >
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                                        Selected Dates Summary
                                    </p>
                                    <p className="text-base font-medium text-gray-900 dark:text-white">
                                        <strong>{selectedDates.length}</strong> date{selectedDates.length !== 1 ? 's' : ''} selected
                                    </p>
                                    {selectedLeaveType && (
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Leave type: {selectedLeaveType}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Validation and Preview */}
                            <BulkValidationPreview
                                validationResults={validationResults}
                                balanceImpact={balanceImpact}
                                isValidating={isValidating}
                            />
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="flex justify-between items-center p-6 border-t border-gray-200 dark:border-gray-700 gap-4">
                <Button
                    variant="bordered"
                    onPress={onClose}
                    isDisabled={isSubmitting}
                    className="rounded-full"
                >
                    Cancel
                </Button>
                
                <div className="flex gap-2">
                    <Button
                        variant="bordered"
                        color="primary"
                        onPress={handleValidate}
                        isLoading={isValidating}
                        isDisabled={!canValidate || isSubmitting}
                        startContent={!isValidating && <ExclamationTriangleIcon style={{ width: 16, height: 16 }} />}
                        className="rounded-full"
                    >
                        {isValidating ? 'Validating...' : 'Validate Dates'}
                    </Button>
                    
                    <Button
                        variant="solid"
                        color="primary"
                        onPress={handleSubmit}
                        isLoading={isSubmitting}
                        isDisabled={!canSubmit || isValidating}
                        startContent={!isSubmitting && <CheckCircleIcon style={{ width: 16, height: 16 }} />}
                        className="rounded-full"
                    >
                        {isSubmitting ? 'Creating...' : `Create ${selectedDates.length} Leave Request${selectedDates.length !== 1 ? 's' : ''}`}
                    </Button>
                </div>
            </div>
        </GlassDialog>
    );
};

export default BulkLeaveModal;
