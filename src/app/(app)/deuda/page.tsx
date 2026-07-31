import { requirePersona } from "@/lib/sesion";
import { gastosParaDeuda, transferencias } from "@/lib/datos";
import { NOMBRES, laOtra } from "@/lib/persona";
import { deudaCruzada, redondear, soles } from "@/lib/finanzas";
import { BotonCerrar } from "@/components/navegacion";
import { BotonBorrar } from "@/components/boton-borrar";
import { borrarTransferencia } from "../acciones";
import { NuevaTransferencia } from "./formulario";

const DIA_MES = new Intl.DateTimeFormat("es-PE", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

/**
 * Lo que se deben, de dónde sale y cómo se salda.
 *
 * La deuda no se apunta a mano: se calcula de los gastos, que es justamente lo
 * que un Excel hace peor. Lo que sí se registra es el dinero que pasa de uno al
 * otro — saldar o prestar—, porque sin eso la cuenta solo crece y en tres meses
 * el número deja de ser creíble.
 */
export default async function DeudaPage() {
  const persona = await requirePersona();
  const [gastos, movimientos] = await Promise.all([
    gastosParaDeuda(),
    transferencias(),
  ]);

  const deuda = deudaCruzada(gastos, movimientos);

  // Solo los gastos que mueven la aguja: los repartidos a medias y pagados por
  // igual no cambian nada y llenarían la lista de ruido.
  const relevantes = gastos
    .map((g) => {
      const puso = g.pagado_por === "abraham" ? g.monto : 0;
      return { ...g, efecto: redondear(puso - g.monto * g.parte_abraham) };
    })
    .filter((g) => Math.abs(g.efecto) >= 0.01)
    .slice(0, 12);

  return (
    <>
      <div className="mb-6 flex items-start justify-between gap-3">
        <h1 className="text-2xl font-extrabold">Entre nosotros</h1>
        <BotonCerrar href="/" />
      </div>

      <section
        data-enPaz={deuda.deudor === null}
        className="mb-8 rounded-xl bg-secondary p-5 text-secondary-foreground data-[enPaz=true]:bg-transparent data-[enPaz=true]:glass"
      >
        <p className="text-[11px] font-bold tracking-[0.06em] uppercase opacity-70">
          {deuda.deudor ? `${NOMBRES[deuda.deudor]} debe` : "Cuenta saldada"}
        </p>
        <p className="mt-1.5 text-[34px] leading-none font-extrabold tracking-[-1px]">
          {deuda.deudor ? soles(deuda.monto) : "Están en paz"}
        </p>
        {deuda.acreedor && (
          <p className="mt-2.5 text-xs opacity-80">
            a {NOMBRES[deuda.acreedor]}
            {deuda.deudor === persona && " · te toca a ti"}
          </p>
        )}
      </section>

      <NuevaTransferencia persona={persona} deuda={deuda} />

      {movimientos.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-[11px] font-bold tracking-[0.06em] text-muted-foreground uppercase">
            Pagos y préstamos
          </h2>
          <ul className="flex flex-col gap-2">
            {movimientos.map((m) => (
              <li
                key={m.id}
                className="glass flex items-center gap-3 rounded-lg px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {m.tipo === "liquidacion"
                      ? `${NOMBRES[m.de_persona]} pagó a ${NOMBRES[laOtra(m.de_persona)]}`
                      : `${NOMBRES[m.de_persona]} prestó a ${NOMBRES[laOtra(m.de_persona)]}`}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {DIA_MES.format(new Date(`${m.fecha}T00:00:00Z`))}
                    {m.concepto && ` · ${m.concepto}`}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold">
                  {soles(m.monto)}
                </span>
                <BotonBorrar
                  accion={borrarTransferencia.bind(null, m.id)}
                  que="el movimiento"
                  etiqueta={`${NOMBRES[m.de_persona]}, ${soles(m.monto)}`}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8">
        <h2 className="mb-1 text-[11px] font-bold tracking-[0.06em] text-muted-foreground uppercase">
          De dónde sale
        </h2>
        <p className="mb-3 text-xs text-muted-foreground">
          Los gastos que uno pagó y al otro le tocaba en parte. Los que van
          a medias y paga cada uno lo suyo no aparecen: no mueven nada.
        </p>

        {relevantes.length === 0 ? (
          <p className="glass rounded-lg p-4 text-sm text-muted-foreground">
            Todavía no hay gastos que generen deuda.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {relevantes.map((g) => (
              <li
                key={g.id}
                className="glass flex items-center gap-3 rounded-lg px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {g.descripcion}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {soles(g.monto)} · pagó {NOMBRES[g.pagado_por]} ·{" "}
                    {DIA_MES.format(new Date(`${g.fecha}T00:00:00Z`))}
                  </p>
                </div>
                {/* A favor de quien puso de más, en su propio sentido. */}
                <span
                  data-favor={g.efecto > 0 ? "abraham" : "isabel"}
                  className="shrink-0 text-sm font-semibold text-primary data-[favor=isabel]:text-chart-6"
                >
                  {g.efecto > 0 ? "+" : "−"}
                  {soles(Math.abs(g.efecto)).replace("S/", "")}
                </span>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-3 text-[11px] text-muted-foreground">
          <span className="font-semibold text-primary">Lima</span> a favor de{" "}
          {NOMBRES.abraham} ·{" "}
          <span className="font-semibold text-chart-6">rosa</span> a favor de{" "}
          {NOMBRES.isabel}
        </p>
      </section>
    </>
  );
}
