import express from "express";
import { TaskStore } from "./store.js";

export function createApp(store = new TaskStore()) {
  const app = express();
  app.use(express.json());

  // Health endpoint: the run-app skill and CI wait on this before testing.
  app.get("/api/health", (_req, res) => res.json({ ok: true }));

  app.get("/api/tasks", (_req, res) => res.json(store.list()));

  app.post("/api/tasks", (req, res) => {
    const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";
    if (!title) return res.status(400).json({ error: "title is required" });
    if (title.length > 120) return res.status(400).json({ error: "title must be 120 characters or fewer" });
    res.status(201).json(store.add(title));
  });

  app.patch("/api/tasks/:id", (req, res) => {
    const task = store.toggle(req.params.id, Boolean(req.body?.done));
    if (!task) return res.status(404).json({ error: "not found" });
    res.json(task);
  });

  app.delete("/api/tasks/:id", (req, res) => {
    if (!store.remove(req.params.id)) return res.status(404).json({ error: "not found" });
    res.status(204).end();
  });

  // Test-only reset so e2e runs start from a known state.
  if (process.env.NODE_ENV !== "production") {
    app.post("/api/__reset", (_req, res) => {
      store.reset();
      res.status(204).end();
    });
  }

  return app;
}
