import React, { useState, useEffect } from 'react';
import { Avatar } from "@heroui/react";

/**
 * Enhanced ProfileAvatar component for ERP system
 * Provides robust image loading with intelligent fallbacks using HeroUI's built-in mechanisms
 * 
 * Features:
 * - Automatic fallback to user initials when image fails to load
 * - Consistent color generation based on user name
 * - Loading states and error handling
 * - Accessibility compliance
 * - Enterprise-grade reliability
 */
const ProfileAvatar = ({ 
  src, 
  name, 
  size = "md", 
  className = "", 
  onClick,
  showBorder = false,
  isDisabled = false,
  ...props 
}) => {
  const [imageError, setImageError] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  /**
   * Generate user initials from full name
   * Handles various name formats common in enterprise environments
   * @param {string} fullName - User's full name
   * @returns {string} User initials (1-2 characters)
   */
  const generateInitials = (fullName) => {
    if (!fullName || typeof fullName !== 'string') return '?';
    
    // Clean and split the name
    const nameParts = fullName
      .trim()
      .replace(/[^a-zA-Z\s]/g, '') // Remove special characters
      .split(/\s+/)
      .filter(part => part.length > 0);
    
    if (nameParts.length === 0) return '?';
    
    if (nameParts.length === 1) {
      // Single name: take first two characters or just first if name is short
      return nameParts[0].substring(0, 2).toUpperCase();
    }
    
    // Multiple names: first letter of first name + first letter of last name
    const firstInitial = nameParts[0].charAt(0).toUpperCase();
    const lastInitial = nameParts[nameParts.length - 1].charAt(0).toUpperCase();
    
    return firstInitial + lastInitial;
  };

  /**
   * Generate consistent background color based on user name
   * Uses a deterministic algorithm to ensure same name always gets same color
   * @param {string} fullName - User's full name
   * @returns {string} CSS color class or inline style
   */
  const generateAvatarColor = (fullName) => {
    if (!fullName) return 'bg-gray-500';
    
    // Create hash from name
    let hash = 0;
    for (let i = 0; i < fullName.length; i++) {
      hash = fullName.charCodeAt(i) + ((hash << 5) - hash);
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Professional color palette suitable for enterprise applications
    const colorClasses = [
      'bg-blue-500',      // Professional blue
      'bg-green-500',     // Success green
      'bg-purple-500',    // Creative purple
      'bg-orange-500',    // Energetic orange
      'bg-teal-500',      // Calm teal
      'bg-indigo-500',    // Deep indigo
      'bg-pink-500',      // Friendly pink
      'bg-emerald-500',   // Fresh emerald
      'bg-amber-500',     // Warm amber
      'bg-cyan-500',      // Cool cyan
      'bg-violet-500',    // Rich violet
      'bg-rose-500',      // Soft rose
    ];
    
    return colorClasses[Math.abs(hash) % colorClasses.length];
  };

  /**
   * Validate image URL asynchronously
   * Prevents broken image displays in production
   */
  useEffect(() => {
    if (!src || typeof src !== 'string' || !src.trim()) {
      setImageError(true);
      setIsValidating(false);
      return;
    }

    setIsValidating(true);
    setImageError(false);

    // Create image element to test loading
    const testImage = new Image();
    
    const handleLoad = () => {
      setImageError(false);
      setIsValidating(false);
    };
    
    const handleError = () => {
      setImageError(true);
      setIsValidating(false);
      console.warn(`ProfileAvatar: Failed to load image for ${name || 'user'}: ${src}`);
    };

    testImage.addEventListener('load', handleLoad);
    testImage.addEventListener('error', handleError);
    
    // Start loading
    testImage.src = src;

    // Cleanup
    return () => {
      testImage.removeEventListener('load', handleLoad);
      testImage.removeEventListener('error', handleError);
    };
  }, [src, name]);

  // Generate fallback content
  const initials = generateInitials(name);
  const colorClass = generateAvatarColor(name);
  
  // Determine final src - use original src only if validation passed
  const finalSrc = (src && !imageError && !isValidating) ? src : undefined;
  
  // Build className for the avatar
  const avatarClassName = [
    'transition-all duration-200 ease-in-out',
    onClick && !isDisabled ? 'cursor-pointer hover:scale-105 hover:shadow-lg' : '',
    showBorder ? 'ring-2 ring-white ring-offset-2' : '',
    isDisabled ? 'opacity-50 cursor-not-allowed' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <Avatar
      src={finalSrc}
      name={initials} // HeroUI will use this as fallback text
      size={size}
      className={avatarClassName}
      classNames={{
        base: "shrink-0",
        img: "object-cover",
        name: `${colorClass} text-white font-semibold text-sm select-none`,
        fallback: `${colorClass} text-white font-semibold`
      }}
      onClick={!isDisabled ? onClick : undefined}
      showFallback={true} // Ensure fallback is always available
      aria-label={name ? `${name}'s profile picture` : 'User profile picture'}
      role={onClick ? 'button' : 'img'}
      tabIndex={onClick && !isDisabled ? 0 : -1}
      {...props}
    />
  );
};

export default ProfileAvatar;