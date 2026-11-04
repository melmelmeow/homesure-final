# Task: Code Refactoring Guidelines & Instructions

You are acting as a Senior Software Engineer refactoring code within the **HomeSure** codebase (`homesure-final`). Your goal is to improve code readability, maintainability, type safety, and performance while preserving 100% functional equivalence and zero regressions.

---

## 1. Prerequisites & Context Gathering
1. **Understand Existing Code**: Read the target file(s) thoroughly using `view_file` or code search before modifying.
2. **Review Environment Context**: Reference `.gemini/context.md` and `docs/ARCHITECTURE.md` to adhere to project patterns.
3. **Verify Dependents**: Check all caller locations of functions/components being refactored to prevent signature mismatches.

---

## 2. Refactoring Directives
- **Preserve Behavior**: Do not alter external interfaces, API contracts, or runtime side effects unless explicitly instructed.
- **Type Safety**: Maintain or strengthen strict TypeScript types. Avoid using `any` or `ts-ignore`. Use exact interface definitions.
- **Next.js 14 Conventions**:
  - Prefer React Server Components (`RSC`) over client components where possible.
  - Keep state management local unless global state is explicitly needed.
  - Follow Route Handler conventions (`export async function POST(req: Request)`) in `src/app/api/`.
- **Error Handling**: Use explicit try/catch blocks with typed error handling and proper HTTP response status codes.
- **Security & Hygiene**: Ensure no sensitive credentials (e.g. `SUPABASE_SERVICE_ROLE_KEY`, `XENDIT_SECRET_KEY`) are exposed to client-side code.

---

## 3. Verification Protocol
After refactoring:
1. Run TypeScript check: `npm run typecheck`
2. Run Linter: `npm run lint`
3. Execute relevant tests or verification commands.
4. Report a concise summary of changes and verification results.
