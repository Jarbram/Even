# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Abraham e Isabel, una pareja que lleva las cuentas de su casa en Perú. Son los
dos únicos usuarios y no hay roles: los dos ven y editan todo. No hay invitados,
ni contadores, ni terceros.

La app se usa en dos situaciones opuestas, y ambas son primarias:

1. **En caliente, al pagar.** De pie, con una mano, con prisa: en la cola del
   supermercado, al bajar del taxi. El trabajo es *anotar un gasto antes de
   olvidarlo*, y cada pregunta que se hace en ese momento es una razón para no
   anotarlo.
2. **Revisión juntos, una vez al mes.** Sentados los dos, sin prisa. El trabajo
   es *entender cómo fue el mes, cuadrar quién le debe qué al otro y repartir el
   presupuesto del siguiente*. Aquí sí hay atención para leer detalle.

Diseñar para una sola de las dos rompe la otra: el registro tiene que ser casi
sin fricción, la revisión tiene que ser completa.

## Product Purpose

Reemplazar el Excel mensual con el que llevaban las cuentas. La app registra
gastos, calcula sola la deuda cruzada entre los dos, controla el gasto contra
los topes acordados por categoría, lleva los fondos de ahorro como cuentas con
meta y guarda el histórico por mes.

**El presupuesto no es base cero y no se reparte sobre los ingresos.** Confirmado
por el usuario el 31/07/2026: la pareja acuerda de antemano un tope de gasto por
categoría, y esos topes se mantienen mes a mes. Los ingresos entran, se gasta, y
lo que la app tiene que contestar es otra cosa:

1. ¿Estoy cumpliendo el presupuesto?
2. ¿En qué me estoy excediendo?
3. ¿Qué tengo que ajustar?

De ahí que el orden de la pantalla de presupuesto sea ese, y que las categorías
se ordenen por urgencia y no por monto: una categoría pequeña al 200 % importa
más que una grande al 40 %.

**Éxito confirmado: que ninguno de los dos vuelva a abrir el Excel.** Ese es el
criterio que decide los empates. La consecuencia es dura y hay que aceptarla: si
una sola cosa que el Excel hacía no está en la app, el Excel sobrevive y la app
falla, por bonita que sea. La cobertura funcional gana a la elegancia mientras
queden huecos.

## Positioning

Una app de dos personas, no una app multiusuario reducida a dos. Eso permite
cosas que un producto general no puede: no hay registro ni cuentas (se entra con
un PIN por persona), no hay invitaciones ni permisos, y la deuda cruzada es un
único número entre dos partes en vez de un sistema de liquidaciones.

## Operating Context

- Moneda: soles peruanos (S/). Idioma: español (Perú). Zona horaria: Lima — el
  mes al que pertenece un gasto se calcula con el reloj de Lima, no con el del
  servidor.
- Mobile-first real: la escena de registro es un móvil en la mano, de pie.
- Instalable como PWA en la pantalla de inicio.
- Sustituye a un Excel mensual que sigue existiendo hasta que la app lo cubra.

## Capabilities and Constraints

Confirmado y construido:

- Gastos con categoría, cuenta de pago y reparto entre los dos.
- Deuda cruzada: cada gasto tiene dos caras — quién lo pagó y a quién le tocaba;
  la diferencia acumulada es lo que uno le debe al otro. **No se apunta a mano**
  (decidido el 31/07/2026): calcularla es justo lo que un Excel hace peor, así
  que apuntarla otra vez le quitaría el sentido a la app. Lo que sí se registra
  es el dinero que pasa de uno al otro — saldar una deuda o prestar—, porque sin
  eso la cuenta solo crece y el número deja de ser creíble.
- La deuda cuenta todo el histórico, no el mes: lo que se deben en julio sigue
  debiéndose en agosto.
- Topes de gasto por categoría, con semáforo. Se acuerdan una vez y siguen
  vigentes los meses siguientes hasta que se cambien.
- Fondos de ahorro con monto inicial, meta opcional y aportes.
- Cuentas de pago: efectivo, débito, crédito y billeteras (Yape, Plin), con
  saldo calculado a partir de lo que entra y sale.
