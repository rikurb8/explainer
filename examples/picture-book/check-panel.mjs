// Self-check for the simulated machine on page five and its generated book.
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const html = readFileSync(path.join(HERE, "index.html"), "utf8");
const script = html.match(/<script>([\s\S]*?)function plan[\s\S]*?<\/script>/)?.[0];
if (!script) throw new Error("index.html: the panel script is missing");

// The page guards its DOM work behind `typeof document`, so the pure part runs here unchanged.
const source = script.replace(/<\/?script>/g, "");
const { plan, clockOf } = new Function(`${source}\nreturn { plan, clockOf };`)();

const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
const checks = [
	[new Set(ids).size === ids.length, "all inline SVG and panel IDs are unique"],
	[(html.match(/\{\{figures\/ch01\.svg\}\}/g) ?? []).length === 2, "both reference snippets preserve the figure placeholder"],
	[(html.match(/<svg\b/g) ?? []).length === 11, "all eleven illustrations are inlined"],
	[plan(11, 1) === 171, "eleven pages at 1.0x is 171 s"],
	[plan(11, 2) < plan(11, 1), "a faster pace is shorter"],
	[plan(11, 0.3) > plan(11, 1), "a slower pace is longer"],
	[plan(16, 1) > plan(4, 1), "more pages take longer"],
	[clockOf(171) === "2 min 51 s", `clockOf(171) = ${clockOf(171)}`],
	[clockOf(60) === "1 min 00 s", `clockOf(60) = ${clockOf(60)}`],
];
for (const [ok, what] of checks) if (!ok) throw new Error(`panel: ${what}`);
console.log(`panel ok: ${plan(11, 1)} s at 1.0x, ${clockOf(plan(11, 1))}`);
