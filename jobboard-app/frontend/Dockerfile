# Stage 1: BUILD
# Uses Node.js to install dependencies and compile the React app with Vite
# The output is a folder of plain HTML, CSS, and JS files
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first — Docker caches this layer
# If package.json hasn't changed, it won't re-run npm ci on the next build
COPY package*.json ./

# npm ci = clean install — faster and more reliable than npm install in CI/CD
RUN npm ci

# Copy the rest of the source code
COPY . .

# VITE_API_URL is passed in at build time via --build-arg
# In production, this is empty because nginx proxies /api to the backend
# This means the frontend doesn't need to know the backend's URL at runtime
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL

# Build the React app — output goes to /app/dist
RUN npm run build

# Stage 2: SERVE
# Starts fresh with a tiny Nginx image — no Node.js, no source code
# Only the compiled /dist files get copied in
# Final image is ~25MB instead of ~400MB
FROM nginx:1.25-alpine AS runtime

# Remove the default Nginx config — we replace it with our own
RUN rm /etc/nginx/conf.d/default.conf

# Copy compiled React files from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy our custom nginx config (handles React Router + API proxy + WebSocket)
COPY nginx.conf /etc/nginx/conf.d/app.conf

# Port 80 is what Kubernetes will route traffic to
EXPOSE 80

# Health check — Kubernetes uses this to know if the container is alive
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost/health || exit 1

# Start Nginx in the foreground (daemon off = required for Docker)
CMD ["nginx", "-g", "daemon off;"]