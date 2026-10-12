# Shape / F5

RayonAPI returns a family of six telemetry headers whose names have a customer-specific prefix and the suffixes `a`, `b`, `c`, `d`, `f`, and `z`. Prefixes vary: use the names returned for your target, rather than hard-coding a prefix from another site. The `d` header may have an empty value; preserve it.

## Use the real source page

`target_url` should identify the actual source page that starts the target workflow. A page where telemetry is collected and a protected application endpoint are different URLs with different roles.

For example, a visit to an account page may precede a request to a login API. That does not mean a solve for the account page binds its returned telemetry to any login method or body. Confirm which source page belongs to your authorized application flow.

## Respect the public API boundary

The current public API accepts only `target_url` and optional `profile`. It does not expose a protected endpoint URL, downstream method, body, or proxy configuration. It cannot express full request binding or promise automatic route and proxy alignment. `/verify` is not a public endpoint.

Prepare the downstream request in your own application. Match the intended route, application payload, required application API key, CSRF state, session cookies, profile, browser-grade TLS, and egress requirements.

## Interpret capture results

`accepted` means all six headers were captured. It does not establish that the downstream endpoint enforces or accepts them, and it does not demonstrate a 99% success rate.

Validate the actual protected endpoint with the correct authorized workflow. A target rejection can result from a malformed application body, missing application API key or CSRF header, inconsistent cookies, or a changed profile, TLS fingerprint, or IP. Start with the target's application error before attributing every rejection to telemetry.

See [core requirements](./requirements.md), [troubleshooting](./troubleshooting.md), and the [examples repository](https://github.com/Rayon-API/rayon-examples).
