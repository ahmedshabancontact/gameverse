import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// The pool and Drizzle client are created lazily on first use rather than at
// module load. Next.js imports route modules during `next build` to collect
// page configuration, and throwing at import time would fail the build when
// DATABASE_URL is only available at runtime.

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
  __arenaNextJsPostgresqlDb?: NodePgDatabase;
};

export function getPool(): Pool {
  if (globalForDb.__arenaNextJsPostgresqlPool) {
    return globalForDb.__arenaNextJsPostgresqlPool;
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  const pool = new Pool({ connectionString: databaseUrl });
  globalForDb.__arenaNextJsPostgresqlPool = pool;
  return pool;
}

export function getDb(): NodePgDatabase {
  if (!globalForDb.__arenaNextJsPostgresqlDb) {
    globalForDb.__arenaNextJsPostgresqlDb = drizzle(getPool());
  }
  return globalForDb.__arenaNextJsPostgresqlDb;
}

function lazy<T extends object>(resolve: () => T): T {
  return new Proxy({} as T, {
    get(_target, prop) {
      const instance = resolve();
      const value = Reflect.get(instance, prop, instance);
      return typeof value === "function" ? value.bind(instance) : value;
    },
    has(_target, prop) {
      return Reflect.has(resolve(), prop);
    },
  });
}

export const pool: Pool = lazy(getPool);
export const db: NodePgDatabase = lazy(getDb);
