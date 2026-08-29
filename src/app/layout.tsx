import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import { ViewTransitions } from "next-view-transitions";
import { Toaster } from "@/components/ui/sonner";
import { AvisoConexion } from "@/components/aviso-conexion";
import { QueryProvider } from "@/components/query-provider";
import "./globals.css";

// DM Sans: redondeada y amigable, como el lenguaje de una billetera P2P
// (Yape, Plin) — no la geométrica angulosa del diseño anterior. next/font la
// autohospeda, así que no hay request a fonts.googleapis.com en runtime.
const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Even",
  description: "Gastos, ahorros y presupuesto de la casa, en un solo lugar.",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0e",
  viewportFit: "cover",
  initialScale: 1,
  width: "device-width",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ViewTransitions>
      <html lang="es" className="dark">
        <body className={`${dmSans.variable} font-sans`}>
          {/*
            THESIS: Cada pantalla se lee como una confirmación de pago entre
            los dos, no como un panel de vidrio con datos encima.
            OWN-WORLD: tarjetas sólidas por dirección del dinero (violeta
            gasto, esmeralda ingreso, azul pendiente), naranja como único
            color de marca, avatar propio por persona, DM Sans, sin cristal
            ni blur.
            STORY: al abrir la app confías el número al instante, sabes las
            dos acciones posibles, y cada movimiento pasado se lee como un
            recibo ya confirmado entre los dos.
            FIRST VIEWPORT: saludo con avatar por persona, tarjeta de saldo
            sólida, dos pastillas de acción (violeta/esmeralda), categorías
            con símbolo de estado además de color.
            FORM: "Confirmación Yape/Plin", elegida por el usuario sobre la
            #5 asignada por el sorteo (boleta de cajero); seed key dee5052c.
            FINISH: unreviewed and undocumented is unfinished; this build
            ends with the finish review, the verdict, DESIGN.md, and every
            shipping raster carrying its provenance.
          */}
          <QueryProvider>{children}</QueryProvider>
          <Toaster position="top-center" />
          <AvisoConexion />
        </body>
      </html>
    </ViewTransitions>
  );
}
