import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { esPersona, type Persona } from "./persona";
import { comprobarEntorno, firmarCookie, leerCookie, pinCorrecto } from "./firma";

/**
 * Sesión sin cuentas: eliges quién eres, escribes tu PIN y queda una cookie
 * firmada. La criptografía vive en `firma.ts`, que es puro y está probado.
 */

const COOKIE = "persona";
const UN_AÑO = 60 * 60 * 24 * 365;

// ---------------------------------------------------------------------------
// Freno de fuerza bruta
//
// ponytail: contador en memoria del proceso. En Vercel cada instancia lleva el
// suyo y se reinicia en cada despliegue, así que frena a un curioso, no a un
// atacante decidido. Si eso deja de bastar, el upgrade es una tabla en Supabase
// con los intentos y la marca de tiempo del último.
// ---------------------------------------------------------------------------
const MAX_INTENTOS = 5;
const BLOQUEO_MS = 60_000;
let fallos = 0;
let bloqueadoHasta = 0;

/** Segundos que faltan para poder reintentar, o 0 si se puede ahora. */
export function esperaRestante(): number {
  return Math.max(0, Math.ceil((bloqueadoHasta - Date.now()) / 1000));
}

/**
 * Valida el PIN y, si es correcto, deja la cookie firmada.
 * Devuelve un mensaje de error en español, o `null` si entró.
 */
export async function iniciarSesion(
  persona: unknown,
  pin: unknown,
): Promise<string | null> {
  // Si falta una variable, que se vea en pantalla y no como un 500 opaco.
  try {
    comprobarEntorno();
  } catch (fallo) {
    return (fallo as Error).message;
  }

  const espera = esperaRestante();
  if (espera > 0) return `Demasiados intentos. Espera ${espera} s.`;

  if (!esPersona(persona)) return "Elige quién eres.";
  if (typeof pin !== "string" || !pin) return "Escribe tu PIN.";

  if (!pinCorrecto(persona, pin)) {
    if (++fallos >= MAX_INTENTOS) {
      fallos = 0;
      bloqueadoHasta = Date.now() + BLOQUEO_MS;
    }
    return "PIN incorrecto.";
  }

  fallos = 0;
  (await cookies()).set(COOKIE, firmarCookie(persona), {
    maxAge: UN_AÑO,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  return null;
}

export async function cerrarSesion() {
  (await cookies()).delete(COOKIE);
}

/** Persona activa, o `null` si no hay cookie o la firma no cuadra. */
export async function getPersona(): Promise<Persona | null> {
  return leerCookie((await cookies()).get(COOKIE)?.value);
}

/** Persona activa; manda a la pantalla de entrada si no hay sesión válida. */
export async function requirePersona(): Promise<Persona> {
  const persona = await getPersona();
  if (!persona) redirect("/entrar");
  return persona;
}
