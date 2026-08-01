-- Se quita la deuda cruzada entre las dos personas: ya no se calcula ni se
-- registra. `transferencias` solo existía para saldarla o prestarse plata, y
-- `parte_abraham` solo servía para repartir cada gasto entre los dos.

drop table if exists public.transferencias;

alter table public.gastos drop column if exists parte_abraham;
