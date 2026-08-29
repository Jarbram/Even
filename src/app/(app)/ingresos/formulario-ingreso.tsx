"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import type { Persona } from "@/lib/persona";
import type { CuentaRow } from "@/lib/cuentas";
import type { FondoRow } from "@/lib/datos";
import { CamposIngreso } from "@/components/campos-ingreso";
import { BotonGuardar, ErrorForm } from "@/components/formulario";
import { guardarIngreso, type Resultado } from "../acciones";

/** Mismos campos que la hoja rápida del Home (`CamposIngreso`): un ingreso
    se anota igual, entre por donde entre. */
export function FormularioIngreso({
  persona,
  fecha,
  cuentas,
  fondos,
  conceptos,
}: {
  persona: Persona;
  /** Con qué día viene puesto el calendario: hoy, o el mes que se mira. */
  fecha: string;
  cuentas: CuentaRow[];
  fondos: FondoRow[];
  conceptos: string[];
}) {
  const [estado, action] = useActionState<Resultado, FormData>(
    guardarIngreso,
    {},
  );
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!estado.ok) return;
    toast.success("Ingreso registrado");
    ref.current?.reset();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [estado]);

  return (
    <form ref={ref} action={action} className="flex flex-col gap-7">
      <CamposIngreso
        idPrefix="ingreso-"
        cuentas={cuentas}
        fondos={fondos}
        conceptos={conceptos}
        hoy={fecha}
        personaSesion={persona}
      />

      <ErrorForm estado={estado} />

      <BotonGuardar>Registrar ingreso</BotonGuardar>
    </form>
  );
}
