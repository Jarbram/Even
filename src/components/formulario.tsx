"use client";

import { useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/**
 * Las tres piezas que todo formulario de la app repetía por su cuenta: el botón
 * de enviar con su estado pendiente, el aviso de error y el limpiar-al-guardar.
 * Estaban copiadas en cuatro archivos, cada una con su propio tamaño de botón.
 */

export type ResultadoForm = { error?: string; ok?: boolean };

export function BotonGuardar({ children }: { children: string }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      size="lg"
      disabled={pending}
      className="mt-1 w-full rounded-xl"
    >
      {pending ? "Guardando…" : children}
    </Button>
  );
}

export function ErrorForm({ estado }: { estado: ResultadoForm }) {
  if (!estado.error) return null;
  return (
    <p role="alert" className="text-sm font-medium text-destructive">
      {estado.error}
    </p>
  );
}

/** Limpia el formulario y avisa, pero solo cuando de verdad se guardó. */
export function useAlGuardar(estado: ResultadoForm, mensaje: string) {
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (!estado.ok) return;
    toast.success(mensaje);
    ref.current?.reset();
  }, [estado, mensaje]);
  return ref;
}
