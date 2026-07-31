import Link from "next/link";
import { BotonCerrar } from "@/components/navegacion";
import { requirePersona } from "@/lib/sesion";
import { resumenDelMes } from "@/lib/datos";
import { ahorroPorPagarMas, simularDeuda, soles } from "@/lib/finanzas";
import { BotonBorrar } from "@/components/boton-borrar";
import { borrarDeuda } from "../acciones";
import { NuevaDeuda } from "./formulario";

/** Cuánto más al mes se puede simular. Pasos redondos, que es como se piensa. */
const EXTRAS = [0, 100, 200, 500];

export default async function DeudasPage({
  searchParams,
}: {
  searchParams: Promise<{ extra?: string }>;
}) {
  await requirePersona();
  const { extra: crudo } = await searchParams;
  const extra = EXTRAS.includes(Number(crudo)) ? Number(crudo) : 0;

  const { deudas } = await resumenDelMes();
  const total = deudas.reduce((suma, d) => suma + d.saldo, 0);

  return (
    <>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Deudas</h1>
        <BotonCerrar href="/ajustes" label="Volver" />
      </div>

      <div className="mb-6 rounded-xl bg-secondary p-5 text-secondary-foreground">
        <p className="text-[11px] font-bold tracking-[0.06em] uppercase opacity-70">
          Deben en total
        </p>
        <p className="mt-1 text-[30px] font-extrabold tracking-[-0.5px]">
          {soles(total)}
        </p>
      </div>

      {deudas.length > 0 && (
        <>
          <p className="mb-2.5 text-[11px] font-bold tracking-[0.06em] text-muted-foreground uppercase">
            ¿Y si pagamos más al mes?
          </p>
          <nav
            aria-label="Pago adicional"
            className="glass mb-5 flex rounded-full p-1 text-[13px]"
          >
            {EXTRAS.map((valor) => (
              <Link
                key={valor}
                href={valor ? `/deudas?extra=${valor}` : "/deudas"}
                aria-current={valor === extra ? "page" : undefined}
                data-activo={valor === extra}
                className="flex-1 rounded-full py-2 text-center font-medium text-muted-foreground data-[activo=true]:bg-primary data-[activo=true]:font-semibold data-[activo=true]:text-primary-foreground"
              >
                {valor === 0 ? "Tal cual" : `+${valor}`}
              </Link>
            ))}
          </nav>
        </>
      )}

      {deudas.length === 0 ? (
        <p className="glass mb-2.5 rounded-lg p-4 text-sm text-muted-foreground">
          Sin deudas registradas. Que siga así.
        </p>
      ) : (
        <ul className="mb-2.5 flex flex-col gap-2.5">
          {deudas.map((deuda) => {
            const simulacion = simularDeuda(deuda, extra);
            const ahorro = extra ? ahorroPorPagarMas(deuda, extra) : null;

            return (
              <li key={deuda.id} className="glass rounded-xl p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                    {deuda.nombre}
                  </span>
                  <span className="shrink-0 text-lg font-extrabold">
                    {soles(deuda.saldo)}
                  </span>
                  <BotonBorrar
                    accion={borrarDeuda.bind(null, deuda.id)}
                    que="la deuda"
                    etiqueta={deuda.nombre}
                  />
                </div>

                <p className="mt-1 text-[11px] text-muted-foreground">
                  {soles(deuda.pago_mensual)}/mes
                  {extra > 0 && ` (+${soles(extra)})`} · {deuda.tasa_anual} %
                  anual
                </p>

                <p
                  data-impagable={simulacion.meses === null}
                  className="mt-3 text-sm font-semibold data-[impagable=true]:text-destructive"
                >
                  {simulacion.resumen}
                </p>

                {ahorro?.mesesMenos ? (
                  <p className="mt-1.5 text-xs text-primary">
                    {ahorro.resumen}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      <NuevaDeuda />
    </>
  );
}
