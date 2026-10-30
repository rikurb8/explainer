import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { runInNewContext } from "node:vm";
import { prepareRehearsal, startRehearsal } from "./lib/rehearsal.mjs";
import { parseVideo, storyboard } from "./video.mjs";

const source = "---\ntitle: Rehearsal\ntts-provider: say\n---\n# First\nA visual.\n:::narration\nHello there.\n\nSecond beat.\n:::\n# Last\n:::flash\nDone\n:::\n:::narration hold=1.2\nThe end.\n:::\n";
function temporary(t) {
	const dir = mkdtempSync(path.join(tmpdir(), "rehearsal-test-"));
	t.after(() => rmSync(dir, { recursive: true, force: true }));
	return dir;
}
function fakeSpeech(t) {
	const previous = process.env.MISTRAL_API_KEY;
	process.env.MISTRAL_API_KEY = "test-only";
	t.after(() => {
		if (previous === undefined) delete process.env.MISTRAL_API_KEY;
		else process.env.MISTRAL_API_KEY = previous;
	});
	const calls = [];
	const run = (cmd, args) => {
		calls.push({ cmd, args });
		if (cmd === "curl") return JSON.stringify({ audio_data: Buffer.from("speech").toString("base64") });
		if (cmd === "ffprobe") return "2.1\n";
		if (cmd === "ffmpeg") writeFileSync(args.at(-1), "processed wav");
		return "";
	};
	return { calls, run };
}
const cloud = source.replace("tts-provider: say", "tts-provider: mistral");

test("rehearsal caches speech independently of visuals, speed and holds", t => {
	const dir = temporary(t), { calls, run } = fakeSpeech(t), updates = [];
	const first = prepareRehearsal(cloud, dir, run, value => updates.push(value));
	assert.equal(first.beats.length, 3);
	assert.equal(first.beats[0].durationSeconds, Math.ceil(2.45 * 30) / 30);
	assert.equal(first.beats[2].hold, 1.2);
	assert.equal(first.beats[1].startSeconds, first.beats[0].durationSeconds);
	assert.deepEqual(updates.at(-1), { completed: 3, total: 3 });
	assert.match(first.beats[0].warnings.join(), /2 beats share this visual/);
	assert.doesNotMatch(first.beats[1].warnings.join(), /share this visual/);
	assert.match(first.beats[2].warnings.join(), /Held frame/);
	assert.equal(calls.filter(c => c.cmd === "curl").length, 3);
	assert.ok(calls.every(c => !c.args.includes("libx264")), "never encodes video or launches Chrome");
	calls.length = 0;
	const visuals = prepareRehearsal(cloud.replace("A visual.", "A changed visual."), dir, run);
	assert.equal(calls.length, 0);
	assert.notEqual(visuals.revision, first.revision);
	assert.equal(visuals.beats[0].audio, first.beats[0].audio);
	const faster = prepareRehearsal(cloud.replace("tts-provider: mistral", "tts-provider: mistral\ntts-speed: 1.5"), dir, run);
	assert.equal(calls.filter(c => c.cmd === "curl").length, 0);
	assert.equal(calls.filter(c => c.cmd === "ffmpeg").length, 3);
	assert.ok(faster.durationSeconds < first.durationSeconds);
	calls.length = 0;
	prepareRehearsal(cloud.replace("hold=1.2", "hold=2"), dir, run);
	assert.deepEqual(calls.map(c => c.cmd), ["ffmpeg"]);
	calls.length = 0;
	prepareRehearsal(cloud.replace("Hello there.", "Hello again."), dir, run);
	assert.deepEqual(calls.map(c => c.cmd), ["curl", "ffprobe", "ffmpeg"]);
	calls.length = 0;
	prepareRehearsal(cloud.replace("tts-provider: mistral", "tts-provider: mistral\ntts-voice: another"), dir, run);
	assert.equal(calls.filter(c => c.cmd === "curl").length, 3);
});

test("default voice falls back to local speech without MISTRAL_API_KEY", { skip: process.platform !== "darwin" }, t => {
	const dir = temporary(t), calls = [], previous = process.env.MISTRAL_API_KEY;
	delete process.env.MISTRAL_API_KEY;
	t.after(() => { if (previous !== undefined) process.env.MISTRAL_API_KEY = previous; });
	const run = (cmd, args) => {
		calls.push(cmd);
		if (cmd === "ffprobe") return "1.5\n";
		if (cmd === "ffmpeg") writeFileSync(args.at(-1), "wav");
		return "";
	};
	const declaredByDefault = source.replace("tts-provider: say\n", "");
	const preview = prepareRehearsal(declaredByDefault, dir, run);
	assert.deepEqual(calls, ["say", "ffprobe", "ffmpeg", "say", "ffprobe", "ffmpeg", "say", "ffprobe", "ffmpeg"]);
	assert.ok(preview.durationSeconds > 0, "a Mac without a key still rehearses");
});

