self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "SafeGo", body: event.data.text(), icon: "/icons/icon-192.svg" };
  }

  const options = {
    body: payload.body ?? "",
    icon: payload.icon ?? "/icons/icon-192.svg",
    badge: "/icons/icon-192.svg",
    ...(payload.image ? { image: payload.image } : {}),
    data: payload.data ?? {},
  };

  event.waitUntil(
    self.registration.showNotification(payload.title ?? "SafeGo", options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url === url && "focus" in client) {
            return client.focus();
          }
        }
        return self.clients.openWindow(url);
      })
  );
});
