// Service Worker with Version Control and Cache Management
// This service worker handles caching strategies and version control for the PWA

const CACHE_PREFIX = 'aero-enterprise-suite';
const STATIC_CACHE = `${CACHE_PREFIX}-static`;
const DYNAMIC_CACHE = `${CACHE_PREFIX}-dynamic`;
const API_CACHE = `${CACHE_PREFIX}-api`;

// Version will be replaced during build process
const APP_VERSION = '1.2.2'; // This will be replaced by build process

// Cache configuration
const CACHE_CONFIG = {
    staticCacheTTL: 30 * 24 * 60 * 60 * 1000, // 30 days
    dynamicCacheTTL: 7 * 24 * 60 * 60 * 1000, // 7 days
    apiCacheTTL: 5 * 60 * 1000, // 5 minutes
    maxDynamicCacheSize: 100,
    maxApiCacheSize: 50
};

// Assets to cache immediately
const STATIC_ASSETS = [
    '/',
    '/login',
    '/manifest.json',
    '/offline.html'
];

// Network-first patterns (always try network first)
const NETWORK_FIRST_PATTERNS = [
    /\/api\//,
    /\/login/,
    /\/logout/,
    /\/register/,
    /\/password\//,
    /\/email\//,
    /\/sanctum\//
];

// Cache-first patterns (try cache first)
const CACHE_FIRST_PATTERNS = [
    /\.(?:js|css|png|jpg|jpeg|svg|gif|ico|woff|woff2|ttf|eot)$/,
    /\/build\//,
    /\/storage\//
];

// Utility functions
const getCacheName = (type, version = APP_VERSION) => `${type}-v${version}`;

const isValidResponse = (response) => {
    return response && response.status === 200 && response.type === 'basic';
};

const shouldCache = (request) => {
    const url = new URL(request.url);
    return request.method === 'GET' && 
           url.origin === location.origin &&
           !url.pathname.startsWith('/api/log-');
};

const matchesPattern = (url, patterns) => {
    return patterns.some(pattern => pattern.test(url));
};

// Cache management
const cleanOldCaches = async () => {
    const cacheNames = await caches.keys();
    const oldCaches = cacheNames.filter(name => 
        name.startsWith(CACHE_PREFIX) && 
        !name.includes(`v${APP_VERSION}`)
    );
    
    return Promise.all(oldCaches.map(name => caches.delete(name)));
};

const limitCacheSize = async (cacheName, maxSize) => {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    
    if (keys.length > maxSize) {
        const keysToDelete = keys.slice(0, keys.length - maxSize);
        await Promise.all(keysToDelete.map(key => cache.delete(key)));
    }
};

const isExpired = (timestamp, ttl) => {
    return Date.now() - timestamp > ttl;
};

// Version checking
const checkVersion = async () => {
    try {
        const response = await fetch('/api/version', {
            cache: 'no-cache'
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.version !== APP_VERSION) {
                // Notify all clients about version mismatch
                const clients = await self.clients.matchAll();
                clients.forEach(client => {
                    client.postMessage({
                        type: 'VERSION_UPDATE_AVAILABLE',
                        oldVersion: APP_VERSION,
                        newVersion: data.version
                    });
                });
                return true;
            }
        }
    } catch (error) {
        console.log('Version check failed:', error);
    }
    return false;
};

// Install event
self.addEventListener('install', event => {
    console.log(`Service Worker v${APP_VERSION} installing...`);
    
    event.waitUntil(
        (async () => {
            // Clean old caches first
            await cleanOldCaches();
            
            // Cache static assets
            const staticCache = await caches.open(getCacheName(STATIC_CACHE));
            await staticCache.addAll(STATIC_ASSETS.map(url => new Request(url, {
                cache: 'reload'
            })));
            
            // Skip waiting to activate immediately
            self.skipWaiting();
        })()
    );
});

// Activate event
self.addEventListener('activate', event => {
    console.log(`Service Worker v${APP_VERSION} activated`);
    
    event.waitUntil(
        (async () => {
            // Clean old caches
            await cleanOldCaches();
            
            // Take control of all clients immediately
            await self.clients.claim();
            
            // Temporarily disable periodic version checking to prevent infinite reloads
            // Start periodic version checking
            // setInterval(checkVersion, 5 * 60 * 1000); // Check every 5 minutes
        })()
    );
});

// Fetch event
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests and different origins
    if (!shouldCache(request)) {
        return;
    }
    
    // Handle different caching strategies
    if (matchesPattern(url.pathname, NETWORK_FIRST_PATTERNS)) {
        // Network first strategy for dynamic content
        event.respondWith(networkFirst(request));
    } else if (matchesPattern(url.pathname, CACHE_FIRST_PATTERNS)) {
        // Cache first strategy for static assets
        event.respondWith(cacheFirst(request));
    } else {
        // Stale while revalidate for everything else
        event.respondWith(staleWhileRevalidate(request));
    }
});

