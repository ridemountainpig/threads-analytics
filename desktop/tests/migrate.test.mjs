import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import { migrateDatabase } from "../runtime/migrate.mjs";

const desktopDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// Writes an isolated migrations directory the test fully controls, so we can
// add migrations one at a time and exercise the on-existing-database paths.
function writeMigration(migrationsDirectory, id, sql) {
  const migrationDirectory = path.join(migrationsDirectory, id);
  mkdirSync(migrationDirectory, { recursive: true });
  writeFileSync(path.join(migrationDirectory, "migration.sql"), sql);
}

function listBackups(backupDirectory) {
  if (!existsSync(backupDirectory)) return [];
  return readdirSync(backupDirectory).filter(
    (name) => name.startsWith("threads-analytics-") && name.endsWith(".db"),
  );
}

test("desktop migrations create the SQLite schema and are idempotent", async () => {
  const temporaryDirectory = mkdtempSync(path.join(os.tmpdir(), "threads-analytics-desktop-"));

  try {
    const databasePath = path.join(temporaryDirectory, "threads-analytics.db");
    const options = {
      databasePath,
      migrationsDirectory: path.join(desktopDirectory, "runtime", "prisma", "migrations"),
      backupDirectory: path.join(temporaryDirectory, "backups"),
    };

    const first = await migrateDatabase(options);
    assert.deepEqual(first.applied, [
      "202608040001_init",
      "202609110001_token_renewal_followers_mcp_oauth",
      "202609250001_thread_replies",
      "202610040001_post_metric_snapshots",
    ]);

    const second = await migrateDatabase(options);
    assert.deepEqual(second.applied, []);

    const database = new Database(databasePath, { readonly: true });
    const tables = database
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
      .all()
      .map((row) => row.name);
    database.close();

    assert.ok(tables.includes("ThreadsAccount"));
    assert.ok(tables.includes("Post"));
    assert.ok(tables.includes("SyncState"));
    assert.ok(tables.includes("ThreadReply"));
    assert.ok(tables.includes("PostMetricSnapshot"));
    assert.ok(tables.includes("AppSettings"));
    assert.ok(tables.includes("FollowerSnapshot"));
    assert.ok(tables.includes("OAuthClient"));
    assert.ok(tables.includes("OAuthCode"));
    assert.ok(tables.includes("OAuthToken"));
    assert.ok(tables.includes("_DesktopMigration"));
  } finally {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
});

test("backs up an existing database before applying new migrations", async () => {
  const temporaryDirectory = mkdtempSync(path.join(os.tmpdir(), "threads-analytics-desktop-"));

  try {
    const migrationsDirectory = path.join(temporaryDirectory, "migrations");
    const backupDirectory = path.join(temporaryDirectory, "backups");
    const options = {
      databasePath: path.join(temporaryDirectory, "threads-analytics.db"),
      migrationsDirectory,
      backupDirectory,
    };

    writeMigration(
      migrationsDirectory,
      "0001_init",
      'CREATE TABLE "Widget" ("id" TEXT PRIMARY KEY);',
    );
    const first = await migrateDatabase(options);
    assert.deepEqual(first.applied, ["0001_init"]);
    // Nothing to protect on the run that creates the database.
    assert.equal(first.backupPath, null);
    assert.equal(listBackups(backupDirectory).length, 0);

    writeMigration(migrationsDirectory, "0002_add", 'ALTER TABLE "Widget" ADD COLUMN "name" TEXT;');
    const second = await migrateDatabase(options);
    assert.deepEqual(second.applied, ["0002_add"]);
    assert.ok(second.backupPath, "expected a backup path for an existing database");
    assert.ok(existsSync(second.backupPath), "expected the backup file to exist on disk");
    assert.equal(listBackups(backupDirectory).length, 1);
  } finally {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
});

test("prunes old backups beyond the retention limit", async () => {
  const temporaryDirectory = mkdtempSync(path.join(os.tmpdir(), "threads-analytics-desktop-"));

  try {
    const migrationsDirectory = path.join(temporaryDirectory, "migrations");
    const backupDirectory = path.join(temporaryDirectory, "backups");
    const options = {
      databasePath: path.join(temporaryDirectory, "threads-analytics.db"),
      migrationsDirectory,
      backupDirectory,
      backupRetention: 3,
    };

    writeMigration(
      migrationsDirectory,
      "0001_init",
      'CREATE TABLE "Widget" ("id" TEXT PRIMARY KEY);',
    );
    await migrateDatabase(options);

    // Seed older backups; timestamped names sort chronologically, so these all
    // predate the one the next migration produces.
    const seeded = [];
    for (let index = 1; index <= 8; index += 1) {
      const name = `threads-analytics-2020-01-0${index}.db`;
      writeFileSync(path.join(backupDirectory, name), "old");
      seeded.push(name);
    }

    writeMigration(migrationsDirectory, "0002_add", 'ALTER TABLE "Widget" ADD COLUMN "name" TEXT;');
    const result = await migrateDatabase(options);

    const remaining = listBackups(backupDirectory).sort();
    assert.equal(remaining.length, 3, "retention should cap the backup count");
    // The fresh backup is the newest and must survive the prune.
    assert.ok(remaining.includes(path.basename(result.backupPath)));
    // Only the two most recent seeded backups are kept alongside it.
    assert.deepEqual(
      remaining.filter((name) => seeded.includes(name)),
      ["threads-analytics-2020-01-07.db", "threads-analytics-2020-01-08.db"],
    );
  } finally {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
});

// Prisma's SQLite "redefine table" pattern: PRAGMA foreign_keys=OFF is a
// no-op inside a transaction, so if the runner ever enforced foreign keys
// while applying, DROP TABLE would cascade-delete every child row.
const rebuildParentSql = `
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Parent" ("id" TEXT NOT NULL PRIMARY KEY, "name" TEXT NOT NULL DEFAULT '');
INSERT INTO "new_Parent" ("id") SELECT "id" FROM "Parent";
DROP TABLE "Parent";
ALTER TABLE "new_Parent" RENAME TO "Parent";
PRAGMA foreign_keys=ON;
`;

test("rebuilding a parent table keeps its cascading child rows", async () => {
  const temporaryDirectory = mkdtempSync(path.join(os.tmpdir(), "threads-analytics-desktop-"));

  try {
    const migrationsDirectory = path.join(temporaryDirectory, "migrations");
    const databasePath = path.join(temporaryDirectory, "threads-analytics.db");
    const options = {
      databasePath,
      migrationsDirectory,
      backupDirectory: path.join(temporaryDirectory, "backups"),
    };

    writeMigration(
      migrationsDirectory,
      "0001_init",
      `CREATE TABLE "Parent" ("id" TEXT NOT NULL PRIMARY KEY);
       CREATE TABLE "Child" (
         "id" TEXT NOT NULL PRIMARY KEY,
         "parentId" TEXT NOT NULL,
         CONSTRAINT "Child_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Parent" ("id") ON DELETE CASCADE ON UPDATE CASCADE
       );`,
    );
    await migrateDatabase(options);

    const seed = new Database(databasePath);
    seed.exec(`INSERT INTO "Parent" ("id") VALUES ('p1');
               INSERT INTO "Child" ("id", "parentId") VALUES ('c1', 'p1'), ('c2', 'p1');`);
    seed.close();

    writeMigration(migrationsDirectory, "0002_rebuild_parent", rebuildParentSql);
    const result = await migrateDatabase(options);
    assert.deepEqual(result.applied, ["0002_rebuild_parent"]);

    const database = new Database(databasePath, { readonly: true });
    const childCount = database.prepare('SELECT count(*) AS n FROM "Child"').get().n;
    const columns = database.pragma('table_info("Parent")').map((column) => column.name);
    // Foreign keys are enforced again for regular connections afterwards.
    const enforced = database.pragma("foreign_keys", { simple: true });
    database.close();

    assert.equal(childCount, 2, "child rows must survive the parent rebuild");
    assert.deepEqual(columns, ["id", "name"]);
    assert.equal(enforced, 1);
  } finally {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
});

test("a migration that leaves foreign key violations is rolled back and not recorded", async () => {
  const temporaryDirectory = mkdtempSync(path.join(os.tmpdir(), "threads-analytics-desktop-"));

  try {
    const migrationsDirectory = path.join(temporaryDirectory, "migrations");
    const databasePath = path.join(temporaryDirectory, "threads-analytics.db");
    const options = {
      databasePath,
      migrationsDirectory,
      backupDirectory: path.join(temporaryDirectory, "backups"),
    };

    writeMigration(
      migrationsDirectory,
      "0001_init",
      `CREATE TABLE "Parent" ("id" TEXT NOT NULL PRIMARY KEY);
       CREATE TABLE "Child" (
         "id" TEXT NOT NULL PRIMARY KEY,
         "parentId" TEXT NOT NULL,
         CONSTRAINT "Child_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Parent" ("id") ON DELETE CASCADE
       );`,
    );
    await migrateDatabase(options);

    // Only possible while enforcement is off during migration; the check
    // must catch it instead of committing a dangling row.
    writeMigration(
      migrationsDirectory,
      "0002_orphan",
      `INSERT INTO "Child" ("id", "parentId") VALUES ('c1', 'missing');`,
    );
    await assert.rejects(migrateDatabase(options), /0002_orphan.*foreign key violations.*Child/);

    const database = new Database(databasePath, { readonly: true });
    const childCount = database.prepare('SELECT count(*) AS n FROM "Child"').get().n;
    const recorded = database
      .prepare('SELECT "id" FROM "_DesktopMigration" ORDER BY "id"')
      .all()
      .map((row) => row.id);
    database.close();

    assert.equal(childCount, 0);
    assert.deepEqual(recorded, ["0001_init"]);
  } finally {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
});

test("concurrent launches apply each pending migration exactly once", async () => {
  const temporaryDirectory = mkdtempSync(path.join(os.tmpdir(), "threads-analytics-desktop-"));

  try {
    const migrationsDirectory = path.join(temporaryDirectory, "migrations");
    const options = {
      databasePath: path.join(temporaryDirectory, "threads-analytics.db"),
      migrationsDirectory,
      backupDirectory: path.join(temporaryDirectory, "backups"),
    };
    writeMigration(migrationsDirectory, "001_first", 'CREATE TABLE "A" ("id" TEXT PRIMARY KEY);');
    await migrateDatabase(options);

    // With an existing database both calls read the same pending list, then
    // yield on the pre-migration backup before applying it.
    writeMigration(migrationsDirectory, "002_second", 'CREATE TABLE "B" ("id" TEXT PRIMARY KEY);');
    const results = await Promise.all([migrateDatabase(options), migrateDatabase(options)]);

    assert.deepEqual(results.map((result) => result.applied).flat(), ["002_second"]);
  } finally {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
});
