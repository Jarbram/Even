import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ahorroPorPagarMas,
  baseCero,
  desplazarMes,
  deudaCruzada,
  diasDelMes,
  diasTranscurridos,
  huecoInicial,
  lineasPresupuesto,
  mesDe,
  mesesParaMeta,
  normalizarCategoria,
  porDiaDelMes,
  porSemanaDelMes,
  progresoFondo,
  redondear,
  semaforo,
  simularDeuda,
} from "./finanzas.ts";

// Un solo archivo de pruebas para la lógica que, si se rompe, hace que la app
// mienta sobre el dinero. Se corre con `npm test`.

test("gastos a medias pagados a medias no generan deuda", () => {
  const d = deudaCruzada([
    { monto: 100, pagado_por: "abraham", parte_abraham: 0.5 },
    { monto: 100, pagado_por: "isabel", parte_abraham: 0.5 },
  ]);
  assert.equal(d.deudor, null);
  assert.equal(d.monto, 0);
});

test("quien paga de más es el acreedor", () => {
  // Abraham pone 200 de un gasto que era a medias: Isabel le debe 100.
  const d = deudaCruzada([
    { monto: 200, pagado_por: "abraham", parte_abraham: 0.5 },
  ]);
  assert.equal(d.deudor, "isabel");
  assert.equal(d.acreedor, "abraham");
  assert.equal(d.monto, 100);
});

test("un gasto que le toca entero a quien no lo pagó se debe completo", () => {
  // Isabel paga la ropa de Abraham: se la debe entera.
  const d = deudaCruzada([
    { monto: 80, pagado_por: "isabel", parte_abraham: 1 },
  ]);
  assert.equal(d.deudor, "abraham");
  assert.equal(d.monto, 80);
});

test("las deudas de ida y vuelta se compensan", () => {
  const d = deudaCruzada([
    { monto: 200, pagado_por: "abraham", parte_abraham: 0.5 }, // +100 Abraham
    { monto: 100, pagado_por: "isabel", parte_abraham: 1 }, // -100 Abraham
  ]);
  assert.equal(d.deudor, null);
});

test("repartos desiguales", () => {
  // 300 pagados por Isabel, 70 % de Abraham → le debe 210.
  const d = deudaCruzada([
    { monto: 300, pagado_por: "isabel", parte_abraham: 0.7 },
  ]);
  assert.equal(d.deudor, "abraham");
  assert.equal(d.monto, 210);
});

test("el ruido de coma flotante no se convierte en deuda", () => {
  const d = deudaCruzada([
    { monto: 0.1, pagado_por: "abraham", parte_abraham: 0.5 },
    { monto: 0.2, pagado_por: "isabel", parte_abraham: 0.5 },
    { monto: 0.3, pagado_por: "abraham", parte_abraham: 0.5 },
  ]);
  // Abraham puso 0.4 de 0.3 que le tocaban → 0.1, no 0.10000000000000003.
  assert.equal(d.monto, 0.1);
});

test("redondear corta en el céntimo", () => {
  assert.equal(redondear(0.1 + 0.2), 0.3);
  assert.equal(redondear(1.005), 1.01);
});

test("semáforo: verde, ámbar, rojo", () => {
  assert.equal(semaforo(50, 100), "ok");
  assert.equal(semaforo(75, 100), "ajustado");
  assert.equal(semaforo(100, 100), "excedido");
  assert.equal(semaforo(120, 100), "excedido");
});

test("gastar sin presupuesto está excedido; no gastar nada, no", () => {
  assert.equal(semaforo(10, 0), "excedido");
  assert.equal(semaforo(0, 0), "ok");
});

test("las categorías gastadas sin presupuesto aparecen igual", () => {
  const lineas = lineasPresupuesto(
    [{ categoria: "Mercado", monto: 500 }],
    [
      { categoria: "Mercado", monto: 200 },
      { categoria: "Ocio", monto: 90 },
    ],
  );
  const ocio = lineas.find((l) => l.categoria === "Ocio");
  assert.equal(ocio?.presupuestado, 0);
  assert.equal(ocio?.estado, "excedido");

  const mercado = lineas.find((l) => l.categoria === "Mercado");
  assert.equal(mercado?.restante, 300);
});

test("base cero: cuadrado, sobra y falta", () => {
  assert.equal(baseCero([{ monto: 3000 }], [{ monto: 3000 }]).estado, "cuadrado");
  assert.equal(baseCero([{ monto: 3000 }], [{ monto: 2500 }]).estado, "sobra");
  assert.equal(baseCero([{ monto: 3000 }], [{ monto: 3200 }]).estado, "falta");
  assert.equal(baseCero([{ monto: 3000 }], [{ monto: 3200 }]).porAsignar, -200);
});

test("simulador: una deuda sin intereses son saldo / cuota meses", () => {
  const s = simularDeuda({ saldo: 1000, tasa_anual: 0, pago_mensual: 250 });
  assert.equal(s.meses, 4);
  assert.equal(s.interesTotal, 0);
});

