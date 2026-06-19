const CACHE_NAME = 'hidrog-space-v3';
const ASSETS = [
  './',
  './index.html',
  './cadastro.html',
  './relatorio.html',
  './produtos.html',
  './login.html',
  './styles.css?v=3',
  './utils.js?v=3',
  './favicon.ico',
  './logohidrog.png',
  './icon-192.png?v=3',
  './icon-512.png?v=3',
  './manifest.json?v=3'
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

// Fetch: estratégia Network First com fallback para Cache
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
    fetch(e.request)
      .then((response) => {
        // Se a resposta for válida, clona e atualiza o cache
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Se falhar a rede, busca no cache
        return caches.match(e.request);
      })
  );
});
