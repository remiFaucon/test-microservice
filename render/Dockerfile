FROM node:16
WORKDIR /app
COPY package.json ./
RUN npm i && npm install -g @angular/cli
COPY . ./
#RUN openssl req -new -x509 -newkey rsa:2048 -sha256 -nodes -keyout localhost.key -days 3560 -out localhost.crt -config ssl.conf
CMD ["ng", "serve", "--host", "0.0.0.0"]
