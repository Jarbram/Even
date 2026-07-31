// La extensión .ts es lo que permite correr las pruebas con `node --test` sin
// bundler ni dependencias: Node resuelve la ruta exacta y se salta los tipos.
import { NOMBRES, laOtra, type Persona } from "./persona.ts";

/**
 * Todos los cálculos del presupuesto, sin tocar la base de datos ni React.
 * Funciones puras: se prueban con `npm test` y se usan igual en el servidor
 * que en el cliente.
 *
 * ponytail: el dinero son `number` en soles, redondeados a céntimos al
 * devolver. No hace falta aritmética entera para dos personas sumando gastos
 * de tres cifras; el error de coma flotante no llega al céntimo. Si algún día
 * esto lleva contabilidad de verdad, se pasa a céntimos enteros.
 */

/** Redondea a céntimos, matando el ruido de coma flotante (0.1+0.2). */
export function redondear(monto: number): number {
  return Math.round((monto + Number.EPSILON) * 100) / 100;
}

/** Formatea en soles, la moneda de la app. */
export function soles(monto: number): string {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
  }).format(monto);
}

// ---------------------------------------------------------------------------
// Categorías
// ---------------------------------------------------------------------------

/**
 * Semillas, no una lista cerrada: la categoría de un gasto es texto libre.
 *
 * ponytail: ni enum ni tabla con seed. Las categorías que de verdad se usan se
 * descubren solas del historial (ver `categoriasUsadas`), y estas doce están
 * solo para que la primera vez no haya una pantalla en blanco. Escribir una
 * nueva no necesita migración ni pantalla de administración.
 */
export const CATEGORIAS_SUGERIDAS = [
  "Mercado",
  "Comer fuera",
  "Transporte",
  "Servicios",
  "Ocio",
  "Salud",
  "Alquiler",
  "Mascotas",
  "Ropa",
  "Regalos",
  "Ahorro",
  "Otros",
] as const;

/**
 * Deja la categoría en forma canónica antes de guardarla. Sin esto, "mercado",
 * "Mercado " y "MERCADO" serían tres categorías distintas en las estadísticas,
 * que es como se degrada el texto libre.
 */
export function normalizarCategoria(valor: string): string {
  const limpia = valor.trim().replace(/\s+/g, " ");
  return limpia.charAt(0).toUpperCase() + limpia.slice(1).toLowerCase();
}

// ---------------------------------------------------------------------------
// Meses
//
// Un mes es el primer día del mes en formato ISO ("2026-07-01"). Texto, no
// Date: así no hay sorpresas de zona horaria entre el navegador de Lima y el
// servidor en UTC, que es de donde salen los bugs de "el gasto salió el mes
// pasado".
// ---------------------------------------------------------------------------

export type Mes = string;

/** El mes al que pertenece una fecha ISO ("2026-07-14" → "2026-07-01"). */
export function mesDe(fechaISO: string): Mes {
  return `${fechaISO.slice(0, 7)}-01`;
}

/**
 * Hoy en Lima, no donde esté el servidor. `en-CA` da directamente el formato
 * ISO "2026-07-30", que es justo lo que espera un `<input type="date">`.
 */
export function hoyISO(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
  }).format(new Date());
}

/** El mes en curso según el reloj de Lima, no el del servidor. */
export function mesActual(): Mes {
  return mesDe(hoyISO());
}

/** Desplaza un mes: `desplazarMes("2026-01-01", -1)` → "2025-12-01". */
export function desplazarMes(mes: Mes, meses: number): Mes {
  const [a, m] = mes.split("-").map(Number);
  const total = a * 12 + (m - 1) + meses;
  const año = Math.floor(total / 12);
  return `${año}-${String((total % 12) + 1).padStart(2, "0")}-01`;
}

const MES_LARGO = new Intl.DateTimeFormat("es-PE", {
  month: "long",
  timeZone: "UTC",
});

