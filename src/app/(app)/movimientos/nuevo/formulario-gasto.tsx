"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import type { Persona } from "@/lib/persona";
import type { CuentaRow } from "@/lib/cuentas";
import { SelectorCategoria } from "@/components/selector-categoria";
import { SelectorCuenta } from "@/components/selector-cuenta";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { crearGasto, type Resultado } from "../../acciones";

export function FormularioGasto({
  persona,
  cuentas,
  categorias,
  hoy,
}: {
  persona: Persona;
  cuentas: CuentaRow[];
  categorias: string[];
  /** La fecha de hoy en Lima, calculada en el servidor. */
  hoy: string;
}) {
  const [estado, action] = useActionState<Resultado, FormData>(crearGasto, {});
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!estado.ok) return;
    toast.success("Gasto registrado");
    ref.current?.reset();
    // Al terminar, arriba: así se encadena un gasto tras otro sin desplazarse.
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [estado]);

  return (
    <form ref={ref} action={action} className="flex flex-col gap-9">
      {/* El monto es lo único que se escribe de verdad: ocupa la pantalla. */}
      <div className="glass rounded-2xl px-5 py-7 text-center">
        <Label
          htmlFor="monto"
          className="justify-center text-xs font-medium text-muted-foreground"
        >
          ¿Cuánto fue?
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
            className="h-auto w-full max-w-[220px] border-0 bg-transparent p-0 text-center text-[44px] leading-none font-extrabold tracking-[-1px] shadow-none focus-visible:ring-0 md:text-[44px]"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <Label htmlFor="descripcion">¿En qué?</Label>
        <Input
          id="descripcion"
          name="descripcion"
          placeholder="Plaza Vea, taxi, luz…"
          maxLength={80}
          required
        />
      </div>

      <SelectorCategoria categorias={categorias} />

      <SelectorCuenta cuentas={cuentas} />

      <div className="flex flex-col gap-2.5">
        <Label htmlFor="fecha">¿Cuándo?</Label>
        <Input
          id="fecha"
          name="fecha"
          type="date"
          defaultValue={hoy}
          required
        />
      </div>

      {/*
        Lo paga quien registra y se reparte a medias. La deuda cruzada sigue
        necesitando ambos datos, así que viajan aquí en vez de preguntarse.
        El día que haga falta un gasto de uno solo, esto vuelve a ser un par de
        campos visibles.
      */}
      <input type="hidden" name="pagado_por" value={persona} />
      <input type="hidden" name="parte_abraham" value="0.5" />

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
      {pending ? "Guardando…" : "Registrar gasto"}
    </Button>
  );
}
