-- Which Mettle migrations are live on this project?
--
-- Paste the whole thing into the Supabase SQL editor and run it. Each row says
-- whether a distinctive object from that migration exists. Run anything listed
-- as MISSING, in order, from supabase/migrations/.
--
-- Safe to run any time: it only reads the catalog and changes nothing.
--
-- Note on 0002: it creates no tables at all — only policies, a function and a
-- trigger — so it has to be probed by policy name. Probing it for a table
-- reports a false MISSING on a project that is perfectly up to date.

with probe(step, file, kind, schema_name, obj) as (
  values
    ('0001', '0001_init.sql',          'table',  'public',  'profiles'),
    ('0002', '0002_sync.sql',          'policy', 'public',  'profiles_select_own'),
    ('0003', '0003_social.sql',        'table',  'public',  'shared_profiles'),
    ('0004', '0004_storage.sql',       'policy', 'storage', 'avatar_insert'),
    ('0005', '0005_physique.sql',      'table',  'public',  'physique_posts'),
    ('0006', '0006_notifications.sql', 'func',   'public',  'physique_notifications'),
    ('0007', '0007_fixes.sql',         'func',   'public',  'pending_request_profiles'),
    ('0008', '0008_security.sql',      'func',   'public',  'search_profiles')
)
select
  p.step,
  p.file,
  case
    when p.kind = 'table' and exists (
      select 1 from information_schema.tables t
      where t.table_schema = p.schema_name and t.table_name = p.obj
    ) then 'applied'
    when p.kind = 'func' and exists (
      select 1 from pg_proc f
      join pg_namespace n on n.oid = f.pronamespace
      where n.nspname = p.schema_name and f.proname = p.obj
    ) then 'applied'
    when p.kind = 'policy' and exists (
      select 1 from pg_policies pol
      where pol.schemaname = p.schema_name and pol.policyname = p.obj
    ) then 'applied'
    else '>>> MISSING - run this file'
  end as status
from probe p
order by p.step;
