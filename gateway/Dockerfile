FROM node:16
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . ./
#RUN npm i -g typescript && npx tsc
CMD ["node", "dist/server.js"]