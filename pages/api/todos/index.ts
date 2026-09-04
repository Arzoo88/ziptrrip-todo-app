import type { NextApiRequest, NextApiResponse } from "next";
import { createTodo, getAllTodos, ValidationError } from "@/lib/todos";
import type { ApiError, Todo, TodoFilter } from "@/lib/types";

export default function handler(req: NextApiRequest, res: NextApiResponse<Todo | Todo[] | ApiError>) {
  switch (req.method) {
    case "GET": {
      const filterParam = req.query.filter;
      const filter: TodoFilter =
        filterParam === "active" || filterParam === "completed" ? filterParam : "all";
      const todos = getAllTodos(filter);
      return res.status(200).json(todos);
    }

    case "POST": {
      try {
        const todo = createTodo(req.body ?? {});
        return res.status(201).json(todo);
      } catch (err) {
        if (err instanceof ValidationError) {
          return res.status(400).json({ error: err.message });
        }
        console.error(err);
        return res.status(500).json({ error: "Failed to create todo." });
      }
    }

    default:
      res.setHeader("Allow", ["GET", "POST"]);
      return res.status(405).json({ error: `Method ${req.method} not allowed.` });
  }
}
