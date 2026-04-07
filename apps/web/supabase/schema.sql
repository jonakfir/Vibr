-- Enable required extensions
create extension if not exists "pgcrypto";

-- ============================================
-- PROFILES
-- ============================================
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  full_name text,
  skills text[],
  experience_level text,
  interests text[],
  resume_url text,
  linkedin_url text,
  subscription_status text default 'free' not null,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can delete their own profile"
  on public.profiles for delete
  using (auth.uid() = id);

-- ============================================
-- SESSIONS
-- ============================================
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  step integer default 1 not null,
  profile_data jsonb,
  ideas jsonb,
  selected_idea jsonb,
  prompt text,
  marketers jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.sessions enable row level security;

create policy "Users can view their own sessions"
  on public.sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own sessions"
  on public.sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own sessions"
  on public.sessions for update
  using (auth.uid() = user_id);

create policy "Users can delete their own sessions"
  on public.sessions for delete
  using (auth.uid() = user_id);

-- ============================================
-- SAVED PROMPTS
-- ============================================
create table public.saved_prompts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  idea_name text,
  prompt text,
  created_at timestamptz default now() not null
);

alter table public.saved_prompts enable row level security;

create policy "Users can view their own saved prompts"
  on public.saved_prompts for select
  using (auth.uid() = user_id);

create policy "Users can insert their own saved prompts"
  on public.saved_prompts for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own saved prompts"
  on public.saved_prompts for update
  using (auth.uid() = user_id);

create policy "Users can delete their own saved prompts"
  on public.saved_prompts for delete
  using (auth.uid() = user_id);

-- ============================================
-- SAVED NAMES
-- ============================================
create table public.saved_names (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  session_id uuid references public.sessions(id) on delete set null,
  names jsonb,
  selected_name text,
  domain text,
  created_at timestamptz default now() not null
);

alter table public.saved_names enable row level security;

create policy "Users can view their own saved names"
  on public.saved_names for select
  using (auth.uid() = user_id);

create policy "Users can insert their own saved names"
  on public.saved_names for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own saved names"
  on public.saved_names for update
  using (auth.uid() = user_id);

create policy "Users can delete their own saved names"
  on public.saved_names for delete
  using (auth.uid() = user_id);

-- ============================================
-- OUTREACH LOG
-- ============================================
create table public.outreach_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  marketer_name text,
  marketer_email text,
  email_subject text,
  email_body text,
  sent_at timestamptz,
  status text default 'pending' not null
);

alter table public.outreach_log enable row level security;

create policy "Users can view their own outreach logs"
  on public.outreach_log for select
  using (auth.uid() = user_id);

create policy "Users can insert their own outreach logs"
  on public.outreach_log for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own outreach logs"
  on public.outreach_log for update
  using (auth.uid() = user_id);

create policy "Users can delete their own outreach logs"
  on public.outreach_log for delete
  using (auth.uid() = user_id);

-- ============================================
-- TRIGGERS: auto-update updated_at
-- ============================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger set_sessions_updated_at
  before update on public.sessions
  for each row execute function public.handle_updated_at();

-- ============================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================
-- USAGE TRACKING
-- ============================================
create table public.usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  action_type text not null,
  created_at timestamptz default now() not null
);

create index idx_usage_user_action on public.usage(user_id, action_type);

alter table public.usage enable row level security;

create policy "Users can view their own usage"
  on public.usage for select
  using (auth.uid() = user_id);

create policy "Users can insert their own usage"
  on public.usage for insert
  with check (auth.uid() = user_id);
