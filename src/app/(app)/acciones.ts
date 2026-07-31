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

const cuenta = z
  .object({
    nombre: z.string().trim().min(1, "Ponle nombre a la cuenta").max(40),
    tipo: z.enum(TIPOS),
    persona,
    // El punto de partida. El saldo de hoy lo calcula la vista `cuentas_saldo`.
    saldo_base: z.coerce.number().catch(0),
    // Cupo de la tarjeta. Vacío en todo lo demás, y también en una tarjeta a la
    // que no se le quiera poner límite.
    linea: z.coerce.number().positive().nullable().catch(null),
  })
  .transform((datos) => ({
    ...datos,
    // En una tarjeta el formulario pregunta cuánto llevas CONSUMIDO, que es lo
    // que uno sabe de memoria. El saldo va en el otro sentido: deber 4000 es
    // un saldo de -4000, y de ahí sale el disponible.
    saldo_base:
      datos.tipo === "credito"
        ? -Math.abs(datos.saldo_base)
        : datos.saldo_base,
    linea: datos.tipo === "credito" ? datos.linea : null,
  }));

export async function crearCuenta(_prev: Resultado, formData: FormData) {
  const supabase = createClient();
  const color = await colorLibre(supabase);

  return ejecutar(cuenta, campos(formData), (datos) =>
    supabase.from("cuentas").insert({ ...datos, color }),
  );
}

/**
 * Un color que no esté ya en uso, y si están todos, uno al azar.
 *
 * El color no lo elige nadie: solo sirve para distinguir cuentas de un vistazo
 * en la lista de movimientos, así que preferir uno libre antes que el azar puro
 * es justo lo que hace que cumpla su función. Elegirlo era una pregunta más en
 * un formulario que ya tenía cuatro.
 */
async function colorLibre(supabase: ReturnType<typeof createClient>) {
  const { data } = await supabase
    .from("cuentas")
    .select("color")
    .overrideTypes<{ color: string }[]>();

  const usados = new Set((data ?? []).map((c) => c.color));
  const libres = COLORES_DISPONIBLES.filter((c) => !usados.has(c));
  const donde = libres.length > 0 ? libres : COLORES_DISPONIBLES;

  return donde[Math.floor(Math.random() * donde.length)];
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

const ingreso = z
  .object({
    mes: mes.default(mesActual()),
    persona,
    descripcion: z.string().trim().min(1).max(60).default("Sueldo"),
    monto,
    // El formulario manda un solo campo `destino`: "cuenta:<id>", "fondo:<id>"
    // o vacío. Se parte aquí para que la base reciba las dos columnas que
    // entiende, y nunca las dos llenas a la vez.
    destino: z.string().default(""),
  })
  .transform(({ destino, ...resto }) => {
    const [tipo, id] = destino.split(":");
    return {
      ...resto,
      cuenta_id: tipo === "cuenta" && id ? id : null,
      fondo_id: tipo === "fondo" && id ? id : null,
    };
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
// Entre nosotros: saldar la deuda o prestarse plata
// ---------------------------------------------------------------------------

const transferencia = z.object({
  fecha: z.iso.date(),
  de_persona: persona,
  monto,
  tipo: z.enum(["liquidacion", "prestamo"]).catch("liquidacion"),
  concepto: z.string().trim().max(60).catch(""),
});

/**
 * Saldar y prestar entran por aquí: son la misma operación con distinta
 * etiqueta —alguien entrega y el saldo entre los dos se mueve—, así que
 * comparten tabla y validación.
 */
export async function crearTransferencia(_prev: Resultado, formData: FormData) {
  const supabase = createClient();
  return ejecutar(transferencia, campos(formData), (datos) =>
    supabase.from("transferencias").insert(datos),
  );
}

export async function borrarTransferencia(id: string) {
  const supabase = createClient();
  return ejecutar(uuid, id, (id) =>
    supabase.from("transferencias").delete().eq("id", id),
  );
}

// ---------------------------------------------------------------------------
// Pagos de tarjeta de crédito
// ---------------------------------------------------------------------------

const pagoTarjeta = z.object({
  fecha: z.iso.date(),
  tarjeta_id: uuid,
  // Vacío si se pagó por fuera de las cuentas registradas.
  desde_cuenta_id: uuid.nullable().catch(null),
  monto,
});

/**
 * Pagar la tarjeta no es un gasto: el gasto ocurrió al comprar. Registrarlo
 * como gasto lo contaría dos veces contra el presupuesto y movería la deuda
 * entre los dos, que con esto no tiene nada que ver. Baja el saldo de la
 * cuenta de origen y le devuelve línea a la tarjeta.
 */
export async function pagarTarjeta(_prev: Resultado, formData: FormData) {
  const supabase = createClient();
  return ejecutar(pagoTarjeta, campos(formData), (datos) =>
    supabase.from("pagos_tarjeta").insert(datos),
  );
}

export async function borrarPagoTarjeta(id: string) {
  const supabase = createClient();
  return ejecutar(uuid, id, (id) =>
    supabase.from("pagos_tarjeta").delete().eq("id", id),
  );
}
