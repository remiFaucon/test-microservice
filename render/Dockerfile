FROM node:16
WORKDIR /app
COPY package.json ./
RUN npm i && npm install -g @angular/cli
COPY . ./
COPY ../localhost.crt ../localhost.pem ./
CMD ["ng", "serve", "--ssl", "--ssl-key", "../localhost.key", "--ssl-cert", "../localhost.crt"]
