// app/page.tsx
//
// Static markup only — no data layer wired up yet.
// This is a Server Component (no "use client"). It stays that way until you add
// event handlers or state, at which point the interactive parts should move into
// their own client components rather than making this whole page a client one.
//
// Styles live in app/globals.css.

export default function TasksPage() {
  return (
    <div className="page">
      {/* Remove this banner once the page is wired up. */}
      <p className="mockup-note">
        Static mockup — no data layer wired up. Sample tasks are hardcoded, sort
        controls and buttons do nothing yet.
      </p>

      <header className="page-head">
        <h1>Tasks</h1>
        <span className="count">4 active · 1 overdue</span>
      </header>

      {/* ============ CREATE ============ */}

      <section className="panel" aria-labelledby="create-heading">
        <h2 id="create-heading">New task</h2>

        <form>
          <div className="create-grid">
            <div className="field wide">
              <label htmlFor="new-title">Title</label>
              <input type="text" id="new-title" name="title" placeholder="What needs doing?" />
            </div>

            <div className="field wide">
              <label htmlFor="new-desc">Description</label>
              <textarea id="new-desc" name="description" placeholder="Optional detail…" />
            </div>

            <div className="field">
              <label htmlFor="new-due">Due date</label>
              <input type="date" id="new-due" name="dueDate" />
            </div>

            <div className="field">
              <label htmlFor="new-topic">Topic</label>
              <input type="text" id="new-topic" name="topic" placeholder="e.g. Coursework" />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              Add task
            </button>
            <span className="hint">
              New tasks start as <strong>Todo</strong>.
            </span>
          </div>
        </form>
      </section>

      {/* ============ SORT TOOLBAR ============ */}

      <div className="toolbar">
        <label htmlFor="sort-by">Sort by</label>
        <select id="sort-by" defaultValue="dueDate">
          <option value="dueDate">Due date</option>
          <option value="topic">Topic</option>
          <option value="status">Status</option>
        </select>

        <select id="sort-dir" aria-label="Sort direction" defaultValue="asc">
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>

        <span className="spacer" />

        <label className="toggle">
          <input type="checkbox" id="overdue-only" />
          Overdue only
        </label>
      </div>

      {/* ============ ACTIVE TASKS ============ */}

      <div className="task-list">
        {/* overdue task */}
        <article className="task is-overdue">
          <div className="task-main">
            <h3 className="task-title" contentEditable suppressContentEditableWarning>
              Submit COMS3005 assignment
            </h3>
            <p className="task-desc" contentEditable suppressContentEditableWarning>
              Final write-up plus the appendix with the benchmark tables.
            </p>
            <div className="task-meta">
              <span className="badge-overdue">Overdue</span>
              <span className="chip chip-due">
                Due{" "}
                <span contentEditable suppressContentEditableWarning>
                  28 Jul 2026
                </span>
              </span>
              <span className="chip chip-topic" contentEditable suppressContentEditableWarning>
                Coursework
              </span>
            </div>
          </div>
          <div className="task-side">
            <select
              className="status-select status-progress"
              aria-label="Status"
              defaultValue="IN_PROGRESS"
            >
              <option value="TODO">Todo</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETE">Complete</option>
            </select>
            <button type="button" className="btn-archive">
              Archive
            </button>
          </div>
        </article>

        {/* normal task, due soon */}
        <article className="task">
          <div className="task-main">
            <h3 className="task-title" contentEditable suppressContentEditableWarning>
              Book library study room
            </h3>
            <p className="task-desc" contentEditable suppressContentEditableWarning>
              Wednesday afternoon, group of four.
            </p>
            <div className="task-meta">
              <span className="chip chip-due">
                Due{" "}
                <span contentEditable suppressContentEditableWarning>
                  3 Aug 2026
                </span>
              </span>
              <span className="chip chip-topic" contentEditable suppressContentEditableWarning>
                Admin
              </span>
            </div>
          </div>
          <div className="task-side">
            <select className="status-select status-todo" aria-label="Status" defaultValue="TODO">
              <option value="TODO">Todo</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETE">Complete</option>
            </select>
            <button type="button" className="btn-archive">
              Archive
            </button>
          </div>
        </article>

        {/* task with no description */}
        <article className="task">
          <div className="task-main">
            <h3 className="task-title" contentEditable suppressContentEditableWarning>
              Renew gym membership
            </h3>
            <div className="task-meta">
              <span className="chip chip-due">
                Due{" "}
                <span contentEditable suppressContentEditableWarning>
                  12 Aug 2026
                </span>
              </span>
              <span className="chip chip-topic" contentEditable suppressContentEditableWarning>
                Personal
              </span>
            </div>
          </div>
          <div className="task-side">
            <select className="status-select status-todo" aria-label="Status" defaultValue="TODO">
              <option value="TODO">Todo</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETE">Complete</option>
            </select>
            <button type="button" className="btn-archive">
              Archive
            </button>
          </div>
        </article>

        {/* completed task, past due date but NOT overdue */}
        <article className="task">
          <div className="task-main">
            <h3 className="task-title" contentEditable suppressContentEditableWarning>
              Prep tutorial questions
            </h3>
            <p className="task-desc" contentEditable suppressContentEditableWarning>
              Weeks 4 and 5, graph algorithms.
            </p>
            <div className="task-meta">
              <span className="chip chip-due">
                Due{" "}
                <span contentEditable suppressContentEditableWarning>
                  25 Jul 2026
                </span>
              </span>
              <span className="chip chip-topic" contentEditable suppressContentEditableWarning>
                Coursework
              </span>
            </div>
          </div>
          <div className="task-side">
            <select
              className="status-select status-complete"
              aria-label="Status"
              defaultValue="COMPLETE"
            >
              <option value="TODO">Todo</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETE">Complete</option>
            </select>
            <button type="button" className="btn-archive">
              Archive
            </button>
          </div>
        </article>
      </div>

      {/* ============ ARCHIVED ============ */}

      <details className="archived">
        <summary>Archived · 2</summary>

        <div className="task-list">
          <article className="task is-archived">
            <div className="task-main">
              <h3 className="task-title" contentEditable suppressContentEditableWarning>
                Register for semester 2
              </h3>
              <div className="task-meta">
                <span className="chip chip-due">
                  Due{" "}
                  <span contentEditable suppressContentEditableWarning>
                    10 Jul 2026
                  </span>
                </span>
                <span className="chip chip-topic" contentEditable suppressContentEditableWarning>
                  Admin
                </span>
              </div>
            </div>
            <div className="task-side">
              <select
                className="status-select status-complete"
                aria-label="Status"
                defaultValue="COMPLETE"
              >
                <option value="TODO">Todo</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETE">Complete</option>
              </select>
              <button type="button" className="btn-archive">
                Unarchive
              </button>
            </div>
          </article>

          <article className="task is-archived">
            <div className="task-main">
              <h3 className="task-title" contentEditable suppressContentEditableWarning>
                Return borrowed textbook
              </h3>
              <div className="task-meta">
                <span className="chip chip-due">
                  Due{" "}
                  <span contentEditable suppressContentEditableWarning>
                    2 Jul 2026
                  </span>
                </span>
                <span className="chip chip-topic" contentEditable suppressContentEditableWarning>
                  Personal
                </span>
              </div>
            </div>
            <div className="task-side">
              <select className="status-select status-todo" aria-label="Status" defaultValue="TODO">
                <option value="TODO">Todo</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETE">Complete</option>
              </select>
              <button type="button" className="btn-archive">
                Unarchive
              </button>
            </div>
          </article>
        </div>
      </details>

      {/* Empty state, shown when there are no active tasks. Hidden in this mockup. */}
      <div className="empty" hidden>
        No tasks yet. Add one above to get started.
      </div>
    </div>
  );
}