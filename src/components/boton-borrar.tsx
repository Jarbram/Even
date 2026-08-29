"use client";

import { useRef, useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

/** Cuánto se espera antes de que el borrado sea real. Bastante para
    arrepentirse en la cola del súper, no tanto para que se sienta que no
    pasó nada. */
const RETRASO_MS = 4000;

/**
 * Borrar con red de seguridad: un toque pregunta, el segundo no borra al
 * toque — arranca una cuenta atrás de unos segundos en la que la fila
 * sigue ahí, el propio botón se vuelve "Deshacer" y también aparece un
 * toast con la misma opción, por si ya se pasó a otra pantalla. Solo
 * cuando pasa el tiempo sin que nadie lo deshaga se llama de verdad a
 * `accion`.
 *
 * ponytail: confirmación en el propio botón, no un diálogo — un modal para
 * borrar una línea interrumpe más de lo que protege. El deshacer es la
 * protección real; el primer toque de confirmación es solo para no borrar
 * con el pulgar sin querer.
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
  const [pendiente, setPendiente] = useState(false);
  const [pendienteTransicion, iniciar] = useTransition();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function deshacer() {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    setPendiente(false);
    setConfirmando(false);
  }

  function borrar() {
    setPendiente(true);
    toast(`Se borró ${que}`, {
      duration: RETRASO_MS,
      action: { label: "Deshacer", onClick: deshacer },
    });
    timerRef.current = setTimeout(() => {
      iniciar(async () => {
        const { error } = await accion();
        if (error) {
          toast.error(error);
          setPendiente(false);
          setConfirmando(false);
        }
      });
    }, RETRASO_MS);
  }

  if (pendiente) {
    return (
      <button
        type="button"
        disabled={pendienteTransicion}
        onClick={deshacer}
        className="entra shrink-0 rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-foreground disabled:opacity-60"
      >
        {pendienteTransicion ? "Borrando…" : "Deshacer"}
      </button>
    );
  }

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
        onClick={borrar}
        className="rounded-full bg-destructive/15 px-3 py-1.5 text-xs font-semibold text-destructive"
      >
        Borrar
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
