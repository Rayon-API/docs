# Prepare protection material

Download material with your existing target session, through the same sticky proxy and browser-grade transport used for the application request. Preserve the resulting cookie jar.

Identify the protection loader and payload for the workflow you are integrating. Keep only their required dependencies, in execution order. Do not upload the whole site's application bundle or assume any script on the page is a protection script.

For a first integration, follow the [preparation walkthrough](./preparation-walkthrough.md) to select scripts and measure your browser profile.

Each script needs its exact URL and full decoded source text. Preserve query parameters, including seeds. A payload that depends on a loader needs both. The API rejects unsupported or incomplete bundles; it does not fetch missing dependencies.

For example, your client can download explicitly selected script URLs:

```python
scripts = []
for script_url in protection_urls:
    response = target_session.get(script_url, allow_redirects=False, timeout=30)
    response.raise_for_status()
    scripts.append({"url": script_url, "source": response.text})
```

`protection_urls` is the ordered list discovered by your integration. `target_session` is your client-owned session. Check its responses for challenges rather than uploading a blocking page as JavaScript. Resolve relative URLs against the actual source page.

## Cookies and profile

Your cookie jar stays in your application. If protection code reads `document.cookie`, supply `document_cookie` with only the source document's JavaScript-visible cookie values. Do not include HttpOnly cookies or treat this string as a replacement cookie jar.

Send a [supported browser profile](./profiles.md). Material, cookies, profile and the final target request must belong to a consistent session. Site-specific application headers and authentication remain your responsibility.

## Reuse material

A successful generation returns `material_ref` and `material_expires_at`. For subsequent requests, supply the reference instead of `scripts`:

```python
next_shape = {
    "source_url": shape["source_url"],
    "material_ref": result.material_ref,
    "profile": shape["profile"],
    "request": next_request,
}
```

References belong to the API key that created them, expire after five minutes, and may expire sooner through eviction or restart. Keep your original material so you can upload it again after `material_expired`. No server download occurs. Every generation requires current request/profile/cookie inputs and produces fresh headers.

## Limits

The decoded JSON request is limited to 4 MiB; script source to 3 MiB total, 2 MiB per script and 16 scripts. Request body text is limited to 256 KiB. Smaller profile, cookie and output limits also apply; see the [reference](../reference/shape.md).