test("failed audio processing is not reused, and invalid input spends nothing", t => {
	const dir = temporary(t), { calls, run } = fakeSpeech(t);
	assert.throws(() => prepareRehearsal("# Broken", dir, run), /expected one/);
	assert.equal(calls.length, 0);
	assert.throws(() => prepareRehearsal(cloud, dir, (cmd, args) => {
		if (cmd === "ffmpeg") { writeFileSync(args.at(-1), "partial"); throw new Error("conversion failed"); }
		return run(cmd, args);
	}), /conversion failed/);
	assert.ok(readdirSync(dir).some(file => file.endsWith(".partial.wav")));
	calls.length = 0;
	prepareRehearsal(cloud, dir, run);
	assert.equal(calls[0].cmd, "ffmpeg", "retries conversion without buying the completed speech again");
	assert.ok(!readdirSync(dir).some(file => file.endsWith(".partial.wav")));
});

test("interactive storyboard can navigate backwards and ignores untrusted messages", () => {
	const steps = Array.from({ length: 4 }, (_, i) => ({ style: { getPropertyValue: () => String(i + 1) }, classList: { contains: () => false } }));
	const caption = {};
	const scene = { style: {}, querySelector: () => caption, querySelectorAll: () => [{ querySelectorAll: () => steps }] };
	const other = { style: {}, querySelector: () => null, querySelectorAll: () => [] };
	const parent = {};
	let message;
	const script = storyboard(parseVideo(source)).match(/<script>([\s\S]*?)<\/script>/)[1];
	runInNewContext(script, {
		URLSearchParams, location: { search: "?rehearsal" }, parent,
		window: { addEventListener: (_, handler) => { message = handler; } },
		document: { querySelectorAll: () => [scene, other] },
	});
	assert.equal(caption.textContent, "Hello there.");
	assert.equal(steps[3].style.opacity, "0");
	message({ source: {}, data: { type: "rehearsal:beat", sceneIndex: 0, beatIndex: 1 } });
	assert.equal(caption.textContent, "Hello there.");
	message({ source: parent, data: { type: "rehearsal:beat", sceneIndex: 0, beatIndex: 1 } });
	assert.equal(caption.textContent, "Second beat.");
	assert.equal(steps[3].style.opacity, "");
	message({ source: parent, data: { type: "rehearsal:beat", sceneIndex: 1, beatIndex: 0 } });
	assert.equal(scene.style.display, "none");
	assert.equal(other.style.display, "");
	message({ source: parent, data: { type: "rehearsal:beat", sceneIndex: 0, beatIndex: 0 } });
	assert.equal(steps[3].style.opacity, "0");
	message({ source: parent, data: { type: "rehearsal:beat", sceneIndex: -1, beatIndex: 0 } });
	assert.equal(caption.textContent, "Hello there.");
});

let localSpeech = process.platform === "darwin";
try { for (const tool of ["ffmpeg", "ffprobe"]) execFileSync(tool, ["-version"], { stdio: "ignore" }); }
catch { localSpeech = false; }
async function waitFor(url, predicate) {
	const deadline = Date.now() + 30000;
	while (Date.now() < deadline) {
		const state = await (await fetch(url + "state")).json();
		if (predicate(state)) return state;
		await new Promise(resolve => setTimeout(resolve, 100));
	}
	throw new Error("Timed out waiting for preview state");
}

