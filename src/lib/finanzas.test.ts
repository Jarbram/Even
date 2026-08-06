import { test } from "node:test";
import assert from "node:assert/strict";
import {
  resumenPresupuesto,
  desplazarMes,
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
  presupuestosVigentes,
  progresoFondo,
  redondear,
  semaforo,
} from "./finanzas.ts";

// Un solo archivo de pruebas para la lógica que, si se rompe, hace que la app
// mienta sobre el dinero. Se corre con `npm test`.

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

test("gastar en una categoría sin tope no cuenta contra el tope acordado", () => {
  // Caso real del bug: gastos personales sin tope hacían que el total dijera
  // "te pasaste" aunque las categorías con tope fueran sobradas.
  const lineas = lineasPresupuesto(
    [{ categoria: "Mercado", monto: 800 }],
    [
      { categoria: "Mercado", monto: 400 }, // dentro del tope
      { categoria: "Gastos personales", monto: 5000 }, // sin tope puesto
    ],
  );
  const r = resumenPresupuesto(lineas);

  assert.equal(r.tope, 800);
  // El gasto agregado ignora "Gastos personales": no tiene tope con el que
  // compararse, así que no puede hacer que el total se pase.
  assert.equal(r.gastado, 400);
  assert.equal(r.restante, 400);
  assert.equal(r.estado, "ok");
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

test("editar el tope de una categoría no borra el de las demás", () => {
  // Caso real del bug: en enero se ponen 3 topes; en agosto se toca solo uno.
  const vigentes = presupuestosVigentes(
    [
      { mes: "2026-01-01", categoria: "Mercado", monto: 500 },
      { mes: "2026-01-01", categoria: "Ocio", monto: 100 },
      { mes: "2026-01-01", categoria: "Transporte", monto: 150 },
      { mes: "2026-08-01", categoria: "Transporte", monto: 200 },
    ],
    "2026-08-01",
  );

  assert.equal(vigentes.length, 3);
  assert.equal(vigentes.find((t) => t.categoria === "Mercado")?.monto, 500);
  assert.equal(vigentes.find((t) => t.categoria === "Ocio")?.monto, 100);
  // La categoría tocada este mes usa el valor nuevo, no el heredado.
  assert.equal(vigentes.find((t) => t.categoria === "Transporte")?.monto, 200);
});

test("sin ningún tope puesto este mes, se hereda el último acordado", () => {
  const vigentes = presupuestosVigentes(
    [{ mes: "2026-01-01", categoria: "Mercado", monto: 500 }],
    "2026-07-01",
  );
  assert.deepEqual(vigentes, [{ mes: "2026-01-01", categoria: "Mercado", monto: 500 }]);
});

test("un tope de un mes futuro no aplica todavía", () => {
  const vigentes = presupuestosVigentes(
    [
      { mes: "2026-01-01", categoria: "Mercado", monto: 500 },
      { mes: "2026-12-01", categoria: "Mercado", monto: 900 },
    ],
    "2026-06-01",
  );
  assert.equal(vigentes.length, 1);
  assert.equal(vigentes[0].monto, 500);
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
