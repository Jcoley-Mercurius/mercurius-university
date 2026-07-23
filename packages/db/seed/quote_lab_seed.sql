begin;

create temporary table mercurius_seed_config on commit drop as
select :'seed_rep_user_id'::uuid as rep_user_id;

do $$
begin
  if not exists (
    select 1 from auth.users u
    join mercurius_seed_config c on c.rep_user_id = u.id
  ) then
    raise exception 'SEED_REP_USER_ID does not identify an existing Supabase Auth user';
  end if;
end;
$$;

insert into organizations (id, name)
select '6d455243-5552-4955-9300-000000000001'::uuid, 'Mercurius Solutions'
where not exists (select 1 from organizations where name = 'Mercurius Solutions');

insert into organization_memberships (
  id, organization_id, profile_id, role, status
)
select
  '6d455243-5552-4955-9300-000000000002'::uuid,
  organization.id,
  config.rep_user_id,
  'rep',
  'active'
from (select id from organizations where name = 'Mercurius Solutions' order by created_at limit 1) organization
cross join mercurius_seed_config config
on conflict (organization_id, profile_id) do update
set role = 'rep', status = 'active';

insert into vendors (
  id, organization_id, owner_membership_id, display_name, category,
  contact_name, email, phone, fictional, metadata_json
)
select seed.id, membership.organization_id, membership.id, seed.display_name,
  seed.category, seed.contact_name, seed.email, seed.phone, true,
  jsonb_build_object('seeded', true)
from (
  values
    ('6d455243-5552-4955-a300-000000000001'::uuid, 'Northstar Dental Studio', 'Dental', 'Dr. Avery Chen', 'avery@example.invalid', '555-0101'),
    ('6d455243-5552-4955-a300-000000000002'::uuid, 'Juniper Wellness Collective', 'Wellness', 'Morgan Reyes', 'morgan@example.invalid', '555-0102'),
    ('6d455243-5552-4955-a300-000000000003'::uuid, 'Beacon Home Services', 'Home Services', 'Taylor Brooks', 'taylor@example.invalid', '555-0103')
) seed(id, display_name, category, contact_name, email, phone)
cross join (
  select m.id, m.organization_id
  from organization_memberships m
  join mercurius_seed_config c on c.rep_user_id = m.profile_id
  join organizations o on o.id = m.organization_id
  where o.name = 'Mercurius Solutions'
  order by m.created_at
  limit 1
) membership
on conflict (id) do update set
  organization_id = excluded.organization_id,
  owner_membership_id = excluded.owner_membership_id,
  display_name = excluded.display_name,
  category = excluded.category,
  contact_name = excluded.contact_name,
  email = excluded.email,
  phone = excluded.phone,
  fictional = true,
  metadata_json = excluded.metadata_json,
  updated_at = now(),
  version = vendors.version + 1;

insert into practice_scenarios (
  id, organization_id, title, brief, vendor_json, expected_catalog_version,
  expected_input_json, expected_calculation_hash, difficulty, active
)
select seed.id, organization.id, seed.title, seed.brief, seed.vendor_json,
  '2026-06-30', seed.expected_input_json, null, seed.difficulty, true
from (
  values
    (
      '6d455243-5552-4955-b300-000000000001'::uuid,
      'Dental practice growth plan',
      'Recommend a core package and enhancements for a growing dental practice that needs stronger lead follow-up.',
      '{"displayName":"Northstar Dental Studio","category":"Dental","fictional":true}'::jsonb,
      '{"coreCode":"SPARK","enhancementCodes":["AI_MARKETING_COPILOT"],"adSpendCents":0}'::jsonb,
      'introductory'
    ),
    (
      '6d455243-5552-4955-b300-000000000002'::uuid,
      'Wellness retention challenge',
      'Build a quote for a wellness collective focused on retention and consistent social content.',
      '{"displayName":"Juniper Wellness Collective","category":"Wellness","fictional":true}'::jsonb,
      '{"coreCode":"INSIGHT","enhancementCodes":["RETENTION_ENGINE","SOCIAL_COMMAND"],"adSpendCents":0}'::jsonb,
      'standard'
    )
) seed(id, title, brief, vendor_json, expected_input_json, difficulty)
cross join (
  select id from organizations where name = 'Mercurius Solutions' order by created_at limit 1
) organization
on conflict (id) do update set
  organization_id = excluded.organization_id,
  title = excluded.title,
  brief = excluded.brief,
  vendor_json = excluded.vendor_json,
  expected_catalog_version = excluded.expected_catalog_version,
  expected_input_json = excluded.expected_input_json,
  difficulty = excluded.difficulty,
  active = true,
  updated_at = now(),
  version = practice_scenarios.version + 1;

select 'organizations' as entity, count(*) as seeded_count
from organizations where name = 'Mercurius Solutions'
union all
select 'rep memberships', count(*)
from organization_memberships m
join organizations o on o.id = m.organization_id
join mercurius_seed_config c on c.rep_user_id = m.profile_id
where o.name = 'Mercurius Solutions'
union all
select 'fictional vendors', count(*) from vendors
where id in (
  '6d455243-5552-4955-a300-000000000001'::uuid,
  '6d455243-5552-4955-a300-000000000002'::uuid,
  '6d455243-5552-4955-a300-000000000003'::uuid
)
union all
select 'practice scenarios', count(*) from practice_scenarios
where id in (
  '6d455243-5552-4955-b300-000000000001'::uuid,
  '6d455243-5552-4955-b300-000000000002'::uuid
);

commit;
