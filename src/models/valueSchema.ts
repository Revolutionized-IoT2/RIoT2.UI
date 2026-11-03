import type { JsonValue } from './generated/contracts';

/**
 * What a report or command value is (Core 2.2.0 `ValueSchema`): a JSON Schema subset that a device
 * plugin declares on its templates, so the UI builds forms and picks dashboard cards from it. When a
 * template declares none, the UI infers one from its sample `model` (src/dashboard/sdk/capabilities.ts).
 */
export interface ValueSchema {
    type?: SchemaType | null;
    title?: string | null;
    description?: string | null;
    unit?: string | null;
    /** What the value means, such as temperature or motion; an open set (see `Semantic`). */
    semantic?: string | null;
    minimum?: number | null;
    maximum?: number | null;
    multipleOf?: number | null;
    enum?: JsonValue[] | null;
    /** The members of an entity (object) value. */
    properties?: Record<string, ValueSchema> | null;
    items?: ValueSchema | null;
    readOnly?: boolean | null;
}

export type SchemaType = 'boolean' | 'number' | 'integer' | 'string' | 'object' | 'array';

/** The meanings the UI knows icons, units and cards for. Plugins may use others. */
export type Semantic =
    | 'temperature' | 'humidity' | 'pressure' | 'illuminance' | 'power' | 'energy' | 'voltage' | 'current'
    | 'battery' | 'co2' | 'motion' | 'occupancy' | 'contact' | 'door' | 'window' | 'light' | 'switch'
    | 'brightness' | 'color' | 'colorTemperature' | 'image' | 'text';
