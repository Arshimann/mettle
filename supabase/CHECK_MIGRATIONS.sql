-- Which Mettle migrations are live on this project?
--
-- Paste the whole thing into the Supabase SQL editor and run it. Each row says
-- whether a distinctive object from that migration exists. Run the files listed
-- as MISSING, in order, from supabase/migrations/.
--
-- Safe to run any time: it only reads the catalog and changes nothing.

with probe(step, file, kind, obj) as (
  values
    ('0001', '0001_init.sql',          'table',    'profiles'),
    ('0002', '0002_sync.sql',          'table',    'app_state'),
    ('0003', '0003_social.sql',        'table',    'shared_profiles'),
    ('0004', '0004_storage.sql',       'policy',   'avatar_insert'),
    ('0005', '0005_physique.sql',      'table',    'physique_posts'),
    ('0006', '0006_notifications.sql', 'function', 'physique_notifications'),
    ('0007', '0007_fixes.sql',         'function', 'pending_request_profiles'),
    ('0008', '0008_security.sql',      'function', 'search_profiles')
)
select
  p.step,
  p.file,
  case
    when p.kind = 'table' and exists (
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = p.obj
    ) then 'applied'
    when p.kind = 'function' and exists (
      select 1 from pg_proc f
      join pg_namespace n on n.oid = f.pronamespace
      where n.nspname = 'public' and f.proname = p.obj
    ) then 'applied'
    when p.kind = 'policy' and exists (
      select 1 from pg_policies
      where schemaname = 'storage' and policyname = p.obj
    ) then 'applied'
    else '>>> MISSING — run this file'
  end as status
from probe p
order by p.step;
