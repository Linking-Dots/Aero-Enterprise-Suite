import axios from 'axios';
import { attachDeviceId, handleDeviceMismatch } from './utils/deviceAuth';

window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
window.axios.defaults.withCredentials = true; // Ensure cookies are sent with requests
window.axios.defaults.withXSRFToken = true;

// Attach device ID to all axios requests
axios.interceptors.request.use(
    (config) => {
        try {
            return attachDeviceId(config);
        } catch (error) {
            console.warn('[Device Auth] Failed to attach device ID:', error);
            // Continue with request even if device ID attachment fails
            return config;
        }
    },
    (error) => Promise.reject(error)
);

// Handle device mismatch errors globally
axios.interceptors.response.use(
    (response) => response,
    (error) => {
        // Check if error is device verification failure
        if (error.response?.status === 403 && error.response?.data?.reason === 'invalid_device') {
            handleDeviceMismatch(error.response.data.error);
        }
        return Promise.reject(error);
    }
);