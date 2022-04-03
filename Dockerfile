FROM node:16-alpine

WORKDIR /app

ENV NODE_ENV production

COPY package.json yarn.lock ./
RUN yarn

COPY . .

# Express Port
EXPOSE 9876

# Debugging port
EXPOSE 9229

CMD ["yarn", "start"]
