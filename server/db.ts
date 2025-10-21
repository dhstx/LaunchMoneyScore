import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, auditRuns, InsertAuditRun, AuditRun, reports, InsertReport, Report, apiKeys, ApiKey, InsertApiKey } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.id) {
    throw new Error("User ID is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      id: user.id,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role === undefined) {
      if (user.id === ENV.ownerId) {
        user.role = 'admin';
        values.role = 'admin';
        updateSet.role = 'admin';
      }
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUser(id: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Audit Run helpers
export async function createAuditRun(data: InsertAuditRun): Promise<AuditRun> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(auditRuns).values(data);
  const result = await db.select().from(auditRuns).where(eq(auditRuns.id, data.id!)).limit(1);
  return result[0];
}

export async function updateAuditRun(id: string, data: Partial<InsertAuditRun>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(auditRuns).set(data).where(eq(auditRuns.id, id));
}

export async function getAuditRun(id: string): Promise<AuditRun | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(auditRuns).where(eq(auditRuns.id, id)).limit(1);
  return result[0];
}

export async function getUserAuditRuns(userId: string): Promise<AuditRun[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(auditRuns).where(eq(auditRuns.userId, userId));
}

// Report helpers
export async function createReport(data: InsertReport): Promise<Report> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(reports).values(data);
  const result = await db.select().from(reports).where(eq(reports.id, data.id!)).limit(1);
  return result[0];
}

export async function updateReport(id: string, data: Partial<InsertReport>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(reports).set(data).where(eq(reports.id, id));
}

export async function getReport(id: string): Promise<Report | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(reports).where(eq(reports.id, id)).limit(1);
  return result[0];
}

export async function getReportByPaymentIntent(paymentIntentId: string): Promise<Report | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(reports).where(eq(reports.stripePaymentIntentId, paymentIntentId)).limit(1);
  return result[0];
}

// API Key helpers
export async function createApiKey(data: InsertApiKey): Promise<ApiKey> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(apiKeys).values(data);
  const result = await db.select().from(apiKeys).where(eq(apiKeys.id, data.id!)).limit(1);
  return result[0];
}

export async function getApiKey(key: string): Promise<ApiKey | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(apiKeys).where(eq(apiKeys.key, key)).limit(1);
  return result[0];
}

export async function updateApiKey(id: string, data: Partial<InsertApiKey>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(apiKeys).set(data).where(eq(apiKeys.id, id));
}

export async function getUserApiKeys(userId: string): Promise<ApiKey[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(apiKeys).where(eq(apiKeys.userId, userId));
}

