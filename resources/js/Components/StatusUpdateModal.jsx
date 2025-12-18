import React, { useState, useEffect, useMemo } from 'react';
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Textarea,
    Input,
    Chip,
    Divider,
    RadioGroup,
    Radio,
    cn
} from "@heroui/react";
import {
    CheckCircleIcon,
    ClockIcon,
    XCircleIcon,
    EyeIcon,
    ArrowPathIcon,
    ExclamationTriangleIcon,
    PauseCircleIcon
} from "@heroicons/react/24/outline";
import { Clock, FileText, AlertCircle, CheckCheck, RotateCcw } from 'lucide-react';
import { showToast } from '@/utils/toastUtils';
import axios from 'axios';

const StatusUpdateModal = ({ 
    open, 
    closeModal, 
    dailyWork,
    onStatusUpdated
}) => {
    // Initialize form data when dailyWork changes
    const [formData, setFormData] = useState({
        status: 'new',
        inspection_result: '',
        completion_time: '',
        inspection_details: ''
    });
    const [isLoading, setIsLoading] = useState(false);

    // Reset form when dailyWork changes or modal opens
    useEffect(() => {
        if (dailyWork && open) {
            setFormData({
                status: dailyWork.status || 'new',
                inspection_result: dailyWork.inspection_result || '',
                completion_time: dailyWork.completion_time 
                    ? new Date(dailyWork.completion_time).toISOString().slice(0, 16) 
                    : '',
                inspection_details: dailyWork.inspection_details || ''
            });
        }
    }, [dailyWork, open]);

    // Inspection result options - consistent with backend DailyWork::$inspectionResults
    const inspectionResultOptions = useMemo(() => [
        { key: 'pass', label: 'Pass', color: 'success', description: 'Work passed inspection' },
        { key: 'fail', label: 'Fail', color: 'danger', description: 'Work failed inspection' },
        { key: 'conditional', label: 'Conditional', color: 'warning', description: 'Passed with conditions' },
        { key: 'pending', label: 'Pending', color: 'default', description: 'Awaiting inspection' },
    ], []);

    // Status options - consistent with backend DailyWork::$statuses
    const statusOptions = useMemo(() => [
        { 
            key: 'new', 
            label: 'New', 
            color: 'primary',
            bgColor: 'bg-primary-50',
            borderColor: 'border-primary-300',
            textColor: 'text-primary-700',
            icon: ClockIcon,
            description: 'Work has been created and is waiting to be started'
        },
        { 
            key: 'in-progress', 
            label: 'In Progress', 
            color: 'secondary',
            bgColor: 'bg-secondary-50',
            borderColor: 'border-secondary-300',
            textColor: 'text-secondary-700',
            icon: ArrowPathIcon,
            description: 'Work is currently being executed'
        },
        { 
            key: 'pending', 
            label: 'Pending', 
            color: 'default',
            bgColor: 'bg-default-100',
            borderColor: 'border-default-300',
            textColor: 'text-default-700',
            icon: PauseCircleIcon,
            description: 'Work is on hold awaiting action'
        },
        { 
            key: 'completed', 
            label: 'Completed', 
            color: 'success',
            bgColor: 'bg-success-50',
            borderColor: 'border-success-300',
            textColor: 'text-success-700',
            icon: CheckCircleIcon,
            description: 'Work has been completed (select inspection result below)'
        },
        { 
            key: 'rejected', 
            label: 'Rejected', 
            color: 'danger',
            bgColor: 'bg-danger-50',
            borderColor: 'border-danger-300',
            textColor: 'text-danger-700',
            icon: XCircleIcon,
            description: 'Work was rejected and needs correction'
        },
        { 
            key: 'resubmission', 
            label: 'Resubmission', 
            color: 'warning',
            bgColor: 'bg-warning-50',
            borderColor: 'border-warning-300',
            textColor: 'text-warning-700',
            icon: RotateCcw,
            description: 'Work has been corrected and resubmitted'
        },
        { 
            key: 'emergency', 
            label: 'Emergency', 
            color: 'danger',
            bgColor: 'bg-danger-100',
            borderColor: 'border-danger-400',
            textColor: 'text-danger-700',
            icon: ExclamationTriangleIcon,
            description: 'Urgent work requiring immediate attention'
        }
    ], []);

    const handleSubmit = async () => {
        setIsLoading(true);

        const promise = new Promise(async (resolve, reject) => {
            try {
                const payload = {
                    id: dailyWork.id,
                    status: formData.status,
                    completion_time: formData.completion_time,
                    inspection_details: formData.inspection_details,
                };
                
                // Include inspection_result for completed status
                if (formData.status === 'completed' && formData.inspection_result) {
                    payload.inspection_result = formData.inspection_result;
                }

                const response = await axios.post(route('dailyWorks.updateStatus'), payload);

                onStatusUpdated(response.data.dailyWork);
                closeModal();
                resolve('Status updated successfully');
            } catch (error) {
                console.error('Error updating status:', error.response?.data || error.message || error);
                const errorMessage = error.response?.data?.error 
                    || error.response?.data?.message 
                    || 'Failed to update status';
                reject(errorMessage);
            } finally {
                setIsLoading(false);
            }
        });

        showToast.promise(promise, {
            loading: 'Updating status...',
            success: (msg) => msg,
            error: (msg) => msg,
        });
    };

    const getCurrentStatusInfo = () => {
        return statusOptions.find(option => option.key === formData.status);
    };

    const getOriginalStatusInfo = () => {
        return statusOptions.find(option => option.key === dailyWork?.status);
    };

    const handleStatusChange = (status) => {
        setFormData(prev => ({
            ...prev,
            status,
            // Auto-set completion time when marking as completed
            completion_time: status === 'completed' && !prev.completion_time 
                ? new Date().toISOString().slice(0, 16) 
                : prev.completion_time,
            // Clear inspection_result if not completed
            inspection_result: status === 'completed' ? prev.inspection_result : ''
        }));
    };

    const handleInspectionResultChange = (result) => {
        setFormData(prev => ({
            ...prev,
            inspection_result: result
        }));
    };

    const isStatusChanged = dailyWork?.status !== formData.status;
    const isInspectionResultChanged = formData.status === 'completed' && dailyWork?.inspection_result !== formData.inspection_result;
    const isDetailsChanged = formData.inspection_details !== (dailyWork?.inspection_details || '');
    const hasChanges = isStatusChanged || isInspectionResultChanged || isDetailsChanged;
    const CurrentStatusIcon = getCurrentStatusInfo()?.icon || ClockIcon;
    const OriginalStatusIcon = getOriginalStatusInfo()?.icon || ClockIcon;

    return (
        <Modal 
            isOpen={open} 
            onClose={closeModal}
            size="lg"
            scrollBehavior="inside"
            placement="center"
            classNames={{
                base: "mx-2 sm:mx-4 my-2 max-h-[90vh] overflow-hidden",
                wrapper: "items-center overflow-hidden",
                backdrop: "bg-black/50",
                body: "py-4 px-4 sm:px-6 overflow-y-auto",
                header: "px-4 sm:px-6 pt-4 pb-2 border-b border-divider",
                footer: "px-4 sm:px-6 py-4 border-t border-divider bg-content1",
                closeButton: "top-3 right-3"
            }}
        >
            <ModalContent className="max-h-[90vh] flex flex-col">
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                                    <CheckCircleIcon className="w-5 h-5 text-primary" />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-base sm:text-lg font-bold text-default-900">Update Work Status</h2>
                                    <p className="text-xs text-default-500 font-normal truncate">
                                        {dailyWork?.number}
                                    </p>
                                </div>
                            </div>
                        </ModalHeader>
                        
                        <ModalBody className="flex-1 overflow-y-auto">
                            <div className="space-y-4">
                                {/* Work Description */}
                                {dailyWork?.description && (
                                    <div className="bg-default-50 rounded-lg p-3 border border-default-100">
                                        <div className="flex items-start gap-2">
                                            <FileText className="w-4 h-4 text-default-400 shrink-0 mt-0.5" />
                                            <p className="text-sm text-default-600 line-clamp-2">
                                                {dailyWork.description}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Work Info Grid - Compact */}
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="bg-default-50 rounded-lg p-2">
                                        <span className="text-default-400 block">Type</span>
                                        <span className="font-medium text-default-700">{dailyWork?.type || 'N/A'}</span>
                                    </div>
                                    <div className="bg-default-50 rounded-lg p-2">
                                        <span className="text-default-400 block">Location</span>
                                        <span className="font-medium text-default-700 truncate block">{dailyWork?.location || 'N/A'}</span>
                                    </div>
                                    <div className="bg-default-50 rounded-lg p-2">
                                        <span className="text-default-400 block">In Charge</span>
                                        <span className="font-medium text-default-700">{dailyWork?.incharge_user?.name || dailyWork?.inchargeUser?.name || 'N/A'}</span>
                                    </div>
                                    <div className="bg-default-50 rounded-lg p-2">
                                        <span className="text-default-400 block">Assigned To</span>
                                        <span className="font-medium text-default-700">{dailyWork?.assigned_user?.name || dailyWork?.assignedUser?.name || 'Not assigned'}</span>
                                    </div>
                                </div>

                                <Divider />

                                {/* Status Selection - Compact Cards */}
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <CheckCheck className="w-4 h-4 text-primary" />
                                        <span className="font-semibold text-sm text-default-900">Select New Status</span>
                                    </div>
                                    <div className="space-y-2">
                                        {statusOptions.map((option) => {
                                            const Icon = option.icon;
                                            const isSelected = formData.status === option.key;
                                            return (
                                                <button
                                                    key={option.key}
                                                    type="button"
                                                    onClick={() => handleStatusChange(option.key)}
                                                    className={cn(
                                                        "w-full p-3 rounded-lg border-2 transition-all duration-150 text-left",
                                                        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1",
                                                        "active:scale-[0.99]",
                                                        isSelected 
                                                            ? `${option.bgColor} ${option.borderColor}` 
                                                            : "bg-content1 border-default-200 hover:border-default-300"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn(
                                                            "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                                                            isSelected ? option.bgColor : "bg-default-100"
                                                        )}>
                                                            <Icon className={cn(
                                                                "w-4 h-4",
                                                                isSelected ? option.textColor : "text-default-500"
                                                            )} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between">
                                                                <span className={cn(
                                                                    "font-medium text-sm",
                                                                    isSelected ? option.textColor : "text-default-700"
                                                                )}>
                                                                    {option.label}
                                                                </span>
                                                                {isSelected && (
                                                                    <Chip color={option.color} size="sm" variant="flat" className="h-5 text-xs">
                                                                        Selected
                                                                    </Chip>
                                                                )}
                                                            </div>
                                                            <p className={cn(
                                                                "text-xs mt-0.5 line-clamp-1",
                                                                isSelected ? option.textColor : "text-default-400"
                                                            )}>
                                                                {option.description}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Inspection Result - Show when completed is selected */}
                                {formData.status === 'completed' && (
                                    <div className="bg-success-50 border-2 border-success-200 rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <CheckCircleIcon className="w-4 h-4 text-success-600" />
                                            <span className="font-semibold text-sm text-success-700">Inspection Result</span>
                                            <span className="text-xs text-success-500">(Required)</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            {inspectionResultOptions.map((option) => {
                                                const isSelected = formData.inspection_result === option.key;
                                                return (
                                                    <button
                                                        key={option.key}
                                                        type="button"
                                                        onClick={() => handleInspectionResultChange(option.key)}
                                                        className={cn(
                                                            "p-3 rounded-lg border-2 transition-all duration-150 text-center",
                                                            "focus:outline-none focus:ring-2 focus:ring-success focus:ring-offset-1",
                                                            "active:scale-[0.98]",
                                                            isSelected 
                                                                ? option.color === 'success' ? "bg-success-100 border-success-400" 
                                                                : option.color === 'danger' ? "bg-danger-100 border-danger-400"
                                                                : option.color === 'warning' ? "bg-warning-100 border-warning-400"
                                                                : "bg-default-100 border-default-400"
                                                                : "bg-white border-default-200 hover:border-default-300"
                                                        )}
                                                    >
                                                        <span className={cn(
                                                            "font-medium text-sm block",
                                                            isSelected 
                                                                ? option.color === 'success' ? "text-success-700" 
                                                                : option.color === 'danger' ? "text-danger-700"
                                                                : option.color === 'warning' ? "text-warning-700"
                                                                : "text-default-700"
                                                                : "text-default-600"
                                                        )}>
                                                            {option.label}
                                                        </span>
                                                        <span className="text-xs text-default-400 block mt-0.5">
                                                            {option.description}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Completion Time */}
                                {formData.status === 'completed' && (
                                    <div>
                                        <Input
                                            label="Completion Time"
                                            type="datetime-local"
                                            value={formData.completion_time}
                                            onValueChange={(value) => setFormData(prev => ({ 
                                                ...prev, 
                                                completion_time: value 
                                            }))}
                                            variant="bordered"
                                            size="sm"
                                            startContent={<Clock size={16} className="text-default-400" />}
                                            description="When was this work actually completed?"
                                            classNames={{
                                                label: "text-default-700 font-medium text-sm",
                                                input: "text-sm",
                                                inputWrapper: "min-h-10"
                                            }}
                                        />
                                    </div>
                                )}

                                {/* Inspection Details */}
                                {(['completed', 'rejected', 'resubmission'].includes(formData.status)) && (
                                    <div>
                                        <Textarea
                                            label="Inspection Details"
                                            placeholder={
                                                formData.status === 'rejected'
                                                    ? "Describe the issues..."
                                                    : "Add inspection notes..."
                                            }
                                            value={formData.inspection_details}
                                            onValueChange={(value) => setFormData(prev => ({ 
                                                ...prev, 
                                                inspection_details: value 
                                            }))}
                                            variant="bordered"
                                            minRows={2}
                                            maxRows={4}
                                            size="sm"
                                            classNames={{
                                                label: "text-default-700 font-medium text-sm",
                                                input: "text-sm resize-none",
                                                inputWrapper: "min-h-16"
                                            }}
                                        />
                                    </div>
                                )}

                                {/* Status Change Summary - Compact */}
                                {isStatusChanged && (
                                    <div className={cn(
                                        "p-3 rounded-lg border-2",
                                        getCurrentStatusInfo()?.bgColor,
                                        getCurrentStatusInfo()?.borderColor
                                    )}>
                                        <div className="flex items-center gap-2 mb-2">
                                            <AlertCircle className={cn("w-4 h-4", getCurrentStatusInfo()?.textColor)} />
                                            <span className={cn("font-medium text-sm", getCurrentStatusInfo()?.textColor)}>
                                                Status Change
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <div className="flex items-center gap-1.5 bg-white/60 rounded px-2 py-1">
                                                <OriginalStatusIcon className="w-3.5 h-3.5 text-default-500" />
                                                <span className="text-xs font-medium capitalize">
                                                    {dailyWork?.status?.replace('_', ' ')}
                                                </span>
                                            </div>
                                            <svg className="w-4 h-4 text-default-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                            </svg>
                                            <div className={cn(
                                                "flex items-center gap-1.5 rounded px-2 py-1",
                                                getCurrentStatusInfo()?.bgColor
                                            )}>
                                                <CurrentStatusIcon className={cn("w-3.5 h-3.5", getCurrentStatusInfo()?.textColor)} />
                                                <span className={cn("text-xs font-medium", getCurrentStatusInfo()?.textColor)}>
                                                    {getCurrentStatusInfo()?.label}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </ModalBody>
                        
                        <ModalFooter className="shrink-0 flex-col sm:flex-row gap-2">
                            <Button 
                                variant="flat" 
                                color="default"
                                onPress={closeModal}
                                isDisabled={isLoading}
                                className="w-full sm:w-auto order-2 sm:order-1"
                            >
                                Cancel
                            </Button>
                            <Button 
                                color={getCurrentStatusInfo()?.color || "primary"}
                                onPress={handleSubmit}
                                isLoading={isLoading}
                                startContent={!isLoading && <CurrentStatusIcon className="w-4 h-4" />}
                                className="w-full sm:w-auto order-1 sm:order-2 font-semibold"
                                isDisabled={
                                    !hasChanges ||
                                    (formData.status === 'completed' && !formData.inspection_result)
                                }
                            >
                                {isLoading ? 'Updating...' : `Update to ${getCurrentStatusInfo()?.label}`}
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
};

export default StatusUpdateModal;
