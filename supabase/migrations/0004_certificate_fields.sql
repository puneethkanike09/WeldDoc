-- WeldDoc — fields required by the official EN ISO 9606-1 individual certificate.

alter table qualification_records
  add column if not exists transfer_mode text,
  add column if not exists weld_details text,
  add column if not exists job_knowledge text not null default 'Not tested',
  add column if not exists supplementary_fillet boolean not null default false;
