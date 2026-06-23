-- Store the manually signed certificate scan separately from the system-generated PDF.
alter table qualification_records
  add column if not exists signed_certificate_pdf_path text;
