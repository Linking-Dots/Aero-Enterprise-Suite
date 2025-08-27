import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useTheme } from '@/Contexts/ThemeContext.jsx';
import { useMediaQuery } from '@/Hooks/useMediaQuery.js';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import StatsCards from '@/Components/StatsCards';
import { motion } from 'framer-motion';

import {
    Button,
    Spinner,
    Chip,
    Avatar,
    Card,
    CardBody,
    CardHeader,
    Divider,
} from '@heroui/react';
import {
    MapPin,
    Clock,
    User,
    Building,
    Navigation,
    ZoomIn,
    ZoomOut,
    RefreshCw,
    Map as MapIcon,
    Users,
    Clock4,
    MapPin as Place,
    Navigation as NavigationIcon
} from 'lucide-react';

import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import 'leaflet-fullscreen/dist/Leaflet.fullscreen.js';
import 'leaflet-fullscreen/dist/leaflet.fullscreen.css';
import L from 'leaflet';
import { usePage } from "@inertiajs/react";

// Utility function to replace MUI's alpha function
const alpha = (color, opacity) => {
    if (color.startsWith('var(')) {
        // Use CSS variable with opacity via color-mix
        return `color-mix(in srgb, ${color} ${opacity * 100}%, transparent)`;
    }
    if (color.startsWith('#')) {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    return color.replace(/[\d.]+\)$/g, `${opacity})`);
};

// Helper function to convert theme borderRadius to HeroUI radius values
const getThemeRadius = () => {
    const rootStyles = getComputedStyle(document.documentElement);
    const borderRadius = rootStyles.getPropertyValue('--borderRadius')?.trim() || '12px';
    const radiusValue = parseInt(borderRadius);
    if (radiusValue === 0) return 'none';
    if (radiusValue <= 4) return 'sm';
    if (radiusValue <= 8) return 'md';
    if (radiusValue <= 16) return 'lg';
    return 'full';
};


// Constants following ISO standards
const MAP_CONFIG = {
    DEFAULT_ZOOM: 12,
    MIN_ZOOM: 8,
    MAX_ZOOM: 19,
    POSITION_THRESHOLD: 0.0001,
    OFFSET_MULTIPLIER: 0.0001,
    MARKER_SIZE: [40, 40],
    POPUP_MAX_WIDTH: 300,
    UPDATE_INTERVAL: 30000 // 30 seconds
};

const PROJECT_LOCATIONS = {
    primary: { lat: 23.879132, lng: 90.502617, name: 'Primary Office' },
    route: {
        start: { lat: 23.987057, lng: 90.361908, name: 'Route Start' },
        end: { lat: 23.690618, lng: 90.546729, name: 'Route End' }
    }
};

// Enhanced Routing Machine Component
const RoutingMachine = React.memo(({ startLocation, endLocation, theme }) => {
    const map = useMap();

    useEffect(() => {
        if (!map || !startLocation || !endLocation) return;

        const routingControl = L.Routing.control({
            waypoints: [
                L.latLng(startLocation.lat, startLocation.lng),
                L.latLng(endLocation.lat, endLocation.lng)
            ],
            routeWhileDragging: false,
            addWaypoints: false,
            createMarker: () => null, // Hide default markers
            lineOptions: {
                styles: [{
                    color: theme?.customColors?.primary || 'var(--theme-primary, #3b82f6)',
                    weight: 4,
                    opacity: 0.8
                }]
            },
            show: false // Hide turn-by-turn instructions
        }).addTo(map);

        return () => {
            if (map && routingControl) {
                map.removeControl(routingControl);
            }
        };
    }, [map, startLocation, endLocation, theme]);

    return null;
});

RoutingMachine.displayName = 'RoutingMachine';


