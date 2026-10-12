---
title: RayonAPI documentation
description: Capture telemetry headers, understand the public contract, and integrate safely.
---

# RayonAPI documentation

RayonAPI captures telemetry headers and session cookies from a target-page visit. Use the returned data in an authorized client workflow, with the client profile and session requirements described here.

Start with the [quickstart](./guide/quickstart.md), then read the [core requirements](./guide/requirements.md) before sending traffic to your target.

## What a solve returns

`POST /solve` accepts a `target_url` and an optional `profile`. Its result includes the capture status, headers, scoped cookies, profile used, and server execution time.

An `accepted` result means the six telemetry headers were captured. It does not prove that a protected endpoint accepted a later request or establish a success rate.

## Choose your integration

| Integration | Start here |
| --- | --- |
| Python | [Python SDK](./guide/python.md) |
| JavaScript / TypeScript | [JavaScript SDK](./guide/javascript.md) |
| Direct HTTP, including Go | [REST examples](./guide/rest.md) |
| Shape / F5 protected workflows | [Shape / F5 guide](./guide/shape-f5.md) |

The SDKs are prepared for version `0.1.0`; registry releases are not available yet. The SDK guides include source installation instructions.

## Access and source

Request access, domain approval, and an API key in the [dashboard](https://dashboard.rayonapi.com). Source repositories are available under [Rayon-API on GitHub](https://github.com/Rayon-API): [Python SDK](https://github.com/Rayon-API/rayon-sdk-py), [JavaScript SDK](https://github.com/Rayon-API/rayon-sdk-js), and [examples](https://github.com/Rayon-API/rayon-examples).