/**
 * "2026-07-01" → "Julio 2026".
 *
 * Se formatea solo el mes y se pega el año a mano, en vez de pedir los dos a
 * Intl: en español eso devuelve "julio de 2026", y ese "de" es lo que convertía
 * el `capitalize` de CSS en un "Julio De 2026" — o en "Julio De" al recortar el
 * año. Aquí la mayúscula se pone una vez, donde se sabe qué es cada parte.
 */
export function nombreMes(mes: Mes, conAño = true): string {
  const largo = MES_LARGO.format(new Date(`${mes}T00:00:00Z`));
  const nombre = largo.charAt(0).toUpperCase() + largo.slice(1);
  return conAño ? `${nombre} ${mes.slice(0, 4)}` : nombre;
}

/** Cuántos días tiene el mes. */
export function diasDelMes(mes: Mes): number {
  const [a, m] = mes.split("-").map(Number);
  // Día 0 del mes siguiente = último día de este. Date lo resuelve solo,
  // bisiestos incluidos.
  return new Date(Date.UTC(a, m, 0)).getUTCDate();
}

/**
 * Cuántos días del mes van transcurridos. Sirve para el promedio diario: en un
 * mes en curso hay que dividir entre los días vividos, no entre 30, o el
 * promedio sale artificialmente bajo.
 */
export function diasTranscurridos(mes: Mes, hoy: string): number {
  if (mesDe(hoy) !== mes) return diasDelMes(mes);
  return Number(hoy.slice(8, 10));
}

/** Suma por día del mes: devuelve un total por cada día, del 1 al último. */
export function porDiaDelMes(
  mes: Mes,
  gastos: readonly { fecha: string; monto: number }[],
): { etiqueta: string; total: number }[] {
  const dias = diasDelMes(mes);
  const totales = new Array<number>(dias).fill(0);

  for (const gasto of gastos) {
    const dia = Number(gasto.fecha.slice(8, 10));
    if (dia >= 1 && dia <= dias) totales[dia - 1] += gasto.monto;
  }

  return totales.map((total, i) => ({
    etiqueta: String(i + 1),
    total: redondear(total),
  }));
}

/**
 * Cuántas casillas vacías van antes del día 1 en una rejilla de calendario que
 * empieza en lunes. `getUTCDay()` cuenta desde el domingo, de ahí el ajuste.
 */
export function huecoInicial(mes: Mes): number {
  const [a, m] = mes.split("-").map(Number);
  return (new Date(Date.UTC(a, m - 1, 1)).getUTCDay() + 6) % 7;
}

/**
 * Suma por semana del mes, en bloques de 7 días desde el día 1.
 *
 * ponytail: semanas del 1–7, 8–14… y no semanas ISO que empiezan en lunes. Para
 * mirar un mes propio es lo que se espera; las semanas ISO cruzarían de mes y
 * confundirían más de lo que aportan.
 */
export function porSemanaDelMes(
  mes: Mes,
  gastos: readonly { fecha: string; monto: number }[],
): { etiqueta: string; total: number }[] {
  const dias = diasDelMes(mes);
  const semanas = Math.ceil(dias / 7);
  const totales = new Array<number>(semanas).fill(0);

  for (const gasto of gastos) {
    const dia = Number(gasto.fecha.slice(8, 10));
    if (dia >= 1 && dia <= dias) totales[Math.floor((dia - 1) / 7)] += gasto.monto;
  }

  return totales.map((total, i) => ({
    etiqueta: `S${i + 1}`,
    total: redondear(total),
  }));
}

// ---------------------------------------------------------------------------
// Deuda cruzada
// ---------------------------------------------------------------------------

export type Gasto = {
  monto: number;
  pagado_por: Persona;
  /** Fracción del gasto que le corresponde a Abraham. 0.5 = a medias. */
  parte_abraham: number;
};

export type DeudaCruzada = {
  /** Quién debe. `null` cuando están en paz. */
  deudor: Persona | null;
  acreedor: Persona | null;
  monto: number;
  /** Frase lista para la pantalla. */
  resumen: string;
};

