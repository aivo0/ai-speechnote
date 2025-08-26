import {
  sqliteTable,
  text,
  integer,
  real,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// ============================================
// BetterAuth Core Tables
// ============================================

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .notNull()
    .default(false),
  name: text("name"),
  avatar: text("avatar"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  expiresAt: integer("expires_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ============================================
// Custom Application Tables
// ============================================

export const subscription = sqliteTable("subscription", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  plan: text("plan", {
    enum: ["trial", "personal", "professional", "team"],
  }).notNull(),
  status: text("status", {
    enum: ["active", "cancelled", "expired", "pending"],
  }).notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  stripePriceId: text("stripe_price_id"),
  quantity: integer("quantity").default(1),
  startedAt: integer("started_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  expiresAt: integer("expires_at", { mode: "timestamp" }),
  cancelledAt: integer("cancelled_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const purchase = sqliteTable("purchase", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  productId: text("product_id").notNull(),
  productName: text("product_name").notNull(),
  amount: real("amount").notNull(),
  currency: text("currency").notNull().default("USD"),
  status: text("status", {
    enum: ["pending", "completed", "failed", "refunded"],
  }).notNull(),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  licenseKey: text("license_key").unique(),
  metadata: text("metadata"), // JSON string for additional data
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const downloadToken = sqliteTable("download_token", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  purchaseId: text("purchase_id").references(() => purchase.id, {
    onDelete: "cascade",
  }),
  token: text("token").notNull().unique(),
  platform: text("platform", { enum: ["windows", "macos", "linux"] }),
  version: text("version"),
  downloadCount: integer("download_count").notNull().default(0),
  maxDownloads: integer("max_downloads").default(5),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  lastDownloadAt: integer("last_download_at", { mode: "timestamp" }),
  ipAddress: text("ip_address"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const waitlist = sqliteTable("waitlist", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  company: text("company"),
  useCase: text("use_case"),
  source: text("source"), // Where they signed up from (homepage, blog, etc.)
  referrer: text("referrer"), // Referral tracking
  status: text("status", { enum: ["pending", "invited", "converted"] })
    .notNull()
    .default("pending"),
  invitedAt: integer("invited_at", { mode: "timestamp" }),
  convertedAt: integer("converted_at", { mode: "timestamp" }),
  metadata: text("metadata"), // JSON string for additional data
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const appVersion = sqliteTable("app_version", {
  id: text("id").primaryKey(),
  version: text("version").notNull().unique(),
  platform: text("platform", { enum: ["windows", "macos", "linux"] }).notNull(),
  releaseNotes: text("release_notes"),
  downloadUrl: text("download_url").notNull(),
  fileSize: integer("file_size"), // in bytes
  checksum: text("checksum"), // SHA256 hash
  isLatest: integer("is_latest", { mode: "boolean" }).notNull().default(false),
  isPrerelease: integer("is_prerelease", { mode: "boolean" })
    .notNull()
    .default(false),
  minSystemVersion: text("min_system_version"),
  releasedAt: integer("released_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const supportTicket = sqliteTable("support_ticket", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  email: text("email").notNull(),
  name: text("name"),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  category: text("category", {
    enum: ["bug", "feature", "billing", "technical", "other"],
  }),
  status: text("status", {
    enum: ["open", "in_progress", "resolved", "closed"],
  })
    .notNull()
    .default("open"),
  priority: text("priority", {
    enum: ["low", "medium", "high", "urgent"],
  }).default("medium"),
  response: text("response"),
  respondedAt: integer("responded_at", { mode: "timestamp" }),
  resolvedAt: integer("resolved_at", { mode: "timestamp" }),
  metadata: text("metadata"), // JSON string for additional data
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const auditLog = sqliteTable("audit_log", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  action: text("action").notNull(), // login, logout, download, purchase, etc.
  resourceType: text("resource_type"), // user, purchase, download, etc.
  resourceId: text("resource_id"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  metadata: text("metadata"), // JSON string for additional data
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ============================================
// Speech Recognition Tables
// ============================================

export const speechSession = sqliteTable("speech_session", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  title: text("title"),
  language: text("language").default("et"), // Language code (et, en, etc.)
  status: text("status", {
    enum: ["active", "paused", "completed", "archived"],
  })
    .notNull()
    .default("active"),
  totalDuration: integer("total_duration").default(0), // Total recording duration in seconds
  segmentCount: integer("segment_count").default(0), // Number of transcript segments
  wsUrl: text("ws_url"), // WebSocket URL used for this session
  metadata: text("metadata"), // JSON string for session settings and additional data
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const speechSegment = sqliteTable("speech_segment", {
  id: text("id").primaryKey(),
  sessionId: text("session_id")
    .notNull()
    .references(() => speechSession.id, { onDelete: "cascade" }),
  sequence: integer("sequence").notNull(), // Order of segment within session
  text: text("text").notNull(), // Final transcribed text
  partialText: text("partial_text"), // Last partial text before finalization
  confidence: real("confidence"), // Confidence score (0-1)
  duration: real("duration"), // Duration of this segment in seconds
  language: text("language"), // Detected or specified language
  alternatives: text("alternatives"), // JSON array of alternative transcriptions
  isEdited: integer("is_edited", { mode: "boolean" }).notNull().default(false), // User manually edited
  metadata: text("metadata"), // JSON string for additional data (timestamps, etc.)
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const speechSettings = sqliteTable("speech_settings", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  defaultLanguage: text("default_language").default("et"),
  wsUrl: text("ws_url").default("wss://tekstiks.ee/asr/ws/asr"),
  nBest: integer("n_best").default(1), // Number of alternatives to request
  autoSave: integer("auto_save", { mode: "boolean" }).notNull().default(true),
  autoExport: integer("auto_export", { mode: "boolean" }).notNull().default(false),
  exportFormat: text("export_format", {
    enum: ["txt", "json", "csv", "docx"],
  }).default("txt"),
  bufferSize: integer("buffer_size").default(1024), // Audio buffer size
  maxSegmentLength: integer("max_segment_length").default(300), // Max segment length in seconds
  metadata: text("metadata"), // JSON string for additional settings
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Export all tables as a schema object for Drizzle
export const schema = {
  user,
  session,
  account,
  verification,
  subscription,
  purchase,
  downloadToken,
  waitlist,
  appVersion,
  supportTicket,
  auditLog,
  speechSession,
  speechSegment,
  speechSettings,
};
