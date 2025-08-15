FROM node:18-alpine

# Install dependencies only when needed
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 1337

# Set environment to production
ENV NODE_ENV=production

# Start the application
CMD ["npm", "run", "start:prod"]