import { mysqlEnum, mysqlTable, text, timestamp, varchar, int, boolean, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Audit runs table - stores each LMS audit execution
 */
export const auditRuns = mysqlTable("audit_runs", {
  id: varchar("id", { length: 64 }).primaryKey(),
  url: varchar("url", { length: 2048 }).notNull(),
  userId: varchar("userId", { length: 64 }),
  
  // Scores
  lms: int("lms"),
  rri: int("rri"),
  pmi: int("pmi"),
  
  // Status
  status: mysqlEnum("status", ["pending", "running", "completed", "failed"]).default("pending").notNull(),
  error: text("error"),
  
  // Results (stored as JSON)
  categories: json("categories"),
  gates: json("gates"),
  topFixes: json("topFixes"),
  
  // Raw data (stored as JSON)
  pageSpeedData: json("pageSpeedData"),
  cruxData: json("cruxData"),
  playwrightData: json("playwrightData"),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow(),
  completedAt: timestamp("completedAt"),
  
  // Analytics fields
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  referrer: text("referrer"),
  utmSource: varchar("utmSource", { length: 100 }),
  utmMedium: varchar("utmMedium", { length: 100 }),
  utmCampaign: varchar("utmCampaign", { length: 100 }),
});

export type AuditRun = typeof auditRuns.$inferSelect;
export type InsertAuditRun = typeof auditRuns.$inferInsert;

/**
 * Reports table - stores purchased reports
 */
export const reports = mysqlTable("reports", {
  id: varchar("id", { length: 64 }).primaryKey(),
  auditRunId: varchar("auditRunId", { length: 64 }).notNull(),
  userId: varchar("userId", { length: 64 }),
  
  // Payment
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  amountPaid: int("amountPaid"), // in cents
  currency: varchar("currency", { length: 3 }).default("usd"),
  
  // Files
  pdfUrl: varchar("pdfUrl", { length: 2048 }),
  jsonUrl: varchar("jsonUrl", { length: 2048 }),
  badgeCode: text("badgeCode"),
  
  // Status
  isPaid: boolean("isPaid").default(false),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow(),
  paidAt: timestamp("paidAt"),
});

export type Report = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;

/**
 * API keys table - for paid API access
 */
export const apiKeys = mysqlTable("api_keys", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: varchar("userId", { length: 64 }).notNull(),
  key: varchar("key", { length: 64 }).notNull(),
  name: varchar("name", { length: 255 }),
  
  // Rate limiting
  requestsPerDay: int("requestsPerDay").default(100),
  requestsUsedToday: int("requestsUsedToday").default(0),
  lastResetAt: timestamp("lastResetAt").defaultNow(),
  
  // Status
  isActive: boolean("isActive").default(true),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow(),
  lastUsedAt: timestamp("lastUsedAt"),
});

export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = typeof apiKeys.$inferInsert;

