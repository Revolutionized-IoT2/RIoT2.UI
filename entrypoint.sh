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

echo "Starting Nginx"
if [ "${SKIP_NGINX:-}" = "1" ]; then
  echo "Skipping Nginx start"
  exit 0
fi
nginx -g 'daemon off;'
