import type { MetadataRoute } from "next";

// Next genera /manifest.webmanifest desde este archivo; no hace falta un JSON aparte.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Even · Nuestro Presupuesto",
    short_name: "Even",
    description: "Gastos, ahorros y deudas de la casa, en un solo lugar.",
    start_url: "/",
    display: "standalone",
    background_color: "#111214",
    theme_color: "#111214",
    lang: "es-PE",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        // Archivo propio, no el mismo de arriba: Android recorta el icono en
        // círculo o squircle, así que esta versión deja el signo dentro del
        // 80 % central. Reusar el normal le comería los extremos.
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
