create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    user_id,
    username,
    email
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (user_id) do update
  set
    username = excluded.username,
    email = excluded.email,
    updated_at = timezone('utc', now());

  return new;
end;
$$;

create or replace function public.admin_dashboard_snapshot()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  today_date date := current_date;
  total_users_count integer := 0;
  active_users_count integer := 0;
  completed_trainings_count integer := 0;
  pending_issues_count integer := 0;
  top_players_json jsonb := '[]'::jsonb;
begin
  if not (select private.is_admin(auth.uid())) then
    raise exception 'Acces interzis. Doar admin.';
  end if;

  select count(*) into total_users_count from public.profiles;

  select count(distinct user_id)
  into active_users_count
  from public.training_completions
  where date_key = today_date;

  select count(*)
  into completed_trainings_count
  from public.training_completions
  where date_key = today_date
    and task_id = 'session-bonus';

  select count(*)
  into pending_issues_count
  from public.profiles
  where is_suspended = true;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'username', username,
        'xp', week_xp
      )
      order by week_xp desc
    ),
    '[]'::jsonb
  )
  into top_players_json
  from (
    select
      p.username,
      coalesce(sum(t.xp), 0) as week_xp
    from public.profiles p
    left join public.training_completions t
      on t.user_id = p.user_id
      and t.date_key >= today_date - 6
    group by p.user_id, p.username
    order by week_xp desc
    limit 5
  ) ranked;

  return jsonb_build_object(
    'totalUsers', total_users_count,
    'activeUsersToday', active_users_count,
    'completedTrainingsToday', completed_trainings_count,
    'pendingIssues', pending_issues_count,
    'topPlayersWeek', top_players_json
  );
end;
$$;

drop function if exists public.admin_list_users(text);

create function public.admin_list_users(search_text text default null)
returns table (
  user_id uuid,
  username text,
  email text,
  role text,
  is_suspended boolean,
  total_xp integer,
  streak_days integer,
  completed_challenges integer
)
language sql
security definer
set search_path = public
stable
as $$
  select
    p.user_id,
    p.username,
    p.email,
    p.role,
    p.is_suspended,
    p.total_xp,
    public.current_training_streak(p.user_id, current_date) as streak_days,
    (
      select count(*)
      from public.challenge_completions cc
      where cc.user_id = p.user_id
    ) as completed_challenges
  from public.profiles p
  where (select private.is_admin(auth.uid()))
    and (
      coalesce(search_text, '') = ''
      or p.username ilike '%' || search_text || '%'
      or coalesce(p.email, '') ilike '%' || search_text || '%'
    )
  order by p.total_xp desc, p.username asc;
$$;

update auth.users
set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) - 'avatar_id'
where coalesce(raw_user_meta_data, '{}'::jsonb) ? 'avatar_id';

alter table public.profiles
drop column if exists avatar_id;
