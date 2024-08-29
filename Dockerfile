FROM node:22.1.0

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

CMD [ "node", "." ]