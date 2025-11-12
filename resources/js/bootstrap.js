import axios from 'axios';
import { attachDeviceIdentification } from './services/deviceIdentification';

window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
window.axios.defaults.withCredentials = true; // Ensure cookies are sent with requests
window.axios.defaults.withXSRFToken = true;

// Attach device identification to all axios requests
axios.interceptors.request.use(
    async (config) => {
        try {
            await attachDeviceIdentification(config);
        } catch (error) {
            console.warn('Failed to attach device identification:', error);
            // Continue with request even if device identification fails
        }
        return config;
    },
    (error) => Promise.reject(error)
);