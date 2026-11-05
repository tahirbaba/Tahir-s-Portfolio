// Generates public/land-dots.json: [lat, lng] pairs on land, evenly spaced on a sphere.
import { readFileSync, writeFileSync } from "node:fs";
import { feature } from "topojson-client";
import { geoContains } from "d3-geo";

const topo = JSON.parse(readFileSync(new URL("../node_modules/world-atlas/land-110m.json", import.meta.url)));
const land = feature(topo, topo.objects.land);
const N = 16000; // candidate points on a Fibonacci sphere
const out = [];
for (let i = 0; i < N; i++) {
  const y = 1 - (2 * (i + 0.5)) / N;
  const lat = Math.asin(y) * 180 / Math.PI;
  const lng = ((i * 137.50776405) % 360) - 180;
  if (lat < -58) continue; // drop Antarctica for a cleaner globe
  if (geoContains(land, [lng, lat])) out.push([+lat.toFixed(2), +lng.toFixed(2)]);
}
writeFileSync(new URL("../public/land-dots.json", import.meta.url), JSON.stringify(out));
console.log(`land dots: ${out.length}`);
