-- CreateTable
CREATE TABLE "userInfo" (
    "id" BIGSERIAL NOT NULL,
    "twitchId" TEXT,
    "twitchName" TEXT,
    "discordId" TEXT,
    "coin" BIGINT DEFAULT 0,
    "watchTime" BIGINT DEFAULT 0,
    "subMonth" BIGINT DEFAULT 0,
    "creationTime" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "userInfo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "userInfo_twitchId_key" ON "userInfo"("twitchId");

-- CreateIndex
CREATE UNIQUE INDEX "userInfo_twitchName_key" ON "userInfo"("twitchName");

-- CreateIndex
CREATE UNIQUE INDEX "userInfo_discordId_key" ON "userInfo"("discordId");
