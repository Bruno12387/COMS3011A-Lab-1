// lib/task-view.ts
//
// The shape a Client Component receives.
//
// Prisma's result objects aren't plain — they carry a `nodejs.util.inspect.custom`
// symbol so console.log prints them nicely. React can't serialise symbols across
// the server/client boundary, so handing one to a Client Component warns:
//
//   Only plain objects can be passed to Client Components from Server Components.
//
// Copying the fields we actually need onto a fresh object drops the symbol. It's
// also a useful boundary in its own right: the client only sees what it needs,
// so adding a column to the schema doesn't silently ship it to the browser.
//
// Dates are fine to pass through — React serialises those natively.

export type TaskView = {
  id: number;
  title: string;
  description: string | null;
  dueDate: Date;
  topic: string;
  status: "TODO" | "IN_PROGRESS" | "COMPLETE";
  archived: boolean;
  overdue: boolean;
};

/**
 * Accepts a Prisma task (structurally — extra fields like createdAt are fine)
 * and returns a plain object.
 */
export function toTaskView(task: TaskView): TaskView {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    dueDate: task.dueDate,
    topic: task.topic,
    status: task.status,
    archived: task.archived,
    overdue: task.overdue,
  };
}