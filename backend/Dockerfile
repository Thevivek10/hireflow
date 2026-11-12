FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

# Install production dependencies first so this layer is cached
COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# CV uploads are written here; run as the unprivileged "node" user
RUN mkdir -p uploads/cvs && chown -R node:node /app
USER node

EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/health || exit 1

CMD ["node", "server.js"]
