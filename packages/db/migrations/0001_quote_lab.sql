begin;

create extension if not exists pgcrypto;

-- Minimal tenancy prerequisites for QL-DB-01. profiles are keyed to Supabase auth users.
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table organization_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  profile_id uuid not null references auth.users(id),
  role text not null check (role in ('rep', 'manager', 'admin')),
  manager_membership_id uuid references organization_memberships(id),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  unique (organization_id, profile_id),
  unique (id, organization_id)
);

create table vendors (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  owner_membership_id uuid not null references organization_memberships(id),
  display_name text not null,
  category text,
  contact_name text,
  email text,
  phone text,
  fictional boolean not null default false,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1 check (version > 0),
  unique (id, organization_id)
);

create table practice_scenarios (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  content_version_id uuid,
  title text not null,
  brief text not null,
  vendor_json jsonb not null,
  expected_catalog_version text not null,
  expected_input_json jsonb not null,
  expected_calculation_hash text check (expected_calculation_hash is null or expected_calculation_hash ~ '^[0-9a-f]{64}$'),
  difficulty text not null default 'standard',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1 check (version > 0),
  unique (id, organization_id)
);

create table quotes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  rep_membership_id uuid not null references organization_memberships(id),
  vendor_id uuid references vendors(id),
  practice_scenario_id uuid references practice_scenarios(id),
  mode text not null check (mode in ('live', 'practice')),
  status text not null default 'draft' check (status in ('draft', 'submitted', 'approved', 'rejected')),
  catalog_version text not null,
  idempotency_key text not null check (length(idempotency_key) between 1 and 128),
  notes text,
  currency text not null default 'USD' check (currency = 'USD'),
  setup_total_cents bigint not null check (setup_total_cents >= 0),
  monthly_total_cents bigint not null check (monthly_total_cents >= 0),
  commissionable_mrr_cents bigint not null check (commissionable_mrr_cents >= 0),
  upfront_commission_cents bigint not null check (upfront_commission_cents >= 0),
  monthly_residual_cents bigint not null check (monthly_residual_cents >= 0),
  year_one_earnings_cents bigint not null check (year_one_earnings_cents >= 0),
  calculation_hash text not null check (calculation_hash ~ '^[0-9a-f]{64}$'),
  submitted_at timestamptz,
  approved_at timestamptz,
  approved_by uuid references organization_memberships(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1 check (version > 0),
  unique (rep_membership_id, idempotency_key),
  check ((mode = 'practice' and practice_scenario_id is not null and vendor_id is null)
      or (mode = 'live' and vendor_id is not null and practice_scenario_id is null)),
  foreign key (rep_membership_id, organization_id) references organization_memberships(id, organization_id),
  foreign key (vendor_id, organization_id) references vendors(id, organization_id),
  foreign key (practice_scenario_id, organization_id) references practice_scenarios(id, organization_id)
);

create table quote_lines (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references quotes(id) on delete cascade,
  product_code text not null,
  product_name text not null,
  line_kind text not null check (line_kind in ('core', 'enhancement', 'ad_spend')),
  classification text not null check (classification in ('core', 'software', 'service', 'ads', 'pass_through')),
  quantity integer not null default 1 check (quantity > 0),
  list_setup_cents bigint not null check (list_setup_cents >= 0),
  list_monthly_cents bigint not null check (list_monthly_cents >= 0),
  tier_discount_bps integer not null check (tier_discount_bps between 0 and 10000),
  bundle_discount_bps integer not null check (bundle_discount_bps between 0 and 10000),
  applied_discount_bps integer not null check (applied_discount_bps between 0 and 10000),
  final_setup_cents bigint not null check (final_setup_cents >= 0),
  final_monthly_cents bigint not null check (final_monthly_cents >= 0),
  commissionable_monthly_cents bigint not null check (commissionable_monthly_cents >= 0),
  reason_code text not null,
  explanation text not null,
  sort_order integer not null check (sort_order >= 0),
  created_at timestamptz not null default now(),
  unique (quote_id, sort_order)
);

