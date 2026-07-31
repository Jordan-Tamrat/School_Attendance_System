-- AlterEnum
ALTER TYPE "ExceptionType" ADD VALUE 'expired_qr';

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "qrExpiresAt" TIMESTAMP(3);
