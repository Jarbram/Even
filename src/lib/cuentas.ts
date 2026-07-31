import type { Persona } from "./persona";

/** De dónde sale la plata. */
export const TIPOS_CUENTA = {
  efectivo: "Efectivo",
  debito: "Débito",
  credito: "Crédito",
  billetera: "Billetera",
} as const;

export type TipoCuenta = keyof typeof TIPOS_CUENTA;

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
};

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
