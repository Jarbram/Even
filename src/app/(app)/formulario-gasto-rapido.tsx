"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import type { Persona } from "@/lib/persona";
import type { CuentaRow } from "@/lib/cuentas";
import { CamposGasto } from "@/components/campos-gasto";
import { Confirmacion } from "@/components/confirmacion";
import { BotonGuardar, ErrorForm } from "@/components/formulario";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { crearGasto, type Resultado } from "./acciones";

/**
 * Todo el detalle del formulario largo —cuenta, fecha, quién pagó, a
 * reembolsar—, pero en una hoja que sube desde abajo sin dejar el Home:
 * antes, anotar un gasto de S/8 significaba navegar a otra pantalla y volver.
 *
 * Los campos en sí viven en `CamposGasto`, compartidos con la hoja de
 * editar: crear y corregir un gasto usan el mismo lenguaje visual.
 */
export function FormularioGastoRapido({
  persona,
  categorias,
  cuentas,
  descripciones,
  cuentaPorCategoria,
  hoy,
}: {
  persona: Persona;
  categorias: string[];
  cuentas: CuentaRow[];
  descripciones: string[];
  cuentaPorCategoria: Record<string, string>;
  hoy: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const [confirmado, setConfirmado] = useState(false);
  const [estado, action] = useActionState<Resultado, FormData>(crearGasto, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!estado.ok) return;
    formRef.current?.reset();
    setConfirmado(true);
    // El check se ve un instante y recién ahí se cierra: cerrar de una vez
    // no dejaba tiempo a que el gesto de "confirmado" se sintiera.
    const cerrar = setTimeout(() => {
      setAbierto(false);
      setConfirmado(false);
    }, 700);
    return () => clearTimeout(cerrar);
  }, [estado]);

  return (
    <Sheet open={abierto} onOpenChange={setAbierto}>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        aria-haspopup="dialog"
        // Violeta sólido: el color de "sale plata" en toda la app, no un
        // borde punteado sobre un fondo neutro. Es la acción que más se usa
        // y se ve como tal — la misma pastilla que "Registrar ingreso" pero
        // en el color contrario, porque el dinero va en sentidos opuestos.
        className="flex w-full flex-col items-center justify-center gap-1.5 rounded-xl bg-fill-gasto py-5 text-[13px] font-semibold text-fill-gasto-foreground transition-transform active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <Plus aria-hidden className="size-5" />
        Agregar gasto
      </button>

      {/* SheetContent queda transparente a propósito: el material panel va en
          el div de adentro, para no pelear con el bg-popover que trae por
          defecto — dos superficies compitiendo por el mismo rectángulo.
          Y sin su X por defecto (`showCloseButton={false}`): esa venía
          suelta encima del contenido, sin caja ni contraste propios — un
          ghost-button genérico de shadcn, no algo hecho para esta app. Va
          la de siempre (panel-accion, la misma que BotonCerrar en el resto
          de la app), en una cabecera propia con el título al lado. */}
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="mx-auto flex max-h-[94vh] w-full max-w-[430px] flex-col gap-0 overflow-hidden rounded-t-3xl bg-transparent p-0 shadow-none data-[side=bottom]:border-t-0"
      >
        <div className="panel-nav flex flex-1 flex-col overflow-x-hidden overflow-y-auto rounded-t-3xl">
          <div className="flex items-center justify-between px-5 pt-4 pb-3">
            <SheetTitle className="text-[15px] font-bold">
              Nuevo gasto
            </SheetTitle>
            <SheetClose asChild>
              <button
                type="button"
                aria-label="Cerrar"
                className="panel-accion flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <X aria-hidden className="size-[18px]" />
              </button>
            </SheetClose>
          </div>
          <SheetDescription className="sr-only">
            Registra un gasto con todo el detalle sin salir del inicio.
          </SheetDescription>

          {confirmado ? (
            <Confirmacion color="gasto" mensaje="Gasto registrado" />
          ) : (
            <form
              ref={formRef}
              action={action}
              className="flex flex-col gap-3.5 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
            >
              <CamposGasto
                idPrefix="rapido-"
                categorias={categorias}
                cuentas={cuentas}
                descripciones={descripciones}
                cuentaPorCategoria={cuentaPorCategoria}
                hoy={hoy}
                personaSesion={persona}
              />

              <ErrorForm estado={estado} />
              <BotonGuardar>Registrar gasto</BotonGuardar>
            </form>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
