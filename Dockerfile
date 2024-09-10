FROM nginx:alpine

RUN chmod -R 777 /var/log/nginx /var/cache/nginx/ \
&& chmod -R 777 /var/run \
&& chmod -R 777 /etc/nginx/*

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]