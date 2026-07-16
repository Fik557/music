FROM node:24-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY server.js ./server.js
COPY muzyczne-lobby ./muzyczne-lobby
RUN ln -s /app/muzyczne-lobby/public /app/public \
  && ln -s /app/muzyczne-lobby/data /app/data

ENV NODE_ENV=production
ENV PORT=8080
ENV NODE_OPTIONS=--max-old-space-size=180

EXPOSE 8080

CMD ["npm", "start"]