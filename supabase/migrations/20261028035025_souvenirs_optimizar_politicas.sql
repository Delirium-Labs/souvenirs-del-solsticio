drop policy "dueno gestiona deseos" on souvenirs.deseos;
create policy "dueno inserta deseos"
  on souvenirs.deseos for insert to authenticated
  with check ((select core.es_dueno('souvenirs')));
create policy "dueno actualiza deseos"
  on souvenirs.deseos for update to authenticated
  using ((select core.es_dueno('souvenirs')))
  with check ((select core.es_dueno('souvenirs')));
create policy "dueno elimina deseos"
  on souvenirs.deseos for delete to authenticated
  using ((select core.es_dueno('souvenirs')));

drop policy "dueno gestiona compras" on souvenirs.compras;
create policy "dueno inserta compras"
  on souvenirs.compras for insert to authenticated
  with check ((select core.es_dueno('souvenirs')));
create policy "dueno actualiza compras"
  on souvenirs.compras for update to authenticated
  using ((select core.es_dueno('souvenirs')))
  with check ((select core.es_dueno('souvenirs')));
create policy "dueno elimina compras"
  on souvenirs.compras for delete to authenticated
  using ((select core.es_dueno('souvenirs')));

drop policy "dueno gestiona logros" on souvenirs.logros;
create policy "dueno inserta logros"
  on souvenirs.logros for insert to authenticated
  with check ((select core.es_dueno('souvenirs')));
create policy "dueno actualiza logros"
  on souvenirs.logros for update to authenticated
  using ((select core.es_dueno('souvenirs')))
  with check ((select core.es_dueno('souvenirs')));
create policy "dueno elimina logros"
  on souvenirs.logros for delete to authenticated
  using ((select core.es_dueno('souvenirs')));
