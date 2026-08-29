// scripts/generate-icons.mjs — renders the PWA icon set from the logo SVGs.
// Run once (node scripts/generate-icons.mjs); outputs land in public/icons/.
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const outDir = path.join(process.cwd(), "public", "icons");
fs.mkdirSync(outDir, { recursive: true });

// The rounded navy app tile (app/icon.svg) — used for 192/512/apple-touch.
const tileSvg = fs.readFileSync(path.join(process.cwd(), "app", "icon.svg"), "utf8");

// Maskable variant: full-bleed navy square, mark scaled into the safe zone
// (maskable icons get cropped to a circle on Android — content must sit
// within the central 80%).
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#0F2A43"/>
  <g transform="translate(256 256) scale(3.6) translate(-82 -82)">
    <circle cx="66" cy="66" r="38" fill="none" stroke="#FFFFFF" stroke-width="11"/>
    <line x1="93.5" y1="93.5" x2="121.5" y2="121.5" stroke="#FFFFFF" stroke-width="17" stroke-linecap="round"/>
    <path d="M66,43 L71.17,58.89 L87.87,58.89 L74.36,68.72 L79.52,84.61 L66,74.79 L52.48,84.61 L57.64,68.72 L44.13,58.89 L60.83,58.89 Z" fill="#F2B705"/>
  </g>
</svg>`;

async function render(name, svg, size) {
  const file = path.join(outDir, name);
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(file);
  console.log("✓", name, `${size}×${size}`);
}

await render("icon-192.png", tileSvg, 192);
await render("icon-512.png", tileSvg, 512);
await render("apple-touch-icon.png", tileSvg, 180);
await render("icon-512-maskable.png", maskableSvg, 512);
console.log("done");
