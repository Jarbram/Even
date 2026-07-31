import { createClient } from "./supabase/server";
import type { Persona } from "./persona";
import type { CuentaRow } from "./cuentas";
import {
  baseCero,
  deudaCruzada,
  lineasPresupuesto,
  mesActual,
  redondear,
  type Mes,
} from "./finanzas";

/**
 * Lectura: todo lo que las pantallas necesitan saber de un mes.
 * Las escrituras viven en `src/app/(app)/acciones.ts`.
 */

export type GastoRow = {
  id: string;
  fecha: string;
  descripcion: string;
  categoria: string;
  monto: number;
  pagado_por: Persona;
  parte_abraham: number;
  recurrente_id: string | null;
  cuenta_id: string | null;
  /** PostgREST devuelve la cuenta enlazada como objeto, o `null` si no tiene. */
  cuentas: { nombre: string; color: string } | null;
};

export type RecurrenteRow = {
  id: string;
  descripcion: string;
  categoria: string;
  monto: number;
  pagado_por: Persona;
  parte_abraham: number;
  dia: number;
  activo: boolean;
};

export type FondoRow = {
  id: string;
  nombre: string;
  meta: number | null;
  saldo: number;
};

export type DeudaRow = {
  id: string;
  nombre: string;
  saldo: number;
  tasa_anual: number;
  pago_mensual: number;
};

export type IngresoRow = {
  id: string;
  persona: Persona;
  descripcion: string;
  monto: number;
};

const CAMPOS_GASTO =
  "id, fecha, descripcion, categoria, monto, pagado_por, parte_abraham, recurrente_id, cuenta_id, cuentas(nombre, color)";

/**
 * Todo lo del mes en una sola pasada. Las consultas son independientes entre
 * sí, así que van en paralelo: en cascada la pantalla tardaría el séxtuple.
 */
export async function resumenDelMes(mes: Mes = mesActual()) {
  const supabase = createClient();

  const [gastos, ingresos, presupuestos, fondos, deudas, cuentas] =
    await Promise.all([
      supabase
        .from("gastos")
        .select(CAMPOS_GASTO)
        .eq("mes", mes)
        .order("fecha", { ascending: false })
        .overrideTypes<GastoRow[]>(),
      supabase
        .from("ingresos")
        .select("id, persona, descripcion, monto")
        .eq("mes", mes)
        .overrideTypes<IngresoRow[]>(),
      supabase.from("presupuestos").select("categoria, monto").eq("mes", mes),
      supabase
        .from("fondos")
        .select("id, nombre, meta, saldo")
        .order("created_at")
        .overrideTypes<FondoRow[]>(),
      supabase
        .from("deudas")
        .select("id, nombre, saldo, tasa_anual, pago_mensual")
        .order("created_at")
        .overrideTypes<DeudaRow[]>(),
      supabase
        .from("cuentas")
        .select("id, nombre, tipo, persona, color, activa")
        .eq("activa", true)
        .order("created_at")
        .overrideTypes<CuentaRow[]>(),
    ]);

  const listaGastos = gastos.data ?? [];
  const listaIngresos = ingresos.data ?? [];
  const listaPresupuestos = presupuestos.data ?? [];
  const listaFondos = fondos.data ?? [];

  const cuadre = baseCero(listaIngresos, listaPresupuestos);
  const totalGastado = listaGastos.reduce((suma, g) => suma + g.monto, 0);

  return {
    mes,
    gastos: listaGastos,
    ingresos: listaIngresos,
    fondos: listaFondos,
    deudas: deudas.data ?? [],
    cuentas: cuentas.data ?? [],
    deuda: deudaCruzada(listaGastos),
    presupuesto: lineasPresupuesto(listaPresupuestos, listaGastos),
    baseCero: cuadre,
    totalGastado: redondear(totalGastado),
    /** Lo que queda del presupuesto asignado, no de los ingresos. */
    restante: redondear(cuadre.asignado - totalGastado),
    ahorros: redondear(listaFondos.reduce((suma, f) => suma + f.saldo, 0)),
  };
}

export async function listarCuentas() {
  const supabase = createClient();
  const { data } = await supabase
    .from("cuentas")
    .select("id, nombre, tipo, persona, color, activa")
    .order("created_at")
    .overrideTypes<CuentaRow[]>();
  return data ?? [];
}

export async function listarRecurrentes() {
  const supabase = createClient();
  const { data } = await supabase
    .from("recurrentes")
    .select(
      "id, descripcion, categoria, monto, pagado_por, parte_abraham, dia, activo",
    )
    .order("dia")
    .overrideTypes<RecurrenteRow[]>();
  return data ?? [];
}

/**
 * Crea en el mes los gastos de los recurrentes activos que aún no estén.
 * Idempotente: se puede llamar en cada carga de la pantalla del mes.
 *
 * La condición de carrera (dos pestañas abriendo el mes a la vez) la corta el
 * índice único `gastos_recurrente_mes_idx`, no este código — por eso el
 * conflicto se ignora en vez de reintentarse.
 */
export async function materializarRecurrentes(mes: Mes = mesActual()) {
  const supabase = createClient();

  const [{ data: recurrentes }, { data: yaCreados }] = await Promise.all([
    supabase
      .from("recurrentes")
      .select("id, descripcion, categoria, monto, pagado_por, parte_abraham, dia")
      .eq("activo", true)
      .overrideTypes<Omit<RecurrenteRow, "activo">[]>(),
    supabase
      .from("gastos")
      .select("recurrente_id")
      .eq("mes", mes)
      .not("recurrente_id", "is", null),
  ]);

  if (!recurrentes?.length) return 0;

  const hechos = new Set((yaCreados ?? []).map((g) => g.recurrente_id));
  const faltan = recurrentes.filter((r) => !hechos.has(r.id));
  if (!faltan.length) return 0;

  const { error } = await supabase.from("gastos").insert(
    faltan.map((r) => ({
      fecha: `${mes.slice(0, 8)}${String(r.dia).padStart(2, "0")}`,
      descripcion: r.descripcion,
      categoria: r.categoria,
      monto: r.monto,
      pagado_por: r.pagado_por,
      parte_abraham: r.parte_abraham,
      recurrente_id: r.id,
    })),
  );

  // 23505 = otra pestaña ganó la carrera. No es un fallo: el gasto ya existe.
  if (error && error.code !== "23505") throw error;

  return faltan.length;
}

/** Gasto total por mes, de más antiguo a más reciente. */
export async function historicoMensual(meses = 6) {
  const supabase = createClient();
  const { data } = await supabase
    .from("gastos")
    .select("mes, monto")
    .order("mes", { ascending: false })
    .overrideTypes<{ mes: string; monto: number }[]>();

  const totales = new Map<string, number>();
  for (const gasto of data ?? []) {
    totales.set(gasto.mes, redondear((totales.get(gasto.mes) ?? 0) + gasto.monto));
  }

  return [...totales.entries()]
    .map(([mes, total]) => ({ mes, total }))
    .sort((a, b) => a.mes.localeCompare(b.mes))
    .slice(-meses);
}
