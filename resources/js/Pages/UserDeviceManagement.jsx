import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Head, router } from "@inertiajs/react";
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Button,
  Card,
  CardBody,
  CardHeader,
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
  Pagination,
  Spinner,
  Input,
  Select,
  SelectItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Switch,
  Avatar,
  Badge,
  Spacer
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
  ArrowTopRightOnSquareIcon,
  DocumentArrowDownIcon,
  UsersIcon,
  GlobeAltIcon,
  SignalIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  XMarkIcon,
  EyeIcon,
  WifiIcon,
  IdentificationIcon
} from "@heroicons/react/24/outline";
import App from "@/Layouts/App.jsx";
import axios from 'axios';
import { toast } from 'react-toastify';

// ==========================================
// THEME UTILITY
// ==========================================

// Theme utility function - matches UsersList exactly
const getThemeRadius = () => {
  if (typeof window === 'undefined') return 'lg';
  
  const rootStyles = getComputedStyle(document.documentElement);
  const borderRadius = rootStyles.getPropertyValue('--borderRadius')?.trim() || '12px';
  
  const radiusValue = parseInt(borderRadius);
  if (radiusValue === 0) return 'none';
  if (radiusValue <= 4) return 'sm';
  if (radiusValue <= 8) return 'md';
  if (radiusValue <= 12) return 'lg';
  return 'xl';
};

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Device detection utilities with consistent theming
 */
const DeviceUtils = {
  getIcon: (userAgent, className = "w-5 h-5") => {
    const agent = (userAgent || '').toLowerCase();
    
    if (agent.includes('iphone') || agent.includes('ipod')) {
      return <DevicePhoneMobileIcon className={`${className} text-primary`} />;
    }
    if (agent.includes('android') && agent.includes('mobile')) {
      return <DevicePhoneMobileIcon className={`${className} text-secondary`} />;
    }
    if (agent.includes('ipad') || (agent.includes('android') && agent.includes('tablet'))) {
      return <DeviceTabletIcon className={`${className} text-warning`} />;
    }
    if (agent.includes('smart-tv') || agent.includes('smarttv')) {
      return <TvIcon className={`${className} text-success`} />;
    }
    
    return <ComputerDesktopIcon className={`${className} text-default-500`} />;
  },

  getType: (userAgent) => {
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
  },

  getBrowser: (userAgent) => {
    const agent = (userAgent || '').toLowerCase();
    
    if (agent.includes('chrome') && !agent.includes('edg')) return 'Chrome';
    if (agent.includes('firefox')) return 'Firefox';
    if (agent.includes('safari') && !agent.includes('chrome')) return 'Safari';
    if (agent.includes('edg')) return 'Edge';
    if (agent.includes('opera')) return 'Opera';
    
    return 'Unknown Browser';
  },

  getOS: (userAgent) => {
    const agent = (userAgent || '').toLowerCase();
    
    if (agent.includes('windows nt 10')) return 'Windows 10/11';
    if (agent.includes('windows')) return 'Windows';
    if (agent.includes('mac os x')) return 'macOS';
    if (agent.includes('android')) return 'Android';
    if (agent.includes('iphone os')) return 'iOS';
    if (agent.includes('linux')) return 'Linux';
    
    return 'Unknown OS';
  }
};

/**
 * Date formatting utility
 */
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

/**
 * Get device status information
 */
const getDeviceStatus = (device) => {
  if (!device.is_active) {
    return { color: 'default', text: 'Inactive', icon: XCircleIcon };
  }
  
  if (device.last_seen_at) {
    const now = new Date();
    const lastSeen = new Date(device.last_seen_at);
    const diffMinutes = (now - lastSeen) / (1000 * 60);
    
    if (diffMinutes <= 5) return { color: 'success', text: 'Online', icon: CheckCircleIcon };
    if (diffMinutes <= 60) return { color: 'warning', text: 'Recent', icon: ClockIcon };
  }
  
  return { color: 'primary', text: 'Active', icon: CheckCircleIcon };
};

/**
 * Export devices to CSV
 */
