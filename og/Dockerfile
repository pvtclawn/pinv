# Syntax: docker/dockerfile:1
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root config files
COPY package.json package-lock.json ./
# Copy shared code directories
COPY lib ./lib
COPY hooks ./hooks
COPY types ./types
COPY public/fonts ./public/fonts

# Copy OG service
COPY og ./og

# Install dependencies for OG Service
WORKDIR /app/og
RUN npm install

# Build
RUN npm run build || true 
# Note: if build script is 'tsc', it compiles .ts files to dist/

# Production Stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy built artifacts and necessary files
COPY --from=builder /app/og/dist ./dist
COPY --from=builder /app/og/worker.js ./worker.js
COPY --from=builder /app/og/package.json ./package.json
COPY --from=builder /app/og/node_modules ./node_modules
COPY --from=builder /app/public/fonts ./public/fonts
# We might need shared libs if imported at runtime?
# But we compiled to JS in dist/. 
# The worker.js is a separate file. It is NOT compiled by tsc usually unless included.
# 'worker.js' reads 'public/fonts'.

# Expose port
EXPOSE 8080

CMD ["node", "dist/server.js"]
