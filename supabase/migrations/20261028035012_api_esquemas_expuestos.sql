alter role authenticator
  set pgrst.db_schemas = 'public,graphql_public,core,souvenirs';

notify pgrst, 'reload config';
notify pgrst, 'reload schema';
