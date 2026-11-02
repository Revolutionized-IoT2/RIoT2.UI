# Build the project
FROM node:24@sha256:e7add2a490bb17d97b485b8641bd88455fff7839ade0f5eba493c3508124d413 AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Serve it with nginx as the non-root user nginx (UID 101) on port 8080
FROM nginxinc/nginx-unprivileged:alpine@sha256:b5047b9b76845eac124358373c6852377c52e4b05834a47647e955dd91cb8f1e
USER root
WORKDIR /usr/share/nginx/html
COPY --from=build /app/dist .
COPY entrypoint.sh /entrypoint.sh
COPY nginx.conf /etc/nginx/conf.d/default.conf
# entrypoint.sh rewrites the bundles on every start, so nginx's user must own them.
# It also writes the /api proxy configuration (ORCHESTRATOR_UPSTREAM) into /etc/nginx/riot2.
RUN mkdir -p /usr/share/nginx/runtime-templates/assets /etc/nginx/riot2 \
    && cp /usr/share/nginx/html/assets/index*.js* /usr/share/nginx/runtime-templates/assets/ \
    && chmod +x /entrypoint.sh \
    && chown -R 101:0 /usr/share/nginx/html /usr/share/nginx/runtime-templates /etc/nginx/riot2 \
    && chmod -R g+w /usr/share/nginx/html /usr/share/nginx/runtime-templates /etc/nginx/riot2
USER 101
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD wget -q --spider http://127.0.0.1:8080/ || exit 1
ENTRYPOINT ["/entrypoint.sh"]

ENV TZ=Europe/Helsinki
ENV VITE_MQTT_SERVER=localhost
ENV VITE_MQTT_USER=
ENV VITE_MQTT_PASSWORD=
# The orchestrator for the /api and /realtime proxy, for example http://orchestrator:8080; empty: no proxy.
ENV ORCHESTRATOR_UPSTREAM=