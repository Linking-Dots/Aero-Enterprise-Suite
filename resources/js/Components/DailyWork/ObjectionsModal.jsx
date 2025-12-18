import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Image,
    Spinner,
    Chip,
    Divider,
    Progress,
    Input,
    Textarea,
    Select,
    SelectItem,
    Card,
    CardBody,
    Accordion,
    AccordionItem,
    Avatar,
    Tooltip,
} from "@heroui/react";
import {
    ExclamationTriangleIcon,
    DocumentIcon,
    TrashIcon,
    ArrowDownTrayIcon,
    EyeIcon,
    PlusIcon,
    XMarkIcon,
    PhotoIcon,
    DocumentTextIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    PaperAirplaneIcon,
    ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";
import { showToast } from '@/utils/toastUtils';
import { getThemeRadius } from '@/Hooks/useThemeRadius';
import axios from 'axios';

// Objection category options
const CATEGORIES = [
    { value: 'design_conflict', label: 'Design Conflict' },
    { value: 'site_mismatch', label: 'Site Condition Mismatch' },
    { value: 'material_change', label: 'Material Change' },
    { value: 'safety_concern', label: 'Safety Concern' },
    { value: 'specification_error', label: 'Specification Error' },
    { value: 'other', label: 'Other' },
];

// Status colors and icons
const STATUS_CONFIG = {
    draft: { color: 'default', icon: DocumentIcon, label: 'Draft' },
    submitted: { color: 'warning', icon: PaperAirplaneIcon, label: 'Submitted' },
    under_review: { color: 'primary', icon: ClockIcon, label: 'Under Review' },
    resolved: { color: 'success', icon: CheckCircleIcon, label: 'Resolved' },
    rejected: { color: 'danger', icon: XCircleIcon, label: 'Rejected' },
};

const ObjectionsModal = ({
    isOpen,
    onClose,
    dailyWork,
    onObjectionsUpdated,
    canCreate = false,
    canReview = false,
}) => {
    const [objections, setObjections] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingObjection, setEditingObjection] = useState(null);
    const [selectedObjection, setSelectedObjection] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef(null);

    // Form state for new objection
    const [formData, setFormData] = useState({
        title: '',
        category: 'other',
        description: '',
        reason: '',
    });
    
    // Selected files for new objection
    const [selectedFiles, setSelectedFiles] = useState([]);

    // Resolution form state
    const [resolutionData, setResolutionData] = useState({
        notes: '',
        action: '', // 'resolve' or 'reject'
    });

    // Fetch objections when modal opens
    useEffect(() => {
        if (isOpen && dailyWork?.id) {
            fetchObjections();
        }
    }, [isOpen, dailyWork?.id]);

    const fetchObjections = async () => {
        if (!dailyWork?.id) return;

        setLoading(true);
        try {
            const response = await axios.get(route('dailyWorks.objections.index', dailyWork.id));
            setObjections(response.data.objections || []);
        } catch (error) {
            console.error('Error fetching objections:', error);
            showToast.error('Failed to load objections');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateObjection = async (submitImmediately = false) => {
        if (!formData.title.trim() || !formData.description.trim() || !formData.reason.trim()) {
            showToast.error('Please fill in all required fields');
            return;
        }

        setSubmitting(true);
        try {
            const response = await axios.post(route('dailyWorks.objections.store', dailyWork.id), {
                ...formData,
                status: submitImmediately ? 'submitted' : 'draft',
            });

            const createdObjection = response.data.objection;
            
            // Upload files if any were selected
            if (selectedFiles.length > 0) {
                const uploadFormData = new FormData();
                selectedFiles.forEach((file) => {
                    uploadFormData.append('files[]', file);
                });

                try {
                    await axios.post(
                        route('dailyWorks.objections.files.upload', [dailyWork.id, createdObjection.id]),
                        uploadFormData,
                        {
                            headers: { 'Content-Type': 'multipart/form-data' },
                        }
                    );
                } catch (uploadError) {
                    console.error('Error uploading files:', uploadError);
                    showToast.warning('Objection created but some files failed to upload');
                }
            }

            showToast.success(submitImmediately ? 'Objection submitted successfully' : 'Objection saved as draft');
            
            // Refresh objections list
            await fetchObjections();
            
            // Reset form
            setFormData({ title: '', category: 'other', description: '', reason: '' });
            setSelectedFiles([]);
            setShowCreateForm(false);

            // Notify parent
            if (onObjectionsUpdated) {
                onObjectionsUpdated();
            }
        } catch (error) {
            console.error('Error creating objection:', error);
            showToast.error(error.response?.data?.error || 'Failed to create objection');
        } finally {
            setSubmitting(false);
        }
    };
    
    const handleFileSelect = (event) => {
        const files = Array.from(event.target.files);
        setSelectedFiles(prev => [...prev, ...files]);
    };
    
    const removeSelectedFile = (index) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleEditObjection = (objection) => {
        setEditingObjection(objection.id);
        setFormData({
            title: objection.title,
            category: objection.category,
            description: objection.description,
            reason: objection.reason,
        });
        setShowCreateForm(false);
    };

    const handleUpdateObjection = async () => {
        if (!formData.title.trim() || !formData.description.trim() || !formData.reason.trim()) {
            showToast.error('Please fill in all required fields');
            return;
        }

        setSubmitting(true);
        try {
            await axios.put(route('dailyWorks.objections.update', [dailyWork.id, editingObjection]), formData);
            
            showToast.success('Objection updated successfully');
            
            // Reset form
            setFormData({ title: '', category: 'other', description: '', reason: '' });
            setEditingObjection(null);
            
            // Refresh objections list
            await fetchObjections();
            
            // Notify parent
            if (onObjectionsUpdated) {
                onObjectionsUpdated();
            }
        } catch (error) {
            console.error('Error updating objection:', error);
            showToast.error(error.response?.data?.error || 'Failed to update objection');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancelEdit = () => {
        setEditingObjection(null);
        setFormData({ title: '', category: 'other', description: '', reason: '' });
    };

    const handleSubmitObjection = async (objectionId) => {
        try {
            await axios.post(route('dailyWorks.objections.submit', [dailyWork.id, objectionId]));
            showToast.success('Objection submitted for review');
            await fetchObjections();
            if (onObjectionsUpdated) onObjectionsUpdated();
        } catch (error) {
            console.error('Error submitting objection:', error);
            showToast.error(error.response?.data?.error || 'Failed to submit objection');
        }
    };

    const handleResolveOrReject = async (objectionId, action) => {
        if (!resolutionData.notes.trim()) {
            showToast.error(`Please provide ${action === 'resolve' ? 'resolution' : 'rejection'} notes`);
            return;
        }

        try {
            const endpoint = action === 'resolve' 
                ? route('dailyWorks.objections.resolve', [dailyWork.id, objectionId])
                : route('dailyWorks.objections.reject', [dailyWork.id, objectionId]);

            await axios.post(endpoint, {
                [action === 'resolve' ? 'resolution_notes' : 'rejection_reason']: resolutionData.notes,
            });

            showToast.success(`Objection ${action === 'resolve' ? 'resolved' : 'rejected'} successfully`);
            setResolutionData({ notes: '', action: '' });
            setSelectedObjection(null);
            await fetchObjections();
            if (onObjectionsUpdated) onObjectionsUpdated();
        } catch (error) {
            console.error(`Error ${action}ing objection:`, error);
            showToast.error(error.response?.data?.error || `Failed to ${action} objection`);
        }
    };

    const handleDeleteObjection = async (objectionId) => {
        if (!confirm('Are you sure you want to delete this objection?')) return;

        try {
            await axios.delete(route('dailyWorks.objections.destroy', [dailyWork.id, objectionId]));
            showToast.success('Objection deleted successfully');
            await fetchObjections();
            if (onObjectionsUpdated) onObjectionsUpdated();
        } catch (error) {
            console.error('Error deleting objection:', error);
            showToast.error(error.response?.data?.error || 'Failed to delete objection');
        }
    };

    const handleFileUpload = async (event, objectionId) => {
        const selectedFiles = Array.from(event.target.files);
        if (selectedFiles.length === 0) return;

        setUploading(true);
        setUploadProgress(0);

        const formData = new FormData();
        selectedFiles.forEach((file) => {
            formData.append('files[]', file);
        });

        try {
            await axios.post(
                route('dailyWorks.objections.files.upload', [dailyWork.id, objectionId]),
                formData,
                {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    onUploadProgress: (progressEvent) => {
                        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setUploadProgress(percent);
                    },
                }
            );

            showToast.success('Files uploaded successfully');
            await fetchObjections();
        } catch (error) {
            console.error('Error uploading files:', error);
            showToast.error(error.response?.data?.error || 'Failed to upload files');
        } finally {
            setUploading(false);
            setUploadProgress(0);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDeleteFile = async (objectionId, mediaId) => {
        if (!confirm('Are you sure you want to delete this file?')) return;

        try {
            await axios.delete(route('dailyWorks.objections.files.delete', [dailyWork.id, objectionId, mediaId]));
            showToast.success('File deleted successfully');
            await fetchObjections();
        } catch (error) {
            console.error('Error deleting file:', error);
            showToast.error('Failed to delete file');
        }
    };

    const renderStatusChip = (status) => {
        const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
        const Icon = config.icon;
        return (
            <Chip
                size="sm"
                color={config.color}
                variant="flat"
                startContent={<Icon className="w-3 h-3" />}
            >
                {config.label}
            </Chip>
        );
    };

    const renderObjectionCard = (objection) => {
        const isActive = ['draft', 'submitted', 'under_review'].includes(objection.status);
        const canEdit = objection.status === 'draft' && canCreate;
        const canSubmit = objection.status === 'draft' && canCreate;
        const canManage = ['submitted', 'under_review'].includes(objection.status) && canReview;

        return (
            <Card 
                key={objection.id} 
                className={`mb-3 ${isActive ? 'border-l-4 border-warning' : ''}`}
                shadow="sm"
            >
                <CardBody className="p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                {renderStatusChip(objection.status)}
                                <Chip size="sm" variant="bordered">
                                    {objection.category_label}
                                </Chip>
                            </div>
                            <h4 className="font-semibold text-sm">{objection.title}</h4>
                        </div>
                        <div className="flex items-center gap-1">
                            {canEdit && (
                                <Tooltip content="Edit">
                                    <Button
                                        isIconOnly
                                        size="sm"
                                        variant="light"
                                        color="primary"
                                        onPress={() => handleEditObjection(objection)}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </Button>
                                </Tooltip>
                            )}
                            {canSubmit && (
                                <Tooltip content="Submit for Review">
                                    <Button
                                        isIconOnly
                                        size="sm"
                                        variant="light"
                                        color="primary"
                                        onPress={() => handleSubmitObjection(objection.id)}
                                    >
                                        <PaperAirplaneIcon className="w-4 h-4" />
                                    </Button>
                                </Tooltip>
                            )}
                            {canEdit && (
                                <Tooltip content="Delete">
                                    <Button
                                        isIconOnly
                                        size="sm"
                                        variant="light"
                                        color="danger"
                                        onPress={() => handleDeleteObjection(objection.id)}
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </Button>
                                </Tooltip>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="mb-3">
                        <p className="text-xs text-default-500 mb-1">Description:</p>
                        <p className="text-sm">{objection.description}</p>
                    </div>

                    {/* Reason */}
                    <div className="mb-3">
                        <p className="text-xs text-default-500 mb-1">Reason for Objection:</p>
                        <p className="text-sm">{objection.reason}</p>
                    </div>

                    {/* Resolution notes if resolved/rejected */}
                    {objection.resolution_notes && (
                        <div className="mb-3 p-2 bg-default-100 rounded-lg">
                            <p className="text-xs text-default-500 mb-1">
                                {objection.status === 'resolved' ? 'Resolution:' : 'Rejection Reason:'}
                            </p>
                            <p className="text-sm">{objection.resolution_notes}</p>
                        </div>
                    )}

                    {/* Files */}
                    {objection.files && objection.files.length > 0 && (
                        <div className="mb-3">
                            <p className="text-xs text-default-500 mb-2">Attachments ({objection.files.length}):</p>
                            <div className="flex flex-wrap gap-2">
                                {objection.files.map((file) => (
                                    <div key={file.id} className="flex items-center gap-1 p-1 bg-default-100 rounded text-xs">
                                        {file.is_image ? (
                                            <PhotoIcon className="w-3 h-3 text-blue-500" />
                                        ) : (
                                            <DocumentTextIcon className="w-3 h-3 text-red-500" />
                                        )}
                                        <span className="max-w-[100px] truncate">{file.name}</span>
                                        <a href={file.url} target="_blank" rel="noopener noreferrer">
                                            <EyeIcon className="w-3 h-3 cursor-pointer hover:text-primary" />
                                        </a>
                                        {canEdit && (
                                            <TrashIcon 
                                                className="w-3 h-3 cursor-pointer hover:text-danger" 
                                                onClick={() => handleDeleteFile(objection.id, file.id)}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* File upload for editable objections */}
                    {canEdit && (
                        <div className="mb-3">
                            <input
                                type="file"
                                multiple
                                accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
                                onChange={(e) => handleFileUpload(e, objection.id)}
                                className="hidden"
                                id={`file-upload-${objection.id}`}
                            />
                            <label
                                htmlFor={`file-upload-${objection.id}`}
                                className="flex items-center gap-2 text-xs text-primary cursor-pointer hover:underline"
                            >
                                <PlusIcon className="w-3 h-3" />
                                Add files
                            </label>
                        </div>
                    )}

                    {/* Review actions */}
                    {canManage && (
                        <div className="mt-3 pt-3 border-t border-divider">
                            {selectedObjection === objection.id ? (
                                <div className="space-y-2">
                                    <Textarea
                                        size="sm"
                                        placeholder={resolutionData.action === 'resolve' ? 'Enter resolution notes...' : 'Enter rejection reason...'}
                                        value={resolutionData.notes}
                                        onChange={(e) => setResolutionData({ ...resolutionData, notes: e.target.value })}
                                        minRows={2}
                                    />
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            color={resolutionData.action === 'resolve' ? 'success' : 'danger'}
                                            onPress={() => handleResolveOrReject(objection.id, resolutionData.action)}
                                        >
                                            Confirm {resolutionData.action === 'resolve' ? 'Resolution' : 'Rejection'}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="light"
                                            onPress={() => {
                                                setSelectedObjection(null);
                                                setResolutionData({ notes: '', action: '' });
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        color="success"
                                        variant="flat"
                                        startContent={<CheckCircleIcon className="w-4 h-4" />}
                                        onPress={() => {
                                            setSelectedObjection(objection.id);
                                            setResolutionData({ notes: '', action: 'resolve' });
                                        }}
                                    >
                                        Resolve
                                    </Button>
                                    <Button
                                        size="sm"
                                        color="danger"
                                        variant="flat"
                                        startContent={<XCircleIcon className="w-4 h-4" />}
                                        onPress={() => {
                                            setSelectedObjection(objection.id);
                                            setResolutionData({ notes: '', action: 'reject' });
                                        }}
                                    >
                                        Reject
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Meta info */}
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-divider text-xs text-default-400">
                        <div className="flex items-center gap-2">
                            <Avatar
                                size="sm"
                                name={objection.created_by?.name || 'Unknown'}
                                className="w-5 h-5"
                            />
                            <span>{objection.created_by?.name || 'Unknown'}</span>
                        </div>
                        <span>{new Date(objection.created_at).toLocaleDateString()}</span>
                    </div>
                </CardBody>
            </Card>
        );
    };

    const activeCount = objections.filter(o => ['draft', 'submitted', 'under_review'].includes(o.status)).length;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="3xl"
            scrollBehavior="inside"
            placement="center"
        >
            <ModalContent>
                {(onCloseModal) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                                <ExclamationTriangleIcon className="w-5 h-5 text-warning" />
                                <span>RFI Objections - {dailyWork?.number}</span>
                                {activeCount > 0 && (
                                    <Chip size="sm" color="warning" variant="solid">
                                        {activeCount} Active
                                    </Chip>
                                )}
                            </div>
                            <p className="text-sm text-default-500 font-normal">
                                View and manage objections for this RFI
                            </p>
                        </ModalHeader>

                        <ModalBody>
                            {/* Create New Objection Button */}
                            {canCreate && !showCreateForm && (
                                <Button
                                    color="warning"
                                    variant="flat"
                                    startContent={<PlusIcon className="w-4 h-4" />}
                                    onPress={() => setShowCreateForm(true)}
                                    className="mb-4"
                                >
                                    Raise New Objection
                                </Button>
                            )}

                            {/* Create Objection Form */}
                            {showCreateForm && (
                                <Card className="mb-4 border-2 border-warning/50">
                                    <CardBody className="p-4 space-y-4">
                                        <h4 className="font-semibold text-sm flex items-center gap-2">
                                            <ExclamationTriangleIcon className="w-4 h-4 text-warning" />
                                            New Objection
                                        </h4>

                                        <Input
                                            label="Title"
                                            placeholder="Brief title for the objection"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            isRequired
                                        />

                                        <Select
                                            label="Category"
                                            selectedKeys={[formData.category]}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        >
                                            {CATEGORIES.map((cat) => (
                                                <SelectItem key={cat.value} value={cat.value}>
                                                    {cat.label}
                                                </SelectItem>
                                            ))}
                                        </Select>

                                        <Textarea
                                            label="Description"
                                            placeholder="Detailed description of the objection"
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            minRows={3}
                                            isRequired
                                        />

                                        <Textarea
                                            label="Reason"
                                            placeholder="Why is this objection being raised?"
                                            value={formData.reason}
                                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                            minRows={2}
                                            isRequired
                                        />

                                        {/* File Upload Section */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">
                                                Supporting Documents (PDF, Images, Doc, Excel)
                                            </label>
                                            <input
                                                type="file"
                                                multiple
                                                accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
                                                onChange={handleFileSelect}
                                                className="hidden"
                                                id="objection-file-input"
                                            />
                                            <label
                                                htmlFor="objection-file-input"
                                                className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-default-300 rounded-lg cursor-pointer hover:border-primary hover:bg-default-50 transition-colors"
                                            >
                                                <DocumentIcon className="w-5 h-5 text-default-500" />
                                                <span className="text-sm text-default-600">
                                                    Click to select files
                                                </span>
                                            </label>
                                            
                                            {/* Selected Files List */}
                                            {selectedFiles.length > 0 && (
                                                <div className="space-y-1 mt-2">
                                                    {selectedFiles.map((file, index) => (
                                                        <div
                                                            key={index}
                                                            className="flex items-center justify-between p-2 bg-default-100 rounded-lg"
                                                        >
                                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                                {file.type.startsWith('image/') ? (
                                                                    <PhotoIcon className="w-4 h-4 text-success shrink-0" />
                                                                ) : (
                                                                    <DocumentTextIcon className="w-4 h-4 text-primary shrink-0" />
                                                                )}
                                                                <span className="text-xs truncate">{file.name}</span>
                                                                <span className="text-xs text-default-400 shrink-0">
                                                                    ({(file.size / 1024).toFixed(1)} KB)
                                                                </span>
                                                            </div>
                                                            <Button
                                                                isIconOnly
                                                                size="sm"
                                                                variant="light"
                                                                color="danger"
                                                                onPress={() => removeSelectedFile(index)}
                                                            >
                                                                <XMarkIcon className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex gap-2 justify-end">
                                            <Button
                                                variant="light"
                                                onPress={() => {
                                                    setShowCreateForm(false);
                                                    setFormData({ title: '', category: 'other', description: '', reason: '' });
                                                }}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                variant="bordered"
                                                onPress={() => handleCreateObjection(false)}
                                                isLoading={submitting}
                                            >
                                                Save as Draft
                                            </Button>
                                            <Button
                                                color="warning"
                                                onPress={() => handleCreateObjection(true)}
                                                isLoading={submitting}
                                                startContent={<PaperAirplaneIcon className="w-4 h-4" />}
                                            >
                                                Submit
                                            </Button>
                                        </div>
                                    </CardBody>
                                </Card>
                            )}

                            {/* Edit Form */}
                            {editingObjection && (
                                <Card className="mb-4 border-2 border-primary">
                                    <CardBody className="p-4 space-y-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="text-base font-semibold flex items-center gap-2">
                                                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                                Edit Objection
                                            </h3>
                                        </div>

                                        <Input
                                            label="Title"
                                            placeholder="Brief title for the objection"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            isRequired
                                        />

                                        <Select
                                            label="Category"
                                            selectedKeys={[formData.category]}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        >
                                            {CATEGORIES.map((cat) => (
                                                <SelectItem key={cat.value} value={cat.value}>
                                                    {cat.label}
                                                </SelectItem>
                                            ))}
                                        </Select>

                                        <Textarea
                                            label="Description"
                                            placeholder="Detailed description of the objection"
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            minRows={3}
                                            isRequired
                                        />

                                        <Textarea
                                            label="Reason"
                                            placeholder="Why is this objection being raised?"
                                            value={formData.reason}
                                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                            minRows={2}
                                            isRequired
                                        />

                                        <div className="flex gap-2 justify-end pt-2">
                                            <Button
                                                variant="light"
                                                onPress={handleCancelEdit}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                color="primary"
                                                onPress={handleUpdateObjection}
                                                isLoading={submitting}
                                            >
                                                Update Objection
                                            </Button>
                                        </div>
                                    </CardBody>
                                </Card>
                            )}

                            <Divider className="my-2" />

                            {/* Upload Progress */}
                            {uploading && (
                                <Progress
                                    value={uploadProgress}
                                    className="mb-4"
                                    color="primary"
                                    showValueLabel
                                />
                            )}

                            {/* Objections List */}
                            {loading ? (
                                <div className="flex justify-center py-8">
                                    <Spinner size="lg" />
                                </div>
                            ) : objections.length === 0 ? (
                                <div className="text-center py-8 text-default-400">
                                    <ChatBubbleLeftRightIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p>No objections have been raised for this RFI</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {objections.map(renderObjectionCard)}
                                </div>
                            )}
                        </ModalBody>

                        <ModalFooter>
                            <div className="flex items-center justify-between w-full">
                                <span className="text-sm text-default-500">
                                    {objections.length} objection{objections.length !== 1 ? 's' : ''} total
                                </span>
                                <Button color="primary" variant="light" onPress={onCloseModal}>
                                    Close
                                </Button>
                            </div>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
};

export default ObjectionsModal;
