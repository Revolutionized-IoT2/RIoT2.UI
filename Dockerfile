# Build the project
FROM node:24 AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Serve it with nginx as the non-root user nginx (UID 101) on port 8080
FROM nginxinc/nginx-unprivileged:alpine
USER root
WORKDIR /usr/share/nginx/html
COPY --from=build /app/dist .
COPY entrypoint.sh /entrypoint.sh
COPY nginx.conf /etc/nginx/conf.d/default.conf
# entrypoint.sh rewrites the bundles on every start, so nginx's user must own them.
RUN mkdir -p /usr/share/nginx/runtime-templates/assets \
    && cp /usr/share/nginx/html/assets/index*.js* /usr/share/nginx/runtime-templates/assets/ \
    && chmod +x /entrypoint.sh \
    && chown -R 101:0 /usr/share/nginx/html /usr/share/nginx/runtime-templates \
    && chmod -R g+w /usr/share/nginx/html /usr/share/nginx/runtime-templates
USER 101
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD wget -q --spider http://127.0.0.1:8080/ || exit 1
ENTRYPOINT ["/entrypoint.sh"]

ENV TZ=Europe/Helsinki
ENV VITE_MQTT_SERVER=localhost
ENV VITE_MQTT_USER=
ENV VITE_MQTT_PASSWORD=