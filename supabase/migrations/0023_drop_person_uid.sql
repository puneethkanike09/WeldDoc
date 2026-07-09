-- Remove system UID (e.g. WLD-2026-001). Plant ID (W#01 / O#01) is the sole identifier.
-- Idempotent: safe when uid columns were already dropped.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'welders'
      AND column_name = 'uid'
  ) THEN
    UPDATE welders
    SET welder_id = 'W#' || lpad((regexp_match(uid, '-(\d+)$'))[1], 2, '0')
    WHERE (welder_id IS NULL OR trim(welder_id) = '')
      AND uid ~ '-\d+$';

    UPDATE welders
    SET welder_id = uid
    WHERE welder_id IS NULL OR trim(welder_id) = '';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'operators'
      AND column_name = 'uid'
  ) THEN
    UPDATE operators
    SET operator_id = 'O#' || lpad((regexp_match(uid, '-(\d+)$'))[1], 2, '0')
    WHERE (operator_id IS NULL OR trim(operator_id) = '')
      AND uid ~ '-\d+$';

    UPDATE operators
    SET operator_id = uid
    WHERE operator_id IS NULL OR trim(operator_id) = '';
  END IF;
END $$;

ALTER TABLE welders DROP CONSTRAINT IF EXISTS welders_org_id_uid_key;
ALTER TABLE operators DROP CONSTRAINT IF EXISTS operators_org_id_uid_key;

ALTER TABLE welders DROP COLUMN IF EXISTS uid;
ALTER TABLE operators DROP COLUMN IF EXISTS uid;

ALTER TABLE organizations DROP COLUMN IF EXISTS uid_prefix;

DROP FUNCTION IF EXISTS next_welder_uid(uuid);
DROP FUNCTION IF EXISTS next_operator_uid(uuid);
