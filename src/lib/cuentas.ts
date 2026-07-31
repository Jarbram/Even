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
