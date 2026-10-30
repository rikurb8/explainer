import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { flow } from "./lib/diagrams.mjs";
import test from "node:test";
import { runInNewContext } from "node:vm";
import { build } from "./build.mjs";
import { createVideoRun, inspectRun, motion, paceReport, parseVideo, previewRun, renderVideo, resolveTts, storyboard, synthesize, timestamp } from "./video.mjs";

const source = "---\ntitle: Demo\n---\n# First\n\nA **visual**.\n\n:::narration\nFirst sentence.\n\nSecond sentence.\n:::\n";

test("parse scenes and narration, keeping narration out of visuals", () => {
	const video = parseVideo(source.replace(/\n/g, "\r\n"));
	assert.equal(video.title, "Demo");
	assert.deepEqual(video.scenes[0].beats, ["First sentence.", "Second sentence."]);
	assert.match(video.scenes[0].html, /<strong>visual<\/strong>/);
	assert.doesNotMatch(video.scenes[0].html, /First sentence/);
});

test("reject empty, missing, duplicate and oversized narration and missing visuals", () => {
	assert.throws(() => parseVideo(""), /at least one/);
	assert.throws(() => parseVideo("# Scene\nVisual"), /expected one/);
	assert.throws(() => parseVideo(source + "\n:::narration\nAgain\n:::\n"), /expected one/);
	assert.throws(() => parseVideo(source.replace("First sentence.\n\nSecond sentence.", "")), /1–240/);
	assert.throws(() => parseVideo(source.replace("First sentence.", "x".repeat(241))), /1–240/);
	assert.throws(() => parseVideo(source.replace("A **visual**.", "")), /missing visual/);
});

test("timestamps handle rounding across minute and hour boundaries", () => {
	assert.equal(timestamp(0), "00:00:00.000");
	assert.equal(timestamp(59.9996), "00:01:00.000");
	assert.equal(timestamp(3600.125), "01:00:00.125");
});

