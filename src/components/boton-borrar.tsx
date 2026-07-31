"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

/**
 * Borrar en dos toques: el primero pregunta, el segundo borra.
 *
 * ponytail: confirmación en el propio botón, no un diálogo. Un modal para
 * borrar una línea de gasto interrumpe más de lo que protege, y aquí lo que hay
 * que evitar es el toque accidental, no la decisión meditada.
 */
export function BotonBorrar({
  accion,
  que,
  etiqueta,
}: {
  /** Ya enlazada al id: `borrarGasto.bind(null, gasto.id)`. */
  accion: () => Promise<{ error?: string; ok?: boolean }>;
  /** Qué se borra, para el aviso: "el gasto", "la cuenta". */
  que: string;
  /** Nombre concreto de la fila, para el lector de pantalla. */
  etiqueta: string;
}) {
  const [confirmando, setConfirmando] = useState(false);
  const [pendiente, iniciar] = useTransition();

  if (!confirmando) {
    return (
      <button
        type="button"
        onClick={() => setConfirmando(true)}
        aria-label={`Borrar ${etiqueta}`}
        className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <Trash2 aria-hidden className="size-4" />
      </button>
    );
  }

  return (
    <span className="entra flex shrink-0 items-center gap-1">
      <button
        type="button"
        disabled={pendiente}
        onClick={() =>
          iniciar(async () => {
            const { error } = await accion();
            if (error) {
              toast.error(error);
              setConfirmando(false);
              return;
            }
            toast.success(`Se borró ${que}`);
          })
        }
        className="rounded-full bg-destructive/15 px-3 py-1.5 text-xs font-semibold text-destructive disabled:opacity-60"
      >
        {pendiente ? "Borrando…" : "Borrar"}
      </button>
      <button
        type="button"
        onClick={() => setConfirmando(false)}
        className="rounded-full px-2 py-1.5 text-xs text-muted-foreground"
      >
        No
      </button>
    </span>
  );
}
