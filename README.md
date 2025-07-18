# YouTube Clip Downloader

[![Release](https://github.com/sw3do/youtube-clip-downloader/actions/workflows/release.yml/badge.svg)](https://github.com/sw3do/youtube-clip-downloader/actions/workflows/release.yml)
[![Build and Test](https://github.com/sw3do/youtube-clip-downloader/actions/workflows/build.yml/badge.svg)](https://github.com/sw3do/youtube-clip-downloader/actions/workflows/build.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A modern cross-platform YouTube clip downloader built with Electron, React, and TypeScript. Features automatic yt-dlp binary management with cross-platform support.

## Features

### 🎯 Core Functionality
- Download YouTube videos and clips
- Search YouTube videos using YouTube Data API v3
- Browse trending videos by region
- Custom clip timing for any video
- High-quality video downloads

### 🔧 Cross-Platform Support
- **Windows**: x64, ia32, ARM64 architectures
- **macOS**: Intel (x64) and Apple Silicon (ARM64)
- **Linux**: x64 and ARM64 architectures
- Automatic platform detection and binary management

### ⚙️ yt-dlp Integration
- **Automatic Binary Management**: Downloads and manages yt-dlp binaries automatically
- **Cross-Platform Binaries**: Supports Windows (.exe), macOS, and Linux binaries
- **Auto-Updates**: Weekly checks for yt-dlp updates
- **Version Management**: Tracks and manages yt-dlp versions
- **Custom Binary Path**: Option to use system-installed yt-dlp
- **Platform Detection**: Automatically detects OS and architecture

### 🎨 Modern UI
- Material-UI design system
- Dark theme with gradient accents
- Responsive layout
- Real-time download progress
- Tabbed interface for different features

## Installation

### Download Pre-built Binaries

Download the latest release for your platform from the [Releases page](https://github.com/sw3do/youtube-clip-downloader/releases):

- **Windows**: Download the `.exe` installer or portable version
- **macOS**: Download the `.dmg` file or `.zip` archive
- **Linux**: Download the `.AppImage`, `.deb`, or `.rpm` package

### Build from Source

#### Prerequisites
- Node.js 18+ 
- YouTube Data API v3 key from Google Cloud Console

#### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/sw3do/youtube-clip-downloader.git
   cd youtube-clip-downloader
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Get YouTube API Key**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable YouTube Data API v3
   - Create credentials (API Key)
   - Copy the API key for use in the application

## Development

### Run in Development Mode
```bash
npm run dev
```

This starts both the React development server and Electron in development mode.

### Build for Production
```bash
npm run build
```

### Create Distribution Packages
```bash
npm run dist
```

## Cross-Platform Build Targets

### macOS
- **DMG**: Disk image installer
- **ZIP**: Portable application archive
- **Architectures**: Intel x64, Apple Silicon ARM64
- **Features**: Hardened runtime, notarization ready

### Windows
- **NSIS**: Windows installer
- **Portable**: Standalone executable
- **Architectures**: x64, ia32, ARM64

### Linux
- **AppImage**: Universal Linux application
- **DEB**: Debian/Ubuntu package
- **RPM**: Red Hat/Fedora package
- **Architectures**: x64, ARM64

## yt-dlp Management

The application includes a comprehensive yt-dlp management system:

### Automatic Setup
- Downloads appropriate yt-dlp binary for your platform on first run
- Stores binaries in application data directory
- Sets correct permissions (executable on Unix systems)

### Version Management
- Checks for updates weekly
- Displays current version in Settings tab
- Manual update option available
- Fallback to system yt-dlp if needed

### Platform Support
- **Windows**: Downloads `yt-dlp.exe`
- **macOS**: Downloads universal `yt-dlp` binary
- **Linux**: Downloads `yt-dlp` binary with executable permissions

### Settings Interface
- View current yt-dlp version and binary path
- Platform and architecture information
- Manual update functionality
- Custom binary path configuration
- Real-time status monitoring

## Usage

1. **First Launch**
   - Enter your YouTube API key when prompted
   - The app will automatically download and configure yt-dlp

2. **Download Videos/Clips**
   - Paste any YouTube URL (video or clip)
   - Select download location
   - Enter filename
   - Click download

3. **Search & Browse**
   - Use the Search tab to find videos
   - Browse trending videos by region
   - Click on any video to view details

4. **Settings Management**
   - Access Settings tab for yt-dlp configuration
   - Update yt-dlp manually if needed
   - Set custom binary paths

## Technical Details

### Architecture
- **Frontend**: React 18 + TypeScript + Material-UI
- **Backend**: Electron with Node.js
- **Download Engine**: yt-dlp-wrap for cross-platform yt-dlp integration
- **API**: YouTube Data API v3 for video information

### Security
- API keys stored securely using electron-store
- No hardcoded credentials
- Sandboxed renderer process
- Context isolation enabled

### Performance
- Efficient binary management
- Minimal memory footprint
- Progress tracking for downloads
- Error handling and recovery

## Troubleshooting

### yt-dlp Issues
- Check Settings tab for yt-dlp status
- Try manual update if downloads fail
- Verify internet connection for binary downloads
- Check system permissions for binary execution

### API Issues
- Verify YouTube API key is valid
- Check API quotas in Google Cloud Console
- Ensure YouTube Data API v3 is enabled

### Platform-Specific
- **macOS**: May require allowing app in Security & Privacy settings
- **Windows**: Windows Defender might flag the app initially
- **Linux**: Ensure execute permissions on AppImage

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Workflow

- **Main branch**: Stable releases
- **Develop branch**: Development and testing
- **Feature branches**: New features and bug fixes

### Automated Releases

Releases are automatically created when a new tag is pushed:

```bash
git tag v1.0.0
git push origin v1.0.0
```

This will trigger the GitHub Actions workflow to build and publish releases for all platforms.

## License

MIT License - see LICENSE file for details

## Acknowledgments

- [yt-dlp](https://github.com/yt-dlp/yt-dlp) - The powerful video downloader
- [yt-dlp-wrap](https://github.com/foxesdocode/yt-dlp-wrap) - Node.js wrapper for yt-dlp
- [Electron](https://electronjs.org/) - Cross-platform desktop app framework
- [Material-UI](https://mui.com/) - React component library
- [YouTube Data API](https://developers.google.com/youtube/v3) - Video information and search