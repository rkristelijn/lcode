# Contributing to lcode

Thank you for your interest in contributing to lcode! This document provides guidelines and information for contributors.

## Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/rkristelijn/lcode.git
   cd lcode
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run tests**
   ```bash
   npm test
   ```

4. **Run linter**
   ```bash
   npm run lint
   ```

## Project Structure

```
lcode/
├── index.mjs           # Main CLI entry point
├── src/
│   ├── utils.mjs       # Utility functions
│   └── cache.mjs       # Caching functionality
├── test/
│   ├── utils.test.mjs  # Unit tests
│   ├── cache.test.mjs  # Cache tests
│   └── integration.test.mjs # CLI integration tests
├── .github/workflows/  # CI/CD configuration
└── docs/              # Documentation
```

## Code Quality Standards

- **ES2022+ JavaScript** with ES modules
- **ESLint** for code linting
- **Node.js built-in test runner** for testing
- **100% test coverage** for new features
- **Semantic versioning** for releases

## Testing

We maintain comprehensive test coverage:

- **Unit tests**: Test individual functions in isolation
- **Integration tests**: Test CLI behavior end-to-end
- **Manual testing**: Verify real-world usage scenarios

Run tests with:
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode for development
```

## Submitting Changes

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Write tests for new functionality
   - Update documentation if needed
   - Follow existing code style

4. **Run quality checks**
   ```bash
   npm test
   npm run lint
   ```

5. **Commit your changes**
   ```bash
   git commit -m "feat: add your feature description"
   ```

6. **Push and create a Pull Request**

## Commit Message Format

We follow conventional commits:
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `test:` Test additions/changes
- `refactor:` Code refactoring
- `perf:` Performance improvements

## Feature Requests

Before implementing new features:
1. Check existing issues and discussions
2. Create an issue to discuss the feature
3. Wait for maintainer feedback
4. Implement with tests and documentation

## Bug Reports

When reporting bugs:
1. Use the issue template
2. Provide reproduction steps
3. Include system information
4. Add relevant error messages

## Code Style

- Use ESLint configuration provided
- Prefer `const` over `let`, avoid `var`
- Use descriptive variable names
- Add JSDoc comments for public functions
- Keep functions small and focused

## Performance Considerations

- Use async operations where possible
- Implement caching for expensive operations
- Avoid blocking the event loop
- Profile performance-critical code

## Documentation

- Update README.md for user-facing changes
- Add JSDoc comments for new functions
- Include examples in documentation
- Update help text for CLI changes

## Release Process

Releases are handled by maintainers:
1. Version bump following semver
2. Update CHANGELOG.md
3. Create GitHub release
4. Publish to npm

## Getting Help

- Check existing issues and discussions
- Ask questions in GitHub Discussions
- Join our community chat (if available)
- Contact maintainers directly for urgent issues

## License

By contributing, you agree that your contributions will be licensed under the same ISC license as the project.
