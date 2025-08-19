import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Box,
    Avatar,
    Typography,
    InputAdornment,
    Chip
} from '@mui/material';
import { 
    MagnifyingGlassIcon,
    BuildingOfficeIcon,
    UserIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

const DepartmentEmployeeSelector = ({
    selectedDepartmentId,
    selectedEmployeeId,
    onDepartmentChange,
    onEmployeeChange,
    allUsers = [],
    departments = [],
    showSearch = true,
    variant = 'outlined',
    size = 'medium',
    disabled = false,
    required = false,
    error = {},
    label = {
        department: 'Department',
        employee: 'Employee'
    },
    showAllOption = true,
    autoSelectFirstDepartment = true,
    className = '',
    theme
}) => {
    const [departmentSearchTerm, setDepartmentSearchTerm] = useState('');
    const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
    const [loadingEmployees, setLoadingEmployees] = useState(false);

    // Auto-select first department if none selected and autoSelectFirstDepartment is true
    useEffect(() => {
        if (autoSelectFirstDepartment && departments.length > 0 && !selectedDepartmentId) {
            const firstDepartment = departments[0];
            if (firstDepartment) {
                onDepartmentChange(firstDepartment.id);
            }
        }
    }, [departments, selectedDepartmentId, onDepartmentChange, autoSelectFirstDepartment]);

    // Filtered departments based on search
    const filteredDepartments = useMemo(() => {
        if (!departmentSearchTerm.trim()) return departments;
        return departments.filter(dept => 
            dept.name.toLowerCase().includes(departmentSearchTerm.toLowerCase()) ||
            dept.id.toString().includes(departmentSearchTerm)
        );
    }, [departments, departmentSearchTerm]);

    // Get employees for selected department
    const departmentEmployees = useMemo(() => {
        if (!selectedDepartmentId) return showAllOption ? allUsers : [];
        return allUsers.filter(user => 
            String(user.department_id) === String(selectedDepartmentId)
        );
    }, [allUsers, selectedDepartmentId, showAllOption]);

    // Filtered employees based on search
    const filteredEmployees = useMemo(() => {
        if (!employeeSearchTerm.trim()) return departmentEmployees;
        return departmentEmployees.filter(user =>
            user.name.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
            user.id.toString().includes(employeeSearchTerm) ||
            user.designation?.toLowerCase().includes(employeeSearchTerm.toLowerCase())
        );
    }, [departmentEmployees, employeeSearchTerm]);

    // Reset employee selection when department changes
    useEffect(() => {
        if (selectedDepartmentId && selectedEmployeeId) {
            const isEmployeeInDepartment = departmentEmployees.some(
                emp => String(emp.id) === String(selectedEmployeeId)
            );
            if (!isEmployeeInDepartment) {
                onEmployeeChange('');
            }
        }
    }, [selectedDepartmentId, selectedEmployeeId, departmentEmployees, onEmployeeChange]);

    const handleDepartmentChange = useCallback((event) => {
        const deptId = event.target.value;
        // Convert string back to number for callback, or pass empty string
        onDepartmentChange(deptId === '' ? '' : parseInt(deptId));
        // Clear employee selection when department changes
        if (selectedEmployeeId) {
            onEmployeeChange('');
        }
        // Clear search terms
        setDepartmentSearchTerm('');
        setEmployeeSearchTerm('');
    }, [onDepartmentChange, onEmployeeChange, selectedEmployeeId]);

    const handleEmployeeChange = useCallback((event) => {
        const empId = event.target.value;
        // Convert string back to number for callback, or pass empty string
        onEmployeeChange(empId === '' ? '' : parseInt(empId));
        setEmployeeSearchTerm('');
    }, [onEmployeeChange]);

    return (
        <Box className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`}>
            {/* Department Selector */}
            <FormControl 
                variant={variant} 
                size={size} 
                error={Boolean(error.department_id)}
                disabled={disabled}
                required={required}
                fullWidth
            >
                <InputLabel id="department-select-label">
                    <Box className="flex items-center gap-2">
                        <BuildingOfficeIcon className="w-4 h-4" />
                        {label.department}
                    </Box>
                </InputLabel>
                <Select
                    labelId="department-select-label"
                    value={selectedDepartmentId ? String(selectedDepartmentId) : ''}
                    onChange={handleDepartmentChange}
                    label={label.department}
                    MenuProps={{
                        PaperProps: {
                            sx: {
                                backdropFilter: 'blur(16px) saturate(200%)',
                                background: theme?.glassCard?.background || 'rgba(255, 255, 255, 0.1)',
                                border: theme?.glassCard?.border || '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: 2,
                                maxHeight: 400,
                            },
                        },
                        disableAutoFocusItem: true,
                    }}
                >
                    {showSearch && (
                        <MenuItem 
                            disableRipple
                            sx={{ 
                                py: 1,
                                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                                '&:hover': { backgroundColor: 'transparent' },
                                cursor: 'default'
                            }}
                            onKeyDown={(e) => e.stopPropagation()}
                        >
                            <TextField
                                placeholder="Search departments..."
                                value={departmentSearchTerm}
                                onChange={(e) => {
                                    e.stopPropagation();
                                    setDepartmentSearchTerm(e.target.value);
                                }}
                                size="small"
                                fullWidth
                                variant="outlined"
                                autoFocus={false}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />
                                        </InputAdornment>
                                    ),
                                }}
                                onClick={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                        '& fieldset': {
                                            borderColor: 'rgba(255, 255, 255, 0.2)',
                                        },
                                        '&:hover fieldset': {
                                            borderColor: 'rgba(255, 255, 255, 0.3)',
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: 'rgba(255, 255, 255, 0.5)',
                                        },
                                    },
                                }}
                            />
                        </MenuItem>
                    )}
                    
                    {showAllOption && (
                        <MenuItem value="">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <BuildingOfficeIcon className="w-4 h-4" />
                                <Typography>All Departments</Typography>
                            </Box>
                        </MenuItem>
                    )}
                    
                    {filteredDepartments.map((department) => (
                        <MenuItem key={department.id} value={String(department.id)}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <BuildingOfficeIcon className="w-4 h-4" />
                                <Typography>{department.name}</Typography>
                                <Chip 
                                    label={allUsers.filter(u => u.department_id === department.id).length}
                                    size="small"
                                    variant="outlined"
                                    sx={{ ml: 'auto', fontSize: '0.7rem' }}
                                />
                            </Box>
                        </MenuItem>
                    ))}
                    
                    {filteredDepartments.length === 0 && departmentSearchTerm && (
                        <MenuItem disabled>
                            <Typography variant="body2" color="text.secondary">
                                No departments found matching "{departmentSearchTerm}"
                            </Typography>
                        </MenuItem>
                    )}
                </Select>
                {error.department_id && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                        {error.department_id}
                    </Typography>
                )}
            </FormControl>

            {/* Employee Selector */}
            <FormControl 
                variant={variant} 
                size={size} 
                error={Boolean(error.user_id)}
                disabled={disabled || loadingEmployees || (!selectedDepartmentId && !showAllOption)}
                required={required}
                fullWidth
            >
                <InputLabel id="employee-select-label">
                    <Box className="flex items-center gap-2">
                        <UserIcon className="w-4 h-4" />
                        {label.employee}
                        {(!selectedDepartmentId && !showAllOption) && (
                            <Typography variant="caption" color="text.secondary">
                                (Select department first)
                            </Typography>
                        )}
                    </Box>
                </InputLabel>
                <Select
                    labelId="employee-select-label"
                    value={selectedEmployeeId ? String(selectedEmployeeId) : ''}
                    onChange={handleEmployeeChange}
                    label={label.employee}
                    MenuProps={{
                        PaperProps: {
                            sx: {
                                backdropFilter: 'blur(16px) saturate(200%)',
                                background: theme?.glassCard?.background || 'rgba(255, 255, 255, 0.1)',
                                border: theme?.glassCard?.border || '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: 2,
                                maxHeight: 400,
                            },
                        },
                        disableAutoFocusItem: true,
                    }}
                >
                    {showSearch && (
                        <MenuItem 
                            disableRipple
                            sx={{ 
                                py: 1,
                                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                                '&:hover': { backgroundColor: 'transparent' },
                                cursor: 'default'
                            }}
                            onKeyDown={(e) => e.stopPropagation()}
                        >
                            <TextField
                                placeholder="Search employees..."
                                value={employeeSearchTerm}
                                onChange={(e) => {
                                    e.stopPropagation();
                                    setEmployeeSearchTerm(e.target.value);
                                }}
                                size="small"
                                fullWidth
                                variant="outlined"
                                autoFocus={false}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />
                                        </InputAdornment>
                                    ),
                                }}
                                onClick={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                        '& fieldset': {
                                            borderColor: 'rgba(255, 255, 255, 0.2)',
                                        },
                                        '&:hover fieldset': {
                                            borderColor: 'rgba(255, 255, 255, 0.3)',
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: 'rgba(255, 255, 255, 0.5)',
                                        },
                                    },
                                }}
                            />
                        </MenuItem>
                    )}
                    
                    {showAllOption && (
                        <MenuItem value="">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <UserIcon className="w-4 h-4" />
                                <Typography>
                                    {selectedDepartmentId ? 'All Employees in Department' : 'Select Department First'}
                                </Typography>
                            </Box>
                        </MenuItem>
                    )}
                    
                    {filteredEmployees.map((user) => (
                        <MenuItem key={user.id} value={String(user.id)}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                                <Avatar
                                    src={user.profile_image_url || user.profile_image}
                                    sx={{ width: 24, height: 24 }}
                                >
                                    {user.name?.charAt(0)?.toUpperCase()}
                                </Avatar>
                                <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                        {user.name}
                                    </Typography>
                                    {user.designation && (
                                        <Typography variant="caption" color="text.secondary">
                                            {user.designation}
                                        </Typography>
                                    )}
                                </Box>
                                {user.department && (
                                    <Chip 
                                        label={user.department}
                                        size="small"
                                        variant="outlined"
                                        sx={{ fontSize: '0.6rem', height: '20px' }}
                                    />
                                )}
                            </Box>
                        </MenuItem>
                    ))}
                    
                    {filteredEmployees.length === 0 && (
                        <MenuItem disabled>
                            <Typography variant="body2" color="text.secondary">
                                {selectedDepartmentId 
                                    ? 'No employees found in selected department'
                                    : 'No employees found'
                                }
                            </Typography>
                        </MenuItem>
                    )}
                </Select>
                {error.user_id && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                        {error.user_id}
                    </Typography>
                )}
            </FormControl>
        </Box>
    );
};

export default DepartmentEmployeeSelector;
