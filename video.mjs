#!/usr/bin/env node
// Local, offline video prototype: Markdown → macOS speech + Chrome frames → FFmpeg.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { appendFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { Book, encode, frontMatter, sections } from "./lib/render.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));

export function parseVideo(source) {
	const { meta, body } = frontMatter(source.replace(/\r\n/g, "\n"));
	const scenes = sections(body).map((scene) => {
		const narration = [...scene.text.matchAll(/^:::narration\s*\n([\s\S]*?)^:::\s*$/gm)];
		if (narration.length !== 1) throw new Error(`${scene.title}: expected one :::narration block`);
		const beats = narration[0][1].trim().split(/\n\s*\n/).map((s) => s.replace(/\s+/g, " ").trim());
		if (beats.some((s) => !s || s.length > 240)) throw new Error(`${scene.title}: narration paragraphs must be 1–240 characters`);
		const visual = scene.text.replace(narration[0][0], "").trim();
		if (!visual) throw new Error(`${scene.title}: missing visual content`);
		return { title: scene.title, beats, html: new Book().blocks(visual) };
	});
	if (!scenes.length) throw new Error("video needs at least one # scene");
	return { title: meta.title ?? "Explainer", scenes };
}

export function timestamp(seconds) {
	const ms = Math.round(seconds * 1000);
	return `${String(Math.floor(ms / 3600000)).padStart(2, "0")}:${String(Math.floor(ms / 60000) % 60).padStart(2, "0")}:${String(Math.floor(ms / 1000) % 60).padStart(2, "0")}.${String(ms % 1000).padStart(3, "0")}`;
}

export function storyboard(video) {
	const css = readFileSync(path.join(HERE, "book.css"), "utf8");
	return `<!doctype html><html lang="en"><meta charset="utf-8"><title>${encode(video.title)}</title>
<style>${css}
html,body{width:1280px;margin:0;background:var(--paper)}
.scene{position:relative;width:1280px;height:720px;padding:46px 76px 128px;overflow:hidden;border-bottom:1px solid var(--rule)}
.kicker{font-size:13px}.scene h1{font-size:52px;line-height:1.05;margin:18px 0 22px;letter-spacing:-.025em}
.visual{font-size:27px;line-height:1.4}.visual p{margin-bottom:18px}.visual pre{font-size:23px;line-height:1.5;margin:20px 0}
.visual .fig{margin:12px 0}.visual .fig.wide{margin-left:0;margin-right:0}.visual svg{width:1050px;max-width:1050px!important;max-height:300px}
.visual figcaption{font-size:16px}.replay{display:none!important}.visual ul{margin:12px 0}.visual li{margin:8px 0}
.caption{position:absolute;bottom:38px;left:76px;right:76px;min-height:64px;padding-top:18px;border-top:1px solid var(--rule);font:23px/1.4 'Avenir Next',sans-serif;color:var(--ink)}
.progress{position:absolute;bottom:0;left:0;height:5px;background:var(--accent)}
</style>
${video.scenes.map((scene, i) => `<section class="scene"><div class="kicker">${encode(video.title)} · ${String(i + 1).padStart(2, "0")} / ${video.scenes.length}</div><h1>${encode(scene.title)}</h1><div class="visual">${scene.html}</div><div class="caption">${encode(scene.beats[0])}</div><div class="progress" style="width:${(i + 1) / video.scenes.length * 100}%"></div></section>`).join("\n")}
<script>
const beats = ${JSON.stringify(video.scenes.map((s) => s.beats)).replace(/</g, "\\u003c")};
const params = new URLSearchParams(location.search);
if (params.has('scene')) {
 const index = Number(params.get('scene')), beat = Number(params.get('beat') || 0);
 const scenes = [...document.querySelectorAll('.scene')];
 const scene = scenes[index];
 scenes.forEach(s => { if (s !== scene) s.remove(); });
 scene.querySelector('.caption').textContent = beats[index][beat];
 // shortcut: reveal groups evenly across narration beats; add explicit cue markers when precise choreography is needed.
 scene.querySelectorAll('.anim').forEach(figure => {
  const steps = [...figure.querySelectorAll('.step')];
  const order = s => Number(s.style.getPropertyValue('--i'));
  const max = Math.max(...steps.map(order), 0);
  let cutoff = Math.ceil(max * (beat + 1) / beats[index].length);
  // Keep a flow arrow's newly revealed destination visible with the arrow.
  if (steps.some(s => order(s) === cutoff && s.classList.contains('edge')) && steps.some(s => order(s) === cutoff + 1 && !s.classList.contains('edge'))) cutoff++;
  steps.forEach(s => { if (order(s) > cutoff) s.style.opacity = '0'; });
 });
}
</script></html>`;
}

