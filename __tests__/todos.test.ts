import type Database from "better-sqlite3";
import { createDb } from "@/lib/db";
import {
  createTodo,
  deleteTodo,
  getAllTodos,
  getTodoById,
  NotFoundError,
  updateTodo,
  ValidationError,
} from "@/lib/todos";

describe("todos data access layer", () => {
  let db: Database.Database;

  beforeEach(() => {
    // Fresh in-memory database for every test — no shared state, no disk I/O.
    db = createDb(":memory:");
  });

  afterEach(() => {
    db.close();
  });

  describe("createTodo", () => {
    it("creates a todo with defaults applied", () => {
      const todo = createTodo({ title: "Buy milk" }, db);

      expect(todo.id).toBeGreaterThan(0);
      expect(todo.title).toBe("Buy milk");
      expect(todo.completed).toBe(false);
      expect(todo.priority).toBe("medium");
      expect(todo.description).toBeNull();
      expect(todo.dueDate).toBeNull();
      expect(todo.createdAt).toBeTruthy();
      expect(todo.updatedAt).toBe(todo.createdAt);
    });

    it("trims the title and stores optional fields", () => {
      const todo = createTodo(
        { title: "  Write report  ", description: "Q3 numbers", priority: "high", dueDate: "2026-09-10" },
        db
      );

      expect(todo.title).toBe("Write report");
      expect(todo.description).toBe("Q3 numbers");
      expect(todo.priority).toBe("high");
      expect(todo.dueDate).toBe("2026-09-10");
    });

    it("rejects an empty title", () => {
      expect(() => createTodo({ title: "" }, db)).toThrow(ValidationError);
      expect(() => createTodo({ title: "   " }, db)).toThrow(ValidationError);
    });

    it("rejects an invalid priority", () => {
      // @ts-expect-error intentionally invalid input for the test
      expect(() => createTodo({ title: "Test", priority: "urgent" }, db)).toThrow(ValidationError);
    });
  });

  describe("getAllTodos", () => {
    it("returns an empty list when there are no todos", () => {
      expect(getAllTodos("all", db)).toEqual([]);
    });

    it("filters by active/completed", () => {
      const a = createTodo({ title: "Active one" }, db);
      const b = createTodo({ title: "Completed one" }, db);
      updateTodo(b.id, { completed: true }, db);

      const active = getAllTodos("active", db);
      const completed = getAllTodos("completed", db);

      expect(active.map((t) => t.id)).toEqual([a.id]);
      expect(completed.map((t) => t.id)).toEqual([b.id]);
    });

    it("returns todos most-recently-created first", () => {
      const first = createTodo({ title: "First" }, db);
      const second = createTodo({ title: "Second" }, db);

      const all = getAllTodos("all", db);
      expect(all[0].id).toBe(second.id);
      expect(all[1].id).toBe(first.id);
    });
  });

  describe("getTodoById", () => {
    it("returns null for a non-existent id", () => {
      expect(getTodoById(9999, db)).toBeNull();
    });

    it("returns the matching todo", () => {
      const created = createTodo({ title: "Findable" }, db);
      const found = getTodoById(created.id, db);
      expect(found).toEqual(created);
    });
  });

  describe("updateTodo", () => {
    it("updates only the provided fields", () => {
      const todo = createTodo({ title: "Original", description: "desc", priority: "low" }, db);
      const updated = updateTodo(todo.id, { completed: true }, db);

      expect(updated.completed).toBe(true);
      expect(updated.title).toBe("Original");
      expect(updated.description).toBe("desc");
      expect(updated.priority).toBe("low");
    });

    it("bumps updatedAt without changing createdAt", () => {
      const todo = createTodo({ title: "Timestamps" }, db);
      const updated = updateTodo(todo.id, { title: "Timestamps v2" }, db);

      expect(updated.createdAt).toBe(todo.createdAt);
      expect(updated.updatedAt).toBeTruthy();
    });

    it("throws NotFoundError for a missing id", () => {
      expect(() => updateTodo(9999, { title: "Nope" }, db)).toThrow(NotFoundError);
    });

    it("rejects an invalid update", () => {
      const todo = createTodo({ title: "Valid" }, db);
      expect(() => updateTodo(todo.id, { title: "" }, db)).toThrow(ValidationError);
    });
  });

  describe("deleteTodo", () => {
    it("removes the todo", () => {
      const todo = createTodo({ title: "Temporary" }, db);
      deleteTodo(todo.id, db);
      expect(getTodoById(todo.id, db)).toBeNull();
    });

    it("throws NotFoundError for a missing id", () => {
      expect(() => deleteTodo(9999, db)).toThrow(NotFoundError);
    });
  });
});
