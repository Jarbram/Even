"use client";

import { useTransition } from "react";
import { Undo2 } from "lucide-react";
import { toast } from "sonner";
import { marcarReembolsar } from "@/app/(app)/acciones";

/**
 * Etiqueta un gasto ya guardado como "a reembolsar", o le quita la etiqueta.
 * Sin esto, olvidar marcarlo al crearlo significaba no poder arreglarlo
 * después sin borrar el gasto entero y volver a escribirlo.
 *
 * Un ícono del ancho del de borrar, no una pastilla de texto: con texto, cada
 * una de las ciento y pico filas del mes cargaba un botón de "Marcar a
 * reembolsar" que casi nunca se usa, y la lista se leía como una pared de
 * botones. Que un gasto esté marcado se dice con palabras en su subtítulo —el
 * color solo no basta—; aquí el ícono en lima es la segunda señal.
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
      title={activo ? "Ya no está por cobrar" : "Marcar a reembolsar"}
      data-activo={activo}
      className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-60 data-[activo=true]:bg-primary/10 data-[activo=true]:text-primary"
    >
      {pendiente ? "…" : <Undo2 aria-hidden className="size-4" />}
    </button>
  );
}
