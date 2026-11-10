// npm run vendors:check  ->  validates every vendors/*.json file and prints a summary.

import { buildSystemPrompt } from "../agent/prompt.js";
import { config } from "../config.js";
import { VendorRegistry } from "../vendors.js";

try {
  const reg = VendorRegistry.fromDir(config.vendorsDir);
  for (const v of reg.all()) {
    const chars = buildSystemPrompt(v).length;
    console.log(
      `✅ ${v.slug}: ${v.name} | ${v.branches.length} branch(es) | ${v.menu.length} menu items | prompt ~${Math.round(chars / 4)} tokens`,
    );
    if (v.whatsapp.phoneNumberId.startsWith("REPLACE")) console.log(`   ⚠️  set whatsapp.phoneNumberId for ${v.slug}`);
  }
} catch (err) {
  console.error(`❌ ${(err as Error).message}`);
  process.exit(1);
}
