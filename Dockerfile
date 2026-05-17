# Base lightweight Alpine image
FROM node:20-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package descriptors 
COPY package*.json ./

# Install ONLY production dependencies
RUN npm ci --only=production

# Copy over application source code
COPY . .

# Expose backend port
EXPOSE 5000

# Specify environment vars mapping
ENV NODE_ENV=production
ENV PORT=5000

# Start server
CMD ["node", "server.js"]
