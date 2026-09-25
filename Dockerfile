# Build the project
FROM node:22 AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Setup the Nginx server
FROM nginx:alpine
WORKDIR /usr/share/nginx/html
COPY --from=build /app/dist .
COPY entrypoint.sh /entrypoint.sh
COPY nginx.conf /etc/nginx/conf.d/default.conf
RUN mkdir -p /usr/share/nginx/runtime-templates/assets \
    && cp /usr/share/nginx/html/assets/index*.js* /usr/share/nginx/runtime-templates/assets/ \
    && chmod +x /entrypoint.sh
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD wget -q --spider http://localhost/ || exit 1
ENTRYPOINT ["/entrypoint.sh"]

ENV TZ=Europe/Helsinki
ENV VITE_MQTT_SERVER=localhost
ENV VITE_MQTT_USER=
ENV VITE_MQTT_PASSWORD=