#!/usr/bin/env node
// Controlled create → review → revise loop for narrated videos.
// The script owns the sequence; agents only fill single roles (reviewer, reviser) in separate pi processes.
import { execFileSync, spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";
import { encode, md } from "./lib/render.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PI = process.env.PI_BIN || "pi";

export function verdict(review) {
	return review.match(/\*\*Verdict:\*\*\s*(ready|revise|blocked)/i)?.[1].toLowerCase() ?? "unknown";
}

// One encoded frame per beat, at its midpoint: the evidence review/video.md asks for.
export function sampleTimes(manifest) {
	return manifest.beats.filter((b) => b.status === "completed").map((b) => ({ id: b.id, at: (b.startSeconds + b.endSeconds) / 2 }));
}

const read = (file) => (existsSync(file) ? readFileSync(file, "utf8") : "");
const STATUS = /\b(R\d+) · (must fix|should fix|optional|resolved|partial|still open) ·/g;

// Timestamps in findings become links that seek that pass's video; severities become badges.
export function decorate(html) {
	return html
		.replace(STATUS, (_, id, s) => `${id} <span class="sev s-${s.replace(" ", "-")}">${s}</span>`)
		.replace(/\b(\d{2}):(\d{2}(?:\.\d+)?)\b/g, (t, m, s) => `<a href="#" class="t" data-t="${Number(m) * 60 + Number(s)}">${t}</a>`);
}

// One self-contained page per loop: a tab per pass with video, frames, review and the author's changes.
export function loopReport(out) {
	const state = JSON.parse(readFileSync(path.join(out, "loop.json"), "utf8"));
	const passes = readdirSync(out).filter((d) => /^pass-\d+$/.test(d)).sort((a, b) => a.slice(5) - b.slice(5));
	const live = !state.finishedAt && !state.paused;
	const tabs = [], panels = [];
	for (const dir of passes) {
		const n = dir.slice(5), review = read(path.join(out, dir, "review.md"));
		const manifest = JSON.parse(read(path.join(out, dir, "run", "manifest.json")) || "null");
		const v = review ? verdict(review) : "pending";
		const counts = Object.entries([...review.matchAll(STATUS)].reduce((c, m) => ({ ...c, [m[2]]: (c[m[2]] ?? 0) + 1 }), {}))
			.map(([s, k]) => `<span class="sev s-${s.replace(" ", "-")}">${k} ${s}</span>`).join(" ");
		const frames = existsSync(path.join(out, dir, "frames")) ? readdirSync(path.join(out, dir, "frames")).filter((f) => f.endsWith(".png")).sort() : [];
		const beats = Object.fromEntries((manifest?.beats ?? []).map((b) => [b.id, b]));
		const strip = frames.map((f) => {
			const [id, at] = f.replace(/\.png$/, "").split("-");
			return `<a href="#" class="t frame" data-t="${at}" title="${encode(beats[id]?.narration ?? "")}"><img src="${dir}/frames/${f}" alt="" loading="lazy"><span>${id} · ${encode(beats[id]?.title ?? "")}</span></a>`;
		}).join("");
		const changes = read(path.join(out, dir, "changes.md"));
		tabs.push(`<button data-pass="${n}"><b>Pass ${n}</b><span class="v v-${v}">${v}</span></button>`);
		const media = manifest?.status === "completed" ? `<video src="${dir}/run/video.mp4"${frames[0] ? ` poster="${dir}/frames/${frames[0]}"` : ""} controls playsinline preload="metadata"></video>` : `<div class="empty">${manifest ? manifest.status : "not rendered yet"}</div>`;
		const links = `${manifest ? `${(manifest.durationSeconds ?? 0).toFixed(1)}s · ${manifest.beats.length} beats · ` : ""}<a href="${dir}/storyboard.md">storyboard.md</a>${manifest ? ` · <a href="${dir}/run/preview.html">run preview</a>` : ""}${review ? ` · <a href="${dir}/review.md">review.md</a>` : ""}`;
		// The report's header lines are single-newline separated; give each its own paragraph.
		const body = review ? decorate(md(review.replace(/\n(?=\*\*(Verdict|Audience|Coverage))/g, "\n\n"))) : `<p class="empty">${live ? "Review in progress…" : "No review."}</p>`;
		panels.push(`<section class="pass" data-pass="${n}"><div class="cols">
<article class="review"><div class="counts">${counts}</div>${body}
${changes ? `<details class="changes"><summary>Author's changes that produced this pass</summary>${md(changes)}</details>` : ""}</article>
<aside>${media}<p class="meta">${links}</p><div class="strip">${strip}</div></aside></div></section>`);
	}
	const trail = state.steps.map((s) => `<li><time>${s.at.slice(11, 19)}</time> pass ${s.pass} · ${encode(s.event)}${s.verdict ? ` · <span class="v v-${s.verdict}">${s.verdict}</span>` : ""}${s.notes ? ` · notes: ${encode(s.notes)}` : ""}</li>`).join("");
	return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${live ? '<meta http-equiv="refresh" content="5">' : ""}
<title>Review loop · ${encode(path.basename(state.input))}</title>
<style>
:root{--paper:#fbf8f2;--ink:#2a2723;--muted:#7b7468;--rule:#e3dbcc;--accent:#b4472f;--blue:#2e6a8a;--green:#4a7a3a;--amber:#a87a1e;--card:#fffdf8;
--sans:'Avenir Next',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;--mono:ui-monospace,SFMono-Regular,Menlo,monospace}
@media (prefers-color-scheme:dark){:root{--paper:#131211;--ink:#efe9dd;--muted:#918a7d;--rule:#2c2926;--accent:#d2603f;--blue:#6aa2c2;--green:#7fb069;--amber:#d6a64a;--card:#1a1917}}
*{box-sizing:border-box}body{margin:0;padding:36px 32px 80px;background:var(--paper);color:var(--ink);font:15px/1.55 var(--sans)}
main{max-width:1240px;margin:0 auto}a{color:var(--blue)}
.kicker{margin:0 0 8px;font:11px/1 var(--mono);letter-spacing:.16em;text-transform:uppercase;color:var(--accent)}
h1{margin:0 0 6px;font-size:28px;letter-spacing:-.02em;font-weight:600}
.meta{font:12px/1.5 var(--mono);color:var(--muted)}
nav{display:flex;gap:8px;margin:22px 0;border-bottom:1px solid var(--rule)}
nav button{all:unset;cursor:pointer;padding:10px 14px;display:flex;gap:10px;align-items:center;border-bottom:2px solid transparent;margin-bottom:-1px}
nav button[aria-selected=true]{border-color:var(--accent)}
.v,.sev{font:10.5px/1 var(--mono);letter-spacing:.08em;text-transform:uppercase;padding:4px 6px;border-radius:3px;border:1px solid currentColor;white-space:nowrap}
.v-ready,.s-resolved{color:var(--green)}.v-revise,.s-should-fix,.s-partial{color:var(--amber)}.v-blocked,.v-unknown,.s-must-fix,.s-still-open{color:var(--accent)}.v-pending,.s-optional{color:var(--muted)}
.pass{display:none}.pass.on{display:block}
.cols{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,520px);gap:36px;align-items:start}\naside{position:sticky;top:16px}.cols>*{min-width:0}.meta{overflow-wrap:anywhere}.review pre{overflow:auto}
video,.empty{width:100%;display:block;background:#000;border:1px solid var(--rule);aspect-ratio:16/9}
.empty{display:grid;place-items:center;background:var(--card);color:var(--muted);font:12px var(--mono)}
.strip{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;max-height:calc(100vh - 380px);overflow:auto}
.frame{text-decoration:none;color:var(--muted);font:10.5px/1.3 var(--mono)}.frame img{width:100%;display:block;border:1px solid var(--rule);aspect-ratio:16/9;object-fit:cover}
.frame:hover img{border-color:var(--accent)}
.counts{margin:0 0 4px;display:flex;gap:8px;flex-wrap:wrap}
.review{max-width:80ch}.review h4{font-size:22px;margin:22px 0 10px;font-weight:600}.review h3{margin:28px 0 8px;font:600 11px/1 var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
.review>ul>li{margin:0 0 18px;padding:12px 16px;background:var(--card);border:1px solid var(--rule);border-radius:3px;list-style:none}
.review>ul{padding:0}.review li li{margin:4px 0}
.review code,.changes code{font:12.5px var(--mono)}
a.t{font-family:var(--mono);font-size:.92em}
.changes{margin-top:28px;font-size:14px}.changes summary{cursor:pointer;color:var(--muted);font:11px var(--mono);letter-spacing:.1em;text-transform:uppercase}
ol.trail{font:12px/1.7 var(--mono);color:var(--muted);padding-left:18px}ol.trail time{color:var(--ink)}
@media (max-width:900px){.cols{grid-template-columns:1fr}aside{position:static;order:-1}.strip{grid-template-columns:repeat(3,1fr);max-height:none}body{padding:24px 16px}}
</style>
<main><p class="kicker">review loop${state.paused ? " · awaiting director feedback; reload after resuming" : live ? " · running, refreshing every 5s" : ""}</p><h1>${encode(path.basename(state.input))}</h1>
<p class="meta">${passes.length}/${state.passes} passes · started ${state.startedAt.replace("T", " ").slice(0, 19)}${state.final ? ` · final: pass ${state.final.pass}, <span class="v v-${state.final.verdict}">${state.final.verdict}</span>` : ""}</p>
<nav>${tabs.join("")}</nav>
${panels.join("\n")}
<h3 class="kicker" style="margin-top:40px">Steps</h3><ol class="trail">${trail}</ol></main>
<script>
const show = (n) => { document.querySelectorAll(".pass").forEach((p) => p.classList.toggle("on", p.dataset.pass === n));
  document.querySelectorAll("nav button").forEach((b) => b.setAttribute("aria-selected", b.dataset.pass === n)); location.hash = "pass-" + n; };
document.querySelectorAll("nav button").forEach((b) => b.onclick = () => show(b.dataset.pass));
const buttons = [...document.querySelectorAll("nav button")];
show(location.hash.slice(6) && document.querySelector('.pass[data-pass="' + location.hash.slice(6) + '"]') ? location.hash.slice(6) : buttons.at(-1)?.dataset.pass);
document.addEventListener("click", (e) => { const a = e.target.closest("a.t"); if (!a) return; e.preventDefault();
  const v = a.closest(".pass").querySelector("video"); if (!v) return; v.currentTime = Number(a.dataset.t); v.play(); v.scrollIntoView({ block: "nearest", behavior: "smooth" }); });
</script></html>
`;
}

function agent(role, prompt, { tools, model, log }) {
	const args = ["-p", "--no-session", "--tools", tools, "--skill", HERE, ...(model ? ["--model", model] : []), prompt];
	const result = spawnSync(PI, args, { encoding: "utf8", maxBuffer: 64 << 20 });
	writeFileSync(log, `$ ${PI} ${args.slice(0, -1).join(" ")}\n\n${prompt}\n\n--- stdout ---\n${result.stdout}\n--- stderr ---\n${result.stderr}`);
	if (result.status !== 0) throw new Error(`${role} agent failed (exit ${result.status}); see ${log}`);
	return result.stdout.trim();
}

function reviewPrompt(pass, previous) {
	return [
		`You are the reviewer in pass ${pass.n} of a controlled explainer-video loop. Read ${HERE}/review/review.md and ${HERE}/review/video.md, then review this render.`,
		`Run directory: ${pass.run} (source.md, manifest.json, captions.vtt, video.mp4).`,
		`Encoded frames, one per beat at its midpoint, are in ${pass.frames} (named <beat>-<seconds>.png). Read every one with the read tool.`,
		`Run \`node ${HERE}/video.mjs ${pass.run} --inspect\` and transcribe ${pass.run}/video.mp4 with transcribe_file.`,
		previous ? `Previous review: ${previous}. Mark each previous finding ID resolved, partial or still open with fresh evidence; add new issues with new IDs.` : "",
		"Do not modify any file. Output only the Markdown report in the review.md format, starting with `# Review:`.",
	].filter(Boolean).join("\n");
}

function revisePrompt(storyboard, review, notes) {
	return [
		`You are the author in a controlled explainer-video loop. Revise the storyboard ${storyboard} against the review ${review}.`,
		`Follow the video-script rules in ${HERE}/SKILL.md. Fix the findings in Next pass order, then the remaining must-fix items; preserve the Keep items.`,
		notes ? `The human director added notes; they override the review where they conflict:\n${notes}` : "",
		`Edit only ${storyboard}. Run \`node ${HERE}/video.mjs ${storyboard} --check\` and fix any errors. Do not render.`,
		"Finish with a short list: finding ID → what you changed (or why you did not).",
	].filter(Boolean).join("\n");
}

async function ask(question) {
	const rl = createInterface({ input: process.stdin, output: process.stdout });
	try { return (await rl.question(question)).trim(); } finally { rl.close(); }
}

export async function runLoop(input, out, { passes = 2, pause = false, reviewModel, reviseModel } = {}) {
	if (!Number.isSafeInteger(passes) || passes < 1) throw new Error("passes must be a positive safe integer");
	if (existsSync(out)) throw new Error(`Output directory already exists: ${out}`);
	mkdirSync(out, { recursive: true });
	const state = { input, passes, startedAt: new Date().toISOString(), steps: [] };
	const save = () => {
		writeFileSync(path.join(out, "loop.json"), JSON.stringify(state, null, 2) + "\n");
		writeFileSync(path.join(out, "report.html"), loopReport(out));
	};
	const step = (event) => { state.steps.push({ at: new Date().toISOString(), ...event }); save(); console.log(`[loop] ${Object.values(event).join(" · ")}`); };
	let currentPass = 1;
	try {
		let storyboard = path.join(out, "pass-1", "storyboard.md");
		mkdirSync(path.dirname(storyboard));
		copyFileSync(input, storyboard); // the user's file is never edited
		save();
		console.log(`[loop] report: ${path.join(out, "report.html")}`);
		let previous;
		for (let n = 1; n <= passes; n++) {
			currentPass = n;
			const dir = path.join(out, `pass-${n}`);
			const pass = { n, run: path.join(dir, "run"), frames: path.join(dir, "frames") };
			execFileSync("node", [path.join(HERE, "video.mjs"), storyboard, "-o", pass.run], { stdio: "inherit" });
			step({ pass: n, event: "rendered", run: pass.run });
			mkdirSync(pass.frames);
			for (const { id, at } of sampleTimes(JSON.parse(readFileSync(path.join(pass.run, "manifest.json"), "utf8"))))
				execFileSync("ffmpeg", ["-v", "error", "-nostdin", "-n", "-ss", at.toFixed(3), "-i", path.join(pass.run, "video.mp4"), "-frames:v", "1", path.join(pass.frames, `${id}-${at.toFixed(2)}.png`)]);
			const review = path.join(dir, "review.md");
			writeFileSync(review, agent("reviewer", reviewPrompt(pass, previous), { tools: "read,bash,transcribe_file", model: reviewModel, log: path.join(dir, "review.log") }) + "\n");
			const result = verdict(readFileSync(review, "utf8"));
			step({ pass: n, event: "reviewed", verdict: result, review });
			state.final = { pass: n, storyboard, video: path.join(pass.run, "video.mp4"), review, verdict: result };
			save();
			if (result !== "revise" || n === passes) break;
			let notes = "";
			if (pause) {
				state.paused = true;
				save();
				const answer = await ask(`Review: ${review}\nEnter = revise · type notes for the author · q = stop: `);
				state.paused = false;
				save();
				if (answer === "q") { step({ pass: n, event: "stopped by director" }); break; }
				notes = answer;
			}
			currentPass = n + 1;
			const next = path.join(out, `pass-${n + 1}`, "storyboard.md");
			mkdirSync(path.dirname(next));
			copyFileSync(storyboard, next);
			const changes = agent("reviser", revisePrompt(next, review, notes), { tools: "read,edit,bash", model: reviseModel, log: path.join(out, `pass-${n + 1}`, "revise.log") });
			writeFileSync(path.join(out, `pass-${n + 1}`, "changes.md"), changes + "\n");
			step({ pass: n + 1, event: "revised", storyboard: next, ...(notes ? { notes } : {}) });
			storyboard = next;
			previous = review;
		}
		state.finishedAt = new Date().toISOString();
		save();
		return state;
	} catch (error) {
		state.paused = false;
		state.finishedAt = new Date().toISOString();
		step({ pass: currentPass, event: `failed: ${error.message}` });
		throw error;
	}
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	const args = process.argv.slice(2);
	const opt = (name) => { const i = args.indexOf(name); return i < 0 ? undefined : args.splice(i, 2)[1]; };
	const flag = (name) => { const i = args.indexOf(name); return i >= 0 && Boolean(args.splice(i, 1)); };
	if (args[1] === "--report" && args.length === 2) {
		const out = path.resolve(args[0]);
		writeFileSync(path.join(out, "report.html"), loopReport(out));
		console.log(path.join(out, "report.html"));
		process.exit(0);
	}
	const out = opt("-o"), passes = Number(opt("--passes") ?? 2), reviewModel = opt("--review-model"), reviseModel = opt("--revise-model"), pause = flag("--pause");
	if (args.length !== 1 || !out || !Number.isSafeInteger(passes) || passes < 1) {
		console.error("usage: node loop.mjs storyboard.md -o NEW_DIR [--passes 2] [--pause] [--review-model M] [--revise-model M] | loop-dir --report");
		process.exitCode = 1;
	} else {
		try {
			const { final } = await runLoop(path.resolve(args[0]), path.resolve(out), { passes, pause, reviewModel, reviseModel });
			console.log(`\nFinal: pass ${final.pass} · verdict ${final.verdict}\n  storyboard ${final.storyboard}\n  video      ${final.video}\n  review     ${final.review}`);
		} catch (error) { console.error(error.message); process.exitCode = 1; }
	}
}
