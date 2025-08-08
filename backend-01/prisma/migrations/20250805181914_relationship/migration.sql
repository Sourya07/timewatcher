/*
  Warnings:

  - Added the required column `occupation` to the `AdminShop` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price` to the `AdminShop` table without a default value. This is not possible if the table is not empty.
  - Added the required column `timein` to the `AdminShop` table without a default value. This is not possible if the table is not empty.
  - Added the required column `timeout` to the `AdminShop` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."AdminShop" ADD COLUMN     "occupation" TEXT NOT NULL,
ADD COLUMN     "price" INTEGER NOT NULL,
ADD COLUMN     "speclization" TEXT,
ADD COLUMN     "timein" INTEGER NOT NULL,
ADD COLUMN     "timeout" INTEGER NOT NULL;
