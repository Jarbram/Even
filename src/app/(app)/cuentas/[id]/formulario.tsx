"use client";

import { useActionState } from "react";
import { NOMBRES, PERSONAS } from "@/lib/persona";
import { TIPOS_CUENTA, leerSaldo, type CuentaRow } from "@/lib/cuentas";
import { hoyISO, soles } from "@/lib/finanzas";
import { Chips } from "@/components/chips";
import { Plegable } from "@/components/plegable";
import { BotonGuardar, ErrorForm, useAlGuardar } from "@/components/formulario";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { editarCuenta, pagarTarjeta, type Resultado } from "../../acciones";

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

/**
 * Nombre, de quién es y cuánto tiene. El tipo sí queda fijo: cambiarlo
 * reescribiría a qué se refieren los gastos que la cuenta ya tiene cargados.
 *
 * El monto se pregunta como saldo de HOY, no como punto de partida: nadie
 * recuerda con cuánto abrió el Yape, pero todos ven en la app del banco lo que
 * tiene ahora. La acción corrige la base con la diferencia; los gastos y los
 * ingresos ya cargados se quedan como están.
 */
export function EditarCuenta({ cuenta }: { cuenta: CuentaRow }) {
  const [estado, action] = useActionState<Resultado, FormData>(
    editarCuenta,
    {},
  );
  const ref = useAlGuardar(estado, "Cuenta actualizada");
  const saldo = leerSaldo(cuenta);

  return (
    <Plegable titulo="Editar la cuenta">
      <form ref={ref} action={action} className="flex flex-col gap-7">
        <input type="hidden" name="id" value={cuenta.id} />

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="nombre-cuenta">Nombre</Label>
          <Input
            id="nombre-cuenta"
            name="nombre"
            defaultValue={cuenta.nombre}
            maxLength={40}
            required
          />
        </div>

        <Chips
          name="persona"
          label="¿De quién es?"
          defaultValue={cuenta.persona}
          opciones={PERSONAS.map((p) => ({ value: p, label: NOMBRES[p] }))}
        />

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="saldo-cuenta">
            {saldo.esCredito ? "Consumido ahora (S/)" : "Saldo de hoy (S/)"}
          </Label>
          <Input
            id="saldo-cuenta"
            name="saldo"
            type="number"
            inputMode="decimal"
            step="0.01"
            defaultValue={saldo.esCredito ? saldo.consumido : cuenta.saldo}
            required
          />
          <p className="text-xs text-muted-foreground">
            {saldo.esCredito
              ? "Lo que la tarjeta lleva consumido de verdad. Se ajusta el arrastre para cuadrar; los gastos cargados aquí no se tocan."
              : "Lo que la cuenta tiene de verdad ahora mismo. Se ajusta el punto de partida para cuadrar; los gastos e ingresos cargados no se tocan."}
          </p>
        </div>

        <ErrorForm estado={estado} />
        <BotonGuardar>Guardar cambios</BotonGuardar>
      </form>
    </Plegable>
  );
}