// Caching strategies
const networkFirst = async (request) => {
    const url = new URL(request.url);
    
    try {
        // Try network first
        const networkResponse = await fetch(request);
        
        if (isValidResponse(networkResponse)) {
            // Cache the response
            const cache = await caches.open(getCacheName(DYNAMIC_CACHE));
            const responseClone = networkResponse.clone();
            
            // Add timestamp for TTL
            const response = new Response(await responseClone.blob(), {
                status: responseClone.status,
                statusText: responseClone.statusText,
                headers: {
                    ...Object.fromEntries(responseClone.headers.entries()),
                    'sw-cached-at': Date.now().toString()
                }
            });
            
            cache.put(request, response);
            await limitCacheSize(getCacheName(DYNAMIC_CACHE), CACHE_CONFIG.maxDynamicCacheSize);
        }
        
        return networkResponse;
    } catch (error) {
        // Fallback to cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            const cachedAt = cachedResponse.headers.get('sw-cached-at');
            if (!cachedAt || !isExpired(parseInt(cachedAt), CACHE_CONFIG.dynamicCacheTTL)) {
                return cachedResponse;
            }
        }
        
        // If it's a navigation request, return offline page
        if (request.mode === 'navigate') {
            return caches.match('/offline.html');
        }
        
        throw error;
    }
};

const cacheFirst = async (request) => {
    // Try cache first
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
        const cachedAt = cachedResponse.headers.get('sw-cached-at');
        if (!cachedAt || !isExpired(parseInt(cachedAt), CACHE_CONFIG.staticCacheTTL)) {
            return cachedResponse;
        }
    }
    
    // Fallback to network
    try {
        const networkResponse = await fetch(request);
        
        if (isValidResponse(networkResponse)) {
            const cache = await caches.open(getCacheName(STATIC_CACHE));
            const responseClone = networkResponse.clone();
            
            const response = new Response(await responseClone.blob(), {
                status: responseClone.status,
                statusText: responseClone.statusText,
                headers: {
                    ...Object.fromEntries(responseClone.headers.entries()),
                    'sw-cached-at': Date.now().toString()
                }
            });
            
            cache.put(request, response);
        }
        
        return networkResponse;
    } catch (error) {
        if (cachedResponse) {
            return cachedResponse;
        }
        throw error;
    }
};

const staleWhileRevalidate = async (request) => {
    const cache = await caches.open(getCacheName(DYNAMIC_CACHE));
    const cachedResponse = await cache.match(request);
    
    // Start network request (don't await)
    const networkPromise = fetch(request).then(async response => {
        if (isValidResponse(response)) {
            const responseClone = response.clone();
            const responseWithTimestamp = new Response(await responseClone.blob(), {
                status: responseClone.status,
                statusText: responseClone.statusText,
                headers: {
                    ...Object.fromEntries(responseClone.headers.entries()),
                    'sw-cached-at': Date.now().toString()
                }
            });
            
            cache.put(request, responseWithTimestamp);
            await limitCacheSize(getCacheName(DYNAMIC_CACHE), CACHE_CONFIG.maxDynamicCacheSize);
        }
        return response;
    }).catch(() => {
        // Network failed, but we might have cached version
    });
    
    // Return cached version immediately if available and not expired
    if (cachedResponse) {
        const cachedAt = cachedResponse.headers.get('sw-cached-at');
        if (!cachedAt || !isExpired(parseInt(cachedAt), CACHE_CONFIG.dynamicCacheTTL)) {
            // Update cache in background
            networkPromise;
            return cachedResponse;
        }
    }
    
    // Wait for network if no cache or cache expired
    try {
        return await networkPromise;
    } catch (error) {
        // Return stale cache as last resort
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // For navigation requests, return offline page
        if (request.mode === 'navigate') {
            return caches.match('/offline.html');
        }
        
        throw error;
    }
};

// Background sync for version checking
self.addEventListener('sync', event => {
    if (event.tag === 'version-check') {
        event.waitUntil(checkVersion());
    }
});

// Message handling
self.addEventListener('message', event => {
    const { data } = event;
    
    if (data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    } else if (data.type === 'CHECK_VERSION') {
        event.waitUntil(
            checkVersion().then(hasUpdate => {
                event.ports[0].postMessage({ hasUpdate });
            })
        );
    } else if (data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            cleanOldCaches().then(() => {
                event.ports[0].postMessage({ success: true });
            })
        );
    }
});

// Periodic background tasks
self.addEventListener('backgroundfetch', event => {
    if (event.tag === 'version-check') {
        event.waitUntil(checkVersion());
    }
});

console.log(`Service Worker v${APP_VERSION} loaded`);
