FROM node:20-alpine

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm ci --save-dev

# Copy source code
COPY src ./src
COPY tsconfig.json ./

# Build TypeScript
RUN npm run build

# Expose ports
EXPOSE 3001 9091

# Start application
CMD ["npm", "start"]
