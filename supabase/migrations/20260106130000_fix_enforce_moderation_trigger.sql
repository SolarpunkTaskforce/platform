create or replace function public.enforce_moderation_by_admin()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
begin
  -- If someone is trying to change moderation-related fields,
  -- require admin privileges.
  if
    (new.status is distinct from old.status)
    or (new.approved_at is distinct from old.approved_at)
    or (new.approved_by is distinct from old.approved_by)
    or (new.rejected_at is distinct from old.rejected_at)
    or (new.rejected_by is distinct from old.rejected_by)
    or (new.rejection_reason is distinct from old.rejection_reason)
  then
    if not public.is_admin() then
      raise exception 'Only admins may approve or reject projects'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;
