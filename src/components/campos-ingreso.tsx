import { NOMBRES, PERSONAS, type Persona } from "@/lib/persona";
import type { CuentaRow } from "@/lib/cuentas";
import type { FondoRow } from "@/lib/datos";
import { Chips } from "@/components/chips";
import { PildorasCategoria, PildorasDestino } from "@/components/pildoras-selector";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Los campos de un ingreso —de quién, cuánto, concepto, a dónde entra,
 * cuándo—, sin el `<form>` ni la hoja que lo envuelven. Los usa tanto la
 * hoja rápida de "Registrar ingreso" como la de editar uno ya guardado.
 */
export function CamposIngreso({
  idPrefix,
  cuentas,
  fondos,
  conceptos,
  hoy,
  personaSesion,
  valores,
}: {
  /** Dos hojas de ingreso no están abiertas a la vez, pero comparten el DOM. */
  idPrefix: string;
  cuentas: CuentaRow[];
  fondos: FondoRow[];
  conceptos: string[];
  hoy: string;
  personaSesion: Persona;
  /** Presente solo al editar: precarga cada campo con lo ya guardado. */
  valores?: {
    persona: Persona;
    descripcion: string;
    monto: number;
    destino: string;
    fecha: string;
  };
}) {
  return (
    <>
      <div className="panel rounded-2xl px-5 py-3.5 text-center">
        <Label
          htmlFor={`${idPrefix}monto`}
          className="justify-center text-xs font-medium text-muted-foreground"
        >
          ¿Cuánto entró?
        </Label>
        <div className="mt-1 flex items-baseline justify-center gap-1.5">
          <span className="text-xl font-bold text-muted-foreground">S/</span>
          <Input
            id={`${idPrefix}monto`}
            name="monto"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            required
            autoFocus
            defaultValue={valores?.monto}
            className="h-auto w-full max-w-[200px] border-0 bg-transparent p-0 text-center dark:bg-transparent text-[32px] leading-none font-extrabold tracking-[-1px] text-ok shadow-none focus-visible:ring-0 md:text-[32px]"
          />
        </div>
      </div>

      <Chips
        name="persona"
        label="¿De quién?"
        defaultValue={valores?.persona ?? personaSesion}
        opciones={PERSONAS.map((p) => ({ value: p, label: NOMBRES[p] }))}
      />

      <PildorasCategoria
        categorias={conceptos}
        name="descripcion"
        label="Concepto"
        nuevaEtiqueta="Escribe el concepto"
        valorInicial={valores?.descripcion}
      />

      <PildorasDestino cuentas={cuentas} fondos={fondos} valorInicial={valores?.destino} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}fecha`}>¿Qué día entró?</Label>
        <Input
          id={`${idPrefix}fecha`}
          name="fecha"
          type="date"
          defaultValue={valores?.fecha ?? hoy}
          required
        />
      </div>
    </>
  );
}
