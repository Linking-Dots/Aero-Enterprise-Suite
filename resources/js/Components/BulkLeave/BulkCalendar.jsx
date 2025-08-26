import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { 
    Card, 
    CardBody, 
    CardHeader, 
    Button, 
    Chip, 
    Spinner
} from '@heroui/react';
import { 
    ChevronLeftIcon, 
    ChevronRightIcon,
    CalendarDaysIcon 
} from '@heroicons/react/24/outline';

import GlassCard from '@/Components/GlassCard';
import { Calendar } from 'lucide-react';
import axios from 'axios';

const BulkCalendar = ({ 
    selectedDates = [], 
    onDatesChange, 
    existingLeaves = [],
    publicHolidays = [],
    minDate = null,
    maxDate = null,
    userId = null,
    fetchFromAPI = false // Flag to determine if we should fetch data from API
}) => {

    const [currentDate, setCurrentDate] = useState(new Date());
    const [apiCalendarData, setApiCalendarData] = useState({
        existingLeaves: existingLeaves,
        publicHolidays: publicHolidays
    });
    const [loading, setLoading] = useState(false);
    const [loadedYear, setLoadedYear] = useState(null); // Track which year's data is loaded

    // Fetch calendar data from API if enabled - optimized to load once per year
    const fetchCalendarData = useCallback(async (year) => {
        if (!fetchFromAPI || !userId) return;
        
        // Don't fetch if we already have data for this year
        if (loadedYear === year) return;
        
        setLoading(true);
        try {
            const response = await axios.get(route('leaves.bulk.calendar-data'), {
                params: {
                    user_id: userId,
                    year: year
                    // Removed month parameter to get full year data
                }
            });

            if (response.data.success) {
                setApiCalendarData({
                    existingLeaves: response.data.data.existingLeaves || [],
                    publicHolidays: response.data.data.publicHolidays || []
                });
                setLoadedYear(year); // Mark this year as loaded
            }
        } catch (error) {
            console.error('Failed to fetch calendar data:', error);
            // Keep existing data on error
        } finally {
            setLoading(false);
        }
    }, [fetchFromAPI, userId, loadedYear]);

    // Fetch data when component mounts or year changes
    useEffect(() => {
        const currentYear = currentDate.getFullYear();
        fetchCalendarData(currentYear);
    }, [fetchCalendarData, currentDate.getFullYear()]); // Only depend on year, not full date

    // Reset loaded year when user changes
    useEffect(() => {
        if (fetchFromAPI && userId) {
            setLoadedYear(null); // Reset to force reload for new user
        }
    }, [userId, fetchFromAPI]);

    // Use either API data or props data
    const finalExistingLeaves = fetchFromAPI ? apiCalendarData.existingLeaves : existingLeaves;
    const finalPublicHolidays = fetchFromAPI ? apiCalendarData.publicHolidays : publicHolidays;

   

    // Get calendar days data for the current month
    const calendarDays = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        const daysInMonth = lastDayOfMonth.getDate();
        const firstDayWeekday = firstDayOfMonth.getDay();
        
        // Previous month padding
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        const prevMonthDays = [];
        for (let i = firstDayWeekday - 1; i >= 0; i--) {
            prevMonthDays.push({
                date: prevMonthLastDay - i,
                isCurrentMonth: false,
                fullDate: new Date(year, month - 1, prevMonthLastDay - i)
            });
        }
        
        // Current month days
        const currentMonthDays = [];
        for (let day = 1; day <= daysInMonth; day++) {
            currentMonthDays.push({
                date: day,
                isCurrentMonth: true,
                fullDate: new Date(year, month, day)
            });
        }
        
        // Next month padding
        const totalCells = prevMonthDays.length + currentMonthDays.length;
        const remainingCells = 42 - totalCells; // 6 weeks * 7 days
        const nextMonthDays = [];
        for (let day = 1; day <= remainingCells; day++) {
            nextMonthDays.push({
                date: day,
                isCurrentMonth: false,
                fullDate: new Date(year, month + 1, day)
            });
        }
        
        return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
    }, [currentDate]);

    // Navigation handlers
    const goToPreviousMonth = useCallback(() => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    }, []);

    const goToNextMonth = useCallback(() => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    }, []);

    const goToToday = useCallback(() => {
        setCurrentDate(new Date());
    }, []);

    // Date selection handler - disabled during loading, holidays, and existing leaves
    const handleDateClick = useCallback((dayData) => {
        if (!dayData.isCurrentMonth || loading) return; // Block interaction during loading
        
        // Use consistent date formatting to avoid timezone issues
        const dateString = dayData.fullDate.getFullYear() + '-' + 
                          String(dayData.fullDate.getMonth() + 1).padStart(2, '0') + '-' + 
                          String(dayData.fullDate.getDate()).padStart(2, '0');
        
        // Check for holidays and existing leaves first
        const hasExistingLeave = finalExistingLeaves.some(leave => {
            if (!leave.from_date || !leave.to_date) return false;
            const fromDate = leave.from_date.split('T')[0];
            const toDate = leave.to_date.split('T')[0];
            return dateString >= fromDate && dateString <= toDate;
        });
        
        const isPublicHoliday = finalPublicHolidays.includes(dateString);
        
        // Prevent selection of holidays and existing leaves
        if (hasExistingLeave || isPublicHoliday) return;
        
        // Check if date is selectable
        if (minDate && dayData.fullDate < new Date(minDate)) return;
        if (maxDate && dayData.fullDate > new Date(maxDate)) return;
        // Allow past dates for bulk leave requests (removed restriction)
        
        // Toggle selection
        const isSelected = selectedDates.includes(dateString);
        let newSelectedDates;
        
        if (isSelected) {
            newSelectedDates = selectedDates.filter(date => date !== dateString);
        } else {
            newSelectedDates = [...selectedDates, dateString];
        }
        
        onDatesChange(newSelectedDates.sort());
    }, [selectedDates, onDatesChange, minDate, maxDate, loading, finalExistingLeaves, finalPublicHolidays]);

    // Get date status
    const getDateStatus = useCallback((dayData) => {
        if (!dayData.isCurrentMonth) return { selectable: false };
        
        // Use consistent date formatting (YYYY-MM-DD) and avoid timezone issues
        const dateString = dayData.fullDate.getFullYear() + '-' + 
                          String(dayData.fullDate.getMonth() + 1).padStart(2, '0') + '-' + 
                          String(dayData.fullDate.getDate()).padStart(2, '0');
        
        const isSelected = selectedDates.includes(dateString);
        const isToday = dayData.fullDate.toDateString() === new Date().toDateString();
        const isPast = dayData.fullDate < new Date().setHours(0, 0, 0, 0);
        const isWeekend = dayData.fullDate.getDay() === 0 || dayData.fullDate.getDay() === 6;
        
        // Check for existing leave - improved detection with better date comparison
        const hasExistingLeave = finalExistingLeaves.some(leave => {
            if (!leave.from_date || !leave.to_date) return false;
            
            // Normalize dates to YYYY-MM-DD format and handle timezone properly
            const fromDate = leave.from_date.split('T')[0]; // Get just the date part
            const toDate = leave.to_date.split('T')[0]; // Get just the date part
            
            // Debug log for existing leaves (only when debugging specific issues)
            // console.log(`Checking existing leave for ${dateString}: from ${fromDate} to ${toDate}, match: ${dateString >= fromDate && dateString <= toDate}`);
            
            return dateString >= fromDate && dateString <= toDate;
        });
        
        // Check for public holiday - direct string comparison
        const isPublicHoliday = finalPublicHolidays.includes(dateString);
        
        // Debug log for holiday detection (only when debugging specific issues)
        // console.log(`${dateString}: isPublicHoliday=${isPublicHoliday}, finalPublicHolidays includes check:`, finalPublicHolidays.includes(dateString));
        
        // Allow selection of past dates for bulk leave (removed isPast restriction)
        // Disable selectability during loading, for holidays, and existing leaves
        const selectable = !loading && 
                          !hasExistingLeave && 
                          !isPublicHoliday &&
                          (!minDate || dayData.fullDate >= new Date(minDate)) &&
                          (!maxDate || dayData.fullDate <= new Date(maxDate));
        
        return {
            isSelected,
            isToday,
            isPast,
            isWeekend,
            hasExistingLeave,
            isPublicHoliday,
            selectable
        };
    }, [selectedDates, finalExistingLeaves, finalPublicHolidays, minDate, maxDate, loading]);

    // Get date cell classes - simplified since we're using Tailwind classes directly
    const getDateCellClasses = useCallback((dayData, status) => {
        // This function is kept for compatibility but classes are now applied directly in JSX
        return {};
    }, [theme, loading]);

    const monthYear = currentDate.toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
    });

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <GlassCard className="w-full">
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-semibold">
                            {monthYear}
                        </h3>
                        {fetchFromAPI && loadedYear && (
                            <Chip 
                                size="sm" 
                                variant="bordered" 
                                color="primary" 
                                className="ml-2 text-xs"
                            >
                                Data: {loadedYear}
                            </Chip>
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onClick={goToPreviousMonth}
                            isDisabled={loading}
                        >
                            <ChevronLeftIcon className="w-4 h-4" />
                        </Button>
                        <Button
                            size="sm"
                            variant="light"
                            onClick={goToToday}
                            isDisabled={loading}
                            className="px-3 py-1 text-xs"
                        >
                            Today
                        </Button>
                        <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onClick={goToNextMonth}
                            isDisabled={loading}
                        >
                            <ChevronRightIcon className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardBody className="pt-0">
                {loading && (
                    <div className="flex justify-center items-center py-6 bg-default-100 rounded-lg mb-6">
                        <Spinner size="sm" />
                        <span className="ml-2 text-sm text-default-600">
                            Loading calendar data for {currentDate.getFullYear()}...
                        </span>
                    </div>
                )}
                
                {/* Legend */}
                <div className="flex flex-wrap gap-2 mb-6">
                    <Chip 
                        size="sm" 
                        color="primary" 
                        variant="solid"
                        className="font-medium"
                    >
                        Selected
                    </Chip>
                    <Chip 
                        size="sm" 
                        color="danger" 
                        variant="solid"
                    >
                        Existing Leave
                    </Chip>
                    <Chip 
                        size="sm" 
                        color="warning" 
                        variant="solid"
                    >
                        Holiday
                    </Chip>
                    <Chip 
                        size="sm" 
                        color="secondary" 
                        variant="solid"
                        className="font-medium"
                    >
                        Today
                    </Chip>
                    <Chip 
                        size="sm" 
                        color="default" 
                        variant="bordered"
                    >
                        Weekend
                    </Chip>
                </div>
                
                {/* Week days header */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                    {weekDays.map(day => (
                        <div 
                            key={day} 
                            className="text-center py-2 text-sm font-medium text-default-600"
                        >
                            {day}
                        </div>
                    ))}
                </div>
                
                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((dayData, index) => {
                        const status = getDateStatus(dayData);
                        const cellStyles = getDateCellClasses(dayData, status);
                        
                        return (
                            <div
                                key={index}
                                onClick={() => handleDateClick(dayData)}
                                className={`
                                    relative flex items-center justify-center w-10 h-10 min-h-10
                                    rounded-lg transition-all duration-200 text-sm select-none
                                    ${status.selectable ? 'cursor-pointer' : 'cursor-not-allowed'}
                                    ${!dayData.isCurrentMonth ? 'opacity-30 text-default-400' : ''}
                                    ${loading ? 'opacity-50 pointer-events-none bg-default-100' : ''}
                                    ${status.isSelected ? 'bg-primary text-primary-foreground font-bold border-2 border-primary-600 shadow-lg scale-105 z-10' : ''}
                                    ${status.hasExistingLeave && !status.isSelected ? 'bg-danger text-danger-foreground border-2 border-danger-600 font-medium cursor-not-allowed' : ''}
                                    ${status.isPublicHoliday && !status.isSelected && !status.hasExistingLeave ? 'bg-warning text-warning-foreground border-2 border-warning-600 font-medium cursor-not-allowed' : ''}
                                    ${status.isToday && !status.isSelected && !status.hasExistingLeave && !status.isPublicHoliday ? 'bg-secondary-200 text-secondary-800 font-semibold border-2 border-secondary-500 shadow-md' : ''}
                                    ${status.isWeekend && !status.isSelected && !status.hasExistingLeave && !status.isPublicHoliday && !status.isToday ? 'text-default-500 bg-default-50 border border-default-200 opacity-70' : ''}
                                    ${!status.selectable && !status.hasExistingLeave && !status.isPublicHoliday && !status.isToday && !status.isWeekend ? 'text-default-400 cursor-not-allowed bg-default-100 opacity-60' : ''}
                                    ${status.selectable && !status.isSelected && !status.hasExistingLeave && !status.isPublicHoliday && !status.isToday && !status.isWeekend ? 'text-default-900 border border-transparent hover:bg-primary-50 hover:text-primary hover:border-primary-200 hover:scale-105' : ''}
                                `}
                                role="button"
                                tabIndex={status.selectable ? 0 : -1}
                                title={status.hasExistingLeave ? 'Existing leave - cannot select' : 
                                       status.isPublicHoliday ? 'Public holiday - cannot select' : 
                                       !status.selectable ? 'Not selectable' : ''}
                                aria-label={`${dayData.fullDate.toDateString()}${status.isSelected ? ' (selected)' : ''}${status.hasExistingLeave ? ' (existing leave)' : ''}${status.isPublicHoliday ? ' (public holiday)' : ''}`}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        handleDateClick(dayData);
                                    }
                                }}
                            >
                                {dayData.date}
                                
                                {/* Weekend indicator */}
                                {status.isWeekend && !status.isSelected && !status.hasExistingLeave && !status.isPublicHoliday && (
                                    <div className="absolute top-1 right-1 w-1 h-1 rounded-full bg-default-500 opacity-50" />
                                )}
                            </div>
                        );
                    })}
                </div>
                
                {/* Selection summary */}
                {selectedDates.length > 0 && (
                    <div className="mt-6 p-4 rounded-lg bg-gradient-to-br from-primary-50 to-primary-100 border border-primary-200 relative overflow-hidden">
                        <div className="relative z-10">
                            <p className="text-sm font-semibold text-primary-700 mb-2">
                                📅 {selectedDates.length} date{selectedDates.length !== 1 ? 's' : ''} selected
                            </p>
                            <div className="flex flex-wrap gap-1">
                                {selectedDates.slice(0, 12).map(date => (
                                    <Chip 
                                        key={date} 
                                        size="sm" 
                                        color="primary"
                                        variant="solid"
                                        className="font-medium text-xs"
                                    >
                                        {new Date(date).toLocaleDateString('en-US', { 
                                            month: 'short', 
                                            day: 'numeric' 
                                        })}
                                    </Chip>
                                ))}
                                {selectedDates.length > 12 && (
                                    <Chip 
                                        size="sm" 
                                        color="primary"
                                        variant="bordered"
                                        className="font-medium"
                                    >
                                        +{selectedDates.length - 12} more
                                    </Chip>
                                )}
                            </div>
                        </div>
                        
                        {/* Background decoration */}
                        <div className="absolute -top-2 -right-2 w-15 h-15 rounded-full bg-primary-200 opacity-30" />
                    </div>
                )}
            </CardBody>
        </GlassCard>
    );
};

export default BulkCalendar;
