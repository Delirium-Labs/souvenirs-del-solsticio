insert into souvenirs.deseos
  (id, nombre, precio, categoria, prioridad, modelo, color, creado)
values
  ('gixxer', 'Suzuki Gixxer SF 150 ABS', 3300, 'Moto', 'Alta', 'moto', '#2f5bd3', statement_timestamp() - interval '92 days'),
  ('lavadora', 'Lavadora Whirlpool 20 kg', 458.99, 'Casa', 'Alta', 'lavadora', '#e9edf2', statement_timestamp() - interval '97 days'),
  ('iphone16', 'iPhone 16', 699, 'Tecnología', 'Alta', 'celular', '#1f2026', statement_timestamp()),
  ('a7iv', 'Sony a7 IV', 1999.99, 'Imagen y cámara', 'Media', 'camara', '#1f2026', statement_timestamp()),
  ('pocket4', 'DJI Osmo Pocket 4', 599, 'Imagen y cámara', 'Media', 'gimbal', '#2b2d33', statement_timestamp()),
  ('bmw528', 'BMW 528i xDrive 2016', 7736, 'Carro', 'Baja', 'sedan', '#eef1f6', statement_timestamp()),
  ('r15', 'Yamaha R15', 4500, 'Moto', 'Media', 'moto', '#1e3fa8', statement_timestamp()),
  ('wrxsti', 'Subaru Impreza WRX STI (2001–2003)', 18500, 'Carro', 'Baja', 'deportivo', '#16161c', statement_timestamp()),
  ('zephyrus', 'ASUS ROG Zephyrus G16', 3000, 'Tecnología', 'Media', 'laptop', '#2a2c34', statement_timestamp())
on conflict (id) do nothing;

insert into souvenirs.ahorro (id, monto, actualizado, historial, demo_dias)
values (
  'actual',
  505,
  statement_timestamp() - interval '3 days',
  jsonb_build_array(jsonb_build_object(
    'fecha', statement_timestamp() - interval '3 days',
    'monto', 505
  )),
  0
)
on conflict (id) do nothing;
