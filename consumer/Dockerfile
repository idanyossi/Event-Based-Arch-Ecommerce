FROM node:18-alpine AS builder

# Builder Stage: Installs dependencies and compiles code
WORKDIR /app
COPY package*.json ./
# Install ALL dependencies (production + development, needed for compilation)
RUN npm install

# Copy source code and compile
COPY . .
# Executes the "build": "tsc" script to create compiled JavaScript in the 'dist' folder
RUN npm run build 

# --- Final Stage: Runtime Image ---
FROM node:18-alpine AS final

# Set working directory for the final image
WORKDIR /app

# Only copy necessary production files from the builder stage:
# 1. package.json (needed for npm install --only=production)
COPY --from=builder /app/package.json ./

# 2. Re-install ONLY production dependencies (this significantly reduces image size)
RUN npm install --only=production

# 3. Copy the compiled JavaScript output
COPY --from=builder /app/dist ./dist

# Run the compiled application (the Consumer service)
CMD ["node", "dist/index.js"]