export const mqttServer = import.meta.env.VITE_MQTT_SERVER
export const mqttUser = import.meta.env.VITE_MQTT_USER
export const mqttPassword = import.meta.env.VITE_MQTT_PASSWORD

// Optional links in the menu's Monitoring group (composables/monitoringLinks.ts).
export const monitoringUrls = {
    grafana: import.meta.env.VITE_GRAFANA_URL as string | undefined,
    influxdb: import.meta.env.VITE_INFLUXDB_URL as string | undefined,
    prometheus: import.meta.env.VITE_PROMETHEUS_URL as string | undefined,
}

export default {
    mqttServer,
    mqttUser,
    mqttPassword
}