"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/**
 * Las piezas que todo formulario de la app repetía por su cuenta: el botón
 * de enviar con su estado pendiente, el aviso de error, el limpiar-al-guardar
 * y saber si hay señal. Estaban copiadas en cuatro archivos, cada una con su
 * propio tamaño de botón.
 */

export type ResultadoForm = { error?: string; ok?: boolean };

/**
 * Si hay conexión de verdad, no solo si el teléfono cree tenerla —
 * `navigator.onLine` dice "sí" con wifi conectado a un router sin internet.
 * Empieza en `true`: el servidor no sabe nada de la conexión del navegador,
 * así que asumir conectado es lo único que no desentona en el primer render.
 */
export function useEnLinea() {
  const [enLinea, setEnLinea] = useState(true);

  useEffect(() => {
    setEnLinea(navigator.onLine);
    const marcar = () => setEnLinea(navigator.onLine);
    window.addEventListener("online", marcar);
    window.addEventListener("offline", marcar);
    return () => {
      window.removeEventListener("online", marcar);
      window.removeEventListener("offline", marcar);
    };
  }, []);

  return enLinea;
}

export function BotonGuardar({ children }: { children: string }) {
  const { pending } = useFormStatus();
  const enLinea = useEnLinea();
  return (
    <Button
      type="submit"
      size="lg"
      disabled={pending || !enLinea}
      className="mt-3 w-full rounded-xl"
    >
      {pending ? "Guardando…" : enLinea ? children : "Sin conexión"}
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
