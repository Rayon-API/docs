# Browser profiles

Supply the browser identity that your target session actually uses. The API emulates these inputs; it does not launch a browser or measure a physical GPU for you.

The following is a field-layout example, not a recommended fingerprint:

```json
{
  "user_agent": "Your target session's complete Chrome User-Agent",
  "platform": "MacIntel",
  "language": "en-US",
  "languages": ["en-US", "en"],
  "screen": {"width": 1920, "height": 1080, "availWidth": 1920, "availHeight": 1040, "colorDepth": 24, "pixelDepth": 24},
  "window": {"innerWidth": 1920, "innerHeight": 1040, "outerWidth": 1920, "outerHeight": 1080, "devicePixelRatio": 1},
  "webgl": {"vendor": "Your measured WebGL vendor", "renderer": "Your measured WebGL renderer"}
}
```

Supported groups:

| Group | Fields |
| --- | --- |
| Top-level identity | `user_agent`, `platform`, `language`, `languages` |
| `screen` | width, height, availWidth, availHeight, colorDepth, pixelDepth |
| `window` | innerWidth, innerHeight, outerWidth, outerHeight, devicePixelRatio, screenX, screenY, screenLeft, screenTop, pageXOffset, pageYOffset |
| `webgl` | renderer, vendor |
| `canvas` | `data_url`: a PNG data URL for actual captured pixels |
| `navigator` | userAgent, platform, vendor, appVersion, appCodeName, appName, product, language, languages, hardwareConcurrency, maxTouchPoints, webdriver, cookieEnabled, doNotTrack |

Unknown fields and conflicting top-level/navigator aliases are rejected. Most identity strings allow up to 8,192 Unicode characters; language lists contain 1–32 strings. Screen/window dimensions are 1–32,768; available screen dimensions may be zero. Coordinates are signed 32-bit integers, devicePixelRatio is 0.1–16, hardwareConcurrency is 1–1,024, maxTouchPoints is 0–100, and color/pixel depths are 1–64. The effective profile, including defaults and aliases, must fit 64 KiB. See the [product schema](https://docs.rayonapi.com/schema/shape-v1.openapi.json) for exact field types.

Both SDKs expose `validate_profile(profile)` for offline validation. It returns a deep copy of your supplied fields without measuring the browser or filling omitted values.

Omitted fields use emulation defaults. These defaults are not observations about your real client and may be unsuitable for a target workflow. Supply measured values when relevant; changing only the User-Agent does not create a matching complete browser profile.

A canvas hash cannot substitute for PNG pixels. The response's `profile_used` reports the sanitized effective identity and omits canvas pixel data and cookie values.

Native Android/iOS protection protocols are outside this web Shape contract. A mobile-looking User-Agent alone does not establish native-mobile support.
