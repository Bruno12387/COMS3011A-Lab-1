// lib/sort.ts
//
// Sorting happens in JS rather than in the database, which needs justifying
// since the obvious move would be a Prisma `orderBy`.
//
//   - status: the column stores text, so SQLite would order it alphabetically —
//     COMPLETE, IN_PROGRESS, TODO. Nobody wants that. The workflow order is
//     Todo → In Progress → Complete, which needs an explicit rank.
//   - topic: SQLite compares strings case-sensitively by default, so "Work"
//     sorts before "admin". Prisma's `mode: "insensitive"` isn't supported on
//     SQLite, so there's no way to ask for the right thing through orderBy.
//
// dueDate alone could be sorted in the database. Keeping all three together is
// simpler to follow, and with a single user's tasks the cost is nil. If this
// ever grows to thousands of rows, move dueDate back into `orderBy` and add a
// real integer rank column for status.

export const SORT_KEYS = ["dueDate", "topic", "status"] as const;
export type SortKey = (typeof SORT_KEYS)[number];

export type SortDir = "asc" | "desc";

export const SORT_LABELS: Record<SortKey, string> = {
  dueDate: "Due date",
  topic: "Topic",
  status: "Status",
};

const STATUS_RANK = {
  TODO: 0,
  IN_PROGRESS: 1,
  COMPLETE: 2,
} as const;

type Sortable = {
  dueDate: Date;
  topic: string;
  status: keyof typeof STATUS_RANK;
  createdAt: Date;
};

/** Both come from the URL, so neither can be trusted. Fall back to defaults. */
export function parseSortKey(value: string | undefined): SortKey {
  return SORT_KEYS.includes(value as SortKey) ? (value as SortKey) : "dueDate";
}

export function parseSortDir(value: string | undefined): SortDir {
  return value === "desc" ? "desc" : "asc";
}

export function sortTasks<T extends Sortable>(tasks: T[], key: SortKey, dir: SortDir): T[] {
  const factor = dir === "desc" ? -1 : 1;

  // Copy first — Array.sort mutates, and these are the objects Prisma returned.
  return [...tasks].sort((a, b) => {
    let primary = 0;

    switch (key) {
      case "dueDate":
        primary = a.dueDate.getTime() - b.dueDate.getTime();
        break;
      case "topic":
        // sensitivity: "base" makes "admin" and "Admin" sort together.
        primary = a.topic.localeCompare(b.topic, undefined, { sensitivity: "base" });
        break;
      case "status":
        primary = STATUS_RANK[a.status] - STATUS_RANK[b.status];
        break;
    }

    if (primary !== 0) return primary * factor;

    // Ties always break the same way regardless of direction, so rows don't
    // shuffle unpredictably when several share a topic or status.
    const byDueDate = a.dueDate.getTime() - b.dueDate.getTime();
    if (byDueDate !== 0) return byDueDate;

    return a.createdAt.getTime() - b.createdAt.getTime();
  });
}