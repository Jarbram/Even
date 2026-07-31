"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { NOMBRES, PERSONAS, type Persona } from "@/lib/persona";
import { TIPOS_CUENTA } from "@/lib/cuentas";
import { Chips } from "@/components/chips";
import { Plegable } from "@/components/plegable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { crearCuenta, crearFondo, type Resultado } from "../acciones";

/** Los nueve colores del diseño, para distinguir cuentas de un vistazo. */
const COLORES = [
  { value: "chart-1", label: "Indigo" },
  { value: "chart-3", label: "Lima" },
  { value: "chart-4", label: "Celeste" },
  { value: "chart-6", label: "Rosa" },
  { value: "chart-5", label: "Ámbar" },
  { value: "chart-7", label: "Verde" },
];

function Guardar({ children }: { children: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="rounded-lg">
      {pending ? "Guardando…" : children}
    </Button>
  );
}

/** Limpia el formulario y avisa, pero solo cuando de verdad se guardó. */
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

export function NuevaCuenta({ persona }: { persona: Persona }) {
  const [estado, action] = useActionState<Resultado, FormData>(crearCuenta, {});
  const ref = useAlGuardar(estado, "Cuenta añadida");

  return (
    <Plegable titulo="Añadir billetera o tarjeta">
      <form ref={ref} action={action} className="flex flex-col gap-7">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="nombre-cuenta">Nombre</Label>
          <Input
            id="nombre-cuenta"
            name="nombre"
            placeholder="BCP, Yape, Efectivo…"
            maxLength={40}
            required
          />
        </div>

        <Chips
          name="tipo"
          label="Tipo"
          opciones={Object.entries(TIPOS_CUENTA).map(([value, label]) => ({
            value,
            label,
          }))}
        />

        <Chips
          name="persona"
          label="¿De quién es?"
          defaultValue={persona}
          opciones={PERSONAS.map((p) => ({ value: p, label: NOMBRES[p] }))}
        />

        <Chips name="color" label="Color" columnas={3} opciones={COLORES} />

        <Error estado={estado} />
        <Guardar>Añadir cuenta</Guardar>
      </form>
    </Plegable>
  );
}

// ---------------------------------------------------------------------------

export function NuevoFondo() {
  const [estado, action] = useActionState<Resultado, FormData>(crearFondo, {});
  const ref = useAlGuardar(estado, "Fondo creado");

  return (
    <Plegable titulo="Crear fondo de ahorro">
      <form ref={ref} action={action} className="flex flex-col gap-7">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="nombre-fondo">Nombre</Label>
          <Input
            id="nombre-fondo"
            name="nombre"
            placeholder="Viaje, Emergencia…"
            maxLength={40}
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="meta">Meta (S/)</Label>
          <Input
            id="meta"
            name="meta"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0.01"
            placeholder="Opcional"
          />
        </div>

        <Error estado={estado} />
        <Guardar>Crear fondo</Guardar>
      </form>
    </Plegable>
  );
}
