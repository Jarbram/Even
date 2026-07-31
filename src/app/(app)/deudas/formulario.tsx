"use client";

import { useActionState } from "react";
import { Plegable } from "@/components/plegable";
import {
  BotonGuardar,
  ErrorForm,
  useAlGuardar,
} from "@/components/formulario";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { guardarDeuda, type Resultado } from "../acciones";

export function NuevaDeuda() {
  const [estado, action] = useActionState<Resultado, FormData>(
    guardarDeuda,
    {},
  );
  const ref = useAlGuardar(estado, "Deuda registrada");

  return (
    <Plegable titulo="Añadir deuda">
      <form ref={ref} action={action} className="flex flex-col gap-7">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="nombre-deuda">¿Con quién?</Label>
          <Input
            id="nombre-deuda"
            name="nombre"
            placeholder="Tarjeta BCP, préstamo…"
            maxLength={40}
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="saldo-deuda">Saldo pendiente (S/)</Label>
          <Input
            id="saldo-deuda"
            name="saldo"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pago-deuda">Cuota mensual (S/)</Label>
          <Input
            id="pago-deuda"
            name="pago_mensual"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0.01"
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tasa-deuda">Tasa anual (%)</Label>
          <Input
            id="tasa-deuda"
            name="tasa_anual"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            max="200"
            defaultValue="0"
          />
          <p className="text-xs text-muted-foreground">
            La TEA que figura en tu estado de cuenta. Si no la sabes, deja 0 y
            el simulador solo contará las cuotas.
          </p>
        </div>

        <ErrorForm estado={estado} />
        <BotonGuardar>Añadir deuda</BotonGuardar>
</form>
    </Plegable>
  );
}

