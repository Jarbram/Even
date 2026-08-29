import { ChevronDown, CircleCheck, CircleDashed, OctagonAlert, TriangleAlert } from "lucide-react";
import { soles, type LineaPresupuesto } from "@/lib/finanzas";

const ICONO_ESTADO: Record<LineaPresupuesto["estado"], typeof CircleCheck> = {
  ok: CircleCheck,
  ajustado: TriangleAlert,
  excedido: OctagonAlert,
};

const CLASE_ESTADO: Record<LineaPresupuesto["estado"], string> = {
  ok: "text-ok",
  ajustado: "text-warn",
  excedido: "text-over",
};

export type GastoResumen = {
  id: string;
  descripcion: string;
  monto: number;
};

/**
 * Una categoría con su barra —cuánto del tope, de un vistazo— y un ícono
 * de forma distinta por estado, no solo color: antes el aro y la barra
 * decían el mismo porcentaje dos veces en la misma tarjeta, y el estado se
 * distinguía solo por el tinte. Ahora un ✓, un ▲ o un ⛔ dicen "vas bien",
 * "cuidado" o "te pasaste" incluso sin ver el color.
 *
 * Desplegable: adentro, sus últimos gastos y lo que se le pase como hijo (en
 * Presupuesto, el formulario para subir o bajar el tope; en el Home, nada
 * más). El mismo lenguaje visual en las dos pantallas, para que aprenderlo
 * en una sirva en la otra — solo cambia el tamaño, no la forma.
 */
export function TarjetaCategoria({
  linea,
  gastosRecientes = [],
  tamano = "compacta",
  children,
}: {
  linea: LineaPresupuesto;
  /** Los últimos gastos de esta categoría, más reciente primero. */
  gastosRecientes?: GastoResumen[];
  tamano?: "compacta" | "grande";
  /** Contenido extra al final del detalle, después de los gastos. */
  children?: React.ReactNode;
}) {
  const proporcion = Math.min(linea.proporcion, 1);
  const sinTope = linea.presupuestado === 0;
  const grande = tamano === "grande";
  // Para el color: "ok" con alerta temprana se pinta como "ajustado" — el
  // estado real sigue siendo "ok" (no se pasó, hoy), pero el color no puede
  // decir "vas bien" cuando a este ritmo no vas a seguir así.
  const colorEstado =
    linea.alertaTemprana && linea.estado === "ok" ? "ajustado" : linea.estado;
  const Icono = sinTope ? CircleDashed : ICONO_ESTADO[colorEstado];
  const claseIcono = sinTope ? "text-muted-foreground" : CLASE_ESTADO[colorEstado];

  return (
    <details className="panel-accion rounded-2xl entra [&[open]_.marca]:rotate-180">
      <summary
        className={`flex cursor-pointer list-none flex-col gap-2.5 [&::-webkit-details-marker]:hidden ${grande ? "p-4" : "p-3.5"}`}
      >
        <div className="flex items-center gap-2.5">
          <Icono
            aria-hidden
            className={`shrink-0 ${claseIcono} ${grande ? "size-5" : "size-4"}`}
          />

          <p
            className={`min-w-0 flex-1 truncate font-semibold ${grande ? "text-[15px]" : "text-[13px]"}`}
          >
            {linea.categoria}
          </p>

          {!sinTope && (
            <span
              data-estado={colorEstado}
              className="shrink-0 rounded-full bg-ok/15 px-2 py-0.5 text-[11px] font-bold text-ok data-[estado=ajustado]:bg-warn/15 data-[estado=ajustado]:text-warn data-[estado=excedido]:bg-over/15 data-[estado=excedido]:text-over"
            >
              {Math.round(proporcion * 100)}%
            </span>
          )}

          <ChevronDown
            aria-hidden
            className="marca size-4 shrink-0 text-muted-foreground transition-transform duration-200"
          />
        </div>

        {sinTope ? (
          <>
            <p className="text-[11px] font-semibold">{soles(linea.gastado)}</p>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Sin tope: no entra en la cuenta. Ponle uno para controlarlo.
            </p>
          </>
        ) : (
          <>
            <p className="text-[11px] text-muted-foreground">
              <span className="font-semibold text-foreground">
                {soles(linea.gastado)}
              </span>{" "}
              de {soles(linea.presupuestado)}
            </p>

            <div
              className={`panel-hueco overflow-hidden rounded-full ${grande ? "h-2" : "h-1.5"}`}
              role="img"
              aria-label={`${soles(linea.gastado)} de ${soles(linea.presupuestado)} en ${linea.categoria}`}
            >
              <div
                data-estado={colorEstado}
                className="barra h-full rounded-full bg-ok data-[estado=ajustado]:bg-warn data-[estado=excedido]:bg-over"
                style={{ width: `${proporcion * 100}%` }}
              />
            </div>

            <span
              data-estado={linea.estado}
              className="truncate text-[11px] font-semibold text-muted-foreground data-[estado=excedido]:text-over"
            >
              {linea.restante >= 0
                ? `${soles(linea.restante)} libre`
                : `${soles(-linea.restante)} de más`}
            </span>

            {/* Verde hoy, pero camino a pasarse: el aviso a tiempo, no
                solo hacia atrás. Solo cuando aporta algo que "libre"/"de
                más" no dice ya. */}
            {linea.alertaTemprana && (
              <span className="truncate text-[11px] font-semibold text-warn">
                A este ritmo: {soles(linea.proyectado)}
              </span>
            )}
          </>
        )}
      </summary>

      <div className={`border-t border-border ${grande ? "px-4 pb-4" : "px-3.5 pb-3.5"} pt-3`}>
        {gastosRecientes.length === 0 ? (
          <p className="text-center text-[11px] text-muted-foreground">
            Sin gastos todavía en esta categoría
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {gastosRecientes.map((gasto) => (
              <li
                key={gasto.id}
                className="flex items-center gap-2 text-[11px]"
              >
                <span className="min-w-0 flex-1 truncate">
                  {gasto.descripcion}
                </span>
                <span className="shrink-0 font-semibold">
                  {soles(gasto.monto)}
                </span>
              </li>
            ))}
          </ul>
        )}

        {children && (
          <div
            className={
              gastosRecientes.length > 0 ? "mt-4 border-t border-border pt-4" : ""
            }
          >
            {children}
          </div>
        )}
      </div>
    </details>
  );
}
