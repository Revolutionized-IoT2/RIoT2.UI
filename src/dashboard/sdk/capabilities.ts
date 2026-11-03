import { ValueType } from '@/models/enums';
import type { JsonValue } from '@/models/generated/contracts';
import type { ITemplate } from '@/models/itemplate';
import type { SchemaType, Semantic, ValueSchema } from '@/models/valueSchema';
import { isJsonObject } from '@/composables/jsonValue';
import { memberPath } from './values';

/**
 * Device capability discovery: what a template's value is. A plugin declares it on the template
 * (`schema`, Core 2.2.0); otherwise it is inferred from the template's value type and sample model,
 * with the meaning (semantic) and unit guessed from the member names.
 */
export function templateSchema(template: Pick<ITemplate, 'type' | 'model' | 'schema' | 'name'> | null | undefined): ValueSchema | undefined {
  if (template == null)
    return undefined;
  const inferred = inferSchema(template.type, template.model, template.name);
  if (template.schema == null)
    return inferred;
  return mergeSchema(template.schema, inferred);
}

/** The declared schema, with what it leaves out taken from the inferred one. */
function mergeSchema(declared: ValueSchema, inferred: ValueSchema): ValueSchema {
  const properties = { ...(inferred.properties ?? {}) };
  for (const [name, member] of Object.entries(declared.properties ?? {}))
    properties[name] = inferred.properties?.[name] ? mergeSchema(member, inferred.properties[name]) : member;
  return {
    ...inferred,
    ...Object.fromEntries(Object.entries(declared).filter(([, value]) => value != null)),
    ...(Object.keys(properties).length > 0 ? { properties } : {}),
  };
}

const typeOfValueType: Record<ValueType, SchemaType> = {
  [ValueType.Boolean]: 'boolean',
  [ValueType.Text]: 'string',
  [ValueType.Number]: 'number',
  [ValueType.Entity]: 'object',
  [ValueType.TextArray]: 'array',
};

/** A schema from a value type and a sample value (a template's `model`). */
export function inferSchema(type: ValueType | null | undefined, model: JsonValue | undefined, name?: string | null): ValueSchema {
  const schema = type == null ? inferFromValue(model, name ?? undefined) : { type: typeOfValueType[type] ?? valueSchemaType(model) };
  if (schema.type === 'object' && isJsonObject(model))
    schema.properties = Object.fromEntries(Object.entries(model).map(([member, value]) => [member, inferFromValue(value, member)]));
  if (schema.type === 'array')
    schema.items = { type: 'string' };
  return withSemantic(schema, name ?? undefined);
}

function inferFromValue(value: JsonValue | undefined, name?: string): ValueSchema {
  const schema: ValueSchema = { type: valueSchemaType(value) };
  if (schema.type === 'object' && isJsonObject(value))
    schema.properties = Object.fromEntries(Object.entries(value).map(([member, item]) => [member, inferFromValue(item, member)]));
  if (schema.type === 'array' && Array.isArray(value) && value.length > 0)
    schema.items = inferFromValue(value[0]);
  return withSemantic(schema, name);
}

function valueSchemaType(value: JsonValue | undefined): SchemaType | undefined {
  if (typeof value === 'boolean')
    return 'boolean';
  if (typeof value === 'number')
    return Number.isInteger(value) ? 'integer' : 'number';
  if (typeof value === 'string')
    return 'string';
  if (Array.isArray(value))
    return 'array';
  if (isJsonObject(value))
    return 'object';
  return undefined;
}

const semanticWords: [RegExp, Semantic][] = [
  [/temp/i, 'temperature'],
  [/humid/i, 'humidity'],
  [/press|baro/i, 'pressure'],
  [/lux|illum|ambient.?light/i, 'illuminance'],
  [/energy|kwh|consum/i, 'energy'],
  [/power|watt/i, 'power'],
  [/volt/i, 'voltage'],
  [/current|amp/i, 'current'],
  [/batt/i, 'battery'],
  [/co2|carbon/i, 'co2'],
  [/motion|pir|movement/i, 'motion'],
  [/occup|presence/i, 'occupancy'],
  [/door/i, 'door'],
  [/window/i, 'window'],
  [/contact|reed/i, 'contact'],
  [/bright|dimm|level/i, 'brightness'],
  [/colou?r.?temp|kelvin|mired/i, 'colorTemperature'],
  [/colou?r|rgb|hue/i, 'color'],
  [/light|lamp|bulb/i, 'light'],
  [/switch|relay|plug|socket|outlet/i, 'switch'],
  [/image|snapshot|camera|picture|url/i, 'image'],
];

