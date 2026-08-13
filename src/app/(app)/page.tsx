import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, SlidersHorizontal } from "lucide-react";
import { NOMBRES, laOtra } from "@/lib/persona";
import { requirePersona } from "@/lib/sesion";
import { categoriasUsadas, resumenDelMes } from "@/lib/datos";
import {
  hoyISO,
  nombreMes,
  redondear,
  soles,
  type LineaPresupuesto,
} from "@/lib/finanzas";
import { FilaGasto } from "@/components/fila-gasto";
import { FormularioGastoRapido } from "./formulario-gasto-rapido";

export default async function HomePage() {
  const persona = await requirePersona();
  const [
    { mes, gastos, restante, ahorros, presupuesto, fondos, lineas, cuentas },
    categorias,
  ] = await Promise.all([resumenDelMes(), categoriasUsadas()]);

  const sinTopes = presupuesto.estado === "sin-topes";
  const excedidos = restante < 0;
  // Solo las que tienen tope: son las únicas con un límite que graficar. Ya
  // vienen ordenadas por urgencia (lineasPresupuesto), así que el filtro no
  // rompe el orden: lo excedido sigue apareciendo primero en la tira.
  const conTope = lineas.filter((l) => l.presupuestado > 0);

  // Plata de verdad, no ahorros ni cupo de tarjeta: lo que hay hoy en
  // efectivo, débito o billetera. Los fondos son plata ya apartada para otra
  // cosa, y el "disponible" de una tarjeta es crédito, no dinero propio —
  // mezclarlos haría parecer que hay más de lo que en realidad se puede gastar.
  const cuentasLiquidas = cuentas.filter((c) => c.tipo !== "credito");
  const disponible = redondear(
    cuentasLiquidas.reduce((suma, c) => suma + c.saldo, 0),
  );

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
        de tener que pasar por tarjetas para llegar a ellos — y lado a lado,
        no apilados, porque son la misma clase de acción.

        "Agregar gasto" abre una hoja desde abajo con el formulario completo
        (cuenta, fecha, quién pagó...), no un enlace a otra pantalla: el Home
        no se mueve, solo sube un panel encima.
      */}
      <div className="mb-8 grid grid-cols-2 gap-3">
        <FormularioGastoRapido
          persona={persona}
          categorias={categorias}
          cuentas={cuentas}
          hoy={hoyISO()}
        />

        <Link
          href="/ingresos"
          className="glass-accion flex flex-col items-center justify-center gap-1.5 rounded-xl py-5 text-[13px] font-semibold focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <ArrowDownLeft aria-hidden className="size-5 text-primary" />
          Registrar ingreso
        </Link>
      </div>

      {/*
        Un solo panel para las tres cifras del dinero, no tres bloques de
        colores distintos peleando por la atención. El número grande es lo
        que de verdad se puede gastar hoy; presupuesto y ahorros bajan de
        peso como cifras secundarias debajo de una línea — se consultan,
        no son la primera lectura.
      */}
      <section className="glass mb-8 rounded-2xl p-5">
        <Link
          href="/ajustes"
          className="flex items-center justify-between gap-3 rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <div className="min-w-0">
            <p className="text-[11px] font-bold tracking-[0.06em] text-muted-foreground uppercase">
              Dinero disponible
            </p>
            {cuentasLiquidas.length === 0 ? (
              <p className="mt-1.5 text-[15px] font-bold">
                Agrega una cuenta en Ajustes
              </p>
            ) : (
              <p
                data-negativo={disponible < 0}
                className="mt-1 text-[32px] leading-none font-extrabold tracking-[-0.5px] data-[negativo=true]:text-destructive"
              >
                {soles(disponible)}
              </p>
            )}
          </div>
          <ArrowUpRight
            aria-hidden
            className="size-4 shrink-0 text-muted-foreground"
          />
        </Link>

        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4">
          <Link
            href="/presupuesto"
            className="rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <p className="text-[11px] font-semibold text-muted-foreground">
              Presupuesto
            </p>
            {sinTopes ? (
              // Un "S/ 0.00" aquí sería mentira: no es que no quede nada, es
              // que todavía no hay topes contra los que medir.
              <p className="mt-1 text-sm font-bold">Pon los topes</p>
            ) : (
              <p
                data-excedido={excedidos}
                className="mt-1 text-lg font-extrabold tracking-[-0.3px] data-[excedido=true]:text-destructive"
              >
                {soles(restante)}
              </p>
            )}
          </Link>

          <Link
            href="/ajustes"
            className="rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <p className="text-[11px] font-semibold text-muted-foreground">
              Ahorros
            </p>
            {fondos.length === 0 ? (
              <p className="mt-1 text-sm font-bold">Crea un fondo</p>
            ) : (
              <p className="mt-1 text-lg font-extrabold tracking-[-0.3px] text-primary">
                {soles(ahorros)}
              </p>
            )}
          </Link>
        </div>
      </section>

      {conTope.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-2.5 text-[11px] font-bold tracking-[0.06em] text-muted-foreground uppercase">
            Por categoría
          </h2>

          {/* Sangra hasta el borde de la pantalla (compensa el padding de
              (app)/layout.tsx) para que el scroll horizontal se sienta como
              una tira física y no como una lista cortada a la mitad. Sin
              "Ver todo": ya es un slider, deslizar de largo es "ver todo". */}
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
