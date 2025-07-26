FROM node:18-bullseye

# Install build tools for native modules AND puppeteer dependencies
RUN apt-get update && \
    apt-get install -y build-essential python3 \
    # Puppeteer dependencies:
    ca-certificates fonts-liberation libappindicator3-1 libasound2 libatk-bridge2.0-0 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 lsb-release wget xdg-utils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./

# Ensure Puppeteer downloads Chromium and uses a cache dir within /app
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false
ENV PUPPETEER_CACHE_DIR=/app/.cache/puppeteer

RUN npm install --build-from-source=better-sqlite3

# Explicitly install the browser to the configured cache directory
RUN npx puppeteer browsers install chrome

EXPOSE 3001
COPY . .
CMD ["npm", "start"]
