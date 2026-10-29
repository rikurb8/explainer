import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import test from "node:test";
import { runInNewContext } from "node:vm";
import { build } from "./build.mjs";
import { createVideoRun, parseVideo, renderVideo, storyboard, synthesize, timestamp } from "./video.mjs";

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
	const scene = { querySelector: () => caption, querySelectorAll: () => [{ querySelectorAll: () => steps }] };
	let removed = false;
	const html = storyboard({ title: "Test", scenes: [{ title: "One", html: "Visual", beats: ["First", "Second", "Third"] }] });
	const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
	runInNewContext(script, {
		URLSearchParams,
		location: { search: "?scene=0&beat=0" },
		document: { querySelectorAll: () => [scene, { remove() { removed = true; } }] },
	});
	assert.equal(caption.textContent, "First");
	assert.equal(removed, true);
	assert.equal(steps[2].style.opacity, undefined);
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

test("tts configuration defaults to say and accepts provider overrides", () => {
	assert.deepEqual(parseVideo(source).tts, { provider: "say", model: "voxtral-mini-tts-3-0", voice: "Samantha", rate: 155 });
	const mistral = parseVideo(source.replace("title: Demo", "title: Demo\ntts-provider: mistral\ntts-voice: voice_478"));
	assert.equal(mistral.tts.provider, "mistral");
	assert.equal(mistral.tts.voice, "voice_478");
	assert.throws(() => parseVideo(source.replace("title: Demo", "title: Demo\ntts-provider: aws")), /unknown provider/);
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

test("existing book template still builds", () => {
	const html = build(readFileSync(new URL("./template.md", import.meta.url), "utf8"));
	assert.match(html, /<title>Session Sync/);
	assert.match(html, /<svg/);
});