/** The meaning a name suggests, such as "temperature" for "Living room temp". */
export function guessSemantic(name: string | undefined): Semantic | undefined {
  if (!name)
    return undefined;
  return semanticWords.find(([pattern]) => pattern.test(name))?.[1];
}

const units: Partial<Record<Semantic, string>> = {
  temperature: '°C', humidity: '%', pressure: 'hPa', illuminance: 'lx', power: 'W', energy: 'kWh',
  voltage: 'V', current: 'A', battery: '%', co2: 'ppm', brightness: '%', colorTemperature: 'K',
};

/** The usual unit of a meaning, such as °C for temperature. */
export function unitFor(semantic: string | null | undefined): string | undefined {
  return semantic == null ? undefined : units[semantic as Semantic];
}

function withSemantic(schema: ValueSchema, name?: string): ValueSchema {
  const semantic = schema.semantic ?? guessSemantic(name);
  if (semantic == null || schema.type === 'object')
    return schema;
  // Booleans don't have temperatures; numbers aren't motion.
  const binary = ['motion', 'occupancy', 'contact', 'door', 'window', 'light', 'switch'].includes(semantic);
  if (schema.type === 'boolean' && !binary)
    return schema;
  if ((schema.type === 'number' || schema.type === 'integer') && binary && semantic !== 'light')
    return schema;
  return { ...schema, semantic, unit: schema.unit ?? (schema.type === 'number' || schema.type === 'integer' ? unitFor(semantic) : undefined) };
}

/** The schema of a member path ("sensor.temperature"), or the schema itself for no path. */
export function schemaAt(schema: ValueSchema | undefined, member: JsonValue | undefined): ValueSchema | undefined {
  let current = schema;
  for (const name of memberPath(member)) {
    current = current?.properties?.[name];
    if (current == null)
      return undefined;
  }
  return current;
}

export type MemberOption = { path: string, title: string, schema: ValueSchema };

/** Every member of an entity value with a plain value, nested ones as "a.b", for member pickers. */
export function memberOptions(schema: ValueSchema | undefined, accepts?: SchemaType[], prefix = ''): MemberOption[] {
  const options: MemberOption[] = [];
  for (const [name, member] of Object.entries(schema?.properties ?? {})) {
    const path = prefix ? `${prefix}.${name}` : name;
    if (member.type === 'object')
      options.push(...memberOptions(member, accepts, path));
    else if (!accepts || accepts.length === 0 || accepts.includes(member.type as SchemaType) || (member.type === 'integer' && accepts.includes('number')))
      options.push({ path, title: member.title ?? path, schema: member });
  }
  return options;
}

/** Whether a value of this schema is of one of the types (integers are numbers). */
export function accepts(schema: ValueSchema | undefined, types: SchemaType[] | undefined): boolean {
  if (!types || types.length === 0 || schema?.type == null)
    return true;
  if (schema.type === 'object')
    return memberOptions(schema, types).length > 0;
  return types.includes(schema.type) || (schema.type === 'integer' && types.includes('number'));
}

export function isNumeric(schema: ValueSchema | undefined): boolean {
  return schema?.type === 'number' || schema?.type === 'integer';
}

/** The first member that suits the types, when the report is an entity: the default member. */
export function defaultMember(schema: ValueSchema | undefined, types: SchemaType[] | undefined): string | undefined {
  if (schema?.type !== 'object')
    return undefined;
  const options = memberOptions(schema, types);
  const semantic = options.find(option => option.schema.semantic != null);
  return (semantic ?? options[0])?.path;
}
