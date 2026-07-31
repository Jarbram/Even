"use client";

import { useActionState } from "react";
import { NOMBRES } from "@/lib/persona";
import { TIPOS_CUENTA, type CuentaRow } from "@/lib/cuentas";
import { hoyISO, soles } from "@/lib/finanzas";
import { Chips } from "@/components/chips";
import { Plegable } from "@/components/plegable";
import { BotonGuardar, ErrorForm, useAlGuardar } from "@/components/formulario";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { pagarTarjeta, type Resultado } from "../../acciones";

/**
 * Pagar la tarjeta: baja el saldo de la cuenta de origen y le devuelve línea a
 * la tarjeta. No pasa por gastos — eso contaría la compra dos veces.
 */
export function PagarTarjeta({
  tarjetaId,
  consumido,
  origenes,
}: {
  tarjetaId: string;
  consumido: number;
  /** Cuentas desde las que se puede pagar: todas menos la propia tarjeta. */
  origenes: CuentaRow[];
}) {
  const [estado, action] = useActionState<Resultado, FormData>(
    pagarTarjeta,
    {},
  );
  const ref = useAlGuardar(estado, "Pago registrado");

  return (
    <Plegable
      titulo={consumido > 0 ? `Pagar los ${soles(consumido)}` : "Registrar un pago"}
    >
      <form ref={ref} action={action} className="flex flex-col gap-7">
        <input type="hidden" name="tarjeta_id" value={tarjetaId} />

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="monto-pago">Monto (S/)</Label>
          <Input
            id="monto-pago"
            name="monto"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0.01"
            // Pagar el consumo entero es lo más común, así que ya viene escrito.
            defaultValue={consumido > 0 ? consumido : undefined}
            required
          />
          {consumido > 0 && (
            <p className="text-xs text-muted-foreground">
              Llevas {soles(consumido)} consumidos. Puedes pagar menos.
            </p>
          )}
        </div>

        <Chips
          name="desde_cuenta_id"
          label="¿De dónde sale?"
          columnas={2}
          opciones={[
            ...origenes.map((c) => ({
              value: c.id,
              label: c.nombre,
              hint: `${TIPOS_CUENTA[c.tipo]} · ${NOMBRES[c.persona]}`,
            })),
            // Sin origen: la línea se recupera igual, pero ninguna cuenta baja.
            { value: "", label: "Otra", hint: "sin registrar" },
          ]}
        />

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="fecha-pago">¿Cuándo?</Label>
          <Input
            id="fecha-pago"
            name="fecha"
            type="date"
            defaultValue={hoyISO()}
            required
          />
        </div>

        <ErrorForm estado={estado} />
        <BotonGuardar>Registrar pago</BotonGuardar>
      </form>
    </Plegable>
  );
}
