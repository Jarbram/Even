"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { ArrowDownLeft, X } from "lucide-react";
import { Link } from "next-view-transitions";
import { toast } from "sonner";
import { NOMBRES, PERSONAS, type Persona } from "@/lib/persona";
import type { CuentaRow } from "@/lib/cuentas";
import type { FondoRow } from "@/lib/datos";
import type { Mes } from "@/lib/finanzas";
import { Chips } from "@/components/chips";
import { BotonGuardar, ErrorForm } from "@/components/formulario";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { PildorasCategoria, PildorasDestino } from "./pildoras-selector";
import { guardarIngreso, type Resultado } from "./acciones";

/**
 * El mismo gesto que "Agregar gasto": todo el detalle —de quién, concepto, a
 * dónde entra— en una hoja que sube desde abajo, sin dejar el Home. Y las
 * mismas pastillas comprimidas en vez de grillas y tarjetas, porque un
 * ingreso tiene menos campos que un gasto pero no hay razón para que ocupen
 * más alto que los del gasto.
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

      {/* Sin la X por defecto de Sheet (`showCloseButton={false}`): esa
          venía suelta encima del contenido, sin caja ni contraste propios.
          Va la misma pastilla circular (glass-accion) que BotonCerrar usa
          en el resto de la app, en una cabecera propia con el título. */}
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="mx-auto flex max-h-[88vh] w-full max-w-[430px] flex-col gap-0 overflow-hidden rounded-t-3xl bg-transparent p-0 shadow-none data-[side=bottom]:border-t-0"
      >
        <div className="glass-nav flex flex-1 flex-col overflow-y-auto rounded-t-3xl">
          <div className="flex items-center justify-between px-5 pt-5 pb-4">
            <SheetTitle className="text-[15px] font-bold">
              Nuevo ingreso
            </SheetTitle>
            <SheetClose asChild>
              <button
                type="button"
                aria-label="Cerrar"
                className="glass-accion flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <X aria-hidden className="size-[18px]" />
              </button>
            </SheetClose>
          </div>
          <SheetDescription className="sr-only">
            Registra un ingreso con todo el detalle sin salir del inicio.
          </SheetDescription>

          <form
            ref={formRef}
            action={action}
            className="flex flex-col gap-5 px-5 pb-[max(1.75rem,env(safe-area-inset-bottom))]"
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

            <PildorasCategoria
              categorias={conceptos}
              name="descripcion"
              label="Concepto"
              nuevaEtiqueta="Escribe el concepto"
            />

            <PildorasDestino cuentas={cuentas} fondos={fondos} />

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
