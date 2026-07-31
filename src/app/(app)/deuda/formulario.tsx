"use client";

import { useActionState } from "react";
import { NOMBRES, PERSONAS, laOtra, type Persona } from "@/lib/persona";
import { hoyISO, soles, type DeudaCruzada } from "@/lib/finanzas";
import { Chips } from "@/components/chips";
import { Plegable } from "@/components/plegable";
import { BotonGuardar, ErrorForm, useAlGuardar } from "@/components/formulario";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { crearTransferencia, type Resultado } from "../acciones";

/**
 * Registrar que uno le dio dinero al otro.
 *
 * El caso normal es saldar lo que ya se debe, así que el monto viene con la
 * deuda entera escrita y quien entrega es el deudor: en el uso más común no hay
 * que teclear ni elegir nada.
 *
 * ponytail: las etiquetas no cambian según el tipo elegido. "¿Quién puso el
 * dinero?" vale igual para un pago y para un préstamo, y eso ahorra volver
 * controlados unos radios que funcionan sin estado.
 */
export function NuevaTransferencia({
  persona,
  deuda,
}: {
  persona: Persona;
  deuda: DeudaCruzada;
}) {
  const [estado, action] = useActionState<Resultado, FormData>(
    crearTransferencia,
    {},
  );
  const ref = useAlGuardar(estado, "Movimiento registrado");

  return (
    <Plegable
      titulo={
        deuda.deudor
          ? `Saldar los ${soles(deuda.monto)}`
          : "Registrar un pago o préstamo"
      }
    >
      <form ref={ref} action={action} className="flex flex-col gap-7">
        <Chips
          name="tipo"
          label="¿Qué pasó?"
          columnas={2}
          defaultValue="liquidacion"
          opciones={[
            { value: "liquidacion", label: "Pagó lo que debía" },
            { value: "prestamo", label: "Prestó plata" },
          ]}
        />

        <Chips
          name="de_persona"
          label="¿Quién puso el dinero?"
          // Por defecto, quien debe: saldar es lo que se hace casi siempre.
          defaultValue={deuda.deudor ?? persona}
          opciones={PERSONAS.map((p) => ({
            value: p,
            label: NOMBRES[p],
            hint: p === persona ? "tú" : undefined,
          }))}
        />

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="monto-transferencia">Monto (S/)</Label>
          <Input
            id="monto-transferencia"
            name="monto"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0.01"
            // La deuda entera ya escrita: saldar del todo es lo más común.
            defaultValue={deuda.monto > 0 ? deuda.monto : undefined}
            required
          />
          {deuda.deudor && (
            <p className="text-xs text-muted-foreground">
              {NOMBRES[deuda.deudor]} debe {soles(deuda.monto)} a{" "}
              {NOMBRES[laOtra(deuda.deudor)]}. Puedes registrar menos.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="concepto-transferencia">
            Concepto{" "}
            <span className="font-normal text-muted-foreground">· opcional</span>
          </Label>
          <Input
            id="concepto-transferencia"
            name="concepto"
            placeholder="Yape, efectivo, para la moto…"
            maxLength={60}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="fecha-transferencia">¿Cuándo?</Label>
          <Input
            id="fecha-transferencia"
            name="fecha"
            type="date"
            defaultValue={hoyISO()}
            required
          />
        </div>

        <ErrorForm estado={estado} />
        <BotonGuardar>Registrar</BotonGuardar>
      </form>
    </Plegable>
  );
}
