-- Background welder bulk-import jobs (BullMQ worker updates status).
create table if not exists import_jobs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  created_by uuid not null,
  status text not null default 'queued'
    check (status in ('queued', 'running', 'succeeded', 'failed')),
  summary jsonb,
  error_message text,
  progress integer not null default 0
    check (progress >= 0 and progress <= 100),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz
);

create index if not exists import_jobs_org_created_idx
  on import_jobs (org_id, created_at desc);

create index if not exists import_jobs_status_idx
  on import_jobs (status)
  where status in ('queued', 'running');

alter table import_jobs enable row level security;

create policy import_jobs_org_select on import_jobs
  for select using (
    org_id = (select org_id from profiles where id = auth.uid())
  );

create policy import_jobs_org_insert on import_jobs
  for insert with check (
    org_id = (select org_id from profiles where id = auth.uid())
  );

-- Updates/deletes done by service-role worker; authenticated users only read.
