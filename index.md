---
layout: home
hero:
  name: RayonAPI
  text: Shape header generation
  tagline: Supply your protection scripts and request context. Receive the headers for your next request.
  actions:
    - theme: brand
      text: Quickstart
      link: /guide/quickstart
    - theme: alt
      text: API reference
      link: /reference/shape
---

RayonAPI generates Shape / F5 telemetry headers from material you supply. Your application downloads the site's protection scripts, maintains its session and sends the resulting headers to the target.

The API does not visit websites, manage your target cookies or send application requests. Generation success means a complete header family was generated; target acceptance also depends on your session, transport and application inputs.

Python and JavaScript SDKs provide the same material-only interface. Begin with the [quickstart](./guide/quickstart.md) and [core requirements](./guide/requirements.md).
