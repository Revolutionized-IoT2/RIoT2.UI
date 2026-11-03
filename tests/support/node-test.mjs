// The node:test API the older tests use, on Vitest: test(name, [options], fn) with options.skip and
// the test context's after(callback).
import { test as vitest } from 'vitest';

export function test(name, options, fn) {
  if (typeof options === 'function') {
    fn = options;
    options = {};
  }
  vitest.skipIf(Boolean(options?.skip))(name, async context => {
    await fn({ name, after: callback => context.onTestFinished(callback) });
  });
}
