# Playwright SDK

Use this optional server-side adapter when you already own a Playwright `Page`.
It wraps the JavaScript SDK and keeps your browser, context, proxy and session under
your control. Requires Node.js 20.18.1+ and your existing Playwright setup.
The preparation API is available. Install the 1.0.0 adapter:

```sh
npm install rayon-sdk-playwright@^1.0.0 playwright-core
```

[Source and releases](https://github.com/Rayon-API/rayon-sdk-playwright).

## Check usage, collect, prepare, wait, generate and apply

If you already have collected material, skip collection and explicitly prepare it
with the exact generation context before calling `generate`.
Otherwise supply the exact script URLs in execution order and an action on your
existing page that causes their responses. Collection does not discover URLs,
launch a browser or send the protected target request for you. Review the action
because it runs in your existing authenticated browser.

```javascript
import { RayonPlaywright } from 'rayon-sdk-playwright';

// page belongs to your application; keep the API key in Node, outside the page.
const apiKey = process.env.RAYON_API_KEY;
if (!apiKey) throw new Error('Set RAYON_API_KEY');
const client = new RayonPlaywright(apiKey);
try {
  console.log(await client.usage()); // Free; no generation quota used.
  const material = await client.collectMaterial(page, {
    scriptUrls: ['https://shop.example.com/protection.js?seed=observed'],
    action: async () => { await page.reload(); },
    // Set includeDocumentCookie: true only when the protection needs it.
  });
  const generationContext = {
    request: {
      url: 'https://shop.example.com/api/check',
      method: 'POST',
      content_type: 'application/json',
      body: '{"username":"example_user"}',
    },
  };
  const ready = await client.prepareAndWait(material, generationContext, { waitTimeoutMs: 60000 });
  const result = await client.generate(material, generationContext);
  // Apply result.headers to that exact request in your existing integration.
  // Reuse client here for further requests with their current inputs.
} finally {
  await client.close();
}
```

The URLs and application request are placeholders. Collected profile values describe
that page; the adapter does not invent measurements or capture protection-specific
canvas pixels. JavaScript-visible cookies are opt-in; HttpOnly cookies remain in your
browser. See the shared [input guide](./preparation-walkthrough.md) for completeness
and session requirements.

Collection supports `timeoutMs` and `signal`. Generation accepts JavaScript SDK
request options, including `signal`, and header/form mode overloads. For
[form telemetry](../form-payload-integration.md), pass `mode: 'form'` and compose
`result.form_body` once with the original encoded application body. `close()`
(or `dispose()`) closes the adapter's API client; your browser remains caller-owned.
See [material reuse](./material.md#4-reuse-source-with-a-material-reference) and
[errors](../reference/errors.md) for the underlying JavaScript client's policy.

[Python](./python.md) · [JavaScript / TypeScript](./javascript.md) · [Go](./go.md) · [Playwright](./playwright.md)

`collectMaterial` returns `CollectedMaterial` and does not create a server job.
The old collector type `PreparedMaterial` is a deprecated alias, not server
readiness. Use `prepareMaterial(material, generationContext, options)` to start a
job, then `getPreparation` or `waitUntilReady` to inspect/resume it; or explicitly
combine the steps with `prepareAndWait` as above. A ready result contains safe
metadata, not old generated headers. Cancelling a wait leaves the server job
running. Prepare again after readiness expiry or relevant full-context changes.
See [preparation states and the planned migration](../reference/preparation.md).
