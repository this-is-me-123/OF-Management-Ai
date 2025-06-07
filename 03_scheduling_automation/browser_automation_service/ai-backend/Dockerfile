# Use an official Node.js runtime as a parent image
FROM node:18

# Set the working directory in the container
WORKDIR /usr/src/app

# Install Google Chrome and other dependencies needed for Puppeteer
# This is a common set of dependencies for Debian-based systems (like the node:18 image)
RUN apt-get update && apt-get install -y \
    gconf-service \
    libasound2 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgcc1 \
    libgconf-2-4 \
    libgdk-pixbuf2.0-0 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    ca-certificates \
    fonts-liberation \
    libappindicator1 \
    libnss3 \
    lsb-release \
    xdg-utils \
    wget \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Copy package.json and package-lock.json (or npm-shrinkwrap.json) to the working directory
COPY package*.json ./

# Install project dependencies
# Using --system-libs to prevent Puppeteer from downloading its own Chromium, 
# as we are providing it via apt-get. This might not always be necessary or the best approach
# depending on the exact Puppeteer version and base image. 
# For now, let's try a standard install and let Puppeteer download its version.
RUN npm install

# If you are using a private npm registry, you might need to copy .npmrc here
# COPY .npmrc ./

# Bundle app source
# Copy application source code
COPY ./ads ./ads
COPY ./analytics ./analytics
COPY ./automationWorker.js ./automationWorker.js
COPY ./chat ./chat
COPY ./crm ./crm
COPY ./openaiService.js ./openaiService.js
COPY ./proxy ./proxy
COPY ./scheduler.js ./scheduler.js
COPY ./server.js ./server.js
COPY ./supabase_integration.js ./supabase_integration.js
COPY ./testAdFeatures.js ./testAdFeatures.js
COPY ./testCrmFeatures.js ./testCrmFeatures.js
COPY ./utils ./utils

# Puppeteer needs this environment variable to find the installed Chrome/Chromium
# This might not be needed if Puppeteer downloads its own browser version during npm install.
# ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# The CMD will be specified in docker-compose.yml for each service
# For example: CMD [ "node", "server.js" ]

# Expose the port the app runs on (for the server)
EXPOSE 8080
