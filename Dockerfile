# Builds React app
FROM node:20.17.0-alpine AS build

# Sets the working directory
WORKDIR /usr/src/app

# Copies the package.json and package-lock.json
COPY package*.json ./

# Installs dependencies
RUN npm ci --production

# Copy the rest of the application code
COPY . .

# Builds the React application for production
RUN npm run build

# Serves the app with Nginx
FROM nginx:alpine

# Create necessary directories and set permissions
RUN mkdir -p /var/cache/nginx /var/run /tmp/nginx /var/cache/nginx/client_temp \
    && chown -R 1001:0 /var/cache/nginx /var/run /tmp/nginx /usr/share/nginx/html /etc/nginx

# Copies the build output from the previous stage
COPY --from=build /usr/src/app/build /usr/share/nginx/html

# Copies the custom Nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 8080 for OpenShift (non-root)
EXPOSE 8080

# Start Nginx server
CMD ["nginx", "-g", "daemon off;"]