// Enhanced User Markers Component
const UserMarkers = React.memo(({ selectedDate, onUsersLoad, theme, lastUpdate, users, setUsers, setLoading, setError}) => {

    const map = useMap();
    const prevLocationsRef = useRef([]);

    const fetchUserLocations = useCallback(async () => {
        if (!selectedDate) {
            setLoading(false);
            setUsers([]);
            onUsersLoad?.([]);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const endpoint = route('getUserLocationsForDate', {
                date: selectedDate,
                _t: Date.now()
            });

            const response = await axios.get(endpoint);

            const data = response.data;
            if (!data.success || !Array.isArray(data.locations)) {
                throw new Error('Unexpected response format from server.');
            }

            const locations = data.locations;

            const hasChanges =
                JSON.stringify(locations) !== JSON.stringify(prevLocationsRef.current);

            if (hasChanges) {
                setUsers(locations);
                prevLocationsRef.current = locations;
            }

            onUsersLoad?.(locations);
        } catch (error) {
            let errorMsg = 'Error fetching user locations.';

            if (error.response) {
                errorMsg += ` Server error (${error.response.status}): ${error.response.statusText}`;
                if (typeof error.response.data === 'object') {
                    errorMsg += `\nDetails: ${JSON.stringify(error.response.data)}`;
                }
            } else if (error.request) {
                errorMsg += ' No response received from server.';
            } else if (error.message) {
                errorMsg += ` ${error.message}`;
            }

            console.error(errorMsg, error);
            setError(errorMsg);
            setUsers([]);
            onUsersLoad?.([]);
        } finally {
            setLoading(false);
        }
    }, [selectedDate, onUsersLoad, lastUpdate]);

 // Add lastUpdate to dependencies

    useEffect(() => {
        fetchUserLocations();
    }, [fetchUserLocations]);

    // Utility functions
    const getAdjustedPosition = useCallback((position, index) => {
        const offset = MAP_CONFIG.OFFSET_MULTIPLIER * index;
        return {
            lat: position.lat + offset,
            lng: position.lng + offset
        };
    }, []);

    const arePositionsClose = useCallback((pos1, pos2) => {
        return (
            Math.abs(pos1.lat - pos2.lat) < MAP_CONFIG.POSITION_THRESHOLD &&
            Math.abs(pos1.lng - pos2.lng) < MAP_CONFIG.POSITION_THRESHOLD
        );
    }, []);

    const parseLocation = useCallback((locationData) => {
        if (!locationData) return null;
        
        // Handle object format: {lat: 23.8845952, lng: 90.4986624, address: "", timestamp: "..."}
        if (typeof locationData === 'object' && locationData.lat && locationData.lng) {
            const lat = parseFloat(locationData.lat);
            const lng = parseFloat(locationData.lng);
            
            if (isNaN(lat) || isNaN(lng)) return null;
            
            return { lat, lng };
        }
        
        // Handle string format (fallback for legacy data or direct JSON strings)
        if (typeof locationData === 'string') {
            // Try to parse as JSON first
            try {
                const parsed = JSON.parse(locationData);
                if (parsed.lat && parsed.lng) {
                    const lat = parseFloat(parsed.lat);
                    const lng = parseFloat(parsed.lng);
                    
                    if (isNaN(lat) || isNaN(lng)) return null;
                    
                    return { lat, lng };
                }
            } catch (error) {
                // If JSON parsing fails, try comma-separated coordinate format
                const coords = locationData.split(',');
                if (coords.length >= 2) {
                    const lat = parseFloat(coords[0].trim());
                    const lng = parseFloat(coords[1].trim());
                    
                    if (isNaN(lat) || isNaN(lng)) return null;
                    
                    return { lat, lng };
                }
            }
        }
        
        return null;
    }, []);

    const formatTime = useCallback((timeString) => {
        if (!timeString) return 'Not recorded';
        
        try {
            // Handle both time-only and full datetime strings
            let date;
            if (timeString.includes('T')) {
                date = new Date(timeString);
            } else {
                date = new Date(`${selectedDate}T${timeString}`);
            }
            
            if (isNaN(date.getTime())) return 'Invalid time';
            
            return date.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
        } catch (error) {
            console.warn('Error formatting time:', error);
            return timeString;
        }
    }, [selectedDate]);

    const createUserIcon = useCallback((user) => {
        const primaryColor = 'var(--theme-primary, #3b82f6)';
        const secondaryColor = 'var(--theme-secondary, #8b5cf6)';
        const iconHtml = `
            <div style="
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor});
                border: 3px solid white;
                box-shadow: 0 4px 12px ${alpha(primaryColor, 0.4)};
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 14px;
                backdrop-filter: blur(10px);
            ">
                ${user.profile_image_url || user.profile_image ? 
                    `<img src="${user.profile_image_url || user.profile_image}" style="width: 34px; height: 34px; border-radius: 50%; object-fit: cover;" onerror="this.style.display='none'; this.parentElement.innerHTML='${user.name?.charAt(0)?.toUpperCase() || '?'}';" />` :
                    user.name?.charAt(0)?.toUpperCase() || '?'
                }
            </div>
        `;
        return L.divIcon({
            html: iconHtml,
            className: 'user-marker-icon',
            iconSize: MAP_CONFIG.MARKER_SIZE,
            iconAnchor: [20, 20],
            popupAnchor: [0, -20]
        });
    }, []);

    const createPopupContent = useCallback((user) => {
        const statusColor = user.punchout_time ? 'var(--theme-success, #17C964)' : 'var(--theme-warning, #F5A524)';
        const primaryColor = 'var(--theme-primary, #3b82f6)';
        const secondaryColor = 'var(--theme-secondary, #8b5cf6)';
        const backgroundColor = 'var(--theme-content1, #ffffff)';
        const textPrimary = 'var(--theme-foreground, #1f2937)';
        const textSecondary = 'var(--theme-content3, #6b7280)';
        return `
            <div style="
                min-width: 250px;
                padding: 16px;
                background: linear-gradient(135deg, ${alpha(backgroundColor, 0.95)}, ${alpha(primaryColor, 0.05)});
                border-radius: 12px;
                border: 1px solid ${alpha(primaryColor, 0.2)};
                backdrop-filter: blur(20px);
                font-family: var(--fontFamily, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
            ">
                <div style="display: flex; align-items: center; margin-bottom: 12px;">
                    <div style="
                        width: 32px;
                        height: 32px;
                        border-radius: 50%;
                        background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor});
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                        font-weight: bold;
                        margin-right: 12px;
                    ">
                        ${user.profile_image_url || user.profile_image ? 
                            `<img src="${user.profile_image_url || user.profile_image}" style="width: 30px; height: 30px; border-radius: 50%; object-fit: cover;" onerror="this.style.display='none'; this.parentElement.innerHTML='${user.name?.charAt(0)?.toUpperCase() || '?'}';" />` :
                            user.name?.charAt(0)?.toUpperCase() || '?'
                        }
                    </div>
                    <div>
                        <div style="font-weight: 600; color: ${textPrimary}; font-size: 16px;">
                            ${user.name || 'Unknown User'}
                        </div>
                        <div style="color: ${textSecondary}; font-size: 12px;">
                            ${user.designation || 'No designation'}
                        </div>
                    </div>
                </div>
                <div style="
                    display: inline-block;
                    padding: 4px 8px;
                    background: ${alpha(statusColor, 0.1)};
                    color: ${statusColor};
                    border-radius: 6px;
                    font-size: 12px;
                    font-weight: 600;
                    margin-bottom: 12px;
                    border: 1px solid ${alpha(statusColor, 0.2)};
                ">
                    ${user.punchout_time ? '✓ Completed' : '⏱ Active'}
                </div>
                <div style="space-y: 8px;">
                    <div style="display: flex; align-items: center; margin-bottom: 8px;">
                        <span style="color: var(--theme-success, #10b981); margin-right: 8px;">📍</span>
                        <span style="color: ${textSecondary}; font-size: 13px;">
                            Check In: ${formatTime(user.punchin_time)}
                        </span>
                    </div>
                    <div style="display: flex; align-items: center;">
                        <span style="color: var(--theme-danger, #ef4444); margin-right: 8px;">📍</span>
                        <span style="color: ${textSecondary}; font-size: 13px;">
                            Check Out: ${formatTime(user.punchout_time)}
                        </span>
                    </div>
                </div>
            </div>
        `;
    }, [formatTime]);

    useEffect(() => {
        if (!map || !users.length) return;

        // Clear existing markers
        map.eachLayer((layer) => {
            if (layer instanceof L.Marker && layer.options.userData) {
                map.removeLayer(layer);
            }
        });

        const processedPositions = [];

        users.forEach((user, index) => {
            const location = parseLocation(user.punchout_location || user.punchin_location);
            
            if (!location) return;

            // Check for overlapping positions and adjust
            let adjustedPosition = { ...location };
            let attempts = 0;
            const maxAttempts = 10;

            while (attempts < maxAttempts) {
                const isOverlapping = processedPositions.some(pos => 
                    arePositionsClose(adjustedPosition, pos)
                );

                if (!isOverlapping) break;

                adjustedPosition = getAdjustedPosition(location, attempts + 1);
                attempts++;
            }

            processedPositions.push(adjustedPosition);

            const marker = L.marker([adjustedPosition.lat, adjustedPosition.lng], {
                icon: createUserIcon(user),
                userData: true // Mark as user marker for cleanup
            });

            marker.bindPopup(createPopupContent(user), {
                maxWidth: MAP_CONFIG.POPUP_MAX_WIDTH,
                className: 'custom-popup'
            });

            marker.addTo(map);
        });

    }, [map, users, theme, parseLocation, arePositionsClose, getAdjustedPosition, createUserIcon, createPopupContent]);

    return null;
});

