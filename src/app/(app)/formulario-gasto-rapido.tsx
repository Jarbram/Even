"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Plus } from "lucide-react";
import { toast } from "sonner";
import { NOMBRES, PERSONAS, laOtra, type Persona } from "@/lib/persona";
import type { CuentaRow } from "@/lib/cuentas";
import { Chips } from "@/components/chips";
import { BotonGuardar, ErrorForm } from "@/components/formulario";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { PildorasCategoria, PildorasCuenta } from "./pildoras-selector";
import { crearGasto, type Resultado } from "./acciones";

/**
 * Todo el detalle del formulario largo —cuenta, fecha, quién pagó, a
 * reembolsar—, pero en una hoja que sube desde abajo sin dejar el Home:
 * antes, anotar un gasto de S/8 significaba navegar a otra pantalla y volver.
 *
 * Comprimido en pastillas en vez de grillas y tarjetas: lo que se usa
 * siempre (monto, en qué, categoría, cuenta, quién) queda a la vista sin
 * desplazarse; lo que casi nunca cambia (la fecha, marcar a reembolsar)
 * vive detrás de "Más opciones", un toque más lejos pero fuera del camino.
 */
export function FormularioGastoRapido({
  persona,
  categorias,
  cuentas,
  hoy,
}: {
  persona: Persona;
  categorias: string[];
  cuentas: CuentaRow[];
  hoy: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const [estado, action] = useActionState<Resultado, FormData>(crearGasto, {});
  const formRef = useRef<HTMLFormElement>(null);
  // Para que el check de "a reembolsar" diga la persona correcta sin
  // recargar: sigue a "¿Quién pagó?" en vivo.
  const [pagadoPor, setPagadoPor] = useState<Persona>(persona);

  useEffect(() => {
    if (!estado.ok) return;
    toast.success("Gasto registrado");
    formRef.current?.reset();
    setPagadoPor(persona);
    setAbierto(false);
  }, [estado, persona]);

  return (
    <Sheet open={abierto} onOpenChange={setAbierto}>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        aria-haspopup="dialog"
        className="flex w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-5 text-[13px] font-semibold transition-colors hover:border-primary hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:bg-primary/10"
      >
        <Plus aria-hidden className="size-5 text-primary" />
        Agregar gasto
      </button>

      {/* SheetContent queda transparente a propósito: el material glass va en
          el div de adentro, para no pelear con el bg-popover que trae por
          defecto — dos superficies compitiendo por el mismo rectángulo.

          Sin manija de arrastre: solo Radix cierra por toque afuera, Escape
          o la X — no hay swipe-to-dismiss real todavía. Una manija que no
          arrastra nada es peor que no tener ninguna. */}
      <SheetContent
        side="bottom"
        className="mx-auto flex max-h-[88vh] w-full max-w-[430px] flex-col gap-0 overflow-hidden rounded-t-3xl bg-transparent p-0 shadow-none data-[side=bottom]:border-t-0"
      >
        <div className="glass-nav flex flex-1 flex-col overflow-y-auto rounded-t-3xl">
          <SheetTitle className="sr-only">Nuevo gasto</SheetTitle>
          <SheetDescription className="sr-only">
            Registra un gasto con todo el detalle sin salir del inicio.
          </SheetDescription>

          <form
            ref={formRef}
            action={action}
            className="flex flex-col gap-5 px-5 pt-8 pb-[max(1.75rem,env(safe-area-inset-bottom))]"
          >
            {/* El monto es lo único que se escribe de verdad. */}
            <div className="glass rounded-2xl px-5 py-5 text-center">
              <Label
                htmlFor="monto-rapido"
                className="justify-center text-xs font-medium text-muted-foreground"
              >
                ¿Cuánto fue?
              </Label>
              <div className="mt-2 flex items-baseline justify-center gap-1.5">
                <span className="text-xl font-bold text-muted-foreground">
                  S/
                </span>
                <Input
                  id="monto-rapido"
                  name="monto"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  required
                  autoFocus
                  className="h-auto w-full max-w-[200px] border-0 bg-transparent p-0 text-center text-[36px] leading-none font-extrabold tracking-[-1px] shadow-none focus-visible:ring-0 md:text-[36px]"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="descripcion-rapido">¿En qué?</Label>
              <Input
                id="descripcion-rapido"
                name="descripcion"
                placeholder="Plaza Vea, taxi, luz…"
                maxLength={80}
                required
              />
            </div>

            <PildorasCategoria categorias={categorias} />

            <PildorasCuenta cuentas={cuentas} />

            <Chips
              name="pagado_por"
              label="¿Quién pagó?"
              defaultValue={persona}
              onChange={(v) => setPagadoPor(v as Persona)}
              opciones={PERSONAS.map((p) => ({ value: p, label: NOMBRES[p] }))}
            />

            {/* La fecha (por defecto hoy) y "a reembolsar" son la excepción,
                no la regla: fuera de la vista pero a un toque, no borradas. */}
            <details className="[&[open]_.marca]:rotate-180">
              <summary className="flex cursor-pointer list-none items-center gap-1.5 text-xs font-semibold text-primary [&::-webkit-details-marker]:hidden">
                Más opciones
                <ChevronDown
                  aria-hidden
                  className="marca size-3.5 transition-transform duration-200"
                />
              </summary>

              <div className="mt-4 flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="fecha-rapida">¿Cuándo?</Label>
                  <Input
                    id="fecha-rapida"
                    name="fecha"
                    type="date"
                    defaultValue={hoy}
                    required
                  />
                </div>

                {/* Un caso puntual, no un reparto: solo se marca cuando
                    alguien de verdad tiene que devolver este gasto. */}
                <label className="glass flex cursor-pointer items-start gap-3 rounded-xl p-3.5">
                  <input
                    type="checkbox"
                    name="a_reembolsar"
                    className="peer sr-only"
                  />
                  <span
                    aria-hidden
                    className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border border-border transition-colors peer-checked:border-primary peer-checked:bg-primary peer-checked:[&>svg]:block"
                  >
                    <Check className="hidden size-3.5 text-primary-foreground" />
                  </span>
                  <span className="text-[13px]">
                    <span className="block font-semibold">
                      {NOMBRES[laOtra(pagadoPor)]} le debe esto a{" "}
                      {NOMBRES[pagadoPor]}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-muted-foreground">
                      Queda pendiente en Ajustes hasta que se marque como
                      devuelto
                    </span>
                  </span>
                </label>
              </div>
            </details>

            <ErrorForm estado={estado} />
            <BotonGuardar>Registrar gasto</BotonGuardar>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
