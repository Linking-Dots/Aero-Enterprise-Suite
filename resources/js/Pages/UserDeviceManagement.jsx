import React, { useState, useEffect } from 'react';
import { Head, usePage, router } from "@inertiajs/react";
import { 
  Box, 
  Typography, 
  useMediaQuery, 
  useTheme,
  CircularProgress
} from '@mui/material';
import { 
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Divider,
  Switch,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Tooltip
} from "@heroui/react";
import { 
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
  ClockIcon,
  MapPinIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowLeftIcon,
  LockClosedIcon,
  LockOpenIcon
} from "@heroicons/react/24/outline";
import App from "@/Layouts/App.jsx";
import GlassCard from "@/Components/GlassCard.jsx";
import PageHeader from "@/Components/PageHeader.jsx";
import axios from 'axios';
import { toast } from 'react-toastify';

const UserDeviceManagement = ({ title, user: initialUser, devices: initialDevices }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [user, setUser] = useState(initialUser);
  const [devices, setDevices] = useState(initialDevices || []);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  // Toggle single device login for user
  const toggleSingleDeviceLogin = async (enabled) => {
    setActionLoading(prev => ({ ...prev, toggle: true }));
    
    try {
      const response = await axios.post(route('users.device.toggle'), {
        user_id: user.id,
        enabled: enabled
      });

      if (response.status === 200) {
        setUser(prev => ({
          ...prev,
          single_device_login: enabled,
          active_device: enabled ? prev.active_device : null
        }));
        
        toast.success(
          enabled 
            ? 'Single device login enabled' 
            : 'Single device login disabled'
        );
        
        // Refresh devices list
        fetchDevices();
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
        setUser(prev => ({
          ...prev,
          active_device: null
        }));
        
        toast.success('User device has been reset');
        
        // Refresh devices list
        fetchDevices();
      }
    } catch (error) {
      console.error('Error resetting user device:', error);
      toast.error('Failed to reset user device');
    } finally {
      setActionLoading(prev => ({ ...prev, reset: false }));
    }
  };

  // Fetch devices list
  const fetchDevices = async () => {
    setLoading(true);
    
    try {
      const response = await axios.get(route('users.device.list', { user: user.id }));
      
      if (response.status === 200) {
        setDevices(response.data.devices);
      }
    } catch (error) {
      console.error('Error fetching devices:', error);
      toast.error('Failed to fetch device information');
    } finally {
      setLoading(false);
    }
  };

  // Format device info
  const getDeviceIcon = (userAgent) => {
    const agent = userAgent.toLowerCase();
    if (agent.includes('mobile') || agent.includes('android') || agent.includes('iphone')) {
      return <DevicePhoneMobileIcon className="w-5 h-5" />;
    }
    return <ComputerDesktopIcon className="w-5 h-5" />;
  };

  const formatLastSeen = (timestamp) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return date.toLocaleDateString();
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  return (
    <>
      <Head title={title} />
      
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            isIconOnly
            variant="light"
            onPress={() => router.visit(route('users.index'))}
            className="text-default-400 hover:text-foreground"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Button>
          
          <div>
            <Typography variant="h4" className="font-bold text-foreground">
              Device Management
            </Typography>
            <Typography variant="body2" className="text-default-500">
              Manage {user.name}'s device access and restrictions
            </Typography>
          </div>
        </div>

        {/* User Overview Card */}
        <GlassCard>
          <CardHeader className="flex gap-3">
            <div className="flex flex-col">
              <p className="text-lg font-semibold">{user.name}</p>
              <p className="text-small text-default-500">{user.email}</p>
            </div>
          </CardHeader>
          <Divider/>
          <CardBody>
            <div className="flex flex-col md:flex-row gap-6">
              {/* Device Status */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheckIcon className="w-5 h-5 text-primary" />
                    <span className="font-medium">Single Device Login</span>
                  </div>
                  <Switch
                    isSelected={user.single_device_login}
                    onValueChange={toggleSingleDeviceLogin}
                    isDisabled={actionLoading.toggle}
                    color="primary"
                    size="sm"
                  />
                </div>
                
                {user.single_device_login && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-default-600">Status:</span>
                      <Chip
                        size="sm"
                        variant="flat"
                        color={user.active_device ? "warning" : "success"}
                        startContent={user.active_device ? 
                          <LockClosedIcon className="w-3 h-3" /> : 
                          <LockOpenIcon className="w-3 h-3" />
                        }
                      >
                        {user.active_device ? 'Device Locked' : 'Device Free'}
                      </Chip>
                    </div>
                    
                    {user.active_device && (
                      <Button
                        color="warning"
                        variant="flat"
                        size="sm"
                        startContent={<ArrowPathIcon className="w-4 h-4" />}
                        onPress={resetUserDevice}
                        isLoading={actionLoading.reset}
                        className="w-full md:w-auto"
                      >
                        Reset Device Lock
                      </Button>
                    )}
                  </div>
                )}
                
                {!user.single_device_login && (
                  <div className="text-sm text-default-500">
                    User can login from multiple devices simultaneously
                  </div>
                )}
              </div>
              
              {/* Quick Stats */}
              <div className="flex-1">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-default-100 rounded-lg">
                    <div className="text-lg font-semibold text-primary">
                      {devices.length}
                    </div>
                    <div className="text-xs text-default-500">
                      Device Records
                    </div>
                  </div>
                  <div className="text-center p-3 bg-default-100 rounded-lg">
                    <div className="text-lg font-semibold text-success">
                      {devices.filter(d => d.is_active).length}
                    </div>
                    <div className="text-xs text-default-500">
                      Active Sessions
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardBody>
        </GlassCard>

        {/* Devices Table */}
        <GlassCard>
          <CardHeader>
            <div className="flex items-center gap-2">
              <DevicePhoneMobileIcon className="w-5 h-5" />
              <span className="font-semibold">Device History</span>
            </div>
          </CardHeader>
          <Divider/>
          <CardBody>
            {loading ? (
              <div className="flex justify-center py-8">
                <CircularProgress />
              </div>
            ) : devices.length === 0 ? (
              <div className="text-center py-8">
                <ExclamationTriangleIcon className="w-12 h-12 text-default-300 mx-auto mb-4" />
                <Typography variant="body1" className="text-default-500">
                  No device records found
                </Typography>
              </div>
            ) : (
              <Table aria-label="Device history table" className="w-full">
                <TableHeader>
                  <TableColumn>Device</TableColumn>
                  <TableColumn>IP Address</TableColumn>
                  <TableColumn>Location</TableColumn>
                  <TableColumn>Status</TableColumn>
                  <TableColumn>Last Seen</TableColumn>
                </TableHeader>
                <TableBody>
                  {devices.map((device) => (
                    <TableRow key={device.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getDeviceIcon(device.user_agent)}
                          <div>
                            <div className="font-medium text-sm">
                              {device.device_name || 'Unknown Device'}
                            </div>
                            <div className="text-xs text-default-500 truncate max-w-48">
                              {device.user_agent}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-mono">
                          {device.ip_address}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPinIcon className="w-3 h-3 text-default-400" />
                          <span className="text-sm">
                            {device.location || 'Unknown'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="sm"
                          variant="flat"
                          color={device.is_active ? "success" : "default"}
                          startContent={device.is_active ? 
                            <CheckCircleIcon className="w-3 h-3" /> : 
                            <XCircleIcon className="w-3 h-3" />
                          }
                        >
                          {device.is_active ? 'Active' : 'Inactive'}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <ClockIcon className="w-3 h-3 text-default-400" />
                          <span className="text-sm">
                            {formatLastSeen(device.last_seen_at)}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardBody>
        </GlassCard>
      </div>
    </>
  );
};

UserDeviceManagement.layout = page => <App children={page} />;

export default UserDeviceManagement;
