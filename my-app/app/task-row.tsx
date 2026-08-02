// app/task-row.tsx
//
// Client component — it owns the edit interactions. The page around it stays a
// Server Component and just hands each row its data.

"use client";

import { useState, useTransition } from "react";
import InlineEdit from "./inline-edit";
import { updateTaskField } from "./actions";
import { formatDate, toDateInputValue } from "@/lib/format";

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

function StatusSelect({ task }: { task: TaskView }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <select
        className={`status-select ${STATUS_CLASS[task.status]}`}
        aria-label={`Status for ${task.title}`}
        value={task.status}
        disabled={isPending}
        onChange={(event) => {
          const next = event.target.value;
          startTransition(async () => {
            const result = await updateTaskField(task.id, "status", next);
            setError(result.ok ? null : result.error);
          });
        }}
      >
        <option value="TODO">Todo</option>
        <option value="IN_PROGRESS">In Progress</option>
        <option value="COMPLETE">Complete</option>
      </select>
      {error && <span className="inline-edit-error">{error}</span>}
    </>
  );
}

export default function TaskRow({ task }: { task: TaskView }) {
  const classes = ["task"];
  if (task.overdue) classes.push("is-overdue");
  if (task.archived) classes.push("is-archived");

  return (
    <article className={classes.join(" ")}>
      <div className="task-main">
        <h3 className="task-title">
          <InlineEdit
            taskId={task.id}
            field="title"
            value={task.title}
            label={`Edit title: ${task.title}`}
          >
            {task.title}
          </InlineEdit>
        </h3>

        <div className="task-desc">
          <InlineEdit
            taskId={task.id}
            field="description"
            value={task.description ?? ""}
            type="textarea"
            placeholder="Add a description…"
            label={`Edit description for ${task.title}`}
          >
            {task.description || <span className="placeholder">Add a description…</span>}
          </InlineEdit>
        </div>

        <div className="task-meta">
          {task.overdue && <span className="badge-overdue">Overdue</span>}

          <span className="chip chip-due">
            Due{" "}
            <InlineEdit
              taskId={task.id}
              field="dueDate"
              value={toDateInputValue(task.dueDate)}
              type="date"
              label={`Edit due date for ${task.title}`}
            >
              <time dateTime={task.dueDate.toISOString()}>{formatDate(task.dueDate)}</time>
            </InlineEdit>
          </span>

          <InlineEdit
            taskId={task.id}
            field="topic"
            value={task.topic}
            className="chip chip-topic"
            label={`Edit topic for ${task.title}`}
          >
            {task.topic}
          </InlineEdit>
        </div>
      </div>

      <div className="task-side">
        <StatusSelect task={task} />
        {/* Not wired up yet. */}
        <button type="button" className="btn-archive" disabled>
          {task.archived ? "Unarchive" : "Archive"}
        </button>
      </div>
    </article>
  );
}
