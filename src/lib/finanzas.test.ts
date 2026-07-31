import { test } from "node:test";
import assert from "node:assert/strict";
import {
  resumenPresupuesto,
  desplazarMes,
  deudaCruzada,
  diasDelMes,
  diasTranscurridos,
  huecoInicial,
  lineasPresupuesto,
  mesDe,
  mesesParaMeta,
  nombreMes,
  normalizarCategoria,
  porDiaDelMes,
  porSemanaDelMes,
  progresoFondo,
  redondear,
  semaforo,
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

test("saldar la deuda la deja en cero", () => {
  const gastos = [
    { monto: 600, pagado_por: "abraham" as const, parte_abraham: 0.5 },
  ];
  // Isabel le debe 300 y se los pasa.
  const d = deudaCruzada(gastos, [{ de_persona: "isabel", monto: 300 }]);
  assert.equal(d.deudor, null);
  assert.equal(d.monto, 0);
});

test("saldar de menos deja el resto, y de más da la vuelta a la deuda", () => {
  const gastos = [
    { monto: 600, pagado_por: "abraham" as const, parte_abraham: 0.5 },
  ];

  const parcial = deudaCruzada(gastos, [{ de_persona: "isabel", monto: 100 }]);
  assert.equal(parcial.deudor, "isabel");
  assert.equal(parcial.monto, 200);

  // Pagar de más no es un error: ahora le deben a ella.
  const pasada = deudaCruzada(gastos, [{ de_persona: "isabel", monto: 500 }]);
  assert.equal(pasada.deudor, "abraham");
  assert.equal(pasada.monto, 200);
});

test("un préstamo suelto suma aunque no haya ningún gasto", () => {
  // Prestar y saldar son la misma operación con distinto signo, así que van
  // por el mismo camino y no por una rama aparte.
  const d = deudaCruzada([], [{ de_persona: "abraham", monto: 200 }]);
  assert.equal(d.deudor, "isabel");
  assert.equal(d.monto, 200);
});

test("gastos y transferencias se compensan entre sí", () => {
  const d = deudaCruzada(
    [{ monto: 400, pagado_por: "isabel", parte_abraham: 0.5 }], // Abraham debe 200
    [{ de_persona: "abraham", monto: 200 }], // y se los pasa
  );
  assert.equal(d.deudor, null);
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

test("sin topes puestos, el presupuesto no dice que vayas bien", () => {
  const sinNada = resumenPresupuesto(lineasPresupuesto([], []));
  assert.equal(sinNada.estado, "sin-topes");
  assert.doesNotMatch(sinNada.resumen, /dentro/);
});

test("el resumen señala en qué se están pasando, no solo el total", () => {
  const lineas = lineasPresupuesto(
    [
      { categoria: "Mercado", monto: 800 },
      { categoria: "Ocio", monto: 100 },
      { categoria: "Alquiler", monto: 1500 },
    ],
    [
      { categoria: "Mercado", monto: 400 }, // 50 %: bien
      { categoria: "Ocio", monto: 250 }, // 250 %: pasadísimo
      { categoria: "Alquiler", monto: 1500 }, // 100 %: pasado justo
    ],
  );
  const r = resumenPresupuesto(lineas);

  assert.equal(r.excedidas.length, 2);
  // Peor primero: Ocio al 250 % antes que Alquiler al 100 %.
  assert.equal(r.excedidas[0].categoria, "Ocio");
  assert.match(r.resumen, /2 categorías/);

  // El total va holgado (2150 de 2400) y aun así hay que ajustar dos cosas: es
  // justo lo que un único número agregado escondería.
  assert.equal(r.tope, 2400);
  assert.equal(r.gastado, 2150);
  assert.ok(r.restante > 0);
});

test("cumplir el presupuesto se dice sin rodeos", () => {
  const r = resumenPresupuesto(
    lineasPresupuesto(
      [{ categoria: "Mercado", monto: 800 }],
      [{ categoria: "Mercado", monto: 200 }],
    ),
  );
  assert.equal(r.estado, "ok");
  assert.equal(r.excedidas.length, 0);
  assert.match(r.resumen, /dentro/);
});

test("las categorías se ordenan por urgencia, no por monto", () => {
  const lineas = lineasPresupuesto(
    [
      { categoria: "Alquiler", monto: 2000 },
      { categoria: "Ocio", monto: 50 },
    ],
    [
      { categoria: "Alquiler", monto: 800 }, // mucho dinero, 40 %
      { categoria: "Ocio", monto: 100 }, // poco dinero, 200 %
    ],
  );
  // Ocio primero aunque sean 100 soles contra 800: es lo que hay que ajustar.
  assert.equal(lineas[0].categoria, "Ocio");
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

test("el nombre del mes no arrastra el «de» del español", () => {
  // Intl con month+year devuelve "julio de 2026", y ese "de" acababa en
  // pantalla como "Julio De 2026".
  assert.equal(nombreMes("2026-07-01"), "Julio 2026");
  assert.equal(nombreMes("2026-07-01", false), "Julio");
  assert.equal(nombreMes("2026-12-01"), "Diciembre 2026");
  assert.doesNotMatch(nombreMes("2026-07-01"), / de /i);
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
