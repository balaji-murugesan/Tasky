import { FormEvent, useEffect, useState } from "react";

interface Task {
  id: string;
  title: string;
  done: boolean;
}

export function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = async () => setTasks(await (await fetch("/api/tasks")).json());
  useEffect(() => {
    load();
  }, []);

  async function add(e: FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    if (!res.ok) {
      setError((await res.json()).error);
      return;
    }
    setError(null);
    setTitle("");
    load();
  }

  async function toggle(t: Task) {
    // Optimistic update so the checkbox reflects the click immediately.
    setTasks((prev) => prev.map((x) => (x.id === t.id ? { ...x, done: !t.done } : x)));
    await fetch(`/api/tasks/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: !t.done }),
    });
    load();
  }

  async function remove(t: Task) {
    await fetch(`/api/tasks/${t.id}`, { method: "DELETE" });
    load();
  }

  const open = tasks.filter((t) => !t.done).length;

  return (
    <main className="card">
      <h1>Tasky</h1>
      <p className="muted" data-testid="summary">
        {open} open · {tasks.length - open} done
      </p>
      <form onSubmit={add} className="row">
        <input
          aria-label="New task"
          placeholder="What needs doing?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button type="submit">Add</button>
      </form>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <ul>
        {tasks.map((t) => (
          <li key={t.id} className={t.done ? "done" : ""}>
            <label>
              <input type="checkbox" checked={t.done} onChange={() => toggle(t)} aria-label={`Complete ${t.title}`} />
              <span>{t.title}</span>
            </label>
            <button className="ghost" onClick={() => remove(t)} aria-label={`Delete ${t.title}`}>
              ✕
            </button>
          </li>
        ))}
      </ul>
      {tasks.length === 0 && <p className="muted empty">No tasks yet. Add one above.</p>}
    </main>
  );
}
