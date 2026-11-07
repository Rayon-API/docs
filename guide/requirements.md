# Core requirements

| Requirement | What to supply or keep consistent |
| --- | --- |
| Protection material | Source-page URL for a supported public source. Custom sources must be prepared before using a ready private reference. |
| Profile | A supported profile object. Supplied values match the represented environment; omitted fields use emulation defaults, not measurements. |
| Request context | Exact URL, method, content type and UTF-8 body sent to the target. |
| Application access | Authentication, CSRF, Origin, Referer and other headers when the target flow requires them. |
| Target state and transport | Preserve required session cookies, identity and proxy consistency when applicable. Choose the target HTTP client for your flow. |
| RayonAPI access | Approved source/endpoint domains and a server-side API key. Never send that key to the target. |

Ordinary HTTPS is sufficient for SDK calls to RayonAPI. The SDK accepts request context and does not configure your target transport. A browser capture, cookie import, proxy or particular transport library is not a universal API requirement.

Use the supported [material](./material.md) and [profile](./profiles.md) fields. Unknown fields are rejected; native Android/iOS protection protocols are outside the web Shape contract.

Start with the [preparation guide](./preparation-walkthrough.md).

Automatic selection supports header mode. Form mode requires a ready private reference.
See [material options](./material.md).
