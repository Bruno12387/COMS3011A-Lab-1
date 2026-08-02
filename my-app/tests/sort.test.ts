// tests/sort.test.ts
//
// Unit tests for the sort comparator. No database needed — these cover the two
// behaviours SQLite would get wrong if the ordering were left to `orderBy`.

import { describe, expect, it } from "vitest";
import { sortTasks } from "@/lib/sort";

type Row = {
  title: string;
  dueDate: Date;
  topic: string;
  status: "TODO" | "IN_PROGRESS" | "COMPLETE";
  createdAt: Date;
};

function row(overrides: Partial<Row> & { title: string }): Row {
  return {
    dueDate: new Date(2030, 0, 1),
    topic: "General",
    status: "TODO",
    createdAt: new Date(2026, 0, 1),
    ...overrides,
  };
}

const titles = (rows: Row[]) => rows.map((r) => r.title);

describe("sorting by status", () => {
  it("uses workflow order, not alphabetical order", () => {
    // Alphabetically SQLite would give COMPLETE, IN_PROGRESS, TODO — which is
    // close to backwards from what a user expects.
    const rows = [
      row({ title: "done", status: "COMPLETE" }),
      row({ title: "todo", status: "TODO" }),
      row({ title: "doing", status: "IN_PROGRESS" }),
    ];

    expect(titles(sortTasks(rows, "status", "asc"))).toEqual(["todo", "doing", "done"]);
    expect(titles(sortTasks(rows, "status", "desc"))).toEqual(["done", "doing", "todo"]);
  });
});

describe("sorting by topic", () => {
  it("ignores case", () => {
    // SQLite compares strings case-sensitively, which would put every
    // capitalised topic ahead of every lowercase one: Work, Zebra, admin.
    const rows = [
      row({ title: "c", topic: "Work" }),
      row({ title: "a", topic: "admin" }),
      row({ title: "b", topic: "Study" }),
    ];

    expect(titles(sortTasks(rows, "topic", "asc"))).toEqual(["a", "b", "c"]);
  });
});

describe("sorting by due date", () => {
  it("orders earliest first, and breaks ties predictably", () => {
    const sameDay = new Date(2030, 5, 10);
    const rows = [
      row({ title: "later", dueDate: new Date(2030, 5, 20) }),
      row({ title: "tie-second", dueDate: sameDay, createdAt: new Date(2026, 0, 2) }),
      row({ title: "tie-first", dueDate: sameDay, createdAt: new Date(2026, 0, 1) }),
    ];

    expect(titles(sortTasks(rows, "dueDate", "asc"))).toEqual([
      "tie-first",
      "tie-second",
      "later",
    ]);
  });

  it("does not mutate the array it is given", () => {
    const rows = [
      row({ title: "b", dueDate: new Date(2030, 5, 20) }),
      row({ title: "a", dueDate: new Date(2030, 5, 10) }),
    ];

    sortTasks(rows, "dueDate", "asc");
    expect(titles(rows)).toEqual(["b", "a"]);
  });
});