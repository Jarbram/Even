import { Label } from "@/components/ui/label";

/**
 * Un grupo de opciones como pastillas tocables.
 *
 * ponytail: radios nativos con `peer-checked` de Tailwind — cero JavaScript y
 * cero estado. Sustituye a los `<select>`: en un móvil se acierta mejor sobre
 * una pastilla de 40 px que dentro de una rueda del sistema, y de paso mata el
 * dropdown blanco que Chrome pinta cuando el select tiene fondo translúcido.
 */

export type Opcion = {
  value: string;
  label: string;
  /** Segunda línea, más pequeña. Para el tipo de cuenta o de quién es. */
  hint?: string;
};

export function Chips({
  name,
  label,
  opciones,
  defaultValue,
  columnas,
  vacio,
}: {
  name: string;
  label: string;
  opciones: readonly Opcion[];
  defaultValue?: string;
  /** En rejilla en vez de en fila. Para listas largas, como las categorías. */
  columnas?: 2 | 3;
  /** Qué decir cuando no hay ninguna opción todavía. */
  vacio?: React.ReactNode;
}) {
  if (opciones.length === 0 && vacio) {
    return (
      <fieldset className="flex flex-col gap-3">
        <Label asChild>
          <legend>{label}</legend>
        </Label>
        <p className="text-xs text-muted-foreground">{vacio}</p>
      </fieldset>
    );
  }

  const disposicion = columnas
    ? `grid gap-2.5 ${columnas === 2 ? "grid-cols-2" : "grid-cols-3"}`
    : "flex flex-wrap gap-2.5";

  return (
    <fieldset className="flex flex-col gap-3">
      <Label asChild>
        <legend>{label}</legend>
      </Label>

      <div className={disposicion}>
        {opciones.map((opcion, i) => (
          <label key={opcion.value} className="cursor-pointer">
            <input
              type="radio"
              name={name}
              value={opcion.value}
              defaultChecked={defaultValue ? opcion.value === defaultValue : i === 0}
              required
              className="peer sr-only"
            />
            <span
              className={`flex h-full min-h-11 flex-col justify-center rounded-full border border-border px-4 py-2.5 text-center text-sm font-semibold transition-colors peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring ${
                columnas ? "" : "whitespace-nowrap"
              }`}
            >
              {opcion.label}
              {opcion.hint && (
                <span className="text-[11px] font-medium opacity-70">
                  {opcion.hint}
                </span>
              )}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
