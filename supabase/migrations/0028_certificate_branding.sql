-- Per-organisation logo / name / location placement on generated certificates.

alter table organizations
  add column if not exists certificate_branding jsonb not null default '{
    "logo": { "enabled": true, "align": "center" },
    "name": { "enabled": true, "align": "center" },
    "location": { "enabled": true, "align": "center" }
  }'::jsonb;

comment on column organizations.certificate_branding is
  'Show/hide and left|center|right alignment for logo, company name, and location on certificates.';