const sha256 = (data) => createHash("sha256").update(data).digest("hex");

export function createVideoRun(output, { source, input, title }) {
	// Exclusive creation prevents one run from overwriting another, even if they start together.
	mkdirSync(path.dirname(output), { recursive: true });
	mkdirSync(output);
	mkdirSync(path.join(output, "assets"));
	writeFileSync(path.join(output, "source.md"), source);
	const manifest = {
		formatVersion: 1, status: "running", startedAt: new Date().toISOString(),
		title, input, sourceSha256: sha256(source),
		environment: { node: process.version, platform: process.platform, arch: process.arch },
		tools: {}, beats: [], artifacts: [],
	};
	const trace = (event) => appendFileSync(path.join(output, "trace.jsonl"), JSON.stringify({ at: new Date().toISOString(), ...event }) + "\n");
	const save = () => {
		const target = path.join(output, "manifest.json");
		writeFileSync(target + ".tmp", JSON.stringify(manifest, null, 2) + "\n");
		renameSync(target + ".tmp", target);
	};
	trace({ event: "run.started" });
	save();
	return {
		manifest, save,
		command(command, args) {
			const start = Date.now();
			trace({ event: "command.started", command, args });
			try {
				const result = execFileSync(command, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 180000, maxBuffer: 16 * 1024 * 1024 });
				trace({ event: "command.completed", command, elapsedMs: Date.now() - start, exitCode: 0 });
				return result;
			} catch (error) {
				const stderr = error.stderr?.toString().slice(-8000) || "";
				trace({ event: "command.failed", command, elapsedMs: Date.now() - start, exitCode: error.status ?? null, signal: error.signal ?? null, error: error.message.slice(-2000), stderr });
				throw new Error(`${command}: ${stderr.slice(-2000) || error.message}`);
			}
		},
		finish(status, error) {
			manifest.status = status;
			manifest.finishedAt = new Date().toISOString();
			if (error) manifest.error = error.message;
			const files = ["source.md", "storyboard.html", "captions.vtt", "video.mp4", ...manifest.beats.flatMap((beat) => Object.values(beat.assets))];
			manifest.artifacts = files.filter((file) => existsSync(path.join(output, file))).map((file) => {
				const data = readFileSync(path.join(output, file));
				return { path: file, bytes: data.length, sha256: sha256(data) };
			});
			save();
			trace({ event: `run.${status}`, ...(error ? { error: error.message } : {}) });
		},
	};
}

