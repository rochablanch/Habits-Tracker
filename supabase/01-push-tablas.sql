-- ============================================================================
-- Recordatorios que llegan con la app cerrada (Web Push)  —  parte 1 de 2
--
-- Qué crea:
--   * push_subscriptions: qué dispositivo(s) tiene(n) que recibir los avisos de cada persona.
--   * push_enviados: qué aviso ya se mandó, para no repetirlo el mismo día.
--   * recordatorios_a_enviar(): la consulta que decide, en este minuto, qué avisos tocan.
--
-- Las dos tablas tienen RLS (Row Level Security) igual que el resto: cada persona solo ve
-- lo suyo. La función que manda los avisos corre con permisos de servidor, no con los de
-- una persona, así que puede leer lo de todas las cuentas.
--
-- Correr una sola vez en Supabase → SQL Editor.
-- ============================================================================

-- ---------------------------------------------------------------- dispositivos
create table if not exists public.push_subscriptions (
  endpoint     text primary key,               -- la "dirección" que da el navegador
  user_id      uuid not null references auth.users (id) on delete cascade,
  p256dh       text not null,                  -- claves para cifrar el mensaje
  auth         text not null,
  zona_horaria text not null default 'America/Montevideo',
  creado_en    timestamptz not null default now(),
  ultimo_error text
);

create index if not exists push_subscriptions_user_id_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists "cada quien su suscripcion" on public.push_subscriptions;
create policy "cada quien su suscripcion" on public.push_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ------------------------------------------------------------- avisos enviados
create table if not exists public.push_enviados (
  user_id     uuid not null references auth.users (id) on delete cascade,
  habito_uuid uuid not null,
  fecha_local date not null,
  enviado_en  timestamptz not null default now(),
  primary key (user_id, habito_uuid, fecha_local)
);

alter table public.push_enviados enable row level security;

drop policy if exists "cada quien sus enviados" on public.push_enviados;
create policy "cada quien sus enviados" on public.push_enviados
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Limpieza: los registros de más de 30 días no sirven para nada.
create or replace function public.limpiar_push_enviados()
returns void
language sql
as $$
  delete from public.push_enviados where fecha_local < current_date - 30;
$$;

-- --------------------------------------------------- qué avisos tocan ahora mismo
-- Misma lógica que la app usa en el teléfono (src/settings/reminders.ts):
--   hábito activo, con recordatorio y hora preferida, que aplica hoy según su frecuencia,
--   cuya hora ya llegó en la zona horaria de la persona, y que todavía no tiene registro hoy.
create or replace function public.recordatorios_a_enviar()
returns table (
  endpoint     text,
  p256dh       text,
  auth         text,
  user_id      uuid,
  habito_uuid  uuid,
  nombre       text,
  hora_preferida text,
  fecha_local  date
)
language sql
stable
as $$
  with dispositivos as (
    select
      s.endpoint,
      s.p256dh,
      s.auth,
      s.user_id,
      (now() at time zone s.zona_horaria)::date            as fecha_local,
      to_char(now() at time zone s.zona_horaria, 'HH24:MI') as hora_local
    from public.push_subscriptions s
  )
  select
    d.endpoint,
    d.p256dh,
    d.auth,
    d.user_id,
    h.uuid as habito_uuid,
    h.nombre,
    left(h.hora_preferida::text, 5) as hora_preferida,
    d.fecha_local
  from dispositivos d
  join public.habitos h
    on h.user_id = d.user_id
   and h.recordatorio
   and h.hora_preferida is not null
   and h.estado = 'activo'
   and not h.eliminado
   and h.fecha_inicio::date <= d.fecha_local
   and left(h.hora_preferida::text, 5) <= d.hora_local
   and (
        h.frecuencia <> 'dias_semana'
        or extract(dow from d.fecha_local)::int = any (h.dias_semana)
       )
  where not exists (
          select 1 from public.registros r
          where r.user_id = h.user_id
            and r.habito_uuid = h.uuid
            and r.fecha::date = d.fecha_local
        )
    and not exists (
          select 1 from public.push_enviados e
          where e.user_id = h.user_id
            and e.habito_uuid = h.uuid
            and e.fecha_local = d.fecha_local
        );
$$;