test("local preview serves seekable speech, watches atomic saves and retains good revisions on errors", { skip: !localSpeech }, async t => {
	const dir = temporary(t), input = path.join(dir, "script.md");
	writeFileSync(input, source);
	const session = await startRehearsal(input);
	t.after(() => session.close());
	const { url } = session;
	assert.equal(new URL(url).hostname, "127.0.0.1");
	assert.equal((await fetch(new URL("/state", url))).status, 404);
	assert.equal((await fetch(url + "state", { headers: { Origin: "https://example.com" } })).status, 403);
	assert.equal((await fetch(url + "state", { headers: { Origin: new URL(url).origin } })).status, 200, "loopback origin is allowed");
	assert.equal((await fetch(url + "state", { headers: { Origin: new URL(url).origin.replace("127.0.0.1", "localhost") } })).status, 200);
	assert.equal((await fetch(url + "state", { method: "POST" })).status, 405);
	assert.equal((await fetch(url + "source.md")).status, 404);
	assert.match(await (await fetch(url)).text(), /sandbox="allow-scripts"/);
	assert.equal((await fetch(url + "player.js")).status, 200);
	const first = await waitFor(url, state => state.preview && !state.preparing);
	assert.equal(first.error, null);
	const audio = url + "audio/" + first.preview.beats[0].audio;
	const range = await fetch(audio, { headers: { Range: "bytes=0-43" } });
	assert.equal(range.status, 206);
	assert.match(range.headers.get("content-range"), /^bytes 0-43\//);
	assert.equal((await range.arrayBuffer()).byteLength, 44);
	assert.equal((await fetch(audio, { headers: { Range: "bytes=999999999-" } })).status, 416);
	assert.equal((await fetch(audio, { headers: { Range: "bytes=-0" } })).status, 416);
	assert.equal((await fetch(audio, { headers: { Range: "bytes=0-3,6-8" } })).status, 416);
	const suffix = await fetch(audio, { headers: { Range: "bytes=-12" } });
	assert.equal((await suffix.arrayBuffer()).byteLength, 12);
	assert.equal((await fetch(audio, { method: "HEAD" })).status, 200);
	assert.match(await (await fetch(url + `storyboard/${first.preview.revision}?rehearsal`)).text(), /Hello there/);
	const { renameSync } = await import("node:fs");
	writeFileSync(input + ".new", source.replace("A visual.", "An updated visual."));
	renameSync(input + ".new", input);
	const next = await waitFor(url, state => state.preview?.revision !== first.preview.revision && !state.preparing);
	assert.equal(next.preview.beats[0].audio, first.preview.beats[0].audio);
	writeFileSync(input, "# Invalid edit");
	const invalid = await waitFor(url, state => Boolean(state.error) && !state.preparing);
	assert.equal(invalid.preview.revision, next.preview.revision);
	assert.match(invalid.error, /expected one/);
	writeFileSync(input, source.replace("Hello there.", "Hello again."));
	const repaired = await waitFor(url, state => state.preview?.revision !== next.preview.revision && !state.preparing);
	assert.equal(repaired.error, null);
	assert.notEqual(repaired.preview.beats[0].audio, first.preview.beats[0].audio);
	assert.equal(repaired.preview.beats[1].audio, first.preview.beats[1].audio);
});

function playerHarness(t) {
	const elements = new Map(), messages = [], timers = [];
	const element = (id = "") => {
		const node = {
			id, className: "", textContent: "", value: 0, checked: false, hidden: false, disabled: false,
			style: {}, offsetTop: 0, offsetHeight: 0, clientHeight: 100, scrollTop: 0, children: [], attrs: {},
			listeners: {},
			addEventListener(type, fn) { (this.listeners[type] ??= []).push(fn); },
			emit(type, event = {}) { for (const fn of this.listeners[type] ?? []) fn(event); },
			setAttribute(key, value) { this.attrs[key] = value; },
			click() { this.onclick?.(); },
			querySelectorAll() { return this.children.map(li => li.children[0]); },
			replaceChildren(...nodes) { this.children = nodes; },
			append(...nodes) { this.children.push(...nodes); },
		};
		return node;
	};
	const get = id => {
		if (!elements.has(id)) elements.set(id, element(id));
		return elements.get(id);
	};
	const audio = get("audio");
	audio.play = async () => { audio.paused = false; audio.emit("play"); };
	audio.pause = () => { audio.paused = true; audio.emit("pause"); };
	audio.load = () => { audio.currentTime = 0; audio.ended = false; audio.loaded = true; };
	audio.paused = true;
	get("visual").contentWindow = { postMessage: message => messages.push(message) };
	let state = null;
	const context = {
		document: {
			title: "",
			getElementById: get,
			createElement: () => element(),
			addEventListener(type, fn) { (get("#document").listeners[type] ??= []).push(fn); },
		},
		fetch: async () => ({ ok: true, json: async () => state }),
		setTimeout: (fn, ms) => { timers.push(fn); return timers.length; },
		ResizeObserver: class { observe() {} },
		console: { log() {}, warn() {}, error() {} },
	};
	runInNewContext(readFileSync(new URL("./lib/rehearsal-player.js", import.meta.url), "utf8"), context);
	// Run the polls queued so far once: polling reschedules itself, so draining the queue forever would not return.
	const flush = async () => {
		for (let pass = 0; pass < 3; pass++) {
			await new Promise(resolve => setImmediate(resolve));
			for (const fn of timers.splice(0)) await fn();
		}
	};
	const beat = (index, sceneIndex, narration, startSeconds) => ({
		sceneIndex, beatIndex: index, title: sceneIndex ? "Last" : "First", narration, kind: "snap", hold: 0.35,
		audio: `a${index}.wav`, audioSeconds: 2, durationSeconds: 2, startSeconds, warnings: [],
	});
	const preview = (revision, offset = 0) => ({
		revision, title: "Demo", durationSeconds: 8, html: "",
		beats: [beat(0, 0, "One.", 0 + offset), beat(1, 0, "Two.", 2 + offset), beat(2, 1, "Three.", 4 + offset)],
	});
	return {
		get, audio, messages,
		publish(next) { state = next; return flush(); },
		preview,
		key(key) { for (const fn of get("#document").listeners.keydown ?? []) fn({ key, target: {}, preventDefault() {} }); },
		async ready(revision = "r1") {
			await this.publish({ preview: this.preview(revision), preparing: false, error: null });
			get("visual").onload();
			await flush();
		},
	};
}

test("player installs a revision, navigates, plays, seeks and loops a scene", async t => {
	const ui = playerHarness(t);
	await ui.publish({ preview: null, preparing: true, error: null });
	assert.match(ui.get("status").textContent, /Preparing narration/);
	await ui.ready();
	assert.equal(ui.get("play").disabled, false);
	assert.equal(ui.get("title").textContent, "Demo");
	assert.match(ui.get("visual").src, /^storyboard\/r1\?rehearsal$/);
	assert.equal(ui.get("summary").textContent, "3 beats · 0:08");
	assert.equal(ui.audio.src, "audio/a0.wav");
	assert.equal(ui.get("narration").textContent, "One.");
	assert.deepEqual(JSON.parse(JSON.stringify(ui.messages.at(-1))), { type: "rehearsal:beat", sceneIndex: 0, beatIndex: 0 });
	assert.equal(ui.get("beats").children.length, 3);
	assert.equal(ui.get("beats").children[0].children[0].attrs["aria-current"], "true");

	ui.get("next").click();
	assert.equal(ui.get("narration").textContent, "Two.");
	assert.equal(ui.audio.src, "audio/a1.wav");
	assert.equal(ui.audio.paused, true);

	ui.get("play").click();
	await Promise.resolve();
	assert.equal(ui.audio.paused, false);
	assert.equal(ui.get("play").textContent, "Pause");

	// The next beat starts playing when the previous one ends.
	ui.audio.ended = true;
	ui.audio.emit("ended");
	await Promise.resolve();
	assert.equal(ui.get("narration").textContent, "Three.");
	assert.equal(ui.audio.paused, false);

	// Looping repeats the scene, not the whole video.
	ui.get("loop").checked = true;
	ui.audio.ended = true;
	ui.audio.emit("ended");
	await Promise.resolve();
	assert.equal(ui.get("narration").textContent, "Three.");
	ui.get("loop").checked = false;
	ui.audio.ended = true;
	ui.audio.emit("ended");
	assert.equal(ui.get("play").disabled, false);

	// Clicking a beat's card jumps to it, and the timeline maps a time to its beat and offset.
	ui.get("beats").children[0].children[0].onclick();
	assert.equal(ui.get("narration").textContent, "One.");
	ui.get("seek").value = 2.5;
	ui.get("seek").emit("input");
	assert.equal(ui.get("narration").textContent, "Two.");
	ui.audio.emit("loadedmetadata");
	assert.equal(ui.audio.currentTime, 0.5);
	assert.equal(ui.get("time").textContent, "0:02 / 0:08");
});

test("player keeps the current beat across a revision and shows failures", async t => {
	const ui = playerHarness(t);
	await ui.ready("r1");
	ui.get("next").click();
	ui.audio.currentTime = 0.4;
	ui.audio.emit("loadedmetadata");
	await ui.publish({ preview: ui.preview("r2", 3), preparing: true, error: null });
	assert.match(ui.get("status").textContent, /Preparing narration.*previous version stays playable/);
	ui.get("visual").onload();
	await Promise.resolve();
	assert.equal(ui.get("narration").textContent, "Two.", "same line stays selected, now at its new timestamp");
	assert.equal(ui.audio.src, "audio/a1.wav");
	ui.audio.emit("loadedmetadata");
	assert.equal(ui.audio.currentTime, 0.4, "playback keeps its place when only the visuals changed");
	await ui.publish({ preview: ui.preview("r2", 3), preparing: false, error: "scene 2: missing visual" });
	assert.match(ui.get("error").textContent, /missing visual/);
	assert.equal(ui.get("narration").textContent, "Two.", "a bad edit never replaces the playable script");
	ui.key("ArrowRight");
	assert.equal(ui.get("narration").textContent, "Three.");
	ui.key(" ");
	await Promise.resolve();
	assert.equal(ui.audio.paused, false);
});
