import { requirePersona } from "@/lib/sesion";
import { resumenDelMes } from "@/lib/datos";
import { NOMBRES } from "@/lib/persona";
import { claseColor } from "@/lib/cuentas";
import { mesActual, nombreMes, soles } from "@/lib/finanzas";
import { BotonCerrar } from "@/components/navegacion";
import { BotonBorrar } from "@/components/boton-borrar";
import { borrarIngreso } from "../acciones";
import { FormularioIngreso } from "./formulario-ingreso";

/**
 * Registrar y revisar en la misma pantalla. Al sacar los ingresos de
 * presupuesto se podían cargar pero no ver: un sueldo mal tecleado no había
 * forma de encontrarlo, y menos de corregirlo.
 */
export default async function IngresosPage() {
  const persona = await requirePersona();
  const mes = mesActual();
  const { ingresos, ingresosTotal, cuentas, fondos } =
    await resumenDelMes(mes);

  return (
    <>
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Ingresos</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {nombreMes(mes)}
          </p>
        </div>
        <BotonCerrar href="/" />
      </div>

      {ingresos.length > 0 && (
        <>
          <div className="glass mb-6 rounded-xl p-5">
            <p className="text-[11px] font-bold tracking-[0.06em] text-muted-foreground uppercase">
              Entró este mes
            </p>
            <p className="mt-1.5 text-[30px] font-extrabold tracking-[-0.5px] text-primary">
              {soles(ingresosTotal)}
            </p>
          </div>

          <ul className="mb-8 flex flex-col gap-2">
            {ingresos.map((ingreso) => (
              <li
                key={ingreso.id}
                className="glass flex items-center gap-3 rounded-lg px-4 py-3"
              >
                <span
                  aria-hidden
                  className={`size-2 shrink-0 rounded-full ${
                    ingreso.fondos
                      ? "bg-primary"
                      : claseColor(ingreso.cuentas?.color)
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {ingreso.descripcion}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {NOMBRES[ingreso.persona]}
                    {ingreso.fondos && ` · al ahorro ${ingreso.fondos.nombre}`}
                    {ingreso.cuentas && ` · a ${ingreso.cuentas.nombre}`}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold">
                  {soles(ingreso.monto)}
                </span>
                <BotonBorrar
                  accion={borrarIngreso.bind(null, ingreso.id)}
                  que="el ingreso"
                  etiqueta={`${ingreso.descripcion}, ${soles(ingreso.monto)}`}
                />
              </li>
            ))}
          </ul>

          <h2 className="mb-4 text-[11px] font-bold tracking-[0.06em] text-muted-foreground uppercase">
            Añadir otro
          </h2>
        </>
      )}

      <FormularioIngreso
        persona={persona}
        mes={mes}
        cuentas={cuentas}
        fondos={fondos}
      />
    </>
  );
}
