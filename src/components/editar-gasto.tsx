"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Pencil, X } from "lucide-react";
import { toast } from "sonner";
import type { CuentaRow } from "@/lib/cuentas";
import type { GastoRow } from "@/lib/datos";
import { CamposGasto } from "@/components/campos-gasto";
import { BotonGuardar, ErrorForm } from "@/components/formulario";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { editarGasto, type Resultado } from "@/app/(app)/acciones";

/**
 * Corregir un gasto ya guardado, en la misma hoja y los mismos campos que
 * crear uno. Antes la única forma de arreglar un monto mal tecleado era
 * borrar la fila y volver a escribirlo todo desde cero.
 */
export function EditarGasto({
  gasto,
  categorias,
  cuentas,
  descripciones,
}: {
  gasto: GastoRow;
  categorias: string[];
  cuentas: CuentaRow[];
  descripciones: string[];
}) {
  const [abierto, setAbierto] = useState(false);
  const [estado, action] = useActionState<Resultado, FormData>(editarGasto, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!estado.ok) return;
    toast.success("Gasto actualizado");
    setAbierto(false);
  }, [estado]);

  return (
    <Sheet open={abierto} onOpenChange={setAbierto}>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        aria-label={`Editar ${gasto.descripcion}`}
        aria-haspopup="dialog"
        className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <Pencil aria-hidden className="size-4" />
      </button>

      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="mx-auto flex max-h-[94vh] w-full max-w-[430px] flex-col gap-0 overflow-hidden rounded-t-3xl bg-transparent p-0 shadow-none data-[side=bottom]:border-t-0"
      >
        <div className="panel-nav flex flex-1 flex-col overflow-y-auto rounded-t-3xl">
          <div className="flex items-center justify-between px-5 pt-4 pb-3">
            <SheetTitle className="text-[15px] font-bold">
              Editar gasto
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
            Corrige el monto, la categoría o cualquier otro dato de este gasto.
          </SheetDescription>

          <form
            ref={formRef}
            action={action}
            className="flex flex-col gap-3.5 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
          >
            <input type="hidden" name="id" value={gasto.id} />

            <CamposGasto
              idPrefix={`editar-${gasto.id}-`}
              categorias={categorias}
              cuentas={cuentas}
              descripciones={descripciones}
              // Al editar, CamposGasto nunca sugiere cuenta (ya hay una
              // elegida): no hace falta pedirle a la base la de verdad.
              cuentaPorCategoria={{}}
              hoy={gasto.fecha}
              personaSesion={gasto.pagado_por}
              valores={{
                descripcion: gasto.descripcion,
                categoria: gasto.categoria,
                monto: gasto.monto,
                cuenta_id: gasto.cuenta_id,
                pagado_por: gasto.pagado_por,
                fecha: gasto.fecha,
                a_reembolsar: gasto.a_reembolsar,
              }}
            />

            <ErrorForm estado={estado} />
            <BotonGuardar>Guardar cambios</BotonGuardar>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
