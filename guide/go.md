# Go SDK

Follow the [Quickstart](./quickstart.md) with your existing target HTTP client.
Requires Go 1.23+. The preparation API is available.
Install the v2.0.0 module:

```sh
go get github.com/Rayon-API/rayon-sdk-go/v2@v2.0.0
```

[Source and releases](https://github.com/Rayon-API/rayon-sdk-go).

## Check usage, prepare, wait, generate and apply

Prepare `shape.json` using the shared [input guide](./preparation-walkthrough.md).
Keep `RAYON_API_KEY` server-side.

```go
package main

import (
    "context"
    "encoding/json"
    "log"
    "os"

    rayon "github.com/Rayon-API/rayon-sdk-go/v2"
)

func main() {
    client, err := rayon.NewClient(os.Getenv("RAYON_API_KEY"))
    if err != nil { log.Fatal(err) }
    defer client.Close()
    ctx := context.Background()
    usage, err := client.Usage(ctx) // Free; no generation quota used.
    if err != nil { log.Fatal(err) }
    _ = usage
    data, err := os.ReadFile("shape.json")
    if err != nil { log.Fatal(err) }
    var shape rayon.ShapeRequest
    if err := json.Unmarshal(data, &shape); err != nil { log.Fatal(err) }
    ready, err := client.PrepareAndWait(ctx, shape)
    if err != nil { log.Fatal(err) }
    shape.Scripts = nil
    shape.MaterialRef = ready.MaterialRef
    result, err := client.Generate(ctx, shape)
    if err != nil { log.Fatal(err) }
    log.Print(result.RequestID)
    // Apply result.Headers using your existing target client/session.
    // Reuse client here for further requests with their current inputs.
}
```

`rayon.TargetRequest` uses `*string` for `Body` and `ContentType`: `nil` encodes
JSON null; `rayon.String("")` preserves an explicitly empty value. GET/HEAD use
null body/content type. `WithBaseURL` and `WithTimeout` configure API calls;
context cancellation applies to SDK calls, independently of your target client.

Apply the complete returned header map unchanged, including optional `a0`. For
[form telemetry](../form-payload-integration.md), set `Mode: "form"`, supply the
original encoded application body and compose `result.FormBody` once with that body.
The SDK does not collect scripts or send target requests. See the
[SDK README](https://github.com/Rayon-API/rayon-sdk-go) for client behavior and
[errors](../reference/errors.md) before resubmitting an uncertain generation.

[Python](./python.md) · [JavaScript / TypeScript](./javascript.md) · [Go](./go.md) · [Playwright](./playwright.md)

## Explicit preparation and resumption

`Prepare(ctx, shape)` starts one job. `GetPreparation(ctx, id)` reads status.
`WaitUntilReady(ctx, id)` waits for at most 60 seconds or the context's earlier
deadline. `PrepareAndWait` combines the explicit steps. A successful wait returns
`ReadyMaterial` safe metadata with complete readiness and the `rust` backend.
`*rayon.Error.PreparationID` preserves the safe ID after polling failure, timeout
or cancellation. Terminal kinds are `preparation_failed` and
`preparation_expired`. Cancelling the context stops the wait while the server job
continues. `Generate` never prepares or waits implicitly.

Reprepare when readiness expires or the full source/profile/request/cookie/mode/
form context changes. See [states, lifetimes and planned migration](../reference/preparation.md).
