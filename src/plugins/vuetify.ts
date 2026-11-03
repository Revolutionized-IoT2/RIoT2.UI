/**
 * plugins/vuetify.ts
 *
 * Material Design 3, as in Dls (ADR 0016): the MD3 blueprint sets component shapes, elevation and typography; the
 * themes are an MD3 tonal palette. The UI's own icons are Material Design Icons ("mdi-…"); everything else, such as the
 * Material icon names stored in dashboards, still renders with the Material icon font.
 */

// Styles
import '@mdi/font/css/materialdesignicons.css'
import 'material-design-icons-iconfont/dist/material-design-icons.css'
import 'vuetify/styles'

// Composables
import { h } from 'vue'
import { createVuetify, type IconSet, type IconProps } from 'vuetify'
import { md3 } from 'vuetify/blueprints'
import { md } from 'vuetify/iconsets/md'
import { aliases, mdi } from 'vuetify/iconsets/mdi'

/** "mdi-…" names go to Material Design Icons, any other name to the Material icon font. */
const hybrid: IconSet = {
  component: (props: IconProps) => h((typeof props.icon === 'string' && props.icon.startsWith('mdi-') ? mdi : md).component, props),
}

export const themeStorageKey = 'riot2.theme'

export type ThemeChoice = 'light' | 'dark' | 'system'

const isChoice = (value: string | null | undefined): value is ThemeChoice => value === 'light' || value === 'dark' || value === 'system'

/**
 * The theme at start: `?theme=light|dark|system` in the URL (RIoT2.Mobile passes the phone's), else the
 * user's choice in this browser, else the system's.
 */
export function initialTheme(search = globalThis.location?.search ?? ''): ThemeChoice {
  const requested = new URLSearchParams(search).get('theme')
  if (isChoice(requested))
    return requested
  try {
    const stored = globalThis.localStorage?.getItem(themeStorageKey)
    return isChoice(stored) ? stored : 'system'
  } catch {
    return 'system'
  }
}

export default createVuetify({
  blueprint: md3,
  // Tablets in landscape and small laptops keep the permanent navigation drawer.
  display: { mobileBreakpoint: 'md' },
  theme: {
    defaultTheme: initialTheme(),
    themes: {
      light: {
        dark: false,
        colors: {
          primary: '#36618e',
          'on-primary': '#ffffff',
          'primary-container': '#d1e4ff',
          'on-primary-container': '#001d36',
          secondary: '#535f70',
          'on-secondary': '#ffffff',
          'secondary-container': '#d7e3f7',
          tertiary: '#6b5778',
          'tertiary-container': '#f2daff',
          error: '#ba1a1a',
          'error-container': '#ffdad6',
          success: '#2e6b30',
          warning: '#7c5800',
          info: '#36618e',
          background: '#f8f9ff',
          surface: '#f8f9ff',
          'surface-bright': '#f8f9ff',
          'surface-container-low': '#f2f3fa',
          'surface-container': '#eceef4',
          'surface-container-high': '#e6e8ee',
          'surface-container-highest': '#e0e2e8',
          'surface-variant': '#dfe2eb',
          'on-surface-variant': '#43474e',
          outline: '#73777f',
          'outline-variant': '#c3c7cf',
          'dashboard-background': '#eceef4',
          'dashboard-card': '#ffffff'
        }
      },
      dark: {
        dark: true,
        colors: {
          primary: '#a0cafd',
          'on-primary': '#003258',
          'primary-container': '#194975',
          'on-primary-container': '#d1e4ff',
          secondary: '#bbc7db',
          'on-secondary': '#253140',
          'secondary-container': '#3b4858',
          tertiary: '#d6bee4',
          'tertiary-container': '#523f5f',
          error: '#ffb4ab',
          'error-container': '#93000a',
          success: '#94d78f',
          warning: '#f7bd48',
          info: '#a0cafd',
          background: '#111418',
          surface: '#111418',
          'surface-bright': '#37393e',
          'surface-container-low': '#191c20',
          'surface-container': '#1d2024',
          'surface-container-high': '#272a2f',
          'surface-container-highest': '#32353a',
          'surface-variant': '#43474e',
          'on-surface-variant': '#c3c7cf',
          outline: '#8d9199',
          'outline-variant': '#43474e',
          'dashboard-background': '#111418',
          'dashboard-card': '#1d2024'
        }
      }
    }
  },
  defaults: {
    VTextField: { variant: 'outlined', density: 'comfortable' },
    VSelect: { variant: 'outlined', density: 'comfortable' },
    VAutocomplete: { variant: 'outlined', density: 'comfortable' },
    VCombobox: { variant: 'outlined', density: 'comfortable' },
    VTextarea: { variant: 'outlined', density: 'comfortable' },
    VFileInput: { variant: 'outlined', density: 'comfortable' },
    VCard: { rounded: 'lg' },
    VAlert: { variant: 'tonal', rounded: 'lg' }
  },
  icons: {
    defaultSet: 'hybrid',
    aliases,
    sets: { hybrid, md, mdi }
  }
})
