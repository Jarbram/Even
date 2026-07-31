import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { PERSONAS, esPersona, type Persona } from "./persona.ts";

/**
 * La criptografía de la sesión, aparte de Next para poder probarla: es lo único
 * que separa la app de cualquiera que abra la URL.
 *
 * La cookie va firmada con HMAC. Sin firma, cualquiera abre la consola del
 * navegador, escribe `document.cookie = "persona=abraham"` y el PIN no habría
 * servido de nada.
 */

function secreto(): string {
  const valor = process.env.APP_SECRET;
  if (!valor || valor.length < 32) {
    throw new Error(
      "Falta APP_SECRET (mínimo 32 caracteres). Genera uno con: openssl rand -base64 32",
    );
  }
  return valor;
}

function pinDe(persona: Persona): string {
  const clave = `PIN_${persona.toUpperCase()}`;
  const valor = process.env[clave];
  if (!valor) throw new Error(`Falta ${clave} en el entorno`);
  return valor;
}

/** Compara sin filtrar por tiempo cuántos caracteres coincidían. */
function igual(a: string, b: string): boolean {
  // Los hashes miden siempre lo mismo, así que timingSafeEqual nunca revienta
  // por longitudes distintas ni delata el largo del secreto.
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

/** El valor que va dentro de la cookie: la persona y su firma. */
export function firmarCookie(persona: Persona): string {
  const firma = createHmac("sha256", secreto())
    .update(persona)
    .digest("base64url");
  return `${persona}.${firma}`;
}

/** Lee una cookie: devuelve la persona solo si la firma cuadra. */
export function leerCookie(bruto: string | undefined): Persona | null {
  if (!bruto) return null;

  const corte = bruto.lastIndexOf(".");
  if (corte < 1) return null;

  const persona = bruto.slice(0, corte);
  if (!esPersona(persona)) return null;

  return igual(bruto, firmarCookie(persona)) ? persona : null;
}

export function pinCorrecto(persona: Persona, pin: string): boolean {
  return igual(pin, pinDe(persona));
}

/** Falla al arrancar si el entorno está incompleto, no en el primer login. */
export function comprobarEntorno() {
  secreto();
  PERSONAS.forEach(pinDe);
}
