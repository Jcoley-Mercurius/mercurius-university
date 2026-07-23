import { Pool, type PoolClient } from "pg";
import type { Database, QueryResult, Transaction } from "@mercurius/db";

const globalForPool = globalThis as unknown as { mercuriusPool?: Pool };

function getPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not configured");
  globalForPool.mercuriusPool ??= new Pool({ connectionString, max: 5 });
  return globalForPool.mercuriusPool;
}

class PgTransaction implements Transaction {
  constructor(private readonly client: PoolClient) {}
  async query<Row>(sql: string, parameters: readonly unknown[] = []): Promise<QueryResult<Row>> {
    const result = await this.client.query(sql, [...parameters]);
    return { rows: result.rows as Row[] };
  }
}

export const database: Database = {
  async transaction<T>(work: (tx: Transaction) => Promise<T>) {
    const client = await getPool().connect();
    try {
      await client.query("begin isolation level serializable");
      const result = await work(new PgTransaction(client));
      await client.query("commit");
      return result;
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  },
};

export async function adminQuery<Row>(sql: string, parameters: readonly unknown[] = []) {
  const result = await getPool().query(sql, [...parameters]);
  return result.rows as Row[];
}
