FROM node:18-alpine AS builder

# Builder Stage: Installs dependencies and compiles code
WORKDIR /app
COPY package*.json ./
# Install production and development dependencies
RUN npm install

# Copy source code and compile
COPY . .
RUN npm run build 

# --- Final Stage: Runtime Image ---
FROM node:18-alpine AS final

# Set working directory for the final image
WORKDIR /app

# Only copy necessary production files from the builder stage:
# 1. package.json (needed for npm start/scripts and dependencies list)
COPY --from=builder /app/package.json ./

# 2. Re-install only production dependencies (excluding typescript, ts-node, etc.)
RUN npm install --only=production

# 3. Copy the compiled JavaScript output
COPY --from=builder /app/dist ./dist

# Run the compiled application
CMD ["node", "dist/index.js"]