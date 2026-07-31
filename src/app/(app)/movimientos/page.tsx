import Link from "next/link";
import { Plus } from "lucide-react";
import { requirePersona } from "@/lib/sesion";
import { resumenDelMes, type GastoRow } from "@/lib/datos";
import {
  diasDelMes,
  hoyISO,
  huecoInicial,
  mesActual,
  mesDe,
  porDiaDelMes,
  redondear,
  soles,
  type Mes,
} from "@/lib/finanzas";
import { FilaGasto } from "@/components/fila-gasto";
import { NavegadorMes } from "@/components/navegacion";

const DIA_LARGO = new Intl.DateTimeFormat("es-PE", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

const SEMANA = ["L", "M", "X", "J", "V", "S", "D"];
const ES_MES = /^\d{4}-\d{2}-01$/;

export default async function MovimientosPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; dia?: string }>;
}) {
  await requirePersona();
  const params = await searchParams;

  // Los dos vienen de la URL, así que se validan antes de consultar con ellos.
  const mes: Mes = ES_MES.test(params.mes ?? "") ? params.mes! : mesActual();
  const diaActivo = Number(params.dia);
  const hayDia = diaActivo >= 1 && diaActivo <= diasDelMes(mes);

  const { gastos, totalGastado, deuda, presupuesto } = await resumenDelMes(mes);

  const visibles = hayDia
    ? gastos.filter((g) => Number(g.fecha.slice(8, 10)) === diaActivo)
    : gastos;

  const totalDia = redondear(visibles.reduce((suma, g) => suma + g.monto, 0));
  const conTope = presupuesto.estado !== "sin-topes";

  return (
    <>
      <div className="mb-4 flex items-start justify-between gap-3">
        <h1 className="text-2xl font-extrabold">Movimientos</h1>
        <Link
          href="/movimientos/nuevo"
          aria-label="Agregar gasto"
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <Plus aria-hidden className="size-5" />
        </Link>
      </div>

      <Calendario mes={mes} gastos={gastos} diaActivo={hayDia ? diaActivo : 0} />

      <div className="glass mb-6 rounded-xl p-5">
        <p className="text-[11px] font-bold tracking-[0.06em] text-muted-foreground uppercase">
          Gastado en el mes
        </p>
        <p className="mt-1.5 text-[30px] font-extrabold tracking-[-0.5px]">
          {soles(totalGastado)}
          {conTope && (
            <span className="text-base font-semibold text-muted-foreground">
              {" "}
              / {soles(presupuesto.tope)}
            </span>
          )}
        </p>

        {conTope && (
          <div
            className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted"
            role="img"
            aria-label={`${soles(totalGastado)} gastados de ${soles(presupuesto.tope)} presupuestados`}
          >
            <div
              data-estado={presupuesto.estado}
              className="h-full rounded-full bg-ok data-[estado=ajustado]:bg-warn data-[estado=excedido]:bg-over"
              style={{
                width: `${Math.min(totalGastado / presupuesto.tope, 1) * 100}%`,
              }}
            />
          </div>
        )}

        {/* La deuda cruzada es otro asunto que el total: va separada, no como
            pie de página de una cifra con la que no tiene relación. */}
        <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
          {deuda.resumen}
        </p>
      </div>

      {hayDia && (
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <p className="text-sm font-semibold">
            Día {diaActivo}
            <span className="ml-2 font-normal text-muted-foreground">
              {soles(totalDia)}
            </span>
          </p>
          <Link
            href={`/movimientos?mes=${mes}`}
            className="text-xs font-medium text-primary hover:underline"
          >
            Ver el mes
          </Link>
        </div>
      )}

      {visibles.length === 0 ? (
        <p className="glass rounded-lg p-4 text-sm text-muted-foreground">
          {hayDia
            ? "Ese día no gastaron nada."
            : "Sin gastos este mes. Toca el + para registrar el primero."}
        </p>
      ) : (
        <ListaPorDia gastos={visibles} agrupar={!hayDia} />
      )}
    </>
  );
}

/**
 * El mes de un vistazo: cada día con un punto si hubo gasto, y el punto crece
 * con el gasto. Tocar un día filtra la lista de abajo.
 *
 * ponytail: la selección es un enlace con `?dia=`, no estado de React. La URL
 * se puede compartir, el botón de atrás funciona y no cuesta JavaScript.
 */
