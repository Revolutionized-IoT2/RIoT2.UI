const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const vue = require('vue');

// Execute the real setup/service code with Vue reactivity, but no DOM, broker, or API.
function loadSource(relativePath, { props = {}, model, expose = [], mocks = {} } = {}) {
  const scope = vue.effectScope();
  const cache = new Map();
  const defaults = {
    vue: { ...vue, inject: () => vue.ref([]), onMounted() {}, onBeforeUnmount() {}, onUnmounted() {} },
    'vue-router': { useRoute: () => ({ path: '/dashboard/edit' }), useRouter: () => ({}), onBeforeRouteLeave() {} },
    '@/composables/orchestratorService': { useOrchestrator: () => ({}) },
    'chart.js': { Chart: { register() {} } },
    'vue-chartjs': {},
  };
  const overrides = { ...defaults, ...mocks };

  function load(filename, isRoot = false) {
    if (cache.has(filename)) return cache.get(filename);
    let source = fs.readFileSync(filename, 'utf8');
    if (filename.endsWith('.vue'))
      source = source.match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1];
    if (isRoot && expose.length) source += `\nexports.state = { ${expose.join(', ')} };`;
    const exports = {};
    cache.set(filename, exports);
    const context = {
      exports,
      console,
      defineProps: () => props,
      withDefaults: (definedProps, defaults) => ({ ...defaults, ...definedProps }),
      defineModel: options => model ?? vue.ref(options.default),
      defineEmits: () => () => {},
      defineExpose() {},
      require(specifier) {
        if (specifier in overrides) return overrides[specifier];
        if (specifier.endsWith('.vue')) return {};
        if (specifier.startsWith('@/') || specifier.startsWith('.')) {
          let resolved = specifier.startsWith('@/')
            ? path.join(__dirname, '..', 'src', specifier.slice(2))
            : path.resolve(path.dirname(filename), specifier);
          if (!path.extname(resolved)) resolved += '.ts';
          return load(resolved);
        }
        return require(specifier);
      },
    };
    const output = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    vm.runInNewContext(output, context, { filename });
    return exports;
  }

  try {
    const result = scope.run(() => load(path.join(__dirname, '..', relativePath), true));
    return { ...result, dispose: () => scope.stop() };
  } catch (error) {
    scope.stop();
    throw error;
  }
}

module.exports = { loadSource };
