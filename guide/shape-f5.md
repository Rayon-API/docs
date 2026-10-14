# Shape / F5

RayonAPI supports web Shape header generation. Customer-specific prefixes vary; keep returned names and values unchanged.

1. [Collect](./preparation-walkthrough.md) the loader, payload and required dependencies in execution order.
2. Call `POST /v1/shape` with full source, a measured profile and the exact application request.
3. [Apply](./applying-headers.md) the fresh headers using the same target session.

The complete family has six suffixes: `a`, `b`, `c`, `d`, `f`, `z`. The `d` value may be empty.

Loader-dependent payloads need both scripts and their exact URLs. Unsupported network dependencies are not downloaded by the API. Material references reuse source only; generate fresh headers for each request.

A successful generation does not guarantee target acceptance. Check the target's content and distinguish challenges from application errors using [troubleshooting](./troubleshooting.md).
