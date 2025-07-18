# GitHub Secrets Configuration

This document explains the GitHub secrets used in the automated release workflow and how to configure them.

## Required vs Optional Secrets

### ✅ Always Required
- `GITHUB_TOKEN` - Automatically provided by GitHub Actions (no setup needed)

### 🔒 Optional Code Signing Secrets

The following secrets are **optional** and only needed if you want to code sign your releases:

#### macOS Code Signing (Optional)
- `APPLE_ID` - Your Apple ID email for notarization
- `APPLE_ID_PASS` - App-specific password for your Apple ID
- `CSC_LINK` - Base64 encoded .p12 certificate file
- `CSC_KEY_PASSWORD` - Password for the .p12 certificate

#### Windows Code Signing (Optional)
- `WIN_CSC_LINK` - Base64 encoded .p12 certificate file for Windows
- `WIN_CSC_KEY_PASSWORD` - Password for the Windows certificate

## What Happens Without Code Signing?

**The app will still build and work perfectly!** Without code signing:

- ✅ All platforms (Windows, macOS, Linux) will build successfully
- ✅ Users can download and install the app
- ⚠️ Users may see security warnings when first running the app
- ⚠️ On macOS: "App is from an unidentified developer"
- ⚠️ On Windows: "Windows protected your PC" warning

## Setting Up Code Signing (Optional)

If you want to eliminate security warnings, you can set up code signing:

### For macOS

1. **Get an Apple Developer Account** ($99/year)
2. **Create a Developer ID Application certificate**
3. **Export the certificate** as a .p12 file
4. **Create an app-specific password** for your Apple ID
5. **Add secrets to GitHub**:
   ```
   APPLE_ID: your-apple-id@example.com
   APPLE_ID_PASS: your-app-specific-password
   CSC_LINK: base64-encoded-p12-file
   CSC_KEY_PASSWORD: your-certificate-password
   ```

### For Windows

1. **Get a code signing certificate** from a trusted CA
2. **Export as .p12 file**
3. **Add secrets to GitHub**:
   ```
   WIN_CSC_LINK: base64-encoded-p12-file
   WIN_CSC_KEY_PASSWORD: your-certificate-password
   ```

## How to Add Secrets to GitHub

1. Go to your repository on GitHub
2. Click **Settings** tab
3. Click **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Add the secret name and value
6. Click **Add secret**

## Converting Certificate to Base64

To convert your .p12 certificate file to base64:

### On macOS/Linux:
```bash
base64 -i your-certificate.p12 | pbcopy
```

### On Windows:
```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("your-certificate.p12")) | Set-Clipboard
```

## Testing Without Code Signing

To test the workflow without code signing:

1. **Don't add any of the optional secrets**
2. **Push a tag** to trigger the release:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
3. **Check the Actions tab** to see the build progress
4. **Download the unsigned binaries** from the Releases page

## Troubleshooting

### Build Fails with Code Signing Errors
- **Solution**: Remove the optional secrets to build unsigned binaries
- **Check**: Ensure certificate passwords are correct
- **Verify**: Certificate files are properly base64 encoded

### "Dependencies lock file not found" Error
- **Fixed**: The workflows now use `npm install` instead of `npm ci`
- **Reason**: No package-lock.json file is committed to the repository

### Secrets Not Working
- **Check**: Secret names match exactly (case-sensitive)
- **Verify**: No extra spaces in secret values
- **Test**: Try removing secrets to build unsigned first

## Recommendations

### For Personal Projects
- **Skip code signing initially** - focus on functionality
- **Add code signing later** when you have users concerned about security warnings

### For Commercial Projects
- **Invest in code signing** from the start
- **Users expect signed applications** for professional software
- **Improves trust and reduces support requests** about security warnings

## Summary

**You don't need to configure any secrets to get started!** The release workflow will:

1. ✅ Build your app for all platforms
2. ✅ Create GitHub releases automatically
3. ✅ Upload installable binaries
4. ⚠️ Binaries will be unsigned (but fully functional)

Add code signing secrets later when you're ready to eliminate security warnings for your users.