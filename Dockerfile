FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build:noenv
RUN ./node_modules/.bin/esbuild scripts/notification-worker.ts --bundle --platform=node --external:pg --external:@electric-sql/pglite --outfile=notification-worker.cjs

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/assets ./assets
COPY --from=builder /app/notification-worker.cjs ./notification-worker.cjs
# Next traces web imports only; the standalone worker also loads the database adapter entrypoint.
COPY --from=builder /app/node_modules/@electric-sql/pglite ./node_modules/@electric-sql/pglite
EXPOSE 3000
CMD ["node", "server.js"]
