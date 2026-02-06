// Push notification handler
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const payload = event.data.json();
    const { title, body, icon, data } = payload;

    event.waitUntil(
      self.registration.showNotification(title || 'בית', {
        body: body || '',
        icon: icon || '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        dir: 'rtl',
        lang: 'he',
        data: data || {},
      })
    );
  } catch (err) {
    console.error('[SW] Push parse error:', err);
  }
});

// Notification click handler — open or focus the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes('/tasks') && 'focus' in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow('/tasks');
    })
  );
});
