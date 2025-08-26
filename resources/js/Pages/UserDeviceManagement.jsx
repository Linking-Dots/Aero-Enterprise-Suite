import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Head, router, Link } from "@inertiajs/react";
import { motion } from 'framer-motion';
import { 
  Button,
  Card,
  CardBody,
  Chip,
  Divider,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Tooltip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  ButtonGroup,
  User as UserAvatar,
  Pagination,
  Spinner,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure
} from "@heroui/react";
import { 
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  DeviceTabletIcon,
  TvIcon,
  ClockIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
  MapPinIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowLeftIcon,
  LockClosedIcon,
  LockOpenIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EllipsisVerticalIcon,
  TrashIcon,
  ArrowTopRightOnSquareIcon,
  DocumentArrowDownIcon,
  UsersIcon,
  GlobeAltIcon,
  SignalIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  XMarkIcon,
  EyeIcon,
  InformationCircleIcon,
  WifiIcon,
  IdentificationIcon
} from "@heroicons/react/24/outline";
import App from "@/Layouts/App.jsx";
import GlassCard from "@/Components/GlassCard.jsx";
import GlassDialog from "@/Components/GlassDialog.jsx";
import PageHeader from "@/Components/PageHeader.jsx";
import StatsCards from "@/Components/StatsCards.jsx";
import EnhancedModal from "@/Components/EnhancedModal.jsx";
import axios from 'axios';
import { toast } from 'react-toastify';

