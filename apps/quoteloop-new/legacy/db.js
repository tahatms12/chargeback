/**
 * db.js
 *
 * SQLite database initialization and all persistence operations.
 * Implements a custom SessionStorage adapter for @shopify/shopify-api
 * so the cron poller can retrieve offline tokens per shop.
 *
 * Tables:
 *   sessions           - Shopify OAuth sessions (offline tokens per shop)
 *   shop_settings      - Per-shop configuration (follow-up days, expiry days, email template)
 *   draft_order_actions - Audit log of follow-ups sent and expirations performed
 */

import Database from "better-sqlite3";
import { Session } from "@shopify/shopify-api";
import { join, dirname } from "path";
import { mkdirSync } from "fs";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const DB_PATH = process.env.DB_PATH || join(__dirname, "data", "app.db");

// Ensure the data directory exists
mkdirSync(dirname(DB_PATH), { recursive: true });

let db;

export function getDb() {
  if (!db) {
    throw new Error("Database not initialized. Call initDb() first.");
  }
  return db;
}

export function initDb() {
  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id          TEXT PRIMARY KEY,
      shop        TEXT NOT NULL,
      state       TEXT,
      is_online   INTEGER NOT NULL DEFAULT 0,
      scope       TEXT,
      expires     INTEGER,
      token       TEXT,
      user_id     INTEGER,
      first_name  TEXT,
      last_name   TEXT,
      email       TEXT,
      account_owner INTEGER,
      locale      TEXT,
      collaborator INTEGER,
      email_verified INTEGER
    );

    CREATE INDEX IF NOT EXISTS sessions_shop_idx ON sessions(shop);

    CREATE TABLE IF NOT EXISTS shop_settings (
      shop                         TEXT PRIMARY KEY,
      follow_up_days               INTEGER NOT NULL DEFAULT 7,
      expiry_days                  INTEGER NOT NULL DEFAULT 14,
      follow_up_email_subject      TEXT    NOT NULL DEFAULT 'Following up on your quote',
      follow_up_email_body         TEXT    NOT NULL DEFAULT 'Hi {{customer_name}},

We wanted to follow up on your quote {{draft_order_name}}.

Your quote is still available and ready for you to review:

{{draft_order_url}}

If you have any questions or would like to make changes, please reply to this email.

Best regards,
{{shop_name}}',
      merchant_notification_email  TEXT,
      created_at                   INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at                   INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS draft_order_actions (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      shop             TEXT    NOT NULL,
      draft_order_id   TEXT    NOT NULL,
      action_type      TEXT    NOT NULL,
      performed_at     INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE UNIQUE INDEX IF NOT EXISTS draft_order_actions_unique
      ON draft_order_actions(shop, draft_order_id, action_type);
  `);

  return db;
}

// ---------------------------------------------------------------------------
// Session Storage (implements @shopify/shopify-api SessionStorage interface)
// ---------------------------------------------------------------------------

function sessionToRow(session) {
  return {
    id: session.id,
    shop: session.shop,
    state: session.state ?? null,
    is_online: session.isOnline ? 1 : 0,
    scope: session.scope ?? null,
    expires: session.expires ? Math.floor(session.expires.getTime() / 1000) : null,
    token: session.accessToken ?? null,
    user_id: session.onlineAccessInfo?.associated_user?.id ?? null,
    first_name: session.onlineAccessInfo?.associated_user?.first_name ?? null,
    last_name: session.onlineAccessInfo?.associated_user?.last_name ?? null,
    email: session.onlineAccessInfo?.associated_user?.email ?? null,
    account_owner: session.onlineAccessInfo?.associated_user?.account_owner ? 1 : 0,
    locale: session.onlineAccessInfo?.associated_user?.locale ?? null,
    collaborator: session.onlineAccessInfo?.associated_user?.collaborator ? 1 : 0,
    email_verified: session.onlineAccessInfo?.associated_user?.email_verified ? 1 : 0,
  };
}

function rowToSession(row) {
  const session = new Session({
    id: row.id,
    shop: row.shop,
    state: row.state ?? "",
    isOnline: row.is_online === 1,
  });
  session.scope = row.scope ?? undefined;
  session.accessToken = row.token ?? undefined;
  if (row.expires) {
    session.expires = new Date(row.expires * 1000);
  }
  if (row.is_online && row.user_id) {
    session.onlineAccessInfo = {
      associated_user_scope: row.scope ?? "",
      associated_user: {
        id: row.user_id,
        first_name: row.first_name ?? "",
        last_name: row.last_name ?? "",
        email: row.email ?? "",
        account_owner: row.account_owner === 1,
        locale: row.locale ?? "",
        collaborator: row.collaborator === 1,
        email_verified: row.email_verified === 1,
      },
    };
  }
  return session;
}

export class SQLiteSessionStorage {
  async storeSession(session) {
    const row = sessionToRow(session);
    getDb()
      .prepare(
        `INSERT INTO sessions (id, shop, state, is_online, scope, expires, token,
           user_id, first_name, last_name, email, account_owner, locale, collaborator, email_verified)
         VALUES (@id, @shop, @state, @is_online, @scope, @expires, @token,
           @user_id, @first_name, @last_name, @email, @account_owner, @locale, @collaborator, @email_verified)
         ON CONFLICT(id) DO UPDATE SET
           shop=excluded.shop, state=excluded.state, is_online=excluded.is_online,
           scope=excluded.scope, expires=excluded.expires, token=excluded.token,
           user_id=excluded.user_id, first_name=excluded.first_name, last_name=excluded.last_name,
           email=excluded.email, account_owner=excluded.account_owner, locale=excluded.locale,
           collaborator=excluded.collaborator, email_verified=excluded.email_verified`
      )
      .run(row);
    return true;
  }

  async loadSession(id) {
    const row = getDb().prepare("SELECT * FROM sessions WHERE id = ?").get(id);
    return row ? rowToSession(row) : undefined;
  }

  async deleteSession(id) {
    getDb().prepare("DELETE FROM sessions WHERE id = ?").run(id);
    return true;
  }

  async deleteSessions(ids) {
    const placeholders = ids.map(() => "?").join(",");
    getDb()
      .prepare(`DELETE FROM sessions WHERE id IN (${placeholders})`)
      .run(...ids);
    return true;
  }

  async findSessionsByShop(shop) {
    const rows = getDb()
      .prepare("SELECT * FROM sessions WHERE shop = ?")
      .all(shop);
    return rows.map(rowToSession);
  }
}

// ---------------------------------------------------------------------------
// Shop Settings
// ---------------------------------------------------------------------------

export function getShopSettings(shop) {
  const row = getDb()
    .prepare("SELECT * FROM shop_settings WHERE shop = ?")
    .get(shop);

  if (!row) {
    // Return defaults if no settings saved yet
    return {
      shop,
      follow_up_days: 7,
      expiry_days: 14,
      follow_up_email_subject: "Following up on your quote",
      follow_up_email_body: `Hi {{customer_name}},

We wanted to follow up on your quote {{draft_order_name}}.

Your quote is still available and ready for you to review:

{{draft_order_url}}

If you have any questions or would like to make changes, please reply to this email.

Best regards,
{{shop_name}}`,
      merchant_notification_email: null,
    };
  }
  return row;
}

export function saveShopSettings(shop, settings) {
  getDb()
    .prepare(
      `INSERT INTO shop_settings
         (shop, follow_up_days, expiry_days, follow_up_email_subject, follow_up_email_body, merchant_notification_email, updated_at)
       VALUES
         (@shop, @follow_up_days, @expiry_days, @follow_up_email_subject, @follow_up_email_body, @merchant_notification_email, unixepoch())
       ON CONFLICT(shop) DO UPDATE SET
         follow_up_days = excluded.follow_up_days,
         expiry_days    = excluded.expiry_days,
         follow_up_email_subject = excluded.follow_up_email_subject,
         follow_up_email_body    = excluded.follow_up_email_body,
         merchant_notification_email = excluded.merchant_notification_email,
         updated_at = unixepoch()`
    )
    .run({
      shop,
      follow_up_days: settings.follow_up_days,
      expiry_days: settings.expiry_days,
      follow_up_email_subject: settings.follow_up_email_subject,
      follow_up_email_body: settings.follow_up_email_body,
      merchant_notification_email: settings.merchant_notification_email ?? null,
    });
}

// ---------------------------------------------------------------------------
// Draft Order Actions
// ---------------------------------------------------------------------------

/**
 * Returns all recorded action types for a given draft order on a shop.
 * @returns {string[]} e.g. ['follow_up_sent', 'expired']
 */
export function getActionsForDraft(shop, draftOrderId) {
  const rows = getDb()
    .prepare(
      "SELECT action_type FROM draft_order_actions WHERE shop = ? AND draft_order_id = ?"
    )
    .all(shop, String(draftOrderId));
  return rows.map((r) => r.action_type);
}

/**
 * Records an action for a draft order.
 * Uses INSERT OR IGNORE so duplicate actions are silently skipped.
 * @param {'follow_up_sent'|'expired'} actionType
 */
export function recordAction(shop, draftOrderId, actionType) {
  getDb()
    .prepare(
      `INSERT OR IGNORE INTO draft_order_actions (shop, draft_order_id, action_type)
       VALUES (?, ?, ?)`
    )
    .run(shop, String(draftOrderId), actionType);
}

/**
 * Returns all shops that have at least one offline session stored.
 * Used by the poller to iterate over active installations.
 */
export function getAllShops() {
  const rows = getDb()
    .prepare("SELECT DISTINCT shop FROM sessions WHERE is_online = 0 AND token IS NOT NULL")
    .all();
  return rows.map((r) => r.shop);
}

/**
 * Returns the offline access token for a given shop.
 */
export function getOfflineToken(shop) {
  const row = getDb()
    .prepare("SELECT token FROM sessions WHERE shop = ? AND is_online = 0 LIMIT 1")
    .get(shop);
  return row?.token ?? null;
}
