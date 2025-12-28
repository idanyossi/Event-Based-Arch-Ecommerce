# --- Builder Stage ---
FROM node:18-alpine AS builder

WORKDIR /app

# 1. Copy package files
COPY package*.json ./

# 2. Install dependencies (Production + Dev)
RUN npm install

# 3. GUARANTEE tsc is in the path by installing it globally
RUN npm install -g typescript

# 4. Copy source code
COPY . .

# 5. Compile the TypeScript code
RUN tsc

# --- Final Stage: Runtime Image ---
FROM node:18-alpine AS final

WORKDIR /app

# Only copy necessary files for execution
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./

# Install only production dependencies (keeps image small)
RUN npm install --only=production

# Copy the compiled JS from the builder stage
COPY --from=builder /app/dist ./dist

# Run the compiled application
CMD ["node", "dist/index.js"]