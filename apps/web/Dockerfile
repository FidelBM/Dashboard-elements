FROM node:22-alpine AS deps

WORKDIR /app

COPY apps/web/package*.json ./apps/web/
WORKDIR /app/apps/web
RUN npm install

FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=development

COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY apps/web ./apps/web
COPY prisma ./prisma

WORKDIR /app/apps/web
EXPOSE 3000

CMD ["sh", "-c", "npm run db:generate && npx prisma db push --schema ../../prisma/schema.prisma && npm run db:seed && npm run dev -- --hostname 0.0.0.0 --port ${PORT:-3000}"]

