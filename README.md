# Ziptrrip Todo App

A todo application built for the Ziptrrip Backend Engineer take-home assignment.

**Stack:** Next.js (Pages Router) + TypeScript + SQLite (`better-sqlite3`) + Jest.

Next.js was chosen so that a single codebase and a single `npm run dev` covers both
the "server" and the "React application" requirements: the pages under `/pages/todos`
are the frontend, and the routes under `/pages/api/todos` are the backend CRUD API,
sharing the same TypeScript data layer (`lib/todos.ts`) that talks to SQLite.

## Why this is a multi-page app, not a SPA

- Every route (`/todos`, `/todos/view?id=..`) is rendered server-side per request via
  `getServerSideProps` — there is no client-side router driving page-to-page navigation.
- Navigation between pages uses plain `<a href>` tags (not `next/link`), so clicking
  between the list and detail pages triggers a full page load, exactly like a
  traditional multi-page site.
- Create/update/delete actions call the API with `fetch`, then force a full page
  reload (`window.location.reload()` / `window.location.href`) rather than patching
  state in memory — the browser always ends up with a freshly rendered document.

## Getting started

```bash
npm install
npm run dev
```

Then open http://localhost:3000 — it redirects to `/todos`.

The SQLite database file is created automatically on first run at `data/todos.db`
(the `data/` directory is git-ignored since it's runtime state, not source).

## Running tests

```bash
npm test
```

Unit tests in `__tests__/todos.test.ts` exercise the CRUD data-access layer
(`lib/todos.ts`) directly against a fresh **in-memory** SQLite database per test —
no dependency on the dev server or the on-disk database file.

## Exercising the API manually

`rest-client/todos.http` contains ready-to-run requests for every endpoint (list,
filter, create, read, update, delete, and two error cases) using the VS Code
[REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client)
extension. Start `npm run dev` first, then open the file and click "Send Request"
above any block.

## Project structure

```
lib/
  db.ts        SQLite connection + schema (also exports createDb for tests)
  todos.ts     CRUD functions: createTodo, getAllTodos, getTodoById, updateTodo, deleteTodo
  types.ts     Shared TypeScript types (Todo, CreateTodoInput, UpdateTodoInput, ...)
pages/
  index.tsx           redirects to /todos
  todos/index.tsx      Todo list page — add, search, filter, toggle, delete
  todos/view.tsx        Todo detail page — reads ?id=.. query param, view/edit/toggle/delete
  api/todos/index.ts    GET (list, optional ?filter=), POST (create)
  api/todos/[id].ts     GET (one), PUT (update), DELETE
__tests__/
  todos.test.ts   Unit tests for lib/todos.ts
rest-client/
  todos.http      Manual API requests for VS Code REST Client
```

See [`FEATURES.md`](./FEATURES.md) for the full feature list and API reference.
