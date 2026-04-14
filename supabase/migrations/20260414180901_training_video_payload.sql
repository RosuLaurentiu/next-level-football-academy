create or replace function public.fetch_daily_training_content(
  target_date date default current_date,
  force_regenerate boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  row_data record;
begin
  perform public.generate_daily_training_content(target_date, force_regenerate);

  select
    dtc.date_key,
    jsonb_build_object(
      'id', mental.id,
      'category', mental.category,
      'title', mental.title,
      'duration', mental.duration,
      'focus', mental.focus,
      'description', mental.description,
      'steps', mental.steps,
      'exerciseType', mental.exercise_type,
      'xp', mental.xp,
      'youtubeUrl', mental.youtube_url,
      'thumbnailUrl', mental.thumbnail_url,
      'accent', 'blue'
    ) as mental_module,
    jsonb_build_object(
      'id', physical.id,
      'category', physical.category,
      'title', physical.title,
      'duration', physical.duration,
      'focus', physical.focus,
      'description', physical.description,
      'steps', physical.steps,
      'xp', physical.xp,
      'youtubeUrl', physical.youtube_url,
      'thumbnailUrl', physical.thumbnail_url,
      'accent', 'orange'
    ) as physical_module,
    jsonb_build_object(
      'id', technical.id,
      'category', technical.category,
      'title', technical.title,
      'duration', technical.duration,
      'focus', technical.focus,
      'description', technical.description,
      'steps', technical.steps,
      'xp', technical.xp,
      'youtubeUrl', technical.youtube_url,
      'thumbnailUrl', technical.thumbnail_url,
      'accent', 'green'
    ) as technical_module,
    case
      when challenge.id is null then null
      else jsonb_build_object(
        'id', challenge.id,
        'title', challenge.title,
        'description', challenge.description,
        'target', challenge.target,
        'duration', challenge.duration,
        'xp', challenge.xp,
        'levelRequired', challenge.level_required,
        'difficulty', challenge.difficulty,
        'coachNote', challenge.coach_note,
        'rewardText', challenge.reward_text,
        'badge', challenge.badge
      )
    end as challenge_module
  into row_data
  from public.daily_training_content dtc
  join public.coach_training_modules mental on mental.id = dtc.mental_module_id
  join public.coach_training_modules physical on physical.id = dtc.physical_module_id
  join public.coach_training_modules technical on technical.id = dtc.technical_module_id
  left join public.coach_challenges challenge on challenge.id = dtc.challenge_id
  where dtc.date_key = target_date;

  return jsonb_build_object(
    'dateKey', row_data.date_key::text,
    'mental', row_data.mental_module,
    'physical', row_data.physical_module,
    'technical', row_data.technical_module,
    'challenge', row_data.challenge_module
  );
end;
$$;
