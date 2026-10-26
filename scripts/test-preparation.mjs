import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
const root=fileURLToPath(new URL('../',import.meta.url));
const read=path=>readFileSync(root+path,'utf8');
for(const [path,prepare,generate,version] of [
 ['guide/python.md','prepare_and_wait','client.generate','>=2.0.0,<3'],
 ['guide/javascript.md','prepareAndWait','client.generate','^2.0.0'],
 ['guide/go.md','PrepareAndWait','client.Generate','/v2@v2.0.0'],
 ['guide/playwright.md','prepareAndWait','client.generate','^1.0.0'],
]) test(path+' prepares explicitly before generating',()=>{
 const text=read(path);
 assert.ok(text.includes(version));
 const block=text.match(/```(?:python|javascript|go)\n([\s\S]*?)\n```/)?.[1];
 assert.ok(block?.includes(prepare));
 assert.ok(block.indexOf(prepare)<block.indexOf(generate));
 assert.match(text,/coordinated|preview/i);
});
test('preparation reference distinguishes full readiness, expiry, cancellation and planned migration',()=>{
 const text=read('reference/preparation.md');
 for(const word of ['queued','learning','validating','publishing','ready','failed','expired','ready_until','material_expires_at','Idempotency-Key','execution_backend','30-day']) assert.ok(text.includes(word),word);
 assert.match(text,/complete.*output/i);
 assert.match(text,/partial.*(?:fail|ready)|(?:fail|ready).*partial/i);
 assert.match(text,/cancel.*wait.*(?:continues|running)|wait.*cancel.*(?:continues|running)/i);
 assert.match(text,/planned/i);
});

import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('Python REST startup polls queued job before reference generation offline',()=>{
 const source=read('examples/rest.py');
 const harness=`
import io,json,os,tempfile,urllib.request
from pathlib import Path
os.environ['RAYON_API_KEY']='offline-api-key'
calls=[]
class Response(io.BytesIO): status=200
ident='0123456789abcdef0123456789abcdef'
ready=dict(preparation_id=ident,state='ready',status_url='/v1/materials/preparations/'+ident,material_ref='ref_0123456789abcdef',ready_until='2030-01-01T00:00:00Z',execution_backend='rust')
def send(self,request,timeout):
    calls.append(request)
    if request.full_url.endswith('/prepare'): value={**ready,'state':'queued','ready_until':None,'execution_backend':None}
    elif '/preparations/' in request.full_url: value=ready
    else: value={'request_id':'req-safe','headers':{}}
    return Response(json.dumps(value).encode())
urllib.request.OpenerDirector.open=send
with tempfile.TemporaryDirectory() as directory:
    os.chdir(directory)
    shape=dict(source_url='https://example.com/',scripts=[dict(url='https://example.com/a.js',source='private-source')],profile={},request=dict(url='https://example.com/',method='GET',body=None,content_type=None))
    Path('shape.json').write_text(json.dumps(shape))
    exec(${JSON.stringify(source)},{})
assert len(calls)==3
assert calls[0].get_header('Idempotency-key')
assert calls[1].get_method()=='GET' and '?wait=10' in calls[1].full_url
assert calls[2].full_url.endswith('/v1/shape')
assert json.loads(calls[0].data)==shape
assert 'scripts' not in json.loads(calls[2].data)
assert all(request.get_header('Authorization')=='Bearer offline-api-key' for request in calls)
`;
 const result=spawnSync('python3',['-c',harness],{encoding:'utf8'});
 assert.equal(result.status,0,result.stderr);assert.doesNotMatch(result.stdout,/private-source|offline-api-key/);
});
test('JavaScript REST startup polls queued job before reference generation offline',()=>{
 const directory=mkdtempSync(join(tmpdir(),'rayon-preparation-docs-'));
 try {
  writeFileSync(join(directory,'shape.json'),JSON.stringify({source_url:'https://example.com/',scripts:[{url:'https://example.com/a.js',source:'private-source'}],profile:{},request:{url:'https://example.com/',method:'GET',body:null,content_type:null}}));
  const harness=`
import assert from 'node:assert/strict';
process.env.RAYON_API_KEY='offline-api-key';
const calls=[],id='0123456789abcdef0123456789abcdef';
const ready={preparation_id:id,state:'ready',status_url:'/v1/materials/preparations/'+id,material_ref:'ref_0123456789abcdef',ready_until:'2030-01-01T00:00:00Z',execution_backend:'rust'};
globalThis.fetch=async (url,options)=>{calls.push([url,options]);let value;if(url.endsWith('/prepare'))value={...ready,state:'queued',ready_until:null,execution_backend:null};else if(url.includes('/preparations/'))value=ready;else value={request_id:'req-safe',headers:{}};return new Response(JSON.stringify(value),{status:url.endsWith('/prepare')?202:200});};
await import(${JSON.stringify(new URL('../examples/rest.mjs',import.meta.url).href)});
assert.equal(calls.length,3);assert.ok(calls[0][1].headers['idempotency-key']);assert.equal(calls[1][1].method,'GET');assert.ok(calls[1][0].endsWith('?wait=10'));assert.ok(calls[2][0].endsWith('/v1/shape'));assert.equal(JSON.parse(calls[2][1].body).material_ref,ready.material_ref);assert.ok(!('scripts' in JSON.parse(calls[2][1].body)));assert.ok(calls.every(c=>c[1].redirect==='error'));
`;
  const result=spawnSync(process.execPath,['--input-type=module','-e',harness],{cwd:directory,encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);assert.doesNotMatch(result.stdout,/private-source|offline-api-key/);
 } finally {rmSync(directory,{recursive:true,force:true});}
});


test('preparation schema and shared safe error catalog describe the additive contract',()=>{
 const schema=JSON.parse(read('public/schema/shape-v1.openapi.json'));
 const prep=schema.components.schemas.Preparation;
 assert.equal(prep.additionalProperties,false);
 assert.deepEqual(prep.required.slice().sort(),['preparation_id','state','status_url','retry_after_ms','preparation_expires_at','material_ref','material_expires_at','ready_until','execution_backend','error'].sort());
 assert.deepEqual(prep.properties.state.enum,['queued','learning','validating','publishing','ready','failed','expired']);
 assert.equal(prep.properties.retry_after_ms.maximum,60000);
 assert.equal(schema.paths['/v1/materials/prepare'].post.requestBody.content['application/json'].schema.$ref,'#/components/schemas/ShapeRequest');
 const catalog=JSON.parse(read('scripts/fixtures/error-catalog.json')), errors=read('reference/errors.md');
 for(const reason of ['material_not_prepared','prepared_material_expired','material_learning','idempotency_conflict','preparation_unavailable','preparation_failed','preparation_expired','preparation_unauthorized','preparation_timeout','preparation_interrupted']){
  assert.ok(catalog[reason].codes.includes(reason));assert.ok(errors.includes(reason),reason);
 }
 const example=JSON.parse(read('reference/preparation.md').match(/```json\n([\s\S]*?)\n```/)[1]);
 assert.ok(new RegExp(prep.properties.preparation_id.pattern).test(example.preparation_id));
 assert.ok(new RegExp(prep.properties.status_url.pattern).test(example.status_url));
});
