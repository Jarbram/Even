"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import type { Mes } from "@/lib/finanzas";
import { SelectorCategoria } from "@/components/selector-categoria";
import { Plegable } from "@/components/plegable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { guardarPresupuesto, type Resultado } from "../acciones";

function Guardar({ children }: { children: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="rounded-lg">
      {pending ? "Guardando…" : children}
    </Button>
  );
}

function useAlGuardar(estado: Resultado, mensaje: string) {
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (!estado.ok) return;
    toast.success(mensaje);
    ref.current?.reset();
  }, [estado, mensaje]);
  return ref;
}

function Error({ estado }: { estado: Resultado }) {
  if (!estado.error) return null;
  return (
    <p role="alert" className="text-sm font-medium text-destructive">
      {estado.error}
    </p>
  );
}

// ---------------------------------------------------------------------------

export function NuevoPresupuesto({
  mes,
  categorias,
}: {
  mes: Mes;
  categorias: string[];
}) {
  const [estado, action] = useActionState<Resultado, FormData>(
    guardarPresupuesto,
    {},
  );
  const ref = useAlGuardar(estado, "Presupuesto asignado");

  return (
    <Plegable titulo="Asignar a una categoría">
      <form ref={ref} action={action} className="flex flex-col gap-7">
        <input type="hidden" name="mes" value={mes} />

        <SelectorCategoria categorias={categorias} />

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="monto-presupuesto">Monto (S/)</Label>
          <Input
            id="monto-presupuesto"
            name="monto"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            required
          />
        </div>

        <Error estado={estado} />
        <Guardar>Asignar</Guardar>

        <p className="text-xs text-muted-foreground">
          Si la categoría ya tenía monto, este lo reemplaza.
        </p>
      </form>
    </Plegable>
  );
}
