-- LifeOS Database Schema
-- Drop existing policies and tables if they exist to avoid conflicts

-- Drop policies first
do $$ begin
  -- profiles
  drop policy if exists "profiles_select_own" on public.profiles;
  drop policy if exists "profiles_insert_own" on public.profiles;
  drop policy if exists "profiles_update_own" on public.profiles;
  drop policy if exists "profiles_delete_own" on public.profiles;
exception when undefined_table then null;
end $$;

do $$ begin
  drop policy if exists "goals_select_own" on public.goals;
  drop policy if exists "goals_insert_own" on public.goals;
  drop policy if exists "goals_update_own" on public.goals;
  drop policy if exists "goals_delete_own" on public.goals;
exception when undefined_table then null;
end $$;

do $$ begin
  drop policy if exists "tasks_select_own" on public.tasks;
  drop policy if exists "tasks_insert_own" on public.tasks;
  drop policy if exists "tasks_update_own" on public.tasks;
  drop policy if exists "tasks_delete_own" on public.tasks;
exception when undefined_table then null;
end $$;

do $$ begin
  drop policy if exists "habits_select_own" on public.habits;
  drop policy if exists "habits_insert_own" on public.habits;
  drop policy if exists "habits_update_own" on public.habits;
  drop policy if exists "habits_delete_own" on public.habits;
exception when undefined_table then null;
end $$;

do $$ begin
  drop policy if exists "habit_logs_select_own" on public.habit_logs;
  drop policy if exists "habit_logs_insert_own" on public.habit_logs;
  drop policy if exists "habit_logs_update_own" on public.habit_logs;
  drop policy if exists "habit_logs_delete_own" on public.habit_logs;
exception when undefined_table then null;
end $$;

do $$ begin
  drop policy if exists "notes_select_own" on public.notes;
  drop policy if exists "notes_insert_own" on public.notes;
  drop policy if exists "notes_update_own" on public.notes;
  drop policy if exists "notes_delete_own" on public.notes;
exception when undefined_table then null;
end $$;

do $$ begin
  drop policy if exists "events_select_own" on public.events;
  drop policy if exists "events_insert_own" on public.events;
  drop policy if exists "events_update_own" on public.events;
  drop policy if exists "events_delete_own" on public.events;
exception when undefined_table then null;
end $$;

-- Drop tables (in dependency order)
drop table if exists public.habit_logs cascade;
drop table if exists public.tasks cascade;
drop table if exists public.habits cascade;
drop table if exists public.events cascade;
drop table if exists public.notes cascade;
drop table if exists public.goals cascade;
drop table if exists public.profiles cascade;

-- Profiles table
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  language text default 'en',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
create policy "profiles_delete_own" on public.profiles for delete using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Goals table
create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  deadline date,
  progress integer default 0 check (progress >= 0 and progress <= 100),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.goals enable row level security;
create policy "goals_select_own" on public.goals for select using (auth.uid() = user_id);
create policy "goals_insert_own" on public.goals for insert with check (auth.uid() = user_id);
create policy "goals_update_own" on public.goals for update using (auth.uid() = user_id);
create policy "goals_delete_own" on public.goals for delete using (auth.uid() = user_id);

-- Tasks table
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  priority text default 'medium' check (priority in ('low', 'medium', 'high')),
  status text default 'todo' check (status in ('todo', 'doing', 'done')),
  due_date date,
  tags text[] default '{}',
  goal_id uuid references public.goals(id) on delete set null,
  parent_id uuid references public.tasks(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.tasks enable row level security;
create policy "tasks_select_own" on public.tasks for select using (auth.uid() = user_id);
create policy "tasks_insert_own" on public.tasks for insert with check (auth.uid() = user_id);
create policy "tasks_update_own" on public.tasks for update using (auth.uid() = user_id);
create policy "tasks_delete_own" on public.tasks for delete using (auth.uid() = user_id);

-- Habits table
create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  frequency text default 'daily' check (frequency in ('daily', 'weekly')),
  goal_id uuid references public.goals(id) on delete set null,
  color text default '#F59E0B',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.habits enable row level security;
create policy "habits_select_own" on public.habits for select using (auth.uid() = user_id);
create policy "habits_insert_own" on public.habits for insert with check (auth.uid() = user_id);
create policy "habits_update_own" on public.habits for update using (auth.uid() = user_id);
create policy "habits_delete_own" on public.habits for delete using (auth.uid() = user_id);

-- Habit logs table
create table public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.habits(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  completed_at date not null default current_date,
  created_at timestamptz default now(),
  unique(habit_id, completed_at)
);
alter table public.habit_logs enable row level security;
create policy "habit_logs_select_own" on public.habit_logs for select using (auth.uid() = user_id);
create policy "habit_logs_insert_own" on public.habit_logs for insert with check (auth.uid() = user_id);
create policy "habit_logs_update_own" on public.habit_logs for update using (auth.uid() = user_id);
create policy "habit_logs_delete_own" on public.habit_logs for delete using (auth.uid() = user_id);

-- Notes table
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  content text default '',
  tags text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.notes enable row level security;
create policy "notes_select_own" on public.notes for select using (auth.uid() = user_id);
create policy "notes_insert_own" on public.notes for insert with check (auth.uid() = user_id);
create policy "notes_update_own" on public.notes for update using (auth.uid() = user_id);
create policy "notes_delete_own" on public.notes for delete using (auth.uid() = user_id);

-- Events table
create table public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  start_time timestamptz not null,
  end_time timestamptz,
  all_day boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.events enable row level security;
create policy "events_select_own" on public.events for select using (auth.uid() = user_id);
create policy "events_insert_own" on public.events for insert with check (auth.uid() = user_id);
create policy "events_update_own" on public.events for update using (auth.uid() = user_id);
create policy "events_delete_own" on public.events for delete using (auth.uid() = user_id);
