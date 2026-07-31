import { test } from "node:test";
import assert from "node:assert/strict";

process.env.APP_SECRET = "un-secreto-de-pruebas-de-mas-de-32-caracteres";
process.env.PIN_ABRAHAM = "1234";
process.env.PIN_ISABEL = "9876";

const { firmarCookie, leerCookie, pinCorrecto, comprobarEntorno } = await import(
  "./firma.ts"
);

// Estas pruebas son la razón de que `firma.ts` esté separado de `sesion.ts`:
// si la firma se rompe, la app queda abierta a cualquiera con la URL.

test("una cookie firmada se lee de vuelta", () => {
  assert.equal(leerCookie(firmarCookie("abraham")), "abraham");
  assert.equal(leerCookie(firmarCookie("isabel")), "isabel");
});

test("una cookie inventada a mano no vale", () => {
  // Justo el ataque que la firma existe para parar.
  assert.equal(leerCookie("abraham"), null);
  assert.equal(leerCookie("abraham."), null);
  assert.equal(leerCookie("abraham.firma-inventada"), null);
});

test("no se puede reusar la firma de una persona para la otra", () => {
  const deIsabel = firmarCookie("isabel").split(".")[1];
  assert.equal(leerCookie(`abraham.${deIsabel}`), null);
});

test("cambiar el secreto invalida las cookies viejas", () => {
  const antigua = firmarCookie("abraham");
  const anterior = process.env.APP_SECRET;
  process.env.APP_SECRET = "otro-secreto-distinto-de-mas-de-32-caracteres";
  assert.equal(leerCookie(antigua), null);
  process.env.APP_SECRET = anterior;
});

test("basura y vacíos no se cuelan", () => {
  for (const valor of [undefined, "", ".", "..", "nadie.x", "abraham.a.b"]) {
    assert.equal(leerCookie(valor), null, `pasó: ${valor}`);
  }
});

test("el PIN correcto entra y el incorrecto no", () => {
  assert.equal(pinCorrecto("abraham", "1234"), true);
  assert.equal(pinCorrecto("isabel", "9876"), true);

  // El PIN de uno no abre la sesión del otro.
  assert.equal(pinCorrecto("abraham", "9876"), false);
  assert.equal(pinCorrecto("abraham", ""), false);
  assert.equal(pinCorrecto("abraham", "12345"), false);
  assert.equal(pinCorrecto("abraham", "123"), false);
});

test("un entorno incompleto falla al arrancar, no en silencio", () => {
  assert.doesNotThrow(comprobarEntorno);

  const anterior = process.env.APP_SECRET;
  process.env.APP_SECRET = "corto";
  assert.throws(comprobarEntorno, /APP_SECRET/);
  process.env.APP_SECRET = anterior;

  delete process.env.PIN_ISABEL;
  assert.throws(comprobarEntorno, /PIN_ISABEL/);
  process.env.PIN_ISABEL = "9876";
});
