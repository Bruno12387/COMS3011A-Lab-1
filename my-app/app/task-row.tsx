// app/task-row.tsx
//
// Client component — it owns the edit interactions. The page around it stays a
// Server Component and just hands each row its data.

"use client";

import { useState, useTransition } from "react";
import InlineEdit from "./inline-edit";
import { setTaskArchived, updateTaskField } from "./actions";
import { formatDate, toDateInputValue } from "@/lib/format";
import type { TaskView } from "@/lib/task-view";

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

function ArchiveButton({ task }: { task: TaskView }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <button
        type="button"
        className="btn-archive"
        disabled={isPending}
        aria-label={`${task.archived ? "Unarchive" : "Archive"} ${task.title}`}
        onClick={() => {
          startTransition(async () => {
            const result = await setTaskArchived(task.id, !task.archived);
            setError(result.ok ? null : result.error);
          });
        }}
      >
        {isPending ? "Saving…" : task.archived ? "Unarchive" : "Archive"}
      </button>
      {error && <span className="inline-edit-error">{error}</span>}
    </>
  );
}

export default function TaskRow({ task }: { task: TaskView }) {
  // Archived tasks are out of the active workflow, so the red urgency styling
  // would just be noise. Drop the `&& !task.archived` on both lines below if
  // you'd rather see overdue archived tasks flagged.
  const showOverdue = task.overdue && !task.archived;

  const classes = ["task"];
  if (showOverdue) classes.push("is-overdue");
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
          {showOverdue && <span className="badge-overdue">Overdue</span>}

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
        <ArchiveButton task={task} />
      </div>
    </article>
  );
}