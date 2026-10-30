import { createDb, type Database } from "@starboard/db"
import { env } from "@/env"

export const db: Database = createDb(env.POSTGRES_URL)
