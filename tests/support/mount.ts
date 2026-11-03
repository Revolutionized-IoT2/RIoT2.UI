// Shared mounting for component tests: Vuetify and Pinia, and the browser APIs jsdom lacks.
import { createPinia, setActivePinia, type Pinia } from 'pinia';
import { createVuetify } from 'vuetify';
import { md3 } from 'vuetify/blueprints';
import { aliases, mdi } from 'vuetify/iconsets/mdi';
import { vi } from 'vitest';

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

export function installBrowserStubs() {
  globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;
  globalThis.matchMedia ??= vi.fn().mockImplementation((query: string) => ({
    matches: false, media: query, onchange: null,
    addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false,
  }));
  HTMLCanvasElement.prototype.getContext = vi.fn(() => null) as never;
}

export function plugins(): { vuetify: ReturnType<typeof createVuetify>, pinia: Pinia } {
  installBrowserStubs();
  const pinia = createPinia();
  setActivePinia(pinia);
  const vuetify = createVuetify({
    blueprint: md3,
    theme: { defaultTheme: 'light', themes: { light: { colors: { 'dashboard-card': '#ffffff', 'dashboard-background': '#eceef4' } } } },
    icons: { defaultSet: 'mdi', aliases, sets: { mdi } },
  });
  return { vuetify, pinia };
}
