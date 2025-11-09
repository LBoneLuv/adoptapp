-- ============================================
-- TRIGGER: Auto-create profile on user signup
-- ============================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Check if this is a shelter or regular user based on metadata
  if new.raw_user_meta_data->>'user_type' = 'shelter' then
    insert into public.shelters (
      id,
      name,
      email,
      phone,
      location,
      description
    )
    values (
      new.id,
      coalesce(new.raw_user_meta_data->>'name', 'Nueva Protectora'),
      new.email,
      coalesce(new.raw_user_meta_data->>'phone', ''),
      coalesce(new.raw_user_meta_data->>'location', ''),
      coalesce(new.raw_user_meta_data->>'description', '')
    )
    on conflict (id) do nothing;
  else
    insert into public.profiles (
      id,
      display_name,
      email,
      phone
    )
    values (
      new.id,
      coalesce(new.raw_user_meta_data->>'display_name', 'Usuario'),
      new.email,
      coalesce(new.raw_user_meta_data->>'phone', '')
    )
    on conflict (id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ============================================
-- TRIGGER: Update votes count on posts
-- ============================================
create or replace function public.update_post_votes()
returns trigger
language plpgsql
as $$
begin
  if TG_OP = 'INSERT' then
    update public.posts
    set votes = votes + NEW.vote_type
    where id = NEW.post_id;
  elsif TG_OP = 'DELETE' then
    update public.posts
    set votes = votes - OLD.vote_type
    where id = OLD.post_id;
  elsif TG_OP = 'UPDATE' then
    update public.posts
    set votes = votes - OLD.vote_type + NEW.vote_type
    where id = NEW.post_id;
  end if;
  return NEW;
end;
$$;

drop trigger if exists on_vote_change on public.votes;

create trigger on_vote_change
  after insert or update or delete on public.votes
  for each row
  execute function public.update_post_votes();

-- ============================================
-- TRIGGER: Update updated_at timestamp
-- ============================================
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  NEW.updated_at = now();
  return NEW;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.handle_updated_at();

create trigger shelters_updated_at
  before update on public.shelters
  for each row
  execute function public.handle_updated_at();

create trigger animals_updated_at
  before update on public.animals
  for each row
  execute function public.handle_updated_at();

create trigger posts_updated_at
  before update on public.posts
  for each row
  execute function public.handle_updated_at();

create trigger incidents_updated_at
  before update on public.incidents
  for each row
  execute function public.handle_updated_at();
