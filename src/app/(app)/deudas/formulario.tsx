"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Plegable } from "@/components/plegable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { guardarDeuda, type Resultado } from "../acciones";

export function NuevaDeuda() {
  const [estado, action] = useActionState<Resultado, FormData>(
    guardarDeuda,
    {},
  );
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!estado.ok) return;
    toast.success("Deuda registrada");
    ref.current?.reset();
  }, [estado]);

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
      {pending ? "Guardando…" : "Añadir deuda"}
    </Button>
  );
}
