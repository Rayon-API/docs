# Upgrade to preparation-required serving

Use Python, JavaScript or Go SDK 3, or Playwright SDK 2. Custom material must
be prepared before generation. Managed header requests omit both material fields.

1. Submit complete custom material to `/v1/materials/prepare`.
2. Wait for `state: ready`, using the returned preparation ID.
3. Generate with the returned material reference.

Raw-script generation returns `material_preparation_required` before cache
insertion or billing. References outside current readiness return
`material_not_prepared`; expired references return `material_expired`. Managed
material that is unavailable returns an explicit availability error.

Generation does not upload material, start preparation or replace expired
references automatically. After a wait timeout or cancellation, retain the
preparation ID to resume polling. Prepare replacement material before expiry
and switch references when the replacement is ready. Readiness does not
guarantee downstream acceptance.

In Playwright, collection returns `CollectedMaterial`. Use `ReadyMaterial` for
confirmed preparation readiness; the former `PreparedMaterial` collection alias
has been removed.
