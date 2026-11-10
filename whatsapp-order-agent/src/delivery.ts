// Branch selection, delivery fee and ETA. Pure functions: easy to test, never guessed by the AI.

import type { Branch, DeliveryRule, Vendor } from "./vendors.js";

/** Roads in Karachi are rarely straight; straight-line distance is multiplied by this. */
export const ROAD_FACTOR = 1.3;
/** Average rider speed in city traffic. */
export const RIDER_KMH = 20;

export interface LatLng {
  lat: number;
  lng: number;
}

export function straightLineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function roadKm(a: LatLng, b: LatLng): number {
  return Math.round(straightLineKm(a, b) * ROAD_FACTOR * 10) / 10;
}

export function feeForDistance(rule: DeliveryRule, km: number): number {
  switch (rule.type) {
    case "free":
      return 0;
    case "flat":
      return rule.fee;
    case "slabs": {
      const sorted = [...rule.slabs].sort((x, y) => x.upToKm - y.upToKm);
      const slab = sorted.find((s) => km <= s.upToKm) ?? sorted[sorted.length - 1]!;
      return slab.fee;
    }
    case "per_km": {
      const extra = Math.max(0, km - rule.includedKm);
      return Math.round(rule.baseFee + Math.ceil(extra) * rule.perKm);
    }
  }
}

export type DeliveryQuote =
  | {
      ok: true;
      branch: Branch;
      km: number;
      fee: number;
      feeWaived: boolean;
      travelMinutes: number;
    }
  | { ok: false; reason: "out_of_range"; nearestBranch: Branch; km: number; maxKm: number };

/** Nearest branch that delivers to this location, with fee and travel time. */
export function quoteDelivery(vendor: Vendor, location: LatLng, subtotal: number): DeliveryQuote {
  const ranked = vendor.branches
    .map((branch) => ({ branch, km: roadKm(branch, location) }))
    .sort((a, b) => a.km - b.km);
  const inRange = ranked.find((r) => r.km <= r.branch.delivery.maxKm);
  if (!inRange) {
    const nearest = ranked[0]!;
    return {
      ok: false,
      reason: "out_of_range",
      nearestBranch: nearest.branch,
      km: nearest.km,
      maxKm: nearest.branch.delivery.maxKm,
    };
  }
  const { branch, km } = inRange;
  const baseFee = feeForDistance(branch.delivery.rule, km);
  const feeWaived = branch.delivery.freeAbove !== undefined && subtotal >= branch.delivery.freeAbove;
  return {
    ok: true,
    branch,
    km,
    fee: feeWaived ? 0 : baseFee,
    feeWaived: feeWaived && baseFee > 0,
    travelMinutes: Math.ceil((km / RIDER_KMH) * 60),
  };
}

/**
 * Estimated minutes until the food reaches the customer (or is ready for pickup).
 * Kitchen time grows with the number of orders already in the kitchen.
 */
export function estimateMinutes(opts: {
  prepMinutes: number;
  activeOrders: number;
  travelMinutes: number; // 0 for pickup
}): { min: number; max: number } {
  const rush = Math.min(opts.activeOrders, 8) * 3; // +3 min per queued order, capped
  const buffer = opts.travelMinutes > 0 ? 5 : 0;
  const min = opts.prepMinutes + rush + opts.travelMinutes + buffer;
  const roundedMin = Math.ceil(min / 5) * 5;
  return { min: roundedMin, max: roundedMin + 10 };
}
