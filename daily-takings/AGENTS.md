# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

Notable in this project:

- **Middleware is now "Proxy".** The request interceptor lives in `src/proxy.ts` and
  exports a `proxy(request)` function (not `middleware`).
- **Route `params` are async.** In dynamic routes, `params` is a `Promise` — `await` it.
- **`cookies()` is async** — `await cookies()` in Server Components / Actions / Route Handlers.
