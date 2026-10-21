# Shape / F5

RayonAPI supports web Shape header generation. Customer-specific prefixes vary; keep returned names and values unchanged.

1. [Prepare](./preparation-walkthrough.md) the loader, payload and required dependencies in execution order.
2. Call `POST /v1/shape` with full source, a profile appropriate to the represented environment and the exact application request.
3. [Apply](./applying-headers.md) the fresh headers using your target client, preserving session state when required.

Header mode requires six suffixes: `a`, `b`, `c`, `d`, `f`, `z`; the `d` value may be empty. A same-family `a0` is optional and appears only when the uploaded scripts freshly emit it. Forward the complete returned map with its original names, case and values. Never append a captured `a0` or split `a` yourself. Form mode remains exactly six unsplit fields, even when `a` exceeds 7,900 characters.

Loader-dependent payloads need both scripts and their exact URLs. Unsupported network dependencies are not downloaded by the API. Material references reuse source only; generate fresh headers for each request.

A successful generation does not guarantee target acceptance. Check the target's content and distinguish challenges from application errors using [troubleshooting](./troubleshooting.md).
