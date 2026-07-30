import type { MetadataRoute } from "next";

// Next genera /manifest.webmanifest desde este archivo; no hace falta un JSON aparte.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Nuestro Presupuesto",
    short_name: "Presupuesto",
    description: "Gastos, ahorros y deudas de la casa, en un solo lugar.",
    start_url: "/",
    display: "standalone",
    background_color: "#111214",
    theme_color: "#111214",
    lang: "es-PE",
    orientation: "portrait",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
