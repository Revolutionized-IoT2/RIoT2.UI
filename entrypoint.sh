#!/bin/sh
# @see https://stackoverflow.com/questions/18185305/storing-bash-output-into-a-variable-using-eval
ROOT_DIR=/usr/share/nginx/html
          
# Replace env vars in JavaScript files
echo "Replacing env constants in JS"

keys="VITE_MQTT_SERVER
VITE_MQTT_USER
VITE_MQTT_PASSWORD"

for file in $ROOT_DIR/assets/index*.js* ;
do
  echo "Processing $file ...";
  for key in $keys
  do
    value=$(eval echo \$$key)
    echo "replace $key by $value"
    sed -i 's#'"$key"'#'"$value"'#g' $file
  done
done

echo "Starting Nginx"
nginx -g 'daemon off;'
