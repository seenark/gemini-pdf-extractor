FROM oven/bun AS base
# RUN apt-get update && apt-get install -y curl
WORKDIR /app

FROM base AS deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM deps AS build
COPY . .
RUN bun run build

FROM base AS final
COPY --from=build /app/dist dist

EXPOSE 3000

CMD [ "bun", "run", "/dist/index.js" ]