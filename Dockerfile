# Multi-stage build for Permanence Next.js app
FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY tsconfig.json next.config.ts next-env.d.ts postcss.config.mjs eslint.config.mjs ./
COPY src/ src/
COPY public/ public/
COPY docs/ docs/

# Build standalone output
RUN npm run build

# Production image
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy standalone build artifacts
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Create .data directory for persistence
RUN mkdir -p /app/.data

EXPOSE 3000

CMD ["node", "server.js"]