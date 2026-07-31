"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requirePersona } from "@/lib/sesion";
import { PERSONAS } from "@/lib/persona";
import { COLORES_DISPONIBLES, TIPOS_CUENTA } from "@/lib/cuentas";
import { mesActual, normalizarCategoria } from "@/lib/finanzas";

/**
 * Escrituras. Todo lo que entra por aquí viene de un formulario del navegador,
 * así que se valida antes de tocar la base: sin login, la única barrera entre
 * un `fetch` a mano y la tabla es este archivo.
 */

export type Resultado = { error?: string; ok?: boolean };

const persona = z.enum(PERSONAS);

// Texto libre, no lista cerrada: se puede escribir una categoría nueva sin
// tocar el código. Se normaliza para que no acaben "Mercado" y "mercado"
// conviviendo como dos categorías distintas.
const categoria = z
  .string()
  .trim()
  .min(1, "Elige o escribe una categoría")
  .max(30, "La categoría es demasiado larga")
  .transform(normalizarCategoria);
const monto = z.coerce.number().positive("El monto tiene que ser mayor que cero");
const mes = z.string().regex(/^\d{4}-\d{2}-01$/, "Mes inválido");
const uuid = z.uuid("Identificador inválido");
const TIPOS = Object.keys(TIPOS_CUENTA) as [string, ...string[]];

/** Envuelve una acción: valida, escribe y refresca. Devuelve el primer error. */
async function ejecutar<T>(
  esquema: z.ZodType<T>,
  entrada: unknown,
  // PromiseLike, no Promise: el builder de Supabase es un thenable que solo
  // dispara la consulta cuando se hace await.
  escribir: (datos: T) => PromiseLike<{ error: { message: string } | null }>,
): Promise<Resultado> {
  await requirePersona();

  const parsed = esquema.safeParse(entrada);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { error } = await escribir(parsed.data);
  if (error) return { error: "No se pudo guardar. Inténtalo de nuevo." };

  revalidatePath("/", "layout");
  return { ok: true };
}

