/*
  Warnings:

  - A unique constraint covering the columns `[UserID]` on the table `userprofile` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `UserID` to the `userprofile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."userprofile" ADD COLUMN     "UserID" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "userprofile_UserID_key" ON "public"."userprofile"("UserID");

-- AddForeignKey
ALTER TABLE "public"."userprofile" ADD CONSTRAINT "userprofile_UserID_fkey" FOREIGN KEY ("UserID") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
