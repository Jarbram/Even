"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Pencil, X } from "lucide-react";
import { toast } from "sonner";
import type { CuentaRow } from "@/lib/cuentas";
import type { FondoRow, IngresoRow } from "@/lib/datos";
import { CamposIngreso } from "@/components/campos-ingreso";
import { BotonGuardar, ErrorForm } from "@/components/formulario";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { editarIngreso, type Resultado } from "@/app/(app)/acciones";

/** Corregir un ingreso ya guardado, en la misma hoja y los mismos campos
    que crear uno. */
export function EditarIngreso({
  ingreso,
  cuentas,
  fondos,
  conceptos,
}: {
  ingreso: IngresoRow;
  cuentas: CuentaRow[];
  fondos: FondoRow[];
  conceptos: string[];
}) {
  const [abierto, setAbierto] = useState(false);
  const [estado, action] = useActionState<Resultado, FormData>(
    editarIngreso,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!estado.ok) return;
    toast.success("Ingreso actualizado");
    setAbierto(false);
  }, [estado]);

  const destino = ingreso.cuenta_id
    ? `cuenta:${ingreso.cuenta_id}`
    : ingreso.fondo_id
      ? `fondo:${ingreso.fondo_id}`
      : "";

  return (
    <Sheet open={abierto} onOpenChange={setAbierto}>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        aria-label={`Editar ${ingreso.descripcion}`}
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
        <div className="panel-nav flex flex-1 flex-col overflow-x-hidden overflow-y-auto rounded-t-3xl">
          <div className="flex items-center justify-between px-5 pt-4 pb-3">
            <SheetTitle className="text-[15px] font-bold">
              Editar ingreso
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
            Corrige el monto, el concepto o el destino de este ingreso.
          </SheetDescription>

          <form
            ref={formRef}
            action={action}
            className="flex flex-col gap-3.5 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
          >
            <input type="hidden" name="id" value={ingreso.id} />

            <CamposIngreso
              idPrefix={`editar-${ingreso.id}-`}
              cuentas={cuentas}
              fondos={fondos}
              conceptos={conceptos}
              hoy={ingreso.fecha}
              personaSesion={ingreso.persona}
              valores={{
                persona: ingreso.persona,
                descripcion: ingreso.descripcion,
                monto: ingreso.monto,
                destino,
                fecha: ingreso.fecha,
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
