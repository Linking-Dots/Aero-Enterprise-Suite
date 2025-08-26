import React, { useState } from 'react';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { 
    Modal, 
    ModalContent, 
    ModalHeader, 
    ModalBody, 
    ModalFooter, 
    Button, 
    Divider,
    CircularProgress
} from '@heroui/react';
import axios from 'axios';
import { toast } from 'react-toastify';

const DeleteDepartmentForm = ({ open, onClose, onSuccess, department }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    // Handle department deletion
    const handleDelete = async () => {
        if (!department) return;
        
        setLoading(true);
        setError(null);
        
        try {
            await axios.delete(`/departments/${department.id}`);
            toast.success('Department deleted successfully');
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error deleting department:', error);
            
            if (error.response?.data?.message) {
                setError(error.response.data.message);
                toast.error(error.response.data.message);
            } else if (error.response?.data?.errors) {
                const firstError = Object.values(error.response.data.errors)[0];
                setError(firstError);
                toast.error(firstError);
            } else {
                setError('An error occurred while deleting the department');
                toast.error('An error occurred while deleting the department');
            }
        } finally {
            setLoading(false);
        }
    };
    
    if (!department) return null;
    
    return (
        <Modal
            isOpen={open}
            onOpenChange={loading ? undefined : onClose}
            size="lg"
        >
            <ModalContent>
                <ModalHeader className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Delete Department</h3>
                    <Button
                        isIconOnly
                        variant="light"
                        onPress={onClose}
                        isDisabled={loading}
                        aria-label="close"
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </Button>
                </ModalHeader>
                
                <Divider />
                
                <ModalBody>
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-2">
                            <ExclamationTriangleIcon className="w-8 h-8 text-yellow-500" />
                            <p className="text-sm">
                                Are you sure you want to delete the department <strong>{department.name}</strong>?
                            </p>
                        </div>
                        
                        {department.employee_count > 0 && (
                            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
                                This department has {department.employee_count} employees assigned to it. You cannot delete a department with active employees. Please reassign these employees to other departments first.
                            </div>
                        )}
                        
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
                                {error}
                            </div>
                        )}
                        
                        <p className="text-sm text-default-500 mt-1">
                            This action cannot be undone. All associated data will be permanently removed.
                        </p>
                    </div>
                </ModalBody>
            
                <Divider />
                
                <ModalFooter>
                    <Button 
                        onPress={onClose} 
                        isDisabled={loading} 
                        variant="light"
                    >
                        Cancel
                    </Button>
                    <Button
                        onPress={handleDelete}
                        color="danger"
                        isDisabled={loading || department.employee_count > 0}
                        isLoading={loading}
                    >
                        {loading ? 'Deleting...' : 'Delete Department'}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default DeleteDepartmentForm;
