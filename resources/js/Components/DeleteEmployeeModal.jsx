import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    Box,
    Alert,
    Chip
} from '@mui/material';
import { 
    ExclamationTriangleIcon,
    BuildingOfficeIcon,
    BriefcaseIcon,
    TrashIcon
} from '@heroicons/react/24/outline';
import { Button } from '@heroui/react';
import { useTheme } from '@mui/material/styles';
import GlassDialog from './GlassDialog';
import ProfileAvatar from './ProfileAvatar';

const DeleteEmployeeModal = ({ 
    open, 
    onClose, 
    employee, 
    onConfirm,
    loading = false 
}) => {
    const theme = useTheme();
    
    if (!employee) return null;

    const hasActiveData = employee.active_projects_count > 0 || 
                         employee.pending_leaves_count > 0 || 
                         employee.active_trainings_count > 0;

    return (
        <GlassDialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2,
                pb: 2,
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.05))',
                borderBottom: `1px solid ${theme.palette.error.main}30`
            }}>
                <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 2,
                    color: theme.palette.error.main 
                }}>
                    <Box sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '12px',
                        background: `linear-gradient(135deg, ${theme.palette.error.main}20, ${theme.palette.error.main}10)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: `1px solid ${theme.palette.error.main}30`
                    }}>
                        <ExclamationTriangleIcon className="w-5 h-5" />
                    </Box>
                    <Typography variant="h6" component="h2" fontWeight="600">
                        Delete Employee
                    </Typography>
                </Box>
            </DialogTitle>

            <DialogContent sx={{ py: 0 }}>
                {/* Employee Information */}
                <Box sx={{ 
                    p: 3, 
                    borderRadius: 3, 
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(20px) saturate(180%)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    mb: 3,
                    transition: 'all 0.3s ease'
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
                        <ProfileAvatar
                            src={employee.profile_image_url || employee.profile_image}
                            name={employee.name}
                            size="lg"
                            className="ring-2 ring-white/20 shadow-lg"
                        />
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" fontWeight="600" sx={{ mb: 0.5 }}>
                                {employee.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {employee.email}
                            </Typography>
                            {employee.employee_id && (
                                <Typography variant="caption" color="text.secondary" sx={{ 
                                    display: 'block',
                                    mt: 0.5,
                                    px: 1.5,
                                    py: 0.5,
                                    borderRadius: 1,
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    width: 'fit-content'
                                }}>
                                    ID: {employee.employee_id}
                                </Typography>
                            )}
                        </Box>
                    </Box>
                    
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                        <Box sx={{ 
                            p: 2, 
                            borderRadius: 2, 
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <BuildingOfficeIcon className="w-4 h-4 text-blue-400" />
                                <Typography variant="caption" color="text.secondary" fontWeight="500">
                                    Department
                                </Typography>
                            </Box>
                            <Typography variant="body2" fontWeight="500">
                                {employee.department_name || 'Not assigned'}
                            </Typography>
                        </Box>
                        
                        <Box sx={{ 
                            p: 2, 
                            borderRadius: 2, 
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <BriefcaseIcon className="w-4 h-4 text-purple-400" />
                                <Typography variant="caption" color="text.secondary" fontWeight="500">
                                    Designation
                                </Typography>
                            </Box>
                            <Typography variant="body2" fontWeight="500">
                                {employee.designation_name || 'Not assigned'}
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                {/* Warning Section */}
                <Alert 
                    severity="error" 
                    sx={{ 
                        mb: 3,
                        borderRadius: 3,
                        background: 'rgba(239, 68, 68, 0.1)',
                        backdropFilter: 'blur(20px) saturate(180%)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        '& .MuiAlert-icon': {
                            color: theme.palette.error.main
                        },
                        '& .MuiAlert-message': {
                            color: theme.palette.error.main
                        }
                    }}
                >
                    <Typography variant="body2" fontWeight="500">
                        This action will permanently delete the employee record and cannot be undone.
                    </Typography>
                </Alert>

                {/* Active Data Warning */}
                {hasActiveData && (
                    <Box sx={{ 
                        p: 3, 
                        borderRadius: 3, 
                        background: 'rgba(251, 146, 60, 0.1)',
                        backdropFilter: 'blur(20px) saturate(180%)',
                        border: '1px solid rgba(251, 146, 60, 0.3)',
                        mb: 3
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Box sx={{
                                width: 32,
                                height: 32,
                                borderRadius: '8px',
                                background: 'rgba(251, 146, 60, 0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <ExclamationTriangleIcon className="w-4 h-4 text-orange-400" />
                            </Box>
                            <Typography variant="subtitle2" color="warning.main" fontWeight="600">
                                Employee Has Active Data
                            </Typography>
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            This employee has the following active records that will also be affected:
                        </Typography>
                        
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {employee.active_projects_count > 0 && (
                                <Chip 
                                    size="small" 
                                    label={`${employee.active_projects_count} Active Projects`}
                                    sx={{
                                        background: 'rgba(251, 146, 60, 0.2)',
                                        color: 'orange',
                                        border: '1px solid rgba(251, 146, 60, 0.3)',
                                        backdropFilter: 'blur(10px)'
                                    }}
                                />
                            )}
                            {employee.pending_leaves_count > 0 && (
                                <Chip 
                                    size="small" 
                                    label={`${employee.pending_leaves_count} Pending Leaves`}
                                    sx={{
                                        background: 'rgba(251, 146, 60, 0.2)',
                                        color: 'orange',
                                        border: '1px solid rgba(251, 146, 60, 0.3)',
                                        backdropFilter: 'blur(10px)'
                                    }}
                                />
                            )}
                            {employee.active_trainings_count > 0 && (
                                <Chip 
                                    size="small" 
                                    label={`${employee.active_trainings_count} Active Trainings`}
                                    sx={{
                                        background: 'rgba(251, 146, 60, 0.2)',
                                        color: 'orange',
                                        border: '1px solid rgba(251, 146, 60, 0.3)',
                                        backdropFilter: 'blur(10px)'
                                    }}
                                />
                            )}
                        </Box>
                    </Box>
                )}

                {/* Confirmation Text */}
                <Box sx={{ 
                    p: 3, 
                    borderRadius: 3, 
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    mb: 2
                }}>
                    <Typography variant="body1" sx={{ mb: 1, fontWeight: 500 }}>
                        Are you sure you want to delete <Box component="span" sx={{ 
                            color: theme.palette.error.main, 
                            fontWeight: 600 
                        }}>
                            {employee.name}
                        </Box>?
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Type the employee's name below to confirm this permanent deletion:
                    </Typography>
                </Box>
            </DialogContent>

            <DialogActions sx={{ 
                px: 3, 
                py: 3, 
                justifyContent: 'space-between',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(255, 255, 255, 0.02)'
            }}>
                <Button 
                    variant="light" 
                    onPress={onClose}
                    disabled={loading}
                    className="hover:bg-white/10"
                >
                    Cancel
                </Button>
                <Button
                    color="danger"
                    variant="solid"
                    onPress={onConfirm}
                    isLoading={loading}
                    startContent={!loading && <TrashIcon className="w-4 h-4" />}
                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg"
                >
                    {loading ? 'Deleting...' : 'Delete Employee'}
                </Button>
            </DialogActions>
        </GlassDialog>
    );
};

export default DeleteEmployeeModal;
