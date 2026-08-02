-- Gastos que paga una persona y debe devolver la otra: no es el reparto
-- automático que se quitó con la deuda cruzada, es un caso puntual que se
-- marca a mano. `a_reembolsar` es la intención al crear el gasto;
-- `reembolsos` es el movimiento real de plata que lo salda.

alter table public.gastos
  add column if not exists a_reembolsar boolean not null default false;

-- Devolver plata no es un gasto de la casa (mismo motivo que pagos_tarjeta:
-- ver esa migración): es un movimiento entre una cuenta de quien devuelve y
-- una de quien cobra. Las dos cuentas son obligatorias — sin ellas el saldo
-- de alguna de las dos personas quedaría mintiendo, que es justo lo que esto
-- evita.
create table if not exists public.reembolsos (
  id              uuid primary key default gen_random_uuid(),
  -- El gasto que se salda. Si se borra el gasto la plata ya se movió: el
  -- reembolso se queda, solo pierde el vínculo.
  gasto_id        uuid references public.gastos (id) on delete set null,
  fecha           date not null default current_date,
  desde_cuenta_id uuid not null references public.cuentas (id) on delete restrict,
  hacia_cuenta_id uuid not null references public.cuentas (id) on delete restrict,
  monto           numeric(12, 2) not null check (monto > 0),
  created_at      timestamptz not null default now(),
  constraint reembolso_no_circular check (desde_cuenta_id is distinct from hacia_cuenta_id)
);

create index if not exists reembolsos_gasto_idx on public.reembolsos (gasto_id);

alter table public.reembolsos enable row level security;
revoke all on public.reembolsos from anon, authenticated;

-- ---------------------------------------------------------------------------
-- El saldo de una cuenta también cuenta lo que salió o entró por un
-- reembolso, igual que ya hace con los pagos de tarjeta.
-- ---------------------------------------------------------------------------
drop view if exists public.cuentas_saldo;

create view public.cuentas_saldo as
select
  c.id,
  c.nombre,
  c.tipo,
  c.persona,
  c.color,
  c.activa,
  c.created_at,
  c.saldo_base,
  c.linea,
  c.saldo_base
    + coalesce((select sum(i.monto) from public.ingresos i where i.cuenta_id = c.id), 0)
    - coalesce((select sum(g.monto) from public.gastos   g where g.cuenta_id = c.id), 0)
    -- Lo que salió de esta cuenta para pagar alguna tarjeta.
    - coalesce((select sum(p.monto) from public.pagos_tarjeta p where p.desde_cuenta_id = c.id), 0)
    -- Lo que entró a esta tarjeta como pago, que le devuelve línea.
    + coalesce((select sum(p.monto) from public.pagos_tarjeta p where p.tarjeta_id = c.id), 0)
    -- Lo que salió de esta cuenta como devolución a la otra persona.
    - coalesce((select sum(r.monto) from public.reembolsos r where r.desde_cuenta_id = c.id), 0)
    -- Lo que entró a esta cuenta como devolución recibida.
    + coalesce((select sum(r.monto) from public.reembolsos r where r.hacia_cuenta_id = c.id), 0)
    as saldo
from public.cuentas c;

revoke all on public.cuentas_saldo from anon, authenticated;
