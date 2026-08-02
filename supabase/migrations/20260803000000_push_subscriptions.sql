-- Suscripciones a notificaciones push, una por dispositivo.
--
-- Un mismo endpoint (el navegador ya lo hace único por instalación) se
-- vuelve a guardar con upsert si el dispositivo se vuelve a suscribir, por
-- ejemplo tras borrar caché. `persona` la decide el servidor a partir de la
-- sesión, nunca el cliente: si no, cualquiera podría suscribirse "como" el
-- otro y leer sus avisos.
create table if not exists public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  persona    text not null check (persona in ('abraham', 'isabel')),
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now()
);

create index if not exists push_subscriptions_persona_idx
  on public.push_subscriptions (persona);

alter table public.push_subscriptions enable row level security;
revoke all on public.push_subscriptions from anon, authenticated;
