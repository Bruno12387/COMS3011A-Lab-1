# Task Manager — Project Documentation

A single-user task manager built with Next.js and SQLite. Tasks can be created,
edited and archived, viewed as a sortable list, and are never deleted.

---

## Third-Party Code

### Runtime dependencies

| Package | Why it's here |
| --- | --- |
| `next` | The application framework — routing, Server Components and Server Actions, which let the page query the database directly without a separate API layer. |
| `react`, `react-dom` | Required by Next.js; provide the component model and the client-side hooks (`useActionState`, `useTransition`) used for inline editing. |
| `@prisma/client` | Typed database client generated from the schema, so table and column names are checked at compile time rather than discovered at runtime. |
| `@prisma/adapter-better-sqlite3` | Prisma 7 requires an explicit driver adapter for every database; this is the SQLite one. |
| `dotenv` | Prisma 7 no longer loads `.env` automatically, so the CLI and `prisma.config.ts` need it to read `DATABASE_URL`. |

`better-sqlite3` is not listed above because it is not a direct dependency — it
is pulled in transitively by `@prisma/adapter-better-sqlite3`, which wraps it. It
is worth naming anyway, since it is the package that actually reads and writes
the SQLite file, it is the one native (compiled) dependency in the project, and
it is the package referenced in the install instructions below.

### Development dependencies

| Package | Why it's here |
| --- | --- |
| `prisma` | The CLI behind `migrate`, `generate`, `db push` and `studio`. |
| `vitest` | Test runner. Reads the project's TypeScript and path aliases with no build step or extra transformer, unlike Jest which would also need `ts-jest`. |
| `typescript`, `@types/node`, `@types/react`, `@types/react-dom` | Type checking for the project and its dependencies. |
| `eslint`, `eslint-config-next` | Linting with the rule set Next.js ships, installed by `create-next-app`. |

### Packages deliberately not added

No UI component library, CSS framework, date library or validation library was
used. Styling is hand-written CSS in `app/globals.css`, dates rely on the
built-in `Date` and `Intl` formatting, and validation is a handful of explicit
checks in the Server Actions — each small enough that a dependency would have
cost more than it saved.

Tailwind CSS was selected during `create-next-app` before the styling approach
was settled, and was uninstalled once it became clear nothing used it.

---

## Database Design

The database is a single SQLite file at `prisma/dev.db`, described by
`prisma/schema.prisma`.

### Table: `Task`

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `id` | `Int` | Primary key, auto-increment | |
| `title` | `String` | Not null | Capped at 200 characters in application code. |
| `description` | `String?` | Nullable | Optional detail. |
| `dueDate` | `DateTime` | Not null | Stored at 23:59:59.999 local time on the chosen day, so a task due today is not overdue until the day ends. |
| `topic` | `String` | Not null | Free text, capped at 60 characters. |
| `status` | `Status` | Not null, defaults to `TODO` | Enum: `TODO`, `IN_PROGRESS`, `COMPLETE`. |
| `archived` | `Boolean` | Not null, defaults to `false` | |
| `createdAt` | `DateTime` | Not null, defaults to now | Used only as a tie-breaker when sorting. |

Indexes: `(archived, status)`, `(dueDate)`, `(topic)` — one per sort or filter
the interface offers.

### Relationships

There are none. The schema is deliberately a single table.

`topic` is a plain string rather than a foreign key to a `Topic` table. For a
single user typing a handful of topic names, a second table would add a join, a
lookup UI and orphan-cleanup logic in exchange for benefits — canonical naming,
cheap renames — that don't apply at this scale. If the application ever grew
multiple users or needed topic management, promoting `topic` to its own table
with a `Task.topicId` foreign key would be the first change to make.

### Notes on the design

**Enums under SQLite.** SQLite has no native enum type. Prisma supports `enum`
against SQLite as of version 6.2 and enforces the permitted values at the ORM
layer; the underlying column is text. Every write in this application goes
through Prisma, and the status action additionally validates against an
allowlist, so the three values are fixed everywhere a user can reach them.

**`overdue` is not a column.** It is computed at query time by a Prisma client
extension in `lib/prisma.ts`:

```ts
overdue = status !== "COMPLETE" && dueDate < now
```

Storing it would guarantee stale data, because a task becomes overdue through the
passage of time rather than through any write. A stored boolean would be wrong
the moment the clock passed a due date, unless a background job rewrote every
row. Computing it means it is always correct. The trade-off is that it cannot be
used in a `where` clause; queries that need it express the same condition
directly (`status: { not: "COMPLETE" }, dueDate: { lt: new Date() }`).

**Deletion.** No delete operation exists anywhere in the codebase — not in the
UI, not in the Server Actions. Archiving sets `archived = true`; the row and all
of its fields remain in the database and stay visible in the Archived section of
the interface.

---

## Running It

### Requirements

