# syntax=docker/dockerfile:1

FROM oven/bun:1.3.11-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/contracts/package.json packages/contracts/
COPY packages/database/package.json packages/database/
COPY packages/service-kit/package.json packages/service-kit/
COPY tooling/eslint-config/package.json tooling/eslint-config/
COPY tooling/typescript-config/package.json tooling/typescript-config/
COPY services/quotes/package.json services/quotes/
RUN corepack enable && pnpm install --frozen-lockfile --filter @starboard/svc-quotes...

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/services/quotes ./services/quotes
COPY packages/contracts packages/contracts
COPY packages/database packages/database
COPY packages/service-kit packages/service-kit
COPY services/quotes services/quotes
WORKDIR /app
RUN corepack enable \
  && pnpm --filter @starboard/lib-contracts build \
  && pnpm --filter @starboard/lib-service-kit build \
  && pnpm --filter @starboard/lib-db build

FROM oven/bun:1.3.11-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/packages/contracts/dist packages/contracts/dist
COPY --from=build /app/packages/contracts/package.json packages/contracts/
COPY --from=build /app/packages/database/dist packages/database/dist
COPY --from=build /app/packages/database/package.json packages/database/
COPY --from=build /app/packages/service-kit/dist packages/service-kit/dist
COPY --from=build /app/packages/service-kit/package.json packages/service-kit/
COPY --from=build /app/services/quotes services/quotes
COPY --from=build /app/node_modules node_modules
WORKDIR /app/services/quotes
EXPOSE 3102
CMD ["bun", "run", "src/index.ts"]
