/**
 * Quiénes usan la app. No hay cuentas: la app es de dos personas, cada una
 * entra con su PIN y la identidad vive en una cookie firmada (ver `sesion.ts`).
 *
 * Este archivo es de constantes puras a propósito — lo importan también los
 * formularios del cliente, así que no puede tocar `next/headers` ni `crypto`.
 *
 * ponytail: constantes, no tabla. Si algún día entra una tercera persona, esto
 * pasa a ser una tabla `personas` y `pagado_por` una FK.
 */
export const PERSONAS = ["abraham", "isabel"] as const;
export type Persona = (typeof PERSONAS)[number];

export const NOMBRES: Record<Persona, string> = {
  abraham: "Abraham",
  isabel: "Isabel",
};

export function esPersona(valor: unknown): valor is Persona {
  return PERSONAS.includes(valor as Persona);
}

/** La otra mitad de la pareja. */
export function laOtra(persona: Persona): Persona {
  return persona === "abraham" ? "isabel" : "abraham";
}
