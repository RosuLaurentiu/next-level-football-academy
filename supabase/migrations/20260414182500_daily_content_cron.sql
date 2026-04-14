do $$
begin
  if exists (
    select 1
    from pg_available_extensions
    where name = 'pg_cron'
  ) then
    create extension if not exists pg_cron;

    if not exists (
      select 1
      from cron.job
      where jobname = 'daily_training_content_midnight'
    ) then
      perform cron.schedule(
        'daily_training_content_midnight',
        '0 0 * * *',
        'select public.generate_daily_training_content(current_date + 1, false);'
      );
    end if;
  end if;
exception
  when others then
    raise notice 'Cron scheduling skipped: %', sqlerrm;
end;
$$;
