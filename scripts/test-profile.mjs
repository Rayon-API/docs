import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import test from 'node:test';

const root = fileURLToPath(new URL('../', import.meta.url));

test('profile collector reads available values without inventing a GPU or changing navigator', () => {
  const code = readFileSync(`${root}public/examples/capture-profile.js`, 'utf8');
  for (const available of [false, true]) {
    let copied;
    let released = false;
    const navigator = Object.freeze({ userAgent: 'actual-UA', platform: 'MacIntel',
      language: 'en-US', languages: ['en-US', 'en'], hardwareConcurrency: 8,
      maxTouchPoints: 0, cookieEnabled: true, doNotTrack: null });
    const gl = {
      getExtension(name) { return name === 'WEBGL_debug_renderer_info'
        ? { UNMASKED_VENDOR_WEBGL: 1, UNMASKED_RENDERER_WEBGL: 2 }
        : { loseContext() { released = true; } }; },
      getParameter(parameter) { return parameter === 1 ? 'measured-vendor' : 'measured-renderer'; },
    };
    const context = { navigator, screen: { width: 1920, height: 1080, availWidth: 1920,
      availHeight: 1040, colorDepth: 24, pixelDepth: 24 },
      window: { innerWidth: 1280, innerHeight: 720, outerWidth: 1280, outerHeight: 800,
        devicePixelRatio: 2, screenX: 0, screenY: 0, screenLeft: 0, screenTop: 0,
        pageXOffset: 0, pageYOffset: 0 },
      document: { createElement() { return { getContext() { return available ? gl : null; } }; } },
      copy(value) { copied = JSON.parse(value); } };
    vm.runInNewContext(code, context);
    assert.equal(copied.user_agent, navigator.userAgent);
    assert.equal(copied.window.devicePixelRatio, 2);
    assert.equal(copied.navigator.hardwareConcurrency, 8);
    assert.equal('webdriver' in copied.navigator, false);
    assert.equal('canvas' in copied, false);
    assert.equal('document_cookie' in copied, false);
    assert.deepEqual(copied.languages, ['en-US', 'en']);
    if (available) assert.deepEqual(copied.webgl, {vendor: 'measured-vendor', renderer: 'measured-renderer'});
    else assert.equal('webgl' in copied, false);
    assert.equal(released, available);
  }
});
