import { useState, useEffect } from 'react';

/**
 * Custom hook to replace MUI's useMediaQuery
 * Provides responsive breakpoint detection using Tailwind breakpoints
 */
export const useMediaQuery = (query) => {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        // Convert common breakpoint queries to standard media queries
        const mediaQuery = query.includes('down') 
            ? convertMUIBreakpoint(query)
            : query;

        const mediaQueryList = window.matchMedia(mediaQuery);
        const updateMatches = () => setMatches(mediaQueryList.matches);

        // Set initial value
        updateMatches();

        // Listen for changes
        mediaQueryList.addEventListener('change', updateMatches);

        return () => {
            mediaQueryList.removeEventListener('change', updateMatches);
        };
    }, [query]);

    return matches;
};

/**
 * Convert MUI-style breakpoint queries to standard media queries
 */
const convertMUIBreakpoint = (query) => {
    const breakpoints = {
        'xs': '480px',
        'sm': '640px', 
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px'
    };

    // Handle down queries (theme.breakpoints.down('md'))
    if (query.includes('down')) {
        const breakpoint = query.match(/down\('(\w+)'\)/)?.[1];
        if (breakpoint && breakpoints[breakpoint]) {
            return `(max-width: ${breakpoints[breakpoint]})`;
        }
    }

    // Handle up queries  
    if (query.includes('up')) {
        const breakpoint = query.match(/up\('(\w+)'\)/)?.[1];
        if (breakpoint && breakpoints[breakpoint]) {
            return `(min-width: ${breakpoints[breakpoint]})`;
        }
    }

    // Return the query as-is if it's already a valid media query
    return query;
};

export default useMediaQuery;
