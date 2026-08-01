// app/actions.ts
//
// Server Actions. "use server" marks every export in this file as something the
// client may call — so only export things that are safe to expose as endpoints.
 
"use server";
 
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
 
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
 
/**
 * An <input type="date"> submits "YYYY-MM-DD" with no time and no timezone.
 * Passing that straight to `new Date()` parses it as UTC midnight, which lands
 * on the previous day for anyone west of Greenwich.
 *
 * We build the date from its parts instead, which the Date constructor treats
 * as local time, and push it to the last millisecond of that day — a task due
 * today shouldn't count as overdue until today is actually over.
 */
function parseDueDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
 
  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day), 23, 59, 59, 999);
 
  // Catches impossible dates like 2026-02-31, which JS would silently roll over.
  if (date.getMonth() !== Number(month) - 1) return null;
 
  return Number.isNaN(date.getTime()) ? null : date;
}
 
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
 
  // Validate on the server even though the inputs are marked `required`.
  // Client-side validation is a convenience, not a guarantee — a Server Action
  // is a real endpoint and can be called with anything.
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
        // status defaults to TODO and archived defaults to false, per the schema.
      },
    });
  } catch (error) {
    console.error("createTask failed:", error);
    return { errors: { form: "Could not save the task. Please try again." }, values };
  }
 
  // Throw away the cached render of "/" so the new task appears.
  revalidatePath("/");
 
  return { success: true };
}