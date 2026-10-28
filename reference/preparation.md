# Optional material preparation

Managed public header generation does not need preparation. Use these helpers
when you supply explicit material and want to check readiness before a workload.
Provide either `scripts` or `material_ref` with the full current source, profile,
request, cookies and mode/form context. Omitting both is invalid on this route.

Ready requires usable validated output and successful publication. Defaulted or
partial internal mappings can be accepted; required generated outputs must still
validate. A source reference alone does not establish readiness. Ready metadata
contains no scripts, cookies or generated telemetry. Generation is a separate call.

## Routes and authentication

Use the same server-side `Authorization: Bearer <API_KEY>` as `/v1/shape`.

| Operation | Request | Response |
| --- | --- | --- |
| Create a preparation | `POST /v1/materials/prepare` with the full explicit-material ShapeRequest | HTTP 200 when ready, HTTP 202 while pending |
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

Every state includes `preparation_id`, `state`, `status_url`, `retry_after_ms`,
`preparation_expires_at`, `material_ref`, `material_expires_at`, `ready_until`,
`execution_backend`, and `error`. Retry hints are integer milliseconds up to
60,000. Timestamps use RFC3339. Material reference/expiry are available before
readiness and do not establish that a job is ready. `ready_until` and
`execution_backend` are null unless ready; failed/expired states include a
sanitized structured error. SDKs expose trusted local guidance and discard
arbitrary server-authored prose.

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
  "execution_backend": "rust",
  "error": null
}
```

These are illustrative metadata values, not a deployed job.

## SDK helpers and resumption

| Client | Explicit methods |
| --- | --- |
| JavaScript / TypeScript 2.1.0 | `prepare`, `getPreparation`, `waitUntilReady`, `prepareAndWait` |
| Python 2.1.0 sync and async | `prepare`, `get_preparation`, `wait_until_ready`, `prepare_and_wait` |
| Go v2.1.0 (`/v2` module) | `Prepare`, `GetPreparation`, `WaitUntilReady`, `PrepareAndWait` |
| Playwright 1.1.0 | `prepareMaterial`, `prepareAndWait`, `getPreparation`, `waitUntilReady` |

JavaScript waits default to `waitTimeoutMs: 60000`; Python waits default to
`wait_timeout=60` seconds. Go waits respect the context and last at most 60 seconds.
Wait helpers use a monotonic budget and bounded long polling. Timeout/error metadata
includes a validated preparation ID so callers can resume an existing job.
Cancelling a wait stops the client wait; the server job continues running.
Python async cancellation raises a typed `PreparationError` with `kind="aborted"`
and a safe `preparation_id`. It does not send a server-side cancellation request.

Playwright `collectMaterial` only collects `CollectedMaterial`. The old
`PreparedMaterial` collector type is a deprecated alias, not evidence of server
readiness. Pass collected material plus its exact generation context to
`prepareMaterial` or `prepareAndWait` when you need a readiness check before generating.

## Expiry, context changes and fresh output

Readiness applies to the exact full source/profile/request/cookie/mode/form context
that was validated. A shared script bundle does not make a different request or
session ready. Preparation readiness is separate from source-only material caching;
clients do not coalesce preparation across different contexts.

`material_expires_at` is source-reference lifetime. `ready_until` is readiness
lifetime. `preparation_expires_at` bounds job resumption. A material reference can
outlive readiness. Reprepare explicitly after readiness expires, material changes,
or any relevant request/profile/session/form context changes. Retain current
source inputs so an expired reference can be replaced; update cookies/profile
from the represented client when the flow requires them.

A `ReadyMaterial` result contains safe metadata, not reusable old generated headers.
Generate fresh complete headers or form telemetry for each exact request. Apply
that result once through your own target integration; generation does not prove
target acceptance. Preserve the existing single confirmed unbilled material-miss
recovery policy and [check request history](./errors.md) for uncertain generation
outcomes. Preparation expiry does not authorize an arbitrary generation retry.