/**
 * El corazón de la app: quién le debe a quién, y cuánto.
 *
 * Cada gasto tiene dos caras — quién lo pagó y a quién le correspondía. La
 * diferencia acumulada entre ambas es la deuda. Un gasto pagado a medias por
 * quien debía pagarlo a medias no mueve nada.
 */
export function deudaCruzada(gastos: readonly Gasto[]): DeudaCruzada {
  let saldoAbraham = 0;

  for (const gasto of gastos) {
    const puso = gasto.pagado_por === "abraham" ? gasto.monto : 0;
    const leTocaba = gasto.monto * gasto.parte_abraham;
    saldoAbraham += puso - leTocaba;
  }

  const monto = redondear(Math.abs(saldoAbraham));

  // Menos de un céntimo es estar en paz, no una deuda de 0.004 soles.
  if (monto < 0.01) {
    return { deudor: null, acreedor: null, monto: 0, resumen: "Están en paz" };
  }

  // Saldo positivo: Abraham puso de más, así que le deben a él.
  const acreedor: Persona = saldoAbraham > 0 ? "abraham" : "isabel";
  const deudor = laOtra(acreedor);

  return {
    deudor,
    acreedor,
    monto,
    resumen: `${NOMBRES[deudor]} le debe ${soles(monto)} a ${NOMBRES[acreedor]}`,
  };
}

// ---------------------------------------------------------------------------
// Semáforo de presupuesto
// ---------------------------------------------------------------------------

export type Estado = "ok" | "ajustado" | "excedido";

export type LineaPresupuesto = {
  categoria: string;
  presupuestado: number;
  gastado: number;
  restante: number;
  /** 0–1 y por encima si se pasaron; útil para la barra de progreso. */
  proporcion: number;
  estado: Estado;
};

/** Verde hasta el 75 %, ámbar hasta el 100 %, rojo al pasarse. */
export function semaforo(gastado: number, presupuestado: number): Estado {
  if (presupuestado <= 0) return gastado > 0 ? "excedido" : "ok";
  const proporcion = gastado / presupuestado;
  if (proporcion >= 1) return "excedido";
  return proporcion >= 0.75 ? "ajustado" : "ok";
}

/**
 * Cruza lo presupuestado con lo gastado, categoría por categoría. Aparecen
 * también las categorías gastadas sin presupuesto: son justo las que hay que
 * ver, no las que conviene esconder.
 */
export function lineasPresupuesto(
  presupuestos: readonly { categoria: string; monto: number }[],
  gastos: readonly { categoria: string; monto: number }[],
): LineaPresupuesto[] {
  const gastadoPor = new Map<string, number>();
  for (const gasto of gastos) {
    gastadoPor.set(
      gasto.categoria,
      (gastadoPor.get(gasto.categoria) ?? 0) + gasto.monto,
    );
  }

  const categorias = new Set([
    ...presupuestos.map((p) => p.categoria),
    ...gastadoPor.keys(),
  ]);

  const presupuestadoPor = new Map(
    presupuestos.map((p) => [p.categoria, p.monto]),
  );

  return [...categorias]
    .map((categoria) => {
      const presupuestado = presupuestadoPor.get(categoria) ?? 0;
      const gastado = gastadoPor.get(categoria) ?? 0;
      return {
        categoria,
        presupuestado: redondear(presupuestado),
        gastado: redondear(gastado),
        restante: redondear(presupuestado - gastado),
        proporcion: presupuestado > 0 ? gastado / presupuestado : gastado > 0 ? 1 : 0,
        estado: semaforo(gastado, presupuestado),
      };
    })
    // Por urgencia, no por monto: arriba lo que hay que ajustar. Una categoría
    // pequeña al 200 % importa más que una grande al 40 %.
    .sort((a, b) => URGENCIA[b.estado] - URGENCIA[a.estado] || b.proporcion - a.proporcion);
}

const URGENCIA: Record<Estado, number> = { excedido: 2, ajustado: 1, ok: 0 };

