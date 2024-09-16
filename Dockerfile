FROM node:22.8-alpine AS base

RUN npm install -g pnpm

FROM base AS builder

RUN apk add --no-cache rsync

WORKDIR /usr/repo

COPY package*.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm run generate

RUN pnpm run build

RUN pnpm prune --prod

FROM base AS runner

ENV NODE_PATH=/app

WORKDIR /app

COPY --from=builder /usr/repo/node_modules ./node_modules

COPY --from=builder --chown=node:node /usr/repo/build .

COPY --chown=node:node package*.json pnpm-lock.yaml ./

USER node

CMD ["node", "index.js"]
