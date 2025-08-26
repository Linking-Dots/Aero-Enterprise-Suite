import React, { useState, useMemo, useEffect } from "react";
import { Link } from '@inertiajs/react';
import { toast } from "react-toastify";
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
  Switch,
  Pagination,
  Spinner,
  Select,
  SelectItem
} from "@heroui/react";
import {
  PencilIcon,
  TrashIcon,
  EllipsisVerticalIcon,
  UserIcon,
  ShieldCheckIcon,
  CalendarIcon,
  EnvelopeIcon,
  PhoneIcon,
  HashtagIcon,
  CheckCircleIcon,
  XCircleIcon,
  BuildingOfficeIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  DeviceTabletIcon,
  LockClosedIcon,
  LockOpenIcon,
  ArrowPathIcon,
  ClockIcon
} from "@heroicons/react/24/outline";

const UsersTable = ({ 
  allUsers, 
  roles, 
  isMobile, 
  isTablet, 
  setUsers,
  pagination,
  onPageChange,
  onRowsPerPageChange,
  totalUsers = 0,
  onEdit,
  loading = false,
  updateUserOptimized,
  deleteUserOptimized,
  toggleUserStatusOptimized,
  updateUserRolesOptimized,
  // Device management functions
  toggleSingleDeviceLogin,
  resetUserDevice,
  deviceActions = {},
}) => {
  const [loadingStates, setLoadingStates] = useState({});
  
  // Custom theme for glassmorphism styling
  const glassTheme = {
    palette: {
      primary: { main: '#3b82f6' },
      secondary: { main: '#64748b' },
      background: { paper: 'rgba(15, 20, 25, 0.15)' },
      text: { primary: '#ffffff', secondary: '#94a3b8' }
    },
    spacing: (factor) => `${0.25 * factor}rem`
  };

  // Device detection functions (copied from UserDeviceManagement)
  const getDeviceIcon = (userAgent, className = "w-5 h-5") => {
    const ua = userAgent?.toLowerCase() || '';
    
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return <DevicePhoneMobileIcon className={`${className} text-primary`} />;
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
      return <DeviceTabletIcon className={`${className} text-secondary`} />;
    } else {
      return <ComputerDesktopIcon className={`${className} text-default-500`} />;
    }
  };

  const getDeviceType = (userAgent) => {
    const ua = userAgent?.toLowerCase() || '';
    
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return 'Mobile Device';
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
      return 'Tablet';
    } else {
      return 'Desktop';
    }
  };

 




  const statusColorMap = {
    active: "success",
    inactive: "danger",
  };

  // Set loading state for specific operations
  const setLoading = (userId, operation, loading) => {
    setLoadingStates(prev => ({
      ...prev,
      [`${userId}-${operation}`]: loading
    }));
  };

  const isLoading = (userId, operation) => {
    return loadingStates[`${userId}-${operation}`] || false;
  };

  async function handleRoleChange(userId, newRoleNames) {
    setLoading(userId, 'role', true);
    const promise = new Promise(async (resolve, reject) => {
      try {
        const response = await axios.post(route('user.updateRole', { id: userId }), {
          roles: newRoleNames,
        });
        if (response.status === 200) {
          // Only update the affected user locally without refreshing the entire table
          if (updateUserRolesOptimized) {
            updateUserRolesOptimized(userId, newRoleNames);
          }
          resolve([response.data.message || 'Role updated successfully']);
        }
      } catch (error) {
        if (error.response?.status === 422) {
          reject(error.response.data.errors || ['Failed to update user role.']);
        } else {
          reject(['An unexpected error occurred. Please try again later.']);
        }
      } finally {
        setLoading(userId, 'role', false);
      }
    });
    toast.promise(promise, {
      pending: 'Updating employee role...',
      success: {
        render({ data }) {
          return data.join(', ');
        },
      },
      error: {
        render({ data }) {
          return Array.isArray(data) ? data.join(', ') : data;
        },
      },
    });
    
    // Return the promise to allow parent components to track completion
    return promise;
  }



  const handleDelete = async (userId) => {
    setLoading(userId, 'delete', true);
    const promise = new Promise(async (resolve, reject) => {
      try {
        const response = await fetch(route('profile.delete'), {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': document.head.querySelector('meta[name="csrf-token"]').content,
          },
          body: JSON.stringify({ user_id: userId }),
        });
        const data = await response.json();
        if (response.ok) {
          if (deleteUserOptimized) {
            deleteUserOptimized(userId);
          }
          resolve([data.message]);
        } else {
          reject([data.message]);
        }
      } catch (error) {
        reject(['An error occurred while deleting user. Please try again.']);
      } finally {
        setLoading(userId, 'delete', false);
      }
    });
    toast.promise(promise, {
      pending: 'Deleting user...',
      success: {
        render({ data }) {
          return data.join(', ');
        },
      },
      error: {
        render({ data }) {
          return Array.isArray(data) ? data.join(', ') : data;
        },
      },
    });
  };

  const columns = useMemo(() => {
    const baseColumns = [
      { name: "#", uid: "sl" },
      { name: "USER", uid: "user" },
      { name: "EMAIL", uid: "email" },
      { name: "DEPARTMENT", uid: "department" },
      { name: "DEVICE STATUS", uid: "device_status" },
      { name: "STATUS", uid: "status" },
      { name: "ROLES", uid: "roles" },
      { name: "ACTIONS", uid: "actions" }
    ];

    // Add or remove columns based on screen size
    if (!isMobile && !isTablet) {
      baseColumns.splice(3, 0, { name: "PHONE", uid: "phone" });
    } else if (isMobile) {
      // On mobile, remove phone and department to make room for device status
      baseColumns.splice(baseColumns.findIndex(col => col.uid === "department"), 1);
      baseColumns.splice(baseColumns.findIndex(col => col.uid === "device_status"), 1);
    } else if (isTablet) {
      // On tablet, keep device status but maybe adjust positioning
      const deviceIndex = baseColumns.findIndex(col => col.uid === "device_status");
      if (deviceIndex > -1) {
        // Move device status after user column
        const deviceCol = baseColumns.splice(deviceIndex, 1)[0];
        baseColumns.splice(2, 0, deviceCol);
      }
    }
    
    return baseColumns;
  }, [isMobile, isTablet]);

  // Function to toggle user status - optimized to avoid full reloads
  const toggleUserStatus = async (userId, currentStatus) => {
    if (isLoading(userId, 'status')) return; // Prevent multiple calls
    
    setLoading(userId, 'status', true);
    try {
      // In this implementation, we use the handler passed from the parent
      if (toggleUserStatusOptimized) {
        toggleUserStatusOptimized(userId, !currentStatus);
        toast.success(`User status ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      } else if (setUsers) {
        // Fallback to the older method if the optimized handler is not available
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === userId ? { ...user, active: !currentStatus } : user
          )
        );
        toast.success(`User status ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast.error('Failed to update user status');
    } finally {
      setLoading(userId, 'status', false);
    }
  };

  // Render cell content based on column type
  const renderCell = (user, columnKey, rowIndex) => {
 
    const cellValue = user[columnKey];
    
    switch (columnKey) {
      case "sl":
        // Calculate serial number based on pagination
        const startIndex = pagination?.currentPage && pagination?.perPage 
          ? Number((pagination.currentPage - 1) * pagination.perPage) 
          : 0;
        // Since rowIndex might be undefined, ensure it has a numeric value
        const safeIndex = typeof rowIndex === 'number' ? rowIndex : 0;
        const serialNumber = startIndex + safeIndex + 1;
        return <div className="flex items-center justify-center">
                <div className="flex items-center justify-center w-8 h-8 bg-content1/20 backdrop-blur-md rounded-lg border border-divider">
                  <span className="text-sm font-semibold text-foreground">
                    {serialNumber}
                  </span>
                </div>
              </div>;
        
      case "user":
        
        return (
    
          <User
      className="w-fit max-w-full" // 👈 Force User to only take as much width as needed
      avatarProps={{
        radius: "lg",
        size: "sm",
        src: user?.profile_image_url || user?.profile_image,
        showFallback: true,
        name: user?.name || "Unnamed User",
        isBordered: true,
      }}
      name={
        <span className="text-sm font-medium whitespace-nowrap">
          {user?.name || "Unnamed User"}
        </span>
      }
    />
        );
        
      case "email":
        return (
          <div className="flex items-center">
            <EnvelopeIcon className="w-4 h-4 text-default-400 mr-2" />
            <span className="text-sm">{user.email}</span>
          </div>
        );
        
      case "phone":
        return (
          <div className="flex items-center">
            <PhoneIcon className="w-4 h-4 text-default-400 mr-2" />
            <span className="text-sm">{user.phone || "N/A"}</span>
          </div>
        );
        
      case "department":
        
        return (
          <div className="flex items-center">
            <BuildingOfficeIcon className="w-4 h-4 text-default-400 mr-2" />
            <span className="text-sm">{user?.department || "N/A"}</span>
          </div>
        );

      case "device_status":
        const isToggling = isLoading(user.id, 'deviceToggle');
        return (
          <div className="flex items-center space-x-2">
            {user.single_device_login ? (
              <>
                <Chip
                  size="sm"
                  variant="flat"
                  color={user.active_device ? "warning" : "success"}
                  startContent={
                    isToggling ? (
                      <div className="animate-spin">
                        <ArrowPathIcon className="w-3 h-3" />
                      </div>
                    ) : user.active_device ? (
                      <LockClosedIcon className="w-3 h-3" />
                    ) : (
                      <LockOpenIcon className="w-3 h-3" />
                    )
                  }
                >
                  {isToggling ? 'Loading...' : user.active_device ? 'Locked' : 'Free'}
                </Chip>
                {user.active_device && !isToggling && (
                  <Tooltip 
                    content={
                      <div className="bg-content1/20 backdrop-blur-md border border-divider rounded-lg p-4 shadow-2xl max-w-sm">
                        <div className="flex items-center gap-3 mb-3">
                          {getDeviceIcon(user.active_device.user_agent, "w-5 h-5")}
                          <div>
                            <div className="font-semibold text-foreground text-sm">
                              {user.active_device.device_name || 'Unknown Device'}
                            </div>
                            <div className="text-xs text-default-500">
                              {getDeviceType(user.active_device.user_agent)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2 text-xs">
                          
                          
                          <div className="pt-2 mt-2 border-t border-white/20">
                            <div className="flex items-center gap-1">
                              <ClockIcon className="w-3 h-3 text-success" />
                              <span className="text-success text-xs font-medium">
                                {user.active_device.is_active ? 'Currently Active' : 'Inactive'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    }
                    placement="top"
                    classNames={{
                      content: "p-0 bg-transparent shadow-none border-none"
                    }}
                  >
                    <div className="flex items-center p-1 rounded-sm hover:bg-content1/10 transition-colors cursor-default">
                      {getDeviceIcon(user.active_device.user_agent, "w-4 h-4")}
                    </div>
                  </Tooltip>
                )}
              </>
            ) : (
              <Chip
                size="sm"
                variant="flat"
                color="default"
                startContent={
                  isToggling ? (
                    <div className="animate-spin">
                      <ArrowPathIcon className="w-3 h-3" />
                    </div>
                  ) : (
                    <ShieldCheckIcon className="w-3 h-3" />
                  )
                }
              >
                {isToggling ? 'Loading...' : 'Disabled'}
              </Chip>
            )}
          </div>
        );
        
      case "status":
 
        return (
          <div className="flex items-center justify-center">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={user.active}
                onChange={() => toggleUserStatus(user.id, user.active)}
                disabled={isLoading(user.id, 'status')}
              />
              <div className={`w-11 h-6 peer-focus:outline-hidden peer-focus:ring-4 peer-focus:ring-opacity-30 rounded-full peer transition-all duration-300 ${
                user.active 
                  ? 'bg-green-500 peer-focus:ring-green-300' 
                  : 'bg-red-500 peer-focus:ring-red-300'
              } peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all`}></div>
              {isLoading(user.id, 'status') && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </label>
            <span className="ml-2 text-xs">
              {user.active ? "Active" : "Inactive"}
            </span>
          </div>
        );
        
      case "roles":
        // Get simple role names for display
        const roleNames = user.roles?.map(role => 
          typeof role === 'object' && role !== null ? role.name : role
        ) || [];
        
        // Convert the role names to a Set for selection
        const roleSet = new Set(roleNames);
        
        // Create a simple string representation of roles
        const selectedValue = Array.from(roleSet).join(", ") || "No Roles";
        
        return (
          <div className="flex items-center">
            <Dropdown 
              isDisabled={isLoading(user.id, 'role')}
              className="max-w-[220px]"
            >
              <DropdownTrigger>
                <Button 
                  className="capitalize"
                  variant="bordered"
                  size="sm"
                  startContent={isLoading(user.id, 'role') ? <Spinner size="sm" /> : null}
                >
                  {selectedValue}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                disallowEmptySelection={false}
                aria-label="Multiple selection example"
                closeOnSelect={false}
                selectedKeys={roleSet}
                selectionMode="multiple"
                variant="flat"
                onSelectionChange={(keys) => {
                  const newRoles = Array.from(keys);
                  handleRoleChange(user.id, newRoles);
                }}
              >
                {(roles || []).map((role) => (
                  <DropdownItem 
                    key={typeof role === 'object' && role !== null ? role.name : role}
                  >
                    {typeof role === 'object' && role !== null ? role.name : role}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
          </div>
        );
        
      case "actions":
        return (
          <div className="flex justify-center items-center">
            <Dropdown>
              <DropdownTrigger>
                <Button 
                  isIconOnly
                  size="sm"
                  variant="light"
                  className="text-default-400 hover:text-foreground"
                >
                  <EllipsisVerticalIcon className="w-4 h-4" />
                </Button>
              </DropdownTrigger>
              <DropdownMenu aria-label="User Actions">
                <DropdownItem 
                  textValue="View Profile"
                  href={route('profile', { user: user.id })}
                  as={Link}
                  className="text-blue-500"
                  startContent={<UserIcon className="w-4 h-4" />}
                >
                  View Profile
                </DropdownItem>
                <DropdownItem 
                  textValue="Edit User"
                  onPress={() => {
                    if (onEdit) onEdit(user);
                  }}
                  className="text-amber-500"
                  startContent={<PencilIcon className="w-4 h-4" />}
                >
                  Edit
                </DropdownItem>
                
                {/* Device Management Section */}
                <DropdownItem
                  textValue="Device Toggle"
                  onPress={() => {
                    if (toggleSingleDeviceLogin && !isLoading(user.id, 'deviceToggle')) {
                      setLoading(user.id, 'deviceToggle', true);
                      toggleSingleDeviceLogin(user.id, !user.single_device_login)
                        .finally(() => {
                          setLoading(user.id, 'deviceToggle', false);
                        });
                    }
                  }}
                  isDisabled={deviceActions[user.id] || isLoading(user.id, 'deviceToggle')}
                  startContent={
                    isLoading(user.id, 'deviceToggle') ? (
                      <div className="animate-spin">
                        <ArrowPathIcon className="w-4 h-4" />
                      </div>
                    ) : user.single_device_login ? (
                      <LockOpenIcon className="w-4 h-4" />
                    ) : (
                      <LockClosedIcon className="w-4 h-4" />
                    )
                  }
                  className={user.single_device_login ? "text-orange-500" : "text-green-500"}
                >
                  {isLoading(user.id, 'deviceToggle') 
                    ? 'Processing...' 
                    : user.single_device_login 
                      ? 'Disable Device Lock' 
                      : 'Enable Device Lock'
                  }
                </DropdownItem>
                
                {user.single_device_login && user.active_device && (
                  <DropdownItem
                    textValue="Reset Device"
                    onPress={() => {
                      if (resetUserDevice && !isLoading(user.id, 'deviceReset')) {
                        setLoading(user.id, 'deviceReset', true);
                        resetUserDevice(user.id)
                          .finally(() => {
                            setLoading(user.id, 'deviceReset', false);
                          });
                      }
                    }}
                    isDisabled={deviceActions[user.id] || isLoading(user.id, 'deviceReset')}
                    startContent={
                      isLoading(user.id, 'deviceReset') ? (
                        <div className="animate-spin">
                          <ArrowPathIcon className="w-4 h-4" />
                        </div>
                      ) : (
                        <ArrowPathIcon className="w-4 h-4" />
                      )
                    }
                    className="text-red-500"
                  >
                    {isLoading(user.id, 'deviceReset') ? 'Resetting...' : 'Reset Device'}
                  </DropdownItem>
                )}
                
                <DropdownItem
                  textValue="View Devices"
                  href={route('users.device.show', { user: user.id })}
                  as={Link}
                  startContent={<DevicePhoneMobileIcon className="w-4 h-4" />}
                  className="text-blue-500"
                >
                  View Device History
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        );
        
      default:
        return cellValue;
    }
  };

  const renderPagination = () => {
    if (!allUsers || !totalUsers || loading) return null;
    
    return (
      <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-2 border-t border-divider bg-content1/50 backdrop-blur-md">
        <span className="text-xs text-default-400 mb-3 sm:mb-0">
          Showing {((pagination.currentPage - 1) * pagination.perPage) + 1} to {
            Math.min(pagination.currentPage * pagination.perPage, totalUsers)
          } of {totalUsers} users
        </span>
        
        <Pagination
          total={Math.ceil(totalUsers / pagination.perPage)}
          initialPage={pagination.currentPage}
          page={pagination.currentPage}
          onChange={onPageChange}
          size={isMobile ? "sm" : "md"}
          variant="bordered"
          showControls
          classNames={{
            item: "bg-content1/20 backdrop-blur-md border-divider hover:bg-content1/30",
            cursor: "bg-content1/40 backdrop-blur-md border-divider",
          }}
        />
      </div>
    );
  };

  return (
    <div className="w-full overflow-hidden flex flex-col border border-divider rounded-lg bg-content1/10 backdrop-blur-md" style={{ maxHeight: 'calc(100vh - 200px)' }}>
      <div className="overflow-auto grow relative table-scroll-container frozen-column-container">
        <Table
          aria-label="Users table"
          removeWrapper
          selectionMode="none"
          isCompact={isMobile}
          classNames={{
            base: "bg-transparent min-w-[800px]",
            wrapper: "p-0 bg-transparent shadow-none",
            th: "backdrop-blur-md text-default-500 border-b border-divider font-medium text-xs sticky top-0 z-30 shadow-xs bg-content1/20",
            td: "border-b border-divider/50 py-3 group-aria-[selected=false]:group-data-[hover=true]:before:bg-default-100",
            table: "border-collapse",
            thead: "sticky top-0 z-30",
            tbody: "divide-y divide-divider/50",
            tr: "group outline-none tap-highlight-transparent data-[focus-visible=true]:z-10 data-[focus-visible=true]:outline-2 data-[focus-visible=true]:outline-focus data-[focus-visible=true]:outline-offset-2 data-[selected=true]:bg-default-100",
            emptyWrapper: "text-center h-32",
            loadingWrapper: "h-32",
          }}
        >
          <TableHeader columns={columns}>
            {(column) => (
              <TableColumn 
                key={column.uid} 
                align={column.uid === "actions" ? "center" : column.uid === "sl" ? "center" : "start"}
                width={column.uid === "sl" ? 60 : column.uid === "user" ? 240 : undefined}
                className={
                  column.uid === "sl" 
                    ? "sticky-header-sl backdrop-blur-md" 
                    : column.uid === "user" 
                    ? "sticky-header-user backdrop-blur-md" 
                    : "backdrop-blur-md sticky top-0 z-30"
                }
              >
                {column.name}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody 
            items={allUsers || []} 
            emptyContent="No users found"
            loadingContent={<Spinner />}
            isLoading={loading}
          >
            {(item, index) => {
              // Find the index of this item in the allUsers array to ensure accurate serial numbers
              const itemIndex = allUsers ? allUsers.findIndex(user => user.id === item.id) : index;
              return (
                <TableRow key={item.id} className="table-row-hover">
                  {(columnKey) => (
                    <TableCell 
                      className={
                        columnKey === "sl" 
                          ? "frozen-column sticky left-0 z-20 backdrop-blur-md border-r border-divider/30" 
                          : columnKey === "user" 
                          ? "frozen-column-user sticky z-20 backdrop-blur-md border-r border-divider/30" 
                          : ""
                      }
                      style={
                        columnKey === "user" 
                          ? { left: '60px' } 
                          : {}
                      }
                    >
                      {renderCell(item, columnKey, itemIndex)}
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
    </div>
  );
};

export default UsersTable;
