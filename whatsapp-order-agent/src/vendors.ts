// Vendor (restaurant) configuration: one JSON file per vendor in the vendors/ folder.
// Adding a new vendor = adding a new file. No code changes.

import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";

const DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
export type Day = (typeof DAYS)[number];

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "use HH:MM (24h)");

/** Open/close per day. close earlier than open means "closes after midnight". */
const HoursSchema = z.record(
  z.enum(DAYS),
  z.object({ open: time, close: time }).nullable(),
);

const DeliveryRuleSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("free") }),
  z.object({ type: z.literal("flat"), fee: z.number().min(0) }),
  z.object({
    type: z.literal("slabs"),
    /** Sorted by upToKm; the first slab whose upToKm >= distance applies. */
    slabs: z.array(z.object({ upToKm: z.number().positive(), fee: z.number().min(0) })).min(1),
  }),
  z.object({
    type: z.literal("per_km"),
    baseFee: z.number().min(0),
    perKm: z.number().min(0),
    includedKm: z.number().min(0).default(0),
  }),
]);

const BranchSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  address: z.string().min(1),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  hours: HoursSchema,
  delivery: z.object({
    rule: DeliveryRuleSchema,
    maxKm: z.number().positive(),
    /** Delivery becomes free when the food subtotal reaches this amount. */
    freeAbove: z.number().positive().optional(),
    minOrder: z.number().min(0).default(0),
  }),
  pickup: z.boolean().default(true),
  /** Minutes the kitchen usually needs, before rush adjustments. */
  prepMinutes: z.number().int().positive().default(20),
});

const VariantSchema = z.object({ name: z.string().min(1), price: z.number().min(0) });

const MenuItemSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9_-]+$/, "lowercase letters, digits, - or _"),
    name: z.string().min(1),
    category: z.string().min(1),
    description: z.string().optional(),
    /** Either a single price, or variants (e.g. Small/Medium/Large). */
    price: z.number().min(0).optional(),
    variants: z.array(VariantSchema).min(1).optional(),
    available: z.boolean().default(true),
  })
  .refine((i) => (i.price === undefined) !== (i.variants === undefined), {
    message: "give either price or variants, not both",
  });

export const VendorSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  /** Short prefix for order numbers, e.g. "PZ" -> PZ-1001. */
  orderPrefix: z.string().regex(/^[A-Z]{2,4}$/),
  currency: z.string().default("PKR"),
  whatsapp: z.object({
    /** "Phone number ID" from Meta (not the phone number itself). */
    phoneNumberId: z.string().min(1),
    /** Name of the environment variable holding this vendor's access token. */
    accessTokenEnv: z.string().regex(/^[A-Z0-9_]+$/),
    displayNumber: z.string().optional(),
  }),
  /** Secret key for the kitchen/rider screen link. */
  opsKeyEnv: z.string().regex(/^[A-Z0-9_]+$/),
  branches: z.array(BranchSchema).min(1),
  menu: z.array(MenuItemSchema).min(1),
  payment: z.object({
    cod: z.boolean().default(true),
    /** Shown to the customer for online payment (Raast/JazzCash/Easypaisa/bank). */
    online: z.string().optional(),
  }),
  /** Free-text facts the agent may use: policies, halal note, parking, etc. */
  faq: z.array(z.string()).default([]),
  /** Tone and language guidance for this shop. */
  style: z.string().default("Friendly, short replies. Match the customer's language (Roman Urdu, Urdu or English)."),
  /** Optional one-line upsell suggestion the agent may offer once per order. */
  upsell: z.string().optional(),
  /** Language of automatic status messages (rider on the way, etc.). */
  notifyLanguage: z.enum(["roman_urdu", "english"]).default("roman_urdu"),
  /** Owner/manager WhatsApp numbers (digits with country code, e.g. 923001234567). They can send commands like "report". */
  owners: z.array(z.string().regex(/^\d{10,15}$/, "digits with country code, e.g. 923001234567")).default([]),
  /** Orders for a later time (today or tomorrow). */
  preorder: z
    .object({
      enabled: z.boolean().default(true),
      /** Kept under 24h so status messages stay inside WhatsApp's free-reply window. */
      maxHoursAhead: z.number().positive().max(22).default(20),
    })
    .default({ enabled: true, maxHoursAhead: 20 }),
});

export type Vendor = z.infer<typeof VendorSchema>;
export type Branch = z.infer<typeof BranchSchema>;
export type MenuItem = z.infer<typeof MenuItemSchema>;
export type DeliveryRule = z.infer<typeof DeliveryRuleSchema>;

export interface LoadedVendor extends Vendor {
  /** Changes whenever the vendor file changes; used to restart chats on menu edits. */
  configHash: string;
}

export function parseVendor(raw: unknown, source = "vendor"): LoadedVendor {
  const result = VendorSchema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Invalid ${source}:\n${issues}`);
  }
  const v = result.data;
  const ids = new Set<string>();
  for (const item of v.menu) {
    if (ids.has(item.id)) throw new Error(`Invalid ${source}: duplicate menu id "${item.id}"`);
    ids.add(item.id);
  }
  const configHash = createHash("sha256").update(JSON.stringify(v)).digest("hex").slice(0, 16);
  return { ...v, configHash };
}

export class VendorRegistry {
  private byPhoneId = new Map<string, LoadedVendor>();
  private bySlug = new Map<string, LoadedVendor>();

  constructor(vendors: LoadedVendor[]) {
    for (const v of vendors) {
      if (this.bySlug.has(v.slug)) throw new Error(`Duplicate vendor slug "${v.slug}"`);
      if (this.byPhoneId.has(v.whatsapp.phoneNumberId)) {
        throw new Error(`Two vendors use phoneNumberId ${v.whatsapp.phoneNumberId}`);
      }
      this.bySlug.set(v.slug, v);
      this.byPhoneId.set(v.whatsapp.phoneNumberId, v);
    }
  }

  static fromDir(dir: string): VendorRegistry {
    const files = readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
    const vendors = files.map((f) => {
      const full = path.join(dir, f);
      return parseVendor(JSON.parse(readFileSync(full, "utf8")), full);
    });
    return new VendorRegistry(vendors);
  }

  /** Adds or replaces a vendor while the server runs (admin panel). Throws on a clash. */
  upsert(v: LoadedVendor): void {
    const other = this.byPhoneId.get(v.whatsapp.phoneNumberId);
    if (other && other.slug !== v.slug) {
      throw new Error(`phoneNumberId ${v.whatsapp.phoneNumberId} already belongs to "${other.slug}"`);
    }
    const old = this.bySlug.get(v.slug);
    if (old) this.byPhoneId.delete(old.whatsapp.phoneNumberId);
    this.bySlug.set(v.slug, v);
    this.byPhoneId.set(v.whatsapp.phoneNumberId, v);
  }

  byPhoneNumberId(id: string): LoadedVendor | undefined {
    return this.byPhoneId.get(id);
  }

  get(slug: string): LoadedVendor | undefined {
    return this.bySlug.get(slug);
  }

  all(): LoadedVendor[] {
    return [...this.bySlug.values()];
  }
}

export function menuItem(vendor: Vendor, id: string): MenuItem | undefined {
  return vendor.menu.find((m) => m.id === id);
}
