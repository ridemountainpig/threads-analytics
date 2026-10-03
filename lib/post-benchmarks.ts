import "server-only";

export * from "@/lib/database/post-benchmarks-shared";
// Resolved per build target: Postgres aggregates on the web, an in-process
// SQLite-backed implementation on desktop.
export { getPostBenchmarks } from "@/lib/database/post-benchmarks-target";
