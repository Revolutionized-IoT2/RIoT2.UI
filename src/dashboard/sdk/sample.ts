import { CardElement, type DashboardCard } from '@/models/dashboard';
import { ValueType } from '@/models/enums';
import type { ReportTemplate } from '@/models/reportTemplate';
import type CommandTemplate from '@/models/commandTemplate';
import type { ValueSchema } from '@/models/valueSchema';
import { createCard, newId } from './model';
import type { AnyCardDefinition } from './types';

function valueType(schema: ValueSchema | undefined): ValueType {
  switch (schema?.type) {
    case 'boolean': return ValueType.Boolean;
    case 'number': case 'integer': return ValueType.Number;
    case 'object': return ValueType.Entity;
    case 'array': return ValueType.TextArray;
    default: return ValueType.Text;
  }
}

/**
 * A card of the kind filled with its sample data, for the card gallery: templates that exist only
 * here, and reports five minutes apart ending now.
 */
export function sampleCard(definition: AnyCardDefinition, now = Date.now()): DashboardCard {
  const card = createCard(definition);
  const sample = definition.sample;
  card.name = sample?.name ?? definition.title;
  card.icon = sample?.icon ?? null;
  card.settings = { ...card.settings, ...(sample?.settings ?? {}) };
  card.elements = (sample?.elements ?? []).map(element => {
    const id = newId();
    const template = { id, name: element.name, node: 'Sample', device: 'Sample', nodeId: '', deviceId: '', address: '', type: valueType(element.schema), schema: element.schema, model: element.values[0] ?? null, maintainHistory: true };
    const reports = element.values.map((value, i) => ({ id, value, timeStamp: Math.floor(now / 1000) - (element.values.length - 1 - i) * 300 })).reverse();
    return new CardElement({
      id: newId(),
      name: element.name,
      icon: element.icon,
      properties: { ...(element.properties ?? {}) },
      numberOfPreviousReports: Math.max(1, reports.length),
      reportTemplate: template as unknown as ReportTemplate,
      commandTemplate: element.command ? template as unknown as CommandTemplate : undefined,
      previousReports: reports,
    });
  });
  return card;
}
