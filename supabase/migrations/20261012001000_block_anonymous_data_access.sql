-- Step 1 of 2: stop reading and writing of scan data without logging in.
--
-- NOT APPLIED YET. Checked against the live database on 2026-10-12: exams, raw and
-- credit_transactions had no row level security and full grants to the public "anon" role,
-- so the public key alone could read and change every row.
--
-- This step changes nothing for logged-in apps: the admin panel, provider pages and the
-- kiosk portal all read these tables with a logged-in session, and only ever read them.
-- Writers are unaffected: health uses the service-role key, and the credit functions
-- (add_user_credit_package, debit_credit_for_scan, record_free_signup_credit) run with
-- owner rights.

alter table public.exams enable row level security;
alter table public.raw enable row level security;
alter table public.credit_transactions enable row level security;

revoke all on table public.exams, public.raw, public.credit_transactions from anon;
revoke insert, update, delete, truncate
  on table public.exams, public.raw, public.credit_transactions
  from authenticated;

-- Temporary: any logged-in user can still read. Step 2 narrows this.
drop policy if exists "Logged-in users can read exams" on public.exams;
create policy "Logged-in users can read exams"
  on public.exams for select to authenticated using (true);

drop policy if exists "Logged-in users can read credit transactions" on public.credit_transactions;
create policy "Logged-in users can read credit transactions"
  on public.credit_transactions for select to authenticated using (true);

-- raw has no policy on purpose: no app reads it from the browser, only the service role.

-- get_user_exams runs with owner rights and returns any user's exams for any id passed in.
-- Nothing in the app repos calls it, so take it away from the public roles.
revoke execute on function public.get_user_exams(uuid, integer) from public, anon, authenticated;

notify pgrst, 'reload schema';
