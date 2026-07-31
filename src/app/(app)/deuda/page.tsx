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
  const sinHistorial = gastos.length === 0 && movimientos.length === 0;

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

      {/* Deber algo es indigo lleno; estar en paz es una superficie tranquila.
          La clase se decide aquí y no con variantes `data-*`: son dos fondos
          distintos peleándose por el mismo elemento, y en JavaScript se lee de
          un vistazo cuál gana. */}
      <section
        className={`mb-8 rounded-xl p-5 ${
          deuda.deudor
            ? "bg-secondary text-secondary-foreground"
            : "glass text-foreground"
        }`}
      >
        <p className="text-[11px] font-bold tracking-[0.06em] uppercase opacity-70">
          {deuda.deudor
            ? `${NOMBRES[deuda.deudor]} debe`
            : sinHistorial
              ? "Aún sin movimientos"
              : "Cuenta saldada"}
        </p>
        <p className="mt-1.5 text-[34px] leading-none font-extrabold tracking-[-1px]">
          {deuda.deudor ? soles(deuda.monto) : "Están en paz"}
        </p>
        {deuda.acreedor ? (
          <p className="mt-2.5 text-xs opacity-80">
            a {NOMBRES[deuda.acreedor]}
            {deuda.deudor === persona && " · te toca a ti"}
          </p>
        ) : (
          <p className="mt-2.5 text-xs text-muted-foreground">
            {sinHistorial
              ? "Cada gasto compartido irá moviendo esta cuenta sola."
              : "Todo lo que se debían está pagado."}
          </p>
        )}
      </section>

      {/* La pantalla vacía es justo donde se viene a entender el mecanismo:
          la deuda cruzada es lo que justifica la app frente a un Excel, y sin
          un gasto todavía no hay nada que la enseñe. */}
      {sinHistorial && (
        <section className="glass mb-8 rounded-xl p-5">
          <h2 className="text-sm font-semibold">Cómo se lleva la cuenta</h2>
          <ol className="mt-3 flex flex-col gap-2.5 text-xs leading-relaxed text-muted-foreground">
            <li>
              <span className="font-semibold text-foreground">
                No se apunta a mano.
              </span>{" "}
              Sale sola de los gastos: quien paga algo que era de los dos queda
              a favor por la mitad.
            </li>
            <li>
              <span className="font-semibold text-foreground">
                Se compensa entre sí.
              </span>{" "}
              Si uno paga el mercado y el otro la luz, las dos deudas se restan
              y queda una sola cifra.
            </li>
            <li>
              <span className="font-semibold text-foreground">
                Se cierra cuando se paga.
              </span>{" "}
              Al pasarle el dinero al otro, se registra aquí y la cuenta vuelve
              a cero.
            </li>
          </ol>
        </section>
      )}

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

      {/* La explicación y la leyenda solo cuando hay algo que explicar: antes
          salían sobre una lista vacía, describiendo un código de color que no
          aparecía por ninguna parte. */}
      {relevantes.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-1 text-[11px] font-bold tracking-[0.06em] text-muted-foreground uppercase">
            De dónde sale
          </h2>
          <p className="mb-3.5 text-xs leading-relaxed text-muted-foreground">
            Los gastos que uno pagó y al otro le tocaba en parte. Los que van a
            medias y paga cada uno lo suyo no aparecen: no mueven nada.
          </p>

          <ul className="flex flex-col gap-2">
            {relevantes.map((g) => {
              const favorece = g.efecto > 0 ? "abraham" : "isabel";
              return (
                <li
                  key={g.id}
                  className="glass flex items-center gap-3 rounded-lg px-4 py-3"
                >
                  <span
                    aria-hidden
                    data-favor={favorece}
                    className="size-2 shrink-0 rounded-full bg-primary data-[favor=isabel]:bg-chart-6"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {g.descripcion}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {soles(g.monto)} · pagó {NOMBRES[g.pagado_por]} ·{" "}
                      {DIA_MES.format(new Date(`${g.fecha}T00:00:00Z`))}
                    </p>
                  </div>
                  {/* El signo va en el sentido de a quién favorece, y el texto
                      lo dice con palabras: el color solo no basta. */}
                  <span className="shrink-0 text-right">
                    <span
                      data-favor={favorece}
                      className="block text-sm font-semibold text-primary data-[favor=isabel]:text-chart-6"
                    >
                      {soles(Math.abs(g.efecto))}
                    </span>
                    <span className="block text-[11px] text-muted-foreground">
                      para {NOMBRES[favorece]}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

    </>
  );
}
