/*
  Warnings:

  - Made the column `qrExpiresAt` on table `Student` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Student" ALTER COLUMN "qrExpiresAt" SET NOT NULL;
