FROM node:16.14.2-buster-slim

WORKDIR /app

ENV NODE_ENV production

COPY package.json yarn.lock ./
COPY /bot ./bot

RUN echo "deb http://ftp.debianclub.org/debian buster main" > /etc/apt/sources.list && \
    echo "deb http://ftp.debianclub.org/debian-security buster/updates main" >> /etc/apt/sources.list && \
    echo "deb http://ftp.debianclub.org/debian buster-updates main" >> /etc/apt/sources.list && \
    apt-get update && \
    apt-get install -y libtool-bin build-essential python3

RUN yarn global add node-gyp && yarn

# Express Port
EXPOSE 9876

CMD ["yarn", "start"]
