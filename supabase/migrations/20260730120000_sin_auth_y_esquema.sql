-- La app la usan dos personas y no tiene login: la identidad es una cookie del
-- navegador, no una sesión. Eso deja sin sentido a `households` y `profiles`,
-- que se van, y a RLS-por-hogar, que ya no puede distinguir a nadie.
--
-- Idempotente a propósito: corre igual si la migración anterior se aplicó o no.

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.create_household(text);
drop function if exists public.join_household(text);
drop table if exists public.profiles cascade;
drop table if exists public.households cascade;
drop schema if exists private cascade;

-- ---------------------------------------------------------------------------
-- Gastos recurrentes: la plantilla, no el gasto. Cada mes se materializa en
-- `gastos` una sola vez (ver el índice único de más abajo).
-- ---------------------------------------------------------------------------
create table if not exists public.recurrentes (
  id            uuid primary key default gen_random_uuid(),
  descripcion   text not null,
  categoria     text not null,
  monto         numeric(10, 2) not null check (monto > 0),
  pagado_por    text not null check (pagado_por in ('abraham', 'isabel')),
  parte_abraham numeric(4, 3) not null default 0.5
                  check (parte_abraham between 0 and 1),
  dia           smallint not null check (dia between 1 and 28),
  activo        boolean not null default true,
  created_at    timestamptz not null default now()
);

-- dia <= 28: así el recurrente cae en todos los meses sin casos raros de febrero.

-- ---------------------------------------------------------------------------
-- Gastos. `parte_abraham` es la fracción del gasto que le toca a Abraham; el
-- resto es de Isabel. Con eso y `pagado_por` sale sola la deuda cruzada.
-- ---------------------------------------------------------------------------
create table if not exists public.gastos (
  id            uuid primary key default gen_random_uuid(),
  fecha         date not null default current_date,
  descripcion   text not null,
  categoria     text not null,
  monto         numeric(10, 2) not null check (monto > 0),
  pagado_por    text not null check (pagado_por in ('abraham', 'isabel')),
  parte_abraham numeric(4, 3) not null default 0.5
                  check (parte_abraham between 0 and 1),
  recurrente_id uuid references public.recurrentes (id) on delete set null,
  mes           date not null generated always as (
                  fecha - ((extract(day from fecha)::int - 1))
                ) stored,
  created_at    timestamptz not null default now()
);

create index if not exists gastos_mes_idx on public.gastos (mes);

-- La red de seguridad de la materialización: un recurrente no puede generar dos
-- gastos en el mismo mes, aunque la app lo intente dos veces a la vez.
create unique index if not exists gastos_recurrente_mes_idx
  on public.gastos (recurrente_id, mes)
  where recurrente_id is not null;

-- ---------------------------------------------------------------------------
-- Ingresos del mes: el numerador del presupuesto base cero.
-- ---------------------------------------------------------------------------
create table if not exists public.ingresos (
  id          uuid primary key default gen_random_uuid(),
  mes         date not null,
  persona     text not null check (persona in ('abraham', 'isabel')),
  descripcion text not null default 'Sueldo',
  monto       numeric(10, 2) not null check (monto > 0),
  created_at  timestamptz not null default now()
);

create index if not exists ingresos_mes_idx on public.ingresos (mes);

-- ---------------------------------------------------------------------------
-- Presupuesto asignado por categoría y mes. Base cero: la suma de estos montos
-- debería igualar los ingresos del mes; la app lo calcula, no la base.
-- ---------------------------------------------------------------------------
create table if not exists public.presupuestos (
  mes       date not null,
  categoria text not null,
  monto     numeric(10, 2) not null check (monto >= 0),
  primary key (mes, categoria)
);

-- ---------------------------------------------------------------------------
-- Fondos de ahorro: cuentas con meta.
-- ponytail: `saldo` es un número editable, no un libro de aportes. Si algún día
-- hace falta el histórico de cuánto se metió y cuándo, esto pasa a ser una tabla
-- `aportes` y `saldo` una suma.
-- ---------------------------------------------------------------------------
create table if not exists public.fondos (
  id         uuid primary key default gen_random_uuid(),
  nombre     text not null,
  meta       numeric(10, 2) check (meta > 0),
  saldo      numeric(10, 2) not null default 0 check (saldo >= 0),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Deudas con terceros (banco, tarjeta). Alimentan el simulador.
-- ---------------------------------------------------------------------------
create table if not exists public.deudas (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null,
  saldo         numeric(12, 2) not null check (saldo >= 0),
  tasa_anual    numeric(5, 2) not null default 0 check (tasa_anual >= 0),
  pago_mensual  numeric(10, 2) not null check (pago_mensual > 0),
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- RLS: cerrado a cal y canto
--
-- Sin login, RLS no puede distinguir a nadie: una política abierta a `anon`
-- dejaría estas tablas al alcance de cualquiera que sacara la URL y la clave
-- pública del JavaScript de la app. PostgREST no sabe nada del PIN.
--
-- Por eso: RLS activo y CERO políticas, que en Postgres significa "nadie pasa".
-- La app entra con la clave `service_role` desde el servidor, detrás del PIN.
-- La consecuencia práctica es que ningún componente del navegador puede hablar
-- con Supabase: todo pasa por Server Components y Server Actions. A propósito.
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['recurrentes', 'gastos', 'ingresos', 'presupuestos', 'fondos', 'deudas']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
  end loop;
end $$;
