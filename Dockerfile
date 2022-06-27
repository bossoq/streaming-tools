FROM node:16.14.2-buster-slim

WORKDIR /app

ENV NODE_ENV production

RUN echo "deb http://ftp.debianclub.org/debian buster main" > /etc/apt/sources.list && \
    echo "deb http://ftp.debianclub.org/debian-security buster/updates main" >> /etc/apt/sources.list && \
    echo "deb http://ftp.debianclub.org/debian buster-updates main" >> /etc/apt/sources.list && \
    apt-get update && \
    apt-get install -y libtool-bin build-essential python3

COPY package.json yarn.lock ./
COPY /bot/package.json ./bot/package.json

RUN yarn global add node-gyp && yarn

COPY /bot ./bot
RUN npx prisma generate --schema=./bot/backend/prisma/schema.prisma
COPY .env ./

# Express Port
EXPOSE 9876

CMD ["yarn", "start"]
