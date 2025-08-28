import React, { useState, useEffect, useMemo } from 'react';
import {
    Button,
    Input,
    Textarea,
    Select,
    SelectItem,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Divider,
    User
} from "@heroui/react";
import {
    UserPlusIcon,
    ClockIcon,
    CalendarDaysIcon,
    InformationCircleIcon,
    MapPinIcon
} from "@heroicons/react/24/outline";
import { toast } from "react-toastify";
import { format } from 'date-fns';
import axios from 'axios';
import dayjs from 'dayjs';

const MarkAsPresentForm = ({ 
    open, 
    closeModal, 
    selectedDate,
    allUsers,
    refreshTimeSheet,
    currentUser = null
}) => {
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
    
    // Form state
    const [formData, setFormData] = useState({
        user_id: '',
        date: selectedDate,
        punch_in_time: '09:00',
        punch_out_time: '',
        reason: '',
        location: 'Office - Manually marked present by admin'
    });
    
    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);

    // Initialize form data
    useEffect(() => {
        if (currentUser) {
            setFormData(prev => ({
                ...prev,
                user_id: currentUser.id,
                date: selectedDate,
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                user_id: '',
                date: selectedDate,
                punch_in_time: '09:00',
                punch_out_time: '',
                reason: '',
                location: 'Office - Manually marked present by admin'
            }));
        }
        setErrors({});
    }, [currentUser, selectedDate, open]);

    // Filter out employees who already have attendance
    const availableUsers = useMemo(() => {
        // This would ideally be filtered by the backend,
        // but for now we'll show all users and handle conflicts in the backend
        return allUsers?.filter(user => user.roles?.some(role => role.name === 'Employee')) || [];
    }, [allUsers]);

    // Handle form field changes
    const handleFieldChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        
        // Clear errors for this field
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: undefined
            }));
        }
    };

    // Calculate work duration
    const workDuration = useMemo(() => {
        if (formData.punch_in_time && formData.punch_out_time) {
            const punchIn = dayjs(`${formData.date} ${formData.punch_in_time}`);
            const punchOut = dayjs(`${formData.date} ${formData.punch_out_time}`);
            
            if (punchOut.isAfter(punchIn)) {
                const duration = punchOut.diff(punchIn, 'minute');
                const hours = Math.floor(duration / 60);
                const minutes = duration % 60;
                return `${hours}h ${minutes}m`;
            }
        }
        return null;
    }, [formData.punch_in_time, formData.punch_out_time, formData.date]);

    // Handle form submission
    const handleSubmit = async (event) => {
        event.preventDefault();
        setProcessing(true);
        setErrors({});

        try {
            const submitData = {
                user_id: formData.user_id,
                date: formData.date,
                punch_in_time: formData.punch_in_time,
                punch_out_time: formData.punch_out_time || null,
                reason: formData.reason || 'Marked present by administrator',
                location: formData.location
            };

            const response = await axios.post(route('attendance.mark-as-present'), submitData);

            if (response.status === 200) {
                toast.success(response.data.message || 'User marked as present successfully!');
                refreshTimeSheet();
                closeModal();
            }
        } catch (error) {
            if (error.response?.status === 422) {
                setErrors(error.response.data.errors || {});
                toast.error(error.response.data.message || 'Please check the form for errors');
            } else {
                toast.error(error.response?.data?.message || 'Failed to mark user as present');
            }
        } finally {
            setProcessing(false);
        }
    };

    // Get selected user details
    const selectedUser = availableUsers.find(user => user.id == formData.user_id);

    return (
        <Modal 
            isOpen={open} 
            onClose={closeModal}
            size="2xl"
            radius={getThemeRadius()}
            scrollBehavior="inside"
            classNames={{
                base: "backdrop-blur-md mx-2 my-2 sm:mx-4 sm:my-8 max-h-[95vh]",
                backdrop: "bg-black/50 backdrop-blur-sm",
                header: "border-b border-divider",
                body: "overflow-y-auto",
                footer: "border-t border-divider",
                closeButton: "hover:bg-white/5 active:bg-white/10"
            }}
            style={{
                border: `var(--borderWidth, 2px) solid var(--theme-divider, #E4E4E7)`,
                borderRadius: `var(--borderRadius, 12px)`,
                fontFamily: `var(--fontFamily, "Inter")`,
                transform: `scale(var(--scale, 1))`,
            }}
        >
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1" style={{
                            borderColor: `var(--theme-divider, #E4E4E7)`,
                            fontFamily: `var(--fontFamily, "Inter")`,
                        }}>
                            <div className="flex items-center gap-2">
                                <UserPlusIcon className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                                <span className="text-lg font-semibold" style={{
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                }}>
                                    Mark Employee as Present
                                </span>
                            </div>
                        </ModalHeader>
                        
                        <form onSubmit={handleSubmit}>
                            <ModalBody className="py-4 px-4 sm:py-6 sm:px-6" style={{
                                fontFamily: `var(--fontFamily, "Inter")`,
                            }}>
                                <div className="space-y-6">
                                    {/* Employee Selection Section */}
                                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <UserPlusIcon className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                            <h3 className="text-base font-semibold" style={{ color: 'var(--theme-foreground)' }}>
                                Employee Selection
                            </h3>
                        </div>                                        <div className="grid grid-cols-1 gap-4">
                                            {/* Employee Selection */}
                                            <Select
                                                label="Select Employee"
                                                placeholder="Choose an employee to mark as present"
                                                selectedKeys={formData.user_id ? new Set([formData.user_id.toString()]) : new Set()}
                                                onSelectionChange={(keys) => {
                                                    const value = Array.from(keys)[0];
                                                    handleFieldChange('user_id', value || '');
                                                }}
                                                isInvalid={Boolean(errors.user_id)}
                                                errorMessage={errors.user_id}
                                                variant="bordered"
                                                size="sm"
                                                radius={getThemeRadius()}
                                                classNames={{
                                                    trigger: "min-h-unit-12",
                                                    value: "text-small"
                                                }}
                                                style={{
                                                    fontFamily: `var(--fontFamily, "Inter")`,
                                                }}
                                                renderValue={(items) => {
                                                    return items.map((item) => {
                                                        const user = availableUsers.find(u => u.id.toString() === item.key);
                                                        return user ? (
                                                            <div key={item.key} className="flex items-center gap-2">
                                                                <span>{user.name}</span>
                                                                <span className="text-xs text-default-500">({user.employee_id})</span>
                                                            </div>
                                                        ) : null;
                                                    });
                                                }}
                                            >
                                                {availableUsers.map((user) => (
                                                    <SelectItem 
                                                        key={user.id.toString()} 
                                                        value={user.id.toString()}
                                                        textValue={`${user.name} (${user.employee_id})`}
                                                    >
                                                        <User
                                                            avatarProps={{
                                                                size: "sm",
                                                                src: user.profile_image_url,
                                                                showFallback: true,
                                                                name: user.name,
                                                            }}
                                                            description={`ID: ${user.employee_id}`}
                                                            name={user.name}
                                                        />
                                                    </SelectItem>
                                                ))}
                                            </Select>

                                            {/* Date Display */}
                                            <Input
                                                label="Date"
                                                type="date"
                                                value={formData.date}
                                                onValueChange={(value) => handleFieldChange('date', value)}
                                                isInvalid={Boolean(errors.date)}
                                                errorMessage={errors.date}
                                                variant="bordered"
                                                size="sm"
                                                radius={getThemeRadius()}
                                                startContent={<CalendarDaysIcon className="w-4 h-4 text-default-400" />}
                                                classNames={{
                                                    input: "text-small",
                                                    inputWrapper: "min-h-unit-10"
                                                }}
                                                style={{
                                                    fontFamily: `var(--fontFamily, "Inter")`,
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <Divider style={{ background: `var(--theme-divider)` }} />

                                    {/* Time Section */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <ClockIcon className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                                                <h3 className="text-base font-semibold" style={{ color: 'var(--theme-foreground)' }}>
                                                    Working Hours
                                                </h3>
                                            </div>
                                            {workDuration && (
                                                <span className="text-sm px-2 py-1 rounded-md bg-success/10 text-success">
                                                    Duration: {workDuration}
                                                </span>
                                            )}
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Punch In Time */}
                                            <Input
                                                label="Punch In Time"
                                                type="time"
                                                value={formData.punch_in_time}
                                                onValueChange={(value) => handleFieldChange('punch_in_time', value)}
                                                isInvalid={Boolean(errors.punch_in_time)}
                                                errorMessage={errors.punch_in_time}
                                                variant="bordered"
                                                size="sm"
                                                radius={getThemeRadius()}
                                                startContent={<ClockIcon className="w-4 h-4 text-default-400" />}
                                                classNames={{
                                                    input: "text-small",
                                                    inputWrapper: "min-h-unit-10"
                                                }}
                                                style={{
                                                    fontFamily: `var(--fontFamily, "Inter")`,
                                                }}
                                            />

                                            {/* Punch Out Time */}
                                            <Input
                                                label="Punch Out Time (Optional)"
                                                type="time"
                                                value={formData.punch_out_time}
                                                onValueChange={(value) => handleFieldChange('punch_out_time', value)}
                                                isInvalid={Boolean(errors.punch_out_time)}
                                                errorMessage={errors.punch_out_time}
                                                variant="bordered"
                                                size="sm"
                                                radius={getThemeRadius()}
                                                startContent={<ClockIcon className="w-4 h-4 text-default-400" />}
                                                classNames={{
                                                    input: "text-small",
                                                    inputWrapper: "min-h-unit-10"
                                                }}
                                                style={{
                                                    fontFamily: `var(--fontFamily, "Inter")`,
                                                }}
                                                description="Leave empty if employee is still working"
                                            />
                                        </div>
                                    </div>

                                    <Divider style={{ background: `var(--theme-divider)` }} />

                                    {/* Additional Information Section */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <InformationCircleIcon className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                                            <h3 className="text-base font-semibold" style={{ color: 'var(--theme-foreground)' }}>
                                                Additional Information
                                            </h3>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 gap-4">
                                            {/* Location */}
                                            <Input
                                                label="Location"
                                                value={formData.location}
                                                onValueChange={(value) => handleFieldChange('location', value)}
                                                isInvalid={Boolean(errors.location)}
                                                errorMessage={errors.location}
                                                variant="bordered"
                                                size="sm"
                                                radius={getThemeRadius()}
                                                startContent={<MapPinIcon className="w-4 h-4 text-default-400" />}
                                                classNames={{
                                                    input: "text-small",
                                                    inputWrapper: "min-h-unit-10"
                                                }}
                                                style={{
                                                    fontFamily: `var(--fontFamily, "Inter")`,
                                                }}
                                            />

                                            {/* Reason */}
                                            <Textarea
                                                label="Reason (Optional)"
                                                placeholder="Reason for manually marking as present..."
                                                value={formData.reason}
                                                onValueChange={(value) => handleFieldChange('reason', value)}
                                                isInvalid={Boolean(errors.reason)}
                                                errorMessage={errors.reason}
                                                variant="bordered"
                                                size="sm"
                                                radius={getThemeRadius()}
                                                minRows={3}
                                                maxRows={5}
                                                classNames={{
                                                    input: "text-small"
                                                }}
                                                style={{
                                                    fontFamily: `var(--fontFamily, "Inter")`,
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Preview Section */}
                                    {selectedUser && (
                                        <div 
                                            className="p-4 rounded-lg border"
                                            style={{
                                                backgroundColor: 'var(--theme-content2)',
                                                borderColor: 'var(--theme-divider)',
                                                borderRadius: `var(--borderRadius, 12px)`,
                                            }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <InformationCircleIcon className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                                                <div>
                                                    <h4 className="font-medium text-sm" style={{ color: 'var(--theme-foreground)' }}>
                                                        Preview
                                                    </h4>
                                                    <p className="text-xs" style={{ color: 'var(--theme-foreground-600)' }}>
                                                        {selectedUser.name} will be marked present for{' '}
                                                        {dayjs(formData.date).format('MMM D, YYYY')} from{' '}
                                                        {formData.punch_in_time}{' '}
                                                        {formData.punch_out_time && `to ${formData.punch_out_time}`}
                                                        {workDuration && ` (${workDuration})`}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </ModalBody>
                            
                            <ModalFooter className="flex flex-col sm:flex-row justify-center gap-2 px-4 sm:px-6 py-3 sm:py-4" style={{
                                borderColor: `var(--theme-divider, #E4E4E7)`,
                                fontFamily: `var(--fontFamily, "Inter")`,
                            }}>
                                <Button
                                    color="default"
                                    variant="bordered"
                                    onPress={onClose}
                                    radius={getThemeRadius()}
                                    size="sm"
                                    isDisabled={processing}
                                    style={{
                                        borderRadius: `var(--borderRadius, 8px)`,
                                        fontFamily: `var(--fontFamily, "Inter")`,
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    color="primary"
                                    variant="solid"
                                    isLoading={processing}
                                    isDisabled={processing || !formData.user_id}
                                    radius={getThemeRadius()}
                                    size="sm"
                                    style={{
                                        borderRadius: `var(--borderRadius, 8px)`,
                                        fontFamily: `var(--fontFamily, "Inter")`,
                                    }}
                                >
                                    {processing ? 'Marking Present...' : 'Mark as Present'}
                                </Button>
                            </ModalFooter>
                        </form>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
};

export default MarkAsPresentForm;
