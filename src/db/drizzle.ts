import { isProd } from "@/lib/constants";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const connectionString = isProd ? process.env.DATABASE_URL! : process.env.STAGING_DATABASE_URL!;

// Disable prefetch as it is not supported for "Transaction" pool mode
export const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client);
