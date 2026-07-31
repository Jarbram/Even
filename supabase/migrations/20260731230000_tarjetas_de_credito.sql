-- Tarjetas de crédito: línea, consumido y disponible.
--
-- Una tarjeta se mide al revés que el efectivo. En vez de dos fórmulas, el
-- saldo sigue siendo uno solo para todas las cuentas —lo que tienes, o en
-- negativo lo que debes— y la tarjeta solo cambia cómo se presenta:
--
--   consumido  = -saldo
--   disponible = linea + saldo   (saldo es negativo mientras haya consumo)

alter table public.cuentas
  add column if not exists linea numeric(12, 2) check (linea is null or linea > 0);

comment on column public.cuentas.linea is
  'Cupo total de una tarjeta de crédito. Null en el resto de cuentas.';

-- ---------------------------------------------------------------------------
-- Pagar la tarjeta NO es un gasto: el gasto ocurrió al comprar. Registrarlo
-- como gasto lo contaría dos veces contra el presupuesto y descuadraría la
-- deuda entre los dos. Es un movimiento entre dos cuentas propias.
-- ---------------------------------------------------------------------------
create table if not exists public.pagos_tarjeta (
  id              uuid primary key default gen_random_uuid(),
  fecha           date not null default current_date,
  -- La tarjeta que se paga: recibe el dinero y libera línea.
  tarjeta_id      uuid not null references public.cuentas (id) on delete cascade,
  -- De dónde sale. Null si se pagó por fuera de las cuentas registradas.
  desde_cuenta_id uuid references public.cuentas (id) on delete set null,
  monto           numeric(12, 2) not null check (monto > 0),
  created_at      timestamptz not null default now(),
  -- Pagarse a sí misma no significa nada y descuadraría las dos puntas.
  constraint pago_no_circular check (desde_cuenta_id is distinct from tarjeta_id)
);

create index if not exists pagos_tarjeta_tarjeta_idx
  on public.pagos_tarjeta (tarjeta_id, fecha desc);

alter table public.pagos_tarjeta enable row level security;
revoke all on public.pagos_tarjeta from anon, authenticated;

-- ---------------------------------------------------------------------------
-- El saldo pasa a contar también los pagos de tarjeta, por sus dos puntas: la
-- cuenta de origen baja y la tarjeta sube (su deuda se reduce).
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
    as saldo
from public.cuentas c;

revoke all on public.cuentas_saldo from anon, authenticated;
