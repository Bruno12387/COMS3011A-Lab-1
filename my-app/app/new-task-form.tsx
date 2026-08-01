// app/new-task-form.tsx
//
// Client component — it needs state for the pending flag and validation errors.
// Kept deliberately small so the rest of the page stays a Server Component.

"use client";

import { useActionState, useEffect, useRef } from "react";
import { createTask, type CreateTaskState } from "./actions";

const initialState: CreateTaskState = {};

export default function NewTaskForm() {
  const [state, formAction, isPending] = useActionState(createTask, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  // Clear the inputs once a save succeeds. The action can't do this itself —
  // it runs on the server and has no handle on the DOM.
  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <section className="panel" aria-labelledby="create-heading">
      <h2 id="create-heading">New task</h2>

      <form ref={formRef} action={formAction}>
        <div className="create-grid">
          <div className="field wide">
            <label htmlFor="new-title">Title</label>
            <input
              type="text"
              id="new-title"
              name="title"
              placeholder="What needs doing?"
              required
              maxLength={200}
              defaultValue={state.values?.title}
              aria-invalid={state.errors?.title ? true : undefined}
              aria-describedby={state.errors?.title ? "err-title" : undefined}
            />
            {state.errors?.title && (
              <p className="field-error" id="err-title">
                {state.errors.title}
              </p>
            )}
          </div>

          <div className="field wide">
            <label htmlFor="new-desc">Description</label>
            <textarea
              id="new-desc"
              name="description"
              placeholder="Optional detail…"
              defaultValue={state.values?.description}
            />
          </div>

          <div className="field">
            <label htmlFor="new-due">Due date</label>
            <input
              type="date"
              id="new-due"
              name="dueDate"
              required
              defaultValue={state.values?.dueDate}
              aria-invalid={state.errors?.dueDate ? true : undefined}
              aria-describedby={state.errors?.dueDate ? "err-due" : undefined}
            />
            {state.errors?.dueDate && (
              <p className="field-error" id="err-due">
                {state.errors.dueDate}
              </p>
            )}
          </div>

          <div className="field">
            <label htmlFor="new-topic">Topic</label>
            <input
              type="text"
              id="new-topic"
              name="topic"
              placeholder="e.g. Coursework"
              required
              maxLength={60}
              defaultValue={state.values?.topic}
              aria-invalid={state.errors?.topic ? true : undefined}
              aria-describedby={state.errors?.topic ? "err-topic" : undefined}
            />
            {state.errors?.topic && (
              <p className="field-error" id="err-topic">
                {state.errors.topic}
              </p>
            )}
          </div>
        </div>

        {state.errors?.form && (
          <p className="form-error" role="alert">
            {state.errors.form}
          </p>
        )}

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={isPending}>
            {isPending ? "Adding…" : "Add task"}
          </button>
          <span className="hint">
            New tasks start as <strong>Todo</strong>.
          </span>
        </div>
      </form>
    </section>
  );
}
