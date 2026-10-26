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
3. In the coordinated preparation preview, explicitly prepare and wait for complete readiness.
4. Generate fresh telemetry and apply it through your existing HTTP client or browser.

The API never downloads target URLs. A generated header family does not guarantee target acceptance.

Start with the [quickstart](./guide/quickstart.md), or [prepare inputs](./guide/preparation-walkthrough.md) for your first integration.


The preparation-first flow is a coordinated release preview. Confirm availability;
the planned 30-day migration and mandatory Rust-only cutover are gated on the
announced backend rollout and complete-output readiness. Existing legacy serving
remains unchanged in this preview. See [preparation status and lifecycle](./reference/preparation.md).
