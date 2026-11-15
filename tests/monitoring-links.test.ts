// The menu's Monitoring links: only http(s) addresses become links, so an empty setting, or a placeholder the
// image's entrypoint didn't replace, shows nothing.
import { expect, test } from 'vitest';
import { monitoringLinks } from '@/composables/monitoringLinks';

test('the tools with an address get a link, in a fixed order', () => {
  const links = monitoringLinks({ prometheus: 'http://192.168.0.37:9090', grafana: ' http://192.168.0.35:3000 ' });

  expect(links.map(l => [l.title, l.url])).toEqual([
    ['Grafana', 'http://192.168.0.35:3000/'],
    ['Prometheus', 'http://192.168.0.37:9090/'],
  ]);
});

test('empty settings, placeholders and other schemes give no link', () => {
  expect(monitoringLinks({})).toEqual([]);
  expect(monitoringLinks({ grafana: '', influxdb: 'VITE_INFLUXDB_URL', prometheus: 'javascript:alert(1)' })).toEqual([]);
});