test("simulador: con interés se paga más y tarda más", () => {
  const sin = simularDeuda({ saldo: 5000, tasa_anual: 0, pago_mensual: 500 });
  const con = simularDeuda({ saldo: 5000, tasa_anual: 24, pago_mensual: 500 });
  assert.ok(con.meses! > sin.meses!);
  assert.ok(con.interesTotal > 0);
  assert.equal(con.totalPagado, redondear(5000 + con.interesTotal));
});

test("simulador: si la cuota no cubre el interés, la deuda es impagable", () => {
  // 10 000 al 24 % anual generan 200 de interés al mes; pagando 150 nunca baja.
  const s = simularDeuda({ saldo: 10_000, tasa_anual: 24, pago_mensual: 150 });
  assert.equal(s.meses, null);
  assert.match(s.resumen, /nunca baja/);
});

test("simulador: una deuda en cero ya está pagada", () => {
  assert.equal(simularDeuda({ saldo: 0, tasa_anual: 24, pago_mensual: 100 }).meses, 0);
});

test("pagar de más acorta la deuda y ahorra intereses", () => {
  const a = ahorroPorPagarMas(
    { saldo: 5000, tasa_anual: 24, pago_mensual: 300 },
    200,
  );
  assert.ok(a.mesesMenos! > 0);
  assert.ok(a.interesAhorrado! > 0);
});

test("meses: se calculan sin caerse al cambiar de año", () => {
  assert.equal(mesDe("2026-07-14"), "2026-07-01");
  assert.equal(desplazarMes("2026-01-01", -1), "2025-12-01");
  assert.equal(desplazarMes("2026-12-01", 1), "2027-01-01");
  assert.equal(desplazarMes("2026-07-01", -12), "2025-07-01");
  assert.equal(desplazarMes("2026-03-01", 0), "2026-03-01");
});

test("días del mes, febreros incluidos", () => {
  assert.equal(diasDelMes("2026-07-01"), 31);
  assert.equal(diasDelMes("2026-04-01"), 30);
  assert.equal(diasDelMes("2026-02-01"), 28);
  assert.equal(diasDelMes("2024-02-01"), 29); // bisiesto
});

test("el promedio diario usa los días vividos, no el mes entero", () => {
  // Mes en curso: solo cuentan los días que van.
  assert.equal(diasTranscurridos("2026-07-01", "2026-07-10"), 10);
  // Mes pasado: cuenta entero.
  assert.equal(diasTranscurridos("2026-06-01", "2026-07-10"), 30);
});

test("las categorías escritas a mano no se duplican por mayúsculas ni espacios", () => {
  const esperado = "Comer fuera";
  for (const variante of [
    "comer fuera",
    "COMER FUERA",
    "  Comer Fuera  ",
    "Comer  fuera",
  ]) {
    assert.equal(normalizarCategoria(variante), esperado, `falló: ${variante}`);
  }
});

test("el calendario alinea el día 1 con su día de la semana", () => {
  // 1 de julio de 2026 es miércoles → dos huecos (lunes y martes).
  assert.equal(huecoInicial("2026-07-01"), 2);
  // 1 de junio de 2026 es lunes → ninguno.
  assert.equal(huecoInicial("2026-06-01"), 0);
  // 1 de noviembre de 2026 es domingo → seis, el caso que rompe el `% 7` mal
  // hecho porque en la cuenta original el domingo es 0 y no 6.
  assert.equal(huecoInicial("2026-11-01"), 6);
});

test("las barras por día cubren el mes completo, con ceros", () => {
  const barras = porDiaDelMes("2026-02-01", [
    { fecha: "2026-02-01", monto: 10 },
    { fecha: "2026-02-01", monto: 5 },
    { fecha: "2026-02-28", monto: 20 },
  ]);
  assert.equal(barras.length, 28);
  assert.equal(barras[0].total, 15);
  assert.equal(barras[1].total, 0);
  assert.equal(barras[27].total, 20);
});

test("las barras por semana parten el mes en bloques de 7 días", () => {
  const barras = porSemanaDelMes("2026-07-01", [
    { fecha: "2026-07-01", monto: 100 }, // S1
    { fecha: "2026-07-07", monto: 50 }, // S1
    { fecha: "2026-07-08", monto: 30 }, // S2
    { fecha: "2026-07-31", monto: 70 }, // S5
  ]);
  assert.equal(barras.length, 5);
  assert.equal(barras[0].total, 150);
  assert.equal(barras[1].total, 30);
  assert.equal(barras[4].total, 70);
});

test("fondos: progreso y meses hasta la meta", () => {
  const fondo = { nombre: "Viaje", saldo: 400, meta: 1000 };
  assert.equal(progresoFondo(fondo).falta, 600);
  assert.equal(progresoFondo(fondo).completado, false);
  assert.equal(mesesParaMeta(fondo, 200), 3);

  const cumplido = { nombre: "Viaje", saldo: 1000, meta: 1000 };
  assert.equal(progresoFondo(cumplido).completado, true);
  assert.equal(mesesParaMeta(cumplido, 200), 0);

  // Un fondo sin meta no divide entre cero.
  assert.equal(progresoFondo({ nombre: "Colchón", saldo: 50, meta: null }).proporcion, 0);
  assert.equal(mesesParaMeta({ nombre: "Colchón", saldo: 50, meta: null }, 100), null);
});
