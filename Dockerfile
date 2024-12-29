# Build the project
FROM node:22 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Setup the Nginx server
FROM nginx:alpine
WORKDIR /usr/share/nginx/html
COPY --from=build /app/dist .
COPY entrypoint.sh /entrypoint.sh
COPY .env /.env
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]

ENV TZ=Europe/Helsinki
ENV VITE_MQTT_SERVER=192.168.0.30
ENV VITE_MQTT_USER=USER
ENV VITE_MQTT_PASSWORD=password