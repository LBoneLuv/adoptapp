-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- PROFILES TABLE (for regular users)
-- ============================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  email text not null,
  phone text,
  avatar_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

create policy "profiles_delete_own"
  on public.profiles for delete
  using (auth.uid() = id);

-- ============================================
-- SHELTERS TABLE (for protectoras)
-- ============================================
create table if not exists public.shelters (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  phone text not null,
  location text not null,
  description text,
  cover_image_url text,
  profile_image_url text,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.shelters enable row level security;

create policy "shelters_select_all"
  on public.shelters for select
  using (status = 'approved' or auth.uid() = id);

create policy "shelters_insert_own"
  on public.shelters for insert
  with check (auth.uid() = id);

create policy "shelters_update_own"
  on public.shelters for update
  using (auth.uid() = id);

create policy "shelters_delete_own"
  on public.shelters for delete
  using (auth.uid() = id);

-- ============================================
-- ANIMALS TABLE
-- ============================================
create table if not exists public.animals (
  id uuid primary key default uuid_generate_v4(),
  shelter_id uuid not null references public.shelters(id) on delete cascade,
  name text not null,
  age text not null,
  breed text not null,
  location text not null,
  description text,
  status text default 'available' check (status in ('available', 'adopted', 'pending')),
  vaccinated boolean default false,
  microchipped boolean default false,
  sterilized boolean default false,
  images text[] default '{}',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.animals enable row level security;

create policy "animals_select_all"
  on public.animals for select
  using (true);

create policy "animals_insert_shelter"
  on public.animals for insert
  with check (auth.uid() = shelter_id);

create policy "animals_update_shelter"
  on public.animals for update
  using (auth.uid() = shelter_id);

create policy "animals_delete_shelter"
  on public.animals for delete
  using (auth.uid() = shelter_id);

-- ============================================
-- POSTS TABLE (for community feed)
-- ============================================
create table if not exists public.posts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  image_url text,
  votes integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.posts enable row level security;

create policy "posts_select_all"
  on public.posts for select
  using (true);

create policy "posts_insert_own"
  on public.posts for insert
  with check (auth.uid() = user_id);

create policy "posts_update_own"
  on public.posts for update
  using (auth.uid() = user_id);

create policy "posts_delete_own"
  on public.posts for delete
  using (auth.uid() = user_id);

-- ============================================
-- COMMENTS TABLE
-- ============================================
create table if not exists public.comments (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamp with time zone default now()
);

alter table public.comments enable row level security;

create policy "comments_select_all"
  on public.comments for select
  using (true);

create policy "comments_insert_own"
  on public.comments for insert
  with check (auth.uid() = user_id);

create policy "comments_delete_own"
  on public.comments for delete
  using (auth.uid() = user_id);

-- ============================================
-- VOTES TABLE (for post voting)
-- ============================================
create table if not exists public.votes (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  vote_type integer not null check (vote_type in (-1, 1)),
  created_at timestamp with time zone default now(),
  unique(post_id, user_id)
);

alter table public.votes enable row level security;

create policy "votes_select_all"
  on public.votes for select
  using (true);

create policy "votes_insert_own"
  on public.votes for insert
  with check (auth.uid() = user_id);

create policy "votes_delete_own"
  on public.votes for delete
  using (auth.uid() = user_id);

-- ============================================
-- INCIDENTS TABLE (for avisos/alerts)
-- ============================================
create table if not exists public.incidents (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null,
  location text not null,
  latitude decimal(10, 8),
  longitude decimal(11, 8),
  incident_type text not null check (incident_type in ('lost', 'found')),
  image_url text,
  status text default 'active' check (status in ('active', 'resolved')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.incidents enable row level security;

create policy "incidents_select_all"
  on public.incidents for select
  using (true);

create policy "incidents_insert_own"
  on public.incidents for insert
  with check (auth.uid() = user_id);

create policy "incidents_update_own"
  on public.incidents for update
  using (auth.uid() = user_id);

create policy "incidents_delete_own"
  on public.incidents for delete
  using (auth.uid() = user_id);

-- ============================================
-- FAVORITES TABLE (for saved animals)
-- ============================================
create table if not exists public.favorites (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  animal_id uuid not null references public.animals(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique(user_id, animal_id)
);

alter table public.favorites enable row level security;

create policy "favorites_select_own"
  on public.favorites for select
  using (auth.uid() = user_id);

create policy "favorites_insert_own"
  on public.favorites for insert
  with check (auth.uid() = user_id);

create policy "favorites_delete_own"
  on public.favorites for delete
  using (auth.uid() = user_id);
