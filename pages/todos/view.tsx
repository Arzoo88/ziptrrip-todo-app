import type { GetServerSideProps } from "next";
import { useState } from "react";
import { getTodoById } from "@/lib/todos";
import type { Todo } from "@/lib/types";

interface Props {
  todo: Todo | null;
  notFoundId?: string;
}

// The todo id is read as a query parameter (?id=...), per the assignment spec,
// rather than a dynamic route segment.
export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const idParam = ctx.query.id;
  const id = Number(idParam);

  if (!idParam || Number.isNaN(id)) {
    return { props: { todo: null, notFoundId: String(idParam ?? "") } };
  }

  const todo = getTodoById(id);
  return { props: { todo } };
};

export default function TodoDetailPage({ todo, notFoundId }: Props) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(todo?.title ?? "");
  const [description, setDescription] = useState(todo?.description ?? "");
  const [priority, setPriority] = useState(todo?.priority ?? "medium");
  const [dueDate, setDueDate] = useState(todo?.dueDate ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!todo) {
    return (
      <div className="container">
        <a className="back-link" href="/todos">
          ← Back to all todos
        </a>
        <div className="card">
          <p>No todo found for id "{notFoundId}".</p>
        </div>
      </div>
    );
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/todos/${todo!.id}`, {
        method: "PUT",
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
        throw new Error(body.error || "Failed to save changes.");
      }
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSaving(false);
    }
  }

  async function handleToggle() {
    await fetch(`/api/todos/${todo!.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !todo!.completed }),
    });
    window.location.reload();
  }

  async function handleDelete() {
    if (!confirm("Delete this todo? This cannot be undone.")) return;
    await fetch(`/api/todos/${todo!.id}`, { method: "DELETE" });
    window.location.href = "/todos";
  }

  return (
    <div className="container">
      <a className="back-link" href="/todos">
        ← Back to all todos
      </a>

      {error && <div className="error-banner">{error}</div>}

      <div className="card">
        {!editing ? (
          <>
            <h1 className={todo.completed ? "todo-title completed" : "todo-title"} style={{ fontSize: "1.4rem" }}>
              {todo.title}
            </h1>
            <div className="todo-meta" style={{ margin: "10px 0 18px" }}>
              <span className={`badge badge-${todo.priority}`}>{todo.priority}</span>
              <span className="badge badge-due">{todo.completed ? "Completed" : "Active"}</span>
              {todo.dueDate && <span className="badge badge-due">Due {todo.dueDate}</span>}
            </div>

            <div className="detail-field">
              <div className="label">Description</div>
              <div>{todo.description || "—"}</div>
            </div>
            <div className="detail-field">
              <div className="label">Id</div>
              <div>{todo.id}</div>
            </div>
            <div className="detail-field">
              <div className="label">Created</div>
              <div>{new Date(todo.createdAt).toLocaleString()}</div>
            </div>
            <div className="detail-field">
              <div className="label">Last updated</div>
              <div>{new Date(todo.updatedAt).toLocaleString()}</div>
            </div>

            <div className="actions-row">
              <button className="btn-secondary" onClick={() => setEditing(true)}>
                Edit
              </button>
              <button className="btn-secondary" onClick={handleToggle}>
                Mark as {todo.completed ? "active" : "completed"}
              </button>
              <button className="btn-danger" onClick={handleDelete}>
                Delete
              </button>
            </div>
          </>
        ) : (
          <form className="form-grid" onSubmit={handleSave}>
            <div>
              <label htmlFor="title">Title</label>
              <input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <label htmlFor="description">Description</label>
              <textarea id="description" value={description ?? ""} onChange={(e) => setDescription(e.target.value)} />
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
                <input id="dueDate" type="date" value={dueDate ?? ""} onChange={(e) => setDueDate(e.target.value)} />
              </div>
            </div>
            <div className="actions-row">
              <button className="btn-primary" type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
              </button>
              <button className="btn-secondary" type="button" onClick={() => setEditing(false)}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
