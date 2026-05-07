# Generate Android signing keystore (one-time, ~5 min)

Run this once on any computer. The resulting `pronote-release.jks` file is the
**only** thing that proves you own this app to Google Play. **Back it up
immediately.** If you lose it, you can never publish updates.

## Windows / macOS / Linux

You need the JDK installed. If `keytool` is not on your PATH:
- Windows: install from https://adoptium.net (Eclipse Temurin)
- macOS: `brew install temurin`
- Linux: `apt install default-jdk`

## Generate the keystore

```bash
keytool -genkeypair -v \
  -keystore pronote-release.jks \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -alias pronote-release \
  -storepass YOUR_KEYSTORE_PASSWORD \
  -keypass YOUR_KEY_PASSWORD \
  -dname "CN=Pronote AI Medical Scribe, OU=Mobile, O=Pronote, L=City, ST=State, C=US"
```

Replace:
- `YOUR_KEYSTORE_PASSWORD` — strong password (you'll need it again)
- `YOUR_KEY_PASSWORD` — can be the same as keystore password
- The `dname` fields with your real org info

## What you get

A file `pronote-release.jks` (~3 KB). This is the master key.

## Back it up RIGHT NOW

Save copies in **at least 3 places**:
1. A password manager (1Password, Bitwarden, iCloud Keychain) — preferred
2. Encrypted cloud backup (Dropbox/Google Drive in an encrypted ZIP)
3. Offline drive (USB stick in a drawer)

Also save the two passwords (`storepass` and `keypass`) in the same places.

## Convert to base64 for GitHub Actions

```bash
# Windows PowerShell:
[Convert]::ToBase64String([IO.File]::ReadAllBytes("pronote-release.jks")) | Set-Clipboard

# macOS/Linux:
base64 -i pronote-release.jks | pbcopy   # macOS
base64 pronote-release.jks               # Linux
```

The base64 string goes into a GitHub Actions secret (see the workflow setup).

## DO NOT commit the .jks file to git

It's already in `.gitignore`. Verify:
```
git check-ignore pronote-release.jks
# → should print: pronote-release.jks (means it's ignored, good)
```
