FROM node:18-slim

# Install Python, pip, build tools, and Chromium dependencies
RUN apt-get update && apt-get install -y \
    python3 python3-pip build-essential \
    wget ca-certificates fonts-liberation libappindicator3-1 \
    libasound2 libatk-bridge2.0-0 libatk1.0-0 libcups2 \
    libdbus-1-3 libgdk-pixbuf2.0-0 libnspr4 libnss3 libx11-xcb1 \
    libxcomposite1 libxdamage1 libxrandr2 libxss1 libxtst6 \
    xdg-utils libu2f-udev chromium \
    --no-install-recommends \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5001

CMD ["node", "index.js"]

# Note: Ensure that the index.js file is present in the root of your application directory.