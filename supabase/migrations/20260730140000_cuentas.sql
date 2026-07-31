-- De dónde sale la plata: efectivo, la tarjeta de débito, la de crédito, Yape.
-- Cada uno registra las suyas, así que es tabla y no constante.

create table if not exists public.cuentas (
  id         uuid primary key default gen_random_uuid(),
  nombre     text not null,
  tipo       text not null check (tipo in ('efectivo', 'debito', 'credito', 'billetera')),
  persona    text not null check (persona in ('abraham', 'isabel')),
  -- Color del punto en la lista de movimientos. Sale de los tokens del diseño.
  color      text not null default 'chart-1',
  activa     boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists cuentas_persona_idx on public.cuentas (persona);

-- Los gastos viejos se quedan sin cuenta en vez de desaparecer: por eso `set null`
-- y no `cascade`. Borrar una tarjeta no debe borrar el histórico de gastos.
alter table public.gastos
  add column if not exists cuenta_id uuid references public.cuentas (id) on delete set null;

alter table public.cuentas enable row level security;
revoke all on public.cuentas from anon, authenticated;
