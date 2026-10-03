FROM node:24.21.0-alpine AS base
RUN npm install -g pnpm@10.29.3

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts

# The web image never touches SQLite or the desktop toolchain — strip them so
# the runtime layer stays small and no native build step is needed.
FROM deps AS web-runtime-deps
RUN pnpm remove @native-sdk/cli @prisma/adapter-better-sqlite3 better-sqlite3
RUN pnpm prune --prod --ignore-scripts
RUN find node_modules/.pnpm -maxdepth 1 -type d \
  \( -name 'better-sqlite3@*' -o -name '@prisma+adapter-better-sqlite3@*' -o -name '@native-sdk+cli@*' \) \
  -exec rm -rf '{}' '+'

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN pnpm build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Set by docker-publish.yml so the running app can detect newer published
# images. Local source builds leave them empty, disabling the update check.
ARG GIT_COMMIT_SHA=""
ARG IMAGE_REPOSITORY=""
ENV GIT_COMMIT_SHA=${GIT_COMMIT_SHA}
ENV IMAGE_REPOSITORY=${IMAGE_REPOSITORY}

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=web-runtime-deps /app/node_modules ./node_modules
COPY --from=web-runtime-deps /app/package.json ./package.json
COPY --from=builder /app/lib/generated ./lib/generated

EXPOSE 3000
ENV PORT=3000
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && node server.js"]
