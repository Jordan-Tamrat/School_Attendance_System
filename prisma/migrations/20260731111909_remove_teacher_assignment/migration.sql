/*
  Warnings:

  - You are about to drop the column `teacherId` on the `Class` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Class" DROP CONSTRAINT "Class_teacherId_fkey";

-- DropIndex
DROP INDEX "Class_teacherId_key";

-- AlterTable
ALTER TABLE "Class" DROP COLUMN "teacherId";
