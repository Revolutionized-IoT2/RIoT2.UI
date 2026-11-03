// Reading card elements (src/dashboard/sdk/reading.ts, values.ts) and device capability discovery
// (capabilities.ts): what a value is, declared by its plugin or inferred from its template.
import { describe, expect, test } from 'vitest';
import { CardElement } from '@/models/dashboard';
import { ValueType } from '@/models/enums';
import type { JsonValue } from '@/models/generated/contracts';
import { isOn, readElement, switchValue } from '@/dashboard/sdk/reading';
import { formatNumber, resolveSetting, toBoolean, toNumber, trend } from '@/dashboard/sdk/values';
import { defaultMember, inferSchema, memberOptions, schemaAt, templateSchema } from '@/dashboard/sdk/capabilities';

const element = (type: ValueType, values: JsonValue[], properties: Record<string, JsonValue> = {}, extra: Record<string, unknown> = {}) => new CardElement({
  id: 'e', name: 'Reading', properties, numberOfPreviousReports: 10,
  reportTemplate: { id: 'r', name: 'Reading', type, ...extra } as never,
  // Newest first, as the orchestrator sends them.
  previousReports: values.map((value, i) => ({ id: 'r', value, timeStamp: 1700000000 + i * 60 })).reverse(),
});

describe('reading an element', () => {
  test('an entity report shows its member, and settings can read other members', () => {
    const e = element(ValueType.Entity, [{ temperature: 20.5, precision: 1, unit: 'C' }, { temperature: 21, precision: 1, unit: 'C' }]);
    const reading = readElement(e, { member: 'temperature', unit: '{unit}', digits: '{precision}' });
    expect(reading.number).toBe(21);
    expect(reading.unit).toBe('C');
    expect(reading.setting('digits')).toBe(1);
    expect(reading.history.map(point => point.number)).toEqual([20.5, 21]);
    expect(reading.updated).toEqual(new Date(1700000060 * 1000));
  });

  test('a missing member or a value that is no number reads as NaN, not as an error', () => {
    const reading = readElement(element(ValueType.Entity, [{ temperature: 3 }, {}]), { member: 'temperature' });
    expect(reading.hasValue).toBe(false);
    expect(reading.number).toBeNaN();
    expect(formatNumber(reading.number, 1)).toBe('–');
  });

  test('without a report template the element is not bound', () => {
    expect(readElement(new CardElement({ id: 'x', name: 'x' }), {}).bound).toBe(false);
  });

  test('a new report becomes the newest history entry, once', () => {
    const e = element(ValueType.Number, [1, 2]);
    e.report = { id: 'r', value: 3, timeStamp: 1700000500 };
    e.report = { id: 'r', value: 3, timeStamp: 1700000500 };
    expect(readElement(e, {}).history.map(point => point.number)).toEqual([1, 2, 3]);
  });

  test('a button is on when its report equals its on value, or is true', () => {
    const text = element(ValueType.Text, ['armed']);
    expect(isOn(readElement(text, {}), { onValue: 'armed' })).toBe(true);
    expect(isOn(readElement(element(ValueType.Number, [1]), {}), { onValue: 2 })).toBe(false);
    expect(isOn(readElement(element(ValueType.Boolean, [true]), {}), {})).toBe(true);
    expect(isOn(readElement(element(ValueType.Entity, [{ red: 1 }]), {}), { onValue: { red: 1 } })).toBe(true);
  });

  test('a switch sends true and false to a boolean command, else its on and off values', () => {
    const bool = new CardElement({ id: 'b', name: 'b', commandTemplate: { id: 'c', type: ValueType.Boolean } as never });
    const text = new CardElement({ id: 't', name: 't', commandTemplate: { id: 'c', type: ValueType.Text } as never });
    expect(switchValue(bool, { onValue: 'x' }, true)).toBe(true);
    expect(switchValue(text, { onValue: 'ON', offValue: 'OFF' }, false)).toBe('OFF');
    expect(switchValue(text, {}, true)).toBe(true);
  });
});

describe('values', () => {
  test('booleans from words and numbers', () => {
    expect([true, 'on', 'Open', 1, '1', 'detected'].map(v => toBoolean(v))).toEqual([true, true, true, true, true, true]);
    expect([false, 'off', 'closed', 0, 'clear'].map(v => toBoolean(v))).toEqual([false, false, false, false, false]);
    expect(toBoolean('maybe')).toBeUndefined();
  });

  test('numbers from text, and "{member}" settings', () => {
    expect(toNumber('21.5')).toBe(21.5);
    expect(toNumber('')).toBeNaN();
    expect(resolveSetting('{a.b}', { a: { b: 2 } })).toBe(2);
    expect(resolveSetting('°C', { a: 1 })).toBe('°C');
  });

  test('trend', () => {
    expect(trend([1, 2, 3, 4, 5])).toBe('up');
    expect(trend([5, 4, 3, 2, 1])).toBe('down');
    expect(trend([3, 3, 3, 3])).toBe('flat');
    expect(trend([1, 2])).toBeUndefined();
  });

  test('decimals are clamped', () => {
    expect(formatNumber(1.23456, 200, 'en')).toBe('1.234560');
    expect(formatNumber(2, 0, 'en')).toBe('2');
  });
});

describe('capability discovery', () => {
  test('an entity model is inferred member by member, with meanings and units from the names', () => {
    const schema = inferSchema(ValueType.Entity, { temperature: 21.5, humidity: 40, motion: false, name: 'x' });
    expect(schema.type).toBe('object');
    expect(schema.properties?.temperature).toEqual({ type: 'number', semantic: 'temperature', unit: '°C' });
    expect(schema.properties?.humidity).toMatchObject({ type: 'integer', semantic: 'humidity', unit: '%' });
    expect(schema.properties?.motion).toMatchObject({ type: 'boolean', semantic: 'motion' });
    expect(memberOptions(schema, ['number']).map(option => option.path)).toEqual(['temperature', 'humidity']);
    expect(defaultMember(schema, ['number'])).toBe('temperature');
  });

  test('a declared schema wins, and what it leaves out is inferred', () => {
    const schema = templateSchema({
      name: 'Climate', type: ValueType.Entity, model: { t: 1, h: 2 },
      schema: { type: 'object', properties: { t: { unit: 'K', minimum: 0, maximum: 400 } } },
    });
    expect(schemaAt(schema, 't')).toEqual({ type: 'integer', unit: 'K', minimum: 0, maximum: 400 });
    expect(schemaAt(schema, 'h')).toEqual({ type: 'integer' });
  });

  test('a booleans name does not make it a temperature', () => {
    expect(inferSchema(ValueType.Boolean, true, 'Temperature alarm')).toEqual({ type: 'boolean' });
    expect(inferSchema(ValueType.Boolean, true, 'Hall motion')).toEqual({ type: 'boolean', semantic: 'motion', unit: undefined });
  });
});
