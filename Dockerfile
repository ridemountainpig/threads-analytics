FROM node:24.21.0-alpine AS base
RUN npm install -g pnpm@10.29.3

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts

# The server runs from Next's standalone output, which already carries every
# module it imports. The only other code the image runs is `prisma migrate
# deploy` on startup, so this stage reinstalls just the Prisma CLI and dotenv
# (prisma.config.ts imports it) from the same lockfile and store, instead of
# shipping every production dependency. Rebuilding @prisma/engines downloads
# the schema engine now, at build time; without it the CLI would fetch the
# engine from binaries.prisma.sh on every container start.
FROM deps AS migrate-deps
# A fresh directory, so node_modules holds only this install (reinstalling in
# /app would leave every other package in its virtual store).
WORKDIR /migrate
RUN cp /app/pnpm-lock.yaml /app/pnpm-workspace.yaml . && node -e ' \
  const fs = require("node:fs"); \
  const pkg = JSON.parse(fs.readFileSync("/app/package.json", "utf8")); \
  const all = { ...pkg.dependencies, ...pkg.devDependencies }; \
  pkg.dependencies = { prisma: all.prisma, dotenv: all.dotenv }; \
  delete pkg.devDependencies; \
  fs.writeFileSync("package.json", JSON.stringify(pkg, null, 2)); \
  '
RUN pnpm install --prod --offline --ignore-scripts && pnpm rebuild @prisma/engines

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
# Standalone output traces the token guide files the server reads from public/;
# drop that partial copy so the runner's full public/ layer is the only one.
RUN pnpm build && rm -rf .next/standalone/public

# The runtime needs Node only, not pnpm, so it starts from the plain image.
FROM node:24.21.0-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Set by docker-publish.yml so the running app can detect newer published
# images. Local source builds leave them empty, disabling the update check.
ARG GIT_COMMIT_SHA=""
ARG IMAGE_REPOSITORY=""
ENV GIT_COMMIT_SHA=${GIT_COMMIT_SHA}
ENV IMAGE_REPOSITORY=${IMAGE_REPOSITORY}

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=migrate-deps /migrate/node_modules ./node_modules

EXPOSE 3000
ENV PORT=3000
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && node server.js"]
