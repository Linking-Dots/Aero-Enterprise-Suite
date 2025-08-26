import React, { useState, useMemo } from "react";
import { Link, router } from '@inertiajs/react';
import { toast } from "react-toastify";
import axios from 'axios';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableColumn, 
  TableHeader, 
  TableRow, 
  User,
  Chip,
  Tooltip,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Select,
  SelectItem,
  Spinner,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Switch,
  Pagination
} from "@heroui/react";
import {
  PencilIcon,
  TrashIcon,
  EllipsisVerticalIcon,
  UserIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  EnvelopeIcon,
  PhoneIcon,
  ClockIcon,
  CogIcon,
  CheckCircleIcon,
  XCircleIcon,
  HashtagIcon
} from "@heroicons/react/24/outline";
import DeleteEmployeeModal from '@/Components/DeleteEmployeeModal';
import ProfilePictureModal from '@/Components/ProfilePictureModal';
import ProfileAvatar from '@/Components/ProfileAvatar';

const EmployeeTable = ({ 
  allUsers, 
  departments, 
  designations, 
  attendanceTypes, 
  setUsers, 
  isMobile, 
  isTablet,
  pagination,
  onPageChange,
  onRowsPerPageChange,
  totalUsers = 0,
  loading = false,
  updateEmployeeOptimized,
  deleteEmployeeOptimized
}) => {
  // Custom theme for glassmorphism styling
  const glassTheme = {
    glassCard: {
      background: 'rgba(15, 20, 25, 0.15)',
      border: '1px solid rgba(255, 255, 255, 0.2)'
    },
    palette: {
      text: {
        primary: '#ffffff'
      }
    }
  };
  
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [attendanceConfig, setAttendanceConfig] = useState({});
  
  // Delete confirmation modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Profile picture modal state
  const [profilePictureModal, setProfilePictureModal] = useState({
    isOpen: false,
    employee: null
  });

  const handleDepartmentChange = async (userId, departmentId) => {
    const promise = new Promise(async (resolve, reject) => {
      try {
        const response = await axios.post(route('user.updateDepartment', { id: userId }), {
          department: departmentId
        });

        if (response.status === 200) {
          const departmentObj = departments.find(d => d.id === parseInt(departmentId)) || null;
          updateEmployeeOptimized?.(userId, {
            department_id: departmentId,
            department_name: departmentObj?.name || null,
            designation_id: null,
            designation_name: null
          });
          
          resolve('Department updated successfully');
        }
      } catch (error) {
        console.error('Error updating department:', error);
        reject('Failed to update department');
      }
    });

    toast.promise(promise, {
      pending: {
        render() {
          return (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Spinner size="sm" />
              <span style={{ marginLeft: '8px' }}>Updating department...</span>
            </div>
          );
        },
        icon: false,
        style: {
          backdropFilter: 'blur(16px) saturate(200%)',
          background: glassTheme.glassCard?.background || 'rgba(15, 20, 25, 0.15)',
          border: glassTheme.glassCard?.border || '1px solid rgba(255, 255, 255, 0.2)',
          color: glassTheme.palette?.text?.primary || '#ffffff',
        },
      },
      success: {
        render({ data }) {
          return <div>{data}</div>;
        },
        icon: '🟢',
        style: {
          backdropFilter: 'blur(16px) saturate(200%)',
          background: glassTheme.glassCard?.background || 'rgba(15, 20, 25, 0.15)',
          border: glassTheme.glassCard?.border || '1px solid rgba(255, 255, 255, 0.2)',
          color: glassTheme.palette?.text?.primary || '#ffffff',
        },
      },
      error: {
        render({ data }) {
          return <div>{data}</div>;
        },
        icon: '🔴',
        style: {
          backdropFilter: 'blur(16px) saturate(200%)',
          background: glassTheme.glassCard?.background || 'rgba(15, 20, 25, 0.15)',
          border: glassTheme.glassCard?.border || '1px solid rgba(255, 255, 255, 0.2)',
          color: glassTheme.palette?.text?.primary || '#ffffff',
        },
      },
    });
  };

  const handleDesignationChange = async (userId, designationId) => {
    const promise = new Promise(async (resolve, reject) => {
      try {
        const response = await axios.post(route('user.updateDesignation', { id: userId }), {
          designation_id: designationId
        });

        if (response.status === 200) {
          const designationObj = designations.find(d => d.id === parseInt(designationId)) || null;
          updateEmployeeOptimized?.(userId, {
            designation_id: designationId,
            designation_name: designationObj?.title || null
          });
          
          resolve("Designation updated successfully");
        }
      } catch (err) {
        console.error('Error updating designation:', err);
        reject("Failed to update designation");
      }
    });

    toast.promise(promise, {
      pending: {
        render() {
          return (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Spinner size="sm" />
              <span style={{ marginLeft: '8px' }}>Updating designation...</span>
            </div>
          );
        },
        icon: false,
        style: {
          backdropFilter: 'blur(16px) saturate(200%)',
          background: glassTheme.glassCard?.background || 'rgba(15, 20, 25, 0.15)',
          border: glassTheme.glassCard?.border || '1px solid rgba(255, 255, 255, 0.2)',
          color: glassTheme.palette?.text?.primary || '#ffffff',
        },
      },
      success: {
        render({ data }) {
          return <div>{data}</div>;
        },
        icon: '🟢',
        style: {
          backdropFilter: 'blur(16px) saturate(200%)',
          background: glassTheme.glassCard?.background || 'rgba(15, 20, 25, 0.15)',
          border: glassTheme.glassCard?.border || '1px solid rgba(255, 255, 255, 0.2)',
          color: glassTheme.palette?.text?.primary || '#ffffff',
        },
      },
      error: {
        render({ data }) {
          return <div>{data}</div>;
        },
        icon: '🔴',
        style: {
          backdropFilter: 'blur(16px) saturate(200%)',
          background: glassTheme.glassCard?.background || 'rgba(15, 20, 25, 0.15)',
          border: glassTheme.glassCard?.border || '1px solid rgba(255, 255, 255, 0.2)',
          color: glassTheme.palette?.text?.primary || '#ffffff',
        },
      },
    });
  };

  // Handle attendance type change
  const handleAttendanceTypeChange = async (userId, attendanceTypeId) => {
    const promise = new Promise(async (resolve, reject) => {
      try {
        const response = await axios.post(route('user.updateAttendanceType', { id: userId }), {
          attendance_type_id: attendanceTypeId
        });
        
        if (response.status === 200) {
          // Get the attendance type object
          const attendanceTypeObj = attendanceTypes.find(t => t.id === parseInt(attendanceTypeId)) || null;
          
          // Update optimistically
          if (updateEmployeeOptimized) {
            updateEmployeeOptimized(userId, { 
              attendance_type_id: attendanceTypeId,
              attendance_type_name: attendanceTypeObj?.name || null
            });
          }
          
          resolve('Attendance type updated successfully');
        }
      } catch (error) {
        console.error('Error updating attendance type:', error);
        reject('Failed to update attendance type');
      }
    });

    toast.promise(promise, {
      pending: {
        render() {
          return (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Spinner size="sm" />
              <span style={{ marginLeft: '8px' }}>Updating attendance type...</span>
            </div>
          );
        },
        icon: false,
        style: {
          backdropFilter: 'blur(16px) saturate(200%)',
          background: glassTheme.glassCard?.background || 'rgba(15, 20, 25, 0.15)',
          border: glassTheme.glassCard?.border || '1px solid rgba(255, 255, 255, 0.2)',
          color: glassTheme.palette?.text?.primary || '#ffffff',
        },
      },
      success: {
        render({ data }) {
          return <div>{data}</div>;
        },
        icon: '🟢',
        style: {
          backdropFilter: 'blur(16px) saturate(200%)',
          background: glassTheme.glassCard?.background || 'rgba(15, 20, 25, 0.15)',
          border: glassTheme.glassCard?.border || '1px solid rgba(255, 255, 255, 0.2)',
          color: glassTheme.palette?.text?.primary || '#ffffff',
        },
      },
      error: {
        render({ data }) {
          return <div>{data}</div>;
        },
        icon: '🔴',
        style: {
          backdropFilter: 'blur(16px) saturate(200%)',
          background: glassTheme.glassCard?.background || 'rgba(15, 20, 25, 0.15)',
          border: glassTheme.glassCard?.border || '1px solid rgba(255, 255, 255, 0.2)',
          color: glassTheme.palette?.text?.primary || '#ffffff',
        },
      },
    });
  };

  // Delete employee - Enhanced with confirmation modal
  const handleDeleteClick = (user) => {
    setEmployeeToDelete(user);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!employeeToDelete) return;
    
    setDeleteLoading(true);

    const promise = new Promise(async (resolve, reject) => {
      try {
        const response = await axios.delete(route('user.delete', { id: employeeToDelete.id }));
        
        if (response.status === 200) {
          // Update optimistically
          if (deleteEmployeeOptimized) {
            deleteEmployeeOptimized(employeeToDelete.id);
          }
          
          // Close modal and reset state
          setDeleteModalOpen(false);
          setEmployeeToDelete(null);
          
          resolve('Employee deleted successfully');
        }
      } catch (error) {
        console.error('Error deleting employee:', error);
        
        // Handle specific error responses
        let errorMessage = 'Failed to delete employee';
        if (error.response?.status === 403) {
          errorMessage = 'You do not have permission to delete this employee';
        } else if (error.response?.status === 404) {
          errorMessage = 'Employee not found or already deleted';
        } else if (error.response?.data?.error) {
          errorMessage = error.response.data.error;
        }
        
        reject(errorMessage);
      } finally {
        setDeleteLoading(false);
      }
    });

    toast.promise(promise, {
      pending: {
        render() {
          return (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Spinner size="sm" />
              <span style={{ marginLeft: '8px' }}>Deleting employee...</span>
            </div>
          );
        },
        icon: false,
        style: {
          backdropFilter: 'blur(16px) saturate(200%)',
          background: glassTheme.glassCard?.background || 'rgba(15, 20, 25, 0.15)',
          border: glassTheme.glassCard?.border || '1px solid rgba(255, 255, 255, 0.2)',
          color: glassTheme.palette?.text?.primary || '#ffffff',
        },
      },
      success: {
        render({ data }) {
          return <div>{data}</div>;
        },
        icon: '✅',
        style: {
          backdropFilter: 'blur(16px) saturate(200%)',
          background: glassTheme.glassCard?.background || 'rgba(15, 20, 25, 0.15)',
          border: glassTheme.glassCard?.border || '1px solid rgba(255, 255, 255, 0.2)',
          color: glassTheme.palette?.text?.primary || '#ffffff',
        },
      },
      error: {
        render({ data }) {
          return <div>{data}</div>;
        },
        icon: '❌',
        style: {
          backdropFilter: 'blur(16px) saturate(200%)',
          background: glassTheme.glassCard?.background || 'rgba(15, 20, 25, 0.15)',
          border: glassTheme.glassCard?.border || '1px solid rgba(255, 255, 255, 0.2)',
          color: glassTheme.palette?.text?.primary || '#ffffff',
        },
      },
    });
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setEmployeeToDelete(null);
  };

  // Profile picture modal handlers
  const handleProfilePictureClick = (employee) => {
    setProfilePictureModal({
      isOpen: true,
      employee: employee
    });
  };

  const handleProfilePictureClose = () => {
    setProfilePictureModal({
      isOpen: false,
      employee: null
    });
  };

  const handleImageUpdate = (employeeId, newImageUrl) => {
    // Update the employee's profile image in the local state
    if (updateEmployeeOptimized) {
      updateEmployeeOptimized(employeeId, {
        profile_image_url: newImageUrl
      });
    }
  };

  const columns = useMemo(() => {
    const baseColumns = [
      { name: "#", uid: "sl", width: 60 },
      { name: "EMPLOYEE", uid: "employee", width: "auto", minWidth: 200 },
      { name: "DEPARTMENT", uid: "department", width: 180 },
      { name: "DESIGNATION", uid: "designation", width: 180 },
      { name: "ACTIONS", uid: "actions", width: 80 }
    ];

    // Add or remove columns based on screen size
    if (!isMobile) {
      baseColumns.splice(2, 0, { name: "CONTACT", uid: "contact", width: 220 });
    }
    
    if (!isMobile && !isTablet) {
      baseColumns.splice(baseColumns.length - 1, 0, { name: "ATTENDANCE TYPE", uid: "attendance_type", width: 180 });
    }
    
    return baseColumns;
  }, [isMobile, isTablet]);

  // Render cell content based on column type
  const renderCell = (user, columnKey, index) => {
    const cellValue = user[columnKey];
    
    // Calculate serial number based on pagination
    const startIndex = pagination?.currentPage && pagination?.perPage 
      ? Number((pagination.currentPage - 1) * pagination.perPage) 
      : 0;
    // Since index might be undefined, ensure it has a numeric value
    const safeIndex = typeof index === 'number' ? index : 0;
    const serialNumber = startIndex + safeIndex + 1;
      
    switch (columnKey) {
      case "sl":
        return (
          <div className="flex items-center justify-center">
            <div className="flex items-center justify-center w-8 h-8 bg-white/10 backdrop-blur-md rounded-lg border border-white/20">
              <span className="text-sm font-semibold text-foreground">
                {serialNumber}
              </span>
            </div>
          </div>
        );

      case "employee":
        return (
          <div className="min-w-max">
            <div className="flex items-center gap-3">
              <ProfileAvatar
                src={user?.profile_image_url || user?.profile_image}
                name={user?.name}
                size={isMobile ? "sm" : "md"}
                onClick={() => handleProfilePictureClick(user)}
              />
              <div className="flex flex-col">
                <p className="font-semibold text-foreground text-left whitespace-nowrap">
                  {user?.name}
                </p>
                {!isMobile && (
                  <p className="text-default-500 text-left text-xs whitespace-nowrap">
                    ID: {user?.employee_id || 'N/A'}
                  </p>
                )}
              </div>
            </div>
            {isMobile && (
              <div className="flex flex-col gap-1 text-xs text-default-500 ml-10 mt-2">
                <div className="flex items-center gap-1 whitespace-nowrap">
                  <HashtagIcon className="w-3 h-3" />
                  {user?.employee_id || 'N/A'}
                </div>
                <div className="flex items-center gap-1">
                  <EnvelopeIcon className="w-3 h-3" />
                  <span className="truncate max-w-[150px]">{user?.email}</span>
                </div>
                {user?.phone && (
                  <div className="flex items-center gap-1 whitespace-nowrap">
                    <PhoneIcon className="w-3 h-3" />
                    {user?.phone}
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case "contact":
        return (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sm">
              <EnvelopeIcon className="w-4 h-4 text-default-400" />
              <span className="text-foreground">{user?.email}</span>
            </div>
            {user?.phone && (
              <div className="flex items-center gap-2 text-sm">
                <PhoneIcon className="w-4 h-4 text-default-400" />
                <span className="text-foreground">{user?.phone}</span>
              </div>
            )}
          </div>
        );
        case "department":
          return (
            <div className="flex flex-col gap-2 min-w-[150px]">
              <Dropdown>
                <DropdownTrigger>
                  <Button 
                    variant="bordered"
                    size="sm"
                    className="justify-between backdrop-blur-md border-white/20 min-w-[150px] bg-white/10 hover:bg-white/15 transition-all duration-300"
                    startContent={<BuildingOfficeIcon className="w-4 h-4" />}
                    endContent={<EllipsisVerticalIcon className="w-4 h-4 rotate-90" />}
                  >
                    <span>
                      {user.department_name || "Select Department"}
                    </span>
                  </Button>
                </DropdownTrigger>
                <DropdownMenu aria-label="Department options">
                  {departments?.map((dept) => (
                    <DropdownItem
                      key={dept.id.toString()}
                      onPress={() => handleDepartmentChange(user.id, dept.id)}
                    >
                      {dept.name}
                    </DropdownItem>
                  ))}
                </DropdownMenu>
              </Dropdown>
            </div>
          );

        case "designation":
          const departmentId = user.department_id;
          const filteredDesignations = designations?.filter(d => d.department_id === parseInt(departmentId)) || [];

          return (
            <div className="flex flex-col gap-2 min-w-[150px]">
              <Dropdown isDisabled={!departmentId}>
                <DropdownTrigger>
                  <Button 
                    variant="bordered"
                    size="sm"
                    className={`justify-between backdrop-blur-md border-white/20 min-w-[150px] transition-all duration-300 ${
                      !departmentId
                        ? 'bg-gray-500/20 border-gray-400/40 opacity-50'
                        : 'bg-white/10 hover:bg-white/15'
                    }`}
                    isDisabled={!departmentId}
                    startContent={<BriefcaseIcon className="w-4 h-4" />}
                    endContent={departmentId && <EllipsisVerticalIcon className="w-4 h-4 rotate-90" />}
                  >
                    <span>
                      {!departmentId ? 'Select Department First' :
                       (user.designation_name || "Select Designation")}
                    </span>
                  </Button>
                </DropdownTrigger>
                <DropdownMenu aria-label="Designation options">
                  {filteredDesignations.map((desig) => (
                    <DropdownItem
                      key={desig.id.toString()}
                      onPress={() => handleDesignationChange(user.id, desig.id)}
                    >
                      {desig.title}
                    </DropdownItem>
                  ))}
                </DropdownMenu>
              </Dropdown>
            </div>
          );

      case "attendance_type":
        return (
          <div className="flex flex-col gap-2 min-w-[150px]">
            <Dropdown>
              <DropdownTrigger>
                <Button 
                  variant="bordered"
                  size="sm"
                  className="justify-between backdrop-blur-md border-white/20 min-w-[150px] bg-white/10 hover:bg-white/15 transition-all duration-300"
                  startContent={<ClockIcon className="w-4 h-4" />}
                  endContent={<EllipsisVerticalIcon className="w-4 h-4 rotate-90" />}
                >
                  <span>
                    {user.attendance_type_name || "Select Type"}
                  </span>
                </Button>
              </DropdownTrigger>
              <DropdownMenu aria-label="Attendance Type options">
                {attendanceTypes?.map((type) => (
                  <DropdownItem
                    key={type.id.toString()}
                    onPress={() => handleAttendanceTypeChange(user.id, type.id)}
                  >
                    {type.name}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
          </div>
        );

      case "actions":
        return (
          <div className="relative flex justify-center items-center">
            <Dropdown>
              <DropdownTrigger>
                <Button 
                  isIconOnly 
                  variant="light" 
                  className="text-default-400 hover:text-foreground transition-all duration-300"
                >
                  <EllipsisVerticalIcon className="w-5 h-5" />
                </Button>
              </DropdownTrigger>
              <DropdownMenu aria-label="Employee Actions">
                <DropdownItem 
                  key="edit" 
                  startContent={<PencilIcon className="w-4 h-4" />}
                  onPress={() => router.visit(route('profile', { user: user.id }))}
                >
                  Edit Profile
                </DropdownItem>
                
                <DropdownItem 
                  key="delete" 
                  className="text-danger"
                  color="danger"
                  startContent={<TrashIcon className="w-4 h-4" />}
                  onPress={() => handleDeleteClick(user)}
                >
                  Delete
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        );
      default:
        return cellValue;
    }
  };

  // Render pagination information and controls
  const renderPagination = () => {
    if (!pagination || loading) return null;
    
    return (
      <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-2 border-t border-white/10 bg-white/5 backdrop-blur-md">
        <span className="text-xs text-default-400 mb-3 sm:mb-0">
          Showing {((pagination.currentPage - 1) * pagination.perPage) + 1} to {
            Math.min(pagination.currentPage * pagination.perPage, pagination.total)
          } of {pagination.total} employees
        </span>
        
        <Pagination
          total={Math.ceil(pagination.total / pagination.perPage)}
          initialPage={pagination.currentPage}
          page={pagination.currentPage}
          onChange={onPageChange}
          size={isMobile ? "sm" : "md"}
          variant="bordered"
          showControls
          classNames={{
            item: "bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15",
            cursor: "bg-white/20 backdrop-blur-md border-white/20",
          }}
        />
      </div>
    );
  };

  return (
    <div className="w-full overflow-hidden flex flex-col border border-white/10 rounded-lg relative" style={{ maxHeight: 'calc(100vh - 200px)' }}>
      {/* Global loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-black/20 backdrop-blur-xs flex items-center justify-center z-50 rounded-lg">
          <div className="flex flex-col items-center gap-4 p-6 bg-white/10 backdrop-blur-md rounded-lg border border-white/20">
            <Spinner size="lg" color="primary" />
            <span className="text-sm text-foreground">Loading employees...</span>
          </div>
        </div>
      )}
      
      <div className="overflow-auto grow">
        <Table
          aria-label="Employees table"
          removeWrapper
          classNames={{
            base: "bg-transparent min-w-[800px]", // Set minimum width to prevent squishing on small screens
            th: "bg-white/5 backdrop-blur-md text-default-500 border-b border-white/10 font-medium text-xs sticky top-0 z-10 whitespace-nowrap",
            td: "border-b border-white/5 py-3 whitespace-nowrap",
            table: "border-collapse table-auto",
            thead: "bg-white/5",
            tr: "hover:bg-white/5"
          }}
          isHeaderSticky
          isCompact={isMobile}
        >
          <TableHeader columns={columns}>
            {(column) => (
              <TableColumn 
                key={column.uid} 
                align={column.uid === "actions" ? "center" : column.uid === "sl" ? "center" : "start"}
                width={column.width}
                minWidth={column.minWidth}
                className={column.uid === "employee" ? "whitespace-nowrap" : ""}
              >
                {column.name}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody 
            items={allUsers || []} 
            emptyContent="No employees found"
            loadingContent={<Spinner />}
            isLoading={loading}
          >
            {(item, index) => {
              // Find the index of this item in the allUsers array to ensure accurate serial numbers
              const itemIndex = allUsers ? allUsers.findIndex(user => user.id === item.id) : index;
              
              return (
                <TableRow 
                  key={item.id}
                  className="transition-all duration-300 hover:bg-white/5"
                >
                  {(columnKey) => (
                    <TableCell className="transition-all duration-300">
                      <div className="transition-all duration-200">
                        {renderCell(item, columnKey, itemIndex)}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              );
            }}
          </TableBody>
        </Table>
      </div>
      {/* Pagination is moved outside the scrollable area to make it sticky */}
      {renderPagination()}
      
      {/* Delete Employee Confirmation Modal */}
      <DeleteEmployeeModal
        open={deleteModalOpen}
        onClose={handleDeleteCancel}
        employee={employeeToDelete}
        onConfirm={handleDeleteConfirm}
        loading={deleteLoading}
      />
      
      {/* Profile Picture Update Modal */}
      <ProfilePictureModal
        isOpen={profilePictureModal.isOpen}
        onClose={handleProfilePictureClose}
        employee={profilePictureModal.employee}
        onImageUpdate={handleImageUpdate}
      />
    </div>
  );
};

export default EmployeeTable;
                