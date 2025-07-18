# Contributing to YouTube Clip Downloader

Thank you for your interest in contributing to YouTube Clip Downloader! This document provides guidelines and information for contributors.

## Development Setup

### Prerequisites

- Node.js 18 or higher
- npm or yarn package manager
- Git
- YouTube Data API v3 key (for testing)

### Getting Started

1. **Fork the repository**
   ```bash
   git clone https://github.com/sw3do/youtube-clip-downloader.git
   cd youtube-clip-downloader
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

## Development Workflow

### Branch Strategy

- **main**: Production-ready code
- **develop**: Integration branch for features
- **feature/***: New features
- **bugfix/***: Bug fixes
- **hotfix/***: Critical fixes for production

### Making Changes

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow the existing code style
   - Add tests if applicable
   - Update documentation as needed

3. **Test your changes**
   ```bash
   npm run lint
   npm run build
   npm run dist
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

5. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

## Code Style Guidelines

### TypeScript/JavaScript

- Use TypeScript for all new code
- Follow ESLint configuration
- Use meaningful variable and function names
- Add JSDoc comments for public APIs

### React Components

- Use functional components with hooks
- Follow Material-UI design patterns
- Keep components small and focused
- Use proper prop types

### Electron

- Follow security best practices
- Use context isolation
- Minimize main process code
- Handle errors gracefully

## Testing

### Manual Testing

- Test on multiple platforms (Windows, macOS, Linux)
- Verify download functionality
- Test API integration
- Check UI responsiveness

### Automated Testing

- Run linting: `npm run lint`
- Build verification: `npm run build`
- Package testing: `npm run dist`

## Commit Message Format

Use conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes
- **refactor**: Code refactoring
- **test**: Adding tests
- **chore**: Maintenance tasks

### Examples

```
feat(download): add progress tracking for downloads
fix(ui): resolve layout issue on mobile devices
docs(readme): update installation instructions
```

## Pull Request Guidelines

### Before Submitting

- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Tests pass locally
- [ ] Documentation updated if needed
- [ ] No merge conflicts

### PR Description

Include:

- **What**: Brief description of changes
- **Why**: Reason for the changes
- **How**: Implementation approach
- **Testing**: How you tested the changes
- **Screenshots**: For UI changes

### Review Process

1. Automated checks must pass
2. Code review by maintainers
3. Testing on multiple platforms
4. Approval and merge

## Release Process

### Versioning

We use [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Creating Releases

1. Update version in `package.json`
2. Update CHANGELOG.md
3. Create and push tag:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
4. GitHub Actions will automatically build and publish

## Issue Guidelines

### Bug Reports

Include:

- **Environment**: OS, Node.js version, app version
- **Steps to reproduce**: Clear, numbered steps
- **Expected behavior**: What should happen
- **Actual behavior**: What actually happens
- **Screenshots/logs**: If applicable

### Feature Requests

Include:

- **Problem**: What problem does this solve?
- **Solution**: Proposed solution
- **Alternatives**: Other solutions considered
- **Use cases**: How would this be used?

## Security

### Reporting Security Issues

Do not create public issues for security vulnerabilities. Instead:

1. Email the maintainer directly
2. Include detailed description
3. Provide steps to reproduce
4. Allow time for fix before disclosure

### Security Best Practices

- Never commit API keys or secrets
- Use secure storage for sensitive data
- Follow Electron security guidelines
- Validate all user inputs

## Getting Help

- **Documentation**: Check README.md first
- **Issues**: Search existing issues
- **Discussions**: Use GitHub Discussions for questions
- **Community**: Join project discussions

## Recognition

Contributors will be:

- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Credited in documentation

Thank you for contributing to YouTube Clip Downloader!