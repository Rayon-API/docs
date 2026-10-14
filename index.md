---
layout: home
hero:
  name: RayonAPI
  text: Shape header generation
  tagline: Collect protection scripts. Generate headers. Send your exact request.
  actions:
    - theme: brand
      text: Get started
      link: /guide/quickstart
    - theme: alt
      text: API reference
      link: /reference/shape
---

RayonAPI generates Shape / F5 telemetry headers from your downloaded JavaScript, browser profile and request context.

1. Your client collects the protection scripts and keeps the target session.
2. `POST /v1/shape` returns fresh headers for one exact request.
3. Your client sends that request with the headers and its existing cookies.

The API never downloads target URLs. A generated header family does not guarantee target acceptance.

Start with the [quickstart](./guide/quickstart.md), or [collect material](./guide/preparation-walkthrough.md) for your first integration.
