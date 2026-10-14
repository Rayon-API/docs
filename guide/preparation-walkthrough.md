# Collect inputs for your first request

Use your browser's actual traffic to identify the material. The API receives what you collect; it does not inspect the site.

## 1. Find the protection scripts

1. Open the source page in your browser. In DevTools → **Network**, enable **Preserve log**, clear the log and perform the intended action.
2. Select the protected application request. Record its URL, method, content type, body and required application headers.
3. Inspect **Initiator** and nearby JavaScript requests to identify the protection loader, payload and required dependencies. Dynamic payloads may appear only after the action.
4. Copy each full script URL, including query parameters, and note execution order. Inspect the response source to confirm it is protection JavaScript.

`source_url` is the page where that code executes, such as `https://shop.example.com/account`; `request.url` is the endpoint you will call. Script URLs describe script location and execution context. None tells RayonAPI to download anything.

An initiator chain is evidence to inspect, not a list to upload wholesale. Scanning static HTML or downloading every `<script>` cannot guarantee a complete bundle.

## 2. Save the measured profile

1. Open the [profile collector](/examples/capture-profile.js), select all its source and copy it.
2. On the source page, open DevTools → **Sources → Snippets**, create a snippet, paste the code and run it with **Ctrl+Enter** (**Cmd+Enter** on macOS).
3. The final `copy(...)` call places JSON on your clipboard. Paste it into a local UTF-8 file named `profile.json`, outside source control.
4. Validate it before generation:

```python
import json
from pathlib import Path
from rayon_sdk_py import validate_profile

profile = validate_profile(json.loads(Path("profile.json").read_text(encoding="utf-8")))
```

The collector reads browser identity, dimensions and available WebGL values. It omits unavailable GPU values, cookies and protection-specific canvas pixels. Capture required canvas pixels separately. Match your target client's TLS impersonation and headers to this browser; the profile alone does not configure them.

## 3. Fetch the selected URLs in your client

Use the [material download example](./material.md) with your chosen URLs and one `curl_cffi.Session`. Fetch the source page, required loader and payload through the same sticky proxy used for the final request. Check every response before saving source.

Browser cookies are not automatically present in an HTTP client. Establish the client session's required application state; browser capture identifies the flow, while the client must collect material for its own current session.

## 4. Generate for the exact request

Supply the downloaded sources, profile, current JavaScript-visible cookies if needed, and all four request fields. Keep the original body string: whitespace, key order and Unicode bytes matter.

Follow the [quickstart](./quickstart.md), then [apply the headers](./applying-headers.md) before closing the target session. Check target status and content for both protection challenges and application errors.

## Run the complete example

The [examples repository](https://github.com/Rayon-API/rayon-examples) provides a runnable workflow. It fetches explicitly supplied script URLs; it does not discover them.

```sh
git clone https://github.com/Rayon-API/rayon-examples.git
cd rayon-examples
python -m pip install -r requirements.txt
mkdir -p local
```

Save `local/profile.json`, your exact UTF-8 `local/request-body.txt`, and `local/document-cookie.txt` (current JavaScript-visible cookie string with no trailing newline; an empty file is allowed). For a matching browser-state import, run `copy(document.cookie)` in the source page Console and save the clipboard without an added newline; do not use a snapshot from an unrelated session. Set URL variables from your integration and `CHROME_PROFILE` to the matching transport profile.

```sh
python -m examples.request_workflow \
  --source-url "$SOURCE_URL" \
  --request-url "$REQUEST_URL" \
  --method POST \
  --content-type application/json \
  --body-file local/request-body.txt \
  --profile local/profile.json \
  --document-cookie-file local/document-cookie.txt \
  --script-url "$LOADER_URL" \
  --script-url "$PAYLOAD_URL" \
  --impersonate "$CHROME_PROFILE"
```

This validates inputs offline. Add `--fetch-and-generate` to collect material and call RayonAPI, or `--send` for collection → generation → target request in one live session. Set `RAYON_API_KEY` for either network mode. The generation-only mode does not preserve a session for a later send.

Optional inputs: `--cookies-file local/cookies.txt` imports a Netscape cookie jar with domain/path/HttpOnly scope; `--headers-file local/headers.json` supplies application headers. Set `RAYON_TARGET_PROXY` for a sticky proxy; ambient proxies are disabled. Keep the document-cookie snapshot consistent with cookies updated during collection.

The helper allows the source page's HTTPS origin by default. For another approved endpoint origin, add `--allow-request-origin https://api.shop.example.com` (repeat for each origin). Use an origin without path/query; the jar preserves cookie scope across hosts. Output contains a request ID and, with `--send`, target HTTP status. Inspect target content in your integration to establish acceptance.
