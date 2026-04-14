alter table public.coach_app_settings
  add column if not exists session_bonus_xp integer not null default 60 check (session_bonus_xp >= 0),
  add column if not exists streak_bonus_3 integer not null default 45 check (streak_bonus_3 >= 0),
  add column if not exists streak_bonus_7 integer not null default 120 check (streak_bonus_7 >= 0),
  add column if not exists streak_bonus_14 integer not null default 260 check (streak_bonus_14 >= 0),
  add column if not exists streak_penalty_mode text not null default 'reset' check (streak_penalty_mode in ('reset', 'partial'));

drop function if exists public.admin_update_settings(integer, time, boolean, integer, integer, integer, integer, text, boolean);

create or replace function public.current_training_streak(user_id_input uuid, anchor_date date default current_date)
returns integer
language plpgsql
stable
as $$
declare
  streak_value integer := 0;
  effective_anchor date := anchor_date;
  penalty_mode text := 'reset';
  has_today_training boolean := false;
begin
  select streak_penalty_mode
  into penalty_mode
  from public.coach_app_settings
  where id = 1;

  has_today_training := exists (
    select 1
    from public.training_completions
    where user_id = user_id_input
      and date_key = anchor_date
      and task_id <> 'session-bonus'
      and task_id not like 'consistency-%'
  );

  if not has_today_training then
    if penalty_mode = 'partial' and exists (
      select 1
      from public.training_completions
      where user_id = user_id_input
        and date_key = anchor_date - 1
        and task_id <> 'session-bonus'
        and task_id not like 'consistency-%'
    ) then
      effective_anchor := anchor_date - 1;
    else
      return 0;
    end if;
  end if;

  with recursive streak(day_key, streak_length) as (
    select effective_anchor, 1
    union all
    select day_key - 1, streak_length + 1
    from streak
    where exists (
      select 1
      from public.training_completions
      where user_id = user_id_input
        and date_key = streak.day_key - 1
        and task_id <> 'session-bonus'
        and task_id not like 'consistency-%'
    )
  )
  select max(streak_length)
  into streak_value
  from streak;

  if not has_today_training and penalty_mode = 'partial' then
    return greatest(coalesce(streak_value, 0) - 1, 0);
  end if;

  return coalesce(streak_value, 0);
end;
$$;

create or replace function public.sync_profile_rewards(user_id_input uuid, anchor_date date default current_date)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_badges jsonb;
  current_milestones integer[];
  streak_value integer;
  drill_count integer;
  challenge_count integer;
  settings_row public.coach_app_settings%rowtype;
begin
  select unlocked_badges, consistency_reward_milestones
  into current_badges, current_milestones
  from public.profiles
  where user_id = user_id_input
  for update;

  select *
  into settings_row
  from public.coach_app_settings
  where id = 1;

  streak_value := public.current_training_streak(user_id_input, anchor_date);

  select count(*)
  into drill_count
  from public.training_completions
  where user_id = user_id_input
    and task_id <> 'session-bonus'
    and task_id not like 'consistency-%';

  select count(*)
  into challenge_count
  from public.challenge_completions
  where user_id = user_id_input;

  if streak_value >= 7 then
    current_badges := public.append_badge(
      current_badges,
      '{"id":"streak-keeper","label":"Pastratorul seriei","description":"Ai mentinut o serie de 7 zile.","rarity":"Epic","accent":"gold"}'::jsonb
    );
  end if;

  if drill_count >= 20 then
    current_badges := public.append_badge(
      current_badges,
      '{"id":"drill-machine","label":"Masina de antrenament","description":"Ai finalizat 20 de module de antrenament.","rarity":"Rar","accent":"blue"}'::jsonb
    );
  end if;

  if challenge_count >= 3 then
    current_badges := public.append_badge(
      current_badges,
      '{"id":"challenge-hunter","label":"Vanator de provocari","description":"Ai finalizat 3 provocari de fotbal.","rarity":"Rar","accent":"orange"}'::jsonb
    );
  end if;

  if streak_value >= 3 and not 3 = any(coalesce(current_milestones, '{}'::integer[])) then
    insert into public.training_completions (user_id, date_key, task_id, task_title, xp)
    values (user_id_input, anchor_date, 'consistency-3', 'Bonus pentru seria de 3 zile', coalesce(settings_row.streak_bonus_3, 45))
    on conflict (user_id, date_key, task_id) do nothing;

    if found then
      update public.profiles
      set
        total_xp = total_xp + coalesce(settings_row.streak_bonus_3, 45),
        consistency_reward_milestones = array_append(coalesce(current_milestones, '{}'::integer[]), 3)
      where user_id = user_id_input;

      select consistency_reward_milestones into current_milestones
      from public.profiles
      where user_id = user_id_input;
    end if;
  end if;

  if streak_value >= 7 and not 7 = any(coalesce(current_milestones, '{}'::integer[])) then
    insert into public.training_completions (user_id, date_key, task_id, task_title, xp)
    values (user_id_input, anchor_date, 'consistency-7', 'Bonus pentru seria de 7 zile', coalesce(settings_row.streak_bonus_7, 120))
    on conflict (user_id, date_key, task_id) do nothing;

    if found then
      update public.profiles
      set
        total_xp = total_xp + coalesce(settings_row.streak_bonus_7, 120),
        consistency_reward_milestones = array_append(coalesce(current_milestones, '{}'::integer[]), 7)
      where user_id = user_id_input;

      select consistency_reward_milestones into current_milestones
      from public.profiles
      where user_id = user_id_input;
    end if;
  end if;

  if streak_value >= 14 and not 14 = any(coalesce(current_milestones, '{}'::integer[])) then
    insert into public.training_completions (user_id, date_key, task_id, task_title, xp)
    values (user_id_input, anchor_date, 'consistency-14', 'Bonus pentru seria de 14 zile', coalesce(settings_row.streak_bonus_14, 260))
    on conflict (user_id, date_key, task_id) do nothing;

    if found then
      update public.profiles
      set
        total_xp = total_xp + coalesce(settings_row.streak_bonus_14, 260),
        consistency_reward_milestones = array_append(coalesce(current_milestones, '{}'::integer[]), 14)
      where user_id = user_id_input;
    end if;
  end if;

  update public.profiles
  set unlocked_badges = current_badges
  where user_id = user_id_input;
