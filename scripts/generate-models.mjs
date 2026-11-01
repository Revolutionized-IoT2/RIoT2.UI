// Generates src/models/generated/contracts.ts from the RIoT2 contract JSON Schema (plan M1 step 5,
// I28). The schema is exported from RIoT2.Core.Contracts (ContractSchemas) into
// RIoT2.Core/contracts/schemas; `npm run build` runs this first, and CI (which clones RIoT2.Core
// next to this repository) fails when the committed output is out of date.
//
// Without the sibling repository (a Docker build), the committed file is used as it is.
// RIOT2_CONTRACT_SCHEMA points at another copy of the schema.
import { compile } from 'json-schema-to-typescript';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const schemaPath = process.env.RIOT2_CONTRACT_SCHEMA
  ?? join(root, '..', 'RIoT2.Core', 'contracts', 'schemas', 'riot2-contracts.schema.json');
const outputPath = join(root, 'src', 'models', 'generated', 'contracts.ts');

if (!existsSync(schemaPath)) {
  const message = `${schemaPath} not found: clone RIoT2.Core next to RIoT2.UI.`;
  if (process.env.CI === 'true') {
    console.error(message);
    process.exit(1);
  }
  console.warn(`${message} Using the committed ${relative(root, outputPath)}.`);
  process.exit(0);
}

const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
const definitions = schema.$defs;

// Any JSON value (ValueModel and object members in .NET).
// The object and array cases are named interfaces (appended below): an inline recursive type is
// expanded by Vue's ref unwrapping until the compiler gives up.
definitions.JsonValue.tsType = 'string | number | boolean | null | JsonArray | JsonObject';

// Enums stay unions of their numbers (`0 | 1 | 2`), so the UI's own named enums
// (src/models/enums.ts) are checked against them; the names go into the comment.
for (const definition of Object.values(definitions)) {
  if (Array.isArray(definition['x-enumNames'])) {
    const names = definition['x-enumNames'].map((name, i) => `${definition.enum[i]} = ${name}`).join(', ');
    definition.description = [definition.description, names].filter(Boolean).join('\n');
    delete definition['x-enumNames'];
  }
}

const banner = [
  '/* eslint-disable */',
  '/**',
  ` * Generated from RIoT2.Core/contracts/schemas/riot2-contracts.schema.json (contract version ${schema['x-contractVersion']})`,
  ' * by scripts/generate-models.mjs during `npm run build`. Do not edit: change the .NET contract',
  ' * types in RIoT2.Core.Contracts, build RIoT2.Core.sln, then run `npm run generate`.',
  ' */',
].join('\n');

// Only the definitions: the document itself is not a type.
let output = await compile({ title: 'RIoT2Contracts', $defs: definitions }, 'RIoT2Contracts', {
  additionalProperties: false,
  unreachableDefinitions: true,
  bannerComment: banner,
  declareExternallyReferenced: true,
  format: true,
  style: { singleQuote: true, printWidth: 120 },
});

output = output.replace(/export interface RIoT2Contracts \{[^}]*\}\n*/, '');
output += `
/** A JSON object: an entity value, or the properties of a dashboard element. */
export interface JsonObject {
  [key: string]: JsonValue;
}
/** A JSON array. */
export interface JsonArray extends Array<JsonValue> {}
`;

mkdirSync(dirname(outputPath), { recursive: true });
// Git may check the file out with CRLF line ends; only a change in content rewrites it.
const current = existsSync(outputPath) ? readFileSync(outputPath, 'utf8').replace(/\r\n/g, '\n') : '';
if (current !== output) {
  writeFileSync(outputPath, output);
  console.log(`Wrote ${relative(root, outputPath)}`);
}
