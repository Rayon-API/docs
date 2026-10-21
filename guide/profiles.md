# Browser profiles

Supply profile values that match the environment represented by your integration. Use existing values, or follow the optional [profile capture steps](./preparation-walkthrough.md#2-prepare-a-profile) when you need measurements from a browser. The API does not launch a browser or measure your GPU.

## Supported fields

| Group | Fields |
| --- | --- |
| Identity | `user_agent`, `platform`, `language`, `languages` |
| `screen` | `width`, `height`, `availWidth`, `availHeight`, `colorDepth`, `pixelDepth` |
| `window` | `innerWidth`, `innerHeight`, `outerWidth`, `outerHeight`, `devicePixelRatio`, `screenX`, `screenY`, `screenLeft`, `screenTop`, `pageXOffset`, `pageYOffset` |
| `webgl` | `renderer`, `vendor` |
| `canvas` | `data_url`: captured PNG pixels, not a hash |
| `navigator` | `userAgent`, `platform`, `vendor`, `appVersion`, `appCodeName`, `appName`, `product`, `language`, `languages`, `hardwareConcurrency`, `maxTouchPoints`, `webdriver`, `cookieEnabled`, `doNotTrack` |

Omitted fields use emulation defaults. They are not measurements of your client. Supply actual values when the protection needs them; changing User-Agent alone does not establish a matching profile.

Both SDKs expose `validate_profile(profile)` for offline validation. It returns a deep copy of supplied fields without measuring the browser or filling defaults. Unknown fields and conflicting top-level/navigator aliases are rejected.

## Limits

| Value | Range / maximum |
| --- | --- |
| Identity strings / language lists | 8,192 Unicode characters per string / 1–32 entries |
| Screen/window dimensions | 1–32,768; available screen dimensions may be zero |
| Coordinates | Signed 32-bit integers |
| Device pixel ratio | 0.1–16 |
| Hardware concurrency / touch points | 1–1,024 / 0–100 |
| Color/pixel depth | 1–64 |
| Effective profile, including defaults/aliases | 64 KiB |
| PNG canvas data URL | 64 KiB; valid complete PNG, dimensions 1–8,192 and at most 16,777,216 pixels |

The [OpenAPI schema](/schema/shape-v1.openapi.json) gives exact types. `profile_used` reports effective sanitized values and omits canvas pixels and cookies. Native Android/iOS protection protocols are outside this web interface.
