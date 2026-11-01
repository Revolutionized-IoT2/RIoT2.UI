// Configuration backup and restore in the UI (I21, design 7.4): the API calls, the error detail the
// orchestrator sends back, and the restore flow of the Backup view.
const test = require('node:test');
const assert = require('node:assert/strict');
const { AxiosError } = require('axios');
const { loadSource } = require('./source-loader.cjs');

// Objects made in the loaded source belong to another VM context.
const plain = value => JSON.parse(JSON.stringify(value));

function loadApi(calls) {
  return loadSource('src/composables/api/backupApi.ts', {
    mocks: {
      '@/stores/orchestratorStore': { useOrchestratorStore: () => ({ baseUrl: 'http://orchestrator:8080' }) },
      '@/composables/httpClientService': {
        withCallback: async (request, callback, completed) => { callback(await request); completed?.(); },
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
  let result;

  await api.createBackup(() => {});
  await api.restore(file, data => { result = data; });
  await api.restoreSaved('riot2-backup-20261101T030000Z.zip', () => {});

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
  assert.equal(responseDetail(new Error('network')), null);
});

test('the Backup view restores a saved backup only after confirmation, then reloads the list', async t => {
  const calls = [];
  const view = loadSource('src/views/BackupView.vue', {
    expose: ['summary', 'confirmDialog', 'restored', 'restoring', 'chooseSaved', 'cancelRestore', 'restore'],
    mocks: {
      '@/composables/api/backupApi': {
        backupFileName: () => 'x.zip',
        useBackupApi: () => ({
          getSummary: (callback, completed) => { calls.push('summary'); callback({ schedule: null, backups: [{ name: 'b.zip' }] }); completed(); },
          restoreSaved: (name, callback, completed) => { calls.push('restore ' + name); callback({ nodes: 2, safetyBackup: 'p.zip' }); completed(); },
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
  state.restore();

  assert.equal(state.confirmDialog.value, false);
  assert.equal(state.restoring.value, false);
  assert.deepEqual(calls, ['restore b.zip', 'summary']);
  assert.equal(state.restored.value.safetyBackup, 'p.zip');
  assert.equal(state.summary.value.backups[0].name, 'b.zip');
});
