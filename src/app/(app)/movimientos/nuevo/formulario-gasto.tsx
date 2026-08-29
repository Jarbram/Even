"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import type { Persona } from "@/lib/persona";
import type { CuentaRow } from "@/lib/cuentas";
import { CamposGasto } from "@/components/campos-gasto";
import { BotonGuardar, ErrorForm } from "@/components/formulario";
import { crearGasto, type Resultado } from "../../acciones";

/** Mismos campos que la hoja rápida del Home (`CamposGasto`): un gasto se
    anota igual, entre por donde entre. */
export function FormularioGasto({
  persona,
  cuentas,
  categorias,
  descripciones,
  cuentaPorCategoria,
  hoy,
}: {
  persona: Persona;
  cuentas: CuentaRow[];
  categorias: string[];
  descripciones: string[];
  cuentaPorCategoria: Record<string, string>;
  /** La fecha de hoy en Lima, calculada en el servidor. */
  hoy: string;
}) {
  const [estado, action] = useActionState<Resultado, FormData>(crearGasto, {});
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!estado.ok) return;
    toast.success("Gasto registrado");
    ref.current?.reset();
    // Al terminar, arriba: así se encadena un gasto tras otro sin desplazarse.
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [estado]);

  return (
    <form ref={ref} action={action} className="flex flex-col gap-7">
      <CamposGasto
        idPrefix="nuevo-"
        categorias={categorias}
        cuentas={cuentas}
        descripciones={descripciones}
        cuentaPorCategoria={cuentaPorCategoria}
        hoy={hoy}
        personaSesion={persona}
      />

      <ErrorForm estado={estado} />

      <BotonGuardar>Registrar gasto</BotonGuardar>
    </form>
  );
}
