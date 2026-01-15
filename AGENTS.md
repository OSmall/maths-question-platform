# AGENTS.md - AI Coding Agent Guidelines

This document provides guidelines for AI coding agents working in this repository.

## Project Overview

- **Stack**: Next.js 15 + Payload CMS 3.65 + TypeScript
- **Runtime & Package Manager**: Bun (v1.3.3+) - **Bun is the exclusive runtime and package manager**
- **Database**: Vercel Postgres
- **Storage**: Vercel Blob Storage
- **Hosting**: Vercel with preview environments
- **Database Branching**: Neon preview branches (auto-created per Vercel preview deployment)

## Bun-First Policy

**IMPORTANT**: This project uses Bun exclusively as the JavaScript/TypeScript runtime, package manager, script runner, and (when applicable) bundler and test runner.

### Required

- **Always use `bun`** for all operations: installing packages, running scripts, executing files
- **Always use `bunx`** instead of `npx` for running package binaries
- **Always use `bun add`** instead of `npm install` or `yarn add`
- **Always use `bun remove`** instead of `npm uninstall` or `yarn remove`

### Prohibited

Do NOT use any of the following:

- `node` - Use `bun` to run JavaScript/TypeScript files directly
- `npm` - Use `bun` for all package management
- `npx` - Use `bunx` instead
- `yarn` - Use `bun` for all package management
- `pnpm` - Use `bun` for all package management
- `ts-node` - Bun runs TypeScript natively, no transpilation needed
- `tsx` - Bun runs TypeScript natively

### Bun Command Reference

| Instead of             | Use                                     |
| ---------------------- | --------------------------------------- |
| `npm install`          | `bun install`                           |
| `npm install <pkg>`    | `bun add <pkg>`                         |
| `npm install -D <pkg>` | `bun add -d <pkg>`                      |
| `npm uninstall <pkg>`  | `bun remove <pkg>`                      |
| `npm run <script>`     | `bun run <script>`                      |
| `npx <command>`        | `bunx <command>`                        |
| `node script.js`       | `bun script.js`                         |
| `node script.ts`       | `bun script.ts` (no compilation needed) |
| `ts-node script.ts`    | `bun script.ts`                         |

### Bun Integrated Features

Prefer Bun's built-in capabilities over external tools when possible:

- **TypeScript**: Bun runs `.ts` and `.tsx` files natively without configuration
- **JSX**: Bun supports JSX natively
- **Environment variables**: Use `bun --env-file=.env` or Bun automatically loads `.env` files
- **Watch mode**: Use `bun --watch` for development
- **Hot reloading**: Use `bun --hot` for hot module reloading
- **Bundling**: Prefer `bun build` when bundling is needed (unless Next.js handles it)
- **Testing**: Consider `bun test` for new test suites (currently using Vitest/Playwright for compatibility)

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
- Bun runs TypeScript natively - no separate compilation step needed

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

Note: Bun automatically loads `.env` files in the project root.

## Important Notes

1. **Do not edit** `src/payload-types.ts` - it's auto-generated
2. Run `bun run generate:types` after modifying collections/blocks
3. Run `bun run payload migrate:create` before pushing to main if you've made any database schema changes
4. The dev server runs on port 3000 by default
5. E2E tests require the dev server to be running
6. **Always use Bun** - never use node, npm, npx, yarn, pnpm, ts-node, or tsx

## UI Component Guidelines

### Base UI (shadcn)

This project uses shadcn/ui with **Base UI** as the underlying component library (not Radix).

#### Key Principles

1. **Follow Base UI patterns** - Use Base UI's native APIs and patterns:
   - Use `render` prop for polymorphic rendering (not `asChild`)
   - Refer to Base UI documentation: https://base-ui.com/

2. **Avoid modifying shadcn components** - The components in `src/components/ui/` are generated by shadcn:
   - Do NOT edit these files unless absolutely necessary
   - If you need custom behavior, create a new component in `src/components/` that wraps or extends the UI component
   - Example: Instead of modifying `button.tsx`, create `src/components/custom-button.tsx`

3. **When modification is unavoidable**:
   - Document the change with a comment explaining why
   - Keep changes minimal and focused
   - Consider if the change should be a separate component instead

### Next.js Best Practices

1. **Use `Link` for internal navigation** - Always use Next.js `Link` component instead of `<a>` tags for internal routes:

   ```tsx
   import Link from 'next/link';

   // Good - internal navigation
   <Link href="/about">About</Link>

   // Bad - internal navigation
   <a href="/about">About</a>
   ```

