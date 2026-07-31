import Link from "next/link";
import { requirePersona } from "@/lib/sesion";
import { resumenDelMes } from "@/lib/datos";
import { nombreMes, redondear, soles } from "@/lib/finanzas";
import { FilaGasto } from "@/components/fila-gasto";

const DIA_LARGO = new Intl.DateTimeFormat("es-PE", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

export default async function MovimientosPage() {
  await requirePersona();
  const { mes, gastos, totalGastado, deuda } = await resumenDelMes();

  // Agrupados por día, que es como se recuerda un gasto: "el martes gastamos…".
  // Los gastos ya vienen ordenados por fecha descendente, así que el Map
  // conserva ese orden sin volver a ordenar nada.
  const porDia = new Map<string, typeof gastos>();
  for (const gasto of gastos) {
    porDia.set(gasto.fecha, [...(porDia.get(gasto.fecha) ?? []), gasto]);
  }

  return (
    <>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Movimientos</h1>
          <p className="mt-1 text-sm text-muted-foreground capitalize">
            {nombreMes(mes)}
          </p>
        </div>
        <Link
          href="/movimientos/nuevo"
          aria-label="Agregar gasto"
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground"
        >
          +
        </Link>
      </div>

      <div className="glass mb-6 rounded-xl p-5">
        <p className="text-[11px] font-bold tracking-[0.06em] text-muted-foreground uppercase">
          Total del mes
        </p>
        <p className="mt-1 text-[30px] font-extrabold tracking-[-0.5px]">
          {soles(totalGastado)}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">{deuda.resumen}</p>
      </div>

      {gastos.length === 0 ? (
        <p className="glass rounded-lg p-4 text-sm text-muted-foreground">
          Sin gastos este mes. Toca el + para registrar el primero.
        </p>
      ) : (
        [...porDia.entries()].map(([fecha, delDia]) => (
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
                  <FilaGasto gasto={gasto} />
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </>
  );
}
