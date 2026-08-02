// app/page.tsx
//
// Server Component. Reads straight from Prisma — no fetch, no API route.
//
// Implemented: creating tasks, listing them, editing every field, sorting,
// archiving and unarchiving.

import { prisma } from "@/lib/prisma";
import NewTaskForm from "./new-task-form";
import SortToolbar from "./sort-toolbar";
import TaskRow from "./task-row";
import { parseSortDir, parseSortKey, sortTasks } from "@/lib/sort";
import { toTaskView } from "@/lib/task-view";

// `overdue` is computed at request time, so this page must not be cached —
// otherwise a task crossing its due date wouldn't visibly flip.
export const dynamic = "force-dynamic";

// searchParams is a Promise in the App Router and has to be awaited.
type Props = {
  searchParams: Promise<{ sort?: string; dir?: string }>;
};

export default async function TasksPage({ searchParams }: Props) {
  const params = await searchParams;
  const sort = parseSortKey(params.sort);
  const dir = parseSortDir(params.dir);

  const [activeTasks, archivedTasks] = await Promise.all([
    prisma.task.findMany({ where: { archived: false } }),
    prisma.task.findMany({ where: { archived: true } }),
  ]);

  // Sort first — sortTasks needs createdAt, which TaskView deliberately omits.
  // See lib/sort.ts for why the ordering happens here rather than in `orderBy`.
  // Then map to plain objects before they cross into Client Components.
  const tasks = sortTasks(activeTasks, sort, dir).map(toTaskView);
  const archived = sortTasks(archivedTasks, sort, dir).map(toTaskView);

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

      <SortToolbar sort={sort} dir={dir} />

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

      {archived.length > 0 && (
        <details className="archived">
          <summary>Archived · {archived.length}</summary>
          <div className="task-list">
            {archived.map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}