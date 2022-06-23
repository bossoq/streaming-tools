/*
  Warnings:

  - You are about to drop the `songrequest` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `twitchlink` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `userInfoDev` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `userinfo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `userinfo_duplicate` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ytvideo` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "twitchlink" DROP CONSTRAINT "twitchlink_twitchId_fkey";

-- DropTable
DROP TABLE "songrequest";

-- DropTable
DROP TABLE "twitchlink";

-- DropTable
DROP TABLE "userInfoDev";

-- DropTable
DROP TABLE "userinfo";

-- DropTable
DROP TABLE "userinfo_duplicate";

-- DropTable
DROP TABLE "ytvideo";

-- CreateTable
CREATE TABLE "songRequest" (
    "id" BIGSERIAL NOT NULL,
    "songName" TEXT NOT NULL,
    "vote" BIGINT NOT NULL,
    "ts" TIMESTAMP(6) NOT NULL,
    "songKey" TEXT NOT NULL,
    "nowPlaying" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "songRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "songRequest_songName_key" ON "songRequest"("songName");
