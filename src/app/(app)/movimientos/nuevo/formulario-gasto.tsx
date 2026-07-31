"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { NOMBRES, PERSONAS, type Persona } from "@/lib/persona";
import { CATEGORIAS } from "@/lib/finanzas";
import { TIPOS_CUENTA, type CuentaRow } from "@/lib/cuentas";
import { Chips } from "@/components/chips";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { crearGasto, type Resultado } from "../../acciones";

export function FormularioGasto({
  persona,
  cuentas,
  hoy,
}: {
  persona: Persona;
  cuentas: CuentaRow[];
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
    <form ref={ref} action={action} className="flex flex-col gap-6">
      {/* El monto es lo único que se escribe de verdad: ocupa toda la pantalla. */}
      <div className="glass rounded-xl p-5 text-center">
        <Label htmlFor="monto" className="justify-center text-xs text-muted-foreground">
          ¿Cuánto fue?
        </Label>
        <div className="mt-2 flex items-baseline justify-center gap-1">
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
            className="h-auto w-full max-w-[220px] border-0 bg-transparent p-0 text-center text-[40px] font-extrabold tracking-[-1px] shadow-none focus-visible:ring-0 md:text-[40px]"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="descripcion">¿En qué?</Label>
        <Input
          id="descripcion"
          name="descripcion"
          placeholder="Plaza Vea, taxi, luz…"
          maxLength={80}
          required
        />
      </div>

      <Chips
        name="categoria"
        label="Categoría"
        columnas={3}
        opciones={CATEGORIAS.map((c) => ({ value: c, label: c }))}
      />

      <Chips
        name="pagado_por"
        label="¿Quién pagó?"
        defaultValue={persona}
        opciones={PERSONAS.map((p) => ({ value: p, label: NOMBRES[p] }))}
      />

      <Chips
        name="parte_abraham"
        label="¿De quién es el gasto?"
        defaultValue="0.5"
        opciones={[
          { value: "0.5", label: "A medias" },
          { value: "1", label: `De ${NOMBRES.abraham}` },
          { value: "0", label: `De ${NOMBRES.isabel}` },
        ]}
      />

      <Chips
        name="cuenta_id"
        label="¿Con qué pagaste?"
        opciones={cuentas.map((c) => ({
          value: c.id,
          label: c.nombre,
          hint: `${TIPOS_CUENTA[c.tipo]} · ${NOMBRES[c.persona]}`,
        }))}
        vacio="Todavía no tienes cuentas. Añádelas en Ajustes → Billeteras."
      />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="fecha">¿Cuándo?</Label>
        <Input id="fecha" name="fecha" type="date" defaultValue={hoy} required />
      </div>

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
