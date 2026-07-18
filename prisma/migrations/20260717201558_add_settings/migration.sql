-- CreateTable
CREATE TABLE "SchoolSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "schoolName" TEXT NOT NULL DEFAULT 'My School',
    "lateThresholdMin" INTEGER NOT NULL DEFAULT 15,
    "schoolStartTime" TEXT NOT NULL DEFAULT '07:30',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolSettings_pkey" PRIMARY KEY ("id")
);
