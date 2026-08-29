"use client";

import { useActionState } from "react";
import type { Mes } from "@/lib/finanzas";
import { PildorasCategoria } from "@/components/pildoras-selector";
import { Plegable } from "@/components/plegable";
import {
  BotonGuardar,
  ErrorForm,
  useAlGuardar,
} from "@/components/formulario";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { guardarPresupuesto, type Resultado } from "../acciones";

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

        <PildorasCategoria categorias={categorias} />

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

        <ErrorForm estado={estado} />
        <BotonGuardar>Asignar</BotonGuardar>

        <p className="text-xs text-muted-foreground">
          Si la categoría ya tenía monto, este lo reemplaza.
        </p>
      </form>
    </Plegable>
  );
}

// ---------------------------------------------------------------------------

/**
 * El formulario que aparece al desplegar una categoría en la lista: mismo
 * upsert que `NuevoPresupuesto`, pero con la categoría ya fija y el monto
 * actual precargado, para subirlo o bajarlo sin volver a elegirla.
 */
export function EditarPresupuesto({
  mes,
  categoria,
  monto,
}: {
  mes: Mes;
  categoria: string;
  monto: number;
}) {
  const [estado, action] = useActionState<Resultado, FormData>(
    guardarPresupuesto,
    {},
  );
  const ref = useAlGuardar(estado, "Presupuesto actualizado");

  return (
    <form ref={ref} action={action} className="flex flex-col gap-4">
      <input type="hidden" name="mes" value={mes} />
      <input type="hidden" name="categoria" value={categoria} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`monto-${categoria}`}>Monto (S/)</Label>
        <Input
          id={`monto-${categoria}`}
          name="monto"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          defaultValue={monto}
          required
        />
      </div>

      <ErrorForm estado={estado} />
      <BotonGuardar>Guardar</BotonGuardar>
    </form>
  );
}