UserMarkers.displayName = 'UserMarkers';

// Memoized user stats calculation
const useUserStats = (users) => {
    return useMemo(() => {
        const userGroups = users.reduce((acc, location) => {
            const userId = location.user_id;
            if (!acc[userId]) acc[userId] = [];
            acc[userId].push(location);
            return acc;
        }, {});

        const uniqueUsers = Object.keys(userGroups);
        const total = uniqueUsers.length;
        let checkedIn = 0;
        let completed = 0;

        uniqueUsers.forEach(userId => {
            const userLocations = userGroups[userId];
            userLocations.sort((a, b) => {
                if (!a.punchin_time) return 1;
                if (!b.punchin_time) return -1;
                return a.punchin_time.localeCompare(b.punchin_time);
            });

            const lastLocation = userLocations[userLocations.length - 1];
            const hasPunchIn = userLocations.some(loc => loc.punchin_time);
            
            if (hasPunchIn) {
                if (lastLocation.punchout_time) {
                    completed++;
                } else {
                    checkedIn++;
                }
            }
        });

        return { checkedIn, completed, total };
    }, [users]);
};

// Main Component
const UserLocationsCard = React.memo(({ updateMap, selectedDate }) => {
    const { themeSettings } = useTheme();
    
    const isLargeScreen = useMediaQuery('(min-width: 1025px)');
    const isMediumScreen = useMediaQuery('(min-width: 641px) and (max-width: 1024px)');
    
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [loadingInitialized, setLoadingInitialized] = useState(false);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [isPolling, setIsPolling] = useState(true);
    const [mapKey, setMapKey] = useState(0);
    const isMobile = window.innerWidth < 640;
    const isTablet = window.innerWidth < 768;
    const [lastChecked, setLastChecked] = useState(new Date());
    const prevUsersRef = useRef([]);
    const prevUpdateRef = useRef(null);
    const handleRefresh = useCallback(async () => {
        setLoading(true);
        try {
            const endpoint = route('getUserLocationsForDate', { 
                date: selectedDate,
                _t: Date.now()
            });
            if (!selectedDate) {
                setUsers([]);
                prevUsersRef.current = [];
                setMapKey(prev => prev + 1);
                setLastChecked(new Date());
                setLastUpdate(new Date());
                return;
            }
            const response = await fetch(endpoint);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: Failed to refresh user locations`);
            }
            const data = await response.json();
            const locations = Array.isArray(data.locations) ? data.locations : [];
            setUsers(locations);
            prevUsersRef.current = locations;
            setMapKey(prev => prev + 1);
            setLastChecked(new Date());
            setLastUpdate(new Date());
        } catch (error) {
            console.error('Error refreshing map:', error);
            setUsers([]);
            prevUsersRef.current = [];
        } finally {
            setLoading(false);
        }
    }, [selectedDate]);
    
    // Memoize the formatted date to prevent unnecessary recalculations
    const formattedDate = useMemo(() => {
        if (!selectedDate) return 'Invalid Date';
        try {
            return new Date(selectedDate).toLocaleString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            return 'Invalid Date';
        }
    }, [selectedDate]);
    
    // Use the memoized user stats
    const userStats = useUserStats(users);

    // Function to check for updates
    const checkForUpdates = useCallback(async () => {
        if (!selectedDate) {
            setLoading(false);
            return;
        }

        try {
            const endpoint = route('check-user-locations-updates', { 
                date: selectedDate.split('T')[0] // Ensure YYYY-MM-DD format
            });
            
            const response = await fetch(endpoint);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: Failed to check for updates`);
            }

            const data = await response.json();
            
            // Only update if we have a new update timestamp
            if (data.success && data.last_updated !== prevUpdateRef.current) {
                if (data.last_updated) {
                    prevUpdateRef.current = data.last_updated;
                    handleRefresh();
                    setLastUpdate(new Date());
                }
            }
            
            setLastChecked(new Date());
        } catch (error) {
            console.error('Error checking for updates:', error);
            setLoading(false); // Ensure loading is set to false in case of error
        }
    }, [selectedDate, handleRefresh]);

    // Set up polling for updates
    useEffect(() => {
        if (!isPolling) return;

        // Initial check
        checkForUpdates();
        
        // Set up interval for polling (every 5 seconds)
        const intervalId = setInterval(checkForUpdates, 5000);

        // Clean up on unmount or when dependencies change
        return () => clearInterval(intervalId);
    }, [isPolling, checkForUpdates]);

    // Automatically set loading to false when no users are available
    useEffect(() => {
        if (users.length === 0 && loading && loadingInitialized) {
            setLoading(false);
        }
    }, [users, loading, loadingInitialized]);

    // Failsafe to ensure loading stops after a certain time
    useEffect(() => {
        // If loading is true for more than 10 seconds, force it to false
        if (loading) {
            const timeoutId = setTimeout(() => {
                if (loading) {
                    console.log('Loading timeout reached, forcing loading to false');
                    setLoading(false);
                }
            }, 10000); // 10 seconds timeout
            
            return () => clearTimeout(timeoutId);
        }
    }, [loading]);

    // Format the last checked time for display
    const lastCheckedText = useMemo(() => {
        if (!lastChecked) return null;
        return lastChecked.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
    }, [lastChecked]);

    const handleUsersLoad = useCallback((loadedUsers) => {
        // Make sure loadedUsers is an array
        const usersArray = Array.isArray(loadedUsers) ? loadedUsers : [];
        
        // Only update if users have actually changed
        const usersChanged = JSON.stringify(usersArray) !== JSON.stringify(prevUsersRef.current);
        if (usersChanged) {
            setUsers(usersArray);
            prevUsersRef.current = usersArray;
        }
        
        // Mark that loading has been initialized and set loading to false
        setLoadingInitialized(true);
        setLoading(false);
    }, []);

   

    return (
        <div className="flex justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
                className="w-full max-w-full"
            >
                <Card 
                    className="w-full transition-all duration-200"
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
                                            <MapIcon 
                                                className={`
                                                    ${isLargeScreen ? 'w-8 h-8' : isMediumScreen ? 'w-6 h-6' : 'w-5 h-5'}
                                                `}
                                                style={{ color: 'var(--theme-primary)' }}
                                            />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h4 
                                                className={`
                                                    ${isLargeScreen ? 'text-2xl' : isMediumScreen ? 'text-xl' : 'text-lg'}
                                                    font-bold text-foreground
                                                    ${!isLargeScreen ? 'truncate' : ''}
                                                `}
                                                style={{
                                                    fontFamily: `var(--fontFamily, "Inter")`,
                                                }}
                                            >
                                                Team Locations
                                            </h4>
                                            <p 
                                                className={`
                                                    ${isLargeScreen ? 'text-sm' : 'text-xs'} 
                                                    text-default-500
                                                    ${!isLargeScreen ? 'truncate' : ''}
                                                `}
                                                style={{
                                                    fontFamily: `var(--fontFamily, "Inter")`,
                                                }}
                                            >
                                                {formattedDate}
                                            </p>
                                        </div>
                                    </div>
                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-4">
                                        {lastCheckedText && (
                                            <span 
                                                className="text-xs text-default-500"
                                                style={{
                                                    fontFamily: `var(--fontFamily, "Inter")`,
                                                }}
                                            >
                                                Updated: {lastCheckedText}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <Divider 
                        style={{
                            borderColor: `var(--theme-divider, #E4E4E7)`,
                        }}
                    />
                    <CardBody 
                        className="p-0"
                        style={{
                            fontFamily: `var(--fontFamily, "Inter")`,
                        }}
                    >
                        {/* Stats Cards */}
                        <div className="p-6">
                            <StatsCards
                                className="mb-6"
                                stats={[
                                    {
                                        title: 'Total',
                                        value: userStats.total,
                                        icon: <Users className="w-5 h-5" />,
                                        color: 'text-primary',
                                        description: 'Total users tracked',
                                        iconBg: 'bg-primary/20',
                                        valueColor: 'text-primary',
                                        customStyle: {
                                            color: 'var(--theme-primary)',
                                        }
                                    },
                                    {
                                        title: 'Active',
                                        value: userStats.checkedIn,
                                        icon: <Clock4 className="w-5 h-5" />,
                                        color: 'text-warning',
                                        description: 'Currently working',
                                        iconBg: 'bg-warning/20',
                                        valueColor: 'text-warning',
                                        customStyle: {
                                            color: 'var(--theme-warning)',
                                        }
                                    },
                                    {
                                        title: 'Completed',
                                        value: userStats.completed,
                                        icon: <Place className="w-5 h-5" />,
                                        color: 'text-success',
                                        description: 'Finished workday',
                                        iconBg: 'bg-success/20',
                                        valueColor: 'text-success',
                                        customStyle: {
                                            color: 'var(--theme-success)',
                                        }
                                    }
                                ]}
                                compact={isMobile}
                            />
                        </div>
                        <div className="p-6 pt-0">
                            {users.length > 0 ? (
                                <div 
                                    className="relative h-[70vh] rounded-2xl overflow-hidden border-2 shadow-2xl"
                                    style={{
                                        borderColor: `color-mix(in srgb, var(--theme-primary) 10%, transparent)`,
                                        borderRadius: `var(--borderRadius, 12px)`,
                                        fontFamily: `var(--fontFamily, "Inter")`
                                    }}
                                >
                                    {loading && (
                                        <div 
                                            className="absolute inset-0 flex items-center justify-center backdrop-blur-xl z-50"
                                            style={{
                                                background: `color-mix(in srgb, var(--theme-content1) 80%, transparent)`,
                                                fontFamily: `var(--fontFamily, "Inter")`
                                            }}
                                        >
                                            <div className="text-center">
                                                <Spinner size="lg" color="primary" />
                                                <p 
                                                    className="mt-4 text-default-500"
                                                    style={{
                                                        fontFamily: `var(--fontFamily, "Inter")`
                                                    }}
                                                >
                                                    Loading locations...
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    <MapContainer
                                        key={`${updateMap}-${mapKey}`}
                                        center={[PROJECT_LOCATIONS.primary.lat, PROJECT_LOCATIONS.primary.lng]}
                                        zoom={MAP_CONFIG.DEFAULT_ZOOM}
                                        minZoom={MAP_CONFIG.MIN_ZOOM}
                                        maxZoom={MAP_CONFIG.MAX_ZOOM}
                                        style={{ height: '100%', width: '100%' }}
                                        scrollWheelZoom={true}
                                        doubleClickZoom={true}
                                        dragging={true}
                                        touchZoom={true}
                                        fullscreenControl={true}
                                        attributionControl={false}
                                        zoomControl={false}
                                    >
                                        <TileLayer
                                            url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
                                            maxZoom={MAP_CONFIG.MAX_ZOOM}
                                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                        />
                                        <RoutingMachine 
                                            startLocation={PROJECT_LOCATIONS.route.start} 
                                            endLocation={PROJECT_LOCATIONS.route.end}
                                            theme={themeSettings}
                                        />
                                        <UserMarkers 
                                            users={users}
                                            setUsers={setUsers}
                                            setLoading={setLoading}
                                            setError={setError}
                                            lastUpdate={lastUpdate}
                                            selectedDate={selectedDate}
                                            onUsersLoad={handleUsersLoad}
                                            theme={themeSettings}
                                        />
                                    </MapContainer>
                                </div>
                            ) : loading ? (
                                <div 
                                    className="h-[70vh] rounded-2xl flex items-center justify-center border-2 shadow-2xl backdrop-blur-xl"
                                    style={{
                                        borderColor: `color-mix(in srgb, var(--theme-primary) 10%, transparent)`,
                                        background: `color-mix(in srgb, var(--theme-content1) 80%, transparent)`,
                                        borderRadius: `var(--borderRadius, 12px)`,
                                        fontFamily: `var(--fontFamily, "Inter")`
                                    }}
                                >
                                    <div className="text-center">
                                        <Spinner size="lg" color="primary" />
                                        <p 
                                            className="mt-4 text-default-500"
                                            style={{
                                                fontFamily: `var(--fontFamily, "Inter")`
                                            }}
                                        >
                                            Loading locations...
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div 
                                    className="h-[70vh] rounded-2xl flex flex-col items-center justify-center backdrop-blur-xl border-2 shadow-2xl p-12"
                                    style={{
                                        background: `color-mix(in srgb, var(--theme-content1) 80%, transparent)`,
                                        borderColor: `color-mix(in srgb, var(--theme-primary) 10%, transparent)`,
                                        borderRadius: `var(--borderRadius, 12px)`,
                                        fontFamily: `var(--fontFamily, "Inter")`
                                    }}
                                >
                                    <MapIcon className="w-16 h-16 text-default-300 mb-6" />
                                    <h3 
                                        className="text-xl font-semibold mb-4"
                                        style={{
                                            fontFamily: `var(--fontFamily, "Inter")`
                                        }}
                                    >
                                        No Location Data Available
                                    </h3>
                                    <p 
                                        className="text-default-500 mb-6 max-w-md text-center"
                                        style={{
                                            fontFamily: `var(--fontFamily, "Inter")`
                                        }}
                                    >
                                        No team location data found for {formattedDate}. 
                                        {selectedDate && new Date(selectedDate) > new Date() ? 
                                            " This date is in the future." : 
                                            " Try selecting a different date or refreshing the data."}
                                    </p>
                                    <Button 
                                        variant="bordered"
                                        color="primary"
                                        size="md"
                                        radius={getThemeRadius()}
                                        onPress={handleRefresh}
                                        startContent={<RefreshCw className="w-4 h-4" />}
                                        style={{
                                            fontFamily: `var(--fontFamily, "Inter")`
                                        }}
                                    >
                                        Refresh Data
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardBody>
                </Card>
            </motion.div>
        </div>
    );
});

export default UserLocationsCard;