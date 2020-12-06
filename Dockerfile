FROM node:14.15.1-alpine
COPY package* ./
RUN npm ci
COPY . ./
CMD npm start