# Cline Project Guidelines

## Build & Test Commands
- Build: `npm run compile`
- Type check: `npm run check-types`
- Lint: `npm run lint`
- Format check: `npm run format`
- Format fix: `npm run format:fix`
- Test all: `npm test`
- Test single file: `jest path/to/file.test.ts`
- Watch mode: `npm run watch`

## Code Style Guidelines
- Tab width: 4 spaces with actual tabs (not spaces)
- No semicolons at end of statements
- Line width: 130 characters max
- Naming: camelCase for variables/functions, PascalCase for classes/types
- Imports: Use ES module syntax (import/export)
- Types: Always use TypeScript types, strict mode enabled
- Error handling: Use try/catch with typed errors (error: any)
- File organization: Domain-driven design with domain/service/infrastructure layers
- Tests: Use Jest with describe/it pattern and explicit expectations
- Comments: Use /* @script @tdd */ for TDD mode files