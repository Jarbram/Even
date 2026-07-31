import Link from "next/link";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { desplazarMes, nombreMes, type Mes } from "@/lib/finanzas";

/**
 * Los dos controles que se repetían en media app, cada uno con su glifo suelto.
 * Los iconos son de lucide, ya instalado: un «✕» o un «›» tipográfico no escala
 * con el texto de al lado ni se alinea ópticamente con él.
 */

export function BotonCerrar({
  href,
  label = "Cerrar",
}: {
  href: string;
  label?: string;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="glass flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <X aria-hidden className="size-[18px]" />
    </Link>
  );
}

/** ‹ Julio 2026 › — el mes que se está mirando, con sus dos saltos. */
export function NavegadorMes({
  mes,
  href,
}: {
  mes: Mes;
  /** Construye el destino para un mes dado, conservando el resto de filtros. */
  href: (mes: Mes) => string;
}) {
  return (
    <nav
      aria-label="Mes"
      className="mb-4 flex items-center justify-center gap-2 text-sm"
    >
      <Link
        href={href(desplazarMes(mes, -1))}
        aria-label="Mes anterior"
        className="flex size-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <ChevronLeft aria-hidden className="size-5" />
      </Link>

      <span className="min-w-[9rem] text-center font-semibold">
        {nombreMes(mes)}
      </span>

      <Link
        href={href(desplazarMes(mes, 1))}
        aria-label="Mes siguiente"
        className="flex size-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <ChevronRight aria-hidden className="size-5" />
      </Link>
    </nav>
  );
}
