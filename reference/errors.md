# Errors and limits

Every API error uses a sanitized JSON envelope and `X-Request-ID`:

```json
{"error":{"code":"unsupported_material","message":"The supplied material could not generate the required headers.","request_id":"00000000-0000-4000-8000-000000000001"}}
```

| HTTP | Meaning |
| --- | --- |
| 402 | `insufficient_credits`: available generation allowance exhausted. |
| 401 | Missing, invalid or revoked API key. |
| 403 | Account, policy or domain access denied. |
| 404 / 405 | Unknown route / unsupported method. |
| 408 | `input_timeout`: upload exceeded the 20-second deadline; no generation quota consumed. |
| 410 | `api_retired`: URL-only `/solve` has been retired. |
| 413 | `input_too_large`. |
| 415 | Unsupported content type or content encoding. |
| 422 | Invalid request, unsupported material/profile, expired material or ambiguous header family. |
| 429 | Request rate or available generation capacity exceeded. Inspect `Retry-After`. |
| 503 | Service or generation worker unavailable. |
| 504 | Generation timed out. |

Generation POSTs are not automatically retried by the SDK. A network timeout may happen after admission and does not prove that the attempt was free. Each explicit retry is a new attempt with fresh request inputs.

Do not publish credentials, scripts, session cookies or application bodies when reporting errors.
