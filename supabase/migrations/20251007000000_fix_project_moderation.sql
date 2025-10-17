-- Ensure moderation trigger works with the consolidated `status` column
CREATE OR REPLACE FUNCTION public.enforce_moderation_by_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
begin
  -- Only admins may change moderation-related fields
  if (new.status is distinct from old.status)
     or (new.approved_at is distinct from old.approved_at)
     or (new.approved_by is distinct from old.approved_by)
     or (new.rejected_at is distinct from old.rejected_at)
     or (new.rejected_by is distinct from old.rejected_by)
     or (new.rejection_reason is distinct from old.rejection_reason)
  then
    if not public.is_admin() then
      raise exception 'Only admins can modify moderation fields';
    end if;

    -- Stamp transitions
    if new.status = 'approved' and old.status <> 'approved' then
      new.approved_at := now();
      new.approved_by := auth.uid();
      new.rejected_at := null;
      new.rejected_by := null;
      new.rejection_reason := null;
    elsif new.status = 'rejected' and old.status <> 'rejected' then
      new.rejected_at := now();
      new.rejected_by := auth.uid();
      new.approved_at := null;
      new.approved_by := null;
      -- rejection_reason can be set by admin via update payload
    elsif new.status = 'pending' and old.status <> 'pending' then
      new.approved_at := null;
      new.approved_by := null;
      new.rejected_at := null;
      new.rejected_by := null;
      new.rejection_reason := null;
    end if;
  end if;

  -- Non-admins cannot change status at all
  if not public.is_admin() and (new.status is distinct from old.status) then
    raise exception 'Only admins can change status';
  end if;

  return new;
end;
$function$;

