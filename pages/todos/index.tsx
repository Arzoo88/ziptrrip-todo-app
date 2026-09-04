import type { GetServerSideProps } from "next";
import { useMemo, useState } from "react";
import { getAllTodos } from "@/lib/todos";
import type { Todo, TodoFilter } from "@/lib/types";

interface Props {
  todos: Todo[];
  filter: TodoFilter;
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const filterParam = ctx.query.filter;
  const filter: TodoFilter =
    filterParam === "active" || filterParam === "completed" ? filterParam : "all";
  const todos = getAllTodos(filter);
  return { props: { todos, filter } };
};

export default function TodosPage({ todos, filter }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [dueDate, setDueDate] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const visibleTodos = useMemo(() => {
    if (!search.trim()) return todos;
    const q = search.trim().toLowerCase();
    return todos.filter(
      (t) => t.title.toLowerCase().includes(q) || (t.description ?? "").toLowerCase().includes(q)
    );
  }, [todos, search]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || null,
          priority,
          dueDate: dueDate || null,
        }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to add todo.");
      }
      // Full page reload keeps this app MPA-style rather than client-rendered.
      window.location.href = "/todos" + (filter !== "all" ? `?filter=${filter}` : "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  async function handleToggle(todo: Todo) {
    await fetch(`/api/todos/${todo.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !todo.completed }),
    });
    window.location.reload();
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this todo? This cannot be undone.")) return;
    await fetch(`/api/todos/${id}`, { method: "DELETE" });
    window.location.reload();
  }

  return (
    <div className="container">
      <div className="header">
        <div className="logo-mark" />
        <h1>
          <span className="brand">Ziptrrip</span> Todos
        </h1>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="card">
        <form className="form-grid" onSubmit={handleAdd}>
          <div>
            <label htmlFor="title">Title</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs doing?"
            />
          </div>
          <div>
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional details"
            />
          </div>
          <div className="row">
            <div>
              <label htmlFor="priority">Priority</label>
              <select id="priority" value={priority} onChange={(e) => setPriority(e.target.value as any)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label htmlFor="dueDate">Due date</label>
              <input id="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
          <div>
            <button className="btn-primary" type="submit" disabled={submitting}>
              {submitting ? "Adding…" : "Add todo"}
            </button>
          </div>
        </form>
      </div>

      <input
        className="search-input"
        type="text"
        placeholder="Search todos…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="filters">
        <a href="/todos?filter=all">
          <button className={filter === "all" ? "active" : ""}>All</button>
        </a>
        <a href="/todos?filter=active">
          <button className={filter === "active" ? "active" : ""}>Active</button>
        </a>
        <a href="/todos?filter=completed">
          <button className={filter === "completed" ? "active" : ""}>Completed</button>
        </a>
      </div>

      <div className="card">
        {visibleTodos.length === 0 ? (
          <div className="empty-state">No todos here. Add one above to get started.</div>
        ) : (
          <ul className="todo-list">
            {visibleTodos.map((todo) => (
              <li className="todo-item" key={todo.id}>
                <div className={`stripe stripe-${todo.priority}`} />
                <div className="todo-row-content">
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => handleToggle(todo)}
                    aria-label={`Mark "${todo.title}" as ${todo.completed ? "active" : "completed"}`}
                  />
                  <div className="todo-main">
                    <a href={`/todos/view?id=${todo.id}`} className={`todo-title ${todo.completed ? "completed" : ""}`}>
                      {todo.title}
                    </a>
                    <div className="todo-meta">
                      <span className={`badge badge-${todo.priority}`}>{todo.priority}</span>
                      {todo.dueDate && <span className="badge badge-due">Due {todo.dueDate}</span>}
                    </div>
                  </div>
                  <button className="btn-danger" onClick={() => handleDelete(todo.id)}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}