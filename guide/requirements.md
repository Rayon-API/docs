# Core requirements

A solve produces capture data. Your application still controls the downstream request to the target website.

## Browser-grade TLS

Use a browser-compatible transport such as [`curl_cffi`](https://curl-cffi.readthedocs.io/en/latest/impersonate.html) for downstream target traffic, with an appropriate Chrome impersonation profile. Ordinary HTTP clients can present a different TLS fingerprint even when their HTTP headers look like a browser.

The Python SDK uses `curl_cffi` with Chrome impersonation for its request **to RayonAPI**. The JavaScript SDK uses `undici`. Neither configures the transport used by your own target requests.

## Header order and client profile

Preserve the returned header mapping's order when your client supports it. A mapping alone does not guarantee wire order, HTTP/2 settings, pseudo-header order, or the browser's complete network fingerprint.

Keep the user agent and other profile-dependent headers consistent with the profile you request and the returned `profile_used`. Avoid mixing a new profile with cookies or client state from another session.

## Stable egress

Use a stable, sticky egress IP for your downstream session when the target requires IP consistency. API transport and target transport are independent. Configuring a proxy for calls to RayonAPI does not align your target traffic with the capture environment.

The current public solve API has no proxy or route-alignment controls. Do not assume that an API request's source IP becomes the solver's target egress IP, or that these IPs can be automatically aligned.

## Cookie scope

Each returned cookie includes only `name`, `value`, `domain`, and `path`. Secure, host-only, expiry, and other browser attributes are not included, so the response cannot reconstruct the original browser cookie policy exactly.

Replay conservatively:

- Bind the replay client to the exact HTTPS origin you intend to call. An origin includes scheme, host, and port.
- Respect every cookie's domain and path. Do not broaden a cookie's scope to make it fit a request.
- Disable redirects while sending returned telemetry and cookies. Inspect a redirect before preparing a separate request to another origin.
- Use a scoped cookie jar. Do not blindly flatten all cookies into a `Cookie` header; cookies with the same name can have different scopes.

If your client cannot enforce the returned scope and your exact-origin restriction, do not replay the cookies with that client. Treat headers and cookies as sensitive session data and avoid logging them.

## Validate the actual workflow

Check the target response and application behavior on the intended protected route. Capture status alone does not establish enforcement success. Keep request method, body, application cookies, CSRF state, profile, TLS behavior, and egress consistent with the authorized workflow.
