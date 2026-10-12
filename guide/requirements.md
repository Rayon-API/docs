# Core requirements

## Client-owned target session

You download the protection scripts and send the final request. Keep one consistent user agent, supported browser profile, cookie jar and sticky proxy throughout the flow. Fetching scripts from one session and submitting generated headers from another can fail.

## Target transport

Use a browser-grade TLS client such as `curl_cffi` for protected target requests. Match its browser impersonation and header behavior to your profile. Configure the proxy explicitly; avoid accidental ambient proxy changes.

Ordinary HTTPS is sufficient for requests to RayonAPI. API SDK connections and target-site connections have separate responsibilities.

## Exact request context

Generate for the actual endpoint, method, content type and body. Preserve URL query parameters and body text. Do not change application data or reuse generated headers for a different request.

Keep required target authentication, application keys and CSRF headers. RayonAPI supplies telemetry headers; it does not supply accounts or invent target application credentials.

## Key security

Keep the RayonAPI key server-side, out of URLs, logs and source control. Never send it to the target. Use separate keys for applications and revoke compromised keys in the dashboard.

## Supported inputs

Use the [profile schema](./profiles.md) and [material format](./material.md). Unknown fields and unsupported material are rejected. Native-mobile SDK emulation is not claimed by this web Shape interface.
