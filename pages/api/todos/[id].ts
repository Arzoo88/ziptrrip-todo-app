import type { NextApiRequest, NextApiResponse } from "next";
import { deleteTodo, getTodoById, NotFoundError, updateTodo, ValidationError } from "@/lib/todos";
import type { ApiError, Todo } from "@/lib/types";

export default function handler(req: NextApiRequest, res: NextApiResponse<Todo | ApiError | null>) {
  const idParam = req.query.id;
  const id = Number(idParam);

  if (!idParam || Number.isNaN(id)) {
    return res.status(400).json({ error: "A valid numeric todo id is required." });
  }

  switch (req.method) {
    case "GET": {
      const todo = getTodoById(id);
      if (!todo) return res.status(404).json({ error: `Todo ${id} not found.` });
      return res.status(200).json(todo);
    }

    case "PUT": {
      try {
        const todo = updateTodo(id, req.body ?? {});
        return res.status(200).json(todo);
      } catch (err) {
        if (err instanceof NotFoundError) return res.status(404).json({ error: err.message });
        if (err instanceof ValidationError) return res.status(400).json({ error: err.message });
        console.error(err);
        return res.status(500).json({ error: "Failed to update todo." });
      }
    }

    case "DELETE": {
      try {
        deleteTodo(id);
        return res.status(204).end();
      } catch (err) {
        if (err instanceof NotFoundError) return res.status(404).json({ error: err.message });
        console.error(err);
        return res.status(500).json({ error: "Failed to delete todo." });
      }
    }

    default:
      res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
      return res.status(405).json({ error: `Method ${req.method} not allowed.` });
  }
}
