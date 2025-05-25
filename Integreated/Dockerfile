# Use an official Node.js runtime as the base image
FROM node:14-bullseye

# Set environment variables to prevent interactive prompts during installation
ENV DEBIAN_FRONTEND=noninteractive

# Install tshark and other dependencies without interactive prompts
RUN apt-get update && apt-get install -y \
    tshark \
    build-essential \
    python3 \
    && echo "wireshark-common wireshark-common/install-setuid boolean false" | debconf-set-selections \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json before other files
# Utilize Docker cache to save re-installing dependencies if unchanged
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy the rest of the application
COPY . .

# Build the Next.js application
RUN npm run build

# Expose port for the Next.js application
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Start the application
CMD ["npm", "start"]

# Note: This setup assumes that the ML models are running on the host machine.
# The container will communicate with the ML endpoints on the host.
# You may need to use the host.docker.internal DNS name to access the host from inside the container.
# For example: http://host.docker.internal:5001/dos instead of http://localhost:5001/dos 