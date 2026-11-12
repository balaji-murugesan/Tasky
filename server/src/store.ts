import { randomUUID } from "node:crypto";

export interface Task {
  id: string;
  title: string;
  done: boolean;
  createdAt: string;
}

/** In-memory store. Deliberately simple so agents can focus on the loop, not infra. */
export class TaskStore {
  private tasks: Task[] = [];

  list(): Task[] {
    return [...this.tasks];
  }

  add(title: string): Task {
    const task: Task = { id: randomUUID(), title, done: false, createdAt: new Date().toISOString() };
    this.tasks.push(task);
    return task;
  }

  toggle(id: string, done: boolean): Task | undefined {
    const task = this.tasks.find((t) => t.id === id);
    if (task) task.done = done;
    return task;
  }

  remove(id: string): boolean {
    const before = this.tasks.length;
    this.tasks = this.tasks.filter((t) => t.id !== id);
    return this.tasks.length < before;
  }

  reset(): void {
    this.tasks = [];
  }
}
