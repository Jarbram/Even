"use client";

import { useEffect, useRef, useState } from "react";
import { PiggyBank } from "lucide-react";
import { claseColor, leerSaldo, type CuentaRow } from "@/lib/cuentas";
import type { FondoRow } from "@/lib/datos";
import { soles } from "@/lib/finanzas";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Selección en pastillas: categoría, cuenta y destino comparten el mismo
 * gesto en toda la app — una sola fila que se desliza horizontal, no una
 * grilla que envuelve a dos o tres filas. Con seis campos apilados en una
 * hoja, cada fila que se envolvía en dos era la diferencia entre que el
 * formulario entero cupiera en la pantalla del celular o hubiera que
 * desplazarse para llegar al botón de guardar — justo lo que se quería
 * evitar al pagar de pie. Deslizar la fila en vez de "Ver más" también es
 * el gesto que ya usan Yape o Plin para elegir entre varias opciones.
 *
 * Antes esto solo vivía en las hojas rápidas del Home; el formulario largo
 * (/movimientos/nuevo, /ingresos, presupuesto) tenía su propia versión en
 * tarjetas de columnas fijas. Dos formularios para la misma acción con dos
 * aspectos distintos significaba que lo aprendido en uno no servía en el
 * otro — ahora es un solo lenguaje visual para elegir estos campos,
 * cualquiera sea la puerta por la que se entre.
 */

/** La fila que se desliza: sin envolver, sin barra de scroll visible —el
    mismo criterio que ya oculta la barra en toda la app—, y con snap: sin
    esto un swipe sin querer deja una pastilla a medio cortar en el borde.
    `overscroll-x-contain` + `touch-action:pan-x` contienen el gesto: al
    llegar al final de la fila no se lo pasan a la hoja entera.

    Para que haya algo que deslizar, el <fieldset> que envuelve esta fila
    lleva `min-w-0`: sin eso el `min-inline-size: min-content` que el
    navegador le pone de fábrica a todo <fieldset> lo estira hasta caber
    todas las pastillas, la fila nunca queda más angosta que su contenido
    y no hay scroll — se veía como que "no se movía" en el celular. */
const FILA =
  "flex snap-x snap-proximity gap-2 overflow-x-auto overscroll-x-contain pr-1 pb-0.5 [touch-action:pan-x] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";
const PILDORA_SNAP = "snap-start scroll-ml-1";

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
  const activaRef = useRef<HTMLButtonElement>(null);
  const filaRef = useRef<HTMLDivElement>(null);

  // Al editar, la categoría ya elegida puede estar lejos en la fila —sin
  // esto quedaba fuera de vista sin ninguna pista de que algo ya estaba
  // marcado. Solo al montar: una vez que el usuario toca otra, ya la ve.
  useEffect(() => {
    if (valorInicial) activaRef.current?.scrollIntoView({ block: "nearest", inline: "center" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

      {/* "+ Otra" es una pastilla más, dentro de la misma fila que se
          desliza — el mismo patrón que "Efectivo" en cuenta o "No lo
          asigno" en destino: una sola fila, todo se desliza junto, sin una
          excepción fija aparte que rompa la coherencia entre los tres
          selectores. */}
      <div ref={filaRef} className={FILA}>
        {categorias.map((categoria) => {
          const activa = !modoNueva && categoria === elegida;
          return (
            <button
              key={categoria}
              ref={categoria === valorInicial ? activaRef : undefined}
              type="button"
              aria-pressed={activa}
              onClick={() => elegir(categoria)}
              data-activa={activa}
              className={`shrink-0 rounded-full border border-border px-3.5 py-2 text-[13px] font-semibold whitespace-nowrap transition active:scale-[0.97] data-[activa=true]:border-primary data-[activa=true]:bg-primary data-[activa=true]:text-primary-foreground ${PILDORA_SNAP}`}
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
          className={`shrink-0 rounded-full border border-dashed border-border px-3.5 py-2 text-[13px] font-semibold whitespace-nowrap text-primary transition data-[activa=true]:border-solid data-[activa=true]:border-primary data-[activa=true]:bg-primary data-[activa=true]:text-primary-foreground ${PILDORA_SNAP}`}
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
              // "+ Otra" vive al final de la fila: al volver, la fila queda
              // desplazada hasta la derecha y no se ven las categorías.
              // Directo, no `scrollTo({behavior:"smooth"})`: el scroll-snap
              // de la fila se come la animación y no pasa nada.
              if (filaRef.current) filaRef.current.scrollLeft = 0;
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
  pildoraRef,
  children,
}: {
  name: string;
  value: string;
  predeterminada?: boolean;
  checked?: boolean;
  onSeleccionar?: () => void;
  pildoraRef?: React.Ref<HTMLLabelElement>;
  children: React.ReactNode;
}) {
  return (
    <label ref={pildoraRef} className={`shrink-0 cursor-pointer ${PILDORA_SNAP}`}>
      <input
        type="radio"
        name={name}
        value={value}
        {...(checked === undefined
          ? { defaultChecked: predeterminada }
          : { checked, onChange: onSeleccionar })}
        className="peer sr-only"
      />
      <span className="flex h-10 items-center gap-2 rounded-full border border-border px-3.5 text-[13px] font-semibold whitespace-nowrap transition active:scale-[0.97] peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring">
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
  const activaRef = useRef<HTMLLabelElement>(null);

  useEffect(() => {
    if (valorInicial) activaRef.current?.scrollIntoView({ block: "nearest", inline: "center" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
              pildoraRef={cuenta.id === valorInicial ? activaRef : undefined}
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
          pildoraRef={valorInicial === "" ? activaRef : undefined}
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
  const activaRef = useRef<HTMLLabelElement>(null);

  useEffect(() => {
    if (valorInicial) activaRef.current?.scrollIntoView({ block: "nearest", inline: "center" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
            pildoraRef={o.valor === valorInicial ? activaRef : undefined}
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
          pildoraRef={valorInicial === "" ? activaRef : undefined}
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
