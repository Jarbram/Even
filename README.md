# Nuestro Presupuesto

PWA de finanzas para una pareja. Reemplaza el Excel mensual: registra gastos,
calcula sola la deuda cruzada entre ambos, controla presupuesto base cero,
lleva los fondos de ahorro como cuentas con meta y guarda histórico por mes.

Moneda: soles (S/). Idioma: español. Mobile-first, modo oscuro.

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui ·
Supabase (Postgres) · TanStack Query · Recharts · Zod + React Hook Form ·
`@ducanh2912/next-pwa` · Vercel.

> `next-pwa` original (shadowwalker) está sin mantenimiento desde 2022 y no
> arranca con Next 15. Se usa `@ducanh2912/next-pwa`, el fork mantenido con la
> misma API.

## Cómo entra la gente

No hay cuentas ni registro: la app es de dos personas. Eliges quién eres,
escribes tu PIN y queda una cookie firmada con HMAC durante un año.

Eso tiene una consecuencia que manda sobre todo lo demás: **el navegador nunca
habla con Supabase**. Sin sesión de Supabase, RLS no puede distinguir a nadie,
así que unas políticas abiertas dejarían la base al alcance de cualquiera que
sacara la URL y la clave del JavaScript de la app — PostgREST no sabe nada del
PIN. Por eso las tablas están cerradas (RLS activo y cero políticas) y solo
entra el servidor, con la clave `service_role`, detrás del PIN.

En la práctica: todas las lecturas van por Server Components y todas las
escrituras por Server Actions. No existe cliente de Supabase de navegador, y no
debe volver a existir.

## Puesta en marcha

```bash
npm install
cp .env.local.example .env.local   # y rellena los valores
npm run dev
```

### 1. Crear el proyecto de Supabase

1. Entra a [supabase.com/dashboard](https://supabase.com/dashboard) y crea un
   proyecto (la región `South America (São Paulo)` es la más cercana a Perú).
2. **Project Settings → API** te da los dos primeros valores:

   | Variable | De dónde sale |
   | --- | --- |
   | `SUPABASE_URL` | Project URL |
   | `SUPABASE_SERVICE_ROLE_KEY` | Project API keys → `service_role` `secret` |

   Ninguna lleva el prefijo `NEXT_PUBLIC_`, y es a propósito: con él acabarían
   en el JavaScript que descarga el navegador y daría igual el PIN. La clave
   `anon` no se usa.

3. Genera el secreto que firma la cookie y ponlo en `APP_SECRET`:

   ```bash
   openssl rand -base64 32
   ```

   Si lo cambias, los dos tienen que volver a entrar.

4. Elige los PINs: `PIN_ABRAHAM` y `PIN_ISABEL`.

No hace falta tocar **Authentication** en el dashboard: la app no usa Supabase
Auth.

### 2. Correr las migraciones

Las migraciones versionadas viven en `supabase/migrations/`.

**Opción A — Supabase CLI (recomendada):**

```bash
npm i -g supabase
supabase login
supabase link --project-ref TU_PROJECT_REF   # está en la URL del dashboard
supabase db push
```

**Opción B — a mano:** abre **SQL Editor** en el dashboard y pega el contenido
de cada archivo de `supabase/migrations/` en orden de nombre. Son idempotentes:
si una se corta a medias, se vuelve a lanzar entera sin limpiar nada.

Para trabajar contra una base local:

```bash
supabase start     # Postgres en Docker
supabase db reset  # aplica todas las migraciones desde cero
```

### 3. Primer uso

1. `npm run dev` → `http://localhost:3000`.
2. Te manda a `/entrar`: elige quién eres y escribe tu PIN.
3. Ve a **Presupuesto** y carga los ingresos del mes y el reparto por
   categoría. El resto de pantallas se apoya en eso.

## Comandos

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo (Turbopack). El service worker está apagado aquí. |
| `npm run build` | Build de producción con webpack — `next-pwa` es un plugin de webpack, por eso este script no usa Turbopack. |
| `npm start` | Sirve el build. Necesario para probar la PWA. |
| `npm test` | Pruebas de la lógica de dinero y de la firma de sesión (`node --test`, sin dependencias). |
| `npm run typecheck` | `tsc --noEmit`. |
| `npm run lint` | ESLint. |

## Probar la PWA

El service worker solo se genera en `build`:

```bash
npm run build && npm start
```

Abre `http://localhost:3000` en Chrome → DevTools → **Application**:
*Manifest* debe listar los íconos y *Service Workers* debe mostrar `sw.js`
activo. En Android/iOS aparece "Añadir a pantalla de inicio".

Los íconos de `public/icons/` son placeholders generados. Reemplázalos por los
definitivos manteniendo los nombres.

## Deploy en Vercel

1. Sube el repo a GitHub e impórtalo en [vercel.com/new](https://vercel.com/new).
   Vercel detecta Next.js solo.
2. **Settings → Environment Variables**: añade `SUPABASE_URL`,
   `SUPABASE_SERVICE_ROLE_KEY`, `APP_SECRET`, `PIN_ABRAHAM` y `PIN_ISABEL`
   para Production, Preview y Development.
3. Deploy.

## Cómo está organizado

```
src/
  app/
    (app)/            rutas con sesión: shell + navegación inferior
      acciones.ts     todas las escrituras (Server Actions + Zod)
      presupuesto/    ingresos, asignación por categoría y semáforo
    entrar/           elegir persona + PIN
    globals.css       TODOS los design tokens
    manifest.ts       manifest de la PWA
  components/ui/      shadcn/ui
  lib/
    persona.ts        quiénes usan la app (constantes puras)
    firma.ts          HMAC de la cookie y comprobación del PIN
    sesion.ts         cookie, freno de fuerza bruta, requirePersona()
    finanzas.ts       TODOS los cálculos: deuda cruzada, semáforo, simulador
    datos.ts          lecturas de Supabase
    supabase/server.ts  el único cliente, con service_role
supabase/migrations/  SQL versionado
```

**La capa visual está aislada en `src/app/globals.css`.** Colores, radios y
tipografía son variables CSS que Tailwind expone como utilidades; los
componentes nunca escriben un hex. Cambiar el sistema de diseño es cambiar ese
archivo.

Los tokens salen del proyecto de Claude Design *Finanzas Pareja*: carbón
`#111214`, lima `#C7F94E`, indigo `#5B5BF5`, superficies glass translúcidas con
`backdrop-blur`, radios de 18–26 px y tipografía Space Grotesk.

**`finanzas.ts` no importa nada de Next ni de Supabase**, y `firma.ts` tampoco.
Es lo que permite probarlos con `node --test` sin bundler: son las dos piezas
que, si se rompen, hacen que la app mienta sobre el dinero o deje entrar a
cualquiera.

## Estado

- **Fase 1 — hecha.** Scaffold, entrada con PIN por persona, navegación,
  PWA instalable.
- **Fase 2 — hecha.** Esquema completo: gastos, recurrentes, ingresos,
  presupuestos, fondos y deudas.
- **Fase 3 — hecha.** Deuda cruzada, semáforo de presupuesto base cero,
  ahorros con meta, simulador de deudas y materialización de recurrentes, con
  pruebas.
- Fase 4 — pantallas con datos reales. Hechas: inicio y presupuesto. Faltan
  movimientos, estadísticas, y las de ahorros, deudas y recurrentes.
