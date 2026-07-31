import Link from "next/link";
import { requirePersona } from "@/lib/sesion";
import { listarRecurrentes } from "@/lib/datos";
import { NOMBRES } from "@/lib/persona";
import { soles } from "@/lib/finanzas";
import { NuevoRecurrente } from "./formulario";

export default async function RecurrentesPage() {
  const persona = await requirePersona();
  const recurrentes = await listarRecurrentes();

  const activos = recurrentes.filter((r) => r.activo);
  const mensual = activos.reduce((suma, r) => suma + r.monto, 0);

  return (
    <>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Recurrentes</h1>
        <Link
          href="/ajustes"
          aria-label="Volver"
          className="glass flex size-9 items-center justify-center rounded-full text-sm text-muted-foreground"
        >
          ✕
        </Link>
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
              className="glass rounded-lg p-4 data-[activo=false]:opacity-50"
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="truncate text-sm font-semibold">
                  {r.descripcion}
                </span>
                <span className="shrink-0 text-sm font-semibold">
                  {soles(r.monto)}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {r.categoria} · paga {NOMBRES[r.pagado_por]} · día {r.dia}
                {!r.activo && " · pausado"}
              </p>
            </li>
          ))}
        </ul>
      )}

      <NuevoRecurrente persona={persona} />
    </>
  );
}
