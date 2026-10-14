import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
const guide = () => readFileSync(new URL('../form-payload-integration.md', import.meta.url), 'utf8');
test('form guide documents the public transport and exact ordered composition', () => {
  const text = guide();
  for (const term of ['POST /v1/shape', 'form_fields', 'form_body', 'application/x-www-form-urlencoded', 'Form Data', '1.1.0', 'CSRF', 'duplicate', 'separator', '410']) assert(text.includes(term), term);
  assert(!/mcdonald|starbucks|southwest|nordstrom|puma|homedepot/i.test(text));
  const config = readFileSync(new URL('../.vitepress/config.mts', import.meta.url), 'utf8');
  assert(config.includes("link: '/form-payload-integration'"));
});
test('Python and JavaScript form composition snippets preserve application bytes offline', () => {
  const text = guide();
  const python = text.match(/```python\n([\s\S]*?)\n```/)[1];
  const js = text.match(/```javascript\n([\s\S]*?)\n```/)[1];
  for (const body of ['', 'item=first&item=second&empty=&csrf=a%2Bb&name=caf%C3%A9&space=a+b']) {
    const telemetry = 'site-fielda=a%2Bb%2Fc%3D%26%C3%A9&site-fieldb=b&site-fieldc=c&site-fieldd=&site-fieldf=f&site-fieldz=z';
    const expected = telemetry + (body ? '&' + body : '');
    const preamble = `from types import SimpleNamespace\napplication_body=${JSON.stringify(body)}\nresult=SimpleNamespace(form_body=${JSON.stringify(telemetry)})\n`;
    const py = spawnSync('python3', ['-c', preamble + python + '\nprint(wire_body.decode("utf-8"))'], {encoding:'utf8'});
    assert.equal(py.status, 0, py.stderr);
    assert.equal(py.stdout.trim(), expected);
    const node = spawnSync(process.execPath, ['--input-type=module', '-e', `const applicationBody=${JSON.stringify(body)}; const result={form_body:${JSON.stringify(telemetry)}};\n${js}\nconsole.log(wireBody);`], {encoding:'utf8'});
    assert.equal(node.status, 0, node.stderr);
    assert.equal(node.stdout.trim(), expected);
    const pairs = [...new URLSearchParams(expected)];
    assert.equal(pairs[0][1], 'a+b/c=&é');
    assert.equal(pairs[3][1], '');
    assert.deepEqual(pairs.slice(6), [...new URLSearchParams(body)]);
  }
});

test('synthetic response contains a complete ordered form family and exact serialization', () => {
  const response = [...guide().matchAll(/```json\n([\s\S]*?)\n```/g)].map(match => JSON.parse(match[1])).find(value => value.form_fields);
  assert.deepEqual(Object.keys(response.form_fields), [...'abcdfz'].map(suffix => `site-field${suffix}`));
  assert.equal(response.form_fields['site-fieldd'], '');
  assert.equal(response.form_body, new URLSearchParams(Object.entries(response.form_fields)).toString());
  assert(!('headers' in response));
});
