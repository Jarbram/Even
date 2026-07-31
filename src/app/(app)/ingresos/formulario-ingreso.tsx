"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { NOMBRES, PERSONAS, type Persona } from "@/lib/persona";
import type { CuentaRow } from "@/lib/cuentas";
import type { FondoRow } from "@/lib/datos";
import type { Mes } from "@/lib/finanzas";
import { Chips } from "@/components/chips";
import { SelectorDestino } from "@/components/selector-destino";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { guardarIngreso, type Resultado } from "../acciones";

/** Conceptos que se repiten mes a mes: un toque en vez de teclearlos. */
const CONCEPTOS = ["Sueldo", "Extra", "Venta", "Regalo"];

export function FormularioIngreso({
  persona,
  mes,
  cuentas,
  fondos,
}: {
  persona: Persona;
  mes: Mes;
  cuentas: CuentaRow[];
  fondos: FondoRow[];
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
      <input type="hidden" name="mes" value={mes} />

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
            className="h-auto w-full max-w-[220px] border-0 bg-transparent p-0 text-center text-[44px] leading-none font-extrabold tracking-[-1px] text-primary shadow-none focus-visible:ring-0 md:text-[44px]"
          />
        </div>
      </div>

      <Chips
        name="persona"
        label="¿De quién?"
        defaultValue={persona}
        opciones={PERSONAS.map((p) => ({ value: p, label: NOMBRES[p] }))}
      />

      {/* El concepto casi siempre es el mismo: tocarlo gana a teclearlo. */}
      <Chips
        name="descripcion"
        label="Concepto"
        columnas={2}
        opciones={CONCEPTOS.map((c) => ({ value: c, label: c }))}
      />

      <SelectorDestino cuentas={cuentas} fondos={fondos} />

      {estado.error && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {estado.error}
        </p>
      )}

      <Guardar />
    </form>
  );
}

function Guardar() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending} className="rounded-xl">
      {pending ? "Guardando…" : "Registrar ingreso"}
    </Button>
  );
}
