"use client";

import { useEffect, useState } from "react";
import { PiggyBank } from "lucide-react";
import { claseColor, leerSaldo, type CuentaRow } from "@/lib/cuentas";
import type { FondoRow } from "@/lib/datos";
import { soles } from "@/lib/finanzas";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Selección en pastillas: categoría, cuenta y destino comparten el mismo
 * gesto en toda la app. Todas las opciones a la vista, envueltas en las
 * filas que hagan falta — nada de scroll horizontal.
 *
 * La versión anterior era una sola fila que se deslizaba de lado. Sobre el
 * papel ocupaba menos alto; en la práctica el deslizamiento horizontal
 * dentro de la hoja no funcionaba en el celular (la hoja se lo comía) y,
 * aunque funcionara, escondía media lista sin avisar —justo lo que no
 * puede pasar al pagar de pie y con prisa: la opción que no se ve es la
 * que no se elige—. Envolver ocupa un poco más y a veces hay que bajar
 * para llegar a Guardar, pero ese scroll vertical sí responde y ninguna
 * categoría queda oculta.
 */

/** Fila de pastillas: envuelve, no se desliza. */
const FILA = "flex min-w-0 flex-wrap gap-2";

/** Alto mínimo de 44 px: la escena de registro es una mano de pie (PRODUCT.md). */
const PILDORA =
  "inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-3.5 text-[13px] font-semibold whitespace-nowrap transition active:scale-[0.97]";