- Tarjetas de crédito con línea: se lleva cuánto se consumió y cuánto queda
  disponible, y pagarlas devuelve la línea. **Pagar la tarjeta no es un gasto**
  (decidido el 31/07/2026): el gasto ocurrió al comprar, así que registrarlo
  otra vez lo contaría dos veces contra el presupuesto y movería la deuda entre
  los dos, con la que no tiene relación. Sin fechas de corte ni ciclos de
  facturación: lo que importa es cuánto queda hoy.

Constraints técnicas que el diseño no puede saltarse:

- **Sin cuentas de usuario.** Se elige persona y se entra con un PIN; la sesión
  es una cookie firmada con HMAC.
- **El navegador nunca habla con Supabase.** Sin sesión de Supabase, RLS no
  puede distinguir a nadie, así que las tablas están cerradas y solo entra el
  servidor con la clave `service_role`, detrás del PIN. Toda lectura va por
  Server Components y toda escritura por Server Actions. Un componente de
  cliente que consulte la base directamente rompe el modelo de seguridad.
- Las categorías son texto libre normalizado, no una lista cerrada.

Fuera del alcance, decidido el 31/07/2026:

- **Gastos recurrentes:** no hacen falta por ahora.
- **Deudas con terceros y su simulador:** se van a llevar en otro sitio, aún
  por definir. Ninguna de las dos debe volver a construirse sin pedirlo.

Decisión abierta, sin inventar:

- **Las categorías del Excel son las buenas y todavía no están en la app.** Hoy
  hay doce sugerencias puestas a ojo en `CATEGORIAS_SUGERIDAS`. Falta la lista
  real del Excel; hasta que llegue, las que se ven son un marcador de posición,
  no una decisión de producto.

## Brand Commitments

- Nombre: **Even** — de *"we're even"*, estar en paz, que es justo lo que la
  app contesta cuando las cuentas están al día. La interfaz sigue en español;
  el nombre se lee igual en los dos idiomas. El nombre se mantuvo en el
  rediseño del 29/08/2026: es un concepto ligado a la función (saldar la
  deuda cruzada), no a la identidad visual que sí se reemplazó.
- **Mundo visual "Confirmación"** (reemplaza al anterior "Finanzas Pareja"
  el 29/08/2026, decisión del usuario): tarjetas sólidas por dirección del
  dinero (violeta gasto, esmeralda ingreso, azul pendiente), naranja
  `#FF8A4C` como único color de marca, avatar propio por persona, tipografía
  DM Sans, sin cristal ni `backdrop-blur`. El lenguaje de una billetera P2P
  (Yape/Plin) — el gesto que la pareja ya usa a diario para pagarse entre
  ellos — aplicado a toda la app. Detalle completo en `DESIGN.md`.
- Tema único oscuro. No hay tema claro y no se ha pedido.
- Todos los tokens viven en `src/app/globals.css`; los componentes nunca
  escriben un hex.

## Evidence on Hand

- El Excel mensual del que viene todo esto. **No está en el repositorio** y su
  contenido no se ha visto: sus categorías, sus fórmulas y su histórico son
  hechos reales que no deben inventarse.
- No hay usuarios más allá de los dos, ni métricas de uso, ni testimonios, ni
  datos de producción. Nada de eso debe fabricarse.

## Product Principles

1. **Anotar un gasto no puede costar preguntas.** Cada campo que se pregunta al
   pagar es una probabilidad de que el gasto no se registre. Los valores del
   caso normal van puestos; lo raro se despliega.
2. **El Excel es la vara de medir.** Mientras algo que el Excel hacía no esté,
   la app no ha ganado. Cobertura antes que pulido.
3. **La deuda cruzada es el corazón.** Es lo que un Excel a mano hace peor y lo
   que justifica la app. Tiene que estar siempre visible y siempre bien: sus
   cálculos llevan pruebas.
4. **Dos escenas, un producto.** Registrar es de pie y con prisa; revisar es
   sentados y con calma. Ninguna pantalla debe servir a las dos a medias.
5. **Lo que sabe la app, no lo pregunta.** Las categorías más usadas salen del
   historial, la fecha viene puesta, la persona sale de la sesión.

## Accessibility & Inclusion

Sin requisito formal establecido. Lo que el uso real exige: objetivos táctiles
de 44 px o más (la escena de registro es una mano de pie), contraste suficiente
sobre superficies translúcidas oscuras, y estado que no dependa solo del color
—el semáforo del presupuesto también dice el número.
