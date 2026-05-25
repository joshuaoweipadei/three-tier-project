# Stage 1: BUILD
# Compiles TypeScript → JavaScript using the tsconfig in your backend folder
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first for layer caching
COPY package*.json ./

# Install ALL dependencies including devDependencies
# (we need typescript, ts-node-dev, @types/* to compile)
RUN npm ci

# Copy TypeScript config and source code
COPY tsconfig.json ./
COPY src           ./src

# Compile TypeScript to JavaScript → output goes to /app/dist
RUN npx tsc --project tsconfig.json

# Stage 2: PRODUCTION RUNTIME
# Starts fresh — only copies the compiled JS and production dependencies
# No TypeScript compiler, no source code, no dev tools in the final image
FROM node:20-alpine AS runtime

WORKDIR /app

# Set production environment — disables dev-only code paths in Express
ENV NODE_ENV=production

# Security: never run as root
# If a hacker breaks into the container, they get a low-privilege user
# not the root user — they cannot modify system files or escalate privileges
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy only production node_modules from builder
# This excludes all devDependencies — keeps the image small
COPY --from=builder /app/node_modules ./node_modules

# Copy compiled JavaScript output
COPY --from=builder /app/dist         ./dist

# Copy package.json (needed by Node.js to resolve module paths)
COPY package.json ./

# Create the uploads directory for resume files
# Set correct ownership so the non-root user can write to it
RUN mkdir -p uploads && chown -R appuser:appgroup uploads /app

# Switch to the non-root user for all subsequent commands
USER appuser

# Port your backend listens on (matches process.env.PORT in your index.ts)
EXPOSE 5001

# Health check — Kubernetes uses this to route traffic only to healthy pods
# If this fails 3 times in a row, Kubernetes restarts the container
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:5001/health || exit 1

# Start the compiled server — NOT ts-node (that's dev only)
CMD ["node", "dist/index.js"]