function campos(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

// ---------------------------------------------------------------------------
// Gastos
// ---------------------------------------------------------------------------

const gasto = z.object({
  fecha: z.iso.date(),
  descripcion: z.string().trim().min(1, "Escribe una descripción").max(80),
  categoria,
  monto,
  pagado_por: persona,
  // Cuánto le toca a Abraham. El formulario manda "0.5", "1" o "0".
  parte_abraham: z.coerce.number().min(0).max(1),
  // Un gasto puede no tener cuenta: el campo solo aparece si ya hay alguna.
  cuenta_id: uuid.nullable().catch(null),
});

export async function crearGasto(_prev: Resultado, formData: FormData) {
  const supabase = createClient();
  return ejecutar(gasto, campos(formData), (datos) =>
    supabase.from("gastos").insert(datos),
  );
}

export async function borrarGasto(id: string) {
  const supabase = createClient();
  return ejecutar(uuid, id, (id) =>
    supabase.from("gastos").delete().eq("id", id),
  );
}

// ---------------------------------------------------------------------------
// Cuentas: efectivo, tarjetas, billeteras
// ---------------------------------------------------------------------------

const cuenta = z.object({
  nombre: z.string().trim().min(1, "Ponle nombre a la cuenta").max(40),
  tipo: z.enum(TIPOS),
  persona,
  color: z.enum(COLORES_DISPONIBLES as [string, ...string[]]).catch("chart-1"),
});

export async function crearCuenta(_prev: Resultado, formData: FormData) {
  const supabase = createClient();
  return ejecutar(cuenta, campos(formData), (datos) =>
    supabase.from("cuentas").insert(datos),
  );
}

export async function borrarCuenta(id: string) {
  const supabase = createClient();
  return ejecutar(uuid, id, (id) =>
    supabase.from("cuentas").delete().eq("id", id),
  );
}

// ---------------------------------------------------------------------------
// Ingresos y presupuesto
// ---------------------------------------------------------------------------

const ingreso = z.object({
  mes: mes.default(mesActual()),
  persona,
  descripcion: z.string().trim().min(1).max(60).default("Sueldo"),
  monto,
});

export async function guardarIngreso(_prev: Resultado, formData: FormData) {
  const supabase = createClient();
  return ejecutar(ingreso, campos(formData), (datos) =>
    supabase.from("ingresos").insert(datos),
  );
}

export async function borrarIngreso(id: string) {
  const supabase = createClient();
  return ejecutar(uuid, id, (id) =>
    supabase.from("ingresos").delete().eq("id", id),
  );
}

const presupuesto = z.object({
  mes: mes.default(mesActual()),
  categoria,
  // Cero es válido aquí: asignar 0 a una categoría es una decisión, no un error.
  monto: z.coerce.number().min(0, "El presupuesto no puede ser negativo"),
});

/** Asigna (o reasigna) el presupuesto de una categoría. La PK hace el upsert. */
export async function guardarPresupuesto(_prev: Resultado, formData: FormData) {
  const supabase = createClient();
  return ejecutar(presupuesto, campos(formData), (datos) =>
    supabase.from("presupuestos").upsert(datos, { onConflict: "mes,categoria" }),
  );
}

// ---------------------------------------------------------------------------
// Fondos de ahorro
// ---------------------------------------------------------------------------

const fondo = z.object({
  nombre: z.string().trim().min(1, "Ponle nombre al fondo").max(40),
  // Un fondo suele nacer con algo dentro: lo que ya tenían ahorrado.
  saldo: z.coerce.number().min(0).catch(0),
  meta: z.coerce.number().positive().nullable().catch(null),
});

export async function crearFondo(_prev: Resultado, formData: FormData) {
  const supabase = createClient();
  return ejecutar(fondo, campos(formData), (datos) =>
    supabase.from("fondos").insert(datos),
  );
}

const movimientoFondo = z.object({
  id: uuid,
  monto: z.coerce.number().positive("Escribe cuánto quieres mover"),
  // "sacar" invierte el signo; el resto entra como aporte.
  direccion: z.enum(["meter", "sacar"]).catch("meter"),
});

/**
 * Mueve dinero al fondo (o lo saca). La suma la hace Postgres, no este código:
 * leer el saldo, sumar aquí y volver a escribirlo perdería un aporte si los dos
 * guardan a la vez.
 */
export async function moverEnFondo(_prev: Resultado, formData: FormData) {
  const supabase = createClient();
  return ejecutar(movimientoFondo, campos(formData), ({ id, monto, direccion }) =>
    supabase.rpc("aportar_a_fondo", {
      fondo_id: id,
      aporte: direccion === "sacar" ? -monto : monto,
    }),
  );
}

export async function borrarFondo(id: string) {
  const supabase = createClient();
  return ejecutar(uuid, id, (id) =>
    supabase.from("fondos").delete().eq("id", id),
  );
}

// ---------------------------------------------------------------------------
// Deudas con terceros
// ---------------------------------------------------------------------------

const deuda = z.object({
  nombre: z.string().trim().min(1, "Ponle nombre a la deuda").max(40),
  saldo: z.coerce.number().min(0),
  tasa_anual: z.coerce.number().min(0).max(200).default(0),
  pago_mensual: monto,
});

export async function guardarDeuda(_prev: Resultado, formData: FormData) {
  const supabase = createClient();
  const id = formData.get("id");

  // Sin id es una deuda nueva; con id, la cuota o el saldo cambiaron.
  if (typeof id === "string" && id) {
    return ejecutar(deuda.extend({ id: uuid }), campos(formData), ({ id, ...resto }) =>
      supabase.from("deudas").update(resto).eq("id", id),
    );
  }
  return ejecutar(deuda, campos(formData), (datos) =>
    supabase.from("deudas").insert(datos),
  );
}

export async function borrarDeuda(id: string) {
  const supabase = createClient();
  return ejecutar(uuid, id, (id) =>
    supabase.from("deudas").delete().eq("id", id),
  );
}

// ---------------------------------------------------------------------------
// Recurrentes
// ---------------------------------------------------------------------------

const recurrente = z.object({
  descripcion: z.string().trim().min(1, "Escribe una descripción").max(80),
  categoria,
  monto,
  pagado_por: persona,
  parte_abraham: z.coerce.number().min(0).max(1),
  // Hasta 28 para que caiga en todos los meses, febrero incluido.
  dia: z.coerce.number().int().min(1).max(28, "Elige un día entre 1 y 28"),
});

export async function crearRecurrente(_prev: Resultado, formData: FormData) {
  const supabase = createClient();
  return ejecutar(recurrente, campos(formData), (datos) =>
    supabase.from("recurrentes").insert(datos),
  );
}

const cambioActivo = z.object({ id: uuid, activo: z.stringbool() });

/**
 * Pausar o reanudar. No devuelve nada a propósito: va en un `<form action>`
 * suelto, que exige `void`, y el resultado se ve en la propia lista al
 * revalidarse.
 */
export async function activarRecurrente(formData: FormData): Promise<void> {
  const supabase = createClient();
  await ejecutar(cambioActivo, campos(formData), ({ id, activo }) =>
    supabase.from("recurrentes").update({ activo }).eq("id", id),
  );
}

export async function borrarRecurrente(id: string) {
  const supabase = createClient();
  return ejecutar(uuid, id, (id) =>
    supabase.from("recurrentes").delete().eq("id", id),
  );
}
