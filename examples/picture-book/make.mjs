#!/usr/bin/env node
// One picture lives in one file: inline figures/*.svg into the {{placeholders}} of both sources.
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
for (const [from, to] of [["book.src.md", "book.md"], ["video.src.md", "storyboard.md"]]) {
	const source = readFileSync(path.join(HERE, from), "utf8");
	const out = source.replace(/(```[\s\S]*?```)|\{\{([^}]+)\}\}/g, (match, code, file) => {
		if (code) return match;
		const svg = readFileSync(path.join(HERE, file), "utf8").trim();
		if (!svg.startsWith("<svg")) throw new Error(`${file}: not an SVG`);
		return svg;
	});
	writeFileSync(path.join(HERE, to), out);
	console.log(`${from} -> ${to}`);
}
