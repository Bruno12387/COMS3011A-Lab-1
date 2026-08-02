// app/inline-edit.tsx
//
// Click a value, it becomes an input. Enter or blur saves, Escape cancels.
//
// The read-mode element is a <button>, not a <div onClick>. That's deliberate:
// buttons are focusable, reachable by Tab, and activate on Enter/Space for free.
// A clickable div would need all of that reimplemented by hand.

"use client";

import { useRef, useState, useTransition, type ReactNode } from "react";
import { updateTaskField, type EditableField } from "./actions";

type Props = {
  taskId: number;
  field: EditableField;
  /** Raw value to seed the input with (ISO "YYYY-MM-DD" for dates). */
  value: string;
  /** What to show when not editing. */
  children: ReactNode;
  type?: "text" | "textarea" | "date";
  /** Applied to both the read-mode button and the input, so styling matches. */
  className?: string;
  placeholder?: string;
  /** Accessible label, e.g. "Edit title". */
  label: string;
};

export default function InlineEdit({
  taskId,
  field,
  value,
  children,
  type = "text",
  className = "",
  placeholder,
  label,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Guards against blur and Enter both firing a save for the same edit.
  const savingRef = useRef(false);

  function save(next: string) {
    if (savingRef.current) return;

    // Nothing changed — close without a round-trip.
    if (next.trim() === value.trim()) {
      setEditing(false);
      setError(null);
      return;
    }

    savingRef.current = true;

    startTransition(async () => {
      const result = await updateTaskField(taskId, field, next);
      savingRef.current = false;

      if (result.ok) {
        setEditing(false);
        setError(null);
      } else {
        // Stay open so the bad value is still there to fix.
        setError(result.error);
      }
    });
  }

  function cancel() {
    savingRef.current = true; // suppress the blur-save that follows Escape
    setEditing(false);
    setError(null);
    // Released on the next tick, once blur has come and gone.
    setTimeout(() => {
      savingRef.current = false;
    }, 0);
  }

  if (!editing) {
    return (
      <>
        <button
          type="button"
          className={`inline-edit ${className}`}
          onClick={() => setEditing(true)}
          aria-label={label}
        >
          {children}
        </button>
        {error && <span className="inline-edit-error">{error}</span>}
      </>
    );
  }

  const shared = {
    autoFocus: true,
    defaultValue: value,
    placeholder,
    disabled: isPending,
    className: `inline-edit-input ${className}`,
    "aria-label": label,
    "aria-invalid": error ? (true as const) : undefined,
  };

  return (
    <>
      {type === "textarea" ? (
        <textarea
          {...shared}
          rows={3}
          onBlur={(e) => save(e.target.value)}
          onKeyDown={(e) => {
            // Enter inserts a newline here, so Ctrl/Cmd+Enter is the save key.
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              save(e.currentTarget.value);
            }
            if (e.key === "Escape") cancel();
          }}
        />
      ) : (
        <input
          {...shared}
          type={type === "date" ? "date" : "text"}
          onBlur={(e) => save(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              save(e.currentTarget.value);
            }
            if (e.key === "Escape") cancel();
          }}
        />
      )}
      {error && <span className="inline-edit-error">{error}</span>}
    </>
  );
}
