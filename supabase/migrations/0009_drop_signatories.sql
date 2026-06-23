-- Remove digital signatory management (certificates and batch reports are signed by hand).

-- Drop FK columns on batch reports.
alter table qualification_test_reports
  drop column if exists manufacturer_signatory_id,
  drop column if exists examining_body_signatory_id;

-- Drop signatories table and RLS policy.
drop policy if exists signatories_all on signatories;
drop table if exists signatories;

drop type if exists signatory_role;

-- Recreate storage policies without the removed signature/stamp buckets.
drop policy if exists "public read public buckets" on storage.objects;
create policy "public read public buckets" on storage.objects
  for select to public
  using (bucket_id in ('welder-photos', 'generated-pdfs', 'org-assets'));

drop policy if exists "authenticated read" on storage.objects;
create policy "authenticated read" on storage.objects
  for select to authenticated
  using (
    bucket_id in (
      'welder-photos', 'generated-pdfs', 'org-assets', 'ndt-reports', 'legacy-docs'
    )
  );

drop policy if exists "authenticated insert" on storage.objects;
create policy "authenticated insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id in (
      'welder-photos', 'generated-pdfs', 'org-assets', 'ndt-reports', 'legacy-docs'
    )
  );

drop policy if exists "authenticated update" on storage.objects;
create policy "authenticated update" on storage.objects
  for update to authenticated
  using (
    bucket_id in (
      'welder-photos', 'generated-pdfs', 'org-assets', 'ndt-reports', 'legacy-docs'
    )
  );

drop policy if exists "authenticated delete" on storage.objects;
create policy "authenticated delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id in (
      'welder-photos', 'generated-pdfs', 'org-assets', 'ndt-reports', 'legacy-docs'
    )
  );
