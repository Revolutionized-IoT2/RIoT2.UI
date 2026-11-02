#!/bin/sh
ROOT_DIR=${ROOT_DIR:-/usr/share/nginx/html}
TEMPLATE_DIR=${TEMPLATE_DIR:-/usr/share/nginx/runtime-templates/assets}
          
# Replace env vars in JavaScript files
echo "Replacing env constants in JS"

keys="VITE_MQTT_SERVER
VITE_MQTT_USER
VITE_MQTT_PASSWORD"

mkdir -p "$TEMPLATE_DIR"

# Keep pristine copies outside the served asset names so container restarts can
# render new environment values instead of rewriting already-substituted files.
for file in "$ROOT_DIR"/assets/index*.js* ;
do
  [ -f "$file" ] || continue
  template="$TEMPLATE_DIR/$(basename "$file")"
  if [ ! -f "$template" ]; then
    cp "$file" "$template"
  fi
done

for template in "$TEMPLATE_DIR"/index*.js* ;
do
  [ -f "$template" ] || continue
  file="$ROOT_DIR/assets/$(basename "$template")"
  cp "$template" "$file"
  echo "Processing $file ...";
  for key in $keys
  do
    value=$(printenv "$key")
    if [ -z "$value" ]; then
      echo "WARNING: $key is empty"
    fi
    escaped_value=$(printf '%s' "$value" | sed 's/[\\#&]/\\&/g')
    echo "replace $key"
    sed -i 's#'"$key"'#'"$escaped_value"'#g' "$file"
  done
done

# The /api and /realtime proxy to the orchestrator (design 7.5). With ORCHESTRATOR_UPSTREAM, for
# example http://orchestrator:8080, the browser reaches the API on the UI's own origin; the UI
# finds it through /api/security/info. Without it, both paths answer 404 and the UI calls the
# orchestrator at the URL in its configuration command, as before.
PROXY_CONF=${PROXY_CONF:-/etc/nginx/riot2/api.conf}
mkdir -p "$(dirname "$PROXY_CONF")"
upstream=$(printf '%s' "${ORCHESTRATOR_UPSTREAM:-}" | sed 's#/*$##')
if [ -z "$upstream" ]; then
  echo "ORCHESTRATOR_UPSTREAM is not set: no /api proxy"
  cat > "$PROXY_CONF" <<'EOF'
location /api/ { return 404; }
location /realtime { return 404; }
EOF
elif ! printf '%s' "$upstream" | grep -Eq '^https?://([A-Za-z0-9._-]+|\[[0-9A-Fa-f:]+\])(:[0-9]+)?$'; then
  echo "ERROR: ORCHESTRATOR_UPSTREAM must be http(s)://host[:port] without a path, for example http://orchestrator:8080" >&2
  exit 1
else
  echo "Proxying /api and /realtime to $upstream"
  # A variable upstream is resolved per request, so nginx starts even before the orchestrator's
  # name resolves; that needs the container's DNS server.
  resolver=$(awk '/^nameserver/ { print $2; exit }' /etc/resolv.conf 2>/dev/null)
  case "$resolver" in *:*) resolver="[$resolver]" ;; esac
  if [ -n "$resolver" ]; then
    target='$riot2_orchestrator'
    preamble="resolver $resolver valid=30s;
set \$riot2_orchestrator $upstream;"
  else
    target="$upstream"
    preamble=""
  fi
  cat > "$PROXY_CONF" <<EOF
$preamble
location /api/ {
  proxy_pass $target;
  proxy_http_version 1.1;
  proxy_set_header Host \$http_host;
  proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto \$scheme;
  proxy_set_header X-Forwarded-Host \$http_host;
  # Backup restores upload up to 64 MB; backups and restores can take a while.
  client_max_body_size 64m;
  proxy_read_timeout 300s;
  add_header Cache-Control "no-store" always;
  add_header X-Content-Type-Options "nosniff" always;
}
location /realtime {
  proxy_pass $target;
  proxy_http_version 1.1;
  proxy_set_header Host \$http_host;
  proxy_set_header Upgrade \$http_upgrade;
  proxy_set_header Connection "upgrade";
  proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto \$scheme;
  proxy_read_timeout 3600s;
}
EOF
fi

echo "Starting Nginx"
if [ "${SKIP_NGINX:-}" = "1" ]; then
  echo "Skipping Nginx start"
  exit 0
fi
nginx -g 'daemon off;'
