# =========================
# 1) Dependencies
# =========================
FROM node:22-alpine AS deps

RUN apk upgrade --no-cache \
  && addgroup -g 1001 -S appgroup \
  && adduser -S appuser -u 1001 -G appgroup

WORKDIR /app
RUN chown appuser:appgroup /app

COPY --chown=appuser:appgroup package*.json ./
COPY --chown=appuser:appgroup prisma ./prisma/
COPY --chown=appuser:appgroup prisma.config.ts ./

USER appuser

RUN npm ci --fetch-timeout=600000 --fetch-retries=5


# =========================
# 2) Builder
# =========================
FROM deps AS builder

COPY --chown=appuser:appgroup . .

RUN npx prisma generate && npm run build


# =========================
# 3) Runner (Production)
# =========================
FROM node:22-alpine AS runner

RUN apk upgrade --no-cache \
  && apk add --no-cache curl \
  && addgroup -g 1001 -S appgroup \
  && adduser -S appuser -u 1001 -G appgroup

WORKDIR /app

COPY --from=builder --chown=appuser:appgroup /app/package*.json ./
COPY --from=builder --chown=appuser:appgroup /app/prisma ./prisma
COPY --from=builder --chown=appuser:appgroup /app/prisma.config.ts ./prisma.config.ts

RUN npm ci --omit=dev --fetch-timeout=600000 --fetch-retries=5 && npm cache clean --force

COPY --from=builder --chown=appuser:appgroup /app/dist ./dist

RUN mkdir -p logs && chown appuser:appgroup logs

ENV NODE_ENV=production \
    PORT=3000

USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["node", "dist/src/main"]
