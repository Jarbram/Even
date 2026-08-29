"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { ArrowDownLeft, X } from "lucide-react";
import { Link } from "next-view-transitions";
import type { Persona } from "@/lib/persona";
import type { CuentaRow } from "@/lib/cuentas";
import type { FondoRow } from "@/lib/datos";
import { CamposIngreso } from "@/components/campos-ingreso";
import { Confirmacion } from "@/components/confirmacion";
import { BotonGuardar, ErrorForm } from "@/components/formulario";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { guardarIngreso, type Resultado } from "./acciones";

/**
 * El mismo gesto que "Agregar gasto": todo el detalle —de quién, concepto, a
 * dónde entra— en una hoja que sube desde abajo, sin dejar el Home.
 *
 * Los campos en sí viven en `CamposIngreso`, compartidos con la hoja de
 * editar y con el formulario de /ingresos.
 */
export function FormularioIngresoRapido({
  persona,
  fecha,
  cuentas,
  fondos,
  conceptos,
}: {
  persona: Persona;
  /** Hoy, ya en hora de Lima. */
  fecha: string;
  cuentas: CuentaRow[];
  fondos: FondoRow[];
  conceptos: string[];
}) {
  const [abierto, setAbierto] = useState(false);
  const [confirmado, setConfirmado] = useState(false);
  const [estado, action] = useActionState<Resultado, FormData>(
    guardarIngreso,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!estado.ok) return;
    formRef.current?.reset();
    setConfirmado(true);
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
        // Esmeralda sólido: el color de "entra plata" en toda la app.
        className="flex w-full flex-col items-center justify-center gap-1.5 rounded-xl bg-fill-ingreso py-5 text-[13px] font-semibold text-fill-ingreso-foreground transition-transform active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <ArrowDownLeft aria-hidden className="size-5" />
        Registrar ingreso
      </button>

      {/* Sin la X por defecto de Sheet (`showCloseButton={false}`): esa
          venía suelta encima del contenido, sin caja ni contraste propios.
          Va la misma pastilla circular (panel-accion) que BotonCerrar usa
          en el resto de la app, en una cabecera propia con el título. */}
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="mx-auto flex max-h-[94vh] w-full max-w-[430px] flex-col gap-0 overflow-hidden rounded-t-3xl bg-transparent p-0 shadow-none data-[side=bottom]:border-t-0"
      >
        <div className="panel-nav flex flex-1 flex-col overflow-x-hidden overflow-y-auto rounded-t-3xl">
          <div className="flex items-center justify-between px-5 pt-4 pb-3">
            <SheetTitle className="text-[15px] font-bold">
              Nuevo ingreso
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
            Registra un ingreso con todo el detalle sin salir del inicio.
          </SheetDescription>

          {confirmado ? (
            <Confirmacion color="ingreso" mensaje="Ingreso registrado" />
          ) : (
            <form
              ref={formRef}
              action={action}
              className="flex flex-col gap-3.5 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
            >
              <CamposIngreso
                idPrefix="rapido-"
                cuentas={cuentas}
                fondos={fondos}
                conceptos={conceptos}
                hoy={fecha}
                personaSesion={persona}
              />

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
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
