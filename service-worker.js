// Pizza Shop POS - Service Worker
// Enables offline functionality through caching

const CACHE_VERSION = 'v6';
const STATIC_CACHE = `pizza-shop-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `pizza-shop-dynamic-${CACHE_VERSION}`;

// Static assets to pre-cache on install
// Using relative paths for GitHub Pages compatibility
const STATIC_ASSETS = [
  './',
  './index.html',
  './style.css',
  './main.js',
  './manifest.json',
  './data/menu.json',
  // JS modules
  './js/firebase.js',
  './js/analytics.js',
  './js/orderList.js',
  './js/models/Order.js',
  './js/repositories/OrderRepository.js',
  './js/repositories/LocalStorageOrderRepository.js',
  './js/services/OrderService.js',
  './js/core/EventBus.js',
  './js/core/EventTypes.js',
  // Pizza images
  './images/pizza/margherita.png',
  './images/pizza/prosciutto.png',
  './images/pizza/salame.png',
  './images/pizza/prosciutto-cotto.png',
  './images/pizza/prosciutto-cotto-mushroom.png',
  './images/pizza/4-formaggi.png',
  './images/pizza/vegetariana.png',
  './images/pizza/al-funghi.png',
  './images/pizza/capricciosa.png',
  './images/pizza/bianca.png',
  './images/pizza/chicken.png',
  './images/pizza/italian-sausage.png',
  './images/pizza/tuna.png',
  './images/pizza/salame-ham-mushroom.png',
  './images/pizza/hawaiian-ham.png',
  './images/pizza/hawaiian-chicken.png',
  './images/pizza/custom.png',
  // Quesadilla images
  './images/quesadilla/cheese.png',
  './images/quesadilla/chicken.png',
  './images/quesadilla/beef.png',
  './images/quesadilla/ham.png',
  './images/quesadilla/spinach.png',
  './images/quesadilla/mushroom.png',
  './images/quesadilla/pepperoni.png',
  './images/quesadilla/nutella.png',
  // Icon images
  './images/icons/cheese.png',
  './images/icons/chicken.png',
  './images/icons/beef.png',
  './images/icons/spinach.png',
  './images/icons/ham.png',
  './images/icons/prosciutto.png',
  './images/icons/salame.png',
  './images/icons/mushroom.png',
  './images/icons/nutella.png',
  './images/icons/4-cheese.png',
  './images/icons/bianca.png'
];

// Install event - pre-cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Pre-caching static assets...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached successfully');
        return self.skipWaiting(); // Activate immediately
      })
      .catch(error => {
        console.error('[SW] Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');

  event.waitUntil(
    caches.keys()
      .then(keys => {
        return Promise.all(
          keys
            .filter(key => key.startsWith('pizza-shop-') &&
                          key !== STATIC_CACHE &&
                          key !== DYNAMIC_CACHE)
            .map(key => {
              console.log('[SW] Deleting old cache:', key);
              return caches.delete(key);
            })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim(); // Take control immediately
      })
  );
});

// Fetch event - serve from cache with appropriate strategies
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip Firebase/external API calls - let them go to network
  if (url.hostname.includes('firebaseio.com') ||
      url.hostname.includes('googleapis.com') ||
      url.hostname.includes('gstatic.com')) {
    return;
  }

  // Network-first for menu.json (may be updated)
  if (url.pathname.endsWith('menu.json')) {
    event.respondWith(networkFirstStrategy(event.request));
    return;
  }

  // Cache-first for static assets
  event.respondWith(cacheFirstStrategy(event.request));
});

/**
 * Cache-first strategy: Try cache, fall back to network
 * Good for static assets that rarely change
 */
async function cacheFirstStrategy(request) {
  const cached = await caches.match(request);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);

    // Cache successful responses
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.error('[SW] Fetch failed:', error);

    // Return offline fallback for navigation requests
    if (request.mode === 'navigate') {
      const cached = await caches.match('./index.html');
      if (cached) return cached;
    }

    // Return a simple offline response
    return new Response('Offline - Resource not available', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

/**
 * Network-first strategy: Try network, fall back to cache
 * Good for data that may update frequently
 */
async function networkFirstStrategy(request) {
  try {
    const response = await fetch(request);

    // Cache successful responses
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.log('[SW] Network request failed, trying cache:', request.url);

    const cached = await caches.match(request);

    if (cached) {
      return cached;
    }

    // Return error response
    return new Response(JSON.stringify({ error: 'Offline - Data not available' }), {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
