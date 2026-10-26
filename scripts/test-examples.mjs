import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = fileURLToPath(new URL('../', import.meta.url));

test('application example permits an explicit API origin and preserves exact UTF-8 bodies', () => {
  const markdown = readFileSync(`${root}guide/applying-headers.md`, 'utf8');
  const code = markdown.match(/```python\n([\s\S]*?)\n```/)[1];
  const checks = `
from types import SimpleNamespace
class Session:
    def __init__(self): self.calls = []
    def request(self, *args, **kwargs): self.calls.append((args, kwargs))
for url, method, body, content_type in [
    ("https://api.shop.example.com/check", "POST", '{"name":"café"}\\n', "application/json"),
    ("https://shop.example.com/account", "GET", None, None),
]:
    session = Session()
    bindings = dict(shape={"request": dict(url=url, method=method, body=body, content_type=content_type)},
                    profile={"user_agent":"test-browser"}, application_headers={"Accept":"application/json"},
                    result=SimpleNamespace(headers={"fixture-a":"fresh"}), target_session=session)
    exec(${JSON.stringify(code)}, bindings)
    args, kwargs = session.calls[0]
    assert args == (method, url)
    assert kwargs["data"] == (body.encode("utf-8") if body is not None else None)
    assert kwargs["allow_redirects"] is False
    assert ("Content-Type" in kwargs["headers"]) == (content_type is not None)
for url in ["https://unapproved.example.com/check", "https://shop.example.com:0/check",
            "https://secret@shop.example.com/check", "https://shop.example.com/check#fragment"]:
    session = Session()
    bindings["target_session"] = session
    bindings["shape"]["request"]["url"] = url
    try: exec(${JSON.stringify(code)}, bindings)
    except ValueError: pass
    else: raise AssertionError("Unapproved destination was allowed")
    assert not session.calls
`;
  const result = spawnSync('python3', ['-c', checks], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
});

test('material example uses one configured session, preserves source and rejects challenge responses offline', () => {
  const markdown = readFileSync(`${root}guide/material.md`, 'utf8');
  const code = markdown.match(/```python\n([\s\S]*?)\n```/)[1];
  const checks = `
import json, os, sys, tempfile
from pathlib import Path
from types import SimpleNamespace
os.environ["CHROME_PROFILE"] = "fixture-browser"
os.environ["RAYON_TARGET_PROXY"] = "http://proxy.example.com:8080"
source = "// fixture source\\nconst text = 'café';\\n"
class Response:
    status_code = 200
    encoding = "utf-8"
    def __init__(self, content, media_type):
        self.content = content.encode("utf-8")
        self.headers = {"Content-Type": media_type}
    def raise_for_status(self): pass
class Session:
    created = []
    invalid = None
    def __init__(self, **options):
        self.options = options
        self.calls = []
        self.created.append(self)
    def get(self, url, **options):
        self.calls.append((url, options))
        if len(self.calls) == 1: return Response("<html>fixture page</html>", "text/html")
        if self.invalid: return Response(*self.invalid)
        return Response(source, "application/javascript; charset=utf-8")
sys.modules["curl_cffi"] = SimpleNamespace(requests=SimpleNamespace(Session=Session), CurlOpt=SimpleNamespace(PROXY="proxy"))
with tempfile.TemporaryDirectory() as directory:
    os.chdir(directory)
    Path("profile.json").write_text('{"user_agent":"fixture-UA"}', encoding="utf-8")
    bindings = {}
    exec(${JSON.stringify(code)}, bindings)
    assert len(Session.created) == 1
    session = Session.created[0]
    assert bindings["target_session"] is session
    assert session.options == dict(impersonate="fixture-browser", proxy="http://proxy.example.com:8080",
                                   trust_env=False, curl_options={}, headers={"User-Agent":"fixture-UA"})
    assert [url for url, _ in session.calls] == [bindings["source_url"], *bindings["protection_urls"]]
    assert all(options["allow_redirects"] is False for _, options in session.calls)
    material = json.loads(Path("material.json").read_text(encoding="utf-8"))
    assert [script["source"] for script in material["scripts"]] == [source, source]
    assert [script["url"] for script in material["scripts"]] == bindings["protection_urls"]
    assert set(material) == {"source_url", "scripts"}
    os.environ.pop("RAYON_TARGET_PROXY")
    Path("profile.json").write_text('{"navigator":{"userAgent":"fixture-UA"}}', encoding="utf-8")
    exec(${JSON.stringify(code)}, {})
    assert Session.created[-1].options["proxy"] is None
    assert Session.created[-1].options["curl_options"] == {"proxy": ""}
    assert Session.created[-1].options["headers"] == {"User-Agent":"fixture-UA"}
    for invalid in [("<html>challenge</html>", "text/html"),
                    ("<html>challenge</html>", "application/javascript"),
                    (source, "application/json"), ("", "application/javascript")]:
        Session.invalid = invalid
        try: exec(${JSON.stringify(code)}, {})
        except ValueError: pass
        else: raise AssertionError("Invalid material accepted")
`;
  const result = spawnSync('python3', ['-c', checks], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
});

test('public schema contains preparation, generation and usage routes and the USD wallet contract', () => {
  const schema = JSON.parse(readFileSync(`${root}public/schema/shape-v1.openapi.json`, 'utf8'));
  assert.deepEqual(Object.keys(schema.paths).sort(), ['/v1/materials/preparations/{preparation_id}', '/v1/materials/prepare', '/v1/shape', '/v1/usage'].sort());
  const allowance = schema.components.schemas.UsageResponse.properties.allowance;
  assert.ok(allowance.required.includes('wallet'));
  assert.ok(allowance.required.includes('payg_rate_per_1000_usd'));
  assert.equal(allowance.properties.prepaid_remaining.deprecated, true);
});

test('REST examples render on GitHub with language fences and match their runnable sources', () => {
  const markdown = readFileSync(`${root}guide/rest.md`, 'utf8');
  assert.doesNotMatch(markdown, /^<<<\s/m);
  for (const [language, file] of [['python', 'rest.py'], ['javascript', 'rest.mjs'], ['go', 'rest.go']]) {
    const block = markdown.match(new RegExp('```' + language + '\\n([\\s\\S]*?)\\n```'));
    assert.ok(block, `Missing ${language} syntax fence`);
    assert.equal(block[1], readFileSync(`${root}examples/${file}`, 'utf8').trimEnd());
  }
});
