create schema if not exists souvenirs;

revoke all on schema souvenirs from public;
grant usage on schema souvenirs to anon, authenticated, service_role;

create table souvenirs.deseos (
  id text primary key,
  nombre varchar(60) not null check (length(trim(nombre)) > 0),
  precio numeric not null check (precio > 0 and precio <= 1000000000),
  categoria text not null check (categoria in ('Moto', 'Carro', 'Imagen y cámara', 'Casa', 'Tecnología', 'Estilo', 'Otro')),
  prioridad text not null check (prioridad in ('Alta', 'Media', 'Baja')),
  modelo text not null,
  color text not null check (color ~ '^#[0-9a-fA-F]{6}$'),
  piezas jsonb check (piezas is null or jsonb_typeof(piezas) = 'array'),
  creado timestamptz not null
);

create table souvenirs.compras (
  id text primary key,
  numero bigint not null unique check (numero > 0),
  deseo jsonb not null check (jsonb_typeof(deseo) = 'object'),
  fecha timestamptz not null,
  valor numeric not null check (valor > 0 and valor <= 1000000000),
  dias integer not null check (dias >= 0),
  capitulo varchar(80) not null,
  estante_vaciado text check (estante_vaciado in ('arriba', 'abajo'))
);

create table souvenirs.logros (
  id text primary key,
  desbloqueado_en timestamptz not null
);

create table souvenirs.ahorro (
  id text primary key default 'actual' check (id = 'actual'),
  monto numeric not null check (monto >= 0 and monto <= 1000000000),
  actualizado timestamptz not null,
  historial jsonb not null check (jsonb_typeof(historial) = 'array'),
  demo_dias integer not null default 0 check (demo_dias >= 0 and demo_dias <= 36500)
);

create index deseos_creado_idx on souvenirs.deseos(creado);
create index deseos_precio_idx on souvenirs.deseos(precio);
create index compras_fecha_idx on souvenirs.compras(fecha);

alter table souvenirs.deseos enable row level security;
alter table souvenirs.compras enable row level security;
alter table souvenirs.logros enable row level security;
alter table souvenirs.ahorro enable row level security;

create policy "deseos publicos"
  on souvenirs.deseos for select to anon, authenticated
  using (true);
create policy "dueno gestiona deseos"
  on souvenirs.deseos for all to authenticated
  using ((select core.es_dueno('souvenirs')))
  with check ((select core.es_dueno('souvenirs')));

create policy "compras publicas"
  on souvenirs.compras for select to anon, authenticated
  using (true);
create policy "dueno gestiona compras"
  on souvenirs.compras for all to authenticated
  using ((select core.es_dueno('souvenirs')))
  with check ((select core.es_dueno('souvenirs')));

create policy "logros publicos"
  on souvenirs.logros for select to anon, authenticated
  using (true);
create policy "dueno gestiona logros"
  on souvenirs.logros for all to authenticated
  using ((select core.es_dueno('souvenirs')))
  with check ((select core.es_dueno('souvenirs')));

create policy "solo el dueno gestiona ahorro"
  on souvenirs.ahorro for all to authenticated
  using ((select core.es_dueno('souvenirs')))
  with check ((select core.es_dueno('souvenirs')));

create or replace function souvenirs.comprar(
  p_id text,
  p_fecha timestamptz,
  p_dias integer,
  p_capitulo text
)
returns souvenirs.compras
language plpgsql
set search_path = ''
as $$
declare
  v_deseo souvenirs.deseos%rowtype;
  v_compra souvenirs.compras%rowtype;
  v_lado text;
begin
  if not core.es_dueno('souvenirs') then
    raise exception 'No tienes permiso para comprar en esta vitrina.' using errcode = '42501';
  end if;

  select * into v_deseo from souvenirs.deseos where id = p_id for update;
  if not found then
    raise exception 'Ese deseo ya no está en la vitrina.' using errcode = 'P0002';
  end if;

  v_lado := case when v_deseo.precio >= 1000 then 'arriba' else 'abajo' end;
  delete from souvenirs.deseos where id = p_id;
  perform pg_advisory_xact_lock(hashtext('souvenirs.compras.numero'));

  insert into souvenirs.compras (id, numero, deseo, fecha, valor, dias, capitulo, estante_vaciado)
  values (
    gen_random_uuid()::text,
    coalesce((select max(numero) from souvenirs.compras), 0) + 1,
    to_jsonb(v_deseo),
    p_fecha,
    v_deseo.precio,
    greatest(p_dias, 0),
    left(p_capitulo, 80),
    case when exists (
      select 1 from souvenirs.deseos
      where (precio >= 1000) = (v_lado = 'arriba')
    ) then null else v_lado end
  ) returning * into v_compra;

  return v_compra;
end;
$$;

create or replace function souvenirs.reemplazar_estado(
  p_deseos jsonb,
  p_compras jsonb,
  p_logros jsonb,
  p_ahorro jsonb
)
returns void
language plpgsql
set search_path = ''
as $$
begin
  if not core.es_dueno('souvenirs') then
    raise exception 'No tienes permiso para reemplazar esta vitrina.' using errcode = '42501';
  end if;

  delete from souvenirs.compras;
  delete from souvenirs.logros;
  delete from souvenirs.deseos;
  delete from souvenirs.ahorro;

  insert into souvenirs.deseos (id, nombre, precio, categoria, prioridad, modelo, color, piezas, creado)
  select id, nombre, precio, categoria, prioridad, modelo, color, piezas, creado
  from jsonb_to_recordset(coalesce(p_deseos, '[]'::jsonb)) as x(
    id text, nombre text, precio numeric, categoria text, prioridad text,
    modelo text, color text, piezas jsonb, creado timestamptz
  );

  insert into souvenirs.compras (id, numero, deseo, fecha, valor, dias, capitulo, estante_vaciado)
  select id, numero, deseo, fecha, valor, dias, capitulo, estante_vaciado
  from jsonb_to_recordset(coalesce(p_compras, '[]'::jsonb)) as x(
    id text, numero bigint, deseo jsonb, fecha timestamptz, valor numeric,
    dias integer, capitulo text, estante_vaciado text
  );

  insert into souvenirs.logros (id, desbloqueado_en)
  select id, desbloqueado_en
  from jsonb_to_recordset(coalesce(p_logros, '[]'::jsonb))
    as x(id text, desbloqueado_en timestamptz);

  insert into souvenirs.ahorro (id, monto, actualizado, historial, demo_dias)
  values (
    'actual',
    coalesce((p_ahorro->>'monto')::numeric, 0),
    coalesce((p_ahorro->>'actualizado')::timestamptz, now()),
    coalesce(p_ahorro->'historial', '[]'::jsonb),
    coalesce((p_ahorro->>'demo_dias')::integer, 0)
  );
end;
$$;

revoke all on all tables in schema souvenirs from anon, authenticated;
grant select on souvenirs.deseos, souvenirs.compras, souvenirs.logros to anon;
grant select, insert, update, delete on all tables in schema souvenirs to authenticated;
grant all on all tables in schema souvenirs to service_role;

revoke all on function souvenirs.comprar(text, timestamptz, integer, text) from public;
revoke all on function souvenirs.reemplazar_estado(jsonb, jsonb, jsonb, jsonb) from public;
grant execute on function souvenirs.comprar(text, timestamptz, integer, text) to authenticated, service_role;
grant execute on function souvenirs.reemplazar_estado(jsonb, jsonb, jsonb, jsonb) to authenticated, service_role;
