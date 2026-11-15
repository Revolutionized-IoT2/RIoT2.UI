/**
 * Links to the monitoring tools that run next to RIoT2 (Grafana, InfluxDB, Prometheus), from the image's
 * VITE_GRAFANA_URL, VITE_INFLUXDB_URL and VITE_PROMETHEUS_URL. A tool without an http(s) address has no link:
 * the setting is empty, or the bundle still holds the placeholder the image's entrypoint replaces.
 */
export interface MonitoringLink {
  title: string;
  icon: string;
  url: string;
}

export interface MonitoringUrls {
  grafana?: string;
  influxdb?: string;
  prometheus?: string;
}

const tools: (Omit<MonitoringLink, 'url'> & { key: keyof MonitoringUrls })[] = [
  { key: 'grafana', title: 'Grafana', icon: 'mdi-chart-box-outline' },
  { key: 'influxdb', title: 'InfluxDB', icon: 'mdi-database-outline' },
  { key: 'prometheus', title: 'Prometheus', icon: 'mdi-fire' },
];

function httpUrl(value: string | undefined): string | null {
  const text = value?.trim();
  if (!text)
    return null;
  try {
    const url = new URL(text);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}

export function monitoringLinks(urls: MonitoringUrls): MonitoringLink[] {
  return tools.flatMap(({ key, title, icon }) => {
    const url = httpUrl(urls[key]);
    return url ? [{ title, icon, url }] : [];
  });
}
