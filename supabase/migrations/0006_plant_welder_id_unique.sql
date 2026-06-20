-- Plant welder ID (W#nnn) must be unique within an organisation.
create unique index if not exists welders_org_plant_welder_id_unique
  on welders (org_id, lower(trim(welder_id)))
  where welder_id is not null and trim(welder_id) <> '';
