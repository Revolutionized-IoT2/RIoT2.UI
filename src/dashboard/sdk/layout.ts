import { ComponentSize } from '@/models/enums';

/** Columns (of 12) a card spans at each dashboard width. */
export type Spans = { xs: number, sm: number, md: number, lg: number };

/**
 * Dashboard widths (container queries on the dashboard, so an embedded or previewed dashboard uses
 * its own width): xs below 600 px (phones), sm to 840 px, md to 1145 px, lg above.
 */
export const widths = { sm: 600, md: 840, lg: 1145 } as const;

/** Small cards of compact kinds sit two side by side on phones; everything else takes the full width there. */
export function cardSpans(size: ComponentSize, compact = false): Spans {
  switch (size) {
    case ComponentSize.small: return { xs: compact ? 6 : 12, sm: 6, md: 4, lg: 3 };
    case ComponentSize.half: return { xs: 12, sm: 12, md: 6, lg: 6 };
    case ComponentSize.large: return { xs: 12, sm: 12, md: 8, lg: 9 };
    default: return { xs: 12, sm: 12, md: 12, lg: 12 };
  }
}

export const sizeOptions = [
  { value: ComponentSize.small, title: 'Small', icon: 'mdi-square-outline' },
  { value: ComponentSize.half, title: 'Medium', icon: 'mdi-rectangle-outline' },
  { value: ComponentSize.large, title: 'Large', icon: 'mdi-view-split-vertical' },
  { value: ComponentSize.full, title: 'Full width', icon: 'mdi-view-stream-outline' },
];
