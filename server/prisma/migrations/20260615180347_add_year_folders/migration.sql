-- Migration: add_year_folders
-- This migration introduces the year_folders table and migrates existing
-- categories from being directly associated with courses to being associated
-- with year folders. Existing categories are assigned to a year folder with
-- year=2024 for their parent course.

-- Step 1: Create the year_folders table
CREATE TABLE "year_folders" (
    "id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "is_complete" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "year_folders_pkey" PRIMARY KEY ("id")
);

-- Step 2: Create indexes and unique constraints on year_folders
CREATE INDEX "year_folders_course_id_idx" ON "year_folders"("course_id");
CREATE UNIQUE INDEX "year_folders_course_id_year_key" ON "year_folders"("course_id", "year");

-- Step 3: Add foreign key from year_folders to courses
ALTER TABLE "year_folders" ADD CONSTRAINT "year_folders_course_id_fkey"
    FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 4: Add year_folder_id column to categories (nullable initially for data migration)
ALTER TABLE "categories" ADD COLUMN "year_folder_id" TEXT;

-- Step 5: Data migration - create a year folder (year=2024) for each course that has categories
INSERT INTO "year_folders" ("id", "course_id", "year", "is_complete", "created_at")
SELECT
    gen_random_uuid()::text,
    c."course_id",
    2024,
    false,
    NOW()
FROM (SELECT DISTINCT "course_id" FROM "categories") AS c;

-- Step 6: Data migration - set year_folder_id on existing categories
UPDATE "categories"
SET "year_folder_id" = yf."id"
FROM "year_folders" yf
WHERE "categories"."course_id" = yf."course_id"
  AND yf."year" = 2024;

-- Step 7: Make year_folder_id NOT NULL now that all rows have been populated
ALTER TABLE "categories" ALTER COLUMN "year_folder_id" SET NOT NULL;

-- Step 8: Drop old foreign key and unique constraint on (course_id, name)
ALTER TABLE "categories" DROP CONSTRAINT "categories_course_id_fkey";
DROP INDEX "categories_course_id_name_key";

-- Step 9: Drop the course_id column from categories
ALTER TABLE "categories" DROP COLUMN "course_id";

-- Step 10: Add new unique constraint on (year_folder_id, name)
CREATE UNIQUE INDEX "categories_year_folder_id_name_key" ON "categories"("year_folder_id", "name");

-- Step 11: Add foreign key from categories to year_folders
ALTER TABLE "categories" ADD CONSTRAINT "categories_year_folder_id_fkey"
    FOREIGN KEY ("year_folder_id") REFERENCES "year_folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
