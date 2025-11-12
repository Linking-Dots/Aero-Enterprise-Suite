/**
 * Device Identification Service
 * Generates stable device identifiers for single-device login enforcement
 */

import { v4 as uuidv4 } from 'uuid';
import Cookies from 'js-cookie';

const DEVICE_GUID_COOKIE = 'device_guid';
const DEVICE_GUID_STORAGE = 'aero_device_guid';
const FCM_TOKEN_STORAGE = 'aero_fcm_token';

/**
 * Get or generate a persistent device GUID
 * This GUID survives browser sessions and is the most reliable web-based identifier
 */
export function getDeviceGuid(): string {
    // Try to get from cookie first
    let deviceGuid = Cookies.get(DEVICE_GUID_COOKIE);
    
    // Try localStorage as backup
    if (!deviceGuid) {
        deviceGuid = localStorage.getItem(DEVICE_GUID_STORAGE);
    }
    
    // Generate new GUID if none exists
    if (!deviceGuid) {
        deviceGuid = uuidv4();
        
        // Store in both cookie and localStorage for redundancy
        Cookies.set(DEVICE_GUID_COOKIE, deviceGuid, {
            expires: 365 * 10, // 10 years
            secure: true,
            sameSite: 'strict'
        });
        
        localStorage.setItem(DEVICE_GUID_STORAGE, deviceGuid);
    }
    
    // Ensure it's in both places
    if (!Cookies.get(DEVICE_GUID_COOKIE)) {
        Cookies.set(DEVICE_GUID_COOKIE, deviceGuid, {
            expires: 365 * 10,
            secure: true,
            sameSite: 'strict'
        });
    }
    
    if (!localStorage.getItem(DEVICE_GUID_STORAGE)) {
        localStorage.setItem(DEVICE_GUID_STORAGE, deviceGuid);
    }
    
    return deviceGuid;
}

/**
 * Get the stored FCM token
 */
export function getFcmToken(): string | null {
    // Try cookie first
    let fcmToken = Cookies.get('fcm_token');
    
    // Try localStorage as backup
    if (!fcmToken) {
        fcmToken = localStorage.getItem(FCM_TOKEN_STORAGE);
    }
    
    return fcmToken;
}

/**
 * Store FCM token
 */
export function storeFcmToken(token: string): void {
    // Store in both cookie and localStorage
    Cookies.set('fcm_token', token, {
        expires: 365,
        secure: true,
        sameSite: 'strict'
    });
    
    localStorage.setItem(FCM_TOKEN_STORAGE, token);
}

/**
 * Get device identification headers to send with requests
 */
export function getDeviceHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
        'X-Device-GUID': getDeviceGuid(),
    };
    
    const fcmToken = getFcmToken();
    if (fcmToken) {
        headers['X-FCM-Token'] = fcmToken;
    }
    
    return headers;
}

/**
 * Attach device identification to axios/fetch requests
 */
export function attachDeviceIdentification(config: any): any {
    const deviceHeaders = getDeviceHeaders();
    
    config.headers = {
        ...config.headers,
        ...deviceHeaders,
    };
    
    return config;
}

/**
 * Initialize device identification on app load
 */
export function initializeDeviceIdentification(): void {
    // Generate/retrieve device GUID immediately
    getDeviceGuid();
    
    // Set up axios interceptor if axios is available
    if (typeof window !== 'undefined' && (window as any).axios) {
        (window as any).axios.interceptors.request.use(attachDeviceIdentification);
    }
}

export default {
    getDeviceGuid,
    getFcmToken,
    storeFcmToken,
    getDeviceHeaders,
    attachDeviceIdentification,
    initializeDeviceIdentification,
};
