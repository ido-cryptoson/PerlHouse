# Project: [YOUR PROJECT NAME]

> Edit this file to match your project. This is your single source of truth for how Claude should behave in your codebase.

## Architecture
- **Stack**: [e.g., Next.js 14, TypeScript, Prisma, PostgreSQL]
- **Monorepo**: [Yes/No — if yes, describe structure]
- **API Pattern**: [REST / GraphQL / tRPC]
- **Deployment**: [e.g., Vercel, AWS, Docker]

## Directory Structure
```
src/
  app/          — Pages and routes
  components/   — Reusable UI components
  lib/          — Shared utilities and helpers
  server/       — Server-side logic, API handlers
  types/        — TypeScript type definitions
tests/          — Test files (mirror src/ structure)
docs/
  prds/         — Product Requirements Documents
  reviews/      — PRD review reports
  status/       — Feature status reports
```

## Code Standards
- Use TypeScript strict mode — no `any` types
- Prefer named exports over default exports
- Use [Zod / Joi / etc.] for runtime validation
- Error handling: [Result pattern / try-catch / etc.]
- Max function length: 30 lines
- Max file length: 200 lines
- Use descriptive variable names — no abbreviations

## Naming Conventions
- Files: kebab-case (`user-service.ts`)
- Components: PascalCase (`UserProfile.tsx`)
- Functions: camelCase (`getUserById`)
- Constants: SCREAMING_SNAKE (`MAX_RETRY_COUNT`)
- Types/Interfaces: PascalCase (`UserProfile`)

## Testing
- **Framework**: [Vitest / Jest / Pytest / etc.]
- **Run tests**: `[npm run test / pytest / go test ./...]`
- **Run lint**: `[npm run lint / ruff check / etc.]`
- **Run type check**: `[npx tsc --noEmit / mypy / etc.]`
- **Run format**: `[npx prettier --write . / black . / etc.]`
- Every new function needs at least one test
- Minimum coverage target: 80%
- Test file location: alongside source files OR in tests/ (pick one)

## Git Conventions
- Branch naming: `feat/feature-name`, `fix/bug-name`, `chore/task-name`
- Commit format: `type(scope): description` (e.g., `feat(auth): add login endpoint`)
- Never commit directly to main
- Keep commits small and atomic

## Product OS Workflow
- Every feature starts with `/create` (PRD generation)
- No code without an approved PRD
- `/verify` must pass (verdict: APPROVED) before `/dev` begins
- `/dev` builds task-by-task with tests
- `/test` validates everything before shipping
- `/status` shows the dashboard at any time
- All PRDs live in `docs/prds/`
- All reviews live in `docs/reviews/`

## Common Patterns
[Add your project-specific patterns here, e.g.:]
- API routes follow: validate input → check auth → execute → return response
- Database queries use repository pattern
- All user-facing strings are in i18n files
- Environment variables are validated at startup

## What NOT to Do
- Don't use `console.log` for debugging — use the logger
- Don't add dependencies without discussing first
- Don't skip tests, ever
- Don't modify generated files (migrations, lock files) manually
