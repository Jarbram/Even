import webpush from "web-push";
import { createClient } from "./supabase/server";
import type { Persona } from "./persona";

/**
 * Manda notificaciones push. Vive aparte de `datos.ts` porque no lee para una
 * pantalla: es un efecto secundario que dispara otra acción (un gasto nuevo,
 * el cron del recordatorio), nunca algo que una página espere para pintarse.
 */

let configurado = false;

function configurar() {
  if (configurado) return;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? "mailto:soporte@example.com",
    process.env.VAPID_PUBLIC_KEY ?? "",
    process.env.VAPID_PRIVATE_KEY ?? "",
  );
  configurado = true;
}

export type Notificacion = {
  titulo: string;
  cuerpo: string;
  /** A dónde abrir la app al tocar la notificación. Por defecto, el inicio. */
  url?: string;
};

/**
 * Le manda `notificacion` a todos los dispositivos de `persona`. Si alguno
 * ya no existe (el navegador invalidó la suscripción), se borra solo: sin
 * esto, `push_subscriptions` acumularía endpoints muertos para siempre.
 */
export async function enviarPush(
  persona: Persona,
  notificacion: Notificacion,
): Promise<void> {
  // Sin las claves puestas, mandar solo tiraría errores uno por uno.
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return;
  configurar();

  const supabase = createClient();
  const { data } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("persona", persona)
    .overrideTypes<
      { id: string; endpoint: string; p256dh: string; auth: string }[]
    >();

  if (!data?.length) return;

  await Promise.all(
    data.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(notificacion),
        );
      } catch (fallo) {
        const status = (fallo as { statusCode?: number }).statusCode;
        // 404/410: el navegador dio de baja la suscripción por su cuenta.
        if (status === 404 || status === 410) {
          await supabase.from("push_subscriptions").delete().eq("id", sub.id);
        }
      }
    }),
  );
}
