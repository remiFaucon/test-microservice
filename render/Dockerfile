FROM node:16
WORKDIR /app
COPY package.json ./
RUN npm i && npm install -g @angular/cli
COPY . ./
CMD ["ng", "serve", "--ssl", "--ssl-key", "localhost.key", "--ssl-cert", "localhost.crt"]
