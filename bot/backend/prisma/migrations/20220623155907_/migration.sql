/*
  Warnings:

  - A unique constraint covering the columns `[twitchName]` on the table `userInfo` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "userInfo_twitchName_key" ON "userInfo"("twitchName");
