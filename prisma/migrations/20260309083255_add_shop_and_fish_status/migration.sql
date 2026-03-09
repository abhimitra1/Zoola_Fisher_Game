/*
  Warnings:

  - You are about to drop the column `alive` on the `fish` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "fish" DROP COLUMN "alive",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'in_tank';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "last_daily_login" TIMESTAMP(3),
ADD COLUMN     "login_streak" INTEGER DEFAULT 0;