const exportDevicesToCSV = (devices, userName) => {
  const csvData = devices.map(device => ({
    'Device Name': device.device_name || 'Unknown',
    'User Agent': device.user_agent || 'Unknown',
    'IP Address': device.ip_address || 'Unknown',
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
  a.download = `${userName}_devices_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
  
  toast.success('Device data exported successfully');
};

// ==========================================
// CUSTOM HOOKS
// ==========================================

/**
 * Responsive design hook
 */
const useResponsive = () => {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);
  
  return { isMobile };
};

/**
 * Device statistics hook
 */
const useDeviceStats = (devices) => {
  return useMemo(() => {
    const now = new Date();
    const onlineThreshold = new Date(now.getTime() - 5 * 60 * 1000);
    const recentThreshold = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
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
      desktop: devices.length - mobileDevices.length
    };
  }, [devices]);
};

/**
 * Device filtering hook
 */
const useDeviceFilters = (devices) => {
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    type: 'all',
    dateRange: 'all'
  });

  const filteredDevices = useMemo(() => {
    let filtered = [...devices];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(device => 
        (device.device_name || '').toLowerCase().includes(searchLower) ||
        (device.user_agent || '').toLowerCase().includes(searchLower) ||
        (device.ip_address || '').toLowerCase().includes(searchLower) ||
        (device.location || '').toLowerCase().includes(searchLower)
      );
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(device => {
        if (filters.status === 'active') return device.is_active;
        if (filters.status === 'inactive') return !device.is_active;
        return true;
      });
    }

    if (filters.type !== 'all') {
      const isMobileDevice = (agent) => {
        const agentLower = (agent || '').toLowerCase();
        return agentLower.includes('mobile') || agentLower.includes('android') || agentLower.includes('iphone');
      };

      filtered = filtered.filter(device => {
        if (filters.type === 'mobile') return isMobileDevice(device.user_agent);
        if (filters.type === 'desktop') return !isMobileDevice(device.user_agent);
        return true;
      });
    }

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

  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      status: 'all',
      type: 'all',
      dateRange: 'all'
    });
  }, []);

  return { filters, filteredDevices, updateFilter, clearFilters };
};

// ==========================================
// COMPONENTS
// ==========================================

/**
 * Statistics Card Component - Consistent with UsersList theming
 */
const StatCard = ({ title, value, icon: Icon, color, description }) => (
  <Card 
    className="transition-all duration-200"
    style={{
      background: `color-mix(in srgb, var(--theme-content1) 5%, transparent)`,
      borderColor: `color-mix(in srgb, var(--theme-${color}) 20%, transparent)`,
      borderRadius: `var(--borderRadius, 12px)`,
    }}
  >
    <CardBody className="p-4">
      <div className="flex items-center gap-3">
        <div 
          className="p-2 rounded-lg"
          style={{
            background: `color-mix(in srgb, var(--theme-${color}) 20%, transparent)`,
          }}
        >
          <Icon className="w-5 h-5" style={{ color: `var(--theme-${color})` }} />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground" style={{ fontFamily: `var(--fontFamily, "Inter")` }}>
            {value}
          </p>
          <p className="text-sm font-medium text-foreground" style={{ fontFamily: `var(--fontFamily, "Inter")` }}>
            {title}
          </p>
          <p className="text-xs text-default-500" style={{ fontFamily: `var(--fontFamily, "Inter")` }}>
            {description}
          </p>
        </div>
      </div>
    </CardBody>
  </Card>
);

/**
 * Device Status Chip Component
 */
const DeviceStatusChip = ({ device }) => {
  const status = getDeviceStatus(device);
  const IconComponent = status.icon;
  
  return (
    <Chip
      size="sm"
      variant="flat"
      color={status.color}
      startContent={<IconComponent className="w-3 h-3" />}
    >
      {status.text}
    </Chip>
  );
};

/**
 * User Profile Section
 */
const UserProfileSection = ({ user }) => (
  <div className="space-y-6">
    {/* User Avatar and Info */}
    <div className="text-center">
      <div className="relative inline-block mb-4">
        <Avatar
          size="lg"
          name={user.name?.charAt(0)?.toUpperCase()}
          src={user.profile_image_url}
          className="w-20 h-20"
        />
        <Badge
          content=""
          color="success"
          shape="circle"
          placement="bottom-right"
          className="w-5 h-5"
        />
      </div>
      
      <h2 className="text-xl font-bold text-foreground">{user.name}</h2>
      <p className="text-sm text-default-500">{user.email}</p>
    </div>

    {/* User Details */}
    <div className="space-y-3">
      <Card className="shadow-none border">
        <CardBody className="p-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <BuildingOfficeIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-default-400 uppercase">Department</p>
              <p className="text-sm font-medium text-foreground">
                {user.department?.name || 'No Department'}
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card className="shadow-none border">
        <CardBody className="p-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
              <CalendarIcon className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <p className="text-xs text-default-400 uppercase">Member Since</p>
              <p className="text-sm font-medium text-foreground">
                {user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : 'Unknown'}
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card className="shadow-none border">
        <CardBody className="p-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
              <UsersIcon className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-xs text-default-400 uppercase">User ID</p>
              <p className="text-sm font-medium text-foreground">#{user.id}</p>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  </div>
);

/**
 * Device Security Settings
 */
const DeviceSecuritySettings = ({ user, onToggleSingleDevice, onResetDevice, actionLoading }) => (
  <div className="space-y-6">
    <div>
      <h3 className="text-lg font-semibold text-foreground mb-2">Device Security Settings</h3>
      <p className="text-sm text-default-500">Manage device access restrictions and session controls</p>
    </div>

    <Card className="shadow-none border">
      <CardBody className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <ShieldCheckIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Single Device Login</h4>
              <p className="text-xs text-default-500">Restrict user to one active device</p>
            </div>
          </div>
          <Switch
            isSelected={user.single_device_login}
            onValueChange={onToggleSingleDevice}
            isDisabled={actionLoading.toggle}
            color="success"
          />
        </div>
        
        <Card className="shadow-none bg-default-50">
          <CardBody className="p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-default-600">Current Status:</span>
              <Chip
                size="sm"
                variant="flat"
                color={
                  !user.single_device_login ? "default" :
                  user.active_device ? "warning" : "success"
                }
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
          </CardBody>
        </Card>
        
        {/* Active Device Info */}
        {user.single_device_login && user.active_device && (
          <Card className="shadow-none border-warning bg-warning/10 mt-4">
            <CardBody className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center shrink-0">
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
              
              <Divider className="my-3" />
              <Button
                size="sm"
                color="danger"
                variant="flat"
                startContent={actionLoading.reset ? 
                  <ArrowPathIcon className="w-4 h-4 animate-spin" /> : 
                  <ArrowPathIcon className="w-4 h-4" />
                }
                isLoading={actionLoading.reset}
                onPress={onResetDevice}
              >
                Reset Device Lock
              </Button>
            </CardBody>
          </Card>
        )}

        {/* Information Panels */}
        {user.single_device_login && !user.active_device && (
          <Card className="shadow-none border-success bg-success/10 mt-4">
            <CardBody className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircleIcon className="w-8 h-8 text-success shrink-0" />
                <div>
                  <h5 className="font-semibold text-success mb-1">Ready for Device Lock</h5>
                  <p className="text-sm text-success/80">
                    Single device login is enabled. The user's next login will lock their session to that device.
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {!user.single_device_login && (
          <Card className="shadow-none border-primary bg-primary/10 mt-4">
            <CardBody className="p-4">
              <div className="flex items-center gap-3">
                <GlobeAltIcon className="w-8 h-8 text-primary shrink-0" />
                <div>
                  <h5 className="font-semibold text-primary mb-1">Multiple Device Access</h5>
                  <p className="text-sm text-primary/80">
                    User can log in from multiple devices simultaneously. Enable single device login for enhanced security.
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        )}
      </CardBody>
    </Card>
  </div>
);

/**
 * Device Filters Component - Consistent with UsersList theming
 */
const DeviceFilters = ({ filters, updateFilter, clearFilters, showFilters, setShowFilters, deviceCount, totalDevices, isMobile }) => (
  <Card 
    className="transition-all duration-200"
    style={{
      background: `color-mix(in srgb, var(--theme-content1) 5%, transparent)`,
      borderColor: `color-mix(in srgb, var(--theme-primary) 20%, transparent)`,
      borderRadius: `var(--borderRadius, 12px)`,
    }}
  >
    <CardBody className="p-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by device name, IP, location..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
            variant="bordered"
            size={isMobile ? "sm" : "md"}
            radius={getThemeRadius()}
            classNames={{
              inputWrapper: "border-default-200 hover:border-default-300",
            }}
            style={{
              fontFamily: `var(--fontFamily, "Inter")`,
            }}
          />
        </div>

        <div className="flex gap-2 items-end">
          <Button
            isIconOnly={isMobile}
            variant="bordered"
            onPress={() => setShowFilters(!showFilters)}
            size={isMobile ? "sm" : "md"}
            radius={getThemeRadius()}
            startContent={!isMobile && <FunnelIcon className="w-4 h-4" />}
            className="border-[rgba(var(--theme-primary-rgb),0.3)] bg-[rgba(var(--theme-primary-rgb),0.05)] hover:bg-[rgba(var(--theme-primary-rgb),0.1)]"
            style={{ fontFamily: `var(--fontFamily, "Inter")` }}
          >
            {isMobile ? <FunnelIcon className="w-4 h-4" /> : "Filters"}
          </Button>

          <div 
            className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg border"
            style={{
              background: `color-mix(in srgb, var(--theme-content2) 30%, transparent)`,
              borderColor: `color-mix(in srgb, var(--theme-primary) 20%, transparent)`,
              borderRadius: `var(--borderRadius, 12px)`,
            }}
          >
            <span className="text-xs text-default-500" style={{ fontFamily: `var(--fontFamily, "Inter")` }}>
              Showing: <span className="font-medium text-foreground">{deviceCount}</span> / {totalDevices}
            </span>
          </div>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <Divider className="my-4" style={{ borderColor: `var(--theme-divider, #E4E4E7)` }} />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground" style={{ fontFamily: `var(--fontFamily, "Inter")` }}>
                  Status
                </label>
                <Select
                  selectedKeys={[filters.status]}
                  onSelectionChange={(keys) => updateFilter('status', Array.from(keys)[0])}
                  size={isMobile ? "sm" : "md"}
                  variant="bordered"
                  radius={getThemeRadius()}
                  classNames={{
                    trigger: "border-default-200 hover:border-default-300",
                    value: "text-foreground",
                    popoverContent: [
                      "bg-content1",
                      "border-default-200",
                    ],
                  }}
                  style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                >
                  <SelectItem key="all">All Status</SelectItem>
                  <SelectItem key="active">Active Only</SelectItem>
                  <SelectItem key="inactive">Inactive Only</SelectItem>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-foreground" style={{ fontFamily: `var(--fontFamily, "Inter")` }}>
                  Device Type
                </label>
                <Select
                  selectedKeys={[filters.type]}
                  onSelectionChange={(keys) => updateFilter('type', Array.from(keys)[0])}
                  size={isMobile ? "sm" : "md"}
                  variant="bordered"
                  radius={getThemeRadius()}
                  classNames={{
                    trigger: "border-default-200 hover:border-default-300",
                    value: "text-foreground",
                    popoverContent: [
                      "bg-content1",
                      "border-default-200",
                    ],
                  }}
                  style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                >
                  <SelectItem key="all">All Types</SelectItem>
                  <SelectItem key="mobile">Mobile Only</SelectItem>
                  <SelectItem key="desktop">Desktop Only</SelectItem>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-foreground" style={{ fontFamily: `var(--fontFamily, "Inter")` }}>
                  Activity
                </label>
                <Select
                  selectedKeys={[filters.dateRange]}
                  onSelectionChange={(keys) => updateFilter('dateRange', Array.from(keys)[0])}
                  size={isMobile ? "sm" : "md"}
                  variant="bordered"
                  radius={getThemeRadius()}
                  classNames={{
                    trigger: "border-default-200 hover:border-default-300",
                    value: "text-foreground",
                    popoverContent: [
                      "bg-content1",
                      "border-default-200",
                    ],
                  }}
                  style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                >
                  <SelectItem key="all">All Time</SelectItem>
                  <SelectItem key="hour">Last Hour</SelectItem>
                  <SelectItem key="day">Last 24 Hours</SelectItem>
                  <SelectItem key="week">Last Week</SelectItem>
                  <SelectItem key="month">Last Month</SelectItem>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  variant="bordered"
                  color="primary"
                  className="w-full border-[rgba(var(--theme-primary-rgb),0.3)] bg-[rgba(var(--theme-primary-rgb),0.05)] hover:bg-[rgba(var(--theme-primary-rgb),0.1)]"
                  size={isMobile ? "sm" : "md"}
                  radius={getThemeRadius()}
                  onPress={clearFilters}
                  style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </CardBody>
  </Card>
);

/**
 * Device Details Modal
 */
const DeviceDetailsModal = ({ isOpen, onClose, device, onForceLogout, actionLoading }) => {
  if (!device) return null;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      size="2xl"
      scrollBehavior="inside"
      radius={getThemeRadius()}
      classNames={{
        base: "bg-content1",
        header: [
          "bg-gradient-to-r",
          "from-[color-mix(in_srgb,var(--theme-primary)_15%,transparent)]",
          "to-[color-mix(in_srgb,var(--theme-secondary)_15%,transparent)]",
          "border-b",
          "border-[color-mix(in_srgb,var(--theme-primary)_20%,transparent)]",
        ],
        body: "bg-content1",
        footer: [
          "bg-content1",
          "border-t",
          "border-[color-mix(in_srgb,var(--theme-primary)_20%,transparent)]",
        ],
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <div 
                  className="p-2 rounded-lg"
                  style={{
                    background: `color-mix(in srgb, var(--theme-primary) 20%, transparent)`,
                    borderRadius: `var(--borderRadius, 8px)`,
                  }}
                >
                  {DeviceUtils.getIcon(device.user_agent, "w-6 h-6")}
                </div>
                <div>
                  <h2 
                    className="text-lg font-semibold text-foreground"
                    style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                  >
                    Device Information
                  </h2>
                  <p 
                    className="text-sm text-default-500"
                    style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                  >
                    {device.device_name || 'Unknown Device'}
                  </p>
                </div>
              </div>
            </ModalHeader>
            <ModalBody>
              <div className="space-y-6">
                {/* Device Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card 
                    className="transition-all duration-200"
                    style={{
                      background: `color-mix(in srgb, var(--theme-content1) 5%, transparent)`,
                      borderColor: `color-mix(in srgb, var(--theme-primary) 20%, transparent)`,
                      borderRadius: `var(--borderRadius, 12px)`,
                    }}
                  >
                    <CardBody className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div 
                          className="w-10 h-10 flex items-center justify-center"
                          style={{
                            background: `color-mix(in srgb, var(--theme-primary) 20%, transparent)`,
                            borderRadius: `var(--borderRadius, 8px)`,
                          }}
                        >
                          {DeviceUtils.getIcon(device.user_agent)}
                        </div>
                        <div>
                          <h3 
                            className="font-semibold text-foreground"
                            style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                          >
                            Device Type
                          </h3>
                          <p 
                            className="text-default-500 text-sm"
                            style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                          >
                            {DeviceUtils.getType(device.user_agent)}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span 
                            className="text-default-400"
                            style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                          >
                            Browser:
                          </span>
                          <span 
                            className="text-foreground"
                            style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                          >
                            {DeviceUtils.getBrowser(device.user_agent)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span 
                            className="text-default-400"
                            style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                          >
                            OS:
                          </span>
                          <span 
                            className="text-foreground"
                            style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                          >
                            {DeviceUtils.getOS(device.user_agent)}
                          </span>
                        </div>
                      </div>
                    </CardBody>
                  </Card>

                  <Card 
                    className="transition-all duration-200"
                    style={{
                      background: `color-mix(in srgb, var(--theme-content1) 5%, transparent)`,
                      borderColor: `color-mix(in srgb, var(--theme-secondary) 20%, transparent)`,
                      borderRadius: `var(--borderRadius, 12px)`,
                    }}
                  >
                    <CardBody className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div 
                          className="w-10 h-10 flex items-center justify-center"
                          style={{
                            background: `color-mix(in srgb, var(--theme-secondary) 20%, transparent)`,
                            borderRadius: `var(--borderRadius, 8px)`,
                          }}
                        >
                          <WifiIcon className="w-5 h-5" style={{ color: 'var(--theme-secondary)' }} />
                        </div>
                        <div>
                          <h3 
                            className="font-semibold text-foreground"
                            style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                          >
                            Connection
                          </h3>
                          <p 
                            className="text-default-500 text-sm"
                            style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                          >
                            Network Information
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span 
                            className="text-default-400"
                            style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                          >
                            IP Address:
                          </span>
                          <span 
                            className="text-foreground font-mono"
                            style={{ fontFamily: `var(--monoFontFamily, "JetBrains Mono")` }}
                          >
                            {device.ip_address}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span 
                            className="text-default-400"
                            style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                          >
                            Location:
                          </span>
                          <span 
                            className="text-foreground"
                            style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                          >
                            {device.location || 'Unknown'}
                          </span>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </div>

                {/* Activity Information */}
                <Card 
                  className="transition-all duration-200"
                  style={{
                    background: `color-mix(in srgb, var(--theme-content1) 5%, transparent)`,
                    borderColor: `color-mix(in srgb, var(--theme-success) 20%, transparent)`,
                    borderRadius: `var(--borderRadius, 12px)`,
                  }}
                >
                  <CardBody className="p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div 
                        className="w-10 h-10 flex items-center justify-center"
                        style={{
                          background: `color-mix(in srgb, var(--theme-success) 20%, transparent)`,
                          borderRadius: `var(--borderRadius, 8px)`,
                        }}
                      >
                        <ClockIcon className="w-5 h-5" style={{ color: 'var(--theme-success)' }} />
                      </div>
                      <div>
                        <h3 
                          className="font-semibold text-foreground"
                          style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                        >
                          Activity Timeline
                        </h3>
                        <p 
                          className="text-default-500 text-sm"
                          style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                        >
                          Session and usage information
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div 
                        className="text-center p-3"
                        style={{
                          background: `color-mix(in srgb, var(--theme-default) 10%, transparent)`,
                          borderRadius: `var(--borderRadius, 8px)`,
                        }}
                      >
                        <h4 
                          className="font-bold text-foreground"
                          style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                        >
                          {device.is_active ? 'Active' : 'Inactive'}
                        </h4>
                        <p 
                          className="text-xs text-default-400"
                          style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                        >
                          Current Status
                        </p>
                      </div>
                      <div 
                        className="text-center p-3"
                        style={{
                          background: `color-mix(in srgb, var(--theme-default) 10%, transparent)`,
                          borderRadius: `var(--borderRadius, 8px)`,
                        }}
                      >
                        <h4 
                          className="font-bold text-foreground"
                          style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                        >
                          {formatLastSeen(device.last_seen_at)}
                        </h4>
                        <p 
                          className="text-xs text-default-400"
                          style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                        >
                          Last Seen
                        </p>
                      </div>
                      <div 
                        className="text-center p-3"
                        style={{
                          background: `color-mix(in srgb, var(--theme-default) 10%, transparent)`,
                          borderRadius: `var(--borderRadius, 8px)`,
                        }}
                      >
                        <h4 
                          className="font-bold text-foreground"
                          style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                        >
                          {device.created_at ? new Date(device.created_at).toLocaleDateString() : 'Unknown'}
                        </h4>
                        <p 
                          className="text-xs text-default-400"
                          style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                        >
                          First Login
                        </p>
                      </div>
                    </div>
                  </CardBody>
                </Card>

                {/* Technical Details */}
                <Card 
                  className="transition-all duration-200"
                  style={{
                    background: `color-mix(in srgb, var(--theme-content1) 5%, transparent)`,
                    borderColor: `color-mix(in srgb, var(--theme-warning) 20%, transparent)`,
                    borderRadius: `var(--borderRadius, 12px)`,
                  }}
                >
                  <CardBody className="p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div 
                        className="w-10 h-10 flex items-center justify-center"
                        style={{
                          background: `color-mix(in srgb, var(--theme-warning) 20%, transparent)`,
                          borderRadius: `var(--borderRadius, 8px)`,
                        }}
                      >
                        <IdentificationIcon className="w-5 h-5" style={{ color: 'var(--theme-warning)' }} />
                      </div>
                      <div>
                        <h3 
                          className="font-semibold text-foreground"
                          style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                        >
                          Technical Information
                        </h3>
                        <p 
                          className="text-default-500 text-sm"
                          style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                        >
                          Detailed device specifications
                        </p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p 
                          className="text-xs text-default-400 uppercase tracking-wide mb-1"
                          style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                        >
                          Device ID
                        </p>
                        <p 
                          className="text-sm text-foreground font-mono p-2 border"
                          style={{
                            fontFamily: `var(--monoFontFamily, "JetBrains Mono")`,
                            background: `color-mix(in srgb, var(--theme-default) 5%, transparent)`,
                            borderColor: `color-mix(in srgb, var(--theme-default) 20%, transparent)`,
                            borderRadius: `var(--borderRadius, 6px)`,
                          }}
                        >
                          {device.id}
                        </p>
                      </div>
                      <div>
                        <p 
                          className="text-xs text-default-400 uppercase tracking-wide mb-1"
                          style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                        >
                          User Agent
                        </p>
                        <p 
                          className="text-sm text-foreground break-all p-2 border"
                          style={{
                            fontFamily: `var(--fontFamily, "Inter")`,
                            background: `color-mix(in srgb, var(--theme-default) 5%, transparent)`,
                            borderColor: `color-mix(in srgb, var(--theme-default) 20%, transparent)`,
                            borderRadius: `var(--borderRadius, 6px)`,
                          }}
                        >
                          {device.user_agent}
                        </p>
                      </div>
                    </div>
                  </CardBody>
                </Card>

                {/* Security Actions */}
                {device.is_active && (
                  <Card 
                    className="transition-all duration-200"
                    style={{
                      background: `color-mix(in srgb, var(--theme-danger) 5%, transparent)`,
                      borderColor: `color-mix(in srgb, var(--theme-danger) 20%, transparent)`,
                      borderRadius: `var(--borderRadius, 12px)`,
                    }}
                  >
                    <CardBody className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <ExclamationTriangleIcon className="w-6 h-6 shrink-0" style={{ color: 'var(--theme-danger)' }} />
                        <div>
                          <h3 
                            className="font-semibold"
                            style={{ 
                              color: 'var(--theme-danger)',
                              fontFamily: `var(--fontFamily, "Inter")`,
                            }}
                          >
                            Security Actions
                          </h3>
                          <p 
                            className="text-sm"
                            style={{ 
                              color: `color-mix(in srgb, var(--theme-danger) 80%, transparent)`,
                              fontFamily: `var(--fontFamily, "Inter")`,
                            }}
                          >
                            Manage device access and security
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        color="danger"
                        variant="flat"
                        radius={getThemeRadius()}
                        startContent={<ArrowTopRightOnSquareIcon className="w-4 h-4" />}
                        onPress={() => {
                          onForceLogout(device.id);
                          onClose();
                        }}
                        isLoading={actionLoading[`logout_${device.id}`]}
                        style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                      >
                        Force Logout Device
                      </Button>
                    </CardBody>
                  </Card>
                )}
              </div>
            </ModalBody>
            <ModalFooter>
              <Button 
                variant="flat" 
                radius={getThemeRadius()}
                onPress={onClose}
                style={{ fontFamily: `var(--fontFamily, "Inter")` }}
              >
                Close
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

// ==========================================
// MAIN COMPONENT
// ==========================================

/**
 * UserDeviceManagement - Clean, simple, Hero UI only
 */
const UserDeviceManagement = ({ user: initialUser, devices: initialDevices }) => {
  // Custom media query logic - matching UsersList
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const [isMediumScreen, setIsMediumScreen] = useState(false);
  
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 640);
      setIsTablet(window.innerWidth < 768);
      setIsLargeScreen(window.innerWidth >= 1025);
      setIsMediumScreen(window.innerWidth >= 641 && window.innerWidth <= 1024);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Hooks
  const { isOpen: isDeviceModalOpen, onOpen: onDeviceModalOpen, onClose: onDeviceModalClose } = useDisclosure();
  
  // State
  const [user, setUser] = useState(initialUser);
  const [devices, setDevices] = useState(initialDevices || []);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({ currentPage: 1, perPage: 10 });
  
  // Custom hooks
  const deviceStats = useDeviceStats(devices);
  const { filters, filteredDevices, updateFilter, clearFilters } = useDeviceFilters(devices);
  
  // Computed values
  const paginatedDevices = useMemo(() => {
    const startIndex = (pagination.currentPage - 1) * pagination.perPage;
    const endIndex = startIndex + pagination.perPage;
    return filteredDevices.slice(startIndex, endIndex);
  }, [filteredDevices, pagination]);

  const totalPages = Math.ceil(filteredDevices.length / pagination.perPage);

  const statsCards = useMemo(() => [
    {
      title: 'Total Devices',
      value: deviceStats.total,
      icon: DevicePhoneMobileIcon,
      color: 'primary',
      description: 'All registered devices'
    },
    {
      title: 'Active Sessions',
      value: deviceStats.active,
      icon: CheckCircleIcon,
      color: 'success',
      description: 'Currently active devices'
    },
    {
      title: 'Online Now',
      value: deviceStats.online,
      icon: SignalIcon,
      color: 'secondary',
      description: 'Active within 5 minutes'
    },
    {
      title: 'Recent Activity',
      value: deviceStats.recent,
      icon: ClockIcon,
      color: 'warning',
      description: 'Active within 24 hours'
    }
  ], [deviceStats]);

  // API Functions
  const fetchDevices = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(route('users.device.list', { user: user.id }));
      if (response.status === 200) {
        setDevices(response.data.devices || []);
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

  const toggleSingleDeviceLogin = useCallback(async (enabled) => {
    setActionLoading(prev => ({ ...prev, toggle: true }));
    try {
      const response = await axios.post(route('users.device.toggle'), {
        user_id: user.id,
        enabled: enabled
      });

      if (response.status === 200 && response.data.success) {
        setUser(prev => ({
          ...prev,
          single_device_login: response.data.user.single_device_login,
          active_device: response.data.user.active_device
        }));
        
        toast.success(response.data.message || 
          (enabled ? 'Single device login enabled' : 'Single device login disabled')
        );
        
        await fetchDevices();
      }
    } catch (error) {
      console.error('Error toggling single device login:', error);
      toast.error('Failed to update device settings');
    } finally {
      setActionLoading(prev => ({ ...prev, toggle: false }));
    }
  }, [user, fetchDevices]);

  const resetUserDevice = useCallback(async () => {
    setActionLoading(prev => ({ ...prev, reset: true }));
    try {
      const response = await axios.post(route('users.device.reset'), {
        user_id: user.id
      });

      if (response.status === 200) {
        setUser(prev => ({ ...prev, active_device: null }));
        setDevices(prevDevices => 
          prevDevices.map(device => ({ ...device, is_active: false }))
        );
        toast.success('User device has been reset');
        setTimeout(() => fetchDevices(), 1000);
      }
    } catch (error) {
      console.error('Error resetting user device:', error);
      toast.error('Failed to reset user device');
    } finally {
      setActionLoading(prev => ({ ...prev, reset: false }));
    }
  }, [user.id, fetchDevices]);

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

  // Event Handlers
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDevices();
    setRefreshing(false);
    toast.success('Device data refreshed');
  }, [fetchDevices]);

  const handleExportDevices = useCallback(() => {
    exportDevicesToCSV(devices, user.name);
  }, [devices, user.name]);

  const handleViewDeviceDetails = useCallback((device) => {
    setSelectedDevice(device);
    onDeviceModalOpen();
  }, [onDeviceModalOpen]);

  const handleFilterChange = useCallback((key, value) => {
    updateFilter(key, value);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, [updateFilter]);

  // Effects
  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  return (
    <>
      <Head title={`Device Management - ${user.name}`} />

      <div 
        className="flex flex-col w-full h-full p-4"
        role="main"
        aria-label="Device Management"
      >
        <div className="space-y-4">
          <div className="w-full">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Card 
                className="transition-all duration-200"
                style={{
                  border: `var(--borderWidth, 2px) solid transparent`,
                  borderRadius: `var(--borderRadius, 12px)`,
                  fontFamily: `var(--fontFamily, "Inter")`,
                  transform: `scale(var(--scale, 1))`,
                  background: `linear-gradient(135deg, 
                    var(--theme-content1, #FAFAFA) 20%, 
                    var(--theme-content2, #F4F4F5) 10%, 
                    var(--theme-content3, #F1F3F4) 20%)`,
                }}
              >
                <CardHeader 
                  className="border-b p-0"
                  style={{
                    borderColor: `var(--theme-divider, #E4E4E7)`,
                    background: `linear-gradient(135deg, 
                      color-mix(in srgb, var(--theme-content1) 50%, transparent) 20%, 
                      color-mix(in srgb, var(--theme-content2) 30%, transparent) 10%)`,
                  }}
                >
                  <div className={`${isLargeScreen ? 'p-6' : isMediumScreen ? 'p-4' : 'p-3'} w-full`}>
                    <div className="flex flex-col space-y-4">
                      {/* Main Header Content */}
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        {/* Title Section */}
                        <div className="flex items-center gap-3 lg:gap-4">
                          <div 
                            className={`
                              ${isLargeScreen ? 'p-3' : isMediumScreen ? 'p-2.5' : 'p-2'} 
                              rounded-xl flex items-center justify-center
                            `}
                            style={{
                              background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                              borderColor: `color-mix(in srgb, var(--theme-primary) 25%, transparent)`,
                              borderWidth: `var(--borderWidth, 2px)`,
                              borderRadius: `var(--borderRadius, 12px)`,
                            }}
                          >
                            <DevicePhoneMobileIcon 
                              className={`
                                ${isLargeScreen ? 'w-7 h-7' : isMediumScreen ? 'w-6 h-6' : 'w-5 h-5'}
                              `} 
                              style={{ color: 'var(--theme-primary)' }} 
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h1 
                              className={`
                                ${isLargeScreen ? 'text-2xl' : isMediumScreen ? 'text-xl' : 'text-lg'} 
                                font-bold text-foreground truncate
                              `}
                              style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                            >
                              Device Management - {user.name}
                            </h1>
                            <p 
                              className={`
                                ${isLargeScreen ? 'text-sm' : 'text-xs'} 
                                text-default-500 truncate
                              `}
                              style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                            >
                              Manage {user.name}'s device access, restrictions and session history
                            </p>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            isIconOnly={isMobile}
                            variant="bordered"
                            size={isMobile ? "sm" : "md"}
                            radius={getThemeRadius()}
                            onPress={() => router.visit(route('users'))}
                            startContent={!isMobile && <ArrowLeftIcon className="w-4 h-4" />}
                            className="border-[rgba(var(--theme-default-rgb),0.3)] bg-[rgba(var(--theme-default-rgb),0.05)] hover:bg-[rgba(var(--theme-default-rgb),0.1)]"
                            style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                          >
                            {isMobile ? <ArrowLeftIcon className="w-4 h-4" /> : "Back to Users"}
                          </Button>
                          
                          <Button
                            isIconOnly={isMobile}
                            color="primary"
                            variant="bordered"
                            size={isMobile ? "sm" : "md"}
                            radius={getThemeRadius()}
                            onPress={handleRefresh}
                            isLoading={refreshing}
                            startContent={!refreshing && !isMobile && <ArrowPathIcon className="w-4 h-4" />}
                            className="border-[rgba(var(--theme-primary-rgb),0.3)] bg-[rgba(var(--theme-primary-rgb),0.05)] hover:bg-[rgba(var(--theme-primary-rgb),0.1)]"
                            style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                          >
                            {isMobile ? <ArrowPathIcon className="w-4 h-4" /> : "Refresh"}
                          </Button>
                          
                          {deviceStats.total > 0 && (
                            <Button
                              isIconOnly={isMobile}
                              variant="bordered"
                              size={isMobile ? "sm" : "md"}
                              radius={getThemeRadius()}
                              onPress={handleExportDevices}
                              startContent={!isMobile && <DocumentArrowDownIcon className="w-4 h-4" />}
                              className="border-[rgba(var(--theme-secondary-rgb),0.3)] bg-[rgba(var(--theme-secondary-rgb),0.05)] hover:bg-[rgba(var(--theme-secondary-rgb),0.1)]"
                              style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                            >
                              {isMobile ? <DocumentArrowDownIcon className="w-4 h-4" /> : "Export"}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardBody className="p-0">
                  <div className={`${isLargeScreen ? 'p-6' : isMediumScreen ? 'p-4' : 'p-3'} space-y-6`}>
                    {/* Statistics */}
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {statsCards.map((stat, index) => (
                          <motion.div
                            key={stat.title}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.1 * index }}
                          >
                            <Card 
                              className="transition-all duration-200"
                              style={{
                                background: `color-mix(in srgb, var(--theme-content1) 5%, transparent)`,
                                borderColor: `color-mix(in srgb, var(--theme-${stat.color}) 20%, transparent)`,
                                borderRadius: `var(--borderRadius, 12px)`,
                              }}
                            >
                              <CardBody className="p-4">
                                <div className="flex items-center gap-3">
                                  <div 
                                    className="p-2 rounded-lg"
                                    style={{
                                      background: `color-mix(in srgb, var(--theme-${stat.color}) 20%, transparent)`,
                                    }}
                                  >
                                    <stat.icon className="w-5 h-5" style={{ color: `var(--theme-${stat.color})` }} />
                                  </div>
                                  <div>
                                    <p className="text-2xl font-bold text-foreground">
                                      {stat.value}
                                    </p>
                                    <p className="text-sm font-medium text-foreground">
                                      {stat.title}
                                    </p>
                                    <p className="text-xs text-default-500">
                                      {stat.description}
                                    </p>
                                  </div>
                                </div>
                              </CardBody>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>

                    {/* User Overview */}
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Card 
                        className="transition-all duration-200"
                        style={{
                          background: `color-mix(in srgb, var(--theme-content1) 5%, transparent)`,
                          borderColor: `color-mix(in srgb, var(--theme-primary) 20%, transparent)`,
                          borderRadius: `var(--borderRadius, 12px)`,
                        }}
                      >
                        <CardBody className="p-0">
                          <div className="flex flex-col lg:flex-row">
                            <div className="lg:w-2/5 p-6 border-r border-divider" style={{ borderColor: `var(--theme-divider, #E4E4E7)` }}>
                              <UserProfileSection user={user} />
                            </div>
                  <div className="lg:w-3/5 p-6">
                    <DeviceSecuritySettings 
                      user={user}
                      onToggleSingleDevice={toggleSingleDeviceLogin}
                      onResetDevice={resetUserDevice}
                      actionLoading={actionLoading}
                    />
                  </div>
                </div>
              </CardBody>
            </Card>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-6"
          >
            <DeviceFilters
              filters={filters}
              updateFilter={handleFilterChange}
              clearFilters={clearFilters}
              showFilters={showFilters}
              setShowFilters={setShowFilters}
              deviceCount={filteredDevices.length}
              totalDevices={devices.length}
              isMobile={isMobile}
            />
          </motion.div>

          {/* Devices Table */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Card 
              className="transition-all duration-200"
              style={{
                background: `color-mix(in srgb, var(--theme-content1) 5%, transparent)`,
                borderColor: `color-mix(in srgb, var(--theme-primary) 20%, transparent)`,
                borderRadius: `var(--borderRadius, 12px)`,
              }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 
                      className="text-lg font-semibold text-foreground"
                      style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                    >
                      Device History
                    </h3>
                    <p 
                      className="text-sm text-default-500"
                      style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                    >
                      {filteredDevices.length} device{filteredDevices.length !== 1 ? 's' : ''} found
                      {filteredDevices.length !== devices.length && (
                        <span> (filtered from {devices.length} total)</span>
                      )}
                    </p>
                  </div>
                  {deviceStats.total > 0 && (
                    <div className="hidden sm:flex items-center gap-2">
                      <Chip 
                        size="sm" 
                        variant="flat" 
                        color="primary"
                        radius={getThemeRadius()}
                        style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                      >
                        {deviceStats.active} Active
                      </Chip>
                      <Chip 
                        size="sm" 
                        variant="flat" 
                        color="success"
                        radius={getThemeRadius()}
                        style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                      >
                        {deviceStats.online} Online
                      </Chip>
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <Divider style={{ borderColor: `var(--theme-divider, #E4E4E7)` }} />
              
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="text-center">
                    <Spinner size="lg" color="primary" />
                    <p 
                      className="mt-4 text-default-500"
                      style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                    >
                      Loading device data...
                    </p>
                  </div>
                </div>
              ) : filteredDevices.length === 0 ? (
                <div className="text-center py-12">
                  <ExclamationTriangleIcon className="w-12 h-12 mx-auto mb-4 text-default-400" />
                  <h3 
                    className="text-lg font-semibold mb-2 text-foreground"
                    style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                  >
                    No devices found
                  </h3>
                  <p 
                    className="text-sm text-default-500"
                    style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                  >
                    {devices.length === 0 
                      ? `${user.name} has no device records yet`
                      : 'Try adjusting your search or filters'
                    }
                  </p>
                </div>
              ) : (
                <>
                  <Table 
                    aria-label="Device history table"
                    classNames={{
                      wrapper: "shadow-none bg-transparent",
                      th: [
                        "bg-transparent",
                        "text-default-500",
                        "border-b",
                        "border-divider",
                      ],
                      td: [
                        "border-b",
                        "border-divider",
                        "group-hover:bg-default-50",
                      ],
                    }}
                  >
                    <TableHeader>
                      <TableColumn style={{ fontFamily: `var(--fontFamily, "Inter")` }}>Device</TableColumn>
                      <TableColumn style={{ fontFamily: `var(--fontFamily, "Inter")` }}>Type</TableColumn>
                      <TableColumn style={{ fontFamily: `var(--fontFamily, "Inter")` }}>IP Address</TableColumn>
                      <TableColumn style={{ fontFamily: `var(--fontFamily, "Inter")` }}>Location</TableColumn>
                      <TableColumn style={{ fontFamily: `var(--fontFamily, "Inter")` }}>Status</TableColumn>
                      <TableColumn style={{ fontFamily: `var(--fontFamily, "Inter")` }}>Last Seen</TableColumn>
                      <TableColumn style={{ fontFamily: `var(--fontFamily, "Inter")` }}>Actions</TableColumn>
                    </TableHeader>
                    <TableBody>
                      {paginatedDevices.map((device) => (
                        <TableRow key={device.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {DeviceUtils.getIcon(device.user_agent)}
                              <div>
                                <div 
                                  className="font-medium text-sm text-foreground"
                                  style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                >
                                  {device.device_name || 'Unknown Device'}
                                </div>
                                <div 
                                  className="text-xs text-default-500 truncate max-w-48" 
                                  title={device.user_agent}
                                  style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                >
                                  {device.user_agent}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="sm"
                              variant="flat"
                              radius={getThemeRadius()}
                              color={DeviceUtils.getType(device.user_agent).includes('Mobile') ? 'secondary' : 'default'}
                              style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                            >
                              {DeviceUtils.getType(device.user_agent)}
                            </Chip>
                          </TableCell>
                          <TableCell>
                            <span 
                              className="text-sm font-mono text-foreground"
                              style={{ fontFamily: `var(--monoFontFamily, "JetBrains Mono")` }}
                            >
                              {device.ip_address}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <MapPinIcon className="w-3 h-3 text-default-400" />
                              <span 
                                className="text-sm text-foreground"
                                style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                              >
                                {device.location || 'Unknown'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <DeviceStatusChip device={device} />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <ClockIcon className="w-3 h-3 text-default-400" />
                              <span 
                                className="text-sm text-foreground"
                                style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                              >
                                {formatLastSeen(device.last_seen_at)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {device.is_active && (
                                <Button
                                  isIconOnly
                                  size="sm"
                                  variant="light"
                                  color="danger"
                                  radius={getThemeRadius()}
                                  onPress={() => forceLogoutDevice(device.id)}
                                  isLoading={actionLoading[`logout_${device.id}`]}
                                  className="hover:bg-[rgba(var(--theme-danger-rgb),0.1)]"
                                >
                                  <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                                </Button>
                              )}
                              
                              <Dropdown>
                                <DropdownTrigger>
                                  <Button 
                                    isIconOnly 
                                    size="sm" 
                                    variant="light"
                                    radius={getThemeRadius()}
                                    className="hover:bg-[rgba(var(--theme-default-rgb),0.1)]"
                                  >
                                    <EllipsisVerticalIcon className="w-3 h-3" />
                                  </Button>
                                </DropdownTrigger>
                                <DropdownMenu 
                                  classNames={{
                                    base: "bg-content1",
                                    list: "bg-content1",
                                  }}
                                >
                                  <DropdownItem
                                    key="details"
                                    startContent={<EyeIcon className="w-4 h-4" />}
                                    onPress={() => handleViewDeviceDetails(device)}
                                    className="hover:bg-[rgba(var(--theme-primary-rgb),0.1)]"
                                    style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                                  >
                                    Device Details
                                  </DropdownItem>
                                  {device.is_active && (
                                    <DropdownItem
                                      key="logout"
                                      startContent={<ArrowTopRightOnSquareIcon className="w-4 h-4" />}
                                      color="warning"
                                      onPress={() => forceLogoutDevice(device.id)}
                                      className="hover:bg-[rgba(var(--theme-warning-rgb),0.1)]"
                                      style={{ fontFamily: `var(--fontFamily, "Inter")` }}
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
                    <div className="flex justify-center p-4 border-t" style={{ borderColor: `var(--theme-divider, #E4E4E7)` }}>
                      <Pagination
                        total={totalPages}
                        page={pagination.currentPage}
                        onChange={(page) => setPagination(prev => ({ ...prev, currentPage: page }))}
                        showControls
                        color="primary"
                        size={isMobile ? "sm" : "md"}
                        radius={getThemeRadius()}
                        style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                      />
                    </div>
                  )}
                </>
              )}
                      </Card>
                    </motion.div>
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Device Details Modal */}
      <DeviceDetailsModal 
        isOpen={isDeviceModalOpen} 
        onClose={onDeviceModalClose}
        device={selectedDevice}
        onForceLogout={forceLogoutDevice}
        actionLoading={actionLoading}
      />
    </>
  );
};

UserDeviceManagement.layout = page => <App children={page} />;

export default UserDeviceManagement;