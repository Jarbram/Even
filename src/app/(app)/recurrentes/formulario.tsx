"use client";

import { useActionState } from "react";
import { NOMBRES, PERSONAS, type Persona } from "@/lib/persona";
import { Chips } from "@/components/chips";
import { SelectorCategoria } from "@/components/selector-categoria";
import { Plegable } from "@/components/plegable";
import {
  BotonGuardar,
  ErrorForm,
  useAlGuardar,
} from "@/components/formulario";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { crearRecurrente, type Resultado } from "../acciones";

export function NuevoRecurrente({
  persona,
  categorias,
}: {
  persona: Persona;
  categorias: string[];
}) {
  const [estado, action] = useActionState<Resultado, FormData>(
    crearRecurrente,
    {},
  );
  const ref = useAlGuardar(estado, "Recurrente creado");

  return (
    <Plegable titulo="Añadir gasto recurrente">
      <form ref={ref} action={action} className="flex flex-col gap-7">
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

        <SelectorCategoria categorias={categorias} />

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

        <ErrorForm estado={estado} />
        <BotonGuardar>Crear recurrente</BotonGuardar>
</form>
    </Plegable>
  );
}

