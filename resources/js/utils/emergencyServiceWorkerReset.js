// Service Worker Emergency Reset
// Use this to completely reset service workers and caches in case of infinite reload issues

export const emergencyServiceWorkerReset = async () => {
    console.log('🚨 Emergency Service Worker Reset initiated...');
    
    try {
        // 1. Unregister all service workers
        if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            console.log(`Found ${registrations.length} service worker registrations`);
            
            for (const registration of registrations) {
                await registration.unregister();
                console.log('✅ Service worker unregistered:', registration.scope);
            }
        }
        
        // 2. Clear all caches
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            console.log(`Found ${cacheNames.length} caches to clear`);
            
            for (const cacheName of cacheNames) {
                await caches.delete(cacheName);
                console.log('✅ Cache cleared:', cacheName);
            }
        }
        
        // 3. Clear relevant localStorage items
        const itemsToRemove = [
            'app_version',
            'app_version_timestamp',
            'app_version_last_check',
            'sw_version',
            'sw_update_available'
        ];
        
        itemsToRemove.forEach(item => {
            if (localStorage.getItem(item)) {
                localStorage.removeItem(item);
                console.log('✅ localStorage item removed:', item);
            }
        });
        
        console.log('🎉 Emergency reset completed successfully!');
        console.log('💡 Please refresh the page to continue with a clean state.');
        
        return {
            success: true,
            message: 'Service workers and caches cleared successfully'
        };
        
    } catch (error) {
        console.error('❌ Emergency reset failed:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// Auto-execute if called directly from console
if (typeof window !== 'undefined') {
    window.emergencyServiceWorkerReset = emergencyServiceWorkerReset;
    console.log('🔧 Emergency Service Worker Reset available as window.emergencyServiceWorkerReset()');
}

export default emergencyServiceWorkerReset;
