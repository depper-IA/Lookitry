FROM node:20-alpine AS builder

# Install build dependencies for native modules (e.g. better-sqlite3)
RUN apk add --no-cache python3 make g++ 

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build
RUN npm prune --production

FROM node:20-alpine AS runner

WORKDIR /app

RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

VOLUME /data

ENV NODE_ENV=production
ENV DB_PATH=/data/memory.db

CMD ["npm", "start"]
