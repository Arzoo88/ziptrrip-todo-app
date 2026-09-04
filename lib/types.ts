export type Priority = "low" | "medium" | "high";

export interface Todo {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  priority: Priority;
  dueDate: string | null; // ISO date string (YYYY-MM-DD), nullable
  createdAt: string; // ISO datetime string
  updatedAt: string; // ISO datetime string
}

export interface CreateTodoInput {
  title: string;
  description?: string | null;
  priority?: Priority;
  dueDate?: string | null;
}

export interface UpdateTodoInput {
  title?: string;
  description?: string | null;
  completed?: boolean;
  priority?: Priority;
  dueDate?: string | null;
}

export type TodoFilter = "all" | "active" | "completed";

export interface ApiError {
  error: string;
}
