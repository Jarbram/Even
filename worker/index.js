// Handlers extra para el service worker que genera next-pwa. Este archivo se
// detecta solo por su nombre y ruta (ver `customWorkerSrc` en next.config.ts,
// por defecto "worker") y queda importado dentro del `sw.js` final — por eso
// va en JavaScript llano, sin tipos: nunca pasa por el `tsc` del proyecto,
// corre tal cual en el navegador.

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let datos;
  try {
    datos = event.data.json();
  } catch {
    return;
  }

  event.waitUntil(
    self.registration.showNotification(datos.titulo ?? "Even", {
      body: datos.cuerpo,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: datos.url ?? "/" },
    }),
  );
});

// Tocar la notificación lleva a la app, reusando una pestaña ya abierta si
// hay una en la misma URL en vez de amontonar ventanas.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((lista) => {
        for (const cliente of lista) {
          if (cliente.url.includes(url) && "focus" in cliente) {
            return cliente.focus();
          }
        }
        if (self.clients.openWindow) return self.clients.openWindow(url);
      }),
  );
});
