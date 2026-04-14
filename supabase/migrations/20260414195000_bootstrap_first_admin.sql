do $$
begin
  if not exists (
    select 1
    from public.profiles
    where role = 'admin'
  ) then
    update public.profiles
    set role = 'admin'
    where user_id = (
      select user_id
      from public.profiles
      order by created_at asc
      limit 1
    );
  end if;
end;
$$;
