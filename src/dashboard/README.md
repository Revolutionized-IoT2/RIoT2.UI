# Dashboard card kit

The dashboard is built from **cards**. Each card type is one folder in [cards/](cards/) and is
defined with `defineCard`. The dashboard, the card gallery, the editor and the tests find every
card by its folder, so adding a card type changes no other file and needs no RIoT2.Core or
Orchestrator change. The orchestrator stores a card's `kind` and `settings` as they are
([dashboard contract](../../../.github/docs/contracts/dashboard.md)).

```
src/dashboard/
  sdk/          The kit: defineCard and its types, the registry, composables for cards,
                value and capability helpers, the dashboard model (load, save, import, export).
  components/   Building blocks for cards: CardShell, SparkLine, CommandStatus.
  cards/<kind>/ One card type each: index.ts (its definition) and its Vue component.
  editor/       The card gallery, the card editor, settings forms, page and import dialogs.
  view/         The grid (CardHost, DashboardGrid) and the page navigation.
```

## Add a card type

```
npm run new-card -- thermostat "Thermostat"
```

This creates `cards/thermostat/index.ts` and `ThermostatCard.vue`. The new card is in the card
gallery at once (`npm run dev`), and `npm test` renders its sample along with every other card.
Then:

1. **Describe the card** in `index.ts`: its title, description, icon, category, default size and
   the closest legacy `type` for older UIs.
2. **Declare its settings.** List the card's settings and each element's settings as fields, each
   with a default. The editor builds the forms from these fields; no editor code is needed. Fields
   that depend on another setting or on the device get a `visible` function.
3. **Declare its elements.** An element binds one report (what it shows) and one command (what it
   controls).
   - `each` is a list of alike elements, such as the rows of a list.
   - `slots` are fixed, named elements, such as a light's power, brightness and colour.
   - `accepts` sorts the templates that suit the card first in the template picker.
4. **Write the component.** It gets `{ card, preview }` and reads everything through the kit:
   - `useCardSettings(props)` returns the card's settings over its defaults.
   - `useElement(props, role?)` and `useElements(props)` return each element's value, number,
     boolean, text, unit, schema, history and settings, and resolve `"{member}"` settings.
   - `useCommand(props).send(element, value)` sends a command. In the gallery and the editor's
     preview (`preview`), it sends nothing.
   - `CardShell` draws the frame: the icon, title, "not connected" and "waiting" states, and the
     time of the last update.
5. **Add a `sample`.** It feeds the gallery preview and the render test.

Keep a released card's `kind`, and its setting keys, unchanged: dashboards store them. Rename a
setting by reading the old key in `upgrade`.

### Setting fields

| Type | Edits |
|---|---|
| `text`, `textarea`, `markdown` | Text |
| `number` | A number, optionally with `min`, `max` and `step`; an empty field is `null` |
| `boolean` | A switch |
| `select` | One of `options`: buttons for up to four options, else a list |
| `icon` | An MDI icon, with a searchable picker |
| `color` | A theme or palette colour, or any CSS colour |
| `unit` | A unit; the element's declared unit is the placeholder |
| `member` | A member of the element's entity report, listed from its schema |
| `value` | A command or report value, edited as its schema describes |
| `list` | A list of objects with their own `fields`, such as a state card's states |

## Device capability discovery

A device plugin can declare what a report or command value is, as a `schema` on its template
(`ValueSchema`, Core 2.2.0): its type, unit, meaning (`semantic`), range, allowed values and
members. Without a declared schema, [sdk/capabilities.ts](sdk/capabilities.ts) infers one from the
template's value type and sample model, and guesses meanings and units from member names. The
UI uses the schema to:

- list the members of an entity report, and pick the default member;
- show units and icons;
- sort the templates that suit a card first;
- edit command values with fitting inputs ([SchemaValueInput.vue](../components/SchemaValueInput.vue)),
  both in the card editor and in a node's "execute command" dialog.

## Dashboards saved before card kinds

Cards saved before card kinds have only a legacy `type`. When the dashboard loads,
`normalizeDashboard` gives each such card the kind that `replaces` its type, and that kind's
`upgrade` moves the old settings to the new ones. For example, a numeric value's
`value: "{temperature}"` becomes `member: "temperature"`. Material icon names are mapped to MDI
([sdk/icons.ts](sdk/icons.ts)). The next save stores the upgraded dashboard.
