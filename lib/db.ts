import "server-only";

import postgres from "postgres";

const databaseGlobal = globalThis as typeof globalThis & { policyboardDb?: postgres.Sql };

export function getDb() {
  if (databaseGlobal.policyboardDb) {
    return databaseGlobal.policyboardDb;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required for server-side database access.");
  }

  const options: postgres.Options<Record<string, never>> & { max_pipeline: number } = {
    connect_timeout: 10,
    idle_timeout: 60,
    max: 3,
    // Transaction poolers do not support pipelined queries on one connection.
    // The driver counts queued queries, excluding the active query: zero disables pipelining.
    max_pipeline: 0,
    prepare: false,
    ssl: "require",
  };
  databaseGlobal.policyboardDb = postgres(connectionString, options);

  return databaseGlobal.policyboardDb;
}

// postgres.js 3.4.9's begin() relies on its pipeline onexecute callback, which
// is skipped with max_pipeline: 0. Reserve one connection for the whole transaction.
export async function withTransaction<T>(callback: (sql: postgres.ReservedSql) => Promise<T>): Promise<T> {
  const sql = await getDb().reserve();
  try {
    await sql`begin`;
    const result = await callback(sql);
    await sql`commit`;
    return result;
  } catch (error) {
    try { await sql`rollback`; } catch { /* Preserve the original failure. */ }
    throw error;
  } finally {
    sql.release();
  }
}
