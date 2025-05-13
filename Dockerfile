FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5500

CMD ["node", "backend/server-docker.js"]