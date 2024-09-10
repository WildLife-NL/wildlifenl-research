FROM node:20.17.0-alpine AS build 

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --production

COPY . .

RUN npm run build

FROM nginx:alpine

RUN chmod -R 777 /var/log/nginx /var/cache/nginx/ \
&& chmod -R 777 /var/run \
&& chmod -R 777 /etc/nginx/*

COPY --from=build /usr/src/app/build /usr/share/nginx/html

COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]