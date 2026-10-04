export function csvExportFilename(date = new Date()): string {
  return `threads-posts-${date.toISOString().slice(0, 10)}.csv`;
}
