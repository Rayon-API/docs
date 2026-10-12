# Direct REST examples

Use `POST https://api.rayonapi.com/solve` with a bearer key from `RAYON_API_KEY`. Replace `https://example.com/start` with the actual source page on an approved domain. These examples call the API only; they do not send target requests.

Each example checks both the HTTP result and capture status. They avoid printing API keys, telemetry, or cookies. See [errors and limits](../reference/errors.md) for retry handling before adding retries to an application.

## Python

Install the API transport dependency:

```sh
python -m pip install curl_cffi
```

<<< ../examples/rest.py

## JavaScript

Run as an ES module on Node 22. Native `fetch` is suitable for API transport; it does not supply browser-grade TLS for downstream target traffic.

<<< ../examples/rest.mjs{js}

## Go

This standard-library example requires Go 1.20 or later. Its `http.Client` calls RayonAPI; use a browser-compatible transport for downstream target traffic.

<<< ../examples/rest.go

## Continue to the target

An accepted capture requires a separate target client with appropriate TLS, profile, stable egress, and cookie scope. Apply the [core requirements](./requirements.md). The public API has no downstream route or proxy controls.

More workflow examples live in [`rayon-examples`](https://github.com/Rayon-API/rayon-examples).
