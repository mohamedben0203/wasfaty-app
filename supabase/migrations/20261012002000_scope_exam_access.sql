-- Step 2 of 2: each logged-in person sees only the scan results they should.
--
-- NOT APPLIED YET, and it needs a product decision first: after this, a service provider sees
-- results from the machines assigned to them, not every result. If providers must see more
-- (for example all results of a customer they serve), widen the provider clause before applying.
--
-- Results are matched to their owner by phone digits, not user_id: on 2026-10-12 none of the
-- 473 exams had user_id filled in.

drop policy if exists "Logged-in users can read exams" on public.exams;

drop policy if exists "Users can read their own exams" on public.exams;
create policy "Users can read their own exams"
  on public.exams for select to authenticated
  using (
    user_id = auth.uid()
    or regexp_replace(coalesce(person_idnumber, ''), '[^0-9]', '', 'g') = (
      select nullif(regexp_replace(phone, '[^0-9]', '', 'g'), '')
      from public.users
      where id = auth.uid()
    )
  );

drop policy if exists "Admins can read all exams" on public.exams;
create policy "Admins can read all exams"
  on public.exams for select to authenticated
  using (public.is_admin());

drop policy if exists "Providers can read exams from their machines" on public.exams;
create policy "Providers can read exams from their machines"
  on public.exams for select to authenticated
  using (
    device_id in (
      select device_id
      from public.machine_provider_assignments
      where provider_user_id = auth.uid()
         or lower(provider_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );

notify pgrst, 'reload schema';
