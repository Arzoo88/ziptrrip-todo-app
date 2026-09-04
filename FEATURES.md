# Features & Functionality

## Pages (frontend)

### `/todos` — Todo list page

- **Add a todo**: form with title (required), description, priority (low/medium/high),
  and an optional due date.
- **Filter**: All / Active / Completed, via `?filter=` query param (server-rendered,
  so the filter survives a page refresh and is bookmarkable/shareable).
- **Search**: client-side text search across title and description.
- **Toggle complete**: checkbox next to each todo.
- **Delete**: with a confirmation prompt.
- **Priority badge** and **due date badge** shown per todo.
- Each todo's title links to its detail page.

### `/todos/view?id=<id>` — Todo detail page

- Receives the todo id as a **query parameter** (`?id=..`), per the assignment spec.
- Displays title, description, priority, completion status, due date, id,
  created-at and last-updated-at timestamps.
- **Edit** — inline form to change title, description, priority, due date.
- **Toggle complete/active**.
- **Delete** — with confirmation, then redirects back to the list.
- Shows a friendly "not found" message if the id doesn't match any todo.

## Backend — REST API

Base path: `/api/todos`

| Method | Path              | Description                                   | Success | Errors |
|--------|-------------------|------------------------------------------------|---------|--------|
| GET    | `/api/todos`      | List all todos. Optional `?filter=active\|completed` | 200 | — |
| POST   | `/api/todos`      | Create a todo (`title` required)               | 201     | 400 invalid input |
| GET    | `/api/todos/:id`  | Get one todo                                    | 200     | 404 not found |
| PUT    | `/api/todos/:id`  | Partially update a todo (any subset of fields)  | 200     | 400 invalid input, 404 not found |
| DELETE | `/api/todos/:id`  | Delete a todo                                   | 204     | 404 not found |

### Todo shape

```ts
{
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  priority: "low" | "medium" | "high";
  dueDate: string | null;   // "YYYY-MM-DD"
  createdAt: string;        // ISO datetime
  updatedAt: string;        // ISO datetime
}
```

### Validation rules

- `title` is required, must be non-empty after trimming, max 200 characters.
- `priority`, when provided, must be `low`, `medium`, or `high`.
- All other fields are optional; `PUT` only updates the fields you send (partial update).

## Data layer

- SQLite via `better-sqlite3`, file stored at `data/todos.db`, created automatically
  on first run.
- `lib/todos.ts` contains all CRUD logic and accepts an injectable database
  connection, which is what makes it unit-testable in isolation (see below)
  without needing the Next.js server or the real database file.

## Testing

- `__tests__/todos.test.ts`: unit tests for every CRUD function
  (`createTodo`, `getAllTodos`, `getTodoById`, `updateTodo`, `deleteTodo`),
  including validation errors and not-found errors, run against a fresh
  in-memory SQLite database per test.
- Run with `npm test`.

## Manual API testing

- `rest-client/todos.http` — a REST Client file (VS Code extension) with requests
  covering every endpoint plus two error cases (empty title, missing id).

## Notable design decisions

- **Multi-page, not single-page**: no client-side router; every navigation is a
  real page load (`<a href>`, not `next/link`), and every mutation reloads the
  page afterward instead of patching state client-side.
- **Query-param todo id**: the detail page is `/todos/view?id=..` rather than a
  dynamic route segment like `/todos/[id]`, to match the assignment's explicit
  wording ("receive a query parameter of todo id").
- **TypeScript throughout**, including the API routes and the data layer, for the
  "usage of TypeScript" extra-credit item.
