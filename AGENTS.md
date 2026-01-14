# AGENTS.md - AI Coding Agent Guidelines

This document provides guidelines for AI coding agents working in this repository.

## Project Overview

- **Stack**: Next.js 15 + Payload CMS 3.65 + TypeScript
- **Runtime**: Bun (v1.3.3+)
- **Database**: Vercel Postgres
- **Storage**: Vercel Blob Storage
- **Hosting**: Vercel with preview environments
- **Database Branching**: Neon preview branches (auto-created per Vercel preview deployment)
- **Node Version**: ^18.20.2 or >=20.9.0

## Build, Lint, and Test Commands

### Development

```bash
bun run dev          # Start development server with hot reload
bun run build        # Build for production
bun run start        # Start production server
```

### Linting

```bash
bun run lint         # Run ESLint via Next.js
```

### Testing

```bash
# Run all tests (integration + e2e)
bun run test

# Run integration tests only (Vitest)
bun run test:int

# Run a single integration test file
bunx vitest run tests/int/api.int.spec.ts --config ./vitest.config.mts

# Run a single integration test by name
bunx vitest run -t "fetches users" --config ./vitest.config.mts

# Run e2e tests only (Playwright)
bun run test:e2e

# Run a single e2e test file
bunx playwright test tests/e2e/frontend.e2e.spec.ts --config=playwright.config.ts

# Run a single e2e test by name
bunx playwright test -g "can go on homepage" --config=playwright.config.ts
```

### Code Generation

```bash
bun run generate:types      # Generate Payload TypeScript types
bun run generate:importmap  # Generate Payload import map
bun run payload             # Run Payload CLI commands
```

### Database

```bash
bun run payload migrate:create   # Create a new migration (run before pushing DB changes to main)
```

### CI/Deployment

```bash
bun run ci:build    # Run migrations and build (for CI)
```

## Directory Structure

```
src/
├── app/
│   ├── (frontend)/          # Public-facing Next.js pages
│   └── (payload)/           # Payload CMS admin routes
├── blocks/                  # Payload block definitions
│   └── answerMechanisms/    # Answer mechanism blocks
├── collections/             # Payload collection schemas
├── migrations/              # Database migrations
├── payload.config.ts        # Main Payload configuration
└── payload-types.ts         # Auto-generated types (do not edit)

tests/
├── e2e/                     # Playwright end-to-end tests (*.e2e.spec.ts)
└── int/                     # Vitest integration tests (*.int.spec.ts)
```

## Code Style Guidelines

### Formatting (Prettier)

This project uses Prettier for code formatting. Refer to `.prettierrc.json` for the current configuration rules.

### TypeScript

- **Strict mode** is enabled
- Use path aliases: `@/*` maps to `src/*`
- Use `@payload-config` for Payload config imports
- Prefix unused variables with `_` (e.g., `_unused`)
- Avoid `any` types when possible (warning, not error)

### Imports

```typescript
// Use path aliases, not relative paths for src/
import { Question } from '@/collections/Question'
import config from '@/payload.config'

// Group imports: external packages first, then internal
import { CollectionConfig } from 'payload'
import { getPayload, Payload } from 'payload'

import { myBlock } from '@/blocks/myBlock'
```

### Naming Conventions

- **Files**: camelCase for most files, PascalCase for collections (e.g., `Question.ts`)
- **Collections**: PascalCase export, lowercase slug
- **Blocks**: camelCase export and slug
- **Components**: PascalCase
- **Functions/Variables**: camelCase

### Payload Collections

```typescript
import { CollectionConfig } from 'payload'

export const MyCollection: CollectionConfig = {
  slug: 'my-collection',
  admin: {
    useAsTitle: 'fieldName',
    description: 'Description for admin UI',
  },
  fields: [
    {
      name: 'fieldName',
      type: 'text',
      required: true,
      admin: {
        description: 'Help text for editors',
      },
    },
  ],
}
```

### Payload Blocks

```typescript
import { Block } from 'payload'

export const myBlock: Block = {
  slug: 'my-block',
  labels: { singular: 'My Block', plural: 'My Blocks' },
  fields: [
    // field definitions
  ],
}
```

## Testing Patterns

### Integration Tests (Vitest)

Location: `tests/int/*.int.spec.ts`

```typescript
import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import { describe, it, beforeAll, expect } from 'vitest'

let payload: Payload

describe('MyFeature', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
  })

  it('does something', async () => {
    const result = await payload.find({ collection: 'my-collection' })
    expect(result).toBeDefined()
  })
})
```

### E2E Tests (Playwright)

Location: `tests/e2e/*.e2e.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('MyFeature', () => {
  test('does something', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await expect(page).toHaveTitle(/Expected Title/)
  })
})
```

## Error Handling

- Use try/catch for async operations that may fail
- Log errors appropriately before re-throwing if needed
- Caught error variables can use `_error` or `ignore` prefix to suppress unused warnings

## ESLint Rules (Warnings)

These are warnings, not errors:

- `@typescript-eslint/ban-ts-comment`
- `@typescript-eslint/no-empty-object-type`
- `@typescript-eslint/no-explicit-any`
- `@typescript-eslint/no-unused-vars`

## Environment Variables

Required for development:

- `PAYLOAD_SECRET` - Payload authentication secret
- `DATABASE_URL` - Vercel Postgres connection string
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob storage token

## Important Notes

1. **Do not edit** `src/payload-types.ts` - it's auto-generated
2. Run `bun run generate:types` after modifying collections/blocks
3. Run `bun run payload migrate:create` before pushing to main if you've made any database schema changes
4. The dev server runs on port 3000 by default
5. E2E tests require the dev server to be running
