-- CreateTable
CREATE TABLE "songrequest" (
    "id" BIGSERIAL NOT NULL,
    "songName" TEXT NOT NULL,
    "vote" BIGINT NOT NULL,
    "ts" TIMESTAMP(6) NOT NULL,
    "songKey" TEXT NOT NULL,
    "nowPlaying" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "songrequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "twitchlink" (
    "discordId" TEXT NOT NULL,
    "twitchId" TEXT,
    "state" TEXT NOT NULL,
    "code" TEXT,
    "authToken" TEXT,
    "refreshToken" TEXT,

    CONSTRAINT "twitchlink_pkey" PRIMARY KEY ("discordId")
);

-- CreateTable
CREATE TABLE "userInfoDev" (
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "coin" BIGINT DEFAULT 0,
    "watchTime" BIGINT DEFAULT 0,
    "subMonth" BIGINT DEFAULT 0,
    "creationTime" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updateTime" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "userInfoDev_pkey" PRIMARY KEY ("userId")
);

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

-- CreateTable
CREATE TABLE "userinfo" (
    "User_Name" TEXT NOT NULL,
    "Coin" BIGINT NOT NULL DEFAULT 0,
    "Watch_Time" BIGINT NOT NULL DEFAULT 0,
    "Sub_Month" BIGINT NOT NULL DEFAULT 0,
    "Create_Time" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Update_Time" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "userinfo_pkey" PRIMARY KEY ("User_Name")
);

-- CreateTable
CREATE TABLE "userinfo_duplicate" (
    "userName" TEXT NOT NULL,
    "coin" BIGINT NOT NULL DEFAULT 0,
    "watchTime" BIGINT NOT NULL DEFAULT 0,
    "subMonth" BIGINT NOT NULL DEFAULT 0,
    "creationTime" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateTime" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,

    CONSTRAINT "userinfo_duplicate_pkey" PRIMARY KEY ("userName")
);

-- CreateTable
CREATE TABLE "ytvideo" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "thumbnail" TEXT,
    "live" TEXT,
    "publishTime" TIMESTAMP(6),
    "channelId" TEXT,
    "channelTitle" TEXT,

    CONSTRAINT "ytvideo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "songrequest_songName_key" ON "songrequest"("songName");

-- CreateIndex
CREATE UNIQUE INDEX "twitchlink_twitchId_key" ON "twitchlink"("twitchId");

-- CreateIndex
CREATE UNIQUE INDEX "userInfoDev_userId_key" ON "userInfoDev"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "userInfoDev_userName_key" ON "userInfoDev"("userName");

-- CreateIndex
CREATE UNIQUE INDEX "userinfo_duplicate_userId_key" ON "userinfo_duplicate"("userId");

-- AddForeignKey
ALTER TABLE "twitchlink" ADD CONSTRAINT "twitchlink_twitchId_fkey" FOREIGN KEY ("twitchId") REFERENCES "userinfo"("User_Name") ON DELETE NO ACTION ON UPDATE NO ACTION;
