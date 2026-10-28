import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
const root=fileURLToPath(new URL('../',import.meta.url));
const read=path=>readFileSync(root+path,'utf8');
for (const [path, generate, version] of [
 ['guide/python.md','client.generate','>=2.1.0,<3'],
 ['guide/javascript.md','client.generate','^2.1.0'],
 ['guide/go.md','client.Generate','/v2@v2.1.0'],
 ['guide/playwright.md','client.generateManaged','^1.1.0'],
]) test(path+' starts with managed generation',()=>{
 const text=read(path); assert.ok(text.includes(version));
 const block=text.match(/```(?:python|javascript|typescript|go)\n([\s\S]*?)\n```/)?.[1];
 assert.ok(block?.includes(generate)); assert.doesNotMatch(block,/prepareAndWait|prepare_and_wait|PrepareAndWait|collectMaterial/);
 assert.match(text,/optional/i);
});
test('optional preparation preserves validation, expiry and resumable waits',()=>{
 const text=read('reference/preparation.md');
 for(const word of ['queued','learning','validating','publishing','ready','failed','expired','ready_until','material_expires_at','Idempotency-Key','execution_backend']) assert.ok(text.includes(word),word);
 assert.match(text,/Omitting both is invalid/);
 assert.match(text,/partial internal mappings can be accepted/);
 assert.match(text,/required generated outputs must still/);
 assert.match(text,/Cancelling a wait stops the client wait; the server job continues/);
 assert.doesNotMatch(text,/30-day|cutoff/);
});

import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('Python REST default makes one managed generation call offline',()=>{
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
    shape=dict(source_url='https://example.com/',profile={},request=dict(url='https://example.com/',method='GET',body=None,content_type=None))
    Path('shape.json').write_text(json.dumps(shape))
    exec(${JSON.stringify(source)},{})
assert len(calls)==1
assert calls[0].full_url.endswith('/v1/shape')
assert json.loads(calls[0].data)==shape
assert 'scripts' not in shape and 'material_ref' not in shape
assert all(request.get_header('Authorization')=='Bearer offline-api-key' for request in calls)
`;
 const result=spawnSync('python3',['-c',harness],{encoding:'utf8'});
 assert.equal(result.status,0,result.stderr);assert.doesNotMatch(result.stdout,/private-source|offline-api-key/);
});
test('JavaScript REST default makes one managed generation call offline',()=>{
 const directory=mkdtempSync(join(tmpdir(),'rayon-preparation-docs-'));
 try {
  writeFileSync(join(directory,'shape.json'),JSON.stringify({source_url:'https://example.com/',profile:{},request:{url:'https://example.com/',method:'GET',body:null,content_type:null}}));
  const harness=`
import assert from 'node:assert/strict';
process.env.RAYON_API_KEY='offline-api-key';
const calls=[],id='0123456789abcdef0123456789abcdef';
const ready={preparation_id:id,state:'ready',status_url:'/v1/materials/preparations/'+id,material_ref:'ref_0123456789abcdef',ready_until:'2030-01-01T00:00:00Z',execution_backend:'rust'};
globalThis.fetch=async (url,options)=>{calls.push([url,options]);let value;if(url.endsWith('/prepare'))value={...ready,state:'queued',ready_until:null,execution_backend:null};else if(url.includes('/preparations/'))value=ready;else value={request_id:'req-safe',headers:{}};return new Response(JSON.stringify(value),{status:url.endsWith('/prepare')?202:200});};
await import(${JSON.stringify(new URL('../examples/rest.mjs',import.meta.url).href)});
assert.equal(calls.length,1);assert.ok(calls[0][0].endsWith('/v1/shape'));const sent=JSON.parse(calls[0][1].body);assert.ok(!('scripts' in sent));assert.ok(!('material_ref' in sent));assert.equal(calls[0][1].redirect,'error');
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
 assert.equal(schema.paths['/v1/materials/prepare'].post.requestBody.content['application/json'].schema.$ref,'#/components/schemas/ExplicitShapeRequest');
 const catalog=JSON.parse(read('scripts/fixtures/error-catalog.json')), errors=read('reference/errors.md');
 for(const reason of ['material_not_prepared','prepared_material_expired','material_learning','idempotency_conflict','preparation_unavailable','preparation_failed','preparation_expired','preparation_unauthorized','preparation_timeout','preparation_interrupted']){
  assert.ok(catalog[reason].codes.includes(reason));assert.ok(errors.includes(reason),reason);
 }
 const example=JSON.parse(read('reference/preparation.md').match(/```json\n([\s\S]*?)\n```/)[1]);
 assert.ok(new RegExp(prep.properties.preparation_id.pattern).test(example.preparation_id));
 assert.ok(new RegExp(prep.properties.status_url.pattern).test(example.status_url));
});

test('schema separates managed header selection from explicit preparation',()=>{
 const schema=JSON.parse(read('public/schema/shape-v1.openapi.json')).components.schemas;
 assert.equal(schema.ShapeRequest.oneOf.length,3);
 assert.equal(schema.ExplicitShapeRequest.oneOf.length,2);
 assert.equal(schema.ShapeRequest.oneOf[2].properties.mode.const,'header');
 for(const name of ['HeaderShapeResponse','FormShapeResponse']) for(const field of ['path','material_reuse','discovery_duration_ms','discovery_state','fallback_reason','fallback_message']) assert.ok(schema[name].properties[field]);
});
