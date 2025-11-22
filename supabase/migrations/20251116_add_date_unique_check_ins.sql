BEGIN;

ALTER TABLE IF EXISTS check_ins
  ADD COLUMN IF NOT EXISTS date DATE;

UPDATE check_ins
SET date = (created_at AT TIME ZONE 'UTC')::date
WHERE date IS NULL;

WITH dups AS (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY user_id, date ORDER BY id) AS rn
    FROM check_ins
    WHERE date IS NOT NULL
  ) t
  WHERE t.rn > 1
)
DELETE FROM check_ins c
USING dups d
WHERE c.id = d.id;

CREATE UNIQUE INDEX IF NOT EXISTS check_ins_user_date_uniq
ON check_ins(user_id, date)
WHERE date IS NOT NULL;

COMMIT;