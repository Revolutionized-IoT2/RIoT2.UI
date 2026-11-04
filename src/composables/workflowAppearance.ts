import type { WorkflowActivityDefinition, WorkflowCatalog } from '@/models/workflow';

// How activities look in the designer (ported from Dls, ADR 0016): an icon and a mid-tone colour that reads on both
// themes, and the palette's groups. The RIoT activities get groups of their own; Elsa's keep their categories.

export interface ActivityAppearance {
  icon: string;
  color: string;
}

export interface PaletteGroup {
  category: string;
  items: WorkflowActivityDefinition[];
}

const typeIcons: Record<string, string> = {
  'RIoT2.RIoTTrigger': 'mdi-flash-outline',
  'RIoT2.RIoTSchedule': 'mdi-calendar-clock',
  'RIoT2.RIoTData': 'mdi-database-search-outline',
  'RIoT2.RIoTCompare': 'mdi-compare-horizontal',
  'RIoT2.RIoTThreshold': 'mdi-thermometer-lines',
  'RIoT2.RIoTOutput': 'mdi-export',
  'RIoT2.RIoTConfirmedCommand': 'mdi-check-decagram-outline',
  'RIoT2.RIoTNotification': 'mdi-bell-ring-outline',
  'RIoT2.RIoTWebhook': 'mdi-webhook',
  'RIoT2.RIoTDebounce': 'mdi-timer-sand',
  'RIoT2.RIoTThrottle': 'mdi-speedometer-slow',
  'RIoT2.RIoTWaitForState': 'mdi-timer-pause-outline',
  'RIoT2.RIoTRunLlm': 'mdi-robot-outline',
  'RIoT2.RIoTForecast': 'mdi-chart-timeline-variant',
  'RIoT2.RIoTCommandPlan': 'mdi-calendar-arrow-right',
  'Elsa.Delay': 'mdi-timer-sand',
  'Elsa.End': 'mdi-flag-checkered',
  'Elsa.Fault': 'mdi-alert-octagon-outline',
  'Elsa.Finish': 'mdi-check-circle-outline',
  'Elsa.FlowDecision': 'mdi-call-split',
  'Elsa.FlowFork': 'mdi-source-fork',
  'Elsa.FlowJoin': 'mdi-source-merge',
  'Elsa.FlowSwitch': 'mdi-source-branch',
  'Elsa.ForEach': 'mdi-repeat',
  'Elsa.While': 'mdi-autorenew',
  'Elsa.RunJavaScript': 'mdi-language-javascript',
  'Elsa.SetVariable': 'mdi-variable',
  'Elsa.WriteLine': 'mdi-console-line',
  'Elsa.Cron': 'mdi-calendar-sync-outline',
  'Elsa.Timer': 'mdi-timer-outline',
  'Elsa.StartAt': 'mdi-calendar-clock',
  'Elsa.HttpEndpoint': 'mdi-web',
  'Elsa.SendHttpRequest': 'mdi-web',
  'Elsa.FlowSendHttpRequest': 'mdi-web'
};

/** The RIoT activities' palette groups. */
const riotGroups: Record<string, string> = {
  'RIoT2.RIoTData': 'RIoT data',
  'RIoT2.RIoTCompare': 'RIoT data',
  'RIoT2.RIoTThreshold': 'RIoT data',
  'RIoT2.RIoTForecast': 'RIoT data',
  'RIoT2.RIoTOutput': 'RIoT actions',
  'RIoT2.RIoTConfirmedCommand': 'RIoT actions',
  'RIoT2.RIoTCommandPlan': 'RIoT actions',
  'RIoT2.RIoTNotification': 'RIoT actions',
  'RIoT2.RIoTWebhook': 'RIoT actions',
  'RIoT2.RIoTDebounce': 'RIoT timing',
  'RIoT2.RIoTThrottle': 'RIoT timing',
  'RIoT2.RIoTWaitForState': 'RIoT timing',
  'RIoT2.RIoTRunLlm': 'AI'
};

const categoryColors: Record<string, string> = {
  Triggers: '#3b82f6',
  'RIoT data': '#d4a017',
  'RIoT actions': '#2e9d4e',
  'RIoT timing': '#9b5de5',
  AI: '#7c4dff',
  Branching: '#e8710a',
  Looping: '#0f9d8a',
  Flow: '#64748b',
  Scheduling: '#d4a017',
  Primitives: '#78909c',
  Scripting: '#d6457a',
  HTTP: '#2a9d8f'
};

const categoryIcons: Record<string, string> = {
  Triggers: 'mdi-lightning-bolt',
  'RIoT data': 'mdi-database-outline',
  'RIoT actions': 'mdi-export',
  'RIoT timing': 'mdi-timer-outline',
  AI: 'mdi-robot-outline',
  Branching: 'mdi-arrow-decision-outline',
  Looping: 'mdi-repeat',
  Flow: 'mdi-sitemap-outline',
  Scheduling: 'mdi-calendar-clock',
  Primitives: 'mdi-shape-outline',
  Scripting: 'mdi-code-braces',
  HTTP: 'mdi-web'
};

const fallbackColors = ['#3b82f6', '#9b5de5', '#0f9d8a', '#d6457a', '#e8710a', '#64748b'];
const categoryOrder = ['Triggers', 'RIoT data', 'RIoT actions', 'RIoT timing', 'AI', 'Branching', 'Looping', 'Flow', 'Scheduling', 'Primitives', 'Scripting', 'HTTP'];

/** The palette group of an activity: Triggers, a RIoT group, or Elsa's category. */
export function paletteCategory(definition: Pick<WorkflowActivityDefinition, 'type' | 'category' | 'kind'>): string {
  if (definition.kind === 'Trigger')
    return 'Triggers';
  return riotGroups[definition.type] ?? definition.category;
}

export function activityAppearance(definition: Pick<WorkflowActivityDefinition, 'type' | 'category' | 'kind'> | null, type?: string): ActivityAppearance {
  const activityType = definition?.type ?? type ?? '';
  const category = definition ? paletteCategory(definition) : '';
  return {
    icon: typeIcons[activityType] ?? categoryIcons[category] ?? 'mdi-cog-outline',
    color: categoryColor(category)
  };
}

export function categoryColor(category: string): string {
  const known = categoryColors[category];
  if (known)
    return known;
  let hash = 0;
  for (const character of category)
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return fallbackColors[hash % fallbackColors.length]!;
}

/** The palette: the groups in their order, each sorted by name, filtered by the search text. */
export function paletteGroups(catalog: WorkflowCatalog | null, search: string): PaletteGroup[] {
  const textFilter = search.trim().toLowerCase();
  const groups = new Map<string, WorkflowActivityDefinition[]>();
  for (const activity of catalog?.activities ?? []) {
    if (textFilter && ![activity.displayName, activity.category, activity.description ?? '', activity.type]
      .some(value => value.toLowerCase().includes(textFilter)))
      continue;
    const category = paletteCategory(activity);
    groups.set(category, [...(groups.get(category) ?? []), activity]);
  }
  return [...groups.entries()]
    .map(([category, items]) => ({ category, items: [...items].sort((a, b) => a.displayName.localeCompare(b.displayName)) }))
    .sort((a, b) => rank(a.category) - rank(b.category) || a.category.localeCompare(b.category));
}

function rank(category: string): number {
  const index = categoryOrder.indexOf(category);
  return index < 0 ? categoryOrder.length : index;
}
