# Quickstart

## 1. Create an API key

Open the [dashboard](https://dashboard.rayonapi.com), accept the current policies, request approval for your source and endpoint domains, then create a key. Store it server-side as `RAYON_API_KEY`.

## 2. Install an SDK

```sh
python -m pip install 'rayon-sdk-py>=1.0,<2'
```

```sh
npm install rayon-sdk-js@^1
```

## 3. Check access

This free call verifies your key and shows available allowance:

```sh
curl --fail-with-body --max-time 30 https://api.rayonapi.com/v1/usage \
  -H "Authorization: Bearer $RAYON_API_KEY"
```

## 4. Collect the inputs

Follow [your first integration](./preparation-walkthrough.md) to find the protection scripts, download their full source and save a measured `profile.json`. The resulting `material.json` contains `source_url` and ordered `scripts`.

Keep the target HTTP session open: its cookie jar, proxy and browser identity are needed when you send the application request.

## 5. Generate and apply headers

```python
import json
import os
from pathlib import Path
from rayon_sdk_py import Client

material = json.loads(Path("material.json").read_text(encoding="utf-8"))
profile = json.loads(Path("profile.json").read_text(encoding="utf-8"))
body = '{"username":"example_user"}'
shape = {
    **material,
    "profile": profile,
    "request": {
        "url": "https://shop.example.com/api/username",
        "method": "POST",
        "content_type": "application/json",
        "body": body,
    },
    # Add current document_cookie if the protection scripts read it.
}
Path("shape.json").write_text(json.dumps(shape, ensure_ascii=False), encoding="utf-8")
with Client(os.environ["RAYON_API_KEY"]) as client:
    result = client.generate(shape)
# Continue with the target_session that collected this material.
# Apply result.headers and send body.encode("utf-8") unchanged.
```

Replace the example endpoint with your approved endpoint. [Apply the headers](./applying-headers.md) in the existing target session and inspect the target response.

The SDK and API do not collect material or send the target request.

For observed URL-encoded form telemetry, follow [Form payload integration](../form-payload-integration.md). Inspect Payload → Form Data as well as headers; form mode requires SDK 1.1.0 when published, or direct REST.
