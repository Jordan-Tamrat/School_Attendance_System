-- AlterTable
ALTER TABLE "SchoolSettings" ADD COLUMN     "academicYearEnd" DATE,
ADD COLUMN     "academicYearStart" DATE;

-- CreateTable
CREATE TABLE "Holiday" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" DATE NOT NULL,

    CONSTRAINT "Holiday_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Holiday_date_key" ON "Holiday"("date");
