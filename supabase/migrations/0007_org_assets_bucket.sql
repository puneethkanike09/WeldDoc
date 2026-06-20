-- Organization logos (certificates, master list, ID cards).

insert into storage.buckets (id, name, public)
values ('org-assets', 'org-assets', true)
on conflict (id) do nothing;

drop policy if exists "public read public buckets" on storage.objects;
create policy "public read public buckets" on storage.objects
  for select to public
  using (bucket_id in ('welder-photos', 'generated-pdfs', 'org-assets'));

drop policy if exists "authenticated read" on storage.objects;
create policy "authenticated read" on storage.objects
  for select to authenticated
  using (
    bucket_id in (
      'welder-photos', 'generated-pdfs', 'org-assets', 'ndt-reports',
      'signatures', 'stamps', 'legacy-docs'
    )
  );

drop policy if exists "authenticated insert" on storage.objects;
create policy "authenticated insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id in (
      'welder-photos', 'generated-pdfs', 'org-assets', 'ndt-reports',
      'signatures', 'stamps', 'legacy-docs'
    )
  );

drop policy if exists "authenticated update" on storage.objects;
create policy "authenticated update" on storage.objects
  for update to authenticated
  using (
    bucket_id in (
      'welder-photos', 'generated-pdfs', 'org-assets', 'ndt-reports',
      'signatures', 'stamps', 'legacy-docs'
    )
  );

drop policy if exists "authenticated delete" on storage.objects;
create policy "authenticated delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id in (
      'welder-photos', 'generated-pdfs', 'org-assets', 'ndt-reports',
      'signatures', 'stamps', 'legacy-docs'
    )
  );
