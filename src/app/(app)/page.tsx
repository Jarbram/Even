import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  SlidersHorizontal,
} from "lucide-react";
import { NOMBRES, laOtra } from "@/lib/persona";
import { requirePersona } from "@/lib/sesion";
import { resumenDelMes } from "@/lib/datos";
import { nombreMes, soles } from "@/lib/finanzas";
import { FilaGasto } from "@/components/fila-gasto";

export default async function HomePage() {
  const persona = await requirePersona();
  const { mes, gastos, restante, ahorros, deuda, presupuesto, fondos } =
    await resumenDelMes();

  const sinTopes = presupuesto.estado === "sin-topes";
  const excedidos = restante < 0;

  return (
    <>
      <header className="mb-6 flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-full bg-gradient-to-br from-secondary to-primary text-[17px] font-bold text-foreground">
          {NOMBRES[persona][0]}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground">
            Hola, {NOMBRES[persona]}
          </p>
          <p className="truncate text-[13px] font-semibold">
            Hogar {NOMBRES[persona]} &amp; {NOMBRES[laOtra(persona)]}
          </p>
        </div>
        <Link
          href="/ajustes"
          aria-label="Ajustes"
          className="glass flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <SlidersHorizontal aria-hidden className="size-[18px]" />
        </Link>
      </header>

      <h1 className="text-[30px] leading-[1.15] font-extrabold tracking-[-0.5px]">
        ¿Listos para
        <br />
        este mes?
      </h1>
      <p className="mt-2 mb-6 text-[13px] font-medium text-muted-foreground">
        {nombreMes(mes)}
      </p>

      <div className="mb-6 grid grid-cols-2 gap-3">
        {/* La tarjeta grande del diseño: indigo lleno, no glass. */}
        <Tarjeta
          href="/presupuesto"
          titulo="Presupuesto restante"
          className="bg-secondary text-secondary-foreground"
        >
          {sinTopes ? (
            // Un "S/ 0.00" aquí sería mentira: no es que no quede nada, es que
            // todavía no hay topes contra los que medir.
            <p className="text-[15px] leading-snug font-bold">
              Pon los topes
              <span className="mt-1 block text-[11px] font-medium text-white/75">
                Un máximo por categoría
              </span>
            </p>
          ) : (
            <p
              data-excedido={excedidos}
              className="text-[26px] leading-none font-extrabold tracking-[-0.5px] data-[excedido=true]:text-destructive"
            >
              {soles(restante)}
            </p>
          )}
        </Tarjeta>

        <Tarjeta href="/ajustes" titulo="Ahorros" className="glass">
          {fondos.length === 0 ? (
            <p className="text-[15px] leading-snug font-bold">
              Crea un fondo
              <span className="mt-1 block text-[11px] font-medium text-muted-foreground">
                Viaje, emergencia…
              </span>
            </p>
          ) : (
            <p className="text-[26px] leading-none font-extrabold tracking-[-0.5px] text-primary">
              {soles(ahorros)}
            </p>
          )}
        </Tarjeta>

        <Tarjeta
          href="/movimientos"
          titulo="Deuda entre nosotros"
          className="glass"
        >
          {deuda.deudor ? (
            <p className="text-[15px] leading-snug font-bold">
              {NOMBRES[deuda.deudor]} debe
              <span className="mt-1 block text-lg text-primary">
                {soles(deuda.monto)}
              </span>
            </p>
          ) : (
            <p className="text-[15px] leading-snug font-bold">Están en paz</p>
          )}
        </Tarjeta>

        <Link
          href="/movimientos/nuevo"
          className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-7 transition-colors hover:border-primary hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:bg-primary/10"
        >
          <Plus aria-hidden className="size-6 text-primary" />
          <span className="text-[13px] font-semibold">Agregar gasto</span>
        </Link>
      </div>

      {/*
        El ingreso va aparte y en segundo plano a propósito: se registra dos
        veces al mes, mientras que los gastos se anotan a diario. Darles el
        mismo peso pondría delante lo que menos se toca.
      */}
      <Link
        href="/ingresos"
        className="glass mb-8 flex items-center justify-center gap-2 rounded-xl py-3.5 text-[13px] font-semibold transition-colors hover:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <ArrowDownLeft aria-hidden className="size-4 text-primary" />
        Registrar ingreso
      </Link>

      <div className="mb-2.5 flex items-baseline justify-between">
        <h2 className="text-[11px] font-bold tracking-[0.06em] text-muted-foreground uppercase">
          Actividad reciente
        </h2>
        {gastos.length > 6 && (
          <Link
            href="/movimientos"
            className="text-xs font-medium text-primary hover:underline"
          >
            Ver todo
          </Link>
        )}
      </div>

      {gastos.length === 0 ? (
        <PrimerosPasos sinTopes={sinTopes} />
      ) : (
        <ul className="flex flex-col gap-2">
          {gastos.slice(0, 6).map((gasto) => (
            <li key={gasto.id}>
              <FilaGasto gasto={gasto} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

/**
 * El mes sin un solo gasto es la primera pantalla que van a ver, y también la
 * de cada día 1. En vez de un aviso gris, dice qué falta y lleva a hacerlo.
 */
function PrimerosPasos({ sinTopes }: { sinTopes: boolean }) {
  const pasos = [
    sinTopes && {
      href: "/presupuesto",
      titulo: "Acuerden los topes",
      pie: "Un máximo por categoría. Valen también los meses siguientes.",
    },
    {
      href: "/movimientos/nuevo",
      titulo: "Anota el primer gasto",
      pie: "Con el monto y en qué fue basta; el resto ya viene puesto.",
    },
  ].filter(Boolean) as { href: string; titulo: string; pie: string }[];

  return (
    <ul className="flex flex-col gap-2">
      {pasos.map((paso) => (
        <li key={paso.href}>
          <Link
            href={paso.href}
            className="glass flex items-center gap-3 rounded-lg p-4 transition-colors hover:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{paso.titulo}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{paso.pie}</p>
            </div>
            <ArrowUpRight
              aria-hidden
              className="size-4 shrink-0 text-muted-foreground"
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Tarjeta({
  href,
  titulo,
  className,
  children,
}: {
  href: string;
  titulo: string;
  className: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      // min-h para que las cuatro tarjetas midan igual aunque el título ocupe
      // una línea o dos: en la rejilla se notaba el desajuste.
      className={`group relative flex min-h-[124px] flex-col justify-between gap-4 rounded-xl p-4 transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${className}`}
    >
      <p className="pr-5 text-[11px] leading-tight font-bold tracking-[0.06em] uppercase opacity-70">
        {titulo}
      </p>
      <ArrowUpRight
        aria-hidden
        className="absolute top-3.5 right-3.5 size-3.5 opacity-40 transition-opacity group-hover:opacity-80"
      />
      {children}
    </Link>
  );
}
