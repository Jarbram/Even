import { createClient } from "./supabase/server";
import type { Persona } from "./persona";
import type { CuentaRow } from "./cuentas";
import {
  CATEGORIAS_SUGERIDAS,
  deudaCruzada,
  lineasPresupuesto,
  mesActual,
  redondear,
  resumenPresupuesto,
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
  cuenta_id: string | null;
  /** PostgREST devuelve la cuenta enlazada como objeto, o `null` si no tiene. */
  cuentas: { nombre: string; color: string } | null;
};

export type FondoRow = {
  id: string;
  nombre: string;
  meta: number | null;
  saldo: number;
};

export type IngresoRow = {
  id: string;
  persona: Persona;
  descripcion: string;
  monto: number;
  cuenta_id: string | null;
  fondo_id: string | null;
  /** PostgREST devuelve el destino enlazado, o `null` si no se indicó. */
  cuentas: { nombre: string; color: string } | null;
  fondos: { nombre: string } | null;
};

const CAMPOS_GASTO =
  "id, fecha, descripcion, categoria, monto, pagado_por, parte_abraham, cuenta_id, cuentas(nombre, color)";

/**
 * Todo lo del mes en una sola pasada. Las consultas son independientes entre
 * sí, así que van en paralelo: en cascada la pantalla tardaría el séxtuple.
 */
export async function resumenDelMes(mes: Mes = mesActual()) {
  const supabase = createClient();

  const [gastos, ingresos, presupuestos, fondos, cuentas] =
    await Promise.all([
      supabase
        .from("gastos")
        .select(CAMPOS_GASTO)
        .eq("mes", mes)
        .order("fecha", { ascending: false })
        .overrideTypes<GastoRow[]>(),
      supabase
        .from("ingresos")
        .select(
          "id, persona, descripcion, monto, cuenta_id, fondo_id, cuentas(nombre, color), fondos(nombre)",
        )
        .eq("mes", mes)
        .order("created_at", { ascending: false })
        .overrideTypes<IngresoRow[]>(),
      supabase.from("presupuestos").select("categoria, monto").eq("mes", mes),
      supabase
        .from("fondos")
        .select("id, nombre, meta, saldo")
        .order("created_at")
        .overrideTypes<FondoRow[]>(),
      supabase
        .from("cuentas_saldo")
        .select("id, nombre, tipo, persona, color, activa, saldo_base, saldo")
        .eq("activa", true)
        .order("created_at")
        .overrideTypes<CuentaRow[]>(),
    ]);

  const listaGastos = gastos.data ?? [];
  const listaIngresos = ingresos.data ?? [];
  const listaFondos = fondos.data ?? [];

  // Los topes se deciden una vez, no cada mes: si este mes no tiene ninguno
  // propio, siguen valiendo los últimos acordados.
  const topes = presupuestos.data?.length
    ? presupuestos.data
    : await topesHeredados(mes);

  const lineas = lineasPresupuesto(topes, listaGastos);
  const presupuesto = resumenPresupuesto(lineas);

  return {
    mes,
    gastos: listaGastos,
    ingresos: listaIngresos,
    fondos: listaFondos,
    cuentas: cuentas.data ?? [],
    deuda: deudaCruzada(listaGastos),
    lineas,
    presupuesto,
    /** `true` si los topes vienen de un mes anterior y no de este. */
    topesHeredados: !presupuestos.data?.length && topes.length > 0,
    totalGastado: presupuesto.gastado,
    restante: presupuesto.restante,
    ingresosTotal: redondear(
      listaIngresos.reduce((suma, i) => suma + i.monto, 0),
    ),
    ahorros: redondear(listaFondos.reduce((suma, f) => suma + f.saldo, 0)),
  };
}

/**
 * Los topes del mes con topes más reciente anterior a `mes`.
 *
 * ponytail: se copian al vuelo en vez de duplicar filas en cada mes nuevo. Así
 * cambiar un tope en enero no reescribe la historia de diciembre, y no hace
 * falta un proceso que cree el mes.
 */
async function topesHeredados(mes: Mes) {
  const supabase = createClient();
  const { data } = await supabase
    .from("presupuestos")
    .select("mes, categoria, monto")
    .lt("mes", mes)
    .order("mes", { ascending: false })
    .limit(60)
    .overrideTypes<{ mes: string; categoria: string; monto: number }[]>();

  if (!data?.length) return [];

  const ultimo = data[0].mes;
  return data.filter((t) => t.mes === ultimo);
}

/**
 * Las categorías ordenadas por cuánto se usan, con las sugerencias detrás para
 * rellenar. Es lo que decide qué chips salen primero en el formulario: al mes
 * de uso, arriba están las cuatro de siempre y no hay que buscar nada.
 */
export async function categoriasUsadas(): Promise<string[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("gastos")
    .select("categoria")
    .order("fecha", { ascending: false })
    // Un año largo de gastos basta para saber qué se usa; leer el histórico
    // entero solo para ordenar chips sería tirar el dinero.
    .limit(500)
    .overrideTypes<{ categoria: string }[]>();

  const veces = new Map<string, number>();
  for (const { categoria } of data ?? []) {
    veces.set(categoria, (veces.get(categoria) ?? 0) + 1);
  }

  const usadas = [...veces.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([categoria]) => categoria);

  const vistas = new Set(usadas);
  return [
    ...usadas,
    ...CATEGORIAS_SUGERIDAS.filter((c) => !vistas.has(c)),
  ];
}

const CONCEPTOS_BASE = ["Sueldo", "Extra", "Venta", "Regalo"];

/** Lo mismo que `categoriasUsadas`, para el concepto de los ingresos. */
export async function conceptosUsados(): Promise<string[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("ingresos")
    .select("descripcion")
    .order("created_at", { ascending: false })
    .limit(100)
    .overrideTypes<{ descripcion: string }[]>();

  const veces = new Map<string, number>();
  for (const { descripcion } of data ?? []) {
    veces.set(descripcion, (veces.get(descripcion) ?? 0) + 1);
  }

  const usados = [...veces.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([concepto]) => concepto);

  const vistos = new Set(usados);
  return [...usados, ...CONCEPTOS_BASE.filter((c) => !vistos.has(c))];
}

export async function listarCuentas() {
  const supabase = createClient();
  // La vista, no la tabla: trae el saldo de hoy ya calculado.
  const { data } = await supabase
    .from("cuentas_saldo")
    .select("id, nombre, tipo, persona, color, activa, saldo_base, saldo")
    .order("created_at")
    .overrideTypes<CuentaRow[]>();
  return data ?? [];
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
