"use client";

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { NOMBRES, PERSONAS, laOtra, type Persona } from "@/lib/persona";
import type { CuentaRow } from "@/lib/cuentas";
import { Chips } from "@/components/chips";
import { PildorasCategoria, PildorasCuenta } from "@/components/pildoras-selector";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Los campos de un gasto —monto, en qué, categoría, cuenta, quién pagó,
 * cuándo, a reembolsar—, sin el `<form>` ni la hoja que lo envuelven.
 *
 * Los usa tanto la hoja rápida de "Agregar gasto" como la de editar uno ya
 * guardado: antes cada una tenía su propio juego de campos con un aspecto
 * distinto, así que elegir una cuenta se aprendía dos veces.
 */
export function CamposGasto({
  idPrefix,
  categorias,
  cuentas,
  descripciones,
  cuentaPorCategoria,
  hoy,
  personaSesion,
  valores,
}: {
  /** Dos hojas de gasto no están abiertas a la vez, pero comparten el DOM. */
  idPrefix: string;
  categorias: string[];
  cuentas: CuentaRow[];
  /** Descripciones ya usadas, para sugerir al escribir una nueva. */
  descripciones: string[];
  /** La cuenta con la que más veces se pagó cada categoría. */
  cuentaPorCategoria: Record<string, string>;
  hoy: string;
  /** Quién pagó por defecto al crear uno nuevo. */
  personaSesion: Persona;
  /** Presente solo al editar: precarga cada campo con lo ya guardado. */
  valores?: {
    descripcion: string;
    categoria: string;
    monto: number;
    cuenta_id: string | null;
    pagado_por: Persona;
    fecha: string;
    a_reembolsar: boolean;
  };
}) {
  const [pagadoPor, setPagadoPor] = useState<Persona>(
    valores?.pagado_por ?? personaSesion,
  );
  // Solo al crear: al editar, la cuenta ya la eligió alguien y no hay que
  // sugerirle otra por cambiar de categoría.
  const [categoriaElegida, setCategoriaElegida] = useState(
    valores?.categoria ?? categorias[0] ?? "",
  );
  const sugerida = valores
    ? undefined
    : cuentaPorCategoria[categoriaElegida];
  // Si la sugerencia ya no es una cuenta activa (se borró o se desactivó),
  // no se pasa: mejor caer a Efectivo que a un radio sin ninguna marcada.
  const sugeridaValida =
    sugerida && cuentas.some((c) => c.id === sugerida) ? sugerida : undefined;

  return (
    <>
      {/* El monto es lo único que se escribe de verdad. */}
      <div className="panel rounded-2xl px-5 py-3.5 text-center">
        <Label
          htmlFor={`${idPrefix}monto`}
          className="justify-center text-xs font-medium text-muted-foreground"
        >
          ¿Cuánto fue?
        </Label>
        <div className="mt-1 flex items-baseline justify-center gap-1.5">
          <span className="text-xl font-bold text-muted-foreground">S/</span>
          <Input
            id={`${idPrefix}monto`}
            name="monto"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            required
            autoFocus
            defaultValue={valores?.monto}
            className="h-auto w-full max-w-[200px] border-0 bg-transparent p-0 text-center dark:bg-transparent text-[32px] leading-none font-extrabold tracking-[-1px] shadow-none focus-visible:ring-0 md:text-[32px]"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}descripcion`}>¿En qué?</Label>
        <Input
          id={`${idPrefix}descripcion`}
          name="descripcion"
          list={`${idPrefix}descripciones`}
          placeholder="Plaza Vea, taxi, luz…"
          maxLength={80}
          required
          defaultValue={valores?.descripcion}
        />
        {/* `<datalist>` nativo: el teclado del celular ya sabe mostrar estas
            sugerencias solo, sin un menú propio que mantener. */}
        <datalist id={`${idPrefix}descripciones`}>
          {descripciones.map((d) => (
            <option key={d} value={d} />
          ))}
        </datalist>
      </div>

      <PildorasCategoria
        categorias={categorias}
        valorInicial={valores?.categoria}
        onChange={setCategoriaElegida}
      />

      <PildorasCuenta
        cuentas={cuentas}
        valorInicial={valores?.cuenta_id ?? ""}
        sugerida={sugeridaValida}
      />

      <Chips
        name="pagado_por"
        label="¿Quién pagó?"
        defaultValue={pagadoPor}
        onChange={(v) => setPagadoPor(v as Persona)}
        opciones={PERSONAS.map((p) => ({ value: p, label: NOMBRES[p] }))}
      />

      {/* La fecha (por defecto hoy) y "a reembolsar" son la excepción, no
          la regla: fuera de la vista pero a un toque al crear. Al editar
          empieza abierto — quien entra a corregir algo suele querer ver
          también estos dos. */}
      <details className="[&[open]_.marca]:rotate-180" open={!!valores}>
        <summary className="flex cursor-pointer list-none items-center gap-1.5 text-xs font-semibold text-primary [&::-webkit-details-marker]:hidden">
          Más opciones
          <ChevronDown
            aria-hidden
            className="marca size-3.5 transition-transform duration-200"
          />
        </summary>

        <div className="mt-3 flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${idPrefix}fecha`}>¿Cuándo?</Label>
            <Input
              id={`${idPrefix}fecha`}
              name="fecha"
              type="date"
              defaultValue={valores?.fecha ?? hoy}
              required
            />
          </div>

          {/* Un caso puntual, no un reparto: solo se marca cuando alguien
              de verdad tiene que devolver este gasto. */}
          <label className="panel flex cursor-pointer items-start gap-3 rounded-xl p-3.5">
            <input
              type="checkbox"
              name="a_reembolsar"
              defaultChecked={valores?.a_reembolsar}
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
                {NOMBRES[laOtra(pagadoPor)]} le debe esto a {NOMBRES[pagadoPor]}
              </span>
              <span className="mt-0.5 block text-[11px] text-muted-foreground">
                Queda pendiente en Ajustes hasta que se marque como devuelto
              </span>
            </span>
          </label>
        </div>
      </details>
    </>
  );
}
