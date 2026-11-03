import { computed, type ComputedRef, type MaybeRefOrGetter, toValue } from 'vue';
import type { CardElement, DashboardCard } from '@/models/dashboard';
import type { JsonValue } from '@/models/generated/contracts';
import type { CommandDelivery } from '@/models/commandDelivery';
import { useCommandsStore } from '@/stores/commandsStore';
import { findCard } from './registry';
import { cardSettings, elementByRole, elementSettings, slotOf } from './model';
import { readElement, type ElementReading } from './reading';
import type { CardProps, Settings } from './types';

/** A card's settings over its kind's defaults, typed as the card declares them. */
export function useCardSettings<S extends Settings>(props: CardProps): ComputedRef<S> {
  return computed(() => cardSettings<S>(props.card, findCard(props.card.kind) as { defaults: S } | undefined));
}

export type ElementView<E extends Settings = Settings> = ElementReading & { settings: E };

function view<E extends Settings>(card: DashboardCard, element: CardElement | undefined, index: number, role?: string): ElementView<E> {
  const definition = findCard(card.kind);
  const layout = definition?.elements;
  const slot = role != null && layout != null && 'slots' in layout ? layout.slots.find(s => s.role === role) : slotOf(definition, element, index);
  const settings = elementSettings<E>(element, slot);
  return { ...readElement(element, settings), settings };
}

/** Every element of the card, read: values, units, history and settings. */
export function useElements<E extends Settings = Settings>(props: CardProps): ComputedRef<ElementView<E>[]> {
  return computed(() => props.card.elements.map((element, index) => view<E>(props.card, element, index)));
}

/** The first element, or the element in the fixed slot `role` (read as empty when not bound). */
export function useElement<E extends Settings = Settings>(props: CardProps, role?: string): ComputedRef<ElementView<E>> {
  return computed(() => role == null
    ? view<E>(props.card, props.card.elements[0], 0)
    : view<E>(props.card, elementByRole(props.card, role), -1, role));
}

/**
 * Sends commands for card controls and shows their delivery. In the editor's preview and the card
 * gallery (`preview`), nothing is sent.
 */
export function useCommand(props: CardProps) {
  const commands = useCommandsStore();

  function send(element: CardElement | undefined, value: JsonValue): Promise<boolean> {
    if (toValue(props.preview) || element?.commandTemplate == null)
      return Promise.resolve(false);
    return commands.send(element.commandTemplate, value);
  }

  function delivery(element: MaybeRefOrGetter<CardElement | undefined>): CommandDelivery | undefined {
    const id = toValue(element)?.commandTemplate?.id;
    return id == null ? undefined : commands.deliveries[id];
  }

  return { send, delivery };
}
