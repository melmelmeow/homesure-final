# Task: Test Generation Guidelines & Prompt Template

You are acting as a Lead Quality Engineer writing automated tests for the **HomeSure** codebase. Your objective is to create thorough, maintainable test suites covering happy paths, edge cases, error boundaries, and integration flows.

---

## 1. Scope & Strategy
When writing tests for a specific module or component:
- **Unit Tests**: Focus on pure utility functions, helper libraries in `src/lib/`, data transformers, and custom hooks.
- **Integration Tests**: Focus on API route handlers (`src/app/api/...`), Supabase query wrappers, Xendit payment webhooks, and Google API handlers.
- **Component Tests**: Test React UI components for proper rendering, state changes, and accessibility.

---

## 2. Mocking Guidelines
- **Supabase**: Mock `@supabase/ssr` or `@supabase/supabase-js` client responses using factory patterns. Do not make live database network calls in unit/integration tests.
- **Xendit SDK**: Mock `xendit-node` client responses (`createInvoice`, `createPayout`, `refund`).
- **Google Cloud APIs**: Mock `googleapis` calls (e.g. Search Console responses, Vision/OCR output).
- **Next.js Web APIs**: Mock Next.js `Request` and `Response` objects, headers, and cookies.

---

## 3. Test Structure & Best Practices
- Structure tests using the **Arrange-Act-Assert (AAA)** pattern.
- Give test cases descriptive names describing the expected behavior (e.g., `it('should return 400 when xendit signature verification fails')`).
- Test edge cases: `null`/`undefined` inputs, invalid JSON, network timeouts, unauthorized sessions.
- Maintain isolated test state: reset mocks between tests (`beforeEach(() => jest.clearAllMocks())`).

---

## 4. Execution & Verification
- Save tests in co-located `__tests__/` directories or alongside source files with `.test.ts` / `.test.tsx` extensions.
- Run typecheck (`npm run typecheck`) and the test runner command to confirm all generated tests pass cleanly.
