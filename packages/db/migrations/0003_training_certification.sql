begin;

create table training_certification_attempts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  membership_id uuid not null references organization_memberships(id) on delete cascade,
  practice_scenario_id uuid not null references practice_scenarios(id),
  score integer not null check (score between 0 and 100),
  passing_score integer not null default 80 check (passing_score between 1 and 100),
  passed boolean generated always as (score >= passing_score) stored,
  feedback_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  foreign key (membership_id, organization_id)
    references organization_memberships(id, organization_id),
  foreign key (practice_scenario_id, organization_id)
    references practice_scenarios(id, organization_id)
);

create index training_certification_attempts_rep_idx
  on training_certification_attempts (membership_id, score desc, created_at desc);

alter table training_certification_attempts enable row level security;

create policy certification_attempts_read_own
  on training_certification_attempts for select to authenticated
  using (exists (
    select 1 from organization_memberships membership
    where membership.id = training_certification_attempts.membership_id
      and membership.organization_id = training_certification_attempts.organization_id
      and membership.profile_id = auth.uid()
      and membership.status = 'active'
  ));

create policy certification_attempts_insert_own
  on training_certification_attempts for insert to authenticated
  with check (exists (
    select 1 from organization_memberships membership
    where membership.id = training_certification_attempts.membership_id
      and membership.organization_id = training_certification_attempts.organization_id
      and membership.profile_id = auth.uid()
      and membership.status = 'active'
  ));

commit;
