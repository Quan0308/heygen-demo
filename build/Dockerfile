# FROM node:20-alpine AS base
#
# WORKDIR /app 
#
# COPY package.json ./ 
#
# RUN npm install
#
# COPY . .
#
# RUN npm run build
#
# EXPOSE 3000
#
# CMD ["npm", "start"]

FROM node:20-alpine 

WORKDIR /app

ENV NODE_ENV production

COPY ./public ./public
COPY ./.next/standalone ./
COPY ./.next/static ./.next/static

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
