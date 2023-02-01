FROM node:16
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . ./
RUN npm i typescript && npx tsc
CMD ["node", "dist/server.js"]