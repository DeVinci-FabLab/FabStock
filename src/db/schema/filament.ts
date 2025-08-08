import { doublePrecision, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { id, timestamps } from "./columns.helpers";
import { usersTable } from "./user";
import { boxesTable } from "./boxes";

export const filamentTable = pgTable("filament", {
    ...id,
    shortId: text().unique()
        .$defaultFn(() => crypto.randomUUID().slice(0, 8)),

    userId: text().notNull()
        .references(() => usersTable.id, { onDelete: "cascade" }),

    index: integer().notNull()
        .default(-1),

    name: text().notNull(),
    brand: text().notNull(),
    color: text().notNull(),
    material: text().notNull(),
    note: text().notNull(),

    currentMass: integer().notNull(),
    startingMass: integer().notNull(),

    box: text().references(() => boxesTable.id, { onDelete: "set null" }),

    lastUsed: timestamp().default(new Date(0))
        .notNull(),

    printingTemperature: integer(),
    diameter: doublePrecision(),
    cost: doublePrecision(),

    ...timestamps,
});

export const filamentLogTable = pgTable("filamentLog", {
    ...id,

    filamentId: text().notNull()
        .references(() => filamentTable.id, { onDelete: "cascade" }),

    filamentUsed: integer().notNull(),

    note: text(),

    previousMass: integer(),
    newMass: integer(),

    time: timestamp().defaultNow()
        .notNull(),
});
