import { NOMBRES } from "@/lib/persona";
import { claseColor, type CuentaRow } from "@/lib/cuentas";
import { soles } from "@/lib/finanzas";
import type { GastoRow } from "@/lib/datos";
import { BotonBorrar } from "@/components/boton-borrar";
import { EditarGasto } from "@/components/editar-gasto";
import { ToggleReembolsar } from "@/components/toggle-reembolsar";
import { borrarGasto } from "@/app/(app)/acciones";

/** Fecha corta del diseño: "24 jul". */
const DIA_MES = new Intl.DateTimeFormat("es-PE", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

/** Una línea de gasto: punto de color de la cuenta, qué fue, quién y cuánto. */
export function FilaGasto({
  gasto,
  borrable,
  conFecha = true,
  categorias,
  cuentas,
  descripciones,
}: {
  gasto: GastoRow;
  /** Solo donde se van a revisar y corregir gastos, no en el resumen de inicio. */
  borrable?: boolean;
  /** `false` cuando la fila ya vive bajo una cabecera con la fecha. */
  conFecha?: boolean;
  /** Junto con `cuentas` y `descripciones`, solo hace falta donde
      `borrable` habilita editar. */
  categorias?: string[];
  cuentas?: CuentaRow[];
  descripciones?: string[];
}) {
  return (
    <div className="panel flex items-center gap-3 rounded-lg px-4 py-3">
      <span
        aria-hidden
        className={`size-2 shrink-0 rounded-full ${claseColor(gasto.cuentas?.color)}`}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{gasto.descripcion}</p>
        <p className="truncate text-[11px] text-muted-foreground">
          {gasto.categoria} · {NOMBRES[gasto.pagado_por]}
          {conFecha && ` · ${DIA_MES.format(new Date(`${gasto.fecha}T00:00:00Z`))}`}
          {gasto.cuentas && ` · ${gasto.cuentas.nombre}`}
          {gasto.a_reembolsar && (
            // Azul, el color de "pendiente entre los dos" en toda la app —
            // no el naranja de marca, que es para acciones, no para deuda.
            <span className="font-semibold text-chart-4"> · Por cobrar</span>
          )}
        </p>
      </div>
      <span className="shrink-0 text-sm font-semibold">{soles(gasto.monto)}</span>
      {borrable && (
        <>
          <ToggleReembolsar
            id={gasto.id}
            activo={gasto.a_reembolsar}
            etiqueta={`${gasto.descripcion}, ${soles(gasto.monto)}`}
          />
          {categorias && cuentas && descripciones && (
            <EditarGasto
              gasto={gasto}
              categorias={categorias}
              cuentas={cuentas}
              descripciones={descripciones}
            />
          )}
          <BotonBorrar
            accion={borrarGasto.bind(null, gasto.id)}
            que="el gasto"
            etiqueta={`${gasto.descripcion}, ${soles(gasto.monto)}`}
          />
        </>
      )}
    </div>
  );
}
