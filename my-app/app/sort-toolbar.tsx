// app/sort-toolbar.tsx
//
// The sort choice lives in the URL (?sort=topic&dir=desc), not in React state.
// That means it survives a reload, can be bookmarked or shared, and the server
// does the sorting — no duplicate list held on the client.

"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { SORT_KEYS, SORT_LABELS, type SortDir, type SortKey } from "@/lib/sort";

type Props = {
  sort: SortKey;
  dir: SortDir;
};

export default function SortToolbar({ sort, dir }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Current values arrive as props from the server rather than via
  // useSearchParams — that hook forces the page into a Suspense boundary,
  // and there's no need for it when the server already knows the answer.
  function update(next: { sort?: SortKey; dir?: SortDir }) {
    const params = new URLSearchParams({
      sort: next.sort ?? sort,
      dir: next.dir ?? dir,
    });

    startTransition(() => {
      // scroll: false keeps the page where it is instead of jumping to the top.
      router.push(`/?${params.toString()}`, { scroll: false });
    });
  }

  return (
    <div className="toolbar">
      <label htmlFor="sort-by">Sort by</label>
      <select
        id="sort-by"
        value={sort}
        disabled={isPending}
        onChange={(event) => update({ sort: event.target.value as SortKey })}
      >
        {SORT_KEYS.map((key) => (
          <option key={key} value={key}>
            {SORT_LABELS[key]}
          </option>
        ))}
      </select>

      <select
        id="sort-dir"
        aria-label="Sort direction"
        value={dir}
        disabled={isPending}
        onChange={(event) => update({ dir: event.target.value as SortDir })}
      >
        <option value="asc">Ascending</option>
        <option value="desc">Descending</option>
      </select>

      <span className="spacer" />

      {/* Not wired up yet. */}
      <label className="toggle">
        <input type="checkbox" id="overdue-only" disabled />
        Overdue only
      </label>
    </div>
  );
}
