/*
  Warnings:

  - You are about to drop the column `schoolStartTime` on the `SchoolSettings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "SchoolSettings" DROP COLUMN "schoolStartTime",
ADD COLUMN     "doorClosesTime" TEXT NOT NULL DEFAULT '07:30',
ADD COLUMN     "doorOpensTime" TEXT NOT NULL DEFAULT '07:00';
