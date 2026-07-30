import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const nextConfig: NextConfig = {
  // Hay lockfiles por encima de este directorio; fija la raíz para el trace.
  outputFileTracingRoot: import.meta.dirname,
  // shadcn/ui importa desde el barrel `radix-ui`, que arrastra ~255 kB a
  // cualquier ruta que use un componente. Esto lo reescribe a imports directos.
  experimental: { optimizePackageImports: ["radix-ui"] },
};

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  cacheOnFrontEndNav: true,
  reloadOnOnline: true,
  workboxOptions: {
    // ponytail: solo cache del app-shell. El offline real (cola de mutaciones,
    // IndexedDB) es fase 2 del brief, se añade cuando toque.
    skipWaiting: true,
    clientsClaim: true,
  },
});

export default withPWA(nextConfig);
