# Migration to preparation-required serving

This is an unpublished release-candidate contract. Roll out the verified server
and migrate clients before publishing SDKs and these docs as the production contract.

Managed header requests omit both material fields. Cold or unavailable managed
sources return an explicit availability error.

Custom integrations submit complete scripts to preparation, wait for `state:
ready`, then generate with the returned reference. Raw-script solves return
`material_preparation_required` before cache insertion or billing. References
outside current readiness return `material_not_prepared`; expired references
return `material_expired`.

Generation never uploads sources, starts preparation or retries automatically.
Retain the preparation ID after a wait timeout or cancellation so you can resume
polling. Refresh custom material before its readiness or source expiry, and switch
references only when the replacement is ready. Supported input bounds remain in
force; readiness does not guarantee downstream acceptance.

SDK candidates are Python/JS/Go major 3 and Playwright major 2. Make compatible
preparation available first, distribute the reviewed SDKs, migrate direct-upload
clients, then enforce the new solve contract in the coordinated cutover. Publish
core JS before Playwright. Keep existing clients working during the announced
migration window; do not silently switch their serving contract.

The candidate package versions are not yet on public registries. The adapter lock
will reference the exact core SDK candidate artifact; publish that artifact first.

The Playwright `PreparedMaterial` collection alias is removed. Collection returns
`CollectedMaterial`; `ReadyMaterial` describes confirmed server readiness.
