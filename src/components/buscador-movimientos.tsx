"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import type { CuentaRow } from "@/lib/cuentas";
import type { GastoRow } from "@/lib/datos";
import { redondear, soles } from "@/lib/finanzas";
import { CabeceraDia } from "@/components/cabecera-dia";
import { FilaGasto } from "@/components/fila-gasto";

const DIA_LARGO = new Intl.DateTimeFormat("es-PE", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

/**
 * Busca por texto sobre lo que el servidor ya filtró por día y categoría.
 * Local, no por URL: los gastos del mes ya están cargados, así que filtrar
 * en el cliente es instantáneo — una búsqueda por `?q=` habría significado
 * un viaje al servidor por cada letra tecleada.
 *
 * ponytail: busca solo en la descripción. Es lo que alguien recuerda de un
 * gasto puntual ("ese taxi", "la farmacia") — la categoría y la cuenta ya
 * tienen su propio filtro arriba.
 */
export function BuscadorMovimientos({
  gastos,
  agrupar,
  categorias,
  cuentas,
  descripciones,
  vacioMensaje,
}: {
  gastos: GastoRow[];
  /** Con un día ya filtrado, la cabecera de fecha sobra: está justo arriba. */
  agrupar: boolean;
  categorias: string[];
  cuentas: CuentaRow[];
  descripciones: string[];
  /** Qué decir si no hay nada que buscar (mes o día ya vacío). */
  vacioMensaje: string;
}) {
  const [busqueda, setBusqueda] = useState("");
  const query = busqueda.trim().toLowerCase();
  const filtrados = query
    ? gastos.filter((g) => g.descripcion.toLowerCase().includes(query))
    : gastos;

  return (
    <>
      {gastos.length > 0 && (
        <div className="relative mb-3">
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar en qué fue…"
            aria-label="Buscar por descripción"
            className="panel-hueco h-11 w-full rounded-full py-2 pr-4 pl-10 text-sm placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          />
        </div>
      )}

      {gastos.length === 0 ? (
        <p className="panel rounded-lg p-4 text-sm text-muted-foreground">{vacioMensaje}</p>
      ) : filtrados.length === 0 ? (
        <p className="panel rounded-lg p-4 text-sm text-muted-foreground">
          Nada con &ldquo;{busqueda.trim()}&rdquo;.
        </p>
      ) : (
        <ListaPorDia
          gastos={filtrados}
          agrupar={agrupar}
          categorias={categorias}
          cuentas={cuentas}
          descripciones={descripciones}
        />
      )}
    </>
  );
}

/** Los gastos agrupados por día: es como se recuerda un gasto. */
function ListaPorDia({
  gastos,
  agrupar,
  categorias,
  cuentas,
  descripciones,
}: {
  gastos: GastoRow[];
  agrupar: boolean;
  categorias: string[];
  cuentas: CuentaRow[];
  descripciones: string[];
}) {
  if (!agrupar) {
    return (
      <ul className="flex flex-col gap-2">
        {gastos.map((gasto) => (
          <li key={gasto.id}>
            <FilaGasto
              gasto={gasto}
              borrable
              categorias={categorias}
              cuentas={cuentas}
              descripciones={descripciones}
            />
          </li>
        ))}
      </ul>
    );
  }

  // Ya vienen ordenados por fecha descendente, así que el Map conserva ese
  // orden sin volver a ordenar nada.
  const porDia = new Map<string, GastoRow[]>();
  for (const gasto of gastos) {
    porDia.set(gasto.fecha, [...(porDia.get(gasto.fecha) ?? []), gasto]);
  }

  return [...porDia.entries()].map(([fecha, delDia]) => (
    <section key={fecha} className="mb-5">
      <CabeceraDia
        total={soles(redondear(delDia.reduce((suma, g) => suma + g.monto, 0)))}
      >
        {DIA_LARGO.format(new Date(`${fecha}T00:00:00Z`))}
      </CabeceraDia>
      <ul className="flex flex-col gap-2">
        {delDia.map((gasto) => (
          <li key={gasto.id}>
            {/* La fecha ya la dice la cabecera del grupo: repetirla en cada
                fila se comía el nombre de la cuenta. */}
            <FilaGasto
              gasto={gasto}
              borrable
              conFecha={false}
              categorias={categorias}
              cuentas={cuentas}
              descripciones={descripciones}
            />
          </li>
        ))}
      </ul>
    </section>
  ));
}
