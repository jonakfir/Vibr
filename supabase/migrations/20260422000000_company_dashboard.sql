-- Post-launch company dashboard schema.
-- Multi-tenant: every row carries company_id. RLS enforces membership.

-- ───────────────────────── companies ─────────────────────────
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  slug text not null unique,
  stripe_account_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists companies_owner_idx on public.companies(owner_user_id);

-- ─────────────────────── company_members ─────────────────────
create type public.company_role as enum ('owner','admin','manager','member','viewer');

create table if not exists public.company_members (
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.company_role not null default 'member',
  invited_by uuid references auth.users(id),
  invited_at timestamptz not null default now(),
  accepted_at timestamptz,
  primary key (company_id, user_id)
);
create index if not exists company_members_user_idx on public.company_members(user_id);

-- ────────────────────── company_integrations ────────────────
-- encrypted_keys should be written via a server-side KMS wrapper, never raw.
create table if not exists public.company_integrations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  provider text not null, -- 'stripe' | 'resend' | 'google' | 'supabase' | 'custom'
  status text not null default 'connected',
  encrypted_keys jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  last_sync_at timestamptz,
  created_at timestamptz not null default now(),
  unique (company_id, provider)
);
create index if not exists company_integrations_company_idx on public.company_integrations(company_id);

-- ──────────────────────── company_contacts ───────────────────
create table if not exists public.company_contacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  email text,
  company_name text,
  source text,        -- 'outreach' | 'manual' | 'import'
  stage text not null default 'lead', -- lead|qualified|proposal|won|lost
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists company_contacts_company_idx on public.company_contacts(company_id);
create index if not exists company_contacts_stage_idx on public.company_contacts(company_id, stage);

-- ────────────────────────── company_deals ────────────────────
create table if not exists public.company_deals (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  contact_id uuid references public.company_contacts(id) on delete set null,
  title text not null,
  amount_cents bigint not null default 0,
  currency text not null default 'USD',
  stage text not null default 'new', -- new|contact|demo|proposal|won|lost
  close_date date,
  created_at timestamptz not null default now()
);
create index if not exists company_deals_company_idx on public.company_deals(company_id);

-- ──────────────────────── company_expenses ───────────────────
create table if not exists public.company_expenses (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  amount_cents bigint not null,
  currency text not null default 'USD',
  category text,
  vendor text,
  occurred_on date not null default current_date,
  receipt_url text,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists company_expenses_company_idx on public.company_expenses(company_id);

-- ─────────────────────── company_revenue ─────────────────────
-- Populated by the Stripe webhook ingest.
create table if not exists public.company_revenue (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  source text not null default 'stripe',
  external_id text,
  amount_cents bigint not null,
  currency text not null default 'USD',
  kind text not null default 'payment', -- payment|refund|payout
  occurred_at timestamptz not null default now(),
  raw jsonb,
  unique (company_id, source, external_id)
);
create index if not exists company_revenue_company_idx on public.company_revenue(company_id, occurred_at desc);

-- ─────────────────────── company_content ─────────────────────
create table if not exists public.company_content (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  platform text not null, -- 'x' | 'linkedin' | 'email' | 'reddit' | 'instagram' | 'tiktok'
  status text not null default 'draft', -- draft|scheduled|published|failed
  title text,
  body text not null,
  media_urls jsonb not null default '[]'::jsonb,
  scheduled_for timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists company_content_company_idx on public.company_content(company_id, status);

-- ─────────────────────────── audit_log ───────────────────────
create table if not exists public.company_audit_log (
  id bigserial primary key,
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists company_audit_log_company_idx on public.company_audit_log(company_id, created_at desc);

-- ─────────────────────────── helpers ─────────────────────────
create or replace function public.is_company_member(cid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from public.company_members
    where company_id = cid and user_id = auth.uid()
  );
$$;

create or replace function public.has_company_role(cid uuid, allowed public.company_role[])
returns boolean language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from public.company_members
    where company_id = cid and user_id = auth.uid() and role = any(allowed)
  );
$$;

-- ────────────────────────────── RLS ──────────────────────────
alter table public.companies            enable row level security;
alter table public.company_members      enable row level security;
alter table public.company_integrations enable row level security;
alter table public.company_contacts     enable row level security;
alter table public.company_deals        enable row level security;
alter table public.company_expenses     enable row level security;
alter table public.company_revenue      enable row level security;
alter table public.company_content      enable row level security;
alter table public.company_audit_log    enable row level security;

-- Owners can do anything; members can read; admins/managers can write business data.
create policy "companies: members read" on public.companies
  for select using (public.is_company_member(id));
create policy "companies: owner write" on public.companies
  for all using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());

create policy "members: self + company read" on public.company_members
  for select using (user_id = auth.uid() or public.is_company_member(company_id));
create policy "members: owner/admin manage" on public.company_members
  for all using (public.has_company_role(company_id, array['owner','admin']::public.company_role[]))
  with check (public.has_company_role(company_id, array['owner','admin']::public.company_role[]));

-- Generic policies for the remaining tables: member can read, manager+ can write.
do $$
declare t text;
begin
  foreach t in array array[
    'company_integrations','company_contacts','company_deals',
    'company_expenses','company_revenue','company_content','company_audit_log'
  ]
  loop
    execute format($p$
      create policy "%1$s: member read" on public.%1$I
        for select using (public.is_company_member(company_id));
      create policy "%1$s: manager write" on public.%1$I
        for all using (public.has_company_role(company_id,
          array['owner','admin','manager']::public.company_role[]))
        with check (public.has_company_role(company_id,
          array['owner','admin','manager']::public.company_role[]));
    $p$, t);
  end loop;
end $$;

-- ─────────────────── owner auto-membership trigger ───────────
create or replace function public.companies_attach_owner()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.company_members (company_id, user_id, role, accepted_at)
  values (new.id, new.owner_user_id, 'owner', now())
  on conflict (company_id, user_id) do nothing;
  return new;
end $$;

drop trigger if exists companies_attach_owner on public.companies;
create trigger companies_attach_owner
  after insert on public.companies
  for each row execute function public.companies_attach_owner();

-- ─────────────────── lookup_user_by_email RPC ───────────────
-- Used by the invite flow to convert an email into an auth.users.id.
-- Returns null when the user doesn't exist (caller then logs a pending
-- invite and the accept-invite flow claims it).
create or replace function public.lookup_user_by_email(p_email text)
returns uuid
language sql stable security definer set search_path = public, auth as $$
  select id from auth.users where email = lower(p_email) limit 1;
$$;

grant execute on function public.lookup_user_by_email(text) to authenticated;
