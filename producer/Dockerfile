# --- Builder Stage ---
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# 1. Install dependencies
RUN npm install

# 2. INSTALL TYPESCRIPT GLOBALLY 
# This ensures 'tsc' is in the system PATH regardless of local node_modules issues
RUN npm install -g typescript

# Copy the rest of the source code
COPY . .

# 3. Run build (using the global tsc)
RUN tsc

# --- Final Stage: Runtime Image ---
FROM node:18-alpine AS final

WORKDIR /app

# Copy package files to the final image
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./

# Install ONLY production dependencies
RUN npm install --omit=dev

# Copy the compiled JavaScript from the builder stage
COPY --from=builder /app/dist ./dist

# Run the compiled application
CMD ["node", "dist/index.js"]