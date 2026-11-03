// @vitest-environment jsdom
// The AI access page (ADR 0018): it shows how clients connect, saves the tool policy, and lists the activity.
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import type { McpConfiguration, McpStatus } from '@/models/mcp';
import { plugins } from '../support/mount';

const api = vi.hoisted(() => ({
  getStatus: vi.fn(),
  getConfiguration: vi.fn(),
  saveConfiguration: vi.fn(),
  getActivity: vi.fn(),
}));
vi.mock('@/composables/api/mcpApi', () => ({ useMcpApi: () => api }));
vi.mock('@/composables/api/templateApi', () => ({
  useTemplateApi: () => ({
    getReportTemplates: async () => [],
    getVariableTemplates: async () => [],
    getCommandTemplates: async () => [{ id: 'lamp', name: 'Lamp', node: 'Upstairs', device: 'Hue' }],
  }),
}));

const { default: AiAccessView } = await import('@/views/AiAccessView.vue');

const status = (remote: boolean): McpStatus => ({
  enabled: true,
  localUrl: 'http://riot:8080/mcp',
  remote: remote
    ? { enabled: true, auth: 'cloudflare-access', port: 8081, publicUrl: 'https://riot.example.com/mcp', maxRole: 'Operator', subjectsRestricted: true }
    : { enabled: false, auth: 'none', port: null, publicUrl: null, maxRole: 'Operator', subjectsRestricted: false },
  groups: [{ id: 'read', role: 'Viewer' }, { id: 'commands', role: 'Operator' }, { id: 'admin', role: 'Admin' }],
  tools: [{ name: 'list_values', group: 'read', role: 'Viewer', write: false }, { name: 'send_command', group: 'commands', role: 'Operator', write: true }],
});
const configuration = (): McpConfiguration => ({ localEnabled: true, remoteEnabled: true, groups: ['read'], allowedCommands: [], writesPerMinute: 10 });

const mounted: VueWrapper[] = [];
afterEach(() => mounted.splice(0).forEach(wrapper => wrapper.unmount()));

beforeEach(() => {
  api.getStatus.mockReset().mockResolvedValue(status(true));
  api.getConfiguration.mockReset().mockResolvedValue(configuration());
  api.saveConfiguration.mockReset().mockImplementation(async (sent: McpConfiguration) => sent);
  api.getActivity.mockReset().mockResolvedValue([
    { time: '2026-11-03T18:00:00Z', listener: 'remote', user: 'me@example.com', tool: 'send_command', target: 'lamp', outcome: 'denied', durationMs: 1, error: 'No commands are allowed.' },
  ]);
});

async function show() {
  const { vuetify, pinia } = plugins();
  const wrapper = mount(AiAccessView, { global: { plugins: [vuetify, pinia] }, attachTo: document.body });
  mounted.push(wrapper);
  await vi.waitFor(async () => {
    await flushPromises();
    expect(wrapper.text()).toContain('me@example.com');
  });
  return wrapper;
}

test('the page shows both URLs, the tool groups with their tools, and the activity', async () => {
  const wrapper = await show();
  const text = wrapper.text();

  const urls = wrapper.findAll('input').map(input => (input.element as HTMLInputElement).value);
  expect(urls).toContain('http://riot:8080/mcp');
  expect(urls).toContain('https://riot.example.com/mcp');
  expect(text).toContain('Cloudflare Access');
  expect(text).toContain('only the listed users may connect');
  expect(text).toContain('send_command');
  expect(text).toContain('No commands are allowed.');
});

test('without a remote listener the page explains how to add one', async () => {
  api.getStatus.mockResolvedValue(status(false));
  const wrapper = await show();

  expect(wrapper.text()).toContain('Remote access is off');
});

test('a changed group is saved in the catalog order', async () => {
  const wrapper = await show();
  const save = () => wrapper.findAll('button').find(button => button.text().includes('Save'))!;
  expect(save().attributes('disabled')).toBeDefined();

  await wrapper.find('input[aria-label="Commands"]').setValue(true);
  await flushPromises();
  expect(save().attributes('disabled')).toBeUndefined();
  await save().trigger('click');
  await flushPromises();

  expect(api.saveConfiguration).toHaveBeenCalledTimes(1);
  expect(api.saveConfiguration.mock.calls[0][0].groups).toEqual(['read', 'commands']);
});
