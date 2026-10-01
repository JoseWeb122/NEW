import type { PoolConfig } from "pg";

type Env = Record<string, string | undefined>;

export declare const DB_LOCK_KEY: number;
export declare const APP_TABLES: readonly string[];

export declare function resolveDatabaseUrl(
  env?: Env,
  options?: { preferDirect?: boolean }
): string | undefined;

export declare function pgConfigFromUrl(
  url: string,
  env?: Env
): Pick<PoolConfig, "connectionString" | "ssl">;
