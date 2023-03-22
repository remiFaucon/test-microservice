FROM node:16
WORKDIR /app
COPY package.json ./
RUN npm install
COPY server.ts ./server.ts
COPY superschema.graphql ./superschema.graphql
COPY tsconfig.json ./tsconfig.json
RUN npm i -g typescript && npx tsc
EXPOSE 4000
CMD ["node", "dist/server.js"]