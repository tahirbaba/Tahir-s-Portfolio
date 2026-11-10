// Daily database backups: one consistent .db file per day, oldest deleted after `keep`.
// A backup is a normal SQLite file: to restore, stop the server and copy it to data/agent.db.

import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from "node:fs";
import path from "node:path";
import { config } from "./config.js";
import type { Store } from "./db.js";
import { karachiTime } from "./hours.js";

const NAME = /^agent-\d{4}-\d{2}-\d{2}-\d{4}\.db$/;

export function isBackupName(name: string): boolean {
  return NAME.test(name);
}

export interface BackupFile {
  name: string;
  bytes: number;
  at: number;
}

export function listBackups(dir = config.backup.dir): BackupFile[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter(isBackupName)
    .map((name) => {
      const st = statSync(path.join(dir, name));
      return { name, bytes: st.size, at: st.mtimeMs };
    })
    .sort((a, b) => b.name.localeCompare(a.name));
}

export function backupNow(store: Store, now = Date.now(), dir = config.backup.dir, keep = config.backup.keep): BackupFile {
  mkdirSync(dir, { recursive: true });
  const t = karachiTime(new Date(now));
  const name = `agent-${t.date}-${t.label.slice(4).replace(":", "")}.db`;
  const file = path.join(dir, name);
  if (existsSync(file)) unlinkSync(file); // VACUUM INTO needs a new file
  store.backupTo(file);
  for (const old of listBackups(dir).slice(Math.max(1, keep))) unlinkSync(path.join(dir, old.name));
  const st = statSync(file);
  return { name, bytes: st.size, at: st.mtimeMs };
}

/** Called every minute: makes the day's backup once, in the 6 hours after the set time. */
export function runDailyBackup(store: Store, now = Date.now()): BackupFile | null {
  const t = karachiTime(new Date(now));
  const [h, m] = config.backup.time.split(":").map(Number);
  const since = t.minutes - (h! * 60 + m!);
  if (since < 0 || since >= 6 * 60) return null;
  if (!store.claimReportDay("__backup__", t.date, now)) return null;
  return backupNow(store, now);
}