end;
$$;

create or replace function public.complete_training_task(
  task_id_input text,
  task_title_input text,
  xp_input integer,
  training_date_input date,
  session_task_ids_input text[]
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  session_task_count integer;
  settings_row public.coach_app_settings%rowtype;
  session_bonus_value integer := 60;
begin
  if current_user_id is null then
    raise exception 'You must be logged in to save training progress.';
  end if;

  if not (select private.is_active_player(current_user_id)) then
    raise exception 'Contul tau este suspendat.';
  end if;

  select *
  into settings_row
  from public.coach_app_settings
  where id = 1;

  session_bonus_value := coalesce(settings_row.session_bonus_xp, 60);

  insert into public.training_completions (user_id, date_key, task_id, task_title, xp)
  values (current_user_id, training_date_input, task_id_input, task_title_input, xp_input)
  on conflict (user_id, date_key, task_id) do nothing;

  if not found then
    raise exception 'That drill is already completed for today.';
  end if;

  update public.profiles
  set total_xp = total_xp + xp_input
  where user_id = current_user_id;

  if not exists (
    select 1
    from public.training_completions
    where user_id = current_user_id
      and date_key = training_date_input
      and task_id = 'session-bonus'
  ) then
    select count(distinct task_id)
    into session_task_count
    from public.training_completions
    where user_id = current_user_id
      and date_key = training_date_input
      and task_id = any(session_task_ids_input);

    if session_task_count = coalesce(array_length(session_task_ids_input, 1), 0) and session_task_count > 0 then
      insert into public.training_completions (user_id, date_key, task_id, task_title, xp)
      values (current_user_id, training_date_input, 'session-bonus', 'Bonus sesiune completă', session_bonus_value);

      update public.profiles
      set total_xp = total_xp + session_bonus_value
      where user_id = current_user_id;
    end if;
  end if;

  perform public.sync_profile_rewards(current_user_id, training_date_input);

  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.admin_update_settings(
  challenge_frequency integer,
  reset_clock time,
  auto_generator boolean,
  xp_mental_input integer,
  xp_physical_input integer,
  xp_technical_input integer,
  xp_challenge_input integer,
  session_bonus_xp_input integer default 60,
  streak_bonus_3_input integer default 45,
  streak_bonus_7_input integer default 120,
  streak_bonus_14_input integer default 260,
  streak_penalty_mode_input text default 'reset',
  announcement_text text default '',
  maintenance_enabled boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  perform private.assert_is_admin(auth.uid());

  if coalesce(streak_penalty_mode_input, 'reset') not in ('reset', 'partial') then
    raise exception 'streak_penalty_mode must be reset or partial';
  end if;

  update public.coach_app_settings
  set
    challenge_frequency_days = challenge_frequency,
    daily_reset_time = reset_clock,
    auto_generator_enabled = auto_generator,
    xp_mental = xp_mental_input,
    xp_physical = xp_physical_input,
    xp_technical = xp_technical_input,
    xp_challenge = xp_challenge_input,
    session_bonus_xp = greatest(0, session_bonus_xp_input),
    streak_bonus_3 = greatest(0, streak_bonus_3_input),
    streak_bonus_7 = greatest(0, streak_bonus_7_input),
    streak_bonus_14 = greatest(0, streak_bonus_14_input),
    streak_penalty_mode = coalesce(streak_penalty_mode_input, 'reset'),
    app_announcement = announcement_text,
    maintenance_mode = maintenance_enabled,
    updated_by = auth.uid(),
    updated_at = timezone('utc', now())
  where id = 1;

  return jsonb_build_object('ok', true);
end;
$$;
