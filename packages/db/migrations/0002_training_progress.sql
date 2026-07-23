begin;

create table training_milestone_progress (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  membership_id uuid not null references organization_memberships(id) on delete cascade,
  milestone_key text not null check (milestone_key ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  status text not null check (status in ('in_progress', 'complete')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (membership_id, milestone_key),
  foreign key (membership_id, organization_id)
    references organization_memberships(id, organization_id),
  check ((status = 'complete' and completed_at is not null)
      or (status = 'in_progress' and completed_at is null))
);

create index training_progress_org_membership_idx
  on training_milestone_progress (organization_id, membership_id);

alter table training_milestone_progress enable row level security;

create policy training_progress_read_own
  on training_milestone_progress for select to authenticated
  using (exists (
    select 1 from organization_memberships membership
    where membership.id = training_milestone_progress.membership_id
      and membership.organization_id = training_milestone_progress.organization_id
      and membership.profile_id = auth.uid()
      and membership.status = 'active'
  ));

create policy training_progress_insert_own
  on training_milestone_progress for insert to authenticated
  with check (exists (
    select 1 from organization_memberships membership
    where membership.id = training_milestone_progress.membership_id
      and membership.organization_id = training_milestone_progress.organization_id
      and membership.profile_id = auth.uid()
      and membership.status = 'active'
  ));

create policy training_progress_update_own
  on training_milestone_progress for update to authenticated
  using (exists (
    select 1 from organization_memberships membership
    where membership.id = training_milestone_progress.membership_id
      and membership.profile_id = auth.uid()
      and membership.status = 'active'
  ))
  with check (exists (
    select 1 from organization_memberships membership
    where membership.id = training_milestone_progress.membership_id
      and membership.organization_id = training_milestone_progress.organization_id
      and membership.profile_id = auth.uid()
      and membership.status = 'active'
  ));

commit;
