-- Dinero que pasa de uno al otro, sin ser un gasto de la casa.
--
-- Liquidar una deuda y prestar plata son la misma operación con distinta
-- etiqueta: alguien entrega y el saldo entre los dos se mueve en esa dirección.
-- Por eso una sola tabla y un solo campo de dirección (`de_persona`, quien
-- entrega); `tipo` solo cambia cómo se cuenta en pantalla.

create table if not exists public.transferencias (
  id          uuid primary key default gen_random_uuid(),
  fecha       date not null default current_date,
  -- Quien pone el dinero. El otro es el que lo recibe: solo son dos.
  de_persona  text not null check (de_persona in ('abraham', 'isabel')),
  monto       numeric(10, 2) not null check (monto > 0),
  tipo        text not null default 'liquidacion'
                check (tipo in ('liquidacion', 'prestamo')),
  concepto    text not null default '',
  created_at  timestamptz not null default now()
);

create index if not exists transferencias_fecha_idx
  on public.transferencias (fecha desc);

alter table public.transferencias enable row level security;
revoke all on public.transferencias from anon, authenticated;
