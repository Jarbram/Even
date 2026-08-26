import { test } from "node:test";
import assert from "node:assert/strict";
import { baseParaSaldo, leerSaldo } from "./cuentas.ts";

// Una tarjeta de crédito se mide al revés que el resto: la base guarda un solo
// saldo para todas las cuentas y esta función es la que lo traduce. Si se
// rompe, la app dice que tienes cupo cuando no lo tienes.

test("una cuenta normal enseña lo que tiene", () => {
  const s = leerSaldo({ tipo: "debito", saldo: 1200, linea: null });
  assert.equal(s.esCredito, false);
  assert.equal(s.principal, 1200);
  assert.equal(s.etiqueta, "Saldo");
});

test("una tarjeta enseña el disponible, no la deuda", () => {
  // Línea de 10 500 con 4 000 consumidos: el saldo va en negativo.
  const s = leerSaldo({ tipo: "credito", saldo: -4000, linea: 10500 });
  assert.equal(s.esCredito, true);
  assert.equal(s.consumido, 4000);
  assert.equal(s.disponible, 6500);
  assert.equal(s.principal, 6500);
  assert.equal(s.etiqueta, "Disponible");
});

test("pagar la tarjeta le devuelve la línea", () => {
  // Tras pagar los 4 000, el saldo vuelve a cero.
  const s = leerSaldo({ tipo: "credito", saldo: 0, linea: 10500 });
  assert.equal(s.consumido, 0);
  assert.equal(s.disponible, 10500);
  assert.equal(s.proporcion, 0);
});

test("pagar de más no deja la línea por encima de su cupo", () => {
  // Saldo positivo en una tarjeta significa que pagaron de más; el cupo sigue
  // siendo el cupo, y lo consumido no baja de cero.
  const s = leerSaldo({ tipo: "credito", saldo: 500, linea: 10500 });
  assert.equal(s.consumido, 0);
  assert.equal(s.disponible, 10500);
});

test("una tarjeta al tope marca la barra llena, no más", () => {
  const s = leerSaldo({ tipo: "credito", saldo: -12000, linea: 10500 });
  assert.equal(s.consumido, 12000);
  assert.equal(s.proporcion, 1); // no 1.14
  assert.ok(s.disponible < 0); // pasada de cupo: se dice, no se esconde
});

test("una tarjeta sin línea puesta se lee como una cuenta normal", () => {
  const s = leerSaldo({ tipo: "credito", saldo: -300, linea: null });
  assert.equal(s.esCredito, false);
  assert.equal(s.principal, -300);
});

// Corregir a mano lo que tiene una billetera no puede tocar lo ya registrado:
// si se rompe, ajustar el saldo se lleva por delante gastos o ingresos.

test("corregir el saldo mueve la base, no el histórico", () => {
  // Abrió con 500, gastó 200 → la app dice 300. En el banco hay 350.
  const cuenta = { tipo: "billetera" as const, saldo: 300, saldo_base: 500 };
  const base = baseParaSaldo(cuenta, 350);
  assert.equal(base, 550);
  // Con la base nueva y los mismos 200 gastados, sale la cifra tecleada.
  assert.equal(base - 200, 350);
});

test("en una tarjeta se corrige lo consumido", () => {
  // Arrastraba 1 000 consumidos y cargó 500 más → saldo -1 500. Dice 1 800.
  const tarjeta = { tipo: "credito" as const, saldo: -1500, saldo_base: -1000 };
  const base = baseParaSaldo(tarjeta, 1800);
  assert.equal(base, -1300);
  assert.equal(leerSaldo({ tipo: "credito", saldo: base - 500, linea: 5000 }).consumido, 1800);
});
