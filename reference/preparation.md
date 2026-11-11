# Custom material preparation

Managed public header generation does not need preparation. Custom material must complete this lifecycle before generation.
Provide either `scripts` or `material_ref` with the full current source, profile,
request, cookies and mode/form context. Omitting both is invalid on this route.

Ready means validation and publication succeeded for the supported input scope.
Incomplete preparations cannot be used for generation. A queued job may already
contain a reference; wait for `state: ready` before using it.

## Routes and authentication

Use the same server-side `Authorization: Bearer <API_KEY>` as `/v1/shape`.

| Operation | Request | Response |
| --- | --- | --- |
| Create a preparation | `POST /v1/materials/prepare` with the full ExplicitShapeRequest | HTTP 200 when ready, HTTP 202 while pending |
| Read or long poll a job | `GET /v1/materials/preparations/{preparation_id}?wait=0` | HTTP 200 with the current state |

`wait` is an integer from 0 through 10 seconds. Prefer `wait=10` for long polling,
bounded by the remaining client wait budget. `wait=0` returns immediately.
Unknown IDs and jobs owned by another API key return HTTP 404. Keep the job ID
for resumption; it is opaque and must not be parsed or derived. The current service emits
32 lowercase hexadecimal characters. Treat `status_url` as the same-origin relative route for
that ID, never as an arbitrary URL to follow.

Create one `Idempotency-Key` for each logical prepare invocation. If an advanced
REST client retries an uncertain POST, it must use that same key and identical
full request. Do not create a new key merely to retry an uncertain response.
The SDKs issue the POST once; status/wait helpers retry only transient GET failures
with jitter. They do not retry arbitrary generation requests.

## States and response metadata

| State | Meaning / next step |
| --- | --- |
| `queued` | Accepted; wait or resume status reads. |
| `learning` | The supplied full context is being prepared. |
| `validating` | Required generated outputs are being checked. |
| `publishing` | Validated material is being made available. |
| `ready` | Validation/publication succeeded; readiness has a bounded lifetime. |
| `failed` | Terminal failure; inspect safe structured metadata, correct the inputs, and explicitly prepare again. |
| `expired` | The preparation has expired; explicitly prepare again with current inputs. |

Responses include the job ID, state, reference, expiry timestamps, polling hint
and a safe error when preparation fails. Retry hints are integer milliseconds up
to 60,000. Timestamps use RFC3339. Legacy diagnostic metadata may also be present;
use `state` to determine readiness.

Example readiness fields (legacy diagnostics omitted):

```json
{
  "preparation_id": "0123456789abcdef0123456789abcdef",
  "state": "ready",
  "status_url": "/v1/materials/preparations/0123456789abcdef0123456789abcdef",
  "retry_after_ms": 0,
  "preparation_expires_at": "2030-01-01T01:00:00Z",
  "material_ref": "ref_0123456789abcdef",
  "material_expires_at": "2030-01-01T01:00:00Z",
  "ready_until": "2030-01-01T00:10:00Z",
  "error": null
}
```

These are illustrative metadata values, not a deployed job.

## SDK helpers and resumption

| Client | Explicit methods |
| --- | --- |
| JavaScript / TypeScript 3 | `prepare`, `getPreparation`, `waitUntilReady`, `prepareAndWait` |
| Python 3 sync and async | `prepare`, `get_preparation`, `wait_until_ready`, `prepare_and_wait` |
| Go v3 (`/v3` module) | `Prepare`, `GetPreparation`, `WaitUntilReady`, `PrepareAndWait` |
| Playwright 2 | `prepareMaterial`, `prepareAndWait`, `getPreparation`, `waitUntilReady` |

JavaScript waits default to `waitTimeoutMs: 60000`; Python waits default to
`wait_timeout=60` seconds. Go waits respect the context and last at most 60 seconds.
Wait helpers use a monotonic budget and bounded long polling. Timeout/error metadata
includes a validated preparation ID so callers can resume an existing job.
Cancelling a wait stops the client wait; the server job continues running.
Python async cancellation raises a typed `PreparationError` with `kind="aborted"`
and a safe `preparation_id`. It does not send a server-side cancellation request.

Playwright `collectMaterial` only collects `CollectedMaterial`. The ambiguous
`PreparedMaterial` collector alias was removed in adapter major 2. Pass collected material plus its exact generation context to
`prepareMaterial` or `prepareAndWait` when you need a readiness check before generating.

## Expiry, context changes and fresh output

Readiness covers the validated source, profile, request, cookie and mode/form
scope. Reuse the reference only within that scope. An unchanged script bundle
does not establish coverage for another origin or session.

`material_expires_at` is source-reference lifetime. `ready_until` is readiness
lifetime. `preparation_expires_at` bounds job resumption. A material reference can
outlive readiness. Reprepare explicitly after readiness expires, material changes,
or inputs move outside the validated scope. Retain current
source inputs so an expired reference can be replaced; update cookies/profile
from the represented client when the flow requires them.

A `ReadyMaterial` result contains safe metadata, not reusable old generated headers.
Generate fresh complete headers or form telemetry for each exact request. Apply
that result once through your own target integration; generation does not prove
target acceptance. The SDK never retries a generation automatically.
[Check request history](./errors.md) after an uncertain generation outcome. Preparation expiry does not authorize an arbitrary generation retry.
