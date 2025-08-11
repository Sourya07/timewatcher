/*
  Warnings:

  - Added the required column `booked` to the `Booking` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Booking" ADD COLUMN     "booked" BOOLEAN NOT NULL;
