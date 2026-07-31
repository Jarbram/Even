import { requirePersona } from "@/lib/sesion";
import { resumenDelMes } from "@/lib/datos";
import { nombreMes, soles, type LineaPresupuesto } from "@/lib/finanzas";
import { NuevoIngreso, NuevoPresupuesto } from "./formularios";

export default async function PresupuestoPage() {
  await requirePersona();
  const { mes, presupuesto, baseCero, ingresos } = await resumenDelMes();

  return (
    <>
      <h1 className="text-2xl font-extrabold">Presupuesto</h1>
      <p className="mt-1 mb-[22px] text-sm text-muted-foreground capitalize">
        {nombreMes(mes)}
      </p>

      {/* Base cero: el titular del mes. */}
      <div className="glass mb-7 rounded-xl p-5">
        <p className="text-[11px] font-bold tracking-[0.06em] text-muted-foreground uppercase">
          Sin asignar
        </p>
        <p
          data-estado={baseCero.estado}
          className="mt-1 text-[30px] font-extrabold tracking-[-0.5px] data-[estado=cuadrado]:text-primary data-[estado=falta]:text-destructive"
        >
          {soles(baseCero.porAsignar)}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">{baseCero.resumen}</p>
        <dl className="mt-4 flex gap-6 text-xs">
          <div>
            <dt className="text-muted-foreground">Ingresos</dt>
            <dd className="mt-0.5 font-semibold">{soles(baseCero.ingresos)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Asignado</dt>
            <dd className="mt-0.5 font-semibold">{soles(baseCero.asignado)}</dd>
          </div>
        </dl>
      </div>

      <p className="mb-2.5 text-[11px] font-bold tracking-[0.06em] text-muted-foreground uppercase">
        Ingresos del mes
      </p>
      {ingresos.length > 0 && (
        <ul className="mb-2.5 flex flex-col gap-2">
          {ingresos.map((ingreso) => (
            <li
              key={ingreso.id}
              className="glass flex items-center justify-between rounded-lg px-4 py-3 text-sm"
            >
              <span className="capitalize">
                {ingreso.descripcion} · {ingreso.persona}
              </span>
              <span className="font-semibold">{soles(ingreso.monto)}</span>
            </li>
          ))}
        </ul>
      )}
      <NuevoIngreso mes={mes} />

      <p className="mt-7 mb-2.5 text-[11px] font-bold tracking-[0.06em] text-muted-foreground uppercase">
        Por categoría
      </p>
      {presupuesto.length === 0 ? (
        <p className="glass mb-2.5 rounded-lg p-4 text-sm text-muted-foreground">
          Todavía no hay nada asignado. Empieza por lo grande: alquiler,
          servicios, mercado.
        </p>
      ) : (
        <ul className="mb-2.5 flex flex-col gap-2">
          {presupuesto.map((linea) => (
            <li key={linea.categoria}>
              <Linea linea={linea} />
            </li>
          ))}
        </ul>
      )}

      <NuevoPresupuesto mes={mes} />
    </>
  );
}

/** Una categoría con su barra: verde, ámbar o rojo según cuánto lleven gastado. */
function Linea({ linea }: { linea: LineaPresupuesto }) {
  return (
    <div className="glass rounded-lg p-4">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-semibold">{linea.categoria}</span>
        <span className="text-sm">
          <span className="font-semibold">{soles(linea.gastado)}</span>
          <span className="text-muted-foreground">
            {" "}
            / {soles(linea.presupuestado)}
          </span>
        </span>
      </div>

      <div
        className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-label={`${linea.categoria}: gastado ${linea.gastado} de ${linea.presupuestado} soles`}
        aria-valuenow={Math.round(linea.proporcion * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          data-estado={linea.estado}
          className="h-full rounded-full bg-primary data-[estado=ajustado]:bg-secondary data-[estado=excedido]:bg-destructive"
          style={{ width: `${Math.min(linea.proporcion, 1) * 100}%` }}
        />
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        {linea.restante >= 0
          ? `Quedan ${soles(linea.restante)}`
          : `Te pasaste ${soles(-linea.restante)}`}
      </p>
    </div>
  );
}
