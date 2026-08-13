"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { ArrowDownLeft } from "lucide-react";
import { Link } from "next-view-transitions";
import { toast } from "sonner";
import { NOMBRES, PERSONAS, type Persona } from "@/lib/persona";
import type { CuentaRow } from "@/lib/cuentas";
import type { FondoRow } from "@/lib/datos";
import type { Mes } from "@/lib/finanzas";
import { Chips } from "@/components/chips";
import { SelectorCategoria } from "@/components/selector-categoria";
import { SelectorDestino } from "@/components/selector-destino";
import { BotonGuardar, ErrorForm } from "@/components/formulario";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { guardarIngreso, type Resultado } from "./acciones";

/**
 * El mismo gesto que "Agregar gasto": todo el detalle —de quién, concepto, a
 * dónde entra— en una hoja que sube desde abajo, sin dejar el Home.
 */
export function FormularioIngresoRapido({
  persona,
  mes,
  cuentas,
  fondos,
  conceptos,
}: {
  persona: Persona;
  mes: Mes;
  cuentas: CuentaRow[];
  fondos: FondoRow[];
  conceptos: string[];
}) {
  const [abierto, setAbierto] = useState(false);
  const [estado, action] = useActionState<Resultado, FormData>(
    guardarIngreso,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!estado.ok) return;
    toast.success("Ingreso registrado");
    formRef.current?.reset();
    setAbierto(false);
  }, [estado]);

  return (
    <Sheet open={abierto} onOpenChange={setAbierto}>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        aria-haspopup="dialog"
        className="glass-accion flex w-full flex-col items-center justify-center gap-1.5 rounded-xl py-5 text-[13px] font-semibold focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <ArrowDownLeft aria-hidden className="size-5 text-primary" />
        Registrar ingreso
      </button>

      <SheetContent
        side="bottom"
        className="mx-auto flex max-h-[88vh] w-full max-w-[430px] flex-col gap-0 overflow-hidden rounded-t-3xl bg-transparent p-0 shadow-none data-[side=bottom]:border-t-0"
      >
        <div className="glass-nav flex flex-1 flex-col overflow-y-auto rounded-t-3xl">
          <div aria-hidden className="flex justify-center pt-3 pb-1">
            <span className="h-1.5 w-10 rounded-full bg-white/15" />
          </div>
          <SheetTitle className="sr-only">Nuevo ingreso</SheetTitle>
          <SheetDescription className="sr-only">
            Registra un ingreso con todo el detalle sin salir del inicio.
          </SheetDescription>

          <form
            ref={formRef}
            action={action}
            className="flex flex-col gap-6 px-5 pt-3 pb-[max(1.75rem,env(safe-area-inset-bottom))]"
          >
            <input type="hidden" name="mes" value={mes} />

            <div className="glass rounded-2xl px-5 py-5 text-center">
              <Label
                htmlFor="monto-ingreso-rapido"
                className="justify-center text-xs font-medium text-muted-foreground"
              >
                ¿Cuánto entró?
              </Label>
              <div className="mt-2 flex items-baseline justify-center gap-1.5">
                <span className="text-xl font-bold text-muted-foreground">
                  S/
                </span>
                <Input
                  id="monto-ingreso-rapido"
                  name="monto"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  required
                  autoFocus
                  className="h-auto w-full max-w-[200px] border-0 bg-transparent p-0 text-center text-[36px] leading-none font-extrabold tracking-[-1px] text-primary shadow-none focus-visible:ring-0 md:text-[36px]"
                />
              </div>
            </div>

            <Chips
              name="persona"
              label="¿De quién?"
              defaultValue={persona}
              opciones={PERSONAS.map((p) => ({ value: p, label: NOMBRES[p] }))}
            />

            <SelectorCategoria
              categorias={conceptos}
              name="descripcion"
              label="Concepto"
              nuevaEtiqueta="Escribe el concepto"
            />

            <SelectorDestino cuentas={cuentas} fondos={fondos} />

            <ErrorForm estado={estado} />
            <BotonGuardar>Registrar ingreso</BotonGuardar>

            <p className="text-center text-xs text-muted-foreground">
              <Link
                href="/ingresos"
                className="text-primary hover:underline"
                onClick={() => setAbierto(false)}
              >
                Ver los ingresos de este mes
              </Link>
            </p>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
