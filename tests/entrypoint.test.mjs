// The image's entrypoint (entrypoint.sh): it renders the MQTT settings into the bundle and writes
// the /api and /realtime proxy configuration from ORCHESTRATOR_UPSTREAM (design 7.5). It runs with
// a POSIX sh (Git's on Windows); where nginx is installed (GitHub's Ubuntu runners), `nginx -t`
// checks the configuration the image would load.
import { test } from './support/node-test.mjs';
import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// CommonJS, like tests/source-loader.cjs: the code under test and the test share one Vue and one Pinia.
const cjs = createRequire(import.meta.url);
const testsDirectory = dirname(fileURLToPath(import.meta.url));
const assert = cjs('node:assert/strict');
const fs = cjs('node:fs');
const os = cjs('node:os');
const path = cjs('node:path');
const { spawnSync } = cjs('node:child_process');

const root = path.join(testsDirectory, '..');

function findShell() {
  const candidates = process.platform === 'win32'
    ? [path.join(process.env.ProgramFiles ?? 'C:\\Program Files', 'Git', 'bin', 'sh.exe')]
    : ['/bin/sh'];
  return candidates.find(candidate => fs.existsSync(candidate));
}

const shell = findShell();
const nginx = spawnSync('nginx', ['-v']).error ? null : 'nginx';

function runEntrypoint(t, upstream) {
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'riot2-ui-entrypoint-'));
  t.after(() => fs.rmSync(folder, { recursive: true, force: true }));
  fs.mkdirSync(path.join(folder, 'html', 'assets'), { recursive: true });
  fs.writeFileSync(path.join(folder, 'html', 'assets', 'index-test.js'), 'const server = "VITE_MQTT_SERVER";');
  const env = {
    ...process.env,
    ROOT_DIR: path.join(folder, 'html').replace(/\\/g, '/'),
    TEMPLATE_DIR: path.join(folder, 'templates').replace(/\\/g, '/'),
    PROXY_CONF: path.join(folder, 'riot2', 'api.conf').replace(/\\/g, '/'),
    SKIP_NGINX: '1',
    VITE_MQTT_SERVER: 'broker.lan',
  };
  if (upstream === undefined)
    delete env.ORCHESTRATOR_UPSTREAM;
  else
    env.ORCHESTRATOR_UPSTREAM = upstream;
  const result = spawnSync(shell, [path.join(root, 'entrypoint.sh').replace(/\\/g, '/')], { env, encoding: 'utf8' });
  const conf = path.join(folder, 'riot2', 'api.conf');
  return {
    folder,
    status: result.status,
    output: result.stdout + result.stderr,
    proxy: fs.existsSync(conf) ? fs.readFileSync(conf, 'utf8') : null,
    bundle: fs.readFileSync(path.join(folder, 'html', 'assets', 'index-test.js'), 'utf8'),
  };
}

// The image's nginx.conf in a minimal main configuration, with the proxy file from `folder`.
function nginxTest(folder) {
  const server = fs.readFileSync(path.join(root, 'nginx.conf'), 'utf8')
    .replace('include /etc/nginx/riot2/*.conf;', `include ${path.join(folder, 'riot2', '*.conf')};`);
  fs.writeFileSync(path.join(folder, 'default.conf'), server);
  const temp = name => `${name}_temp_path ${path.join(folder, name)};`;
  fs.writeFileSync(path.join(folder, 'nginx.conf'), [
    `pid ${path.join(folder, 'nginx.pid')};`,
    'events {}',
    `http { access_log ${path.join(folder, 'access.log')}; ${['client_body', 'proxy', 'fastcgi', 'uwsgi', 'scgi'].map(temp).join(' ')} include ${path.join(folder, 'default.conf')}; }`,
  ].join('\n'));
  return spawnSync(nginx, ['-t', '-e', 'stderr', '-p', folder, '-c', path.join(folder, 'nginx.conf')], { encoding: 'utf8' });
}

test('without ORCHESTRATOR_UPSTREAM /api and /realtime answer 404', { skip: !shell && 'no sh' }, t => {
  const run = runEntrypoint(t, undefined);

  assert.equal(run.status, 0, run.output);
  assert.match(run.proxy, /location \/api\/ \{ return 404; \}/);
  assert.match(run.proxy, /location \/realtime \{ return 404; \}/);
  assert.equal(run.bundle, 'const server = "broker.lan";');
  if (nginx) {
    const check = nginxTest(run.folder);
    assert.equal(check.status, 0, check.stderr);
  }
});

test('ORCHESTRATOR_UPSTREAM proxies /api and /realtime to the orchestrator', { skip: !shell && 'no sh' }, t => {
  const run = runEntrypoint(t, 'http://orchestrator:8080/');

  assert.equal(run.status, 0, run.output);
  assert.match(run.proxy, /location \/api\/ \{/);
  assert.match(run.proxy, /location \/realtime \{/);
  assert.match(run.proxy, /proxy_set_header Upgrade \$http_upgrade;/);
  assert.match(run.proxy, /client_max_body_size 64m;/, 'backup restores upload up to 64 MB');
  // With a DNS server the upstream is a variable, resolved per request; otherwise it is literal.
  assert.ok(run.proxy.includes('set $riot2_orchestrator http://orchestrator:8080;') || run.proxy.includes('proxy_pass http://orchestrator:8080;'), run.proxy);
  assert.doesNotMatch(run.proxy, /8080\/;/, 'the trailing slash is removed, so the path passes unchanged');
  if (nginx) {
    const check = nginxTest(run.folder);
    assert.equal(check.status, 0, check.stderr);
  }
});

test('an upstream with a path is refused', { skip: !shell && 'no sh' }, t => {
  const run = runEntrypoint(t, 'http://orchestrator:8080/api');

  assert.equal(run.status, 1);
  assert.match(run.output, /ORCHESTRATOR_UPSTREAM must be http\(s\):\/\/host\[:port\]/);
});