2. **External links** - Use `<a>` tags with proper attributes for external URLs:

   ```tsx
   <a href="https://example.com" rel="noopener noreferrer" target="_blank">
     External Site
   </a>
   ```

3. **Combining with Base UI Button**:

   ```tsx
   import Link from 'next/link';
   import { Button } from '@/components/ui/button';

   // Internal link with Button styling (JSX element pattern)
   <Button
     render={<Link href="/dashboard" target="_blank" />}
     nativeButton={false}
   >
     Dashboard
   </Button>

   // External link with Button styling (JSX element pattern)
   <Button
     render={<a href="https://docs.example.com" target="_blank" rel="noopener noreferrer" />}
     nativeButton={false}
   >
     Documentation
   </Button>
   ```

4. **Use `next/image`** for images instead of `<img>` tags
5. **Use server components by default** - Only add `"use client"` when client-side interactivity is needed
6. **Prefer JSX element over function for `render` prop** - Use `render={<Link />}` in Server Components, `render={(props) => <Link {...props} />}` only in Client Components

### Next.js Server/Client Component Serialization Rules

**Functions cannot be passed from Server to Client Components:**

- Functions are not serializable across the server/client boundary
- This includes arrow functions, regular functions, and methods
- Results in "Functions cannot be passed directly to Client Components" error

**Imports from 'use client' files are Client-only:**

- Any file with 'use client' directive becomes a Client Component
- Cannot import methods/functions from these files into Server Components
- Only UI components can be imported, but with serialization constraints

**Import Rules for Server Components:**

Server Components **CAN** import:

- Regular functions from non-client files
- UI components from client files (with serialization constraints)
- Types and constants from any files

Server Components **CANNOT** import:

- Functions/methods from files with 'use client' directive
- Anything that requires client-side runtime (browser APIs, hooks, etc.)

### Base UI render prop Patterns

For Base UI components like Button that use the `render` prop for polymorphic rendering, there are two valid patterns:

#### Pattern 1: JSX Element (Recommended - Works from Server Components)

```tsx
// ✅ Works in Server Components
<Button
  render={<Link href="/dashboard" target="_blank" />}
  nativeButton={false}
>
  Dashboard
</Button>

// ✅ Works in Server Components
<Button
  render={<a href="https://example.com" target="_blank" rel="noopener noreferrer" />}
  nativeButton={false}
>
  External
</Button>
```

#### Pattern 2: Function (Only works in Client Components)

```tsx
// ❌ Fails in Server Components (function cannot be serialized)
;<Button render={(props) => <Link {...props} href="/dashboard" />}>Dashboard</Button>

// ✅ Works in Client Components
;('use client')
function MyComponent() {
  return <Button render={(props) => <Link {...props} href="/dashboard" />}>Dashboard</Button>
}
```

**Why JSX Element Pattern Works:**

- JSX elements without functions are serializable
- Base UI clones the element and merges additional props
- Preserves all Button component behavior (focus management, keyboard navigation)
- Clean, minimal syntax
- `nativeButton={false}` suppresses Base UI semantic warnings

**Common Server Component Mistakes:**

❌ **DON'T** - Passing functions from Server to Client Component:

```tsx
// Server Component
<Button render={(props) => <a {...props} href="/foo" />}>Link</Button>
```

❌ **DON'T** - Importing functions from client files:

```tsx
// Server Component
import { clientFunction } from '@/components/some-client-file' // Error!
```

✅ **DO** - Use JSX elements with `nativeButton={false}`:

```tsx
// Server Component
<Button render={<a href="/foo" />} nativeButton={false}>
  Link
</Button>
```

### Choosing the Right Approach

**Use JSX Element Pattern when:**

- Working in Server Components (most common case)
- Need minimal code changes
- Want to preserve full Button functionality
- Acceptable to use `nativeButton={false}` for semantic warnings

**Use buttonVariants Pattern when:**

- Need zero Base UI warnings (strict semantic HTML)
- Building purely navigational links (no button-like behavior)
- Don't need Button's focus management or keyboard features
- Prefer standard HTML semantics over component features

### Key Takeaways for Server/Client Component Boundaries

1. **Functions = Not Serializable**: Cannot pass functions from Server to Client Components
2. **Client Files = Client Only**: Files with `'use client'` cannot have their functions imported into Server Components
3. **JSX Elements = Serializable**: JSX without functions works perfectly across boundaries
4. **Use JSX Element Pattern**: `render={<Link />}` in Server Components, `render={(props) => <Link {...props} />}` only in Client Components
5. **Suppress Warnings**: Add `nativeButton={false}` when rendering non-button elements
