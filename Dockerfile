# ── Stage 1: build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Stage 2: production ───────────────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Install production dependencies in the Linux environment so sharp's
# native binaries match the runtime platform
COPY package*.json ./
RUN npm ci --omit=dev

# Copy Nitro build output
COPY --from=builder /app/.output ./.output

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
