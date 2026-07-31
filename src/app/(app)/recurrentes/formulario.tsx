"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { NOMBRES, PERSONAS, type Persona } from "@/lib/persona";
import { CATEGORIAS } from "@/lib/finanzas";
import { Chips } from "@/components/chips";
import { Plegable } from "@/components/plegable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { crearRecurrente, type Resultado } from "../acciones";

export function NuevoRecurrente({ persona }: { persona: Persona }) {
  const [estado, action] = useActionState<Resultado, FormData>(
    crearRecurrente,
    {},
  );
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!estado.ok) return;
    toast.success("Recurrente creado");
    ref.current?.reset();
  }, [estado]);

  return (
    <Plegable titulo="Añadir gasto recurrente">
      <form ref={ref} action={action} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="descripcion-rec">¿Qué es?</Label>
          <Input
            id="descripcion-rec"
            name="descripcion"
            placeholder="Alquiler, Netflix, luz…"
            maxLength={80}
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="monto-rec">Monto (S/)</Label>
          <Input
            id="monto-rec"
            name="monto"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0.01"
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
          label="¿Quién lo paga?"
          defaultValue={persona}
          opciones={PERSONAS.map((p) => ({ value: p, label: NOMBRES[p] }))}
        />

        <Chips
          name="parte_abraham"
          label="¿De quién es?"
          defaultValue="0.5"
          opciones={[
            { value: "0.5", label: "A medias" },
            { value: "1", label: `De ${NOMBRES.abraham}` },
            { value: "0", label: `De ${NOMBRES.isabel}` },
          ]}
        />

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="dia">¿Qué día del mes?</Label>
          <Input
            id="dia"
            name="dia"
            type="number"
            inputMode="numeric"
            min="1"
            max="28"
            defaultValue="1"
            required
          />
          <p className="text-xs text-muted-foreground">
            Hasta 28, para que caiga también en febrero.
          </p>
        </div>

        {estado.error && (
          <p role="alert" className="text-sm font-medium text-destructive">
            {estado.error}
          </p>
        )}

        <Enviar />
      </form>
    </Plegable>
  );
}

function Enviar() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="rounded-lg">
      {pending ? "Guardando…" : "Crear recurrente"}
    </Button>
  );
}
