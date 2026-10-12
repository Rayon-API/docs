# Quickstart

## Get access

Open the [dashboard](https://dashboard.rayonapi.com), accept the current policies, request approval for your source and API domains, and create a key. Store it server-side as `RAYON_API_KEY`.

## Install

```sh
python -m pip install 'rayon-sdk-py>=1.0,<2'
```

```sh
npm install rayon-sdk-js@^1
```

Version 1 uses client-supplied material. Follow the [migration guide](./migration.md) if your application uses version 0.1.

## Prepare the material

Use your own target HTTP session to download the protection loader and payload. Keep their full source, exact URLs and execution order in a local JSON file:

```json
{
  "source_url": "https://example.com/account",
  "scripts": [
    {"url": "https://example.com/loader.js", "source": "/* Full downloaded loader source */"},
    {"url": "https://example.com/protection.js?seed=example", "source": "/* Full downloaded protection source */"}
  ]
}
```

These comment-only script values illustrate the format; they cannot generate headers. Supply actual protection source and dependencies. See [material preparation](./material.md).

## Generate headers

Read the material and your supported profile from files owned by your application:

```python
import json
import os
from pathlib import Path
from rayon_sdk_py import Client

material = json.loads(Path("material.json").read_text())
profile = json.loads(Path("profile.json").read_text())
body = json.dumps({"username": "example_user"}, separators=(",", ":"))
shape = {
    **material,
    "profile": profile,
    "request": {
        "url": "https://example.com/api/username",
        "method": "POST",
        "content_type": "application/json",
        "body": body,
    },
}
with Client(os.environ["RAYON_API_KEY"]) as client:
    result = client.generate(shape)
# Apply result.headers to this exact request in your existing target session.
```

Send the same body string to the target. Keep your target cookies and browser identity consistent; RayonAPI does not return replacement cookies. See [applying results](./applying-headers.md).
