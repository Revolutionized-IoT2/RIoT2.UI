import { onBeforeUnmount, ref, watch, type Ref } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';

export type UnsavedChoice = 'save' | 'discard' | 'cancel';

/**
 * Guards unsaved changes: leaving the route asks (UnsavedChangesDialog, bound to `dialog`) whether to
 * save, discard or keep editing; closing or reloading the tab gets the browser's own prompt.
 * `confirmLeave` asks the same before the view leaves edit mode.
 */
export function useUnsavedChanges(options: { dirty: Ref<boolean>, save: () => Promise<boolean>, discard: () => Promise<void> | void }) {
  const dialog = ref(false);
  const saving = ref(false);
  let answer: ((choice: UnsavedChoice) => void) | undefined;

  function ask(): Promise<UnsavedChoice> {
    dialog.value = true;
    return new Promise(resolve => { answer = resolve; });
  }

  /** Called by the dialog's buttons, and with 'cancel' when it is dismissed. */
  function choose(choice: UnsavedChoice) {
    const resolve = answer;
    answer = undefined;
    if (choice !== 'save')
      dialog.value = false;
    resolve?.(choice);
  }

  watch(dialog, open => { if (!open) choose('cancel'); });

  /** Resolves to true when it is fine to go on: nothing unsaved, saved, or discarded. */
  async function confirmLeave(): Promise<boolean> {
    if (!options.dirty.value)
      return true;
    const choice = await ask();
    if (choice === 'cancel')
      return false;
    if (choice === 'discard') {
      await options.discard();
      return true;
    }
    saving.value = true;
    try {
      const saved = await options.save();
      return saved;
    } finally {
      saving.value = false;
      dialog.value = false;
    }
  }

  onBeforeRouteLeave(() => confirmLeave());

  function beforeUnload(event: BeforeUnloadEvent) {
    if (options.dirty.value) {
      event.preventDefault();
      event.returnValue = '';
    }
  }
  globalThis.addEventListener?.('beforeunload', beforeUnload);
  onBeforeUnmount(() => globalThis.removeEventListener?.('beforeunload', beforeUnload));

  return { dialog, saving, choose, confirmLeave };
}
