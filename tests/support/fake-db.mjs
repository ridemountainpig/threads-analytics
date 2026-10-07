// An in-memory stand-in for lib/db.ts, which tests/support/resolve.mjs swaps
// in so that no test reaches a real database. It covers the slice of Prisma's
// API the tested modules call: reads and writes that match on equality, the
// lt/lte/gt/gte/not/in operators, OR/AND, compound unique keys and the
// relations listed below; `include` for those relations; upserts, createMany,
// groupBy with _max, array transactions; the schema's column defaults; and
// Prisma's error when update or delete finds no row. Every call is async and
// hands out copies, as a real client would.

/** model → relation → [related model, foreign key on this model]. */
const RELATIONS = {
  oAuthToken: { client: ["oAuthClient", "clientId"] },
  oAuthCode: { client: ["oAuthClient", "clientId"] },
  postMetricSnapshot: { post: ["post", "postId"] },
};

const METRICS = { views: 0, likes: 0, replies: 0, reposts: 0, quotes: 0, shares: 0 };

/** Column defaults from prisma/schema.prisma, applied on create. */
const DEFAULTS = {
  post: () => ({ ...METRICS, syncedAt: new Date() }),
  threadReply: () => ({ ...METRICS, syncedAt: new Date() }),
  followerSnapshot: () => ({ demographics: null, capturedAt: new Date() }),
  syncState: () => ({ repliesSyncedAt: null }),
};

const OPERATORS = new Set(["equals", "not", "in", "lt", "lte", "gt", "gte"]);

const tables = new Map();
let nextId = 1;

function table(name) {
  if (!tables.has(name)) tables.set(name, []);
  return tables.get(name);
}

const same = (a, b) =>
  a instanceof Date && b instanceof Date ? a.getTime() === b.getTime() : a === b;

const isPlainObject = (value) =>
  value !== null && typeof value === "object" && !(value instanceof Date) && !Array.isArray(value);

function matchesValue(value, condition) {
  if (!isPlainObject(condition)) return same(value, condition);
  return Object.entries(condition).every(([operator, operand]) => {
    switch (operator) {
      case "equals":
        return same(value, operand);
      case "not":
        return !matchesValue(value, operand);
      case "in":
        return operand.some((item) => same(value, item));
      case "lt":
        return value !== null && value < operand;
      case "lte":
        return value !== null && value <= operand;
      case "gt":
        return value !== null && value > operand;
      case "gte":
        return value !== null && value >= operand;
      default:
        throw new Error(`fake-db: unsupported operator "${operator}"`);
    }
  });
}

function related(name, row, relation) {
  const [target, foreignKey] = RELATIONS[name]?.[relation] ?? [];
  if (!target) return undefined;
  return table(target).find((other) => other.id === row[foreignKey]) ?? null;
}

function matches(name, row, where = {}) {
  return Object.entries(where).every(([field, condition]) => {
    if (field === "OR") return condition.some((branch) => matches(name, row, branch));
    if (field === "AND") return condition.every((branch) => matches(name, row, branch));
    const relatedRow = related(name, row, field);
    if (relatedRow !== undefined) {
      return relatedRow !== null && matches(RELATIONS[name][field][0], relatedRow, condition);
    }
    // A compound unique key, e.g. accountId_date: { accountId, date }.
    if (isPlainObject(condition) && !Object.keys(condition).some((key) => OPERATORS.has(key))) {
      return matches(name, row, condition);
    }
    return matchesValue(row[field] ?? null, condition);
  });
}

function withIncludes(name, row, include = {}) {
  const copy = structuredClone(row);
  for (const [relation, enabled] of Object.entries(include)) {
    if (!enabled) continue;
    const relatedRow = related(name, row, relation);
    if (relatedRow === undefined) throw new Error(`fake-db: no relation ${name}.${relation}`);
    copy[relation] = relatedRow && structuredClone(relatedRow);
  }
  return copy;
}

function notFound(name) {
  return Object.assign(new Error(`fake-db: no ${name} matches`), { code: "P2025" });
}

function model(name) {
  const rows = () => table(name);
  const find = (where) => rows().find((candidate) => matches(name, candidate, where));
  const insert = (data) => {
    const row = {
      id: `${name}_${nextId++}`,
      createdAt: new Date(),
      ...DEFAULTS[name]?.(),
      ...structuredClone(data),
    };
    rows().push(row);
    return row;
  };

  return {
    async findUnique({ where, include }) {
      const row = find(where);
      return row ? withIncludes(name, row, include) : null;
    },
    async findFirst({ where, include } = {}) {
      return this.findUnique({ where, include });
    },
    async findMany({ where, include, orderBy } = {}) {
      const found = rows().filter((row) => matches(name, row, where));
      for (const order of [orderBy ?? []].flat().reverse()) {
        const [[field, direction]] = Object.entries(order);
        const sign = direction === "desc" ? -1 : 1;
        found.sort((a, b) => sign * (a[field] < b[field] ? -1 : a[field] > b[field] ? 1 : 0));
      }
      return found.map((row) => withIncludes(name, row, include));
    },
    async create({ data }) {
      return structuredClone(insert(data));
    },
    async createMany({ data }) {
      for (const item of data) insert(item);
      return { count: data.length };
    },
    async update({ where, data }) {
      const row = find(where);
      if (!row) throw notFound(name);
      Object.assign(row, structuredClone(data));
      return structuredClone(row);
    },
    async updateMany({ where, data }) {
      const found = rows().filter((row) => matches(name, row, where));
      for (const row of found) Object.assign(row, structuredClone(data));
      return { count: found.length };
    },
    async upsert({ where, create, update }) {
      const row = find(where);
      if (!row) return structuredClone(insert(create));
      Object.assign(row, structuredClone(update));
      return structuredClone(row);
    },
    async delete({ where }) {
      const index = rows().findIndex((candidate) => matches(name, candidate, where));
      if (index === -1) throw notFound(name);
      return structuredClone(rows().splice(index, 1)[0]);
    },
    async deleteMany({ where } = {}) {
      const kept = rows().filter((row) => !matches(name, row, where));
      const count = rows().length - kept.length;
      tables.set(name, kept);
      return { count };
    },
    async groupBy({ by: [field], where, _max = {} }) {
      const groups = new Map();
      for (const row of rows().filter((candidate) => matches(name, candidate, where))) {
        const group = groups.get(row[field]) ?? { [field]: row[field], _max: {} };
        for (const key of Object.keys(_max)) {
          const value = row[key] ?? null;
          const current = group._max[key] ?? null;
          group._max[key] =
            current === null || (value !== null && value > current) ? value : current;
        }
        groups.set(row[field], group);
      }
      return [...groups.values()];
    },
  };
}

const models = new Map();

export const db = new Proxy(
  {},
  {
    get(_, name) {
      if (typeof name !== "string") return undefined;
      // Array transactions only: the queries have already started.
      if (name === "$transaction") return (queries) => Promise.all(queries);
      if (!models.has(name)) models.set(name, model(name));
      return models.get(name);
    },
  },
);

/** The rows a model holds, for assertions. Mutating them changes the store. */
export function rowsOf(name) {
  return table(name);
}

/** Empties every table; call it before each test. */
export function resetDb() {
  tables.clear();
}
