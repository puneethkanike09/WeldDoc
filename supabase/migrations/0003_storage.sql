-- WeldDoc MVP — Storage buckets and policies.
-- Public buckets (welder photos + generated PDFs) are readable by anyone so the
-- public QR auditor page and shared certificate links work without login.
-- Private buckets hold raw uploads (NDT reports, signatures, stamps, legacy docs).

insert into storage.buckets (id, name, public)
values
  ('welder-photos', 'welder-photos', true),
  ('generated-pdfs', 'generated-pdfs', true),
  ('ndt-reports', 'ndt-reports', false),
  ('signatures', 'signatures', false),
  ('stamps', 'stamps', false),
  ('legacy-docs', 'legacy-docs', false)
on conflict (id) do nothing;

-- Public read for public buckets.
drop policy if exists "public read public buckets" on storage.objects;
create policy "public read public buckets" on storage.objects
  for select to public
  using (bucket_id in ('welder-photos', 'generated-pdfs'));

-- Authenticated users can read every WeldDoc bucket.
drop policy if exists "authenticated read" on storage.objects;
create policy "authenticated read" on storage.objects
  for select to authenticated
  using (
    bucket_id in (
      'welder-photos', 'generated-pdfs', 'ndt-reports',
      'signatures', 'stamps', 'legacy-docs'
    )
  );

-- Authenticated users can write/update/delete in every WeldDoc bucket.
drop policy if exists "authenticated insert" on storage.objects;
create policy "authenticated insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id in (
      'welder-photos', 'generated-pdfs', 'ndt-reports',
      'signatures', 'stamps', 'legacy-docs'
    )
  );

drop policy if exists "authenticated update" on storage.objects;
create policy "authenticated update" on storage.objects
  for update to authenticated
  using (
    bucket_id in (
      'welder-photos', 'generated-pdfs', 'ndt-reports',
      'signatures', 'stamps', 'legacy-docs'
    )
  );

drop policy if exists "authenticated delete" on storage.objects;
create policy "authenticated delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id in (
      'welder-photos', 'generated-pdfs', 'ndt-reports',
      'signatures', 'stamps', 'legacy-docs'
    )
  );