- **Node.js 22 LTS or 24.** Verify with `node -v`.
- **npm 10 or later.** npm 12 blocks dependency install scripts by default; see
  the note in step 2.

> **Important — the application is not at the repository root.**
> It lives in the `my-app/` subfolder. Every command in this section must be run
> from inside `my-app`, not from the folder you cloned into. Running them one
> level up will fail, because `package.json`, `prisma/` and `.env` are all inside
> `my-app`.
>
> ```
> COMS3011A-Lab-1/        <- the cloned repository
> └── my-app/             <- run every command from here
>     ├── package.json
>     ├── prisma/
>     ├── app/
>     └── lib/
> ```

### From a clean clone

**1. Install dependencies**

```bash
git clone <repository-url>
cd COMS3011A-Lab-1/my-app
npm install
```

Confirm you are in the right place before continuing — `ls` (or `dir` on
Windows) should show `package.json` and a `prisma` folder. If it shows only
`my-app` and perhaps a README, you are one level too high; `cd my-app` first.

**2. Allow the native build (npm 12 only)**

`better-sqlite3` ships a native binary that its install script downloads. npm 12
blocks dependency install scripts unless they are allowlisted. If `npm install`
ends with a message about blocked install scripts, run:

```bash
npm install-scripts approve better-sqlite3
npm rebuild better-sqlite3
```

On npm 11 or earlier, skip this step. To confirm the binary is present:

```bash
# Windows
dir node_modules\better-sqlite3\build\Release
# macOS / Linux
ls node_modules/better-sqlite3/build/Release
```

`better_sqlite3.node` should be listed.

**3. Create the environment file**

`.env` is not committed. Create it inside `my-app` — alongside `package.json`,
not at the repository root — with a single line:

```
DATABASE_URL="file:./dev.db"
```

```bash
# Windows PowerShell
Set-Content .env 'DATABASE_URL="file:./dev.db"'
# macOS / Linux
echo 'DATABASE_URL="file:./dev.db"' > .env
```

**4. Create the database and generate the client**

`prisma/dev.db` and the generated client are both gitignored; the committed
migration files rebuild them.

```bash
npx prisma migrate dev
npx prisma generate
```

`migrate dev` applies the existing migrations without prompting for a name.
`npx prisma migrate deploy` is the non-interactive equivalent.

**5. Run the application**

```bash
npm run dev
```

Open <http://localhost:3000>.

### Running the tests

```bash
npm test
```

Again, from inside `my-app`. That is the only command needed. It builds a
throwaway database at
`prisma/test.db` from the current schema, runs 14 tests, and deletes the file
afterwards. `dev.db` is never opened, and the tests can be run on a clean clone
before `npm run dev` has ever been started.

The suite covers task creation and its validation, editing and the field
allowlist, archiving in both directions, the overdue rule (past due, completed,
due today, future), and the sort comparator.

### Other useful commands

| Command | Purpose |
| --- | --- |
| `npx prisma studio` | Browse and edit the database in a browser GUI. |
| `npm run build` | Production build. |
| `npm run lint` | ESLint. |

### Troubleshooting

**`Module '"@prisma/client"' has no exported member 'PrismaClient'`** — the
client hasn't been generated. Run `npx prisma generate`. Note that this project
generates into `lib/generated/prisma`, per Prisma 7's requirement that the output
path be explicit, so application code imports from there rather than from
`@prisma/client`.

**`Could not locate the bindings file`** — `better-sqlite3`'s native binary is
missing. See step 2.

**Do not keep the project inside a OneDrive or other synced folder.** Syncing
`node_modules` can leave native `.node` binaries as cloud placeholders that fail
to load, and syncing a live SQLite file mid-write risks corrupting it.

---

## Declaration of AI Use

**Model used:** Claude Opus 5 (Anthropic), via the Claude desktop application.

I used it in the following roles:

1. **Tutorial and reference.** Explaining the initial Next.js, Prisma and SQLite
   setup, and what each step of the schema, migration and client-generation
   process actually does.

2. **Debugging assistant.** Diagnosing three environment failures: the Prisma 7
   change that moves the generated client out of `node_modules`; a missing
   `better-sqlite3` native binary, which turned out to be npm 12 blocking install
   scripts by default; and an editing problem caused by two copies of the project
   existing in different folders.

3. **Design consultation.** Discussing whether `overdue` should be a stored
   column or computed at read time, and whether `topic` warranted its own table.
   The reasoning recorded in the Database Design section above came out of those
   exchanges.

4. **Code generation.** Producing the static HTML mockup, converting it to JSX,
   and writing the implementations for creating, editing, sorting and archiving
   tasks, along with the accompanying CSS.

5. **Test authoring.** Recommending Vitest and writing the test suite and its
   throwaway-database configuration.

6. **Documentation.** Drafting this document.

All generated code was reviewed, placed into the project and verified to run by
me.
