"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { marcarReembolsar } from "@/app/(app)/acciones";

/**
 * Etiqueta un gasto ya guardado como "a reembolsar", o le quita la etiqueta.
 * Sin esto, olvidar marcarlo al crearlo significaba no poder arreglarlo
 * después sin borrar el gasto entero y volver a escribirlo.
 */
export function ToggleReembolsar({
  id,
  activo,
  etiqueta,
}: {
  id: string;
  activo: boolean;
  /** Nombre concreto del gasto, para el lector de pantalla. */
  etiqueta: string;
}) {
  const [pendiente, iniciar] = useTransition();

  return (
    <button
      type="button"
      disabled={pendiente}
      aria-pressed={activo}
      aria-label={
        activo ? `Quitar de por cobrar: ${etiqueta}` : `Marcar a reembolsar: ${etiqueta}`
      }
      onClick={() =>
        iniciar(async () => {
          const { error } = await marcarReembolsar(id, !activo);
          if (error) {
            toast.error(error);
            return;
          }
          toast.success(activo ? "Ya no está pendiente" : "Marcado a reembolsar");
        })
      }
      data-activo={activo}
      className="rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold text-muted-foreground transition-colors disabled:opacity-60 data-[activo=true]:border-primary data-[activo=true]:bg-primary/10 data-[activo=true]:text-primary"
    >
      {pendiente ? "…" : activo ? "Por cobrar" : "Marcar a reembolsar"}
    </button>
  );
}
