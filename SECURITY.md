# Security Policy

## Supported Versions

We actively support the following versions with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security vulnerability, please follow these steps:

### 1. Do Not Create Public Issues

**Please do not report security vulnerabilities through public GitHub issues.**

### 2. Contact Information

Please report security vulnerabilities by:

- **Email**: Send details to the project maintainer
- **GitHub Security Advisories**: Use GitHub's private vulnerability reporting feature

### 3. Information to Include

When reporting a vulnerability, please include:

- **Description**: Clear description of the vulnerability
- **Impact**: Potential impact and severity
- **Steps to Reproduce**: Detailed steps to reproduce the issue
- **Proof of Concept**: If applicable, include a minimal proof of concept
- **Environment**: OS, app version, and other relevant details
- **Suggested Fix**: If you have ideas for fixing the issue

### 4. Response Timeline

We aim to respond to security reports within:

- **Initial Response**: 48 hours
- **Status Update**: 7 days
- **Fix Timeline**: 30 days (depending on complexity)

### 5. Disclosure Policy

We follow responsible disclosure:

1. **Investigation**: We investigate and confirm the vulnerability
2. **Fix Development**: We develop and test a fix
3. **Release**: We release the fix in a new version
4. **Public Disclosure**: We publicly disclose the vulnerability after the fix is available
5. **Credit**: We credit the reporter (if desired)

## Security Best Practices

### For Users

- **Download from Official Sources**: Only download releases from the official GitHub repository
- **Keep Updated**: Always use the latest version
- **API Key Security**: Keep your YouTube API key secure and don't share it
- **System Security**: Keep your operating system and dependencies updated

### For Developers

- **Secure Coding**: Follow secure coding practices
- **Dependencies**: Keep dependencies updated and audit for vulnerabilities
- **API Keys**: Never commit API keys or secrets to the repository
- **Input Validation**: Validate all user inputs
- **Electron Security**: Follow Electron security best practices

## Security Features

### Current Security Measures

- **Context Isolation**: Renderer processes are isolated from the main process
- **Sandboxing**: Renderer processes run in a sandboxed environment
- **Secure Storage**: API keys are stored securely using electron-store
- **No Remote Code**: No remote code execution capabilities
- **Input Validation**: User inputs are validated and sanitized
- **HTTPS Only**: All external communications use HTTPS

### Electron Security

We follow Electron security best practices:

- Context isolation enabled
- Node.js integration disabled in renderer
- Remote module disabled
- Secure defaults for webSecurity
- Content Security Policy implemented

## Known Security Considerations

### YouTube API Key

- Users must provide their own YouTube API key
- Keys are stored locally using electron-store encryption
- Keys are never transmitted to third parties
- Users should follow Google's API key security guidelines

### yt-dlp Binary

- Binaries are downloaded from official yt-dlp releases
- SHA checksums are verified when possible
- Binaries are stored in application data directory
- Users can specify custom binary paths

### Network Communications

- YouTube API calls use HTTPS
- yt-dlp binary downloads use HTTPS
- No telemetry or analytics data is collected
- No user data is transmitted to external services

## Vulnerability History

We will maintain a record of security vulnerabilities and fixes here:

- No vulnerabilities reported yet

## Security Updates

Security updates will be:

- Released as patch versions (e.g., 1.0.1)
- Documented in CHANGELOG.md
- Announced in release notes
- Tagged with security labels

## Contact

For security-related questions or concerns:

- **GitHub**: Use GitHub Security Advisories
- **Issues**: For general security questions (not vulnerabilities)

Thank you for helping keep YouTube Clip Downloader secure!