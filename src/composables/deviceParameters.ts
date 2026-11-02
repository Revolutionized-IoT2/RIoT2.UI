import type { InjectionKey, Ref } from 'vue';
import { DeviceParameterType } from '@/models/enums';
import type DeviceConfiguration from '@/models/deviceConfiguration';
import type { DeviceParameterDefinition } from '@/models/generated/contracts';

/** The parameter definitions a node's plugins declare, by device class (`classFullName`). */
export type ParameterDefinitionMap = Record<string, DeviceParameterDefinition[]>;

/** Provided by the node editor, read by every device's parameter form. */
export const parameterDefinitionsKey: InjectionKey<Ref<ParameterDefinitionMap>> = Symbol('parameterDefinitions');

/** One editable parameter: its key in `deviceParameters`, and its definition when the plugin declares one. */
export interface ParameterField {
  key: string;
  definition: DeviceParameterDefinition | null;
}

/**
 * Moves the parameter definitions of a node's device templates into `into`, by class. The templates lose them,
 * so a device added from a template is saved without them.
 */
export function takeParameterDefinitions(templates: DeviceConfiguration[], into: ParameterDefinitionMap): void {
  for (const template of templates) {
    if (template.parameterDefinitions != null && template.classFullName)
      into[template.classFullName] = template.parameterDefinitions;
    delete template.parameterDefinitions;
  }
}

/**
 * The fields to show: every defined parameter in the plugin's order (with the stored key's spelling when it differs
 * only in case, as the node matches keys case-insensitively), then the stored parameters without a definition.
 */
export function parameterFields(parameters: Record<string, string> | null, definitions: DeviceParameterDefinition[] | null | undefined): ParameterField[] {
  const stored = Object.keys(parameters ?? {});
  const fields: ParameterField[] = [];
  const used = new Set<string>();
  for (const definition of definitions ?? []) {
    if (!definition.key)
      continue;
    const wanted = definition.key.toLowerCase();
    const key = stored.find(k => k === definition.key) ?? stored.find(k => k.toLowerCase() === wanted) ?? definition.key;
    used.add(key);
    fields.push({ key, definition });
  }
  for (const key of stored)
    if (!used.has(key))
      fields.push({ key, definition: null });
  return fields;
}

/** The problem with a value, as the node would report it, or null when the node accepts it. */
export function parameterError(definition: DeviceParameterDefinition | null, value: string | null | undefined): string | null {
  if (definition == null)
    return null;
  const text = (value ?? '').trim();
  if (text === '')
    return definition.required && definition.default == null ? 'Required' : null;
  switch (definition.type) {
    case DeviceParameterType.integer:
      return /^[+-]?\d+$/.test(text) ? null : 'A whole number';
    case DeviceParameterType.number:
      return /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(text) ? null : 'A number, with a dot for decimals';
    case DeviceParameterType.boolean:
      return /^(true|false)$/i.test(text) ? null : 'true or false';
    default:
      return null;
  }
}
