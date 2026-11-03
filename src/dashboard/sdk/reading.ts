import type { CardElement } from '@/models/dashboard';
import { ValueType } from '@/models/enums';
import type { JsonValue } from '@/models/generated/contracts';
import type { ValueSchema } from '@/models/valueSchema';
import { schemaAt, templateSchema } from './capabilities';
import { memberValue, reportTime, resolveSetting, sameValue, toBoolean, toNumber, toText } from './values';
import type { Settings } from './types';

export type HistoryPoint = { time: Date, value: JsonValue | undefined, number: number };

/** What a card shows of one element: its value (the chosen member of the report), as each type. */
export interface ElementReading {
  element?: CardElement;
  /** The element has a report (or variable) template. */
  bound: boolean;
  /** A report has arrived, or was in the history. */
  hasValue: boolean;
  value: JsonValue | undefined;
  number: number;
  boolean: boolean | undefined;
  text: string;
  /** The schema of the value: the member's, when the report is an entity. */
  schema?: ValueSchema;
  /** The unit setting, else the schema's unit. */
  unit: string;
  updated?: Date;
  /** Oldest first. */
  history: HistoryPoint[];
  /** A setting, read from the report when it is "{member}". */
  setting: (key: string) => JsonValue | undefined;
}

/** Reads an element with its settings (`member`, `unit`); see ElementReading. */
export function readElement(element: CardElement | undefined, settings: Settings): ElementReading {
  const report = element?.report;
  const member = settings.member;
  const reportValue = report?.value;
  const value = report == null ? undefined : memberValue(reportValue, member);
  const schema = schemaAt(templateSchema(element?.reportTemplate), member);
  const setting = (key: string) => resolveSetting(settings[key], reportValue);
  const unit = setting('unit');
  return {
    element,
    bound: element?.reportTemplate != null,
    hasValue: value !== undefined,
    value,
    number: toNumber(value),
    boolean: toBoolean(value),
    text: toText(value),
    schema,
    unit: unit == null || unit === '' ? schema?.unit ?? '' : String(unit),
    updated: reportTime(report?.timeStamp),
    history: (element?.previousReportsAsc ?? []).map(entry => {
      const point = memberValue(entry.value, member);
      return { time: reportTime(entry.timeStamp)!, value: point, number: toNumber(point) };
    }),
    setting,
  };
}

/** Whether the element's command takes true and false, rather than its on and off values. */
export function commandIsBoolean(element: CardElement | undefined): boolean {
  const template = element?.commandTemplate;
  if (template == null)
    return false;
  return templateSchema(template)?.type === 'boolean' || template.type === ValueType.Boolean;
}

/** The value to send to turn an element on or off: true and false, or its `onValue` and `offValue`. */
export function switchValue(element: CardElement | undefined, settings: Settings, on: boolean): JsonValue {
  if (commandIsBoolean(element))
    return on;
  const configured = on ? settings.onValue : settings.offValue;
  return configured === undefined || configured === null || configured === '' ? on : configured;
}

/**
 * Whether an element is on, from its report: a boolean-like value, else whether the value equals the
 * element's `onValue`. Undefined before the first report.
 */
export function isOn(reading: ElementReading, settings: Settings): boolean | undefined {
  if (!reading.hasValue)
    return undefined;
  const onValue = settings.onValue;
  if (onValue !== undefined && onValue !== null && onValue !== '' && typeof onValue !== 'boolean')
    return sameValue(reading.value, onValue) || (reading.element?.report != null && sameValue(reading.element.report.value, onValue));
  return reading.boolean;
}
