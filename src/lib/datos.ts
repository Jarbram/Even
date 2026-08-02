import { createClient } from "./supabase/server";
import type { Persona } from "./persona";
import type { CuentaRow } from "./cuentas";
import {
  CATEGORIAS_SUGERIDAS,
  lineasPresupuesto,
  mesActual,
  presupuestosVigentes,
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
  "id, fecha, descripcion, categoria, monto, pagado_por, cuenta_id, cuentas(nombre, color)";

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
      supabase
        .from("presupuestos")
        .select("mes, categoria, monto")
        .lte("mes", mes)
        .overrideTypes<{ mes: string; categoria: string; monto: number }[]>(),
      supabase
        .from("fondos")
        .select("id, nombre, meta, saldo")
        .order("created_at")
        .overrideTypes<FondoRow[]>(),
      supabase
        .from("cuentas_saldo")
        .select("id, nombre, tipo, persona, color, activa, saldo_base, saldo, linea")
        .eq("activa", true)
        .order("created_at")
        .overrideTypes<CuentaRow[]>(),
    ]);

  const listaGastos = gastos.data ?? [];
  const listaIngresos = ingresos.data ?? [];
  const listaFondos = fondos.data ?? [];

  // Los topes se deciden una vez, no cada mes: cada categoría conserva su
  // último valor acordado hasta que alguien lo cambie, aunque ese cambio
  // haya tocado solo otra categoría.
  const topes = presupuestosVigentes(presupuestos.data ?? [], mes);

  const lineas = lineasPresupuesto(topes, listaGastos);
  const presupuesto = resumenPresupuesto(lineas);

  return {
    mes,
    gastos: listaGastos,
    ingresos: listaIngresos,
    fondos: listaFondos,
    cuentas: cuentas.data ?? [],
    lineas,
    presupuesto,
    /** `true` si ninguna categoría tiene un tope puesto este mismo mes. */
    topesHeredados: topes.length > 0 && topes.every((t) => t.mes !== mes),
    totalGastado: presupuesto.gastado,
    restante: presupuesto.restante,
    ingresosTotal: redondear(
      listaIngresos.reduce((suma, i) => suma + i.monto, 0),
    ),
    ahorros: redondear(listaFondos.reduce((suma, f) => suma + f.saldo, 0)),
  };
}

/**
 * Las categorías ordenadas por cuánto se usan, con las que ya tienen
 * presupuesto puesto justo detrás —aunque no se les haya cargado ni un
 * gasto—. Es lo que decide qué chips salen primero en el formulario: al mes
 * de uso, arriba están las cuatro de siempre y no hay que buscar nada.
 *
 * Una categoría con presupuesto es una categoría que sí o sí se va a usar:
 * sin esto, tocaba escribirla a mano con "+ Otra" hasta el primer gasto.
 *
 * Las doce sugeridas (`CATEGORIAS_SUGERIDAS`) solo aparecen si todavía no hay
 * ni un gasto ni un presupuesto propios: en cuanto la pareja tiene sus
 * categorías, las genéricas que nunca eligieron solo estorban en la lista.
 */
export async function categoriasUsadas(): Promise<string[]> {
  const supabase = createClient();
  const [gastos, presupuestos] = await Promise.all([
    supabase
      .from("gastos")
      .select("categoria")
      .order("fecha", { ascending: false })
      // Un año largo de gastos basta para saber qué se usa; leer el histórico
      // entero solo para ordenar chips sería tirar el dinero.
      .limit(500)
      .overrideTypes<{ categoria: string }[]>(),
    supabase.from("presupuestos").select("categoria").overrideTypes<{ categoria: string }[]>(),
  ]);

  const veces = new Map<string, number>();
  for (const { categoria } of gastos.data ?? []) {
    veces.set(categoria, (veces.get(categoria) ?? 0) + 1);
  }

  const usadas = [...veces.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([categoria]) => categoria);

  const vistas = new Set(usadas);
  const conPresupuesto = [
    ...new Set((presupuestos.data ?? []).map((p) => p.categoria)),
  ].filter((c) => !vistas.has(c));

  const propias = [...usadas, ...conPresupuesto];
  return propias.length > 0 ? propias : [...CATEGORIAS_SUGERIDAS];
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
    .select("id, nombre, tipo, persona, color, activa, saldo_base, saldo, linea")
    .order("created_at")
    .overrideTypes<CuentaRow[]>();
  return data ?? [];
}

export type GastoPorCobrar = {
  id: string;
  fecha: string;
  descripcion: string;
  categoria: string;
  monto: number;
  pagado_por: Persona;
};

/**
 * Gastos marcados "a reembolsar" que todavía no tienen un reembolso que los
 * salde. No se limita al mes: una devolución pendiente no se resuelve sola
 * el día 1, igual que la deuda del histórico.
 */
export async function gastosPorCobrar(): Promise<GastoPorCobrar[]> {
  const supabase = createClient();
  const [gastos, reembolsos] = await Promise.all([
    supabase
      .from("gastos")
      .select("id, fecha, descripcion, categoria, monto, pagado_por")
      .eq("a_reembolsar", true)
      .order("fecha", { ascending: false })
      .overrideTypes<GastoPorCobrar[]>(),
    supabase
      .from("reembolsos")
      .select("gasto_id")
      .overrideTypes<{ gasto_id: string | null }[]>(),
  ]);

  const saldados = new Set((reembolsos.data ?? []).map((r) => r.gasto_id));
  return (gastos.data ?? []).filter((g) => !saldados.has(g.id));
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

export type PagoTarjetaRow = {
  id: string;
  fecha: string;
  monto: number;
  desde_cuenta_id: string | null;
  desde: { nombre: string } | null;
};

/**
 * Una cuenta con todo lo suyo: sus gastos, sus pagos y su saldo.
 *
 * Los gastos van sin límite de mes a propósito — al abrir una tarjeta lo que se
 * quiere ver es en qué se fue el cupo, y eso cruza meses.
 */
export async function detalleCuenta(id: string) {
  const supabase = createClient();

  const [cuenta, gastos, pagos] = await Promise.all([
    supabase
      .from("cuentas_saldo")
      .select("id, nombre, tipo, persona, color, activa, saldo_base, saldo, linea")
      .eq("id", id)
      .maybeSingle()
      .overrideTypes<CuentaRow>(),
    supabase
      .from("gastos")
      .select("id, fecha, descripcion, categoria, monto, pagado_por")
      .eq("cuenta_id", id)
      .order("fecha", { ascending: false })
      .limit(60)
      .overrideTypes<
        {
          id: string;
          fecha: string;
          descripcion: string;
          categoria: string;
          monto: number;
          pagado_por: Persona;
        }[]
      >(),
    supabase
      .from("pagos_tarjeta")
      .select("id, fecha, monto, desde_cuenta_id, desde:cuentas!pagos_tarjeta_desde_cuenta_id_fkey(nombre)")
      .eq("tarjeta_id", id)
      .order("fecha", { ascending: false })
      .overrideTypes<PagoTarjetaRow[]>(),
  ]);

  return {
    cuenta: cuenta.data ?? null,
    gastos: gastos.data ?? [],
    pagos: pagos.data ?? [],
  };
}
