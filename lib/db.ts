import "server-only";

import postgres from "postgres";

let client: postgres.Sql | undefined;

export function getDb() {
  if (client) {
    return client;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required for server-side database access.");
  }

  client = postgres(connectionString, {
    connect_timeout: 10,
    idle_timeout: 20,
    max: 1,
    prepare: false,
    ssl: "require",
  });

  return client;
}
