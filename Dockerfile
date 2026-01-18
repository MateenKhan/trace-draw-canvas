# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source code
COPY . .

# Build the application (Vite produces 'dist' folder)
RUN npm run build

# Stage 2: Runtime
FROM node:20-alpine AS runner
WORKDIR /app

# Install 'serve' to host the static files
RUN npm install -g serve

# Copy built assets from builder stage
COPY --from=builder /app/dist ./dist

# Set environment variables
ENV NODE_ENV production
ENV PORT 3011

# Expose port (Coolify expects this)
EXPOSE 3011

# Start the static server (SPA mode with -s)
CMD ["serve", "-s", "dist", "-l", "3011"]
