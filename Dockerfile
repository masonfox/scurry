FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn --frozen-lockfile

FROM node:24-alpine AS builder
WORKDIR /app
ARG APP_QB_URL
ENV APP_QB_URL=$APP_QB_URL
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN yarn build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ARG APP_QB_URL
ENV APP_QB_URL=$APP_QB_URL
# Add bash and su-exec for entrypoint
RUN apk add --no-cache bash su-exec
# Create app user (will be modified by entrypoint based on PUID/PGID)
RUN addgroup -S app && adduser -S app -G app
# Create secrets and config directories (ownership fixed by entrypoint)
RUN mkdir -p secrets config
# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
EXPOSE 3000

# Healthcheck: ping the /api/health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
	CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Set entrypoint and default command
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["yarn", "start"]
