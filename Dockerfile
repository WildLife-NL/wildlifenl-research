FROM nginx:alpine

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]