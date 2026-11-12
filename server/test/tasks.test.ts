import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { TaskStore } from "../src/store.js";

describe("tasks API", () => {
  let app: ReturnType<typeof createApp>;
  beforeEach(() => {
    app = createApp(new TaskStore());
  });

  it("reports health", async () => {
    const res = await request(app).get("/api/health");
    expect(res.body).toEqual({ ok: true });
  });

  it("creates and lists tasks", async () => {
    await request(app).post("/api/tasks").send({ title: "Write spec" }).expect(201);
    const res = await request(app).get("/api/tasks").expect(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({ title: "Write spec", done: false });
  });

  it("rejects empty and overlong titles", async () => {
    await request(app).post("/api/tasks").send({ title: "  " }).expect(400);
    await request(app).post("/api/tasks").send({ title: "x".repeat(121) }).expect(400);
  });

  it("toggles and deletes", async () => {
    const { body } = await request(app).post("/api/tasks").send({ title: "Ship" });
    const toggled = await request(app).patch(`/api/tasks/${body.id}`).send({ done: true }).expect(200);
    expect(toggled.body.done).toBe(true);
    await request(app).delete(`/api/tasks/${body.id}`).expect(204);
    await request(app).delete(`/api/tasks/${body.id}`).expect(404);
  });
});
