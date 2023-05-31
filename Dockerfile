FROM node:lts-slim AS base
RUN npm install -g pnpm

FROM base AS deps

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app

COPY . .
COPY --from=deps /app/node_modules ./node_modules

RUN pnpm build

FROM base AS runner
ENV NODE_ENV=production

ENV TOKEN=
ENV API_KEY=

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/dist ./dist
COPY package.json ./

CMD ["npm", "start"]
