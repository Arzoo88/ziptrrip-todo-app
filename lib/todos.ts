import type Database from "better-sqlite3";
import { getDb } from "./db";
import type { CreateTodoInput, Todo, TodoFilter, UpdateTodoInput } from "./types";

interface TodoRow {
  id: number;
  title: string;
  description: string | null;
  completed: number;
  priority: string;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

function rowToTodo(row: TodoRow): Todo {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    completed: Boolean(row.completed),
    priority: row.priority as Todo["priority"],
    dueDate: row.dueDate,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class ValidationError extends Error {}
export class NotFoundError extends Error {}

function assertValidTitle(title: unknown): asserts title is string {
  if (typeof title !== "string" || title.trim().length === 0) {
    throw new ValidationError("Title is required and must be a non-empty string.");
  }
  if (title.length > 200) {
    throw new ValidationError("Title must be 200 characters or fewer.");
  }
}

const VALID_PRIORITIES = new Set(["low", "medium", "high"]);
function assertValidPriority(priority: unknown): asserts priority is Todo["priority"] {
  if (typeof priority !== "string" || !VALID_PRIORITIES.has(priority)) {
    throw new ValidationError("Priority must be one of: low, medium, high.");
  }
}

/**
 * Returns all todos, optionally filtered, most recently created first.
 * Accepts an injected db connection so it can be unit tested against an
 * in-memory database without touching the real file.
 */
export function getAllTodos(filter: TodoFilter = "all", db: Database.Database = getDb()): Todo[] {
  let query = "SELECT * FROM todos";
  if (filter === "active") query += " WHERE completed = 0";
  if (filter === "completed") query += " WHERE completed = 1";
  query += " ORDER BY createdAt DESC, id DESC";
  const rows = db.prepare(query).all() as TodoRow[];
  return rows.map(rowToTodo);
}

export function getTodoById(id: number, db: Database.Database = getDb()): Todo | null {
  const row = db.prepare("SELECT * FROM todos WHERE id = ?").get(id) as TodoRow | undefined;
  return row ? rowToTodo(row) : null;
}

export function createTodo(input: CreateTodoInput, db: Database.Database = getDb()): Todo {
  assertValidTitle(input.title);
  const priority = input.priority ?? "medium";
  assertValidPriority(priority);

  const now = new Date().toISOString();
  const result = db
    .prepare(
      `INSERT INTO todos (title, description, completed, priority, dueDate, createdAt, updatedAt)
       VALUES (?, ?, 0, ?, ?, ?, ?)`
    )
    .run(input.title.trim(), input.description ?? null, priority, input.dueDate ?? null, now, now);

  return getTodoById(Number(result.lastInsertRowid), db) as Todo;
}

export function updateTodo(id: number, input: UpdateTodoInput, db: Database.Database = getDb()): Todo {
  const existing = getTodoById(id, db);
  if (!existing) {
    throw new NotFoundError(`Todo with id ${id} was not found.`);
  }

  if (input.title !== undefined) assertValidTitle(input.title);
  if (input.priority !== undefined) assertValidPriority(input.priority);

  const next = {
    title: input.title !== undefined ? input.title.trim() : existing.title,
    description: input.description !== undefined ? input.description : existing.description,
    completed: input.completed !== undefined ? input.completed : existing.completed,
    priority: input.priority !== undefined ? input.priority : existing.priority,
    dueDate: input.dueDate !== undefined ? input.dueDate : existing.dueDate,
  };

  db.prepare(
    `UPDATE todos SET title = ?, description = ?, completed = ?, priority = ?, dueDate = ?, updatedAt = ?
     WHERE id = ?`
  ).run(next.title, next.description, next.completed ? 1 : 0, next.priority, next.dueDate, new Date().toISOString(), id);

  return getTodoById(id, db) as Todo;
}

export function deleteTodo(id: number, db: Database.Database = getDb()): void {
  const existing = getTodoById(id, db);
  if (!existing) {
    throw new NotFoundError(`Todo with id ${id} was not found.`);
  }
  db.prepare("DELETE FROM todos WHERE id = ?").run(id);
}