// ---------------------------------------------------------------------------
// Cumplimiento del presupuesto
//
// El presupuesto NO se reparte sobre los ingresos. La pareja decide de antemano
// un tope de gasto por categoría, y esos topes se mantienen mes a mes. Lo que la
// app tiene que contestar es otra cosa:
//
//   1. ¿Estoy cumpliendo?
//   2. ¿En qué me estoy excediendo?
//   3. ¿Qué tengo que ajustar?
//
// Por eso lo primero que se calcula y lo primero que se enseña son las
// categorías pasadas de tope, no un total agregado.
// ---------------------------------------------------------------------------

export type ResumenPresupuesto = {
  /** La suma de los topes de todas las categorías. */
  tope: number;
  gastado: number;
  /** Lo que queda del tope. Negativo: se pasaron. */
  restante: number;
  estado: "sin-topes" | Estado;
  resumen: string;
  /** Las categorías pasadas de tope, de la peor a la menos mala. */
  excedidas: LineaPresupuesto[];
  /** Las que están cerca del tope pero aún no se han pasado. */
  enRiesgo: LineaPresupuesto[];
};

/**
 * ¿Cumplimos el presupuesto y, si no, dónde nos estamos pasando?
 *
 * `gastado` suma también lo de categorías sin tope: gastar donde no hay tope
 * sigue siendo gastar, y esconderlo del total daría una sensación falsa de
 * control. En cambio no cuenta para `restante`, que solo mide lo acordado.
 */
export function resumenPresupuesto(
  lineas: readonly LineaPresupuesto[],
): ResumenPresupuesto {
  const tope = redondear(lineas.reduce((suma, l) => suma + l.presupuestado, 0));
  const gastado = redondear(lineas.reduce((suma, l) => suma + l.gastado, 0));
  const restante = redondear(tope - gastado);

  // Peor primero: lo que más se ha pasado es lo primero que hay que ajustar.
  const excedidas = lineas
    .filter((l) => l.estado === "excedido" && l.presupuestado > 0)
    .sort((a, b) => b.proporcion - a.proporcion);

  const enRiesgo = lineas
    .filter((l) => l.estado === "ajustado")
    .sort((a, b) => b.proporcion - a.proporcion);

  if (tope === 0) {
    return {
      tope,
      gastado,
      restante,
      estado: "sin-topes",
      resumen: "Pon un tope a cada categoría para empezar a controlar",
      excedidas,
      enRiesgo,
    };
  }

  const estado = semaforo(gastado, tope);

  const resumen =
    excedidas.length > 0
      ? `Te estás pasando en ${excedidas.length} ${
          excedidas.length === 1 ? "categoría" : "categorías"
        }`
      : estado === "excedido"
        ? `Te pasaste ${soles(Math.abs(restante))} del tope`
        : enRiesgo.length > 0
          ? `Ojo con ${enRiesgo[0].categoria}, va al ${Math.round(enRiesgo[0].proporcion * 100)} %`
          : "Vas dentro de lo acordado";

  return { tope, gastado, restante, estado, resumen, excedidas, enRiesgo };
}

// ---------------------------------------------------------------------------
// Simulador de deudas
// ---------------------------------------------------------------------------

export type Deuda = {
  saldo: number;
  /** Tasa anual en porcentaje: 24 significa 24 %. */
  tasa_anual: number;
  pago_mensual: number;
};

export type Simulacion = {
  /** `null` cuando el pago no cubre ni los intereses: la deuda nunca baja. */
  meses: number | null;
  interesTotal: number;
  totalPagado: number;
  /** Último mes proyectado, para la gráfica. */
  saldos: number[];
  resumen: string;
};

const MAX_MESES = 600; // 50 años: más allá, la deuda es impagable en la práctica.

/**
 * Proyecta cuánto falta para liquidar una deuda pagando lo mismo cada mes.
 * `extra` es el pago adicional del simulador — el "¿y si le meto 200 más?".
 *
 * ponytail: interés simple mensual sobre el saldo (tasa anual / 12), que es
 * como lo calcula un banco peruano de tarjeta. No modela comisiones, seguros
 * de desgravamen ni TCEA; sirve para decidir, no para cuadrar con el banco.
 */
