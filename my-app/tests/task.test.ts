// tests/tasks.test.ts
//
// Integration tests: real Server Actions against a real (throwaway) SQLite
// database. Nothing is stubbed except next/cache, which needs a Next.js request
// context that doesn't exist outside the server.

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { createTask, setTaskArchived, updateTaskField } from "@/app/actions";
import { prisma } from "@/lib/prisma";
import { toDateInputValue } from "@/lib/format";

/** Builds the FormData that createTask expects from the new-task form. */
function taskForm(fields: {
  title?: string;
  description?: string;
  dueDate?: string;
  topic?: string;
}) {
  const form = new FormData();
  form.set("title", fields.title ?? "Test task");
  form.set("description", fields.description ?? "");
  form.set("dueDate", fields.dueDate ?? "2030-01-15");
  form.set("topic", fields.topic ?? "Coursework");
  return form;
}

/** A "YYYY-MM-DD" string a fixed number of days from today, in local time. */
function daysFromToday(offset: number) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return toDateInputValue(date);
}

beforeEach(async () => {
  // Clean slate before each test, so order can never affect the outcome.
  // The app itself never deletes tasks — this is test-database hygiene, and it
  // only ever runs against prisma/test.db.
  await prisma.task.deleteMany();
});

describe("creating tasks", () => {
  it("saves a task and applies the schema defaults", async () => {
    const result = await createTask({}, taskForm({ title: "Write report" }));
    expect(result.success).toBe(true);

    const tasks = await prisma.task.findMany();
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe("Write report");
    expect(tasks[0].topic).toBe("Coursework");
    // Status is fixed and not user-supplied at creation.
    expect(tasks[0].status).toBe("TODO");
    expect(tasks[0].archived).toBe(false);
  });

  it("rejects an empty title and writes nothing", async () => {
    const result = await createTask({}, taskForm({ title: "   " }));

    expect(result.success).toBeUndefined();
    expect(result.errors?.title).toBeTruthy();
    await expect(prisma.task.count()).resolves.toBe(0);
  });
});

describe("editing tasks", () => {
  it("persists an edited field", async () => {
    await createTask({}, taskForm({ title: "Before" }));
    const task = await prisma.task.findFirstOrThrow();

    const result = await updateTaskField(task.id, "title", "After");
    expect(result).toEqual({ ok: true });

    const updated = await prisma.task.findUniqueOrThrow({ where: { id: task.id } });
    expect(updated.title).toBe("After");
  });

  it("refuses to write a field that isn't editable", async () => {
    await createTask({}, taskForm({}));
    const task = await prisma.task.findFirstOrThrow();

    // "archived" is deliberately absent from EDITABLE_FIELDS — it has its own
    // action. Without the allowlist this call would archive the task.
    const result = await updateTaskField(
      task.id,
      "archived" as never,
      "true",
    );

    expect(result.ok).toBe(false);
    const unchanged = await prisma.task.findUniqueOrThrow({ where: { id: task.id } });
    expect(unchanged.archived).toBe(false);
  });
});

describe("archiving", () => {
  it("removes the task from the active list but keeps it readable", async () => {
    await createTask({}, taskForm({ title: "Old admin job" }));
    const task = await prisma.task.findFirstOrThrow();

    await setTaskArchived(task.id, true);

    // Gone from the active list...
    const active = await prisma.task.findMany({ where: { archived: false } });
    expect(active).toHaveLength(0);

    // ...but the row still exists, in full, and is still viewable.
    const archived = await prisma.task.findUniqueOrThrow({ where: { id: task.id } });
    expect(archived.archived).toBe(true);
    expect(archived.title).toBe("Old admin job");
    await expect(prisma.task.count()).resolves.toBe(1);
  });

  it("can be reversed", async () => {
    await createTask({}, taskForm({}));
    const task = await prisma.task.findFirstOrThrow();

    await setTaskArchived(task.id, true);
    await setTaskArchived(task.id, false);

    const active = await prisma.task.findMany({ where: { archived: false } });
    expect(active).toHaveLength(1);
  });
});

describe("the overdue rule", () => {
  it("flags a past-due task that isn't complete", async () => {
    await createTask({}, taskForm({ title: "Late", dueDate: daysFromToday(-3) }));

    const task = await prisma.task.findFirstOrThrow();
    expect(task.overdue).toBe(true);
    // Overdue is derived, not a status — the status is untouched.
    expect(task.status).toBe("TODO");
  });

  it("does not flag a completed task, however late", async () => {
    await createTask({}, taskForm({ title: "Done late", dueDate: daysFromToday(-30) }));
    const created = await prisma.task.findFirstOrThrow();

    await updateTaskField(created.id, "status", "COMPLETE");

    const task = await prisma.task.findUniqueOrThrow({ where: { id: created.id } });
    expect(task.overdue).toBe(false);
  });

  it("does not flag a task due today", async () => {
    // Guards the end-of-day rule: due dates are stored at 23:59:59 local, so
    // today's tasks stay off the overdue list until the day is actually over.
    await createTask({}, taskForm({ title: "Due today", dueDate: daysFromToday(0) }));

    const task = await prisma.task.findFirstOrThrow();
    expect(task.overdue).toBe(false);
  });

  it("does not flag a future task", async () => {
    await createTask({}, taskForm({ title: "Later", dueDate: daysFromToday(7) }));

    const task = await prisma.task.findFirstOrThrow();
    expect(task.overdue).toBe(false);
  });
});