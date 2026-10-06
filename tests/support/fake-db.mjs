// An in-memory stand-in for lib/db.ts, which tests/support/resolve.mjs swaps
// in so that no test reaches a real database. It covers the slice of Prisma's
// model API the tested modules call: unique and filtered reads, writes that
// match on equality and the lt/lte/gt/gte/not/in operators, `include` for the
// relations listed below, and Prisma's error when update or delete finds no
// row. Every call is async and hands out copies, as a real client would.

const RELATIONS = {
  oAuthToken: { client: ["oAuthClient", "clientId"] },
  oAuthCode: { client: ["oAuthClient", "clientId"] },
};

const tables = new Map();
let nextId = 1;

function table(name) {
  if (!tables.has(name)) tables.set(name, []);
  return tables.get(name);
}

const same = (a, b) =>
  a instanceof Date && b instanceof Date ? a.getTime() === b.getTime() : a === b;

function matchesValue(value, condition) {
  if (condition === null || typeof condition !== "object" || condition instanceof Date) {
    return same(value, condition);
  }
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

const matches = (row, where = {}) =>
  Object.entries(where).every(([field, condition]) => matchesValue(row[field] ?? null, condition));

function withIncludes(name, row, include = {}) {
  const copy = structuredClone(row);
  for (const [relation, enabled] of Object.entries(include)) {
    if (!enabled) continue;
    const [target, foreignKey] = RELATIONS[name]?.[relation] ?? [];
    if (!target) throw new Error(`fake-db: no relation ${name}.${relation}`);
    const related = table(target).find((other) => other.id === row[foreignKey]);
    copy[relation] = related ? structuredClone(related) : null;
  }
  return copy;
}

function notFound(name) {
  return Object.assign(new Error(`fake-db: no ${name} matches`), { code: "P2025" });
}

function model(name) {
  const rows = () => table(name);
  return {
    async findUnique({ where, include }) {
      const row = rows().find((candidate) => matches(candidate, where));
      return row ? withIncludes(name, row, include) : null;
    },
    async findFirst({ where, include } = {}) {
      return this.findUnique({ where, include });
    },
    async findMany({ where, include, orderBy } = {}) {
      const found = rows().filter((row) => matches(row, where));
      if (orderBy) {
        const [[field, direction]] = Object.entries(orderBy);
        found.sort((a, b) => (a[field] < b[field] ? -1 : a[field] > b[field] ? 1 : 0));
        if (direction === "desc") found.reverse();
      }
      return found.map((row) => withIncludes(name, row, include));
    },
    async create({ data }) {
      const row = { id: `${name}_${nextId++}`, createdAt: new Date(), ...structuredClone(data) };
      rows().push(row);
      return structuredClone(row);
    },
    async update({ where, data }) {
      const row = rows().find((candidate) => matches(candidate, where));
      if (!row) throw notFound(name);
      Object.assign(row, structuredClone(data));
      return structuredClone(row);
    },
    async updateMany({ where, data }) {
      const found = rows().filter((row) => matches(row, where));
      for (const row of found) Object.assign(row, structuredClone(data));
      return { count: found.length };
    },
    async delete({ where }) {
      const index = rows().findIndex((candidate) => matches(candidate, where));
      if (index === -1) throw notFound(name);
      return structuredClone(rows().splice(index, 1)[0]);
    },
    async deleteMany({ where } = {}) {
      const kept = rows().filter((row) => !matches(row, where));
      const count = rows().length - kept.length;
      tables.set(name, kept);
      return { count };
    },
    async groupBy({ by: [field], _max = {} }) {
      const groups = new Map();
      for (const row of rows()) {
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
