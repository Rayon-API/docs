// Paste into DevTools on your authorized source page. Keep the copied profile private.
function captureProfile() {
  const profile = {
    user_agent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    languages: Array.from(navigator.languages),
    screen: {},
    window: {},
    navigator: {},
  };
  for (const name of ["width", "height", "availWidth", "availHeight", "colorDepth", "pixelDepth"])
    profile.screen[name] = screen[name];
  for (const name of ["innerWidth", "innerHeight", "outerWidth", "outerHeight", "devicePixelRatio", "screenX", "screenY", "screenLeft", "screenTop", "pageXOffset", "pageYOffset"])
    profile.window[name] = window[name];
  for (const name of ["vendor", "appVersion", "appCodeName", "appName", "product", "hardwareConcurrency", "maxTouchPoints", "cookieEnabled", "webdriver", "doNotTrack"])
    if (navigator[name] !== undefined) profile.navigator[name] = navigator[name];
  const gl = document.createElement("canvas").getContext("webgl");
  if (gl) {
    const extension = gl.getExtension("WEBGL_debug_renderer_info");
    if (extension) {
      profile.webgl = {
        vendor: gl.getParameter(extension.UNMASKED_VENDOR_WEBGL),
        renderer: gl.getParameter(extension.UNMASKED_RENDERER_WEBGL),
      };
    }
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  }
  return profile;
}
copy(JSON.stringify(captureProfile(), null, 2));
