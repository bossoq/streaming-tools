/*
  Warnings:

  - A unique constraint covering the columns `[twitchId]` on the table `userInfo` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[discordId]` on the table `userInfo` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "userInfo_twitchId_key" ON "userInfo"("twitchId");

-- CreateIndex
CREATE UNIQUE INDEX "userInfo_discordId_key" ON "userInfo"("discordId");