create table quote_calculation_snapshots (
  quote_id uuid primary key references quotes(id) on delete restrict,
  engine_version text not null,
  catalog_version text not null,
  canonical_input_json jsonb not null,
  canonical_output_json jsonb not null,
  source_checksum text not null check (source_checksum ~ '^[0-9a-f]{64}$'),
  calculation_hash text not null check (calculation_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now()
);

create index quotes_org_rep_idx on quotes (organization_id, rep_membership_id);
create index memberships_manager_idx on organization_memberships (manager_membership_id) where status = 'active';
create index quote_lines_quote_idx on quote_lines (quote_id);

create function is_quote_reader(target_rep uuid, target_org uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from organization_memberships me
    join organization_memberships owner on owner.id = target_rep
    where me.profile_id = auth.uid() and me.status = 'active'
      and me.organization_id = target_org and owner.organization_id = target_org
      and (me.id = owner.id or owner.manager_membership_id = me.id or me.role = 'admin')
  );
$$;

create function is_active_org_member(target_org uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from organization_memberships m
    where m.organization_id = target_org and m.profile_id = auth.uid() and m.status = 'active'
  );
$$;

revoke all on function is_quote_reader(uuid, uuid) from public;
grant execute on function is_quote_reader(uuid, uuid) to authenticated;
revoke all on function is_active_org_member(uuid) from public;
grant execute on function is_active_org_member(uuid) to authenticated;

alter table organizations enable row level security;
alter table organization_memberships enable row level security;
alter table vendors enable row level security;
alter table practice_scenarios enable row level security;
alter table quotes enable row level security;
alter table quote_lines enable row level security;
alter table quote_calculation_snapshots enable row level security;

create policy organizations_read_member on organizations for select to authenticated using (
  is_active_org_member(id)
);
create policy memberships_read_org on organization_memberships for select to authenticated using (
  is_active_org_member(organization_id)
);

create policy vendors_read on vendors for select to authenticated using (
  is_quote_reader(owner_membership_id, organization_id)
);
create policy vendors_write_own on vendors for all to authenticated
  using (exists (select 1 from organization_memberships m where m.id = owner_membership_id and m.profile_id = auth.uid() and m.status = 'active'))
  with check (exists (select 1 from organization_memberships m where m.id = owner_membership_id and m.profile_id = auth.uid() and m.status = 'active' and m.organization_id = vendors.organization_id));

create policy scenarios_read_org on practice_scenarios for select to authenticated using (
  exists (select 1 from organization_memberships m where m.organization_id = practice_scenarios.organization_id and m.profile_id = auth.uid() and m.status = 'active')
);

create policy quotes_read on quotes for select to authenticated using (
  is_quote_reader(rep_membership_id, organization_id)
);
create policy quotes_insert_own on quotes for insert to authenticated with check (
  exists (select 1 from organization_memberships m where m.id = rep_membership_id and m.organization_id = quotes.organization_id and m.profile_id = auth.uid() and m.status = 'active')
);
create policy quotes_update on quotes for update to authenticated
  using (is_quote_reader(rep_membership_id, organization_id))
  with check (is_quote_reader(rep_membership_id, organization_id));

create policy quote_lines_read on quote_lines for select to authenticated using (
  exists (select 1 from quotes q where q.id = quote_lines.quote_id and is_quote_reader(q.rep_membership_id, q.organization_id))
);
create policy quote_lines_insert_own on quote_lines for insert to authenticated with check (
  exists (select 1 from quotes q join organization_memberships m on m.id = q.rep_membership_id
          where q.id = quote_lines.quote_id and m.profile_id = auth.uid() and m.status = 'active')
);
create policy snapshots_read on quote_calculation_snapshots for select to authenticated using (
  exists (select 1 from quotes q where q.id = quote_calculation_snapshots.quote_id and is_quote_reader(q.rep_membership_id, q.organization_id))
);
create policy snapshots_insert_own on quote_calculation_snapshots for insert to authenticated with check (
  exists (select 1 from quotes q join organization_memberships m on m.id = q.rep_membership_id
          where q.id = quote_calculation_snapshots.quote_id and m.profile_id = auth.uid() and m.status = 'active')
);

create function reject_snapshot_mutation() returns trigger language plpgsql as $$
begin raise exception 'quote calculation snapshots are immutable' using errcode = '55000'; end;
$$;
create trigger quote_snapshots_immutable before update or delete on quote_calculation_snapshots
for each row execute function reject_snapshot_mutation();

create function enforce_quote_mode_vendor() returns trigger language plpgsql as $$
begin
  if new.mode = 'live' and not exists (
    select 1 from vendors v where v.id = new.vendor_id
      and v.organization_id = new.organization_id and not v.fictional
  ) then
    raise exception 'live quotes require a non-fictional vendor in the same organization'
      using errcode = '23514';
  end if;
  return new;
end;
$$;
create trigger quotes_mode_vendor_check before insert or update of vendor_id, mode, organization_id on quotes
for each row execute function enforce_quote_mode_vendor();

commit;
