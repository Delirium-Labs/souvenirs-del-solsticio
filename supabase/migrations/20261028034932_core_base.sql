create schema if not exists core;

revoke all on schema core from public;
grant usage on schema core to anon, authenticated, service_role;

create table core.apps (
  id text primary key,
  nombre text not null,
  repo text,
  creado_at timestamptz not null default now()
);

create table core.miembros (
  app_id text not null references core.apps(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rol text not null check (rol in ('dueno', 'editor')),
  creado_at timestamptz not null default now(),
  primary key (app_id, user_id)
);

create index miembros_user_id_idx on core.miembros(user_id);

alter table core.apps enable row level security;
alter table core.miembros enable row level security;

create policy "apps visibles para todos"
  on core.apps for select to anon, authenticated
  using (true);

create policy "cada miembro ve su membresia"
  on core.miembros for select to authenticated
  using (user_id = (select auth.uid()));

create or replace function core.es_dueno(p_app text)
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (
    select 1
    from core.miembros
    where app_id = p_app
      and user_id = (select auth.uid())
      and rol in ('dueno', 'editor')
  );
$$;

create or replace function core.ping()
returns timestamptz
language sql
stable
set search_path = ''
as $$ select now(); $$;

revoke all on all tables in schema core from anon, authenticated;
grant select on core.apps to anon, authenticated;
grant select on core.miembros to authenticated;
grant all on all tables in schema core to service_role;

revoke all on function core.es_dueno(text) from public;
revoke all on function core.ping() from public;
grant execute on function core.es_dueno(text) to anon, authenticated, service_role;
grant execute on function core.ping() to anon, authenticated, service_role;

insert into core.apps (id, nombre, repo)
values ('souvenirs', 'Souvenirs del Solsticio', 'souvenirs-del-solsticio')
on conflict (id) do update
set nombre = excluded.nombre, repo = excluded.repo;
