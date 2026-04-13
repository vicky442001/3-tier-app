FROM node:18-alpine

WORKDIR /app

RUN addgroup -S nodegroup && adduser -S nodeuser -G nodegroup

COPY package*.json ./

RUN npm ci --omit=dev

COPY . .

RUN chown -R nodeuser:nodegroup /app

USER nodeuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["node","server.js"]