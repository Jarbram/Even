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
import { nombreMes, soles, type LineaPresupuesto } from "@/lib/finanzas";
import { FilaGasto } from "@/components/fila-gasto";

export default async function HomePage() {
  const persona = await requirePersona();
  const { mes, gastos, restante, ahorros, presupuesto, fondos, lineas } =
    await resumenDelMes();

  const sinTopes = presupuesto.estado === "sin-topes";
  const excedidos = restante < 0;
  // Solo las que tienen tope: son las únicas con un límite que graficar. Ya
  // vienen ordenadas por urgencia (lineasPresupuesto), así que el filtro no
  // rompe el orden: lo excedido sigue apareciendo primero en la tira.
  const conTope = lineas.filter((l) => l.presupuestado > 0);

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
          className="glass-accion flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
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

      {/*
        Anotar un gasto es lo que se hace a diario; las cifras de abajo son
        para consultar, no para actuar. Por eso los botones van primero, antes
        de tener que pasar por cuatro tarjetas para llegar a ellos.
      */}
      <div className="mb-6 flex flex-col gap-3">
        <Link
          href="/movimientos/nuevo"
          className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-7 transition-colors hover:border-primary hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:bg-primary/10"
        >
          <Plus aria-hidden className="size-6 text-primary" />
          <span className="text-[13px] font-semibold">Agregar gasto</span>
        </Link>

        <Link
          href="/ingresos"
          className="glass-accion flex items-center justify-center gap-2 rounded-xl py-3.5 text-[13px] font-semibold focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <ArrowDownLeft aria-hidden className="size-4 text-primary" />
          Registrar ingreso
        </Link>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3">
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
      </div>

      {conTope.length > 0 && (
        <div className="mb-8">
          <div className="mb-2.5 flex items-baseline justify-between">
            <h2 className="text-[11px] font-bold tracking-[0.06em] text-muted-foreground uppercase">
              Por categoría
            </h2>
            <Link
              href="/presupuesto"
              className="text-xs font-medium text-primary hover:underline"
            >
              Ver todo
            </Link>
          </div>

          {/* Sangra hasta el borde de la pantalla (compensa el padding de
              (app)/layout.tsx) para que el scroll horizontal se sienta como
              una tira física y no como una lista cortada a la mitad. */}
          <ul className="-mx-[22px] flex snap-x gap-2.5 overflow-x-auto px-[22px] pb-1">
            {conTope.map((linea) => (
              <li key={linea.categoria} className="shrink-0 snap-start">
                <AroCategoria linea={linea} />
              </li>
            ))}
          </ul>
        </div>
      )}

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
            className="glass-accion flex items-center gap-3 rounded-lg p-4 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
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

const COLOR_ESTADO: Record<LineaPresupuesto["estado"], string> = {
  ok: "var(--ok)",
  ajustado: "var(--warn)",
  excedido: "var(--over)",
};

/**
 * Un aro por categoría: cuánto queda de un vistazo, sin tener que abrir
 * Presupuesto. El aro es una máscara sobre un `conic-gradient` — un anillo de
 * verdad, no un disco con un círculo pintado encima, así que el centro deja
 * ver el cristal de la tarjeta en vez de un color que habría que hacer
 * coincidir a mano.
 */
function AroCategoria({ linea }: { linea: LineaPresupuesto }) {
  const proporcion = Math.min(linea.proporcion, 1);
  const color = COLOR_ESTADO[linea.estado];

  return (
    <div className="glass-accion flex w-[104px] flex-col items-center gap-2.5 rounded-2xl p-3.5 entra">
      <div className="relative flex size-14 shrink-0 items-center justify-center">
        <div
          aria-hidden
          className="absolute inset-0 rounded-full"
          style={{
            background: `conic-gradient(${color} ${proporcion * 100}%, rgb(255 255 255 / 0.12) 0)`,
            WebkitMask:
              "radial-gradient(farthest-side, transparent calc(100% - 5px), #000 calc(100% - 5px))",
            mask: "radial-gradient(farthest-side, transparent calc(100% - 5px), #000 calc(100% - 5px))",
          }}
        />
        <span
          role="img"
          aria-label={`${linea.categoria}: ${Math.round(proporcion * 100)} % del tope, ${soles(linea.gastado)} de ${soles(linea.presupuestado)}`}
          className="relative text-[12px] font-extrabold"
        >
          {Math.round(proporcion * 100)}%
        </span>
      </div>

      <span className="w-full truncate text-center text-[11px] font-semibold">
        {linea.categoria}
      </span>

      <span
        data-estado={linea.estado}
        className="text-center text-[10px] font-medium text-muted-foreground data-[estado=excedido]:text-over"
      >
        {linea.restante >= 0
          ? `${soles(linea.restante)} libre`
          : `${soles(-linea.restante)} de más`}
      </span>
    </div>
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
