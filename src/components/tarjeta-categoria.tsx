import { ChevronDown } from "lucide-react";
import { soles, type LineaPresupuesto } from "@/lib/finanzas";

const COLOR_ESTADO: Record<LineaPresupuesto["estado"], string> = {
  ok: "var(--ok)",
  ajustado: "var(--warn)",
  excedido: "var(--over)",
};

export type GastoResumen = {
  id: string;
  descripcion: string;
  monto: number;
};

/**
 * Una categoría con su aro y su barra —cuánto del tope, de un vistazo—,
 * desplegable: adentro, sus últimos gastos y lo que se le pase como hijo (en
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
  const color = COLOR_ESTADO[linea.estado];
  const sinTope = linea.presupuestado === 0;
  const grande = tamano === "grande";
  const grosorAro = grande ? 5 : 4;

  return (
    <details className="glass-accion rounded-2xl entra [&[open]_.marca]:rotate-180">
      <summary
        className={`flex cursor-pointer list-none flex-col gap-2.5 [&::-webkit-details-marker]:hidden ${grande ? "p-4" : "p-3.5"}`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`relative flex shrink-0 items-center justify-center ${grande ? "size-14" : "size-11"}`}
          >
            <div
              aria-hidden
              className="absolute inset-0 rounded-full"
              style={{
                background: sinTope
                  ? "rgb(255 255 255 / 0.12)"
                  : `conic-gradient(${color} ${proporcion * 100}%, rgb(255 255 255 / 0.12) 0)`,
                WebkitMask: `radial-gradient(farthest-side, transparent calc(100% - ${grosorAro}px), #000 calc(100% - ${grosorAro}px))`,
                mask: `radial-gradient(farthest-side, transparent calc(100% - ${grosorAro}px), #000 calc(100% - ${grosorAro}px))`,
              }}
            />
            {/* Sin tope no hay porcentaje que enseñar: un aro al 100 % decía
                "100 % del tope" de una categoría que no tiene ninguno, y en
                rojo — el peor error posible, porque marcaba como excedidas
                justo las dos líneas de gasto más grandes del mes. */}
            <span
              role="img"
              aria-label={
                sinTope
                  ? `${linea.categoria}, sin tope`
                  : `${Math.round(proporcion * 100)}% del tope`
              }
              data-sin-tope={sinTope}
              className={`relative font-extrabold data-[sin-tope=true]:text-muted-foreground ${grande ? "text-[13px]" : "text-[10px]"}`}
            >
              {sinTope ? "—" : `${Math.round(proporcion * 100)}%`}
            </span>
          </div>

          <p
            className={`min-w-0 flex-1 truncate font-semibold ${grande ? "text-[15px]" : "text-[13px]"}`}
          >
            {linea.categoria}
          </p>

          <ChevronDown
            aria-hidden
            className="marca size-4 shrink-0 text-muted-foreground transition-transform duration-200"
          />
        </div>

        {/* Las cifras van a lo ancho de la tarjeta y no en la columna de al
            lado del aro: ahí tenían 74 px y "S/ 1,262.70 de S/ 1,310.00"
            salía recortado, que en una app de dinero es el único dato que no
            puede quedar a medias. */}
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
              className={`glass-hueco overflow-hidden rounded-full ${grande ? "h-2" : "h-1.5"}`}
              role="img"
              aria-label={`${soles(linea.gastado)} de ${soles(linea.presupuestado)} en ${linea.categoria}`}
            >
              <div
                className="barra h-full rounded-full"
                style={{ width: `${proporcion * 100}%`, backgroundColor: color }}
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
