// Service Worker for Quran App - Offline functionality
const CACHE_NAME = 'quran-app-v1';
const AUDIO_CACHE = 'quran-audio-v1';
const API_CACHE = 'quran-api-v1';

// Resources to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/surah.html',
  '/css/style.css',
  '/js/app.js',
  '/js/surahReader.js',
  '/js/search.js',
  '/js/searchAdvanced.js',
  '/js/themes.js',
  '/data/surahs.json',
  '/data/themes.json'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== AUDIO_CACHE && cacheName !== API_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - handle requests
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(event.request));
    return;
  }

  // Handle audio requests
  if (url.hostname.includes('quranicaudio.com') || url.pathname.includes('.mp3')) {
    event.respondWith(handleAudioRequest(event.request));
    return;
  }

  // Handle static assets
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

// Handle API requests with caching
async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE);

  // Try cache first
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    // Fetch from network
    const response = await fetch(request);

    // Cache successful responses
    if (response.ok) {
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    // Return cached response if available, otherwise error
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Handle audio requests with selective caching
async function handleAudioRequest(request) {
  const cache = await caches.open(AUDIO_CACHE);

  // Check if this audio is marked for offline storage
  const offlineAudios = await getOfflineAudios();

  const shouldCache = offlineAudios.some(audioUrl =>
    request.url.includes(audioUrl)
  );

  if (shouldCache) {
    // Try cache first for offline audios
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
  }

  try {
    // Fetch from network
    const response = await fetch(request);

    // Cache if it's an offline audio or small file
    if (shouldCache || (response.ok && response.headers.get('content-length') < 10 * 1024 * 1024)) {
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    // Return cached response if available
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Get list of audios marked for offline storage
async function getOfflineAudios() {
  try {
    // This would be stored in IndexedDB or similar
    // For now, return empty array - implement later
    return [];
  } catch (error) {
    return [];
  }
}

// Message handler for offline audio management
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'CACHE_AUDIO') {
    cacheAudioForOffline(event.data.url);
  } else if (event.data && event.data.type === 'REMOVE_AUDIO_CACHE') {
    removeAudioFromCache(event.data.url);
  }
});

// Cache audio for offline use
async function cacheAudioForOffline(audioUrl) {
  try {
    const cache = await caches.open(AUDIO_CACHE);
    const response = await fetch(audioUrl);
    if (response.ok) {
      await cache.put(audioUrl, response);
      // Store in offline list (would use IndexedDB)
    }
  } catch (error) {
    console.error('Failed to cache audio:', error);
  }
}

// Remove audio from cache
async function removeAudioFromCache(audioUrl) {
  try {
    const cache = await caches.open(AUDIO_CACHE);
    await cache.delete(audioUrl);
    // Remove from offline list
  } catch (error) {
    console.error('Failed to remove audio from cache:', error);
  }
}