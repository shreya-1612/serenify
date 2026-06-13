-- AlterTable
ALTER TABLE "User" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "notificationPrefs" JSONB,
ADD COLUMN     "reminderTime" TEXT;
