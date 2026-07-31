"use client";

import { useEffect } from "react";
import { toast } from "sonner";

/**
 * Avisa cuando hay una versión nueva instalada y ofrece recargar.
 *
 * Las páginas van NetworkFirst, así que quien abre la app con conexión ya ve lo
 * último. El hueco es quien la deja abierta: navegar entre pestañas no recarga
 * el bundle, así que puede seguir con la versión de ayer durante días sin que
 * nada se lo diga.
 *
 * ponytail: se avisa, no se recarga solo. Una recarga automática a mitad de un
 * gasto a medio escribir pierde lo tecleado, y esa es justo la pantalla donde
 * más tiempo se pasa.
 */
export function AvisoActualizacion() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // Se guardan aquí porque el cleanup del efecto corre fuera de la promesa:
    // devolverlo desde dentro del `.then` no lo ejecutaría nunca.
    let registro: ServiceWorkerRegistration | undefined;
    let vigilar: (() => void) | undefined;
    let alVolver: (() => void) | undefined;

    navigator.serviceWorker.ready.then((r) => {
      registro = r;

      vigilar = () => {
        const nuevo = r.installing;
        if (!nuevo) return;

        nuevo.addEventListener("statechange", () => {
          // Un `controller` existente significa que ya había una versión
          // corriendo; sin él esto es la primera instalación y no hay nada que
          // avisar.
          if (
            nuevo.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            toast("Hay una versión nueva de Even", {
              description: "Recarga para tenerla.",
              duration: Infinity,
              action: {
                label: "Actualizar",
                onClick: () => window.location.reload(),
              },
            });
          }
        });
      };

      r.addEventListener("updatefound", vigilar);

      // Al volver a la app tras un rato es cuando la actualización importa, y
      // comprobarla cuesta una petición condicional.
      alVolver = () => {
        if (document.visibilityState === "visible") r.update();
      };
      document.addEventListener("visibilitychange", alVolver);
    });

    return () => {
      if (registro && vigilar) registro.removeEventListener("updatefound", vigilar);
      if (alVolver) document.removeEventListener("visibilitychange", alVolver);
    };
  }, []);

  return null;
}
