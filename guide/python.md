# Python SDK

The [`rayon-sdk-py` repository](https://github.com/Rayon-API/rayon-sdk-py) provides the `rayon_sdk_py` import for Python 3.10+. It uses `curl_cffi` with Chrome impersonation for API transport. Your target client remains separate.

## Install

Version `0.1.0` is available on [PyPI](https://pypi.org/project/rayon-sdk-py/):

```sh
python -m pip install rayon-sdk-py==0.1.0
```

## Solve

```python
import os
from rayon_sdk_py import RayonError, SolveFailedError, SolveResult, solve

try:
    result: SolveResult = solve(
        "https://example.com/start",
        os.environ["RAYON_API_KEY"],
        profile=None,
        base_url="https://api.rayonapi.com",
        timeout=150,
    )
except SolveFailedError:
    raise SystemExit("Capture failed or was rejected")
except RayonError:
    raise SystemExit("API request failed; inspect the error safely")

# Preserve result.headers and the scope of result.cookies.
```

`solve(url, key, profile=..., base_url=..., timeout=150)` returns an accepted `SolveResult`. For an HTTP `200` response with `failed` or `rejected` capture status, it raises `SolveFailedError`, a subclass of `RayonError`. Catch that exception separately from other SDK/API request errors when your application needs different recovery behavior.

`profile` is an optional JSON-compatible mapping. Omit it to use the service default. If it contains a `profile` key, that nested value must be a JSON object. Keep your downstream client consistent with `profile_used`; the public contract does not otherwise promise a fixed profile-field schema.

`timeout` is the client timeout in seconds. `duration_ms` is the server's solve execution time and excludes client-side connection setup, network latency, and response processing. See the [response reference](../reference/solve.md#response).

Apply the [core requirements](./requirements.md) to downstream target requests. See the [example repository](https://github.com/Rayon-API/rayon-examples) for complete authorized workflow examples.