export function renderVideo(input, output) {
	const source = readFileSync(input, "utf8");
	const video = parseVideo(source);
	// Author-supplied Markdown supports raw HTML, like books: render trusted sources only.
	const chrome = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
	if (existsSync(output)) throw new Error(`Output directory already exists: ${output}`);
	const archive = createVideoRun(output, { source, input, title: video.title });
	const run = archive.command;
	const { manifest } = archive;
	let work;
	const html = path.join(output, "storyboard.html");
	const clips = [];
	const captions = ["WEBVTT\n"];
	let elapsed = 0;
	try {
		manifest.settings = { voice: "Samantha", wordsPerMinute: 155, width: 1280, height: 720, fps: 30, pauseSeconds: 0.35 };
		manifest.renderer = Object.fromEntries(["video.mjs", "book.css", "lib/render.mjs", "lib/diagrams.mjs", "lib/highlight.mjs", "package-lock.json"].map((file) => [file, sha256(readFileSync(path.join(HERE, file)))]));
		archive.save();
		if (process.platform !== "darwin") throw new Error("This prototype uses macOS say for speech.");
		if (!existsSync(chrome)) throw new Error("Chrome not found; set CHROME_PATH to its executable.");
		for (const tool of ["ffmpeg", "ffprobe"]) manifest.tools[tool] = run(tool, ["-version"]).split("\n")[0];
		manifest.tools.chrome = run(chrome, ["--version"]).trim();
		if (!run("say", ["-v", "?"]).includes("Samantha")) throw new Error("Install the Samantha voice in macOS Speech settings.");
		manifest.tools.macos = run("sw_vers", ["-productVersion"]).trim();
		work = mkdtempSync(path.join(output, ".render-"));
		writeFileSync(html, storyboard(video));
		archive.save();
		for (const [sceneIndex, scene] of video.scenes.entries()) {
			for (const [beatIndex, narration] of scene.beats.entries()) {
				const id = String(clips.length).padStart(3, "0");
				const assets = { audio: `assets/${id}.aiff`, frame: `assets/${id}.png`, narration: `assets/${id}.txt` };
				const beat = { id, sceneIndex, beatIndex, title: scene.title, narration, startSeconds: elapsed, status: "running", assets };
				manifest.beats.push(beat);
				archive.save();
				const audio = path.join(output, assets.audio), png = path.join(output, assets.frame), clip = path.join(work, `${id}.mp4`);
				const text = path.join(output, assets.narration);
				writeFileSync(text, narration);
				run("say", ["-v", "Samantha", "-r", "155", "-f", text, "-o", audio]);
				const duration = Number(run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", audio]).trim());
				if (!Number.isFinite(duration) || duration <= 0) throw new Error("Speech produced no audio");
				// Round to whole video frames so concatenation and subtitle timing stay aligned.
				const seconds = Math.ceil((duration + 0.35) * 30) / 30;
				const url = pathToFileURL(html);
				url.search = new URLSearchParams({ scene: String(sceneIndex), beat: String(beatIndex) }).toString();
				run(chrome, ["--headless", "--disable-gpu", "--no-first-run", "--no-default-browser-check", `--user-data-dir=${path.join(work, "chrome")}`, "--hide-scrollbars", "--force-device-scale-factor=1", "--window-size=1280,720", "--virtual-time-budget=500", `--screenshot=${png}`, url.href]);
				if (!existsSync(png)) throw new Error("Chrome did not produce a frame");
				run("ffmpeg", ["-v", "error", "-nostdin", "-y", "-loop", "1", "-framerate", "30", "-i", png, "-i", audio, "-vf", "scale=1280:720,setsar=1", "-af", "apad", "-t", String(seconds), "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p", "-c:a", "aac", "-ar", "48000", "-ac", "2", clip]);
				captions.push(`${timestamp(elapsed)} --> ${timestamp(elapsed + seconds)}\n${narration.replace(/&/g, "&amp;").replace(/</g, "&lt;")}\n`);
				elapsed += seconds;
				Object.assign(beat, { status: "completed", audioSeconds: duration, durationSeconds: seconds, endSeconds: elapsed });
				manifest.durationSeconds = elapsed;
				archive.save();
				clips.push(clip);
				console.log(`${id}: ${scene.title} (${seconds.toFixed(1)}s)`);
			}
		}
		// Relative generated filenames avoid concat-list quoting issues in the user's output path.
		const list = path.join(work, "clips.txt");
		writeFileSync(list, clips.map((clip) => `file '${path.basename(clip)}'`).join("\n"));
		const vtt = path.join(output, "captions.vtt");
		writeFileSync(vtt, captions.join("\n"));
		run("ffmpeg", ["-v", "error", "-nostdin", "-y", "-f", "concat", "-safe", "1", "-i", list, "-i", vtt, "-map", "0:v", "-map", "0:a", "-map", "1:0", "-c", "copy", "-c:s", "mov_text", "-metadata:s:s:0", "language=eng", "-movflags", "+faststart", path.join(output, "video.mp4")]);
		rmSync(work, { recursive: true });
		archive.finish("completed");
		console.log(`Wrote ${output}/video.mp4 (${elapsed.toFixed(1)}s); run archive: ${output}/manifest.json`);
	} catch (error) {
		const beat = manifest.beats.at(-1);
		if (beat?.status === "running") beat.status = "failed";
		archive.finish("failed", error);
		throw new Error(`${error.message}\nPartial output and trace retained in ${output}`);
	}
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	const [input, flag, output, ...extra] = process.argv.slice(2);
	if (!input || flag !== "-o" || !output || extra.length) {
		console.error("usage: node video.mjs storyboard.md -o NEW_OUTPUT_DIRECTORY");
		process.exitCode = 1;
	} else {
		try { renderVideo(path.resolve(input), path.resolve(output)); }
		catch (error) { console.error(error.message); process.exitCode = 1; }
	}
}
