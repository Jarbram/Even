import { Banknote, CreditCard, Landmark, Wallet, type LucideIcon } from "lucide-react";
import type { Persona } from "./persona";

/** De dónde sale la plata. */
export const TIPOS_CUENTA = {
  efectivo: "Efectivo",
  debito: "Débito",
  credito: "Crédito",
  billetera: "Billetera",
} as const;

export type TipoCuenta = keyof typeof TIPOS_CUENTA;

/** El ícono de cada tipo. Compartido: una tarjeta se dibuja igual en Ajustes
 *  que en el selector del formulario, o dejan de ser el mismo objeto. */
export const ICONO_TIPO: Record<TipoCuenta, LucideIcon> = {
  efectivo: Banknote,
  debito: Landmark,
  credito: CreditCard,
  billetera: Wallet,
};

export type CuentaRow = {
  id: string;
  nombre: string;
  tipo: TipoCuenta;
  persona: Persona;
  color: string;
  activa: boolean;
  /** El punto de partida que se puso al crearla. */
  saldo_base: number;
  /** Lo que tiene hoy: base + lo que entró - lo que salió. Lo calcula la vista. */
  saldo: number;
  /** Cupo total, solo en tarjetas de crédito. */
  linea: number | null;
};

/**
 * Cómo se lee el saldo de una cuenta.
 *
 * Una tarjeta de crédito se mide al revés: su saldo negativo es lo consumido, y
 * lo que importa es cuánto queda del cupo. El resto de cuentas dicen
 * directamente lo que tienen. Una sola fórmula en la base, dos lecturas aquí.
 */
export function leerSaldo(cuenta: {
  tipo: TipoCuenta;
  saldo: number;
  linea: number | null;
}) {
  if (cuenta.tipo !== "credito" || !cuenta.linea) {
    return {
      esCredito: false,
      principal: cuenta.saldo,
      etiqueta: "Saldo",
      consumido: 0,
      disponible: 0,
      proporcion: 0,
    };
  }

  // El saldo va en negativo mientras haya consumo; en positivo si pagaron de
  // más, y entonces no hay nada consumido.
  const consumido = Math.max(-cuenta.saldo, 0);
  const disponible = cuenta.linea - consumido;

  return {
    esCredito: true,
    principal: disponible,
    etiqueta: "Disponible",
    consumido,
    disponible,
    proporcion: Math.min(consumido / cuenta.linea, 1),
  };
}

/**
 * Los puntos de color de la lista de movimientos.
 *
 * ponytail: mapa explícito y no `bg-${color}`. Tailwind borra en el build las
 * clases que no encuentra escritas enteras, así que una clase interpolada
 * saldría sin color en producción y con color en desarrollo — de los bugs más
 * molestos de perseguir.
 */
export const COLORES: Record<string, string> = {
  "chart-1": "bg-chart-1",
  "chart-2": "bg-chart-2",
  "chart-3": "bg-chart-3",
  "chart-4": "bg-chart-4",
  "chart-5": "bg-chart-5",
  "chart-6": "bg-chart-6",
  "chart-7": "bg-chart-7",
  "chart-8": "bg-chart-8",
  "chart-9": "bg-chart-9",
};

export const COLORES_DISPONIBLES = Object.keys(COLORES);

export function claseColor(color: string | undefined): string {
  return COLORES[color ?? ""] ?? "bg-muted-foreground";
}

/**
 * Fondo suave + texto saturado del mismo color, para la insignia de una
 * cuenta: un tono de categoría a toda opacidad detrás de un ícono blanco no
 * se lee igual de bien en lima que en índigo, y esto se lee igual en las
 * nueve. Mismo motivo que `COLORES` para ser un mapa de clases completas y
 * no interpoladas — Tailwind purga en build lo que no encuentra escrito
 * entero.
 */
export const COLORES_INSIGNIA: Record<string, string> = {
  "chart-1": "bg-chart-1/15 text-chart-1",
  "chart-2": "bg-chart-2/15 text-chart-2",
  "chart-3": "bg-chart-3/15 text-chart-3",
  "chart-4": "bg-chart-4/15 text-chart-4",
  "chart-5": "bg-chart-5/15 text-chart-5",
  "chart-6": "bg-chart-6/15 text-chart-6",
  "chart-7": "bg-chart-7/15 text-chart-7",
  "chart-8": "bg-chart-8/15 text-chart-8",
  "chart-9": "bg-chart-9/15 text-chart-9",
};

export function claseInsignia(color: string | undefined): string {
  return COLORES_INSIGNIA[color ?? ""] ?? "bg-muted text-muted-foreground";
}

/**
 * Qué `saldo_base` hay que guardar para que la cuenta muestre `deseado`.
 *
 * El saldo de hoy es la base más todo lo que se movió después, y eso último no
 * se toca: corregir "tengo 300, no 512" no puede borrar un gasto. Así que la
 * diferencia se le carga a la base, que es justo lo que representa —lo que
 * había antes de que la app existiera—.
 *
 * En una tarjeta `deseado` es lo consumido, que es un saldo negativo: mismo
 * criterio que al crearla.
 */
export function baseParaSaldo(
  cuenta: { tipo: TipoCuenta; saldo: number; saldo_base: number },
  deseado: number,
): number {
  const objetivo = cuenta.tipo === "credito" ? -Math.abs(deseado) : deseado;
  const movido = cuenta.saldo - cuenta.saldo_base;
  return Math.round((objetivo - movido + Number.EPSILON) * 100) / 100;
}
