---
layout: home
hero:
  name: RayonAPI
  text: Shape telemetry generation
  tagline: Collect inputs. Prepare at startup. Generate fresh telemetry.
  actions:
    - theme: brand
      text: Get started
      link: /guide/quickstart
    - theme: alt
      text: API reference
      link: /reference/shape
---

RayonAPI generates Shape / F5 headers or form telemetry from your supplied JavaScript, profile and request context.

1. Install an SDK and check account usage for free.
2. Collect complete scripts, profile values and exact request details.
3. Explicitly prepare and wait for complete readiness.
4. Generate fresh telemetry and apply it through your existing HTTP client or browser.

The API never downloads target URLs. A generated header family does not guarantee target acceptance.

Start with the [quickstart](./guide/quickstart.md), or [prepare inputs](./guide/preparation-walkthrough.md) for your first integration.


The additive preparation API is available. Legacy generation remains available;
mandatory preparation is not enabled. A 30-day migration window and cutoff will
be announced separately; no cutoff date is set. Rust-only enforcement remains
gated on complete-output readiness and the announced migration. See [preparation status and lifecycle](./reference/preparation.md).
