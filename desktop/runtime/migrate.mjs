import Database from "better-sqlite3";
import { randomBytes } from "node:crypto";
import { chmodSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";

const BACKUP_PREFIX = "threads-analytics-";
const BACKUP_SUFFIX = ".db";
const DEFAULT_BACKUP_RETENTION = 5;

// Keep only the newest `retention` pre-migration backups. Timestamped
// filenames sort chronologically, so lexical order is age order.
function pruneBackups(backupDirectory, retention) {
  if (retention < 0) return;
  const backups = readdirSync(backupDirectory)
    .filter((name) => name.startsWith(BACKUP_PREFIX) && name.endsWith(BACKUP_SUFFIX))
    .sort();
  for (const name of backups.slice(0, Math.max(0, backups.length - retention))) {
    rmSync(path.join(backupDirectory, name), { force: true });
  }
}

function readMigrations(migrationsDirectory) {
  return readdirSync(migrationsDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => ({
      id: entry.name,
      sql: readFileSync(path.join(migrationsDirectory, entry.name, "migration.sql"), "utf8"),
    }))
    .sort((a, b) => a.id.localeCompare(b.id));
}

export async function migrateDatabase({
  databasePath,
  migrationsDirectory,
  backupDirectory,
  backupRetention = DEFAULT_BACKUP_RETENTION,
}) {
  mkdirSync(path.dirname(databasePath), { recursive: true, mode: 0o700 });
  mkdirSync(backupDirectory, { recursive: true, mode: 0o700 });
  chmodSync(path.dirname(databasePath), 0o700);
  chmodSync(backupDirectory, 0o700);

  const databaseExisted = existsSync(databasePath);
  const database = new Database(databasePath);
  chmodSync(databasePath, 0o600);

  try {
    database.pragma("foreign_keys = ON");
    database.pragma("journal_mode = WAL");
    database.pragma("busy_timeout = 5000");
    database.exec(`
      CREATE TABLE IF NOT EXISTS "_DesktopMigration" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "appliedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const applied = new Set(
      database
        .prepare('SELECT "id" FROM "_DesktopMigration"')
        .all()
        .map((row) => row.id),
    );
    const pending = readMigrations(migrationsDirectory).filter(
      (migration) => !applied.has(migration.id),
    );

    if (pending.length === 0) return { applied: [], backupPath: null };

    let backupPath = null;
    if (databaseExisted) {
      const timestamp = new Date().toISOString().replaceAll(":", "-");
      // The random tail keeps two launches in the same millisecond from
      // writing the same file; the timestamp prefix still sorts by age.
      const unique = randomBytes(4).toString("hex");
      backupPath = path.join(
        backupDirectory,
        `${BACKUP_PREFIX}${timestamp}-${unique}${BACKUP_SUFFIX}`,
      );
      await database.backup(backupPath);
      chmodSync(backupPath, 0o600);
      pruneBackups(backupDirectory, backupRetention);
    }

    // Prisma's SQLite migrations rebuild tables with
    //   PRAGMA foreign_keys=OFF; CREATE TABLE new; INSERT ... SELECT; DROP TABLE old; RENAME
    // but PRAGMA foreign_keys is a no-op inside a transaction, and DROP TABLE
    // with enforcement on runs ON DELETE CASCADE into every child table (a
    // rebuilt Post would silently wipe ThreadReply). So enforcement is turned
    // off outside the transaction — the same way Prisma's own runner applies
    // them — and each migration is verified with foreign_key_check before it
    // is recorded; a violation rolls the migration back.
    database.pragma("foreign_keys = OFF");
    // Two launches can race past the pending check above. Each migration runs
    // in an IMMEDIATE transaction (write lock taken up front, busy_timeout
    // waits for it) and re-checks the ledger inside it, so the loser skips
    // what the winner already applied instead of failing on CREATE TABLE.
    const isApplied = database.prepare('SELECT 1 FROM "_DesktopMigration" WHERE "id" = ?');
    const applyMigration = database.transaction((migration) => {
      if (isApplied.get(migration.id)) return false;
      database.exec(migration.sql);
      const violations = database.pragma("foreign_key_check");
      if (violations.length > 0) {
        const tables = [...new Set(violations.map((row) => row.table))].join(", ");
        throw new Error(
          `Migration ${migration.id} left foreign key violations in ${tables}; rolled back`,
        );
      }
      database.prepare('INSERT INTO "_DesktopMigration" ("id") VALUES (?)').run(migration.id);
      return true;
    });

    const appliedNow = [];
    try {
      for (const migration of pending) {
        if (applyMigration.immediate(migration)) appliedNow.push(migration.id);
      }
    } finally {
      database.pragma("foreign_keys = ON");
    }

    return { applied: appliedNow, backupPath };
  } finally {
    database.close();
  }
}
