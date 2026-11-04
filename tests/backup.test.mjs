// Configuration backup and restore in the UI (I21, design 7.4): the API calls, the error detail the
// orchestrator sends back, and the restore flow of the Backup view.
import { test } from './support/node-test.mjs';
import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// CommonJS, like tests/source-loader.cjs: the code under test and the test share one Vue and one Pinia.
const cjs = createRequire(import.meta.url);
const testsDirectory = dirname(fileURLToPath(import.meta.url));
const assert = cjs('node:assert/strict');
const { AxiosError } = cjs('axios');
const { createPinia, setActivePinia } = cjs('pinia');
const { loadSource } = cjs('./source-loader.cjs');

// Objects made in the loaded source belong to another VM context.
const plain = value => JSON.parse(JSON.stringify(value));

function loadApi(calls) {
  return loadSource('src/composables/api/backupApi.ts', {
    mocks: {
      '@/stores/orchestratorStore': { useOrchestratorStore: () => ({ baseUrl: 'http://orchestrator:8080' }) },
      '@/composables/httpClientService': {
        useHttpClient: () => ({
          get: async url => { calls.push({ method: 'get', url }); return { backups: [] }; },
          post: async (url, data, config) => { calls.push({ method: 'post', url, data, config }); return { nodes: 1 }; },
        }),
      },
    },
  });
}

test('backup file names match the orchestrator\'s', () => {
  const api = loadApi([]);
  assert.equal(api.backupFileName(new Date(Date.UTC(2026, 10, 1, 3, 4, 5, 678))), 'riot2-backup-20261101T030405Z.zip');
});

test('the backup API sends the zip as the body and encodes backup names', async () => {
  const calls = [];
  const api = loadApi(calls).useBackupApi();
  const file = { name: 'riot2-backup-20261101T030000Z.zip' };

  await api.createBackup();
  const result = await api.restore(file);
  await api.restoreSaved('riot2-backup-20261101T030000Z.zip');

  assert.deepEqual(plain(calls[0]), { method: 'post', url: 'http://orchestrator:8080/api/v2/backup', data: null, config: { responseType: 'blob' } });
  assert.equal(calls[1].url, 'http://orchestrator:8080/api/v2/restore');
  assert.equal(calls[1].data, file);
  assert.deepEqual(plain(calls[1].config), { headers: { 'Content-Type': 'application/zip' } });
  assert.deepEqual(plain(result), { nodes: 1 });
  assert.equal(calls[2].url, 'http://orchestrator:8080/api/v2/backups/riot2-backup-20261101T030000Z.zip/restore');
  assert.equal(api.getDownloadUrl('a b/c'), 'http://orchestrator:8080/api/v2/backups/a%20b%2Fc');
});

test('errors carry the detail of the orchestrator\'s answer', () => {
  const { responseDetail } = loadSource('src/composables/httpClientService.ts');
  const failed = data => new AxiosError('Request failed with status code 400', 'ERR_BAD_REQUEST', undefined, undefined, { status: 400, data });

  assert.equal(responseDetail(failed({ title: 'The backup can\'t be restored', detail: 'v.json is not valid JSON.' })), 'v.json is not valid JSON.');
  assert.equal(responseDetail(failed('No backup x')), 'No backup x');
  assert.equal(responseDetail(failed({ title: 'no detail' })), null);
  assert.equal(responseDetail(failed({ message: 'Set the client id and secret first.' })), 'Set the client id and secret first.');
  assert.equal(responseDetail(new Error('network')), null);
});

test('the Backup view restores a saved backup only after confirmation, then reloads the list', async t => {
  setActivePinia(createPinia());
  const calls = [];
  const view = loadSource('src/views/BackupView.vue', {
    expose: ['summary', 'confirmDialog', 'restored', 'restoring', 'chooseSaved', 'cancelRestore', 'restore'],
    mocks: {
      '@/composables/api/backupApi': {
        backupFileName: () => 'x.zip',
        useBackupApi: () => ({
          getSummary: async () => { calls.push('summary'); return { schedule: null, backups: [{ name: 'b.zip' }] }; },
          restoreSaved: async name => { calls.push('restore ' + name); return { nodes: 2, safetyBackup: 'p.zip' }; },
          restore() { throw new Error('no file was chosen'); },
          getDownloadUrl: name => name,
        }),
      },
    },
  });
  t.after(view.dispose);
  const { state } = view;

  state.chooseSaved('b.zip');
  assert.equal(state.confirmDialog.value, true);
  state.cancelRestore();
  assert.deepEqual(calls, []);

  state.chooseSaved('b.zip');
  await state.restore();

  assert.equal(state.confirmDialog.value, false);
  assert.equal(state.restoring.value, false);
  assert.deepEqual(calls, ['restore b.zip', 'summary']);
  assert.equal(state.restored.value.safetyBackup, 'p.zip');
  assert.equal(state.summary.value.backups[0].name, 'b.zip');
});

test('a failed restore shows the orchestrator\'s reason and still reloads the list', async t => {
  setActivePinia(createPinia());
  const errors = [];
  let summaries = 0;
  const view = loadSource('src/views/BackupView.vue', {
    expose: ['restored', 'restoring', 'chooseSaved', 'restore'],
    mocks: {
      '@/composables/api/backupApi': {
        backupFileName: () => 'x.zip',
        useBackupApi: () => ({
          getSummary: async () => { summaries++; return { backups: [] }; },
          restoreSaved: async () => { throw new Error('Request failed with status code 400: v.json is not valid JSON.'); },
          getDownloadUrl: name => name,
        }),
      },
      './errorStore': { useErrorStore: () => ({ report: error => errors.push(error.message) }) },
    },
  });
  t.after(view.dispose);

  view.state.chooseSaved('b.zip');
  await view.state.restore();

  assert.equal(view.state.restored.value, null);
  assert.equal(view.state.restoring.value, false);
  assert.deepEqual(errors, ['Request failed with status code 400: v.json is not valid JSON.']);
  assert.equal(summaries, 1);
});
