"use client";

import { useState } from "react";
import { PiggyBank } from "lucide-react";
import { claseColor, type CuentaRow } from "@/lib/cuentas";
import type { FondoRow } from "@/lib/datos";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Versión comprimida de los selectores del formulario largo: pastillas que
 * envuelven según su propio ancho (`flex-wrap`), no una grilla de columnas
 * fijas ni tarjetas con ícono+subtítulo. Una pastilla de "Mercado" no
 * necesita el mismo ancho que una de "Gastos personales isabel", así que
 * caben más por fila y la hoja se desplaza menos.
 *
 * Vive aparte de `SelectorCategoria`/`SelectorCuenta`/`SelectorDestino`
 * —el formulario largo (/movimientos/nuevo, /ingresos) se queda con esos,
 * con el detalle de saldo y tipo que ahí sí vale la pena mostrar— para no
 * cambiarle el aspecto a una pantalla que nadie pidió tocar.
 */

const DESTACADAS = 6;

export function PildorasCategoria({
  categorias,
  name = "categoria",
  label = "Categoría",
  nuevaEtiqueta = "Nombre de la categoría nueva",
}: {
  categorias: string[];
  name?: string;
  label?: string;
  nuevaEtiqueta?: string;
}) {
  const destacadas = categorias.slice(0, DESTACADAS);
  const resto = categorias.slice(DESTACADAS);

  const [elegida, setElegida] = useState(destacadas[0] ?? "");
  const [nueva, setNueva] = useState("");
  const [modoNueva, setModoNueva] = useState(false);
  const [verTodas, setVerTodas] = useState(false);

  const valor = modoNueva ? nueva : elegida;
  const visibles = verTodas ? categorias : destacadas;

  return (
    <fieldset className="flex flex-col gap-2.5">
      <div className="flex items-baseline justify-between">
        <Label asChild>
          <legend>{label}</legend>
        </Label>
        {resto.length > 0 && !modoNueva && (
          <button
            type="button"
            onClick={() => setVerTodas((v) => !v)}
            className="-my-3.5 py-3.5 text-xs font-medium text-primary"
          >
            {verTodas ? "Ver menos" : `Ver todas (${categorias.length})`}
          </button>
        )}
      </div>

      <input type="hidden" name={name} value={valor} />

      <div className="flex flex-wrap gap-2">
        {visibles.map((categoria) => {
          const activa = !modoNueva && categoria === elegida;
          return (
            <button
              key={categoria}
              type="button"
              aria-pressed={activa}
              onClick={() => {
                setElegida(categoria);
                setModoNueva(false);
              }}
              data-activa={activa}
              className="rounded-full border border-border px-3.5 py-2 text-[13px] font-semibold transition active:scale-[0.97] data-[activa=true]:border-primary data-[activa=true]:bg-primary data-[activa=true]:text-primary-foreground"
            >
              {categoria}
            </button>
          );
        })}

        <button
          type="button"
          aria-pressed={modoNueva}
          onClick={() => setModoNueva(true)}
          data-activa={modoNueva}
          className="rounded-full border border-dashed border-border px-3.5 py-2 text-[13px] font-semibold text-primary transition data-[activa=true]:border-solid data-[activa=true]:border-primary data-[activa=true]:bg-primary data-[activa=true]:text-primary-foreground"
        >
          + Otra
        </button>
      </div>

      {modoNueva && (
        <div className="flex flex-col gap-2">
          <Input
            autoFocus
            value={nueva}
            onChange={(e) => setNueva(e.target.value)}
            placeholder={nuevaEtiqueta}
            maxLength={30}
            aria-label={nuevaEtiqueta}
          />
          <button
            type="button"
            onClick={() => {
              setModoNueva(false);
              setNueva("");
            }}
            className="-my-2.5 self-start py-2.5 text-xs text-muted-foreground"
          >
            Cancelar y elegir una de la lista
          </button>
        </div>
      )}
    </fieldset>
  );
}

/** Una pastilla-radio: el mismo `peer-checked` que el resto de la app. */
function Pildora({
  name,
  value,
  predeterminada,
  children,
}: {
  name: string;
  value: string;
  predeterminada?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="cursor-pointer">
      <input
        type="radio"
        name={name}
        value={value}
        defaultChecked={predeterminada}
        className="peer sr-only"
      />
      <span className="flex h-10 items-center gap-2 rounded-full border border-border px-3.5 text-[13px] font-semibold transition active:scale-[0.97] peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring">
        {children}
      </span>
    </label>
  );
}

/** Con qué se pagó, en pastillas: el nombre ya dice de qué tipo es. */
export function PildorasCuenta({ cuentas }: { cuentas: CuentaRow[] }) {
  return (
    <fieldset className="flex flex-col gap-2.5">
      <Label asChild>
        <legend>¿Con qué pagaste?</legend>
      </Label>
      <div className="flex flex-wrap gap-2">
        {cuentas.map((cuenta) => (
          <Pildora key={cuenta.id} name="cuenta_id" value={cuenta.id}>
            <span
              aria-hidden
              className={`size-2 rounded-full ${claseColor(cuenta.color)}`}
            />
            {cuenta.nombre}
          </Pildora>
        ))}
        <Pildora name="cuenta_id" value="" predeterminada>
          <span aria-hidden className="size-2 rounded-full bg-muted-foreground" />
          Efectivo
        </Pildora>
      </div>
    </fieldset>
  );
}

/** A dónde entra el ingreso: una cuenta, un ahorro, o ninguno. */
export function PildorasDestino({
  cuentas,
  fondos,
}: {
  cuentas: CuentaRow[];
  fondos: FondoRow[];
}) {
  return (
    <fieldset className="flex flex-col gap-2.5">
      <Label asChild>
        <legend>¿A dónde entra?</legend>
      </Label>
      <div className="flex flex-wrap gap-2">
        {cuentas.map((cuenta) => (
          <Pildora key={cuenta.id} name="destino" value={`cuenta:${cuenta.id}`}>
            <span
              aria-hidden
              className={`size-2 rounded-full ${claseColor(cuenta.color)}`}
            />
            {cuenta.nombre}
          </Pildora>
        ))}
        {fondos.map((fondo) => (
          <Pildora key={fondo.id} name="destino" value={`fondo:${fondo.id}`}>
            <PiggyBank aria-hidden className="size-3.5 text-primary" />
            {fondo.nombre}
          </Pildora>
        ))}
        <Pildora name="destino" value="" predeterminada>
          <span aria-hidden className="size-2 rounded-full bg-muted-foreground" />
          No lo asigno
        </Pildora>
      </div>
    </fieldset>
  );
}
