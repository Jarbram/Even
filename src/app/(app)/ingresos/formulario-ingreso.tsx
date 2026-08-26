"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { NOMBRES, PERSONAS, type Persona } from "@/lib/persona";
import type { CuentaRow } from "@/lib/cuentas";
import type { FondoRow } from "@/lib/datos";
import { Chips } from "@/components/chips";
import { SelectorCategoria } from "@/components/selector-categoria";
import { SelectorDestino } from "@/components/selector-destino";
import {
  BotonGuardar,
  ErrorForm,
} from "@/components/formulario";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { guardarIngreso, type Resultado } from "../acciones";

export function FormularioIngreso({
  persona,
  fecha,
  cuentas,
  fondos,
  conceptos,
}: {
  persona: Persona;
  /** Con qué día viene puesto el calendario: hoy, o el mes que se mira. */
  fecha: string;
  cuentas: CuentaRow[];
  fondos: FondoRow[];
  conceptos: string[];
}) {
  const [estado, action] = useActionState<Resultado, FormData>(
    guardarIngreso,
    {},
  );
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!estado.ok) return;
    toast.success("Ingreso registrado");
    ref.current?.reset();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [estado]);

  return (
    <form ref={ref} action={action} className="flex flex-col gap-9">
      {/* Mismo gesto que el gasto: el monto manda y ocupa la pantalla. */}
      <div className="glass rounded-2xl px-5 py-7 text-center">
        <Label
          htmlFor="monto"
          className="justify-center text-xs font-medium text-muted-foreground"
        >
          ¿Cuánto entró?
        </Label>
        <div className="mt-3 flex items-baseline justify-center gap-1.5">
          <span className="text-2xl font-bold text-muted-foreground">S/</span>
          <Input
            id="monto"
            name="monto"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            required
            autoFocus
            className="h-auto w-full max-w-[220px] border-0 bg-transparent p-0 text-center dark:bg-transparent text-[44px] leading-none font-extrabold tracking-[-1px] text-primary shadow-none focus-visible:ring-0 md:text-[44px]"
          />
        </div>
      </div>

      <Chips
        name="persona"
        label="¿De quién?"
        defaultValue={persona}
        opciones={PERSONAS.map((p) => ({ value: p, label: NOMBRES[p] }))}
      />

      {/* Casi siempre es el mismo, así que tocarlo gana a teclearlo — pero
          "Otra" sigue abriendo el campo libre: pasar a pastillas fijas había
          quitado la posibilidad de escribir un concepto propio. */}
      <SelectorCategoria
        categorias={conceptos}
        name="descripcion"
        label="Concepto"
        nuevaEtiqueta="Escribe el concepto"
      />

      <SelectorDestino cuentas={cuentas} fondos={fondos} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="fecha">¿Qué día entró?</Label>
        <Input id="fecha" name="fecha" type="date" defaultValue={fecha} required />
      </div>

      <ErrorForm estado={estado} />

      <BotonGuardar>Registrar ingreso</BotonGuardar>
    </form>
  );
}

