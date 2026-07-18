-- PostgreSQL does not support DROP VALUE from an enum directly.
-- We rename the old enum, create a new one without 'excused',
-- migrate the column, then drop the old enum.

-- Step 1: rename existing enum
ALTER TYPE "AttendanceStatus" RENAME TO "AttendanceStatus_old";

-- Step 2: create new enum without 'excused'
CREATE TYPE "AttendanceStatus" AS ENUM ('present', 'absent', 'late', 'permission');

-- Step 3: migrate any existing 'excused' records to 'permission'
UPDATE "AttendanceRecord" SET "status" = 'permission' WHERE "status" = 'excused';

-- Step 4: alter the column to use the new enum
ALTER TABLE "AttendanceRecord"
  ALTER COLUMN "status" TYPE "AttendanceStatus"
  USING "status"::text::"AttendanceStatus";

-- Step 5: drop the old enum
DROP TYPE "AttendanceStatus_old";
