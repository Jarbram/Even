import { BotonCerrar } from "@/components/navegacion";
import { requirePersona } from "@/lib/sesion";
import { categoriasUsadas, listarRecurrentes } from "@/lib/datos";
import { NOMBRES } from "@/lib/persona";
import { soles } from "@/lib/finanzas";
import { BotonBorrar } from "@/components/boton-borrar";
import { activarRecurrente, borrarRecurrente } from "../acciones";
import { NuevoRecurrente } from "./formulario";

export default async function RecurrentesPage() {
  const persona = await requirePersona();
  const [recurrentes, categorias] = await Promise.all([
    listarRecurrentes(),
    categoriasUsadas(),
  ]);

  const activos = recurrentes.filter((r) => r.activo);
  const mensual = activos.reduce((suma, r) => suma + r.monto, 0);

  return (
    <>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Recurrentes</h1>
        <BotonCerrar href="/ajustes" label="Volver" />
      </div>

      <div className="glass mb-6 rounded-xl p-5">
        <p className="text-[11px] font-bold tracking-[0.06em] text-muted-foreground uppercase">
          Fijo cada mes
        </p>
        <p className="mt-1 text-[30px] font-extrabold tracking-[-0.5px]">
          {soles(mensual)}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Se registran solos al abrir el mes, una sola vez cada uno.
        </p>
      </div>

      {recurrentes.length === 0 ? (
        <p className="glass mb-2.5 rounded-lg p-4 text-sm text-muted-foreground">
          Sin gastos recurrentes. El alquiler y los servicios son los típicos.
        </p>
      ) : (
        <ul className="mb-2.5 flex flex-col gap-2">
          {recurrentes.map((r) => (
            <li
              key={r.id}
              data-activo={r.activo}
              className="glass rounded-lg p-4 data-[activo=false]:opacity-60"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                  {r.descripcion}
                </span>
                <span className="shrink-0 text-sm font-semibold">
                  {soles(r.monto)}
                </span>
                <BotonBorrar
                  accion={borrarRecurrente.bind(null, r.id)}
                  que="el recurrente"
                  etiqueta={r.descripcion}
                />
              </div>

              <div className="mt-1 flex items-center justify-between gap-3">
                <p className="min-w-0 flex-1 truncate text-[11px] text-muted-foreground">
                  {r.categoria} · paga {NOMBRES[r.pagado_por]} · día {r.dia}
                  {!r.activo && " · pausado"}
                </p>

                {/*
                  Pausar en vez de borrar: un Netflix que se da de baja unos
                  meses no debería perder su configuración, y borrarlo dejaría
                  además los gastos ya creados sin su origen.
                */}
                <form action={activarRecurrente}>
                  <input type="hidden" name="id" value={r.id} />
                  <input
                    type="hidden"
                    name="activo"
                    value={r.activo ? "false" : "true"}
                  />
                  <button
                    type="submit"
                    className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    {r.activo ? "Pausar" : "Reanudar"}
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}

      <NuevoRecurrente persona={persona} categorias={categorias} />
    </>
  );
}