function Calendario({
  mes,
  gastos,
  diaActivo,
}: {
  mes: Mes;
  gastos: GastoRow[];
  diaActivo: number;
}) {
  const porDia = porDiaDelMes(mes, gastos);
  const techo = Math.max(...porDia.map((d) => d.total), 1);
  const huecos = huecoInicial(mes);

  // Solo hay "hoy" si se está mirando el mes en curso.
  const hoy = hoyISO();
  const diaHoy = mesDe(hoy) === mes ? Number(hoy.slice(8, 10)) : 0;

  return (
    <section className="glass mb-6 rounded-xl p-4">
      <NavegadorMes mes={mes} href={(m) => `/movimientos?mes=${m}`} />

      <div className="grid grid-cols-7 gap-1 text-center">
        {SEMANA.map((letra, i) => (
          <span
            key={i}
            aria-hidden
            className="pb-1.5 text-[11px] font-bold text-muted-foreground"
          >
            {letra}
          </span>
        ))}

        {Array.from({ length: huecos }, (_, i) => (
          <span key={`hueco-${i}`} />
        ))}

        {porDia.map((dia, i) => {
          const numero = i + 1;
          const activo = numero === diaActivo;
          const gastado = dia.total > 0;
          const esHoy = numero === diaHoy;
          // En el mes en curso, los días que aún no han llegado se atenúan: sin
          // eso, un mes a medias se lee como un mes entero sin gastos.
          const futuro = diaHoy > 0 && numero > diaHoy;

          return (
            <Link
              key={numero}
              href={
                activo
                  ? `/movimientos?mes=${mes}`
                  : `/movimientos?mes=${mes}&dia=${numero}`
              }
              // Sin gastos no se lee "S/ 0.00" treinta veces seguidas.
              aria-label={
                gastado
                  ? `Día ${numero}, ${soles(dia.total)}`
                  : `Día ${numero}, sin gastos`
              }
              aria-current={esHoy ? "date" : undefined}
              data-activo={activo}
              data-hoy={esHoy}
              data-futuro={futuro}
              className="group flex aspect-square flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-semibold transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none data-[futuro=true]:text-muted-foreground/50 data-[hoy=true]:ring-1 data-[hoy=true]:ring-primary/60 data-[activo=true]:bg-primary data-[activo=true]:text-primary-foreground data-[activo=true]:ring-0"
            >
              {numero}
              <span
                aria-hidden
                data-gastado={gastado}
                // El punto crece con el gasto del día, entre 3 y 7 px: se ve de
                // un vistazo dónde se fue la plata sin leer un solo número.
                style={
                  gastado
                    ? {
                        width: 3 + (dia.total / techo) * 4,
                        height: 3 + (dia.total / techo) * 4,
                      }
                    : undefined
                }
                className="rounded-full bg-primary group-data-[activo=true]:bg-primary-foreground data-[gastado=false]:size-[3px] data-[gastado=false]:bg-transparent"
              />
            </Link>
          );
        })}
      </div>
    </section>
  );
}

/** Los gastos agrupados por día: es como se recuerda un gasto. */
function ListaPorDia({
  gastos,
  agrupar,
}: {
  gastos: GastoRow[];
  /** Con un día ya filtrado, la cabecera de fecha sobra: está justo arriba. */
  agrupar: boolean;
}) {
  if (!agrupar) {
    return (
      <ul className="flex flex-col gap-2">
        {gastos.map((gasto) => (
          <li key={gasto.id}>
            <FilaGasto gasto={gasto} borrable />
          </li>
        ))}
      </ul>
    );
  }

  // Ya vienen ordenados por fecha descendente, así que el Map conserva ese
  // orden sin volver a ordenar nada.
  const porDia = new Map<string, GastoRow[]>();
  for (const gasto of gastos) {
    porDia.set(gasto.fecha, [...(porDia.get(gasto.fecha) ?? []), gasto]);
  }

  return [...porDia.entries()].map(([fecha, delDia]) => (
    <section key={fecha} className="mb-5">
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="text-[11px] font-bold tracking-[0.06em] text-muted-foreground uppercase">
          {DIA_LARGO.format(new Date(`${fecha}T00:00:00Z`))}
        </h2>
        <span className="text-[11px] text-muted-foreground">
          {soles(redondear(delDia.reduce((suma, g) => suma + g.monto, 0)))}
        </span>
      </div>
      <ul className="flex flex-col gap-2">
        {delDia.map((gasto) => (
          <li key={gasto.id}>
            <FilaGasto gasto={gasto} borrable />
          </li>
        ))}
      </ul>
    </section>
  ));
}
