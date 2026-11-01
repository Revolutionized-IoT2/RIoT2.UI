import type { JsonObject, JsonValue } from "@/models/generated/contracts";

export type { JsonObject };

export function isJsonObject(value: JsonValue | undefined): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** The member at the given path of nested objects, or undefined when one of them is missing. */
export function valueAt(value: JsonValue | undefined, path: string[]): JsonValue | undefined {
  let current = value;
  for (const name of path) {
    if (!isJsonObject(current))
      return undefined;
    current = current[name];
  }
  return current;
}