const UserDeviceManagement = ({ title, user: initialUser, devices: initialDevices }) => {
  // Custom responsive hooks
  const useResponsive = () => {
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);
    
    useEffect(() => {
      const checkDevice = () => {
        setIsMobile(window.innerWidth < 640);
        setIsTablet(window.innerWidth < 768);
      };
      
      checkDevice();
      window.addEventListener('resize', checkDevice);
      return () => window.removeEventListener('resize', checkDevice);
    }, []);
    
    return { isMobile, isTablet };
  };
  
  const { isMobile, isTablet } = useResponsive();
  
  // Custom theme
  const glassTheme = {
    palette: {
      primary: { main: '#3b82f6' },
      secondary: { main: '#64748b' },
      background: { paper: 'rgba(15, 20, 25, 0.15)' },
      text: { primary: '#ffffff', secondary: '#94a3b8' }
    },
    spacing: (factor) => `${0.25 * factor}rem`,
    borderRadius: '12px'
  };
  
  // State management
  const [user, setUser] = useState(initialUser);
  const [devices, setDevices] = useState(initialDevices || []);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);


  
  // Filter and search states
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    type: 'all',
    dateRange: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination
  const [pagination, setPagination] = useState({
    currentPage: 1,
    perPage: 10
  });

  // Enhanced stats calculation
  const deviceStats = useMemo(() => {
    const now = new Date();
    const onlineThreshold = new Date(now.getTime() - 5 * 60 * 1000); // 5 minutes
    const recentThreshold = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours
    
    const activeDevices = devices.filter(d => d.is_active);
    const onlineDevices = devices.filter(d => 
      d.is_active && d.last_seen_at && new Date(d.last_seen_at) > onlineThreshold
    );
    const recentDevices = devices.filter(d => 
      d.last_seen_at && new Date(d.last_seen_at) > recentThreshold
    );
    const mobileDevices = devices.filter(d => 
      d.user_agent && d.user_agent.toLowerCase().includes('mobile')
    );
    
    return {
      total: devices.length,
      active: activeDevices.length,
      online: onlineDevices.length,
      recent: recentDevices.length,
      mobile: mobileDevices.length,
      desktop: devices.length - mobileDevices.length,
      inactive: devices.length - activeDevices.length
    };
  }, [devices]);

  // Stats cards configuration
  const statsCards = useMemo(() => [
    {
      title: 'Total Devices',
      value: deviceStats.total,
      icon: <DevicePhoneMobileIcon className="w-5 h-5" />,
      color: 'text-blue-400',
      iconBg: 'bg-blue-500/20',
      description: 'All registered devices'
    },
    {
      title: 'Active Sessions',
      value: deviceStats.active,
      icon: <CheckCircleIcon className="w-5 h-5" />,
      color: 'text-green-400',
      iconBg: 'bg-green-500/20',
      description: 'Currently active devices'
    },
    {
      title: 'Online Now',
      value: deviceStats.online,
      icon: <SignalIcon className="w-5 h-5" />,
      color: 'text-purple-400',
      iconBg: 'bg-purple-500/20',
      description: 'Active within 5 minutes'
    },
    {
      title: 'Recent Activity',
      value: deviceStats.recent,
      icon: <ClockIcon className="w-5 h-5" />,
      color: 'text-orange-400',
      iconBg: 'bg-orange-500/20',
      description: 'Active within 24 hours'
    }
  ], [deviceStats]);

    // Fetch devices list
  const fetchDevices = useCallback(async () => {
    setLoading(true);
    
    try {
      const response = await axios.get(route('users.device.list', { user: user.id }));
      
      if (response.status === 200) {
        setDevices(response.data.devices || []);
        
        // Update user data if returned
        if (response.data.user) {
          setUser(prev => ({ ...prev, ...response.data.user }));
        }
      }
    } catch (error) {
      console.error('Error fetching devices:', error);
      toast.error('Failed to fetch device information');
      setDevices([]);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  // Refresh data
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDevices();
    setRefreshing(false);
    toast.success('Device data refreshed');
  }, [fetchDevices]);

   // Export devices data
  const handleExportDevices = useCallback(() => {
    const csvData = devices.map(device => ({
      'Device Name': device.device_name || 'Unknown',
      'User Agent': device.user_agent,
      'IP Address': device.ip_address,
      'Location': device.location || 'Unknown',
      'Status': device.is_active ? 'Active' : 'Inactive',
      'Last Seen': device.last_seen_at ? new Date(device.last_seen_at).toLocaleString() : 'Never',
      'Created': device.created_at ? new Date(device.created_at).toLocaleString() : 'Unknown'
    }));

    const csv = [
      Object.keys(csvData[0] || {}).join(','),
      ...csvData.map(row => Object.values(row).map(value => `"${value}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${user.name}_devices_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success('Device data exported successfully');
  }, [devices, user.name]);

  // Action buttons for page header
  const actionButtons = useMemo(() => {
    const buttons = [];
    
    buttons.push({
      label: isMobile ? "Back" : "Back to Users",
      icon: <ArrowLeftIcon className="w-4 h-4" />,
      onClick: () => router.visit(route('users')),
      variant: "light"
    });

    buttons.push({
      label: isMobile ? "Refresh" : "Refresh Data",
      icon: <ArrowPathIcon className="w-4 h-4" />,
      onClick: handleRefresh,
      variant: "flat",
      color: "primary",
      isLoading: refreshing
    });

    if (deviceStats.total > 0) {
      buttons.push({
        label: isMobile ? "Export" : "Export Devices",
        icon: <DocumentArrowDownIcon className="w-4 h-4" />,
        onClick: handleExportDevices,
        variant: "flat"
      });
    }

    return buttons;
  }, [isMobile, deviceStats.total, refreshing]);

  // Toggle single device login for user
  const toggleSingleDeviceLogin = async (enabled) => {
  
    setActionLoading(prev => ({ ...prev, toggle: true }));
    
    try {
      const response = await axios.post(route('users.device.toggle'), {
        user_id: user.id,
        enabled: enabled
      });


      if (response.status === 200 && response.data.success) {
        // Update user state with the response data from backend
        const newUserState = {
          ...user,
          single_device_login: response.data.user.single_device_login,
          active_device: response.data.user.active_device
        };
        
   
        setUser(newUserState);
        
        toast.success(response.data.message || 
          (enabled 
            ? 'Single device login enabled' 
            : 'Single device login disabled')
        );
        
        // Refresh devices list to get updated status without overriding user state
        setLoading(true);
        try {
          const devicesResponse = await axios.get(route('users.device.list', { user: user.id }));
          if (devicesResponse.status === 200) {
            setDevices(devicesResponse.data.devices || []);
            // Don't override user state from devices response to preserve toggle state
          }
        } catch (error) {
          console.error('Error refreshing devices:', error);
        } finally {
          setLoading(false);
        }
      }
    } catch (error) {
      console.error('Error toggling single device login:', error);
      toast.error('Failed to update device settings');
    } finally {
      setActionLoading(prev => ({ ...prev, toggle: false }));
    }
  };

  // Reset user device
  const resetUserDevice = async () => {
    setActionLoading(prev => ({ ...prev, reset: true }));
    
    try {
      const response = await axios.post(route('users.device.reset'), {
        user_id: user.id
      });

      if (response.status === 200) {
        // Immediately update user state to reflect device reset
        setUser(prev => ({
          ...prev,
          active_device: null
        }));
        
        // Also update devices list to reflect the change
        setDevices(prevDevices => 
          prevDevices.map(device => ({
            ...device,
            is_active: false
          }))
        );
        
        toast.success('User device has been reset');
        
        // Refresh only devices list without overriding user state
        setTimeout(async () => {
          try {
            setLoading(true);
            const devicesResponse = await axios.get(route('users.device.list', { user: user.id }));
            if (devicesResponse.status === 200) {
              setDevices(devicesResponse.data.devices || []);
              // Don't update user state here to preserve the reset state
            }
          } catch (error) {
            console.error('Error refreshing devices after reset:', error);
          } finally {
            setLoading(false);
          }
        }, 1000);
      }
    } catch (error) {
      console.error('Error resetting user device:', error);
      toast.error('Failed to reset user device');
    } finally {
      setActionLoading(prev => ({ ...prev, reset: false }));
    }
  };



  

  // Force logout specific device
  const forceLogoutDevice = useCallback(async (deviceId) => {
    setActionLoading(prev => ({ ...prev, [`logout_${deviceId}`]: true }));
    
    try {
      const response = await axios.post(route('users.device.logout'), {
        user_id: user.id,
        device_id: deviceId
      });

      if (response.status === 200) {
        toast.success('Device logged out successfully');
        await fetchDevices();
      }
    } catch (error) {
      console.error('Error logging out device:', error);
      toast.error('Failed to logout device');
    } finally {
      setActionLoading(prev => ({ ...prev, [`logout_${deviceId}`]: false }));
    }
  }, [user.id, fetchDevices]);

 

  // Filter devices based on current filters
  const filteredDevices = useMemo(() => {
    let filtered = [...devices];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(device => 
        (device.device_name || '').toLowerCase().includes(searchLower) ||
        (device.user_agent || '').toLowerCase().includes(searchLower) ||
        (device.ip_address || '').toLowerCase().includes(searchLower) ||
        (device.location || '').toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(device => {
        if (filters.status === 'active') return device.is_active;
        if (filters.status === 'inactive') return !device.is_active;
        return true;
      });
    }

    // Type filter
    if (filters.type !== 'all') {
      filtered = filtered.filter(device => {
        const agent = (device.user_agent || '').toLowerCase();
        if (filters.type === 'mobile') return agent.includes('mobile') || agent.includes('android') || agent.includes('iphone');
        if (filters.type === 'desktop') return !(agent.includes('mobile') || agent.includes('android') || agent.includes('iphone'));
        return true;
      });
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      filtered = filtered.filter(device => {
        if (!device.last_seen_at) return false;
        const lastSeen = new Date(device.last_seen_at);
        const diffHours = (now - lastSeen) / (1000 * 60 * 60);
        
        switch (filters.dateRange) {
          case 'hour': return diffHours <= 1;
          case 'day': return diffHours <= 24;
          case 'week': return diffHours <= 168;
          case 'month': return diffHours <= 720;
          default: return true;
        }
      });
    }

    return filtered;
  }, [devices, filters]);

  // Paginated devices
  const paginatedDevices = useMemo(() => {
    const startIndex = (pagination.currentPage - 1) * pagination.perPage;
    const endIndex = startIndex + pagination.perPage;
    return filteredDevices.slice(startIndex, endIndex);
  }, [filteredDevices, pagination]);

  const totalPages = Math.ceil(filteredDevices.length / pagination.perPage);

  // Filter handlers
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 })); // Reset to first page
  };

  // Enhanced device info functions
  const getDeviceIcon = (userAgent, size = "w-5 h-5") => {
    const agent = (userAgent || '').toLowerCase();
    
    // Mobile devices
    if (agent.includes('iphone') || agent.includes('ipod')) {
      return <DevicePhoneMobileIcon className={`${size} text-default-600`} />;
    }
    if (agent.includes('android') && agent.includes('mobile')) {
      return <DevicePhoneMobileIcon className={`${size} text-default-600`} />;
    }
    
    // Tablets
    if (agent.includes('ipad') || (agent.includes('android') && agent.includes('tablet'))) {
      return <DeviceTabletIcon className={`${size} text-default-600`} />;
    }
    
    // Smart TVs
    if (agent.includes('smart-tv') || agent.includes('smarttv') || agent.includes('tizen') || agent.includes('webos')) {
      return <TvIcon className={`${size} text-default-600`} />;
    }
    
    // Desktop/Laptop - default
    return <ComputerDesktopIcon className={`${size} text-default-600`} />;
  };

  const getDeviceType = (userAgent) => {
    const agent = (userAgent || '').toLowerCase();
    
    if (agent.includes('iphone') || agent.includes('ipod')) return 'iPhone';
    if (agent.includes('android') && agent.includes('mobile')) return 'Android Phone';
    if (agent.includes('ipad')) return 'iPad';
    if (agent.includes('android') && agent.includes('tablet')) return 'Android Tablet';
    if (agent.includes('smart-tv') || agent.includes('smarttv')) return 'Smart TV';
    if (agent.includes('windows')) return 'Windows PC';
    if (agent.includes('mac')) return 'Mac';
    if (agent.includes('linux')) return 'Linux';
    
    return 'Desktop';
  };

  const getBrowserInfo = (userAgent) => {
    const agent = (userAgent || '').toLowerCase();
    
    if (agent.includes('chrome') && !agent.includes('edg')) return 'Chrome';
    if (agent.includes('firefox')) return 'Firefox';
    if (agent.includes('safari') && !agent.includes('chrome')) return 'Safari';
    if (agent.includes('edg')) return 'Edge';
    if (agent.includes('opera')) return 'Opera';
    
    return 'Unknown Browser';
  };

  const getOSInfo = (userAgent) => {
    const agent = (userAgent || '').toLowerCase();
    
    if (agent.includes('windows nt 10')) return 'Windows 10/11';
    if (agent.includes('windows nt 6.3')) return 'Windows 8.1';
    if (agent.includes('windows nt 6.1')) return 'Windows 7';
    if (agent.includes('windows')) return 'Windows';
    if (agent.includes('mac os x')) {
      const match = agent.match(/mac os x ([0-9_]+)/);
      if (match) return `macOS ${match[1].replace(/_/g, '.')}`;
      return 'macOS';
    }
    if (agent.includes('android')) {
      const match = agent.match(/android ([0-9.]+)/);
      if (match) return `Android ${match[1]}`;
      return 'Android';
    }
    if (agent.includes('iphone os')) {
      const match = agent.match(/iphone os ([0-9_]+)/);
      if (match) return `iOS ${match[1].replace(/_/g, '.')}`;
      return 'iOS';
    }
    if (agent.includes('linux')) return 'Linux';
    
    return 'Unknown OS';
  };

  // Device details modal handler
  const handleViewDeviceDetails = (device) => {
    setSelectedDevice(device);
    setIsDeviceModalOpen(true);
  };

  const handleCloseDeviceModal = () => {
    setIsDeviceModalOpen(false);
    setSelectedDevice(null);
  };

  const formatLastSeen = (timestamp) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const getDeviceStatusColor = (device) => {
    if (!device.is_active) return 'default';
    
    if (device.last_seen_at) {
      const now = new Date();
      const lastSeen = new Date(device.last_seen_at);
      const diffMinutes = (now - lastSeen) / (1000 * 60);
      
      if (diffMinutes <= 5) return 'success'; // Online
      if (diffMinutes <= 60) return 'warning'; // Recently active
    }
    
    return 'primary'; // Active but not recent
  };

  const getDeviceStatusText = (device) => {
    if (!device.is_active) return 'Inactive';
    
    if (device.last_seen_at) {
      const now = new Date();
      const lastSeen = new Date(device.last_seen_at);
      const diffMinutes = (now - lastSeen) / (1000 * 60);
      
      if (diffMinutes <= 5) return 'Online';
      if (diffMinutes <= 60) return 'Recent';
    }
    
    return 'Active';
  };

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  return (
    <>
      <Head title={title} />
      
      <motion.div 
        className="flex justify-center p-4"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <GlassCard>
          <PageHeader
            title={`Device Management - ${user.name}`}
            subtitle={`Manage ${user.name}'s device access, restrictions and session history`}
            icon={<DevicePhoneMobileIcon className="w-8 h-8" />}
            actionButtons={actionButtons}
            >
              <div className="p-4 sm:p-6">
                {/* Statistics Cards */}
                <StatsCards stats={statsCards} className="mb-6" />
                
                {/* User Overview Section - Enhanced */}
                <div className="mb-6">
                  <GlassCard>
                    <div className="flex flex-col lg:flex-row">
                      {/* Enhanced User Profile Section */}
                      <div className="lg:w-2/5 bg-linear-to-br from-white/5 to-white/10 p-6 border-r border-white/10">
                        <div className="text-center mb-6">
                          {/* Profile Image */}
                          <div className="relative inline-block mb-4">
                            <div className="w-24 h-24 rounded-full bg-linear-to-br from-primary/60 via-secondary/60 to-accent/60 p-1 shadow-2xl">
                              <div className="w-full h-full rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center overflow-hidden border border-white/20">
                                {user.profile_image_url ? (
                                  <img 
                                    src={user.profile_image_url} 
                                    alt={user.name}
                                    className="w-full h-full object-cover rounded-full"
                                  />
                                ) : (
                                  <span className="text-2xl font-bold text-white">
                                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                                  </span>
                                )}
                              </div>
                            </div>
                            {/* Online Status Indicator */}
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-success/80 backdrop-blur-xs border-2 border-white/30 rounded-full flex items-center justify-center shadow-lg">
                              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                            </div>
                          </div>
                          
                          {/* User Name & Title */}
                          <h2 className="text-xl font-bold text-foreground mb-1">{user.name}</h2>
                          <p className="text-sm text-default-500 mb-3">{user.email}</p>
                        </div>

                        {/* Profile Details Grid */}
                        <div className="space-y-4">
                          {/* Department */}
                          <div className="bg-white/5 backdrop-blur-xs rounded-lg p-3 border border-white/10 hover:bg-white/10 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary/20 backdrop-blur-xs rounded-lg flex items-center justify-center border border-primary/30">
                                <BuildingOfficeIcon className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <p className="text-xs text-default-400 uppercase tracking-wide">Department</p>
                                <p className="text-sm font-medium text-foreground">
                                  {user.department?.name || 'No Department'}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Member Since */}
                          <div className="bg-white/5 backdrop-blur-xs rounded-lg p-3 border border-white/10 hover:bg-white/10 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-secondary/20 backdrop-blur-xs rounded-lg flex items-center justify-center border border-secondary/30">
                                <CalendarIcon className="w-5 h-5 text-secondary" />
                              </div>
                              <div>
                                <p className="text-xs text-default-400 uppercase tracking-wide">Member Since</p>
                                <p className="text-sm font-medium text-foreground">
                                  {user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  }) : 'Unknown'}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* User ID */}
                          <div className="bg-white/5 backdrop-blur-xs rounded-lg p-3 border border-white/10 hover:bg-white/10 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-success/20 backdrop-blur-xs rounded-lg flex items-center justify-center border border-success/30">
                                <UsersIcon className="w-5 h-5 text-success" />
                              </div>
                              <div>
                                <p className="text-xs text-default-400 uppercase tracking-wide">User ID</p>
                                <p className="text-sm font-medium text-foreground">#{user.id}</p>
                              </div>
                            </div>
                          </div>

                          {/* Quick Actions */}
                          <div className="pt-4 border-t border-white/10">
                            <p className="text-xs text-default-400 uppercase tracking-wide mb-3">Quick Actions</p>
                            <div className="flex gap-2">
                              <Button
                                as={Link}
                                href={route('profile', { user: user.id })}
                                size="sm"
                                variant="flat"
                                className="bg-primary/20 text-primary border-primary/30 hover:bg-primary/30 backdrop-blur-xs"
                                startContent={<ArrowTopRightOnSquareIcon className="w-4 h-4" />}
                              >
                                View Profile
                              </Button>
                              <Button
                                size="sm"
                                variant="flat"
                                className="bg-secondary/20 text-secondary border-secondary/30 hover:bg-secondary/30 backdrop-blur-xs"
                                startContent={<DocumentArrowDownIcon className="w-4 h-4" />}
                              >
                                Export Data
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Enhanced Device Management Section */}
                      <div className="lg:w-3/5 p-6">
                        <div className="mb-6">
                          <h3 className="text-lg font-semibold text-foreground mb-2">Device Security Settings</h3>
                          <p className="text-sm text-default-400">Manage device access restrictions and session controls</p>
                        </div>

                        {/* Single Device Login Control */}
                        <div className="bg-white/5 backdrop-blur-xs rounded-xl p-5 border border-white/10 hover:bg-white/10 transition-colors mb-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-primary/20 backdrop-blur-xs rounded-xl flex items-center justify-center border border-primary/30">
                                <ShieldCheckIcon className="w-6 h-6 text-primary" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-foreground">Single Device Login</h4>
                                <p className="text-xs text-default-400">Restrict user to one active device</p>
                              </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={user.single_device_login}
                                onChange={(e) => {
                                  toggleSingleDeviceLogin(e.target.checked);
                                }}
                                disabled={actionLoading.toggle}
                              />
                              <div className={`w-11 h-6 peer-focus:outline-hidden peer-focus:ring-4 peer-focus:ring-opacity-30 rounded-full peer transition-all duration-300 ${
                                user.single_device_login 
                                  ? 'bg-green-500 peer-focus:ring-green-300' 
                                  : 'bg-red-500 peer-focus:ring-red-300'
                              } peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all`}></div>
                              {actionLoading.toggle && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                </div>
                              )}
                            </label>
                          </div>
                          
                          {/* Device Status Display */}
                          <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                              <span className="text-sm font-medium text-default-600">Current Status:</span>
                              <Chip
                                size="sm"
                                variant="flat"
                                className={`font-semibold backdrop-blur-xs ${
                                  !user.single_device_login ? "bg-default/20 text-default-600 border-default/30" :
                                  user.active_device ? "bg-warning/20 text-warning border-warning/30" :
                                  "bg-success/20 text-success border-success/30"
                                }`}
                                startContent={
                                  !user.single_device_login ? 
                                    <XMarkIcon className="w-3 h-3" /> :
                                  user.active_device ? 
                                    <LockClosedIcon className="w-3 h-3" /> : 
                                    <LockOpenIcon className="w-3 h-3" />
                                }
                              >
                                {!user.single_device_login ? 'Disabled' : 
                                 user.active_device ? 'Device Locked' : 'Device Free'}
                              </Chip>
                            </div>
                            
                            {/* Active Device Info */}
                            {user.single_device_login && user.active_device && (
                              <div className="bg-warning/10 backdrop-blur-xs border border-warning/20 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                  <div className="w-10 h-10 bg-warning/20 backdrop-blur-xs rounded-lg flex items-center justify-center shrink-0 border border-warning/30">
                                    {user.active_device.device_name?.toLowerCase().includes('mobile') ? (
                                      <DevicePhoneMobileIcon className="w-5 h-5 text-warning" />
                                    ) : (
                                      <ComputerDesktopIcon className="w-5 h-5 text-warning" />
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <h5 className="font-semibold text-warning mb-1">Active Device</h5>
                                    <p className="text-sm text-warning/80 mb-2">
                                      {user.active_device.device_name || 'Unknown Device'}
                                    </p>
                                    {user.active_device.last_seen_at && (
                                      <div className="flex items-center gap-1 text-xs text-warning/70">
                                        <ClockIcon className="w-3 h-3" />
                                        Last seen: {formatLastSeen(user.active_device.last_seen_at)}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="mt-4 pt-3 border-t border-warning/20">
                                  <Button
                                    size="sm"
                                    variant="flat"
                                    className="bg-danger/20 text-danger border-danger/30 hover:bg-danger/30 backdrop-blur-xs"
                                    startContent={actionLoading.reset ? 
                                      <ArrowPathIcon className="w-4 h-4 animate-spin" /> : 
                                      <ArrowPathIcon className="w-4 h-4" />
                                    }
                                    isDisabled={actionLoading.reset}
                                    onClick={() => resetUserDevice()}
                                  >
                                    {actionLoading.reset ? 'Resetting...' : 'Reset Device Lock'}
                                  </Button>
                                </div>
                              </div>
                            )}

                            {/* Information Panel */}
                            {user.single_device_login && !user.active_device && (
                              <div className="bg-success/10 backdrop-blur-xs border border-success/20 rounded-lg p-4">
                                <div className="flex items-center gap-3">
                                  <CheckCircleIcon className="w-8 h-8 text-success shrink-0" />
                                  <div>
                                    <h5 className="font-semibold text-success mb-1">Ready for Device Lock</h5>
                                    <p className="text-sm text-success/80">
                                      Single device login is enabled. The user's next login will lock their session to that device.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {!user.single_device_login && (
                              <div className="bg-primary/10 backdrop-blur-xs border border-primary/20 rounded-lg p-4">
                                <div className="flex items-center gap-3">
                                  <GlobeAltIcon className="w-8 h-8 text-primary shrink-0" />
                                  <div>
                                    <h5 className="font-semibold text-primary mb-1">Multiple Device Access</h5>
                                    <p className="text-sm text-primary/80">
                                      User can log in from multiple devices simultaneously. Enable single device login for enhanced security.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                </div>

                {/* Filter Controls */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <TextField
                      label="Search Devices"
                      placeholder="Search by device name, IP, location..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <MagnifyingGlassIcon className="w-4 h-4" />
                          </InputAdornment>
                        ),
                      }}
                      fullWidth
                      size={isMobile ? "small" : "medium"}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          backdropFilter: 'blur(10px)',
                          borderRadius: '12px',
                          color: 'white',
                          '& fieldset': {
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                          },
                          '&:hover fieldset': {
                            borderColor: 'rgba(255, 255, 255, 0.3)',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: 'var(--primary-color)',
                          },
                          '& input::placeholder': {
                            color: 'rgba(255, 255, 255, 0.5)',
                            opacity: 1,
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: 'rgba(255, 255, 255, 0.7)',
                          '&.Mui-focused': {
                            color: 'var(--primary-color)',
                          },
                        },
                      }}
                    />
                  </div>

                  <div className="flex gap-2 items-end">
                    {/* Filter Toggle */}
                    <Button
                      isIconOnly={isMobile}
                      variant="bordered"
                      onPress={() => setShowFilters(!showFilters)}
                      className="bg-white/5 border-white/20"
                    >
                      <FunnelIcon className="w-4 h-4" />
                      {!isMobile && <span className="ml-2">Filters</span>}
                    </Button>

                    {/* Quick Stats Display */}
                    <div className="hidden md:flex items-center gap-4 px-4 py-2 bg-white/5 rounded-lg border border-white/20">
                      <div className="text-xs">
                        <span className="text-default-500">Showing: </span>
                        <span className="font-medium text-foreground">{filteredDevices.length}</span>
                        <span className="text-default-500"> / {devices.length}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Advanced Filters Panel */}
                {showFilters && (
                  <Fade in={showFilters}>
                    <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">Status</label>
                          <Dropdown>
                            <DropdownTrigger>
                              <Button variant="bordered" className="w-full justify-between bg-white/5">
                                {filters.status === 'all' ? 'All Status' : 
                                 filters.status === 'active' ? 'Active Only' : 'Inactive Only'}
                              </Button>
                            </DropdownTrigger>
                            <DropdownMenu 
                              selectedKeys={[filters.status]}
                              onSelectionChange={(keys) => handleFilterChange('status', Array.from(keys)[0])}
                            >
                              <DropdownItem key="all">All Status</DropdownItem>
                              <DropdownItem key="active">Active Only</DropdownItem>
                              <DropdownItem key="inactive">Inactive Only</DropdownItem>
                            </DropdownMenu>
                          </Dropdown>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">Device Type</label>
                          <Dropdown>
                            <DropdownTrigger>
                              <Button variant="bordered" className="w-full justify-between bg-white/5">
                                {filters.type === 'all' ? 'All Types' : 
                                 filters.type === 'mobile' ? 'Mobile Only' : 'Desktop Only'}
                              </Button>
                            </DropdownTrigger>
                            <DropdownMenu 
                              selectedKeys={[filters.type]}
                              onSelectionChange={(keys) => handleFilterChange('type', Array.from(keys)[0])}
                            >
                              <DropdownItem key="all">All Types</DropdownItem>
                              <DropdownItem key="mobile">Mobile Only</DropdownItem>
                              <DropdownItem key="desktop">Desktop Only</DropdownItem>
                            </DropdownMenu>
                          </Dropdown>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">Activity</label>
                          <Dropdown>
                            <DropdownTrigger>
                              <Button variant="bordered" className="w-full justify-between bg-white/5">
                                {filters.dateRange === 'all' ? 'All Time' : 
                                 filters.dateRange === 'hour' ? 'Last Hour' :
                                 filters.dateRange === 'day' ? 'Last 24 Hours' :
                                 filters.dateRange === 'week' ? 'Last Week' : 'Last Month'}
                              </Button>
                            </DropdownTrigger>
                            <DropdownMenu 
                              selectedKeys={[filters.dateRange]}
                              onSelectionChange={(keys) => handleFilterChange('dateRange', Array.from(keys)[0])}
                            >
                              <DropdownItem key="all">All Time</DropdownItem>
                              <DropdownItem key="hour">Last Hour</DropdownItem>
                              <DropdownItem key="day">Last 24 Hours</DropdownItem>
                              <DropdownItem key="week">Last Week</DropdownItem>
                              <DropdownItem key="month">Last Month</DropdownItem>
                            </DropdownMenu>
                          </Dropdown>
                        </div>

                        <div className="flex items-end">
                          <Button
                            variant="flat"
                            color="primary"
                            className="w-full"
                            onPress={() => {
                              setFilters({
                                search: '',
                                status: 'all',
                                type: 'all',
                                dateRange: 'all'
                              });
                              setPagination(prev => ({ ...prev, currentPage: 1 }));
                            }}
                          >
                            Clear Filters
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Fade>
                )}

                {/* Devices Table */}
                <div className="bg-white/5 backdrop-blur-md rounded-lg border border-white/10 overflow-hidden">
                  <div className="p-4 border-b border-white/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <Typography variant="h6" className="font-semibold text-foreground">
                          Device History
                        </Typography>
                        <Typography variant="caption" className="text-default-500">
                          {filteredDevices.length} device{filteredDevices.length !== 1 ? 's' : ''} found
                          {filteredDevices.length !== devices.length && (
                            <span> (filtered from {devices.length} total)</span>
                          )}
                        </Typography>
                      </div>
                      {deviceStats.total > 0 && (
                        <div className="hidden sm:flex items-center gap-2">
                          <Chip size="sm" variant="flat" color="primary">
                            {deviceStats.active} Active
                          </Chip>
                          <Chip size="sm" variant="flat" color="success">
                            {deviceStats.online} Online
                          </Chip>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {loading ? (
                    <div className="flex justify-center py-12">
                      <div className="text-center">
                        <CircularProgress size={40} />
                        <Typography className="mt-4 text-default-500">
                          Loading device data...
                        </Typography>
                      </div>
                    </div>
                  ) : filteredDevices.length === 0 ? (
                    <div className="text-center py-12">
                      <ExclamationTriangleIcon className="w-12 h-12 text-default-300 mx-auto mb-4" />
                      <Typography variant="h6" className="text-foreground mb-2">
                        No devices found
                      </Typography>
                      <Typography variant="body2" className="text-default-500">
                        {devices.length === 0 
                          ? `${user.name} has no device records yet`
                          : 'Try adjusting your search or filters'
                        }
                      </Typography>
                      {devices.length === 0 && (
                        <Typography variant="caption" className="text-default-400 block mt-2">
                          Device records are created when users log in
                        </Typography>
                      )}
                    </div>
                  ) : (
                    <>
                      <Table 
                        aria-label="Device history table" 
                        className="w-full"
                        classNames={{
                          wrapper: "shadow-none bg-transparent",
                          th: "bg-white/10 backdrop-blur-md text-default-600 border-b border-white/10",
                          td: "border-b border-white/5"
                        }}
                      >
                        <TableHeader>
                          <TableColumn>Device</TableColumn>
                          <TableColumn>Type</TableColumn>
                          <TableColumn>IP Address</TableColumn>
                          <TableColumn>Location</TableColumn>
                          <TableColumn>Status</TableColumn>
                          <TableColumn>Last Seen</TableColumn>
                          <TableColumn>Actions</TableColumn>
                        </TableHeader>
                        <TableBody>
                          {paginatedDevices.map((device) => (
                            <TableRow key={device.id} className="hover:bg-white/5 transition-colors">
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="shrink-0">
                                    {getDeviceIcon(device.user_agent)}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="font-medium text-sm text-foreground truncate">
                                      {device.device_name || 'Unknown Device'}
                                    </div>
                                    <div className="text-xs text-default-500 truncate max-w-48" title={device.user_agent}>
                                      {device.user_agent}
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  size="sm"
                                  variant="flat"
                                  color={getDeviceType(device.user_agent) === 'Mobile' ? 'secondary' : 'default'}
                                  startContent={getDeviceIcon(device.user_agent)}
                                >
                                  {getDeviceType(device.user_agent)}
                                </Chip>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm font-mono text-foreground">
                                  {device.ip_address}
                                </span>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <MapPinIcon className="w-3 h-3 text-default-400 shrink-0" />
                                  <span className="text-sm text-foreground truncate">
                                    {device.location || 'Unknown'}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  size="sm"
                                  variant="flat"
                                  color={getDeviceStatusColor(device)}
                                  startContent={device.is_active ? 
                                    <CheckCircleIcon className="w-3 h-3" /> : 
                                    <XCircleIcon className="w-3 h-3" />
                                  }
                                >
                                  {getDeviceStatusText(device)}
                                </Chip>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <ClockIcon className="w-3 h-3 text-default-400 shrink-0" />
                                  <span className="text-sm text-foreground">
                                    {formatLastSeen(device.last_seen_at)}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  {device.is_active && (
                                    <Tooltip content="Force logout this device">
                                      <Button
                                        isIconOnly
                                        size="sm"
                                        variant="light"
                                        color="danger"
                                        onPress={() => forceLogoutDevice(device.id)}
                                        isDisabled={actionLoading[`logout_${device.id}`]}
                                        className="min-w-0 w-8 h-8"
                                      >
                                        {actionLoading[`logout_${device.id}`] ? (
                                          <div className="animate-spin">
                                            <ArrowPathIcon className="w-3 h-3" />
                                          </div>
                                        ) : (
                                          <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                                        )}
                                      </Button>
                                    </Tooltip>
                                  )}
                                  
                                  <Dropdown>
                                    <DropdownTrigger>
                                      <Button
                                        isIconOnly
                                        size="sm"
                                        variant="light"
                                        className="min-w-0 w-8 h-8"
                                      >
                                        <EllipsisVerticalIcon className="w-3 h-3" />
                                      </Button>
                                    </DropdownTrigger>
                                    <DropdownMenu aria-label="Device Actions">
                                      <DropdownItem
                                        key="details"
                                        description="View detailed device information"
                                        startContent={<EyeIcon className="w-4 h-4" />}
                                        onPress={() => handleViewDeviceDetails(device)}
                                      >
                                        Device Details
                                      </DropdownItem>
                                      {device.is_active && (
                                        <DropdownItem
                                          key="logout"
                                          description="Force logout this device"
                                          startContent={<ArrowTopRightOnSquareIcon className="w-4 h-4" />}
                                          color="warning"
                                          onPress={() => forceLogoutDevice(device.id)}
                                        >
                                          Force Logout
                                        </DropdownItem>
                                      )}
                                    </DropdownMenu>
                                  </Dropdown>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      
                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="flex justify-center items-center p-4 border-t border-white/10">
                          <Pagination
                            total={totalPages}
                            page={pagination.currentPage}
                            onChange={(page) => setPagination(prev => ({ ...prev, currentPage: page }))}
                            showControls
                            showShadow
                            color="primary"
                            size={isMobile ? "sm" : "md"}
                            classNames={{
                              wrapper: "gap-2",
                              item: "bg-white/10 backdrop-blur-md",
                              cursor: "bg-primary text-primary-foreground",
                            }}
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </PageHeader>
          </GlassCard>
        </motion.div>

      {/* Device Details Modal */}
      <GlassDialog 
        open={isDeviceModalOpen} 
        closeModal={handleCloseDeviceModal}
        maxWidth="md"
        fullWidth
      >
        <div className="relative">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              {selectedDevice && getDeviceIcon(selectedDevice.user_agent, "w-6 h-6")}
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Device Information
                </h2>
                <p className="text-sm text-default-500">
                  {selectedDevice?.device_name || 'Unknown Device'}
                </p>
              </div>
            </div>
            <Button
              isIconOnly
              variant="light"
              onPress={handleCloseDeviceModal}
              className="text-default-400 hover:text-foreground"
            >
              <XMarkIcon className="w-5 h-5" />
            </Button>
          </div>
        
        {/* Modal Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {selectedDevice && (
            <div className="space-y-6">
              {/* Device Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <GlassCard>
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-primary/20 backdrop-blur-xs rounded-lg flex items-center justify-center border border-primary/30">
                        {getDeviceIcon(selectedDevice.user_agent, "w-5 h-5")}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">
                          Device Type
                        </h3>
                        <p className="text-default-500 text-sm">
                          {getDeviceType(selectedDevice.user_agent)}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-default-400">Browser:</span>
                        <span className="text-foreground">{getBrowserInfo(selectedDevice.user_agent)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-default-400">OS:</span>
                        <span className="text-foreground">{getOSInfo(selectedDevice.user_agent)}</span>
                      </div>
                    </div>
                  </div>
                </GlassCard>

                <GlassCard variant="glass">
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-secondary/20 backdrop-blur-xs rounded-lg flex items-center justify-center border border-secondary/30">
                        <WifiIcon className="w-5 h-5 text-secondary" />
                      </div>
                      <div>
                        <Typography variant="subtitle1" className="font-semibold text-foreground">
                          Connection
                        </Typography>
                        <Typography variant="body2" className="text-default-500">
                          Network Information
                        </Typography>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-default-400">IP Address:</span>
                        <span className="text-foreground font-mono">{selectedDevice.ip_address}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-default-400">Location:</span>
                        <span className="text-foreground">{selectedDevice.location || 'Unknown'}</span>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </div>

              {/* Activity Information */}
              <GlassCard variant="glass">
                <Box p={3}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-success/20 backdrop-blur-xs rounded-lg flex items-center justify-center border border-success/30">
                      <ClockIcon className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <Typography variant="subtitle1" className="font-semibold text-foreground">
                        Activity Timeline
                      </Typography>
                      <Typography variant="body2" className="text-default-500">
                        Session and usage information
                      </Typography>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-white/5 rounded-lg border border-white/10">
                      <Typography variant="h6" className="font-bold text-foreground">
                        {selectedDevice.is_active ? 'Active' : 'Inactive'}
                      </Typography>
                      <Typography variant="caption" className="text-default-400">
                        Current Status
                      </Typography>
                    </div>
                    <div className="text-center p-3 bg-white/5 rounded-lg border border-white/10">
                      <Typography variant="h6" className="font-bold text-foreground">
                        {formatLastSeen(selectedDevice.last_seen_at)}
                      </Typography>
                      <Typography variant="caption" className="text-default-400">
                        Last Seen
                      </Typography>
                    </div>
                    <div className="text-center p-3 bg-white/5 rounded-lg border border-white/10">
                      <Typography variant="h6" className="font-bold text-foreground">
                        {selectedDevice.created_at ? new Date(selectedDevice.created_at).toLocaleDateString() : 'Unknown'}
                      </Typography>
                      <Typography variant="caption" className="text-default-400">
                        First Login
                      </Typography>
                    </div>
                  </div>
                </Box>
              </GlassCard>

              {/* Technical Details */}
              <GlassCard variant="glass">
                <Box p={3}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-warning/20 backdrop-blur-xs rounded-lg flex items-center justify-center border border-warning/30">
                      <IdentificationIcon className="w-5 h-5 text-warning" />
                    </div>
                    <div>
                      <Typography variant="subtitle1" className="font-semibold text-foreground">
                        Technical Information
                      </Typography>
                      <Typography variant="body2" className="text-default-500">
                        Detailed device specifications
                      </Typography>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <Typography variant="caption" className="text-default-400 uppercase tracking-wide">
                        Device ID
                      </Typography>
                      <Typography variant="body2" className="text-foreground font-mono mt-1 p-2 bg-white/5 rounded-sm border border-white/10">
                        {selectedDevice.id}
                      </Typography>
                    </div>
                    <div>
                      <Typography variant="caption" className="text-default-400 uppercase tracking-wide">
                        User Agent
                      </Typography>
                      <Typography variant="body2" className="text-foreground break-all mt-1 p-2 bg-white/5 rounded-sm border border-white/10">
                        {selectedDevice.user_agent}
                      </Typography>
                    </div>
                  </div>
                </Box>
              </GlassCard>

              {/* Security Actions */}
              {selectedDevice.is_active && (
                <GlassCard variant="glass">
                  <Box p={3} className="bg-danger/10 backdrop-blur-xs border border-danger/20">
                    <div className="flex items-center gap-3 mb-3">
                      <ExclamationTriangleIcon className="w-6 h-6 text-danger shrink-0" />
                      <div>
                        <Typography variant="subtitle1" className="font-semibold text-danger">
                          Security Actions
                        </Typography>
                        <Typography variant="body2" className="text-danger/80">
                          Manage device access and security
                        </Typography>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="flat"
                      className="bg-danger/20 text-danger border-danger/30 hover:bg-danger/30 backdrop-blur-xs"
                      startContent={<ArrowTopRightOnSquareIcon className="w-4 h-4" />}
                      onPress={() => {
                        forceLogoutDevice(selectedDevice.id);
                        handleCloseDeviceModal();
                      }}
                      isDisabled={actionLoading[`logout_${selectedDevice.id}`]}
                    >
                      {actionLoading[`logout_${selectedDevice.id}`] ? 'Logging out...' : 'Force Logout Device'}
                    </Button>
                  </Box>
                </GlassCard>
              )}
            </div>
          )}
        </div>
        
        {/* Modal Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-white/10">
          <Button 
            variant="flat" 
            onPress={handleCloseDeviceModal}
            className="bg-default/20 text-default-700 border-default/30 hover:bg-default/30"
          >
            Close
          </Button>
        </div>
        </div>
      </GlassDialog>
    </>
  );
};

UserDeviceManagement.layout = page => <App children={page} />;

export default UserDeviceManagement;
