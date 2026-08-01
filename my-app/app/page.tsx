// app/page.tsx
//
// Server Component. Reads straight from Prisma — no fetch, no API route.
//
// Implemented so far: creating a task, and listing tasks.
// Still inert: the sort controls, click-to-edit, and the archive buttons.

import { prisma } from "@/lib/prisma";
import NewTaskForm from "./new-task-form";

// `overdue` is computed at request time, so this page must not be cached —
// otherwise a task crossing its due date wouldn't visibly flip until a redeploy.
export const dynamic = "force-dynamic";

// Picks up the `overdue` field added by the client extension in lib/prisma.ts.
type Task = Awaited<ReturnType<typeof prisma.task.findMany>>[number];

const STATUS_LABEL = {
  TODO: "Todo",
  IN_PROGRESS: "In Progress",
  COMPLETE: "Complete",
} as const;

const STATUS_CLASS = {
  TODO: "status-todo",
  IN_PROGRESS: "status-progress",
  COMPLETE: "status-complete",
} as const;

function formatDate(date: Date) {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function TaskRow({ task }: { task: Task }) {
  const classes = ["task"];
  if (task.overdue) classes.push("is-overdue");
  if (task.archived) classes.push("is-archived");

  return (
    <article className={classes.join(" ")}>
      <div className="task-main">
        <h3 className="task-title">{task.title}</h3>

        {task.description && <p className="task-desc">{task.description}</p>}

        <div className="task-meta">
          {task.overdue && <span className="badge-overdue">Overdue</span>}
          <span className="chip chip-due">
            Due <time dateTime={task.dueDate.toISOString()}>{formatDate(task.dueDate)}</time>
          </span>
          <span className="chip chip-topic">{task.topic}</span>
        </div>
      </div>

      <div className="task-side">
        <span className={`chip chip-status ${STATUS_CLASS[task.status]}`}>
          {STATUS_LABEL[task.status]}
        </span>
        {/* Not wired up yet — disabled so it doesn't look clickable. */}
        <button type="button" className="btn-archive" disabled>
          {task.archived ? "Unarchive" : "Archive"}
        </button>
      </div>
    </article>
  );
}

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
