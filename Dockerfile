# syntax=docker/dockerfile:1

ARG NODE_VERSION=22

# ---- base ------------------------------------------------------------------
FROM node:${NODE_VERSION}-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# ---- deps: install exactly what package-lock.json says ----------------------
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ---- builder: compile the Next.js app (standalone output) -------------------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# No build-time secrets: OPENAI_API_KEY is provided at run time only.
RUN npm run build

# ---- runner: minimal production image, non-root -----------------------------
FROM base AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/ >/dev/null || exit 1

# Runtime secrets (OPENAI_API_KEY, OPENAI_VISION_MODEL, ...) come from the environment, never the image.
CMD ["node", "server.js"]
