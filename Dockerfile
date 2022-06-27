FROM node:16-buster-slim

WORKDIR /app

ENV NODE_ENV production

COPY package.json yarn.lock ./

RUN echo "deb http://ftp.debianclub.org/debian buster main" > /etc/apt/sources.list && \
    echo "deb http://ftp.debianclub.org/debian-security buster/updates main" >> /etc/apt/sources.list && \
    echo "deb http://ftp.debianclub.org/debian buster-updates main" >> /etc/apt/sources.list && \
    apt-get update && \
    apt-get install -y libtool-bin build-essential python3

RUN yarn global add node-gyp && yarn

COPY /bot ./bot

# Express Port
EXPOSE 9876

CMD ["yarn", "start"]
