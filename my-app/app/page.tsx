// app/page.tsx
//
// Server Component. Reads straight from Prisma — no fetch, no API route.
//
// Implemented: creating tasks, listing them, editing every field.
// Still inert: the sort controls and the archive buttons.

import { prisma } from "@/lib/prisma";
import NewTaskForm from "./new-task-form";
import TaskRow from "./task-row";

// `overdue` is computed at request time, so this page must not be cached —
// otherwise a task crossing its due date wouldn't visibly flip.
export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const [tasks, archivedTasks] = await Promise.all([
    prisma.task.findMany({
      where: { archived: false },
      // createdAt breaks ties so equal due dates don't shuffle between loads.
      orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
    }),
    prisma.task.findMany({
      where: { archived: true },
      orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  const overdueCount = tasks.filter((task) => task.overdue).length;

  return (
    <div className="page">
      <header className="page-head">
        <h1>Tasks</h1>
        <span className="count">
          {tasks.length} active
          {overdueCount > 0 && ` · ${overdueCount} overdue`}
        </span>
      </header>

      <NewTaskForm />

      {/* ============ SORT TOOLBAR (not wired up yet) ============ */}

      <div className="toolbar">
        <label htmlFor="sort-by">Sort by</label>
        <select id="sort-by" defaultValue="dueDate" disabled>
          <option value="dueDate">Due date</option>
          <option value="topic">Topic</option>
          <option value="status">Status</option>
        </select>

        <select id="sort-dir" aria-label="Sort direction" defaultValue="asc" disabled>
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>

        <span className="spacer" />

        <label className="toggle">
          <input type="checkbox" id="overdue-only" disabled />
          Overdue only
        </label>
      </div>

      {/* ============ ACTIVE TASKS ============ */}

      {tasks.length === 0 ? (
        <div className="empty">No tasks yet. Add one above to get started.</div>
      ) : (
        <div className="task-list">
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} />
          ))}
        </div>
      )}

      {/* ============ ARCHIVED ============ */}

      {archivedTasks.length > 0 && (
        <details className="archived">
          <summary>Archived · {archivedTasks.length}</summary>
          <div className="task-list">
            {archivedTasks.map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}