/**
 * Fictional demo store "Nimbus Home". All people, emails and orders are synthetic.
 * The store clock is fixed so policy windows (30 days etc.) are deterministic for evals.
 */

export const STORE = {
  name: "Nimbus Home",
  today: "2026-11-01",
  currency: "USD",
  autoRefundLimit: 100, // refunds above this need human approval
  refundWindowDays: 30,
  lateDeliveryGraceDays: 5,
  lostAfterDaysWithoutScan: 10,
} as const;

export type OrderStatus = "processing" | "shipped" | "delivered" | "lost" | "cancelled";

export type Order = {
  id: string;
  email: string;
  customer: string;
  country: "AE" | "SA" | "PK" | "US" | "GB";
  items: { sku: string; name: string; qty: number; price: number }[];
  shipping: number;
  total: number;
  status: OrderStatus;
  placedAt: string;
  eta: string;
  deliveredAt?: string;
  lastScanAt?: string;
  carrier: string;
  tracking: string;
  address: string;
  priorRefunds: number;
};

type Seed = Omit<Order, "total" | "id"> & { n: number };

const seeds: Seed[] = [
  // Delivered recently, eligible for refunds
  { n: 1001, email: "aisha.k@example.com", customer: "Aisha Khan", country: "AE", items: [{ sku: "LMP-02", name: "Brass table lamp", qty: 1, price: 64 }], shipping: 8, status: "delivered", placedAt: "2026-10-10", eta: "2026-10-16", deliveredAt: "2026-10-15", carrier: "Aramex", tracking: "ARX884120", address: "Villa 12, Al Barsha 2, Dubai", priorRefunds: 0 },
  { n: 1002, email: "omar.f@example.com", customer: "Omar Farooq", country: "SA", items: [{ sku: "RUG-11", name: "Handwoven wool rug 160x230", qty: 1, price: 289 }], shipping: 0, status: "delivered", placedAt: "2026-10-05", eta: "2026-10-12", deliveredAt: "2026-10-11", carrier: "SMSA", tracking: "SMS559201", address: "King Fahd Rd, Al Olaya, Riyadh", priorRefunds: 0 },
  { n: 1003, email: "sana.m@example.com", customer: "Sana Malik", country: "PK", items: [{ sku: "MUG-04", name: "Stoneware mug set (4)", qty: 1, price: 38 }, { sku: "TWL-01", name: "Cotton towel pair", qty: 1, price: 22 }], shipping: 6, status: "delivered", placedAt: "2026-10-18", eta: "2026-10-24", deliveredAt: "2026-10-23", carrier: "TCS", tracking: "TCS7731045", address: "House 45, Block 6, PECHS, Karachi", priorRefunds: 0 },
  // Delivered late (more than 5 days after ETA)
  { n: 1004, email: "james.r@example.com", customer: "James Reid", country: "GB", items: [{ sku: "CHR-07", name: "Oak dining chair", qty: 2, price: 120 }], shipping: 25, status: "delivered", placedAt: "2026-09-28", eta: "2026-10-06", deliveredAt: "2026-10-17", carrier: "DPD", tracking: "DPD15009233", address: "14 Elm Street, Manchester", priorRefunds: 0 },
  { n: 1005, email: "fatima.z@example.com", customer: "Fatima Zahra", country: "AE", items: [{ sku: "CUS-03", name: "Linen cushion cover", qty: 3, price: 18 }], shipping: 8, status: "delivered", placedAt: "2026-10-01", eta: "2026-10-07", deliveredAt: "2026-10-20", carrier: "Aramex", tracking: "ARX884399", address: "Apt 1203, Marina Gate 1, Dubai", priorRefunds: 0 },
  // Delivered too long ago (outside 30-day window)
  { n: 1006, email: "bilal.h@example.com", customer: "Bilal Hussain", country: "PK", items: [{ sku: "LMP-02", name: "Brass table lamp", qty: 1, price: 64 }], shipping: 6, status: "delivered", placedAt: "2026-08-20", eta: "2026-08-27", deliveredAt: "2026-08-26", carrier: "TCS", tracking: "TCS7700012", address: "Street 9, F-7/2, Islamabad", priorRefunds: 0 },
  { n: 1007, email: "emily.c@example.com", customer: "Emily Carter", country: "US", items: [{ sku: "SOF-01", name: "Two-seat linen sofa", qty: 1, price: 940 }], shipping: 60, status: "delivered", placedAt: "2026-08-30", eta: "2026-09-12", deliveredAt: "2026-09-10", carrier: "UPS Freight", tracking: "1Z99F0012", address: "220 Pine Ave, Austin, TX", priorRefunds: 0 },
  // Processing (address can still change)
  { n: 1008, email: "hamza.a@example.com", customer: "Hamza Ali", country: "PK", items: [{ sku: "BED-05", name: "Percale duvet set (queen)", qty: 1, price: 79 }], shipping: 6, status: "processing", placedAt: "2026-10-31", eta: "2026-11-06", carrier: "TCS", tracking: "pending", address: "Flat 3, Gulberg III, Lahore", priorRefunds: 0 },
  { n: 1009, email: "noura.s@example.com", customer: "Noura Saleh", country: "SA", items: [{ sku: "VAS-02", name: "Ceramic vase", qty: 2, price: 45 }], shipping: 0, status: "processing", placedAt: "2026-10-30", eta: "2026-11-05", carrier: "SMSA", tracking: "pending", address: "Prince Sultan St, Jeddah", priorRefunds: 0 },
  // Shipped (in transit, address can no longer change)
  { n: 1010, email: "layla.n@example.com", customer: "Layla Nasser", country: "AE", items: [{ sku: "MIR-01", name: "Round wall mirror", qty: 1, price: 110 }], shipping: 8, status: "shipped", placedAt: "2026-10-27", eta: "2026-11-03", lastScanAt: "2026-10-31", carrier: "Aramex", tracking: "ARX885012", address: "Villa 3, Jumeirah 1, Dubai", priorRefunds: 0 },
  { n: 1011, email: "daniel.p@example.com", customer: "Daniel Park", country: "US", items: [{ sku: "DSK-02", name: "Walnut writing desk", qty: 1, price: 410 }], shipping: 45, status: "shipped", placedAt: "2026-10-24", eta: "2026-11-04", lastScanAt: "2026-10-30", carrier: "FedEx", tracking: "7790012345", address: "88 Lake Shore Dr, Chicago, IL", priorRefunds: 0 },
  { n: 1012, email: "zainab.q@example.com", customer: "Zainab Qureshi", country: "PK", items: [{ sku: "TWL-01", name: "Cotton towel pair", qty: 2, price: 22 }], shipping: 6, status: "shipped", placedAt: "2026-10-28", eta: "2026-11-03", lastScanAt: "2026-10-31", carrier: "Leopards", tracking: "LP4410982", address: "House 7, DHA Phase 5, Karachi", priorRefunds: 0 },
  // Lost (no scan for 10+ days)
  { n: 1013, email: "yusuf.b@example.com", customer: "Yusuf Badr", country: "SA", items: [{ sku: "LMP-05", name: "Arc floor lamp", qty: 1, price: 85 }], shipping: 0, status: "lost", placedAt: "2026-10-02", eta: "2026-10-09", lastScanAt: "2026-10-08", carrier: "SMSA", tracking: "SMS558870", address: "Al Malqa, Riyadh", priorRefunds: 0 },
  { n: 1014, email: "grace.l@example.com", customer: "Grace Liu", country: "GB", items: [{ sku: "SHF-03", name: "Floating shelf set", qty: 1, price: 150 }], shipping: 15, status: "lost", placedAt: "2026-10-03", eta: "2026-10-10", lastScanAt: "2026-10-07", carrier: "Royal Mail", tracking: "RM22093311GB", address: "3 Mill Lane, Leeds", priorRefunds: 0 },
  // High value delivered (refund would exceed auto limit)
  { n: 1015, email: "khalid.m@example.com", customer: "Khalid Mansoor", country: "AE", items: [{ sku: "SOF-02", name: "Three-seat velvet sofa", qty: 1, price: 1290 }], shipping: 0, status: "delivered", placedAt: "2026-10-08", eta: "2026-10-20", deliveredAt: "2026-10-19", carrier: "Aramex Freight", tracking: "ARXF22014", address: "Villa 40, Arabian Ranches, Dubai", priorRefunds: 0 },
  { n: 1016, email: "maria.g@example.com", customer: "Maria Gomez", country: "US", items: [{ sku: "TBL-04", name: "Marble coffee table", qty: 1, price: 560 }], shipping: 40, status: "delivered", placedAt: "2026-10-06", eta: "2026-10-15", deliveredAt: "2026-10-14", carrier: "UPS Freight", tracking: "1Z99F0099", address: "15 Ocean View Rd, Miami, FL", priorRefunds: 0 },
  // Already partially refunded
  { n: 1017, email: "imran.s@example.com", customer: "Imran Shah", country: "PK", items: [{ sku: "MUG-04", name: "Stoneware mug set (4)", qty: 2, price: 38 }], shipping: 6, status: "delivered", placedAt: "2026-10-12", eta: "2026-10-18", deliveredAt: "2026-10-17", carrier: "TCS", tracking: "TCS7731999", address: "Model Town, Lahore", priorRefunds: 38 },
  // Cancelled
  { n: 1018, email: "sara.o@example.com", customer: "Sara Odeh", country: "AE", items: [{ sku: "CUS-03", name: "Linen cushion cover", qty: 2, price: 18 }], shipping: 8, status: "cancelled", placedAt: "2026-10-20", eta: "2026-10-26", carrier: "Aramex", tracking: "n/a", address: "Al Nahda, Sharjah", priorRefunds: 44 },
];

export const ORDERS: Order[] = seeds.map(({ n, ...s }) => ({
  ...s,
  id: `NH-${n}`,
  total: s.items.reduce((t, i) => t + i.qty * i.price, 0) + s.shipping,
}));

export function findOrder(id: string): Order | undefined {
  const norm = id.trim().toUpperCase().replace(/^#/, "").replace(/^NH(\d)/, "NH-$1");
  return ORDERS.find((o) => o.id === norm || o.id.replace("-", "") === norm);
}

export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
}
