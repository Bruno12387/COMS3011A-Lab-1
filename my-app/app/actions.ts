// app/actions.ts
//
// Server Actions. "use server" turns every export in this file into a callable
// endpoint, so two rules apply:
//   1. Only async functions may be exported (types are fine — they're erased).
//   2. Every argument arrives from the client and must be treated as untrusted.

"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/* shared helpers                                                      */
/* ------------------------------------------------------------------ */

/**
 * An <input type="date"> submits "YYYY-MM-DD" with no time and no timezone.
 * Passing that to `new Date()` parses it as UTC midnight, which lands on the
 * previous day for anyone west of Greenwich. Building from the parts is treated
 * as local time instead, and we push to the last millisecond of the day so a
 * task due today isn't overdue until today is over.
 */
function parseDueDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day), 23, 59, 59, 999);

  // Catches impossible dates like 2026-02-31, which JS silently rolls over.
  if (date.getMonth() !== Number(month) - 1) return null;

  return Number.isNaN(date.getTime()) ? null : date;
}

/* ------------------------------------------------------------------ */
/* create                                                              */
/* ------------------------------------------------------------------ */

export type CreateTaskState = {
  errors?: {
    title?: string;
    dueDate?: string;
    topic?: string;
    form?: string;
  };
  // Echoed back so a failed submit doesn't lose what was typed.
  values?: {
    title: string;
    description: string;
    dueDate: string;
    topic: string;
  };
  success?: boolean;
};

export async function createTask(
  _prevState: CreateTaskState,
  formData: FormData,
): Promise<CreateTaskState> {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const dueDateRaw = String(formData.get("dueDate") ?? "").trim();
  const topic = String(formData.get("topic") ?? "").trim();

  const values = { title, description, dueDate: dueDateRaw, topic };
  const errors: NonNullable<CreateTaskState["errors"]> = {};

  if (!title) {
    errors.title = "Title is required.";
  } else if (title.length > 200) {
    errors.title = "Keep the title under 200 characters.";
  }

  if (!topic) {
    errors.topic = "Topic is required.";
  } else if (topic.length > 60) {
    errors.topic = "Keep the topic under 60 characters.";
  }

  const dueDate = dueDateRaw ? parseDueDate(dueDateRaw) : null;

  if (!dueDateRaw) {
    errors.dueDate = "Due date is required.";
  } else if (!dueDate) {
    errors.dueDate = "That date isn't valid.";
  }

  if (Object.keys(errors).length > 0) {
    return { errors, values };
  }

  try {
    await prisma.task.create({
      data: {
        title,
        description: description || null,
        dueDate: dueDate!,
        topic,
        // status defaults to TODO, archived to false, per the schema.
      },
    });
  } catch (error) {
    console.error("createTask failed:", error);
    return { errors: { form: "Could not save the task. Please try again." }, values };
  }

  revalidatePath("/");
  return { success: true };
}

/* ------------------------------------------------------------------ */
/* update                                                              */
/* ------------------------------------------------------------------ */

// The allowlist is the security boundary. `field` arrives from the browser, so
// without this a caller could pass "archived" or "id" and write whatever they
// liked. Never build a Prisma `data` object from an unchecked client string.
const EDITABLE_FIELDS = ["title", "description", "topic", "dueDate", "status"] as const;

export type EditableField = (typeof EDITABLE_FIELDS)[number];

const STATUSES = ["TODO", "IN_PROGRESS", "COMPLETE"] as const;

export type UpdateResult = { ok: true } | { ok: false; error: string };

export async function updateTaskField(
  id: number,
  field: EditableField,
  rawValue: string,
): Promise<UpdateResult> {
  if (!Number.isInteger(id) || id <= 0) {
    return { ok: false, error: "Invalid task." };
  }

  if (!EDITABLE_FIELDS.includes(field)) {
    return { ok: false, error: "That field can't be edited." };
  }

  const value = rawValue.trim();
  let data: Record<string, unknown>;

  switch (field) {
    case "title": {
      if (!value) return { ok: false, error: "Title can't be empty." };
      if (value.length > 200) return { ok: false, error: "Keep it under 200 characters." };
      data = { title: value };
      break;
    }

    case "description": {
      // Empty is allowed here — clearing the description sets it back to null.
      if (value.length > 2000) return { ok: false, error: "Keep it under 2000 characters." };
      data = { description: value || null };
      break;
    }

    case "topic": {
      if (!value) return { ok: false, error: "Topic can't be empty." };
      if (value.length > 60) return { ok: false, error: "Keep it under 60 characters." };
      data = { topic: value };
      break;
    }

    case "dueDate": {
      const parsed = parseDueDate(value);
      if (!parsed) return { ok: false, error: "That date isn't valid." };
      data = { dueDate: parsed };
      break;
    }

    case "status": {
      if (!STATUSES.includes(value as (typeof STATUSES)[number])) {
        return { ok: false, error: "Unknown status." };
      }
      data = { status: value };
      break;
    }
  }

  try {
    await prisma.task.update({ where: { id }, data });
  } catch (error) {
    // P2025 is Prisma's "record to update not found".
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2025") {
      return { ok: false, error: "That task no longer exists." };
    }
    console.error("updateTaskField failed:", error);
    return { ok: false, error: "Could not save. Please try again." };
  }

  revalidatePath("/");
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* archive                                                             */
/* ------------------------------------------------------------------ */

/**
 * Archiving is a flag, not a delete — the row stays in the database and stays
 * readable. `archived` is kept out of EDITABLE_FIELDS on purpose so it can only
 * be changed through this action, which takes a real boolean rather than a
 * string parsed from an edit box.
 */
export async function setTaskArchived(id: number, archived: boolean): Promise<UpdateResult> {
  if (!Number.isInteger(id) || id <= 0) {
    return { ok: false, error: "Invalid task." };
  }

  if (typeof archived !== "boolean") {
    return { ok: false, error: "Invalid request." };
  }

  try {
    await prisma.task.update({ where: { id }, data: { archived } });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2025") {
      return { ok: false, error: "That task no longer exists." };
    }
    console.error("setTaskArchived failed:", error);
    return { ok: false, error: "Could not save. Please try again." };
  }

  revalidatePath("/");
  return { ok: true };
}