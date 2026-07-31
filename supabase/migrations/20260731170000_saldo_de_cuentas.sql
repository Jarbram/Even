-- Cuánto tiene cada cuenta.
--
-- Se guarda solo el punto de partida (`saldo_base`) y el saldo de hoy se
-- calcula: base + lo que entró a la cuenta - lo que salió de ella. Guardar el
-- saldo actual como columna obligaría a mantenerlo a mano en cada gasto,
-- ingreso, borrado y edición, y basta con que uno de esos caminos se olvide
-- para que el número quede mintiendo sin que nadie se entere.

alter table public.cuentas
  add column if not exists saldo_base numeric(12, 2) not null default 0;

create or replace view public.cuentas_saldo as
select
  c.id,
  c.nombre,
  c.tipo,
  c.persona,
  c.color,
  c.activa,
  c.created_at,
  c.saldo_base,
  c.saldo_base
    + coalesce((select sum(i.monto) from public.ingresos i where i.cuenta_id = c.id), 0)
    - coalesce((select sum(g.monto) from public.gastos   g where g.cuenta_id = c.id), 0)
    as saldo
from public.cuentas c;

-- La vista hereda el RLS de `cuentas`, que está cerrado: solo entra el servidor
-- con service_role. Se revoca igualmente para que no dependa del ajuste por
-- defecto de Supabase.
revoke all on public.cuentas_saldo from anon, authenticated;
