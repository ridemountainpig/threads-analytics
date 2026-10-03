import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const postgresSchemaPath = path.join(repositoryRoot, "prisma", "schema.prisma");
const sqliteSchemaPath = path.join(repositoryRoot, "desktop", "runtime", "prisma", "schema.prisma");

function readSchema(schemaPath) {
  return readFileSync(schemaPath, "utf8").replaceAll("\r\n", "\n");
}

function normalizedModelSurface(schema) {
  const firstModel = schema.indexOf("model ");
  assert.notEqual(firstModel, -1, "schema must declare at least one model");

  return schema
    .slice(firstModel)
    .replace(/\s+@db\.[A-Za-z0-9_]+(?:\([^)]*\))?/g, "")
    .split("\n")
    .map((line) => line.trim().replaceAll(/\s+/g, " "))
    .filter(Boolean)
    .join("\n");
}

test("PostgreSQL and SQLite schemas expose the same application models", () => {
  const postgresSchema = readSchema(postgresSchemaPath);
  const sqliteSchema = readSchema(sqliteSchemaPath);

  assert.match(postgresSchema, /provider\s*=\s*"postgresql"/);
  assert.match(sqliteSchema, /provider\s*=\s*"sqlite"/);
  assert.equal(normalizedModelSurface(sqliteSchema), normalizedModelSurface(postgresSchema));
});
