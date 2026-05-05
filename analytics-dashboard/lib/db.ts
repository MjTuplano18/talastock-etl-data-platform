import { Pool } from 'pg'
import { unstable_cache } from 'next/cache'

// ─── Connection pool ──────────────────────────────────────────
// Singleton — reused across all requests in the same process.
// In dev, Next.js hot-reloads modules so we attach to globalThis
// to avoid creating a new pool on every file change.
declare global {
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined
}

function getPool(): Pool {
  if (!global.__pgPool) {
    global.__pgPool = new Pool({
      host:     process.env.WAREHOUSE_HOST     || 'localhost',
      port:     parseInt(process.env.WAREHOUSE_PORT || '5433'),
      database: process.env.WAREHOUSE_DB       || 'talastock_warehouse',
      user:     process.env.WAREHOUSE_USER     || 'warehouse_user',
      password: process.env.WAREHOUSE_PASSWORD || 'warehouse_pass',
      max:                  5,
      idleTimeoutMillis:    30_000,
      connectionTimeoutMillis: 5_000,
    })
  }
  return global.__pgPool
}

// ─── Raw query (no cache) ─────────────────────────────────────
export async function query<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[]
): Promise<T[]> {
  const pool   = getPool()
  const client = await pool.connect()
  try {
    const result = await client.query(sql, params)
    return result.rows as T[]
  } finally {
    client.release()
  }
}

// ─── Cached query ─────────────────────────────────────────────
// Uses Next.js data cache — results are reused across requests
// until the TTL expires or the cache is invalidated.
//
// Usage:
//   const rows = await cachedQuery<MyType>('my-key', sql, [], 300)
//
// The cache key should be unique per query + params combination.
export function cachedQuery<T = Record<string, unknown>>(
  cacheKey: string,
  sql: string,
  params: unknown[] = [],
  ttlSeconds = 300   // default: 5 minutes
): Promise<T[]> {
  return unstable_cache(
    () => query<T>(sql, params),
    [cacheKey],
    { revalidate: ttlSeconds, tags: ['warehouse'] }
  )()
}

export default getPool
