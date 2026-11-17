# Android app (Trusted Web Activity)

The Android app is the website wrapped in a Trusted Web Activity. Android opens it full-screen
**only** if `https://muhasabah-pro.netlify.app/.well-known/assetlinks.json` lists the SHA-256
fingerprint of the key the *installed* app was signed with. If any key is missing, the app
shows Chrome's address bar at the top.

## Fixing the address bar

1. **Google Play installs:** Play re-signs the app with its own key. Copy the SHA-256 of the
   *App signing key certificate* from Play Console → your app → Test and release → App integrity
   → App signing.
2. **Sideloaded / PWABuilder test builds:** use the SHA-256 printed by `bubblewrap fingerprint`
   or the `assetlinks.json` file in the PWABuilder download.
3. In Netlify → Project configuration → Environment variables, set one of:
   - `TWA_SHA256_FINGERPRINTS` — one or more fingerprints, separated by commas.
   - `TWA_ASSETLINKS_JSON` — paste the whole `assetlinks.json` PWABuilder generated
     (use this if PWABuilder gave the app a different package id).
   - `TWA_PACKAGE_NAME` — only if the package id is not `com.shamimnoor.muhasabahpro`.
4. Redeploy, open the assetlinks URL above to confirm, then clear the app's storage (or reinstall) on the phone.

The upload key fingerprint is always included, so you don't need to add it.

## Building an update

- Keep the same package id and the same upload keystore as the first upload. Play rejects a
  bundle signed with a different key.
- Increase `appVersionCode` in `twa-manifest.json` every time. Play rejects a version code it
  has already received.
- Build with `bubblewrap update && bubblewrap build`, or in PWABuilder choose
  "Use mine" for the signing key and enter the same package id and keystore.
