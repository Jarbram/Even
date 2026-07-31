"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Elige categoría sin obligar a leer doce opciones.
 *
 * Arriba las seis que más se usan — al mes de uso son las de siempre y no hay
 * que buscar nada. El resto se despliega solo si hace falta, y "Otra" abre un
 * campo para escribir una nueva: las categorías son texto libre, así que
 * inventarse una no necesita ni migración ni pantalla de administración.
 */

const DESTACADAS = 6;

export function SelectorCategoria({
  categorias,
  label = "Categoría",
}: {
  /** Ya vienen ordenadas por uso, con las sugerencias detrás. */
  categorias: string[];
  label?: string;
}) {
  const destacadas = categorias.slice(0, DESTACADAS);
  const resto = categorias.slice(DESTACADAS);

  const [elegida, setElegida] = useState(destacadas[0] ?? "");
  const [nueva, setNueva] = useState("");
  const [modoNueva, setModoNueva] = useState(false);
  const [verTodas, setVerTodas] = useState(false);

  // Un solo campo sale del formulario, escriba el usuario o toque un chip.
  const valor = modoNueva ? nueva : elegida;
  const visibles = verTodas ? categorias : destacadas;

  return (
    <fieldset className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <Label asChild>
          <legend>{label}</legend>
        </Label>
        {resto.length > 0 && !modoNueva && (
          <button
            type="button"
            onClick={() => setVerTodas((v) => !v)}
            className="text-xs font-medium text-primary"
          >
            {verTodas ? "Ver menos" : `Ver todas (${categorias.length})`}
          </button>
        )}
      </div>

      <input type="hidden" name="categoria" value={valor} />

      <div className="grid grid-cols-3 gap-2">
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
              className="rounded-full border border-border px-3 py-2.5 text-[13px] font-semibold transition-colors data-[activa=true]:border-primary data-[activa=true]:bg-primary data-[activa=true]:text-primary-foreground"
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
          className="rounded-full border border-dashed border-border px-3 py-2.5 text-[13px] font-semibold text-primary transition-colors data-[activa=true]:border-solid data-[activa=true]:border-primary data-[activa=true]:bg-primary data-[activa=true]:text-primary-foreground"
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
            placeholder="Nombre de la categoría nueva"
            maxLength={30}
            aria-label="Nombre de la categoría nueva"
          />
          <button
            type="button"
            onClick={() => {
              setModoNueva(false);
              setNueva("");
            }}
            className="self-start text-xs text-muted-foreground"
          >
            Cancelar y elegir una existente
          </button>
        </div>
      )}
    </fieldset>
  );
}