export function PildorasCategoria({
  categorias,
  name = "categoria",
  label = "Categoría",
  nuevaEtiqueta = "Nombre de la categoría nueva",
  valorInicial,
  onChange,
}: {
  categorias: string[];
  name?: string;
  label?: string;
  nuevaEtiqueta?: string;
  /** Al editar: la categoría ya elegida. */
  valorInicial?: string;
  /** Para los pocos casos en que otro campo depende de esto —la cuenta
      sugerida, en el gasto. */
  onChange?: (categoria: string) => void;
}) {
  const [elegida, setElegida] = useState(valorInicial || categorias[0] || "");
  const [nueva, setNueva] = useState("");
  const [modoNueva, setModoNueva] = useState(false);

  function elegir(categoria: string) {
    setElegida(categoria);
    setModoNueva(false);
    onChange?.(categoria);
  }

  // Un solo campo sale del formulario, escriba el usuario o toque un chip.
  const valor = modoNueva ? nueva : elegida;

  return (
    <fieldset className="flex min-w-0 flex-col gap-2">
      <Label asChild>
        <legend>{label}</legend>
      </Label>

      <input type="hidden" name={name} value={valor} />

      {/* "+ Otra" es una pastilla más de la misma cuadrícula —el mismo
          patrón que "Efectivo" en cuenta o "No lo asigno" en destino. */}
      <div className={FILA}>
        {categorias.map((categoria) => {
          const activa = !modoNueva && categoria === elegida;
          return (
            <button
              key={categoria}
              type="button"
              aria-pressed={activa}
              onClick={() => elegir(categoria)}
              data-activa={activa}
              className={`${PILDORA} data-[activa=true]:border-primary data-[activa=true]:bg-primary data-[activa=true]:text-primary-foreground`}
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
          className={`${PILDORA} border-dashed text-primary data-[activa=true]:border-solid data-[activa=true]:border-primary data-[activa=true]:bg-primary data-[activa=true]:text-primary-foreground`}
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

/**
 * Una pastilla-radio: el mismo `peer-checked` que el resto de la app.
 *
 * Controlada cuando llega `checked` (para `PildorasCuenta`, que necesita
 * cambiar la elegida sola cuando cambia la categoría); no controlada con
 * `predeterminada` en el resto, que nunca cambia después de montar.
 */
function Pildora({
  name,
  value,
  predeterminada,
  checked,
  onSeleccionar,
  children,
}: {
  name: string;
  value: string;
  predeterminada?: boolean;
  checked?: boolean;
  onSeleccionar?: () => void;
  children: React.ReactNode;
}) {
  return (
    <label className="cursor-pointer">
      <input
        type="radio"
        name={name}
        value={value}
        {...(checked === undefined
          ? { defaultChecked: predeterminada }
          : { checked, onChange: onSeleccionar })}
        className="peer sr-only"
      />
      <span
        className={`${PILDORA} peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring`}
      >
        {children}
      </span>
    </label>
  );
}

/**
 * Con qué se pagó, en pastillas. El saldo va al lado del nombre —importa
 * más al pagar cuánto queda en la tarjeta que de quién es.
 *
 * `sugerida` precarga la cuenta con la que más veces se pagó esta
 * categoría —"Mercado" ya no vuelve a Efectivo por defecto si siempre se
 * paga con la misma tarjeta—, pero solo hasta que el usuario toque una
 * pastilla: a partir de ahí, lo que eligió manda y ya no se le mueve solo.
 */
export function PildorasCuenta({
  cuentas,
  valorInicial = "",
  sugerida,
}: {
  cuentas: CuentaRow[];
  /** Al editar: el `cuenta_id` ya elegido ("" es Efectivo). */
  valorInicial?: string;
  /** Al crear: la cuenta más usada para la categoría elegida. */
  sugerida?: string;
}) {
  const [elegida, setElegida] = useState(valorInicial || sugerida || "");
  const [tocada, setTocada] = useState(false);

  // Sigue la sugerencia mientras el usuario no haya tocado nada él mismo.
  useEffect(() => {
    if (!tocada && !valorInicial) setElegida(sugerida || "");
  }, [sugerida, tocada, valorInicial]);

  return (
    <fieldset className="flex min-w-0 flex-col gap-2">
      <Label asChild>
        <legend>¿Con qué pagaste?</legend>
      </Label>

      <div className={FILA}>
        {cuentas.map((cuenta) => {
          const saldo = leerSaldo(cuenta);
          return (
            <Pildora
              key={cuenta.id}
              name="cuenta_id"
              value={cuenta.id}
              checked={cuenta.id === elegida}
              onSeleccionar={() => {
                setElegida(cuenta.id);
                setTocada(true);
              }}
            >
              <span
                aria-hidden
                className={`size-2 rounded-full ${claseColor(cuenta.color)}`}
              />
              {cuenta.nombre}
              <span className="opacity-70">{soles(saldo.principal)}</span>
            </Pildora>
          );
        })}
        <Pildora
          name="cuenta_id"
          value=""
          checked={elegida === ""}
          onSeleccionar={() => {
            setElegida("");
            setTocada(true);
          }}
        >
          <span aria-hidden className="size-2 rounded-full bg-muted-foreground" />
          Efectivo
        </Pildora>
      </div>
    </fieldset>
  );
}

/** A dónde entra el ingreso: una cuenta, un ahorro, o ninguno. Mismo patrón
    de saldo visible que `PildorasCuenta`. */
export function PildorasDestino({
  cuentas,
  fondos,
  valorInicial = "",
}: {
  cuentas: CuentaRow[];
  fondos: FondoRow[];
  /** Al editar: el `destino` ya elegido ("cuenta:id" / "fondo:id" / ""). */
  valorInicial?: string;
}) {
  const opciones = [
    ...cuentas.map((c) => ({
      valor: `cuenta:${c.id}`,
      nombre: c.nombre,
      pie: soles(leerSaldo(c).principal),
      icono: (
        <span aria-hidden className={`size-2 rounded-full ${claseColor(c.color)}`} />
      ),
    })),
    ...fondos.map((f) => ({
      valor: `fondo:${f.id}`,
      nombre: f.nombre,
      pie: soles(f.saldo),
      icono: <PiggyBank aria-hidden className="size-3.5 text-primary" />,
    })),
  ];

  return (
    <fieldset className="flex min-w-0 flex-col gap-2">
      <Label asChild>
        <legend>¿A dónde entra?</legend>
      </Label>

      <div className={FILA}>
        {opciones.map((o) => (
          <Pildora
            key={o.valor}
            name="destino"
            value={o.valor}
            predeterminada={o.valor === valorInicial}
          >
            {o.icono}
            {o.nombre}
            <span className="opacity-70">{o.pie}</span>
          </Pildora>
        ))}
        <Pildora
          name="destino"
          value=""
          predeterminada={valorInicial === ""}
        >
          <span aria-hidden className="size-2 rounded-full bg-muted-foreground" />
          No lo asigno
        </Pildora>
      </div>

      {fondos.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Si eliges un ahorro, el fondo sube solo con este ingreso.
        </p>
      )}
    </fieldset>
  );
}
