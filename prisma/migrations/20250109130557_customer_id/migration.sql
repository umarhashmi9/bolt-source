-- DropForeignKey
ALTER TABLE "customers" DROP CONSTRAINT "customers_userId_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "customerIs" TEXT;
