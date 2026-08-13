import { notFound } from "next/navigation";
import { requirePersona } from "@/lib/sesion";
import { detalleCuenta, listarCuentas } from "@/lib/datos";
import { NOMBRES } from "@/lib/persona";
import { TIPOS_CUENTA, claseColor, leerSaldo } from "@/lib/cuentas";
import { redondear, soles } from "@/lib/finanzas";
import { BotonCerrar } from "@/components/navegacion";
import { BotonBorrar } from "@/components/boton-borrar";
import { borrarCuenta, borrarPagoTarjeta, borrarReembolso } from "../../acciones";
import { PagarTarjeta } from "./formulario";

const DIA_MES = new Intl.DateTimeFormat("es-PE", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

export default async function CuentaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePersona();
  const { id } = await params;

  const [{ cuenta, gastos, pagos, traspasos }, todas] = await Promise.all([
    detalleCuenta(id),
    listarCuentas(),
  ]);

  if (!cuenta) notFound();

  const saldo = leerSaldo(cuenta);
  const gastadoTotal = redondear(gastos.reduce((s, g) => s + g.monto, 0));
  const pagadoTotal = redondear(pagos.reduce((s, p) => s + p.monto, 0));

  // Lo que ya venía consumido antes de usar la app. No tiene gastos detrás
  // —ni categoría, ni fecha— porque ocurrió fuera, y sin decirlo la pantalla
  // parece que se hubieran perdido gastos.
  const arrastre = redondear(Math.max(-cuenta.saldo_base, 0));
  // De dónde puede salir el pago: cualquier cuenta menos ella misma.
  const origenes = todas.filter((c) => c.id !== cuenta.id && c.activa);

  return (
    <>
      <div className="mb-6 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              className={`size-2.5 shrink-0 rounded-full ${claseColor(cuenta.color)}`}
            />
            <h1 className="truncate text-2xl font-extrabold">{cuenta.nombre}</h1>
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {TIPOS_CUENTA[cuenta.tipo]} · {NOMBRES[cuenta.persona]}
          </p>
        </div>
        <BotonCerrar href="/ajustes" label="Volver" />
      </div>

      <section
        className={`mb-8 rounded-xl p-5 ${
          saldo.esCredito
            ? "bg-secondary text-secondary-foreground"
            : "glass text-foreground"
        }`}
      >
        <p className="text-[11px] font-bold tracking-[0.06em] uppercase opacity-70">
          {saldo.etiqueta}
        </p>
        <p
          data-negativo={!saldo.esCredito && saldo.principal < 0}
          className="mt-1.5 text-[34px] leading-none font-extrabold tracking-[-1px] data-[negativo=true]:text-destructive"
        >
          {soles(saldo.principal)}
        </p>

        {saldo.esCredito && cuenta.linea && (
          <>
            <div
              className="mt-5 h-2.5 overflow-hidden rounded-full bg-white/20"
              role="img"
              aria-label={`${soles(saldo.consumido)} consumidos de una línea de ${soles(cuenta.linea)}`}
            >
              <div
                className="barra h-full rounded-full bg-primary"
                style={{ width: `${saldo.proporcion * 100}%` }}
              />
            </div>
            <dl className="mt-4 flex gap-8 text-xs">
              <div>
                <dt className="opacity-70">Consumido</dt>
                <dd className="mt-1 font-semibold">{soles(saldo.consumido)}</dd>
              </div>
              <div>
                <dt className="opacity-70">Línea</dt>
                <dd className="mt-1 font-semibold">{soles(cuenta.linea)}</dd>
              </div>
            </dl>

            {/* De dónde sale el consumo, para que un arrastre sin gastos
                detrás no parezca que la app perdió algo. */}
            {arrastre > 0 && (
              <ul className="mt-4 space-y-1 border-t border-white/15 pt-3 text-[11px] opacity-80">
                <li className="flex justify-between gap-3">
                  <span>Ya venía consumido</span>
                  <span className="font-semibold">{soles(arrastre)}</span>
                </li>
                {gastadoTotal > 0 && (
                  <li className="flex justify-between gap-3">
                    <span>Gastos registrados aquí</span>
                    <span className="font-semibold">
                      {soles(gastadoTotal)}
                    </span>
                  </li>
                )}
                {pagadoTotal > 0 && (
                  <li className="flex justify-between gap-3">
                    <span>Pagado</span>
                    <span className="font-semibold">−{soles(pagadoTotal)}</span>
                  </li>
                )}
              </ul>
            )}
          </>
        )}
      </section>

      {saldo.esCredito && (
        <PagarTarjeta
          tarjetaId={cuenta.id}
          consumido={saldo.consumido}
          origenes={origenes}
        />
      )}

      {pagos.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-[11px] font-bold tracking-[0.06em] text-muted-foreground uppercase">
            Pagos de la tarjeta
          </h2>
          <ul className="flex flex-col gap-2">
            {pagos.map((pago) => (
              <li
                key={pago.id}
                className="glass flex items-center gap-3 rounded-lg px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {DIA_MES.format(new Date(`${pago.fecha}T00:00:00Z`))}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {pago.desde ? `desde ${pago.desde.nombre}` : "origen sin indicar"}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-primary">
                  {soles(pago.monto)}
                </span>
                <BotonBorrar
                  accion={borrarPagoTarjeta.bind(null, pago.id)}
                  que="el pago"
                  etiqueta={`pago de ${soles(pago.monto)}`}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {traspasos.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-[11px] font-bold tracking-[0.06em] text-muted-foreground uppercase">
            Traspasos
          </h2>
          <ul className="flex flex-col gap-2">
            {traspasos.map((traspaso) => {
              const esSalida = traspaso.desde_cuenta_id === cuenta.id;
              return (
                <li
                  key={traspaso.id}
                  className="glass flex items-center gap-3 rounded-lg px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {esSalida
                        ? `hacia ${traspaso.hacia?.nombre ?? "otra cuenta"}`
                        : `desde ${traspaso.desde?.nombre ?? "otra cuenta"}`}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {DIA_MES.format(new Date(`${traspaso.fecha}T00:00:00Z`))}
                    </p>
                  </div>
                  <span
                    data-negativo={esSalida}
                    className="shrink-0 text-sm font-semibold text-primary data-[negativo=true]:text-destructive"
                  >
                    {esSalida ? "−" : "+"}
                    {soles(traspaso.monto)}
                  </span>
                  <BotonBorrar
                    accion={borrarReembolso.bind(null, traspaso.id)}
                    que="el traspaso"
                    etiqueta={`de ${soles(traspaso.monto)}`}
                  />
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="mt-8">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="text-[11px] font-bold tracking-[0.06em] text-muted-foreground uppercase">
            Gastos con esta cuenta
          </h2>
          {gastos.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {soles(gastadoTotal)}
            </span>
          )}
        </div>

        {gastos.length === 0 ? (
          <p className="glass rounded-lg p-4 text-sm leading-relaxed text-muted-foreground">
            {arrastre > 0
              ? `Todavía nada. Los ${soles(arrastre)} que ya venías debiendo son de antes de usar la app, así que no tienen categoría ni cuentan contra el presupuesto de este mes — pero sí ocupan tu línea.`
              : "Todavía no se ha pagado nada con esta cuenta."}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {gastos.map((gasto) => (
              <li
                key={gasto.id}
                className="glass flex items-center gap-3 rounded-lg px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {gasto.descripcion}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {gasto.categoria} · {NOMBRES[gasto.pagado_por]} ·{" "}
                    {DIA_MES.format(new Date(`${gasto.fecha}T00:00:00Z`))}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold">
                  {soles(gasto.monto)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-10 border-t border-border pt-6">
        <div className="glass flex items-center gap-3 rounded-lg p-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Borrar esta cuenta</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Los {gastos.length === 1 ? "gasto" : "gastos"} hechos con ella se
              quedan, pero pierden a qué cuenta iban.
            </p>
          </div>
          <BotonBorrar
            accion={borrarCuenta.bind(null, cuenta.id)}
            que="la cuenta"
            etiqueta={cuenta.nombre}
          />
        </div>
      </div>
    </>
  );
}
