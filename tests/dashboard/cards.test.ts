// @vitest-environment jsdom
// The dashboard cards as users see them: every sample card renders, values update with reports,
// controls send commands (and don't in the editor's preview), and notes are sanitized.
import { afterEach, describe, expect, test, vi } from 'vitest';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { nextTick, reactive } from 'vue';
import { CardElement, type DashboardCard } from '@/models/dashboard';
import { ValueType } from '@/models/enums';
import { useCommandsStore } from '@/stores/commandsStore';
import CardHost from '@/dashboard/view/CardHost.vue';
import CardGallery from '@/dashboard/editor/CardGallery.vue';
import { cardDefinitions, findCard } from '@/dashboard/sdk/registry';
import { createCard, createElement } from '@/dashboard/sdk/model';
import { plugins } from '../support/mount';

const mounted: VueWrapper[] = [];
afterEach(() => mounted.splice(0).forEach(wrapper => wrapper.unmount()));

/** Mounts a card and waits for its (lazily loaded) component. */
async function show(card: DashboardCard, preview = false) {
  const { vuetify, pinia } = plugins();
  const commands = useCommandsStore(pinia);
  const send = vi.spyOn(commands, 'send').mockResolvedValue(true);
  // Reactive, as the dashboard store's cards are.
  const live = reactive(card) as DashboardCard;
  const wrapper = mount(CardHost, { props: { card: live, preview }, global: { plugins: [vuetify, pinia] }, attachTo: document.body });
  mounted.push(wrapper);
  await vi.waitFor(async () => {
    await flushPromises();
    expect(wrapper.find('.riot-card').exists()).toBe(true);
  }, { timeout: 10000 });
  return { wrapper, send, card: live };
}

function bound(kind: string, type: ValueType, values: unknown[], properties: Record<string, unknown> = {}, command = false): DashboardCard {
  const card = createCard(findCard(kind)!);
  const template = { id: 't', name: 'Thing', node: 'n', device: 'd', type, model: values[0] ?? null };
  const element = createElement(undefined);
  Object.assign(element.properties, properties);
  element.name = 'Thing';
  element.numberOfPreviousReports = 10;
  element.reportTemplate = template as never;
  if (command)
    element.commandTemplate = { ...template, id: 'cmd' } as never;
  element.previousReports = values.map((value, i) => ({ id: 't', value: value as never, timeStamp: 1700000000 + i })).reverse();
  card.elements = [element];
  return card;
}

test('every card in the gallery renders its sample', { timeout: 30000 }, async () => {
  const { vuetify, pinia } = plugins();
  const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
  const wrapper = mount(CardGallery, { global: { plugins: [vuetify, pinia] } });
  mounted.push(wrapper);
  await vi.waitFor(async () => {
    await flushPromises();
    expect(wrapper.findAll('.gallery__item .riot-card')).toHaveLength(cardDefinitions().length);
  }, { timeout: 25000, interval: 100 });
  expect(wrapper.text()).not.toContain('The card failed');
  expect(errors.mock.calls.filter(call => !String(call[0]).includes('chart'))).toEqual([]);
  errors.mockRestore();
});

describe('sensor', () => {
  test('shows the value with its unit and follows new reports', async () => {
    const { wrapper, card } = await show(bound('sensor', ValueType.Number, [20, 21.25], { unit: '°C', digits: 1 }));
    expect(wrapper.find('.sensor__number').text()).toBe(new Intl.NumberFormat(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(21.3));
    expect(wrapper.find('.sensor__unit').text()).toBe('°C');

    card.elements[0].report = { id: 't', value: 19, timeStamp: 1700000100 };
    await nextTick();
    expect(wrapper.find('.sensor__number').text()).toBe(new Intl.NumberFormat(undefined, { minimumFractionDigits: 1 }).format(19));
  });

  test('says when it is not connected to a device', async () => {
    const { wrapper } = await show(createCard(findCard('sensor')!));
    expect(wrapper.text()).toContain('Not connected');
  });
});

describe('controls', () => {
  test('a switch card sends the new position', async () => {
    const card = bound('switch', ValueType.Boolean, [false], {}, true);
    const { wrapper, send } = await show(card);
    await wrapper.find('.riot-card').trigger('click');
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ id: 'cmd' }), true);
    expect(wrapper.find('.riot-card').classes()).toContain('riot-card--active');
  });

  test('buttons send their on and off values', async () => {
    const card = bound('buttons', ValueType.Text, ['off'], { onValue: 'on', offValue: 'off' }, true);
    const { wrapper, send } = await show(card);
    await wrapper.find('.buttons__tile').trigger('click');
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ id: 'cmd' }), 'on');
  });

  test('in the preview, controls send nothing', async () => {
    const card = bound('switch', ValueType.Boolean, [false], {}, true);
    const { wrapper, send } = await show(card, true);
    await wrapper.find('.riot-card').trigger('click');
    expect(send).not.toHaveBeenCalled();
  });
});

describe('forecast', () => {
  test('shows the value now and the range of the forecast', async () => {
    const start = new Date();
    start.setMinutes(0, 0, 0);
    const point = (i: number, value: number | null) => ({
      start: new Date(start.getTime() + i * 3600000).toISOString(), end: new Date(start.getTime() + (i + 1) * 3600000).toISOString(), value,
    });
    const series = { issuedAt: start.toISOString(), kind: 'forecast', unit: '°C', points: [point(0, 2.5), point(1, -1), point(2, null), point(3, 4)] };
    const { wrapper } = await show(bound('forecast', ValueType.Entity, [series]));
    const format = (n: number) => new Intl.NumberFormat(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(n);
    expect(wrapper.find('.forecast__number').text()).toBe(format(2.5));
    expect(wrapper.find('.forecast__range').text()).toBe(`${format(-1)} – ${format(4)} °C`);
  });

  test('waits for a value that is not a forecast', async () => {
    const { wrapper } = await show(bound('forecast', ValueType.Number, [21]));
    expect(wrapper.find('.forecast__number').exists()).toBe(false);
  });
});

test('a note shows Markdown without scripts', async () => {
  const card = createCard(findCard('markdown')!);
  card.settings = { content: '# Hello\n<img src="x" onerror="alert(1)"><script>alert(2)</script>', tone: 'plain' };
  const { wrapper } = await show(card);
  expect(wrapper.find('.note').text()).toContain('Hello');
  expect(wrapper.find('.note [onerror]').exists()).toBe(false);
  expect(wrapper.find('.note script').exists()).toBe(false);
});

test('a card of a kind this UI does not know says so instead of breaking the page', async () => {
  const card = createCard(findCard('sensor')!);
  card.kind = 'from-the-future';
  card.elements = [new CardElement({ id: 'x', name: 'x' })];
  const { wrapper } = await show(card);
  expect(wrapper.text()).toContain('no "from-the-future" card');
});
