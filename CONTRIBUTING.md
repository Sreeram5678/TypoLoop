# Contributing to TypoLoop

Thank you for your interest in contributing to TypoLoop.

## Development Workflow

1. Fork the repository and create a feature branch from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. Install dependencies and verify your local environment:
   ```bash
   npm install
   npm test
   ```
3. Follow Conventional Commits for commit messages (`feat:`, `fix:`, `docs:`, `test:`, `chore:`).
4. Ensure all checks pass before opening a Pull Request:
   ```bash
   npm run lint
   npm test
   npm run build
   ```

## Areas Looking for Contributions

- Alternative physical keyboard layout matrices (Colemak, Dvorak, Workman)
- Additional curated passage packs
- Web Audio switch acoustic profiles
- Accessibility improvements for screen-reader feedback on results
