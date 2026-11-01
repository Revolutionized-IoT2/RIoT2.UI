// ESLint for the UI (backlog item 10): Vue's essential rules and typescript-eslint's recommended
// rules over src/. The node tests in tests/ are plain CommonJS and run as they are.
import pluginVue from 'eslint-plugin-vue';
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript';

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['src/**/*.{ts,vue}'],
  },
  {
    name: 'app/files-to-ignore',
    ignores: ['dist/**', 'node_modules/**', 'tests/**', '*.config.*', 'env.d.ts', 'src/models/generated/**'],
  },
  pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,
  {
    name: 'app/rules',
    rules: {
      // Vuetify names its data-table slots after the column, for example v-slot:item.name.
      'vue/valid-v-slot': ['error', { allowModifiers: true }],
      // JSON values are JsonValue from the generated contract types (plan M3 step 4, I28).
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  {
    name: 'app/layout',
    files: ['src/layout/**/*.vue'],
    rules: {
      // The layout parts are named after their role (Default, View), as Vuetify's templates do.
      'vue/multi-word-component-names': 'off',
    },
  },
);
