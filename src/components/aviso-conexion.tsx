"use client";

import { useEffect } from "react";
import { toast } from "sonner";

const ID = "sin-conexion";

/**
 * Avisa cuando se pierde la señal, y lo retira cuando vuelve.
 *
 * La escena de "en caliente" es justo donde la señal falla — de pie, en la
 * cola, a veces en un sótano. Sin este aviso, tocar "Guardar" sin conexión
 * se queda sin hacer nada visible y parece que la app se colgó; con él, se
 * sabe de inmediato por qué, con el mismo mecanismo (toast persistente) que
 * ya usa `AvisoActualizacion` para otro aviso de estado del sistema.
 */
export function AvisoConexion() {
  useEffect(() => {
    function perdida() {
      toast.error("Sin conexión", {
        id: ID,
        description: "Lo que anotes no se guarda hasta que vuelva la señal.",
        duration: Infinity,
      });
    }
    function recuperada() {
      toast.dismiss(ID);
    }

    if (!navigator.onLine) perdida();

    window.addEventListener("offline", perdida);
    window.addEventListener("online", recuperada);
    return () => {
      window.removeEventListener("offline", perdida);
      window.removeEventListener("online", recuperada);
    };
  }, []);

  return null;
}
