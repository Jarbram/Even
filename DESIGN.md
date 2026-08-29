# DESIGN.md

<!-- impeccable:design-schema 1 -->
<!-- Documentado 2026-08-29, tras el rediseño "Confirmación". -->

## Mundo

**Confirmación**: cada pantalla se lee como una confirmación de pago entre
Abraham e Isabel, no como un panel de vidrio con datos encima. Es el
lenguaje que ya usan a diario para pagarse entre ellos (Yape, Plin), aplicado
al resto de la app — tarjetas sólidas por dirección del dinero, avatar
propio por persona, un solo color de marca.

Elegido por el usuario sobre la dirección #5 asignada por el sorteo de
Impeccable (una boleta de cajero automático); seed key `dee5052c`. Reemplaza
por completo la identidad anterior ("Finanzas Pareja": carbón/lima/índigo,
superficies de vidrio con blur).

## Paleta

Tema único oscuro (sin tema claro; sigue sin pedirse). Estrategia: paleta
completa — un color con nombre por rol, no neutro-más-acento.

| Rol | Token | Valor | Uso |
|---|---|---|---|
| Fondo | `--shell` / `--background` | `#0a0a0e` / `#121218` | shell / página |
| Texto | `--foreground` | `#f5f5f8` | texto principal |
| Tarjeta | `--panel` / `--panel-alto` | `#1b1b23` / `#24242e` | superficies sólidas (antes "glass") |
| Marca | `--primary` | `#ff8a4c` | CTA, foco, nav activa, enlaces — de Even y de nadie más |
| Abraham | `--secondary` | `#4c8cff` | avatar, identidad |
| Isabel | `--chart-6` | `#f2559c` | avatar, identidad |
| Gasto | `--fill-gasto` | `#5b3de0` | tarjeta sólida "sale plata" |
| Ingreso | `--fill-ingreso` | `#0e9f63` | tarjeta sólida "entra plata" |
| Pendiente | `--fill-pendiente` | `#2554c7` | tarjeta sólida "deuda entre los dos" |
| Saldo | `--fill-saldo` | `#b5480f` | tarjeta de saldo del Home (naranja hondo) |
| Semáforo | `--ok` / `--warn` / `--over` | `#22c55e` / `#f5a623` / `#ff5470` | presupuesto |
| Borrar | `--destructive` | `#ef4444` | distinto de `--over` a propósito |
| Cuentas | `--chart-1..9` | ver `globals.css` | punto de color por cuenta |

**Regla de color monetario** (nueva, aplicada en todo el código): el monto de
un ingreso o un ahorro usa `text-ok` (verde), nunca `--primary`. El monto de
un gasto activo usa `--fill-gasto` (violeta) solo en botones/tarjetas
sólidas — en texto suelto no se usa, para no perder legibilidad sobre fondo
oscuro. Una deuda pendiente ("por cobrar", el toggle de reembolsar) usa
`text-chart-4` (celeste), no el naranja de marca. Un saldo negativo o un
traspaso saliente usa `--over`, nunca `--destructive` — ese queda solo para
acciones de borrar.

## Tipografía

**DM Sans** (`next/font/google`, autohospedada) — redondeada y amigable,
reemplaza a Space Grotesk. Pesos 400–800. `--font-mono` queda declarado sin
uso real (nada en la app pide monoespaciada).

## Tarjetas (antes "glass")

Dos profundidades, sólidas — sin `backdrop-filter`, sin blur, sin halos de
vidrio:

- `panel` — apoyada sobre el fondo: filas, listas.
- `panel-accion` — lo mismo, pero se toca (se levanta al pasar, se hunde al pulsar).
- `panel-nav` — flota por encima: la navegación inferior.
- `panel-hueco` — hundido: campos, canales de barra.

Radio: `1.25rem` base (antes `1.125rem`), más redondo — el lenguaje de una
billetera P2P se lee amigable, no anguloso.

## Movimiento

- `--ease-salida`: desaceleración lisa, para lo que solo entra o sale de la pantalla.
- `--ease-rebote` (nueva): `cubic-bezier(0.34, 1.56, 0.64, 1)`, un leve rebote —
  para lo que se confirma: una barra de presupuesto que crece, la marca `✓`
  de un pago guardado. Es una elección deliberada del mundo elegido (el
  mismo gesto de confirmación de Yape/Plin), no un descuido: el detector de
  Impeccable la marca como "bounce-easing" (advertencia genérica contra
  rebotes), y se mantiene a propósito. Ver el comentario en `globals.css`
  junto a `crecer-barra` y `confirma`.

## Componentes propios de este mundo

- **`AvatarPersona`** (`src/components/avatar-persona.tsx`): el círculo de
  iniciales con el color propio de cada persona, consistente en Home,
  Ajustes, Entrar y las tarjetas de "Por cobrar".
- **Tarjeta de "Por cobrar"** (`ajustes/page.tsx`): la pieza central del
  mundo elegido — tarjeta sólida azul (`--fill-pendiente`), un avatar a cada
  lado de una flecha, monto grande. Es la pantalla que Abraham e Isabel ya
  conocen de pagarse por Yape/Plin, aplicada a la deuda que la app calcula
  sola.
- **`TarjetaCategoria`** (`src/components/tarjeta-categoria.tsx`): antes
  mostraba el mismo porcentaje dos veces (un aro cónico y una barra). Ahora
  es una barra y un ícono de forma distinta por estado (`CircleCheck` /
  `TriangleAlert` / `OctagonAlert`) — el estado nunca depende solo del
  color.

## Ícono de la app

`src/app/icon.png` y `public/icons/*.png` (192, 512, 512 maskable): naranja
de marca `#FF8A4C`, una "E" en `#200C02` —el mismo par `bg-primary
text-primary-foreground` que usan los botones en toda la app—, esquinas
redondeadas en las versiones normales y sin redondear en la maskable (el
sistema operativo pone su propia máscara). Renderizado con Chrome headless
a partir de HTML/CSS propio, no con una herramienta de generación de
imágenes.

## Deuda conocida

- **Sin verificación visual en navegador**: este rediseño se hizo sin
  extensión de Chrome conectada. Typecheck, lint, tests unitarios y build de
  producción pasan limpios, pero nadie miró las pantallas renderizadas antes
  de este commit.

## Contrato de dirección

El comentario de cinco bloques (THESIS/OWN-WORLD/STORY/FIRST
VIEWPORT/FORM/FINISH) vive como comentario JSX al inicio de `<body>` en
`src/app/layout.tsx` — no como comentario HTML literal: React retira los
comentarios JSX en build, así que no sobrevive al HTML servido ni es
buscable en `.next/`. Es la convención de comentario largo que ya usa este
proyecto (ver Home, los formularios), y cumple el mismo propósito de
registro para quien edite el archivo después.
