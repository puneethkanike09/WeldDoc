-- Remove system UID (e.g. WLD-2026-001). Plant ID (W#01 / O#01) is the sole identifier.

-- Backfill welder plant IDs from legacy UID trailing sequence
UPDATE welders
SET welder_id = 'W#' || lpad((regexp_match(uid, '-(\d+)$'))[1], 2, '0')
WHERE (welder_id IS NULL OR trim(welder_id) = '')
  AND uid ~ '-\d+$';

-- Backfill operator plant IDs from legacy UID trailing sequence
UPDATE operators
SET operator_id = 'O#' || lpad((regexp_match(uid, '-(\d+)$'))[1], 2, '0')
WHERE (operator_id IS NULL OR trim(operator_id) = '')
  AND uid ~ '-\d+$';

-- Last resort for any row still missing a plant ID
UPDATE welders
SET welder_id = uid
WHERE welder_id IS NULL OR trim(welder_id) = '';

UPDATE operators
SET operator_id = uid
WHERE operator_id IS NULL OR trim(operator_id) = '';

ALTER TABLE welders DROP CONSTRAINT IF EXISTS welders_org_id_uid_key;
ALTER TABLE operators DROP CONSTRAINT IF EXISTS operators_org_id_uid_key;

ALTER TABLE welders DROP COLUMN IF EXISTS uid;
ALTER TABLE operators DROP COLUMN IF EXISTS uid;

ALTER TABLE organizations DROP COLUMN IF EXISTS uid_prefix;

DROP FUNCTION IF EXISTS next_welder_uid(uuid);
DROP FUNCTION IF EXISTS next_operator_uid(uuid);
