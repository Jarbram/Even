# Nuestro Presupuesto

PWA de finanzas para una pareja. Reemplaza el Excel mensual: registra gastos,
calcula sola la deuda cruzada entre ambos, controla presupuesto base cero,
lleva los fondos de ahorro como cuentas con meta y guarda histórico por mes.

Moneda: soles (S/). Idioma: español. Mobile-first, modo oscuro.

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui ·
Supabase (Postgres + Auth + RLS) · TanStack Query · Recharts · Zod +
React Hook Form · `@ducanh2912/next-pwa` · Vercel.

> `next-pwa` original (shadowwalker) está sin mantenimiento desde 2022 y no
> arranca con Next 15. Se usa `@ducanh2912/next-pwa`, el fork mantenido con la
> misma API.

## Puesta en marcha

```bash
npm install
cp .env.local.example .env.local   # y rellena los valores
npm run dev
```

### 1. Crear el proyecto de Supabase

1. Entra a [supabase.com/dashboard](https://supabase.com/dashboard) y crea un
   proyecto (la región `South America (São Paulo)` es la más cercana a Perú).
2. **Project Settings → API** te da los dos valores del `.env.local`:

   | Variable | De dónde sale |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project API keys → `anon` `public` |

   Las dos son públicas por diseño: quien protege los datos es RLS, no la
   clave. La `service_role` no se usa en este proyecto y no debe llegar nunca
   al cliente.

3. **Authentication → Providers → Email**: déjalo activo. Si quieres entrar sin
   confirmar el correo (cómodo mientras desarrollas), desactiva *Confirm email*.
4. **Authentication → URL Configuration**: pon `http://localhost:3000` como
   Site URL y añade `http://localhost:3000/auth/callback` y
   `https://TU-DOMINIO.vercel.app/auth/callback` a Redirect URLs.

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
de cada archivo de `supabase/migrations/` en orden de nombre.

Para trabajar contra una base local:

```bash
supabase start     # Postgres + Auth en Docker
supabase db reset  # aplica todas las migraciones desde cero
```

### 3. Primer uso

1. `npm run dev` → `http://localhost:3000/registro`.
2. La primera persona crea el hogar y recibe un código de 6 caracteres
   (visible en **Ajustes**).
3. La segunda se registra y entra con ese código. Un hogar admite dos personas.

## Comandos

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo (Turbopack). El service worker está apagado aquí. |
| `npm run build` | Build de producción con webpack — `next-pwa` es un plugin de webpack, por eso este script no usa Turbopack. |
| `npm start` | Sirve el build. Necesario para probar la PWA. |
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
2. **Settings → Environment Variables**: añade `NEXT_PUBLIC_SUPABASE_URL` y
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` para Production, Preview y Development.
3. Deploy.
4. Vuelve a Supabase → **Authentication → URL Configuration** y añade el
   dominio de Vercel como Site URL y su `/auth/callback` a Redirect URLs.

## Cómo está organizado

```
src/
  app/
    (app)/            rutas con sesión y hogar: shell + navegación inferior
    (auth)/           login y registro
    auth/callback/    destino del enlace de confirmación de correo
    bienvenida/       crear hogar o unirse con código
    globals.css       TODOS los design tokens
    manifest.ts       manifest de la PWA
  components/
    ui/               shadcn/ui
  lib/supabase/       clientes de navegador y de servidor
supabase/migrations/  SQL versionado
```

**La capa visual está aislada en `src/app/globals.css`.** Colores, radios y
tipografía son variables CSS que Tailwind expone como utilidades; los
componentes nunca escriben un hex. Cambiar el sistema de diseño es cambiar ese
archivo.

Los tokens salen del proyecto de Claude Design *Finanzas Pareja*: carbón
`#111214`, lima `#C7F94E`, indigo `#5B5BF5`, superficies glass translúcidas con
`backdrop-blur`, radios de 18–26 px y tipografía Space Grotesk.

## Estado

- **Fase 1 — hecha.** Scaffold, auth por correo, hogares con código de
  invitación, navegación de 4 pestañas, PWA instalable.
- Fase 2 — esquema completo de base de datos y seed de categorías.
- Fase 3 — deuda cruzada, semáforo de presupuesto, ahorros, simulador de
  deudas, recurrentes.
- Fase 4 — pantallas con datos reales.