export function simularDeuda(deuda: Deuda, extra = 0): Simulacion {
  const pago = deuda.pago_mensual + extra;
  const tasaMensual = deuda.tasa_anual / 100 / 12;

  let saldo = deuda.saldo;
  let interesTotal = 0;
  const saldos: number[] = [redondear(saldo)];

  if (saldo <= 0) {
    return {
      meses: 0,
      interesTotal: 0,
      totalPagado: 0,
      saldos,
      resumen: "Ya está pagada",
    };
  }

  for (let mes = 1; mes <= MAX_MESES; mes++) {
    const interes = saldo * tasaMensual;

    // El pago no cubre ni el interés del primer mes: el saldo solo puede subir.
    if (pago <= interes) {
      const minimo = redondear(interes);
      return {
        meses: null,
        interesTotal: 0,
        totalPagado: 0,
        saldos,
        resumen: `Con ${soles(pago)} al mes la deuda nunca baja: solo el interés ya es ${soles(minimo)}`,
      };
    }

    interesTotal += interes;
    saldo = saldo + interes - pago;

    if (saldo <= 0.005) {
      // El último pago es solo lo que quedaba, no la cuota entera.
      const totalPagado = deuda.saldo + interesTotal;
      return {
        meses: mes,
        interesTotal: redondear(interesTotal),
        totalPagado: redondear(totalPagado),
        saldos: [...saldos, 0],
        resumen:
          mes === 1
            ? "La liquidas este mes"
            : `${mes} meses y ${soles(redondear(interesTotal))} de intereses`,
      };
    }

    saldos.push(redondear(saldo));
  }

  return {
    meses: null,
    interesTotal: redondear(interesTotal),
    totalPagado: 0,
    saldos,
    resumen: "Más de 50 años a este ritmo",
  };
}

/** Cuánto tiempo e interés ahorra pagar `extra` soles más al mes. */
export function ahorroPorPagarMas(deuda: Deuda, extra: number) {
  const base = simularDeuda(deuda);
  const conExtra = simularDeuda(deuda, extra);

  if (base.meses === null || conExtra.meses === null) {
    return { mesesMenos: null, interesAhorrado: null, resumen: conExtra.resumen };
  }

  const mesesMenos = base.meses - conExtra.meses;
  const interesAhorrado = redondear(base.interesTotal - conExtra.interesTotal);

  return {
    mesesMenos,
    interesAhorrado,
    resumen: `${soles(extra)} más al mes: ${mesesMenos} meses menos y ${soles(interesAhorrado)} de intereses que te ahorras`,
  };
}

// ---------------------------------------------------------------------------
// Fondos de ahorro
// ---------------------------------------------------------------------------

export type Fondo = { nombre: string; saldo: number; meta: number | null };

export function progresoFondo(fondo: Fondo) {
  if (!fondo.meta || fondo.meta <= 0) {
    return { proporcion: 0, falta: 0, completado: false, resumen: "Sin meta" };
  }

  const proporcion = Math.min(fondo.saldo / fondo.meta, 1);
  const falta = redondear(Math.max(fondo.meta - fondo.saldo, 0));
  const completado = falta < 0.01;

  return {
    proporcion,
    falta,
    completado,
    resumen: completado
      ? "¡Meta cumplida!"
      : `Faltan ${soles(falta)} de ${soles(fondo.meta)}`,
  };
}

/**
 * A cuántos meses está la meta metiendo `aporteMensual` cada mes.
 * `null` si no aportan nada.
 */
export function mesesParaMeta(
  fondo: Fondo,
  aporteMensual: number,
): number | null {
  if (!fondo.meta || aporteMensual <= 0) return null;
  const falta = fondo.meta - fondo.saldo;
  return falta <= 0 ? 0 : Math.ceil(falta / aporteMensual);
}
