import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Select,
    SelectItem,
    Input,
    Avatar,
    Chip
} from '@heroui/react';
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

    return (
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`}>
            {/* Department Selector */}
            <div>
                <Select
                    label={
                        <div className="flex items-center gap-2">
                            <BuildingOfficeIcon className="w-4 h-4" />
                            {label.department}
                        </div>
                    }
                    selectedKeys={selectedDepartmentId ? [String(selectedDepartmentId)] : []}
                    onSelectionChange={(keys) => {
                        const deptId = Array.from(keys)[0];
                        onDepartmentChange(deptId === '' ? '' : parseInt(deptId));
                        if (selectedEmployeeId) {
                            onEmployeeChange('');
                        }
                        setDepartmentSearchTerm('');
                        setEmployeeSearchTerm('');
                    }}
                    isDisabled={disabled}
                    isRequired={required}
                    isInvalid={Boolean(error.department_id)}
                    errorMessage={error.department_id}
                    variant={variant}
                >
                    {showAllOption && (
                        <SelectItem key="" value="">
                            <div className="flex items-center gap-2">
                                <BuildingOfficeIcon className="w-4 h-4" />
                                <span>All Departments</span>
                            </div>
                        </SelectItem>
                    )}
                    
                    {filteredDepartments.map((department) => (
                        <SelectItem key={String(department.id)} value={String(department.id)}>
                            <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-2">
                                    <BuildingOfficeIcon className="w-4 h-4" />
                                    <span>{department.name}</span>
                                </div>
                                <Chip 
                                    size="sm" 
                                    variant="bordered"
                                    className="ml-auto text-xs"
                                >
                                    {allUsers.filter(u => u.department_id === department.id).length}
                                </Chip>
                            </div>
                        </SelectItem>
                    ))}
                </Select>
            </div>

            {/* Employee Selector */}
            <div>
                <Select
                    label={
                        <div className="flex items-center gap-2">
                            <UserIcon className="w-4 h-4" />
                            {label.employee}
                            {(!selectedDepartmentId && !showAllOption) && (
                                <span className="text-xs text-gray-500">(Select department first)</span>
                            )}
                        </div>
                    }
                    selectedKeys={selectedEmployeeId ? [String(selectedEmployeeId)] : []}
                    onSelectionChange={(keys) => {
                        const empId = Array.from(keys)[0];
                        onEmployeeChange(empId === '' ? '' : parseInt(empId));
                        setEmployeeSearchTerm('');
                    }}
                    isDisabled={disabled || loadingEmployees || (!selectedDepartmentId && !showAllOption)}
                    isRequired={required}
                    isInvalid={Boolean(error.user_id)}
                    errorMessage={error.user_id}
                    variant={variant}
                >
                    {showAllOption && (
                        <SelectItem key="" value="">
                            <div className="flex items-center gap-2">
                                <UserIcon className="w-4 h-4" />
                                <span>
                                    {selectedDepartmentId ? 'All Employees in Department' : 'Select Department First'}
                                </span>
                            </div>
                        </SelectItem>
                    )}
                    
                    {filteredEmployees.map((user) => (
                        <SelectItem key={String(user.id)} value={String(user.id)}>
                            <div className="flex items-center gap-2 w-full">
                                <Avatar
                                    src={user.profile_image_url || user.profile_image}
                                    size="sm"
                                    name={user.name}
                                    showFallback
                                />
                                <div className="flex flex-col flex-1">
                                    <span className="text-sm font-medium">{user.name}</span>
                                    {user.designation && (
                                        <span className="text-xs text-gray-500">{user.designation}</span>
                                    )}
                                </div>
                                {user.department && (
                                    <Chip 
                                        size="sm"
                                        variant="bordered"
                                        className="text-xs h-5"
                                    >
                                        {user.department}
                                    </Chip>
                                )}
                            </div>
                        </SelectItem>
                    ))}
                    
                    {filteredEmployees.length === 0 && (
                        <SelectItem key="no-employees" isDisabled>
                            <span className="text-sm text-gray-500">
                                {selectedDepartmentId 
                                    ? 'No employees found in selected department'
                                    : 'No employees found'
                                }
                            </span>
                        </SelectItem>
                    )}
                </Select>
            </div>
        </div>
    );
};

export default DepartmentEmployeeSelector;
