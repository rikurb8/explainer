import { execFileSync } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { createReadStream, existsSync, mkdtempSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import { Worker, isMainThread, parentPort, workerData } from "node:worker_threads";
import { parseVideo, resolveTts, storyboard, synthesize } from "../video.mjs";

const hash = (value) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const command = (cmd, args) => execFileSync(cmd, args, { encoding: "utf8", timeout: 180000, maxBuffer: 16 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] });

export function prepareRehearsal(source, directory, run = command, progress = () => {}) {
	const video = parseVideo(source);
	// Rehearsal speaks with the same voice the render will, so fallback happens here too.
	const tts = resolveTts(video.tts);
	const { speed, ...voice } = tts;
	const beats = [];
	const total = video.scenes.reduce((sum, scene) => sum + scene.beats.length, 0);
	let elapsed = 0;
	for (const [sceneIndex, scene] of video.scenes.entries()) {
		for (const [beatIndex, narration] of scene.beats.entries()) {
			const speechKey = hash({ voice, narration });
			const raw = path.join(directory, `${speechKey}.${voice.provider === "say" ? "aiff" : "wav"}`);
			const metadata = raw + ".json";
			let audioSeconds;
			if (existsSync(raw) && existsSync(metadata)) {
				audioSeconds = JSON.parse(readFileSync(metadata, "utf8")).audioSeconds;
			} else {
				synthesize(run, voice, narration, raw);
				audioSeconds = Number(run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", raw]).trim());
				if (!Number.isFinite(audioSeconds) || audioSeconds <= 0) throw new Error("Speech produced no audio");
				writeFileSync(metadata, JSON.stringify({ audioSeconds }));
			}
			const hold = beatIndex === scene.beats.length - 1 ? scene.hold ?? video.pause : video.pause;
			const durationSeconds = Math.ceil((audioSeconds / speed + hold) * 30) / 30;
			const audio = `${hash({ speechKey, speed, hold })}.wav`;
			const target = path.join(directory, audio);
			if (!existsSync(target)) {
				// Bake speed and silence into audio so one browser media clock owns speech, holds and seeking.
				const partial = target + ".partial.wav";
				run("ffmpeg", ["-v", "error", "-nostdin", "-y", "-i", raw, "-af", `atempo=${speed},apad`, "-t", String(durationSeconds), "-c:a", "pcm_s16le", "-ar", "48000", "-ac", "1", partial]);
				renameSync(partial, target);
			}
			const warnings = [];
			if (narration.split(/\s+/).length > 12) warnings.push("Long line · consider splitting");
			// One note on the first beat is enough: the same visual repeats for every beat in the scene.
			if (beatIndex === 0 && scene.beats.length > 1) warnings.push(`${scene.beats.length} beats share this visual`);
			if (hold >= 1) warnings.push(`Held frame · ${hold}s`);
			beats.push({ sceneIndex, beatIndex, title: scene.title, narration, kind: scene.kind, hold, audio, audioSeconds, durationSeconds, startSeconds: elapsed, warnings });
			elapsed += durationSeconds;
			progress({ completed: beats.length, total });
		}
	}
	return { revision: hash(source), title: video.title, beats, durationSeconds: elapsed, html: storyboard(video) };
}

// Speech uses synchronous tools; a worker keeps the player responsive during revisions.
if (!isMainThread) {
	try {
		const preview = prepareRehearsal(workerData.source, workerData.directory, command, progress => parentPort.postMessage({ progress }));
		parentPort.postMessage({ preview });
	} catch (error) { parentPort.postMessage({ error: error.message.slice(-2000) }); }
}

export async function startRehearsal(input) {
	const initial = readFileSync(input, "utf8");
	parseVideo(initial);
	const directory = mkdtempSync(path.join(tmpdir(), "explainer-rehearsal-"));
	const prefix = `/${randomBytes(24).toString("hex")}/`;
	const state = { preview: null, preparing: false, progress: null, error: null };
	const storyboards = new Map(), audioFiles = new Set();
	let worker, attempted, closed = false;
	const refresh = () => {
		if (closed || worker) return;
		let source;
		try { source = readFileSync(input, "utf8"); }
		catch (error) { state.error = error.message; return; }
		if (source === attempted) return;
		attempted = source;
		state.preparing = true;
		state.progress = null;
		state.error = null;
		worker = new Worker(new URL(import.meta.url), { workerData: { source, directory } });
		worker.on("message", message => {
			if (closed) return;
			if (message.progress) state.progress = message.progress;
			if (message.error) state.error = message.error;
			if (message.preview) {
				// An edit made during synthesis wins; never publish a superseded script.
				try { if (readFileSync(input, "utf8") !== source) return; }
				catch (error) { state.error = error.message; return; }
				const { html, ...preview } = message.preview;
				storyboards.set(preview.revision, html);
				if (storyboards.size > 2) storyboards.delete(storyboards.keys().next().value);
				preview.beats.forEach(beat => audioFiles.add(beat.audio));
				state.preview = preview;
			}
		});
		worker.on("error", error => { state.error = error.message; });
		worker.on("exit", code => {
			if (code && !closed && !state.error) state.error = `Speech worker exited (${code})`;
			worker = null;
			state.preparing = false;
			refresh();
		});
	};
	const server = createServer((request, response) => {
		const allowed = [`127.0.0.1:${server.address().port}`, `localhost:${server.address().port}`];
		const sameOrigin = (value) => {
			try { const origin = new URL(value); return origin.protocol === "http:" && allowed.includes(origin.host); }
			catch { return false; }
		};
		response.setHeader("Cache-Control", "no-store");
		response.setHeader("Referrer-Policy", "no-referrer");
		response.setHeader("X-Content-Type-Options", "nosniff");
		const send = (status, type, body) => { response.writeHead(status, { "Content-Type": type }); response.end(request.method === "HEAD" ? undefined : body); };
		if (!allowed.includes(request.headers.host) || (request.headers.origin && !sameOrigin(request.headers.origin))) return send(403, "text/plain", "Forbidden");
		if (!["GET", "HEAD"].includes(request.method)) return send(405, "text/plain", "Read-only preview");
		const url = new URL(request.url, `http://${request.headers.host}`);
		if (!url.pathname.startsWith(prefix)) return send(404, "text/plain", "Not found");
		const route = url.pathname.slice(prefix.length);
		try {
			if (route === "") return send(200, "text/html; charset=utf-8", readFileSync(new URL("./rehearsal.html", import.meta.url)));
			if (route === "player.js") return send(200, "text/javascript; charset=utf-8", readFileSync(new URL("./rehearsal-player.js", import.meta.url)));
			if (route === "state") return send(200, "application/json", JSON.stringify(state));
			if (route.startsWith("storyboard/") && storyboards.has(route.slice(11))) return send(200, "text/html; charset=utf-8", storyboards.get(route.slice(11)));
			const audio = route.startsWith("audio/") && route.slice(6);
			if (!audioFiles.has(audio)) return send(404, "text/plain", "Not found");
			const file = path.join(directory, audio), size = statSync(file).size;
			let start = 0, end = size - 1;
			if (request.headers.range) {
				const match = /^bytes=(\d*)-(\d*)$/.exec(request.headers.range);
				if (match && (match[1] || match[2])) {
					start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
					end = match[1] && match[2] ? Math.min(size - 1, Number(match[2])) : size - 1;
				} else start = size;
				if (start > end || !Number.isSafeInteger(start) || !Number.isSafeInteger(end)) {
					response.setHeader("Content-Range", `bytes */${size}`);
					return send(416, "text/plain", "Invalid range");
				}
				response.setHeader("Content-Range", `bytes ${start}-${end}/${size}`);
			}
			response.writeHead(request.headers.range ? 206 : 200, { "Content-Type": "audio/wav", "Content-Length": end - start + 1, "Accept-Ranges": "bytes", "Cache-Control": "private, max-age=31536000, immutable" });
			if (request.method === "HEAD") return response.end();
			const stream = createReadStream(file, { start, end });
			stream.on("error", () => response.destroy());
			response.on("close", () => stream.destroy());
			stream.pipe(response);
		} catch (error) { send(500, "text/plain", error.message); }
	});
	try {
		await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve); });
	} catch (error) { rmSync(directory, { recursive: true, force: true }); throw error; }
	const timer = setInterval(refresh, 500);
	refresh();
	return {
		url: `http://127.0.0.1:${server.address().port}${prefix}`,
		async close() {
			if (closed) return;
			closed = true;
			clearInterval(timer);
			server.close();
			server.closeAllConnections();
			if (worker) await worker.terminate();
			rmSync(directory, { recursive: true, force: true });
		},
	};
}
