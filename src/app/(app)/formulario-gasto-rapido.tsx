"use client";

import { useActionState, useEffect, useRef } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { NOMBRES, type Persona } from "@/lib/persona";
import { SelectorCategoria } from "@/components/selector-categoria";
import { BotonGuardar, ErrorForm } from "@/components/formulario";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { crearGasto, type Resultado } from "./acciones";

/**
 * Lo mínimo para anotar un gasto sin salir del Home: monto, en qué y
 * categoría. Sin cuenta, sin elegir fecha, sin "a reembolsar" — eso vive en
 * el formulario completo, para cuando hace falta ese detalle.
 */
export function FormularioGastoRapido({
  persona,
  categorias,
  hoy,
}: {
  persona: Persona;
  categorias: string[];
  hoy: string;
}) {
  const [estado, action] = useActionState<Resultado, FormData>(crearGasto, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!estado.ok) return;
    toast.success("Gasto registrado");
    formRef.current?.reset();
    // Ya cumplió lo que vino a hacer: no hay que dejarlo abierto ocupando
    // sitio en el Home. Se busca el <details> más cercano en vez de recibir
    // su ref por prop, para no acoplar este formulario a dónde lo pongan.
    formRef.current?.closest("details")?.removeAttribute("open");
  }, [estado]);

  return (
    <form
      ref={formRef}
      action={action}
      className="glass mt-3 flex flex-col gap-4 rounded-xl p-4"
    >
      <input type="hidden" name="fecha" value={hoy} />
      <input type="hidden" name="pagado_por" value={persona} />
      <input type="hidden" name="cuenta_id" value="" />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="monto-rapido">¿Cuánto fue? (S/)</Label>
        <Input
          id="monto-rapido"
          name="monto"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0.01"
          placeholder="0.00"
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="descripcion-rapido">¿En qué?</Label>
        <Input
          id="descripcion-rapido"
          name="descripcion"
          placeholder="Plaza Vea, taxi, luz…"
          maxLength={80}
          required
        />
      </div>

      <SelectorCategoria categorias={categorias} />

      <ErrorForm estado={estado} />
      <BotonGuardar>Guardar</BotonGuardar>

      <p className="text-center text-xs text-muted-foreground">
        Sin cuenta, a nombre de {NOMBRES[persona]}.{" "}
        <Link href="/movimientos/nuevo" className="text-primary hover:underline">
          Agregar con más detalle
        </Link>
      </p>
    </form>
  );
}
