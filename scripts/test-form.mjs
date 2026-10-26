import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
const guide = () => readFileSync(new URL('../form-payload-integration.md', import.meta.url), 'utf8');
test('form guide documents the public transport and exact ordered composition', () => {
  const text = guide();
  for (const term of ['POST /v1/shape', 'form_fields', 'form_body', 'application/x-www-form-urlencoded', 'Form Data', '1.1.0', 'CSRF', 'duplicate', 'separator']) assert(text.includes(term), term);
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

test('public schema separates form output and applies conditional input types', () => {
  const schema = JSON.parse(readFileSync(new URL('../public/schema/shape-v1.openapi.json', import.meta.url), 'utf8'));
  assert.deepEqual(Object.keys(schema.paths).sort(), ['/v1/materials/preparations/{preparation_id}', '/v1/materials/prepare', '/v1/shape', '/v1/usage'].sort());
  const definitions = schema.components.schemas;
  assert.equal(definitions.ShapeRequest.properties.mode.default, 'header');
  assert.deepEqual(definitions.ShapeRequest.properties.mode.enum, ['header', 'form']);
  const branch = definitions.ShapeRequest.allOf[0];
  assert.deepEqual(branch.if.required, ['mode']);
  assert.equal(branch.if.properties.mode.const, 'form');
  assert.equal(branch.then.properties.request.properties.method.const, 'POST');
  assert.equal(branch.then.properties.request.properties.body.type, 'string');
  assert.deepEqual(branch.else.not.required, ['form']);
  assert.deepEqual(definitions.ShapeResponse.oneOf.map(item => item.$ref), ['#/components/schemas/HeaderShapeResponse', '#/components/schemas/FormShapeResponse']);
  assert(!('headers' in definitions.FormShapeResponse.properties));
  assert(!('form_body' in definitions.HeaderShapeResponse.properties));
  assert(definitions.FormShapeResponse.required.includes('form_body'));
  assert(definitions.FormShapeResponse.required.includes('form_fields'));
  assert.equal(definitions.FormShapeResponse.properties.form_fields.minProperties, 6);
  assert.equal(definitions.FormShapeResponse.properties.form_fields.maxProperties, 6);
  assert.match(definitions.FormShapeResponse.properties.form_body.description, /Telemetry only/);
  assert.match(definitions.FormShapeResponse.properties.form_body.description, /no application fields/);
});

test('direct REST continuation preserves exact form bytes and the existing target session offline', () => {
  const code = readFileSync(new URL('../examples/form-rest.py', import.meta.url), 'utf8');
  assert(guide().includes(code.trim()));
  const checks = `
import io, json, os, tempfile, urllib.request
from pathlib import Path
from types import SimpleNamespace
os.environ['RAYON_API_KEY'] = 'offline-api-key'
body='item=first&item=second&empty=&csrf=a%2Bb&submit=continue&name=caf%C3%A9'
telemetry='site-fielda=a%2Bb&site-fieldb=b&site-fieldc=c&site-fieldd=&site-fieldf=f&site-fieldz=z'
api_calls=[]
class APIResponse(io.BytesIO):
    status=200
def api_send(self, request, timeout):
    api_calls.append(request)
    if request.full_url.endswith('/v1/materials/prepare'):
        return APIResponse(json.dumps(dict(preparation_id='0123456789abcdef0123456789abcdef', state='ready', status_url='/v1/materials/preparations/0123456789abcdef0123456789abcdef', material_ref='ref_0123456789abcdef', ready_until='2030-01-01T00:00:00Z', execution_backend='rust')).encode())
    return APIResponse(json.dumps(dict(form_body=telemetry, profile_used={'user_agent':'fixture-UA'}, request_id='fixture')).encode())
urllib.request.OpenerDirector.open=api_send
class TargetSession:
    def __init__(self): self.calls=[]; self.cookies={'session':'client-only'}
    def request(self, *args, **kwargs):
        self.calls.append((args, kwargs))
        return SimpleNamespace(status_code=200)
session=TargetSession()
with tempfile.TemporaryDirectory() as directory:
    os.chdir(directory)
    Path('request-body.txt').write_bytes(body.encode())
    Path('document-cookie.txt').write_bytes(b'visible=current')
    Path('application-headers.json').write_text(json.dumps({'Accept':'text/html','X-CSRF':'current','content-length':'10','Cookie':'stale','Host':'stale','Content-Type':'old','User-Agent':'old'}))
    bindings=dict(target_session=session, source_url='https://shop.example.com/account', scripts=[{'url':'https://shop.example.com/protection.js','source':'// fixture'}], profile={'user_agent':'fixture-UA'})
    exec(${JSON.stringify(code)}, bindings)
    assert bindings['target_session'] is session
    generated=json.loads(api_calls[0].data)
    assert generated['mode']=='form'
    assert generated['request']['body']==body
    assert generated['document_cookie']=='visible=current'
    assert 'session' not in generated['document_cookie']
    assert api_calls[0].full_url=='https://api.rayonapi.com/v1/materials/prepare'
    assert api_calls[0].get_header('Idempotency-key')
    assert api_calls[1].full_url=='https://api.rayonapi.com/v1/shape'
    assert 'scripts' not in json.loads(api_calls[1].data)
    assert api_calls[0].get_header('Authorization')=='Bearer offline-api-key'
    args, options=session.calls[0]
    assert args==('POST','https://shop.example.com/account')
    assert options['data']==(telemetry+'&'+body).encode()
    assert options['allow_redirects'] is False
    assert options['headers']=={'Accept':'text/html','X-CSRF':'current','Content-Type':'application/x-www-form-urlencoded','User-Agent':'fixture-UA'}
    assert session.cookies=={'session':'client-only'}
`;
  const result = spawnSync('python3', ['-c', checks], {encoding:'utf8'});
  assert.equal(result.status, 0, result.stderr);
});

test('form schema constrains media type with one optional UTF-8 charset', () => {
  const schema = JSON.parse(readFileSync(new URL('../public/schema/shape-v1.openapi.json', import.meta.url), 'utf8'));
  const pattern = schema.components.schemas.ShapeRequest.allOf[0].then.properties.request.properties.content_type.pattern;
  const mime = new RegExp(pattern);
  for (const type of ['application/x-www-form-urlencoded', 'Application/X-WWW-Form-Urlencoded; charset="UTF-8"', 'application/x-www-form-urlencoded; charset=utf8']) assert(mime.test(type), type);
  for (const type of ['application/json', 'application/x-www-form-urlencoded; charset=latin1', 'application/x-www-form-urlencoded; charset=utf8; x=y']) assert(!mime.test(type), type);
});