test("motion filter snaps in 6% over 12 frames and then holds", () => {
	const filter = motion(8), frames = Math.round(8 * 30);
	assert.match(filter, new RegExp(`d=${frames}:s=1280x720:fps=30`));
	assert.match(filter, /fade=t=in:st=0:d=0\.12/);
	const [settle, from, slope] = filter.match(/if\(lt\(on,(\d+)\),(\d+\.\d+)-on\*(\d+\.\d+),1\)/).slice(1).map(Number);
	assert.equal(settle, 12);
	assert.ok(Math.abs(from - settle * slope - 1) < 0.0001, "settles at 100% after the snap");
	// A beat shorter than the snap cannot burn all twelve frames on it.
	assert.match(motion(0.3), /if\(lt\(on,9\),/);
});

test("word cards render as big words and lose the caption line", () => {
	const video = parseVideo(source.replace("A **visual**.", ':::flash\nCut it\nShort\n:::').replace("First sentence.", "Cut it short."));
	assert.equal(video.scenes[0].flash, true);
	assert.match(video.scenes[0].html, /<div class="flash"><b>Cut it<\/b><b>Short<\/b><\/div>/);
	assert.doesNotMatch(storyboard(video), /class="caption"/);
	assert.match(storyboard(parseVideo(source)), /class="caption"/);
	assert.throws(() => parseVideo(source.replace("A **visual**.", ':::flash\n:::')), /flash needs at least one line/);
});

test("pace report counts shots, not beats, and shows the rhythm", () => {
	const script = (hold) => `---\npause: 0.1\n---\n# A\nV\n:::narration${hold}\nOne two three four.\n:::\n# B\n:::flash\nBig\n:::\n:::narration\nFive.\n:::\n`;
	const even = paceReport(parseVideo(script("")));
	assert.match(even, /2 shots, 2 beats, 5 words/);
	assert.match(even, /1 word cards/);
	assert.match(even, /rhythm [▁▂▃▄▅▆▇█]{2}  mean \d+\.\ds/);
	assert.doesNotMatch(even, /several beats|over 12 words/);
	// A hold only lands on the scene's last beat, so it lengthens the shot the viewer sits on.
	const held = paceReport(parseVideo(script(" hold=1.2")));
	const seconds = (report) => Number(report.match(/about (\d+)s/)[1]);
	assert.ok(seconds(held) - seconds(even) >= 1, "the hold adds about itself to the runtime");
	assert.match(held, /longest\/shortest \d+\.\d/);
	// Two beats behind one visual are one shot, which is what the viewer sees.
	const shared = paceReport(parseVideo(source));
	assert.match(shared, /1 shots, 2 beats/);
	assert.match(shared, /1 scenes hold several beats/);
	assert.throws(() => parseVideo("---\npause: 99\n---\n# A\nV\n:::narration\nHi.\n:::\n"), /pause must be 0–3/);
	assert.throws(() => parseVideo(source.replace(":::narration", ":::narration hold=9")), /hold=0–3/);
	assert.throws(() => parseVideo(source.replace(":::narration", ":::narration fast")), /hold=0–3/);
});

test("motion kinds: slides snap, cards cut, code sits still", () => {
	assert.match(motion(4, "snap"), /zoompan=z='if\(lt\(on,\d+\),1\.06-on\*/);
	assert.match(motion(4, "snap"), /fade=t=in:st=0:d=0\.12/);
	assert.match(motion(4, "cut"), /zoompan=z='1'/);
	assert.match(motion(4, "cut"), /fade=t=in/);
	assert.match(motion(4, "still"), /zoompan=z='1'/);
	assert.doesNotMatch(motion(4, "still"), /fade/);
	const kinds = (visual) => parseVideo(source.replace("A **visual**.", visual)).scenes[0].kind;
	assert.equal(kinds(':::flash\nWord\n:::'), "cut");
	assert.equal(kinds("```js\ncode();\n```"), "still");
	assert.equal(kinds("Plain text."), "snap");
});

test("storyboard safely embeds spoken text and reuses diagram rendering", () => {
	const video = parseVideo(source.replace("First sentence.", "</script><script>alert(1)</script>"));
	const html = storyboard(video);
	assert.ok(!html.includes("</script><script>alert(1)</script>"));
	assert.match(html, /&lt;\/script&gt;/);
	assert.match(html, /\\u003c\/script>/);
	const demo = parseVideo(readFileSync(new URL("./examples/video/explainer.md", import.meta.url), "utf8"));
	assert.equal(demo.scenes.length, 7);
	assert.match(storyboard(demo), /<svg/);
});

test("scene selection updates captions and reveals flow destinations with their arrows", () => {
	const steps = Array.from({ length: 5 }, (_, i) => ({
		style: { getPropertyValue: () => String(i + 1) },
		classList: { contains: () => i === 1 || i === 3 },
	}));
	const caption = {};
	const scene = { style: {}, querySelector: () => caption, querySelectorAll: () => [{ querySelectorAll: () => steps }] };
	const other = { style: {} };
	const html = storyboard({ title: "Test", scenes: [{ title: "One", html: "Visual", beats: ["First", "Second", "Third"] }] });
	const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
	runInNewContext(script, {
		URLSearchParams,
		location: { search: "?scene=0&beat=0" },
		document: { querySelectorAll: () => [scene, other] },
	});
	assert.equal(caption.textContent, "First");
	assert.equal(other.style.display, "none");
	assert.equal(steps[2].style.opacity, "");
	assert.equal(steps[3].style.opacity, "0");
	assert.equal(steps[4].style.opacity, "0");
});

test("run archive retains source and generated assets with hashes and command traces", (t) => {
	const root = mkdtempSync(path.join(tmpdir(), "video-archive-test-"));
	t.after(() => rmSync(root, { recursive: true, force: true }));
	const output = path.join(root, "run");
	const archive = createVideoRun(output, { source, input: "original.md", title: "Demo" });
	const initial = JSON.parse(readFileSync(path.join(output, "manifest.json"), "utf8"));
	assert.equal(initial.status, "running");
	assert.equal(initial.finishedAt, undefined);
	assert.equal(readFileSync(path.join(output, "source.md"), "utf8"), source);
	assert.equal(archive.command(process.execPath, ["-e", "process.stdout.write('ok')"]), "ok");
	writeFileSync(path.join(output, "assets/000.txt"), "Voice text");
	archive.manifest.beats.push({ assets: { narration: "assets/000.txt" } });
	archive.finish("completed");
	const manifest = JSON.parse(readFileSync(path.join(output, "manifest.json"), "utf8"));
	assert.equal(manifest.status, "completed");
	assert.ok(manifest.finishedAt);
	assert.deepEqual(manifest.artifacts.map((a) => a.path), ["source.md", "assets/000.txt"]);
	assert.equal(manifest.artifacts[1].sha256, createHash("sha256").update("Voice text").digest("hex"));
	assert.equal(manifest.artifacts[1].bytes, 10);
	assert.ok(!readdirSync(output).includes("manifest.json.tmp"));
	const events = readFileSync(path.join(output, "trace.jsonl"), "utf8").trim().split("\n").map(JSON.parse);
	assert.deepEqual(events.map((e) => e.event), ["run.started", "command.started", "command.completed", "run.completed"]);
	assert.deepEqual(events[1].args, ["-e", "process.stdout.write('ok')"]);
	assert.throws(() => createVideoRun(output, { source: "overwrite", title: "No" }), /EEXIST/);
	assert.equal(readFileSync(path.join(output, "source.md"), "utf8"), source);
});

test("failed commands leave useful diagnostics and partial asset inventories", (t) => {
	const root = mkdtempSync(path.join(tmpdir(), "video-failure-test-"));
	t.after(() => rmSync(root, { recursive: true, force: true }));
	const output = path.join(root, "run");
	const archive = createVideoRun(output, { source, input: "original.md", title: "Demo" });
	archive.manifest.beats.push({ assets: { frame: "assets/missing.png" } });
	let failure;
	try { archive.command(process.execPath, ["-e", "process.stderr.write('voice unavailable'); process.exit(2)"]); }
	catch (error) { failure = error; }
	assert.match(failure.message, /voice unavailable/);
	archive.finish("failed", failure);
	const manifest = JSON.parse(readFileSync(path.join(output, "manifest.json"), "utf8"));
	assert.equal(manifest.status, "failed");
	assert.match(manifest.error, /voice unavailable/);
	assert.equal(manifest.artifacts.length, 1);
	const events = readFileSync(path.join(output, "trace.jsonl"), "utf8").trim().split("\n").map(JSON.parse);
	assert.equal(events[2].exitCode, 2);
	assert.equal(events[2].stderr, "voice unavailable");
});

test("renderer records preflight failures rather than losing the run", (t) => {
	const root = mkdtempSync(path.join(tmpdir(), "video-preflight-test-"));
	t.after(() => rmSync(root, { recursive: true, force: true }));
	const input = path.join(root, "input.md"), output = path.join(root, "run");
	writeFileSync(input, source);
	const previous = process.env.CHROME_PATH;
	process.env.CHROME_PATH = path.join(root, "missing-chrome");
	try { assert.throws(() => renderVideo(input, output), /Partial output and trace retained/); }
	finally {
		if (previous === undefined) delete process.env.CHROME_PATH;
		else process.env.CHROME_PATH = previous;
	}
	const manifest = JSON.parse(readFileSync(path.join(output, "manifest.json"), "utf8"));
	assert.equal(manifest.status, "failed");
	assert.match(manifest.error, /Chrome not found|uses macOS/);
	assert.equal(manifest.sourceSha256, manifest.artifacts[0].sha256);
});

test("tts configuration defaults to voxtral and accepts provider overrides", () => {
	assert.deepEqual(parseVideo(source).tts, { provider: "mistral", model: "voxtral-mini-tts-3-0", voice: "gb_jane_neutral", rate: 155, speed: 1 });
	const local = parseVideo(source.replace("title: Demo", "title: Demo\ntts-provider: say"));
	assert.equal(local.tts.provider, "say");
	assert.equal(local.tts.voice, "Samantha");
	const mistral = parseVideo(source.replace("title: Demo", "title: Demo\ntts-voice: voice_478\ntts-speed: 1.4"));
	assert.equal(mistral.tts.provider, "mistral");
	assert.equal(mistral.tts.voice, "voice_478");
	assert.equal(mistral.tts.speed, 1.4);
	assert.throws(() => parseVideo(source.replace("title: Demo", "title: Demo\ntts-speed: 4")), /tts-speed must be 0.5–2/);
	assert.throws(() => parseVideo(source.replace("title: Demo", "title: Demo\ntts-provider: aws")), /unknown provider/);
});

test("voxtral needs a key; a Mac without one falls back to the local say voice", () => {
	const keyed = { MISTRAL_API_KEY: "sk-test" }, voxtral = parseVideo(source).tts;
	assert.deepEqual(resolveTts(voxtral, keyed, "linux"), voxtral);
	const fallback = resolveTts(voxtral, {}, "darwin");
	assert.equal(fallback.provider, "say");
	assert.equal(fallback.voice, "Samantha");
	assert.equal(fallback.speed, voxtral.speed);
	assert.equal(voxtral.provider, "mistral", "the declared voice is not mutated");
	assert.throws(() => resolveTts(voxtral, {}, "linux"), /Set MISTRAL_API_KEY/);
	const local = parseVideo(source.replace("title: Demo", "title: Demo\ntts-provider: say")).tts;
	assert.deepEqual(resolveTts(local, {}, "darwin"), local);
	assert.throws(() => resolveTts(local, keyed, "linux"), /needs macOS/);
});

test("mistral provider posts a request, decodes audio, and keeps the API key out of command arguments", (t) => {
	const root = mkdtempSync(path.join(tmpdir(), "video-mistral-test-"));
	t.after(() => rmSync(root, { recursive: true, force: true }));
	const calls = [];
	const run = (cmd, args) => {
		calls.push({ cmd, args, files: Object.fromEntries(args.filter((a) => a.startsWith("@")).map((a) => [a.slice(1), readFileSync(a.slice(1), "utf8")])) });
		return JSON.stringify({ audio_data: Buffer.from("fake audio").toString("base64") });
	};
	const previous = process.env.MISTRAL_API_KEY;
	process.env.MISTRAL_API_KEY = "sk-test-key";
	try {
		const audio = path.join(root, "000.wav");
		synthesize(run, { provider: "mistral", model: "voxtral-mini-tts-3-0", voice: "voice_478" }, "Hello.", audio);
		assert.equal(readFileSync(audio, "utf8"), "fake audio");
		assert.equal(calls[0].cmd, "curl");
		assert.ok(calls[0].args.includes("--retry"), "one transient 5xx must not end the run");
		assert.ok(!JSON.stringify(calls[0].args).includes("sk-test-key"));
		const request = JSON.parse(Object.values(calls[0].files).find((f) => f.startsWith("{")));
		assert.deepEqual(request, { model: "voxtral-mini-tts-3-0", input: "Hello.", voice_id: "voice_478", response_format: "wav" });
		assert.ok(Object.values(calls[0].files).some((f) => f.includes("sk-test-key")));
		delete process.env.MISTRAL_API_KEY;
		assert.throws(() => synthesize(run, { provider: "mistral" }, "Hello.", audio), /MISTRAL_API_KEY/);
	} finally {
		if (previous === undefined) delete process.env.MISTRAL_API_KEY;
		else process.env.MISTRAL_API_KEY = previous;
	}
	assert.ok(!existsSync(path.join(root, ".mistral-auth.txt")));
});

test("every checkpoint writes a self-refreshing preview of the run", (t) => {
	const root = mkdtempSync(path.join(tmpdir(), "video-preview-test-"));
	t.after(() => rmSync(root, { recursive: true, force: true }));
	const run = path.join(root, "run");
	const archive = createVideoRun(run, { source, input: "demo.md", title: "Demo" });
	archive.manifest.beats.push({ id: "000", title: "First", narration: "First sentence.", hold: 0.1, kind: "cut", status: "running", assets: { frame: "assets/000.png" } });
	archive.save();
	const html = readFileSync(path.join(run, "preview.html"), "utf8");
	// Status text is asserted without its markup, so the design can change freely.
	const text = (page) => page.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
	assert.match(html, /<meta http-equiv="refresh" content="2">/);
	assert.match(text(html), /running · live, refreshing every 2s · 0\/1 beats/);
	assert.match(html, /First sentence\./);
	// A frame that has not been captured yet is a broken image, not a placeholder.
	assert.doesNotMatch(html, /<img/);
	assert.doesNotMatch(html, /<video/);
	writeFileSync(path.join(run, "assets", "000.png"), "fake png");
	writeFileSync(path.join(run, "video.mp4"), "fake video");
	archive.manifest.beats[0].status = "completed";
	writeFileSync(path.join(run, "preview.html"), previewRun(run, archive.manifest));
	const done = readFileSync(path.join(run, "preview.html"), "utf8");
	assert.match(done, /<img src="assets\/000.png"/);
	assert.match(done, /<video src="video.mp4"/);
	// A finished run must stop refreshing, or the player is rebuilt before it can play.
	archive.manifest.status = "completed";
	archive.manifest.finishedAt = new Date(Date.parse(archive.manifest.startedAt) + 4200).toISOString();
	writeFileSync(path.join(run, "preview.html"), previewRun(run, archive.manifest));
	const finished = readFileSync(path.join(run, "preview.html"), "utf8");
	assert.doesNotMatch(finished, /http-equiv="refresh"/);
	assert.match(text(finished), /completed · 1\/1 beats/);
	assert.match(text(finished), /s render/);
});

test("inspect reports measured speech, not a formula's drift", (t) => {
	const root = mkdtempSync(path.join(tmpdir(), "video-inspect-test-"));
	t.after(() => rmSync(root, { recursive: true, force: true }));
	const run = path.join(root, "run");
	const archive = createVideoRun(run, { source, input: "demo.md", title: "Demo" });
	// A run that fell back to say records the voice that actually spoke, which is what --inspect must report.
	archive.manifest.settings = { tts: { provider: "say", voice: "Samantha", rate: 155, speed: 1 } };
	// Ten words in 8s against five in 2s: the first speaks at half the rate of the run's median.
	archive.manifest.beats.push(
		{ id: "000", title: "First", narration: "one two three four five six seven eight nine ten", hold: 0.1, kind: "cut", status: "completed", audioSeconds: 8, durationSeconds: 8.1, assets: {} },
		{ id: "001", title: "Second", narration: "one two three four five", hold: 0.1, kind: "cut", status: "completed", audioSeconds: 2, durationSeconds: 2.1, assets: {} },
	);
	archive.manifest.durationSeconds = 10.2;
	archive.save();
	const report = inspectRun(run);
	assert.match(report, /2 beats · 10\.2s video/);
	assert.match(report, /say · measured 2\.50 words\/s · estimated 2\.58 for --check/);
	assert.match(report, /000\s+10\s+8\.0\s+1\.25\s+-\d+%/);
	assert.match(report, /holds 0\.2s \(2% of runtime\) · estimate \d+s vs 10s rendered/);
	assert.match(report, /000 spoke at 1\.25 words\/s, -50% against the run/);
	assert.doesNotMatch(report, /001 spoke at/);
	// A slow short line is lead-in and commas, not a line with words to move.
	archive.manifest.beats[1].audioSeconds = 4;
	archive.save();
	assert.doesNotMatch(inspectRun(run), /001 spoke at/);
});

// Every coordinate in a path is a number pair: the centreline including the elbow control points.
const segments = (d) => {
	const n = d.match(/-?[\d.]+/g).map(Number), points = [];
	for (let i = 0; i + 1 < n.length; i += 2) points.push([n[i], n[i + 1]]);
	return points;
};

test("flow routes between rows with elbows, one lane per direction, and a pulse on every arrow", () => {
	const html = flow("row \"a\"\nbox a \"Source\"\nbox b \"Sink\"\nrow \"b\"\nbox c \"Store\"\narrow a -> c \"write\"\narrow c -> a \"read\"", { id: "t", label: "test", animate: true });
	const arrows = [...html.matchAll(/<path class="pulse" d="([^"]+)"/g)].map((m) => m[1]);
	assert.equal(arrows.length, 2);
	for (const d of arrows) {
		assert.match(d, /Q/, "corners are rounded, not mitred");
		// Every straight run is axis-aligned: an elbow, never a diagonal through the boxes it passes.
		const points = segments(d);
		for (let i = 1; i < points.length; i++) assert.ok(points[i][0] === points[i - 1][0] || points[i][1] === points[i - 1][1], `diagonal segment in ${d}`);
	}
	// Opposite directions share one gap, so each gets its own lane instead of overlapping.
	const lanes = arrows.map((d) => segments(d).find((p, i, all) => i > 0 && p[0] !== all[i - 1][0])[1]);
	assert.equal(new Set(lanes).size, 2, `lanes ${lanes}`);
	assert.match(html, /<path d="[^"]+"[^>]*marker-end="url\(#tm\)"\/>\s*<path class="pulse"/, "the pulse sits inside the revealed arrow group");
	assert.doesNotMatch(flow("box a \"A\"\narrow a -> a", { id: "t", label: "test" }), /class="pulse"/, "a still figure has no pulse");
	// Aligned columns still get a straight run down, with no lane to cross.
	const straight = flow("row \"a\"\nbox a \"A\"\nrow \"b\"\nbox b \"B\"\narrow a -> b", { id: "t", label: "test", animate: true }).match(/<path class="pulse" d="([^"]+)"/)[1];
	assert.equal(new Set(segments(straight).map((p) => p[0])).size, 1);
});

test("wide horizontal return-arrow labels stay separate and inside the SVG", () => {
	const html = flow('box a "A"\nbox b "B"\narrow a -> b "request"\narrow b -> a "response"', { id: "t", label: "test" });
	const [top, height] = html.match(/<rect x="[^"]+" y="([^"]+)" width="[^"]+" height="([^"]+)" rx=/).slice(1).map(Number);
	const labels = [...html.matchAll(/<text x="[^"]+" y="([^"]+)"[^>]*>(?:request|response)<\/text>/g)].map(m => Number(m[1]));
	assert.equal(labels.length, 2);
	assert.ok(labels[0] >= 10, "the upper label's background stays inside the SVG");
	assert.ok(labels[0] + 3 < top, "request stays above the boxes");
	assert.ok(labels[1] - 10 > top + height, "response stays below the boxes");
	const svgHeight = Number(html.match(/viewBox="0 0 720 ([^"]+)"/)[1]);
	assert.ok(labels[1] + 3 <= svgHeight, "the lower label stays inside the SVG");
});

test("aligned return arrows use separate columns and label sides", () => {
	const html = flow('row\nbox a "A"\nrow\nbox b "B"\narrow a -> b "write"\narrow b -> a "read"', { id: "t", label: "test", animate: true });
	const columns = [...html.matchAll(/<path class="pulse" d="([^"]+)"/g)].map(m => segments(m[1])[0][0]);
	assert.equal(columns.length, 2);
	assert.ok(columns[0] < columns[1], "down and up use different sides of the column centre");
	const labels = [...html.matchAll(/<text x="([^"]+)"[^>]*text-anchor="([^"]+)"[^>]*>(write|read)<\/text>/g)];
	assert.equal(labels.length, 2);
	assert.ok(Number(labels[0][1]) < columns[0]);
	assert.equal(labels[0][2], "end");
	assert.ok(Number(labels[1][1]) > columns[1]);
	assert.equal(labels[1][2], "start");
});

test("aligned upward arrow labels stay in the gap between rows", () => {
	const html = flow('row\nbox a "A"\nrow\nbox b "B"\narrow b -> a "read"', { id: "t", label: "test" });
	const boxes = [...html.matchAll(/<rect x="[^"]+" y="([^"]+)" width="[^"]+" height="([^"]+)" rx=/g)];
	const labelY = Number(html.match(/<text x="[^"]+" y="([^"]+)"[^>]*>read<\/text>/)[1]);
	assert.ok(labelY - 10 > Number(boxes[0][1]) + Number(boxes[0][2]));
	assert.ok(labelY + 3 < Number(boxes[1][1]), "label and background stay above the source box");
});

test("existing book template still builds", () => {
	const html = build(readFileSync(new URL("./template.md", import.meta.url), "utf8"));
	assert.match(html, /<title>Session Sync/);
	assert.match(html, /<svg/);
});
