import { requirePersona } from "@/lib/sesion";
import { categoriasUsadas, resumenDelMes } from "@/lib/datos";
import {
  nombreMes,
  soles,
  type LineaPresupuesto,
  type ResumenPresupuesto,
} from "@/lib/finanzas";
import { NuevoPresupuesto } from "./formularios";

/**
 * El presupuesto no se reparte sobre los ingresos: los topes se acuerdan de
 * antemano y se mantienen. Así que la pantalla contesta, en este orden:
 *
 *   1. ¿Estoy cumpliendo?      → el titular
 *   2. ¿En qué me estoy pasando? → lo excedido, arriba y en rojo
 *   3. ¿Qué ajusto?            → cada categoría con su tope a mano
 *
 * Asignar un tope va justo debajo del titular, no al final: con muchas
 * categorías la lista se alarga y ese botón quedaba fuera de la pantalla.
 */
export default async function PresupuestoPage() {
  await requirePersona();
  const [{ mes, lineas, presupuesto, topesHeredados }, categorias] =
    await Promise.all([resumenDelMes(), categoriasUsadas()]);

  const sinTopes = presupuesto.estado === "sin-topes";

  return (
    <>
      <h1 className="text-2xl font-extrabold">Presupuesto</h1>
      <p className="mt-1.5 mb-6 text-sm text-muted-foreground">
        {nombreMes(mes)}
        {topesHeredados && " · topes de siempre"}
      </p>

      {sinTopes ? <SinTopes /> : <Titular presupuesto={presupuesto} />}

      <div className="mt-3">
        <NuevoPresupuesto mes={mes} categorias={categorias} />
      </div>

      {presupuesto.excedidas.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2.5 text-[11px] font-bold tracking-[0.06em] text-over uppercase">
            Hay que ajustar
          </h2>
          <ul className="flex flex-col gap-2.5">
            {presupuesto.excedidas.map((linea) => (
              <li key={linea.categoria}>
                <Linea linea={linea} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {lineas.length > presupuesto.excedidas.length && (
        <section className="mt-6">
          <h2 className="mb-2.5 text-[11px] font-bold tracking-[0.06em] text-muted-foreground uppercase">
            {presupuesto.excedidas.length > 0 ? "El resto" : "Por categoría"}
          </h2>
          <ul className="flex flex-col gap-2.5">
            {lineas
              .filter((l) => !presupuesto.excedidas.includes(l))
              .map((linea) => (
                <li key={linea.categoria}>
                  <Linea linea={linea} />
                </li>
              ))}
          </ul>
        </section>
      )}
    </>
  );
}

function SinTopes() {
  return (
    <div className="glass rounded-xl p-5">
      <p className="text-[11px] font-bold tracking-[0.06em] text-muted-foreground uppercase">
        Sin topes todavía
      </p>
      <p className="mt-2 text-[17px] leading-snug font-bold">
        Pónganse un máximo por categoría
      </p>
      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
        Lo que acuerden aquí vale también los meses siguientes. A partir de ahí
        la app avisa en qué se están pasando.
      </p>
    </div>
  );
}

/** ¿Cumplimos? Lo primero y en grande. */
function Titular({ presupuesto }: { presupuesto: ResumenPresupuesto }) {
  const { tope, gastado, restante, estado, resumen } = presupuesto;
  const proporcion = tope > 0 ? Math.min(gastado / tope, 1) : 0;

  return (
    <section className="glass rounded-xl p-5">
      <p className="text-[11px] font-bold tracking-[0.06em] text-muted-foreground uppercase">
        {restante >= 0 ? "Te queda" : "Te pasaste"}
      </p>
      <p
        data-estado={estado}
        className="mt-1.5 text-[30px] font-extrabold tracking-[-0.5px] data-[estado=ajustado]:text-warn data-[estado=excedido]:text-over"
      >
        {soles(Math.abs(restante))}
      </p>
      <p className="mt-1.5 text-xs text-muted-foreground">{resumen}</p>

      <div
        className="mt-5 h-2.5 overflow-hidden rounded-full bg-muted"
        role="img"
        aria-label={`Llevas ${soles(gastado)} gastados de ${soles(tope)} presupuestados`}
      >
        <div
          data-estado={estado}
          className="barra h-full rounded-full bg-ok data-[estado=ajustado]:bg-warn data-[estado=excedido]:bg-over"
          style={{ width: `${proporcion * 100}%` }}
        />
      </div>

      <dl className="mt-4 flex gap-8 text-xs">
        <div>
          <dt className="text-muted-foreground">Gastado</dt>
          <dd className="mt-1 font-semibold">{soles(gastado)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Tope acordado</dt>
          <dd className="mt-1 font-semibold">{soles(tope)}</dd>
        </div>
      </dl>
    </section>
  );
}

/** Una categoría con su tope: cuánto va, cuánto queda y si hay que frenar. */
function Linea({ linea }: { linea: LineaPresupuesto }) {
  const sinTope = linea.presupuestado === 0;

  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-baseline justify-between gap-3">
        <span className="min-w-0 flex-1 truncate text-sm font-semibold">
          {linea.categoria}
        </span>
        <span className="shrink-0 text-sm">
          <span className="font-semibold">{soles(linea.gastado)}</span>
          {!sinTope && (
            <span className="text-muted-foreground">
              {" "}
              / {soles(linea.presupuestado)}
            </span>
          )}
        </span>
      </div>

      {sinTope ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Sin tope: no entra en la cuenta. Ponle uno para controlarlo.
        </p>
      ) : (
        <>
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
              className="barra h-full rounded-full bg-ok data-[estado=ajustado]:bg-warn data-[estado=excedido]:bg-over"
              style={{ width: `${Math.min(linea.proporcion, 1) * 100}%` }}
            />
          </div>

          <p className="mt-2 flex items-baseline justify-between text-xs">
            <span className="text-muted-foreground">
              {linea.restante >= 0
                ? `Quedan ${soles(linea.restante)}`
                : `${soles(-linea.restante)} de más`}
            </span>
            <span
              data-estado={linea.estado}
              className="font-semibold text-ok data-[estado=ajustado]:text-warn data-[estado=excedido]:text-over"
            >
              {Math.round(linea.proporcion * 100)} %
            </span>
          </p>
        </>
      )}
    </div>
  );
}
