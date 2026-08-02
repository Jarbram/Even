"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { borrarSuscripcionPush, guardarSuscripcionPush } from "../acciones";

/**
 * Activar (o apagar) los avisos push en este dispositivo.
 *
 * Cada celular tiene su propia suscripción — activarlo en el de Isabel no
 * activa el de Abraham — así que esto vive en Ajustes, no en una pantalla
 * compartida, y el estado se detecta del navegador, no de la base.
 */

type Estado = "cargando" | "no-soportado" | "activo" | "inactivo";

export function ActivarNotificaciones({
  vapidPublicKey,
}: {
  /** `null` si el servidor todavía no tiene las claves VAPID puestas. */
  vapidPublicKey: string | null;
}) {
  const [estado, setEstado] = useState<Estado>("cargando");
  const [pendiente, iniciar] = useTransition();

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setEstado("no-soportado");
      return;
    }
    let cancelado = false;
    navigator.serviceWorker.ready
      .then((registro) => registro.pushManager.getSubscription())
      .then((sub) => {
        if (!cancelado) setEstado(sub ? "activo" : "inactivo");
      });
    return () => {
      cancelado = true;
    };
  }, []);

  function activar() {
    if (!vapidPublicKey) {
      toast.error("Falta configurar las notificaciones en el servidor");
      return;
    }
    iniciar(async () => {
      try {
        const permiso = await Notification.requestPermission();
        if (permiso !== "granted") {
          toast.error("Sin permiso del navegador no se pueden mandar avisos");
          return;
        }
        const registro = await navigator.serviceWorker.ready;
        const sub = await registro.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: aBytes(vapidPublicKey) as BufferSource,
        });
        const json = sub.toJSON();
        const { error } = await guardarSuscripcionPush({
          endpoint: json.endpoint,
          p256dh: json.keys?.p256dh,
          auth: json.keys?.auth,
        });
        if (error) {
          await sub.unsubscribe();
          toast.error(error);
          return;
        }
        setEstado("activo");
        toast.success("Notificaciones activadas en este dispositivo");
      } catch {
        toast.error("No se pudo activar. Revisa los permisos del navegador.");
      }
    });
  }

  function desactivar() {
    iniciar(async () => {
      const registro = await navigator.serviceWorker.ready;
      const sub = await registro.pushManager.getSubscription();
      if (sub) {
        await borrarSuscripcionPush(sub.endpoint);
        await sub.unsubscribe();
      }
      setEstado("inactivo");
      toast.success("Notificaciones desactivadas en este dispositivo");
    });
  }

  if (estado === "cargando") return null;

  if (estado === "no-soportado") {
    return (
      <p className="glass rounded-lg px-4 py-3.5 text-xs text-muted-foreground">
        Este navegador no admite avisos push. En iPhone, primero hay que
        agregar la app a la pantalla de inicio.
      </p>
    );
  }

  return (
    <div className="glass flex items-center gap-3 rounded-lg px-4 py-3.5">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">Avisos en este dispositivo</p>
        <p className="text-xs text-muted-foreground">
          {estado === "activo"
            ? "Activados: avisan de lo que registre el otro y si se olvidan de anotar."
            : "Avisan cuando el otro registra algo, y si pasan días sin anotar nada."}
        </p>
      </div>
      <Button
        type="button"
        variant={estado === "activo" ? "ghost" : "default"}
        disabled={pendiente}
        onClick={estado === "activo" ? desactivar : activar}
        className="h-9 shrink-0 rounded-lg px-3.5 text-xs"
      >
        {pendiente ? "…" : estado === "activo" ? "Desactivar" : "Activar"}
      </Button>
    </div>
  );
}

/** El navegador pide la clave VAPID como bytes, no como el texto base64. */
function aBytes(base64: string): Uint8Array {
  const relleno = "=".repeat((4 - (base64.length % 4)) % 4);
  const normal = (base64 + relleno).replace(/-/g, "+").replace(/_/g, "/");
  const binario = atob(normal);
  return Uint8Array.from([...binario].map((c) => c.charCodeAt(0)));
}
