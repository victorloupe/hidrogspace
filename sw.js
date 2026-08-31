const CACHE_NAME = 'hidrog-space-v7';
const ASSETS = [
  './',
  './index.html',
  './cadastro.html',
  './relatorio.html',
  './produtos.html',
  './login.html',
  './styles.css?v=6',
  './utils.js?v=6',
  './favicon.ico',
  './logohidrog.png',
  './icon-192.png?v=6',
  './icon-512.png?v=6',
  './manifest.json?v=6'
];

// Instalação: cria o cache e guarda os recursos estáticos
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Ativação: limpa caches antigos
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: estratégia Stale-While-Revalidate (carrega do cache instantaneamente e atualiza em background)
self.addEventListener('fetch', (e) => {
  // Só intercepta e cacheia requisições HTTP e HTTPS (evita erro com extensões do Chrome)
  if (!e.request.url.startsWith('http://') && !e.request.url.startsWith('https://')) {
    return;
  }

  // Ignora chamadas para o Supabase ou recursos externos que não queremos cachear no cache offline
  if (e.request.url.includes('supabase.co') || e.request.url.includes('cdnjs') || e.request.url.includes('jsdelivr')) {
    return;
  }
  
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      const fetchPromise = fetch(e.request)
        .then((networkResponse) => {
          // Se a resposta for válida, clona e atualiza o cache
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(e.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch((err) => {
          console.warn('[SW] Falha na rede para:', e.request.url, err);
        });

      // Retorna a resposta do cache instantaneamente se existir, senão aguarda a rede
      return cachedResponse || fetchPromise;
    })
  );
});

