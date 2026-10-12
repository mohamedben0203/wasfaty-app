-- Verification codes requested from the customer app: at most one every 5 minutes per phone
-- number, and at most 3 per hour (the first code plus 2 resends).
--
-- NOT APPLIED YET. This is a separate function on purpose: the kiosk keeps calling
-- request_auth_otp with its own limit (3 codes per 15 minutes), which is left untouched.
-- Codes from both end up in auth_otps, are sent by the same trigger and are checked by the
-- same verify_auth_otp, and a code sent from the kiosk counts towards the app's limit.
--
-- Both error messages start with "Too many OTP requests", the text the app recognises.

create or replace function public.request_app_auth_otp(
  customer_number text,
  language text default 'ar',
  expiry_minutes integer default 10
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_language text;
  normalized_expiry integer;
  inserted_id uuid;
begin
  if customer_number is null or customer_number !~ '^\+[1-9][0-9]{6,14}$' then
    raise exception 'Invalid customer number';
  end if;

  normalized_language := case when language = 'en' then 'en' else 'ar' end;
  normalized_expiry := coalesce(expiry_minutes, 10);

  if normalized_expiry < 1 or normalized_expiry > 30 then
    raise exception 'Invalid OTP expiry';
  end if;

  if exists (
    select 1
    from public.auth_otps o
    where o.customer_number = request_app_auth_otp.customer_number
      and o.created_at > now() - interval '5 minutes'
  ) then
    raise exception 'Too many OTP requests. Please wait 5 minutes between codes.';
  end if;

  if (
    select count(*)
    from public.auth_otps o
    where o.customer_number = request_app_auth_otp.customer_number
      and o.created_at > now() - interval '1 hour'
  ) >= 3 then
    raise exception 'Too many OTP requests. Please try again later.';
  end if;

  insert into public.auth_otps (customer_number, otp, language, expiry_minutes, expires_at)
  values (
    request_app_auth_otp.customer_number,
    public.generate_six_digit_otp(),
    normalized_language,
    normalized_expiry,
    now() + make_interval(mins => normalized_expiry)
  )
  returning id into inserted_id;

  return jsonb_build_object(
    'id', inserted_id,
    'number', request_app_auth_otp.customer_number,
    'expiryMinutes', normalized_expiry
  );
end;
$$;

revoke all on function public.request_app_auth_otp(text, text, integer) from public;
grant execute on function public.request_app_auth_otp(text, text, integer) to anon, authenticated;

notify pgrst, 'reload schema';
