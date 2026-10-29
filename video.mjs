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
	const provider = meta["tts-provider"] ?? "say";
	if (!["say", "mistral"].includes(provider)) throw new Error(`tts-provider: unknown provider "${provider}"`);
	const tts = {
		provider,
		model: meta["tts-model"] ?? "voxtral-mini-tts-3-0",
		voice: meta["tts-voice"] ?? (provider === "mistral" ? "gb_jane_neutral" : "Samantha"),
		rate: Number(meta["tts-rate"] ?? 155),
		// say has tts-rate; every provider gets tts-speed, a pitch-preserving stretch applied to the audio.
		speed: Number(meta["tts-speed"] ?? 1),
	};
	if (!Number.isFinite(tts.speed) || tts.speed < 0.5 || tts.speed > 2) throw new Error("tts-speed must be 0.5–2");
	const scenes = sections(body).map((scene) => {
		const narration = [...scene.text.matchAll(/^:::narration([^\n]*)\n([\s\S]*?)^:::\s*$/gm)];
		if (narration.length !== 1) throw new Error(`${scene.title}: expected one :::narration block`);
		const beats = narration[0][2].trim().split(/\n\s*\n/).map((s) => s.replace(/\s+/g, " ").trim());
		if (beats.some((s) => !s || s.length > 240)) throw new Error(`${scene.title}: narration paragraphs must be 1–240 characters`);
		// :::narration hold=N makes the scene end on a held frame, the way an editor lets a punchline land.
		const header = narration[0][1].trim();
		const hold = header ? Number(/^hold=(\d*\.?\d+)$/.exec(header)?.[1]) : undefined;
		if (header && (!Number.isFinite(hold) || hold > 3)) throw new Error(`${scene.title}: narration takes hold=0–3, got "${header}"`);
		// :::flash turns a scene into a word card: big words instead of a slide, for a 1–2 second cut.
		const visual = scene.text.replace(narration[0][0], "").replace(/^:::flash\s*\n([\s\S]*?)^:::\s*$/gm, (_, lines) => {
			const words = lines.split("\n").map((line) => line.trim()).filter(Boolean);
			if (!words.length) throw new Error(`${scene.title}: :::flash needs at least one line`);
			return `<div class="flash">${words.map((word) => `<b>${encode(word)}</b>`).join("")}</div>`;
		}).trim();
		if (!visual) throw new Error(`${scene.title}: missing visual content`);
		const html = new Book().blocks(visual);
		const flash = /class="flash"/.test(html);
		// Motion carries rhythm: cards cut hard, code sits dead still so it can be read, everything else snaps in.
		const kind = flash ? "cut" : /<pre/.test(html) ? "still" : "snap";
		return { title: scene.title, beats, flash, html, hold, kind };
	});
	if (!scenes.length) throw new Error("video needs at least one # scene");
	// The pause after each beat is the only dead air in the video, so a fast script sets it low.
	const pause = Number(meta.pause ?? 0.35);
	if (!Number.isFinite(pause) || pause < 0 || pause > 3) throw new Error("pause must be 0–3 seconds");
	// A fast video scales its visuals up to fill the frame instead of leaving a dead middle.
	const scale = Number(meta.visual ?? 1);
	if (!Number.isFinite(scale) || scale < 0.5 || scale > 2) throw new Error("visual scale must be 0.5–2");
	return { title: meta.title ?? "Explainer", scenes, tts, pause, scale };
}

// Narration beats are capped at 240 characters, comfortably under cloud speech prompt limits.
export function synthesize(run, tts, text, audioPath) {
	if (tts.provider === "mistral") {
		const apiKey = process.env.MISTRAL_API_KEY;
		if (!apiKey) throw new Error("Set MISTRAL_API_KEY to use the mistral tts-provider.");
		const dir = path.dirname(audioPath);
		const payload = path.join(dir, ".mistral-request.json"), auth = path.join(dir, ".mistral-auth.txt");
		writeFileSync(payload, JSON.stringify({ model: tts.model, input: text, voice_id: tts.voice, response_format: "wav" }));
		// The key goes through a header file because trace.jsonl records command arguments.
		writeFileSync(auth, `Authorization: Bearer ${apiKey}\n`);
		try {
			const body = run("curl", ["-sS", "-f", "--max-time", "120", "--retry", "3", "--retry-delay", "2", "https://api.mistral.ai/v1/audio/speech", "-H", `@${auth}`, "-H", "Content-Type: application/json", "-d", `@${payload}`]);
			const audio = Buffer.from(JSON.parse(body).audio_data ?? "", "base64");
			if (!audio.length) throw new Error("mistral speech response contained no audio");
			writeFileSync(audioPath, audio);
		} finally {
			rmSync(payload, { force: true });
			rmSync(auth, { force: true });
		}
		return;
	}
	run("say", ["-v", tts.voice, "-r", String(tts.rate), "-o", audioPath, text]);
}

export function timestamp(seconds) {
	const ms = Math.round(seconds * 1000);
	return `${String(Math.floor(ms / 3600000)).padStart(2, "0")}:${String(Math.floor(ms / 60000) % 60).padStart(2, "0")}:${String(Math.floor(ms / 1000) % 60).padStart(2, "0")}.${String(ms % 1000).padStart(3, "0")}`;
}

// Motion carries rhythm: a card cuts hard, code sits still so it can be read, a slide snaps in 6% and holds.
// shortcut: the paper colour is copied from book.css; a fade needs its real value, so update both together.
export function motion(seconds, kind = "snap") {
	const frames = Math.max(1, Math.round(seconds * 30));
	const settle = Math.min(12, frames);
	const zoom = kind === "snap" ? `if(lt(on,${settle}),1.06-on*${(0.06 / settle).toFixed(6)},1)` : "1";
	const fade = kind === "still" ? "" : "fade=t=in:st=0:d=0.12:color=0xfbf8f2,";
	// Upscale before zoompan: it rounds the pan window to pixels, which visibly jitters at 1280px.
	return `scale=2560:1440,zoompan=z='${zoom}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=1280x720:fps=30,${fade}setsar=1`;
}

export function storyboard(video) {
	const css = readFileSync(path.join(HERE, "book.css"), "utf8");
	// Visuals are zoomed to fill the frame, so a wide figure has to be laid out at the pre-zoom width to fit.
	const fit = (px) => `${Math.round(px / video.scale)}px`;
	return `<!doctype html><html lang="en"><meta charset="utf-8"><title>${encode(video.title)}</title>
<style>${css}
html,body{width:1280px;margin:0;background:var(--paper)}
.scene{position:relative;width:1280px;height:720px;padding:46px 76px 128px;overflow:hidden;border-bottom:1px solid var(--rule);display:flex;flex-direction:column}
.visual{margin:auto 0}
.kicker{font-size:13px}.scene h1{font-size:52px;line-height:1.05;margin:18px 0 22px;letter-spacing:-.025em}
.visual{font-size:27px;line-height:1.4;zoom:${video.scale}}.visual p{margin-bottom:18px}.visual pre{font-size:23px;line-height:1.5;margin:20px 0}
.visual .fig{margin:12px 0}.visual .fig.wide{margin-left:0;margin-right:0}.visual svg{width:${fit(1120)};max-width:${fit(1120)}!important;max-height:${fit(360)}}
.visual figcaption{font-size:16px}.replay{display:none!important}.visual ul{margin:12px 0}.visual li{margin:8px 0}
.flash-scene{padding-bottom:96px}
.flash-scene .kicker{position:absolute;top:46px;left:76px}.flash-scene h1{display:none}.flash-scene .flash{height:auto}
.caption{position:absolute;bottom:38px;left:76px;right:76px;min-height:64px;padding-top:18px;border-top:1px solid var(--rule);font:23px/1.4 'Avenir Next',sans-serif;color:var(--ink)}
.progress{position:absolute;bottom:0;left:0;height:5px;background:var(--accent)}
.flash{display:flex;flex-direction:column;justify-content:center;font:700 96px/0.98 'Avenir Next',sans-serif;letter-spacing:-.045em}
.flash b:nth-child(2){color:var(--accent)}.flash b:nth-child(3){color:var(--blue)}
</style>
${video.scenes.map((scene, i) => `<section class="scene${scene.flash ? " flash-scene" : ""}"><div class="kicker">${encode(video.title)} · ${String(i + 1).padStart(2, "0")} / ${video.scenes.length}</div><h1>${encode(scene.title)}</h1><div class="visual">${scene.html}</div>${scene.flash ? "" : `<div class="caption">${encode(scene.beats[0])}</div>`}<div class="progress" style="width:${(i + 1) / video.scenes.length * 100}%"></div></section>`).join("\n")}
<script>
const beats = ${JSON.stringify(video.scenes.map((s) => s.beats)).replace(/</g, "\\u003c")};
const params = new URLSearchParams(location.search);
if (params.has('scene')) {
 const index = Number(params.get('scene')), beat = Number(params.get('beat') || 0);
 const scenes = [...document.querySelectorAll('.scene')];
 const scene = scenes[index];
 scenes.forEach(s => { if (s !== scene) s.remove(); });
 // A word card shows the words already, so it has no caption line to update.
 const caption = scene.querySelector('.caption');
 if (caption) caption.textContent = beats[index][beat];
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

// A run in progress is otherwise invisible, so every checkpoint rewrites this page. It refreshes itself:
// file:// pages cannot fetch manifest.json, so polling would need a server this pipeline does not have.
export function previewRun(output, manifest) {
	const done = manifest.beats.filter((beat) => beat.status === "completed");
	const cards = manifest.beats.map((beat) => {
		// A beat can be half-written when a render fails; the view must not throw over it.
		const frame = beat.assets?.frame;
		const image = frame && existsSync(path.join(output, frame))
			? `<img src="${encode(frame)}" alt="" loading="lazy">`
			: '<div class="pending"><span>rendering</span></div>';
		const kind = beat.kind ?? "—";
		const meta = [`<b>${beat.id}</b>`, `<i class="dot k-${kind}"></i>${kind}`, `hold ${beat.hold ?? "—"}s`, beat.durationSeconds ? `${beat.durationSeconds.toFixed(1)}s` : "…"];
		return `<figure class="${beat.status === "running" ? "now" : ""}">${image}<figcaption><p class="row">${meta.join("<span>·</span>")}</p><p class="say">${encode(beat.narration ?? beat.title ?? "")}</p></figcaption></figure>`;
	}).join("\n");
	const hasVideo = existsSync(path.join(output, "video.mp4"));
	// The first frame doubles as the poster, so the player never opens on a black rectangle.
	const poster = manifest.beats[0]?.assets?.frame;
	const posterAttr = poster && existsSync(path.join(output, poster)) ? ` poster="${encode(poster)}"` : "";
	const video = hasVideo ? `<section class="player"><video src="video.mp4"${posterAttr} controls playsinline preload="metadata"></video></section>` : "";
	// Refreshing is only for a run in progress: a reload would tear down the player every two seconds.
	const live = manifest.status === "running";
	const refresh = live ? '<meta http-equiv="refresh" content="2">' : "";
	const seconds = (manifest.durationSeconds ?? 0).toFixed(1);
	const progress = manifest.beats.length ? (done.length / manifest.beats.length) * 100 : 0;
	const error = manifest.error ? `<p class="error">${encode(manifest.error.split("\n")[0].slice(0, 160))}</p>` : "";
	const wall = manifest.finishedAt ? ` · ${((Date.parse(manifest.finishedAt) - Date.parse(manifest.startedAt)) / 1000).toFixed(0)}s render` : "";
	return `<!doctype html><html lang="en"><meta charset="utf-8">${refresh}<title>${encode(manifest.title)} · run</title>
<style>
:root{--paper:#fbf8f2;--ink:#2a2723;--muted:#7b7468;--rule:#e3dbcc;--accent:#b4472f;--blue:#2e6a8a;--card:#fffdf8;
--sans:'Avenir Next',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;--mono:ui-monospace,SFMono-Regular,Menlo,monospace}
@media (prefers-color-scheme:dark){:root{--paper:#131211;--ink:#efe9dd;--muted:#918a7d;--rule:#2c2926;--accent:#d2603f;--blue:#6aa2c2;--card:#1a1917}}
*{box-sizing:border-box}
body{margin:0;padding:44px 36px 96px;background:var(--paper);color:var(--ink);font:16px/1.5 var(--sans);
-webkit-font-smoothing:antialiased}
header{max-width:1180px;margin:0 auto 30px}
.kicker{margin:0 0 10px;font:11px/1 var(--mono);letter-spacing:.16em;text-transform:uppercase;color:var(--accent)}
h1{margin:0 0 8px;font-size:30px;line-height:1.1;letter-spacing:-.025em;font-weight:600}
.meta{margin:0 0 18px;font:12px/1.4 var(--mono);color:var(--muted);letter-spacing:.01em}
.meta .live{color:var(--accent)}
.meta .live::before{content:"";display:inline-block;width:6px;height:6px;margin-right:6px;border-radius:50%;background:currentColor;
vertical-align:1px;animation:pulse 1.4s ease-in-out infinite}
@keyframes pulse{0%,100%{opacity:.25}50%{opacity:1}}
.bar{height:2px;background:var(--rule);overflow:hidden}
.bar i{display:block;height:100%;background:var(--accent);transition:width .4s ease}
.player{max-width:880px;margin:0 auto 40px}
video{width:100%;display:block;background:#000;border:1px solid var(--rule);border-radius:2px}
.grid{max-width:1180px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:30px 24px}
figure{margin:0;min-width:0}
figure img,figure .pending{width:100%;display:block;border:1px solid var(--rule);border-radius:2px;background:var(--card);
aspect-ratio:16/9;object-fit:cover;transition:border-color .18s ease,transform .18s ease}
figure img:hover{border-color:var(--muted);transform:translateY(-1px)}
.pending{display:grid;place-items:center;border-style:dashed;color:var(--muted);font:11px/1 var(--mono);letter-spacing:.14em;text-transform:uppercase}
figure.now img,figure.now .pending{border-color:var(--accent)}
figcaption{padding-top:10px}
.row{margin:0 0 4px;display:flex;flex-wrap:wrap;align-items:center;gap:7px;font:11px/1 var(--mono);letter-spacing:.08em;
text-transform:uppercase;color:var(--muted)}
.row b{font-weight:600;color:var(--ink)}
.row span{opacity:.45}
.dot{width:6px;height:6px;border-radius:50%;background:var(--muted);display:inline-block;margin-right:5px}
.k-cut{background:var(--accent)}.k-snap{background:var(--blue)}.k-still{background:var(--muted)}
.say{margin:0;font-size:13.5px;line-height:1.45;color:var(--muted);max-width:46ch}
.error{max-width:1180px;margin:0 auto 24px;padding:12px 14px;border-left:2px solid var(--accent);color:var(--accent);
font:12px/1.5 var(--mono)}
@media (max-width:640px){body{padding:28px 18px 64px}h1{font-size:24px}}
</style>
<body><header><p class="kicker">run preview</p><h1>${encode(manifest.title)}</h1>
<p class="meta"><span class="${live ? "live" : ""}">${manifest.status}${live ? " · live, refreshing every 2s" : ""}</span> · ${done.length}/${manifest.beats.length} beats · ${seconds}s${wall}</p>
<div class="bar"><i style="width:${progress}%"></i></div></header>
${error}${video}<div class="grid">${cards}</div></body></html>`;
}

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
		writeFileSync(path.join(output, "preview.html"), previewRun(output, manifest));
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
	const tts = video.tts;
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
		manifest.settings = { tts, width: 1280, height: 720, fps: 30, pauseSeconds: video.pause };
		manifest.renderer = Object.fromEntries(["video.mjs", "book.css", "lib/render.mjs", "lib/diagrams.mjs", "lib/highlight.mjs", "package-lock.json"].map((file) => [file, sha256(readFileSync(path.join(HERE, file)))]));
		archive.save();
		if (tts.provider === "say" && process.platform !== "darwin") throw new Error("The say tts-provider needs macOS; use tts-provider: mistral.");
		if (!existsSync(chrome)) throw new Error("Chrome not found; set CHROME_PATH to its executable.");
		for (const tool of ["ffmpeg", "ffprobe"]) manifest.tools[tool] = run(tool, ["-version"]).split("\n")[0];
		manifest.tools.chrome = run(chrome, ["--version"]).trim();
		if (tts.provider === "say") {
			if (!run("say", ["-v", "?"]).includes(tts.voice)) throw new Error(`Install the ${tts.voice} voice in macOS Speech settings.`);
			manifest.tools.macos = run("sw_vers", ["-productVersion"]).trim();
		} else {
			manifest.tools.curl = run("curl", ["--version"]).split("\n")[0];
		}
		work = mkdtempSync(path.join(output, ".render-"));
		writeFileSync(html, storyboard(video));
		archive.save();
		for (const [sceneIndex, scene] of video.scenes.entries()) {
			for (const [beatIndex, narration] of scene.beats.entries()) {
				const id = String(clips.length).padStart(3, "0");
				const assets = { audio: `assets/${id}.${tts.provider === "mistral" ? "wav" : "aiff"}`, frame: `assets/${id}.png`, narration: `assets/${id}.txt` };
				// Only the last beat of a scene can hold: the visual changes at the scene boundary, not before it.
				const hold = beatIndex === scene.beats.length - 1 ? scene.hold ?? video.pause : video.pause;
				const beat = { id, sceneIndex, beatIndex, title: scene.title, narration, hold, kind: scene.kind, startSeconds: elapsed, status: "running", assets };
				manifest.beats.push(beat);
				archive.save();
				const audio = path.join(output, assets.audio), png = path.join(output, assets.frame), clip = path.join(work, `${id}.mp4`);
				const text = path.join(output, assets.narration);
				writeFileSync(text, narration);
				synthesize(run, tts, narration, audio);
				const duration = Number(run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", audio]).trim());
				if (!Number.isFinite(duration) || duration <= 0) throw new Error("Speech produced no audio");
				// atempo shortens the speech but not the pause, so the clip shrinks with the spoken part only.
				const spoken = duration / tts.speed;
				// Round to whole video frames so concatenation and subtitle timing stay aligned.
				const seconds = Math.ceil((spoken + hold) * 30) / 30;
				const url = pathToFileURL(html);
				url.search = new URLSearchParams({ scene: String(sceneIndex), beat: String(beatIndex) }).toString();
				run(chrome, ["--headless", "--disable-gpu", "--no-first-run", "--no-default-browser-check", `--user-data-dir=${path.join(work, "chrome")}`, "--hide-scrollbars", "--force-device-scale-factor=1", "--window-size=1280,720", "--virtual-time-budget=500", `--screenshot=${png}`, url.href]);
				if (!existsSync(png)) throw new Error("Chrome did not produce a frame");
				// zoompan generates the beat's frames itself, so the still is a one-frame input rather than a looped one.
				const speed = tts.speed === 1 ? "" : `atempo=${tts.speed},`;
				run("ffmpeg", ["-v", "error", "-nostdin", "-y", "-i", png, "-i", audio, "-vf", motion(seconds, scene.kind), "-af", `${speed}apad`, "-t", String(seconds), "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p", "-c:a", "aac", "-ar", "48000", "-ac", "2", clip]);
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

// What the render actually did: `node video.mjs runs/<run> --inspect`. Text, because the consumer is the agent
// revising the script. Word counting cannot predict speech well (a 5-word line carries ~0.9s of comma pauses), so
// this reports measured facts and compares each beat with the run's own median instead of with a formula.
export function inspectRun(dir) {
	const manifest = JSON.parse(readFileSync(path.join(dir, "manifest.json"), "utf8"));
	const video = parseVideo(readFileSync(path.join(dir, "source.md"), "utf8"));
	const rows = manifest.beats.map((beat) => {
		const words = beat.narration.trim().split(/\s+/).length;
		const hold = beat.hold ?? video.pause;
		const speech = beat.audioSeconds ? beat.audioSeconds / video.tts.speed : null;
		return { beat, hold, words, speech, rate: speech ? words / speech : null };
	});
	const measured = rows.filter((row) => row.rate).map((row) => row.rate).sort((a, b) => a - b);
	const median = measured.length ? measured[Math.floor(measured.length / 2)] : null;
	const wall = manifest.finishedAt ? (Date.parse(manifest.finishedAt) - Date.parse(manifest.startedAt)) / 1000 : null;
	const percent = (value) => `${value >= 0 ? "+" : ""}${(value * 100).toFixed(0)}%`;
	const lines = [
		`${path.basename(dir)}: ${manifest.status} · ${rows.length} beats · ${(manifest.durationSeconds ?? 0).toFixed(1)}s video${wall ? ` · ${wall.toFixed(0)}s render` : ""}`,
		`${video.tts.provider}${video.tts.speed !== 1 ? ` at ${video.tts.speed}×` : ""} · measured ${median ? median.toFixed(2) : "—"} words/s · estimated ${speechRate(video.tts).toFixed(2)} for --check`,
		"",
		" id   words  speech  w/s   vs median  kind   hold  narration",
		...rows.map(({ beat, hold, words, speech, rate }) => {
			const skew = rate && median ? `${percent(rate / median - 1)}` : "—";
			return `${beat.id}  ${String(words).padStart(5)}  ${(speech?.toFixed(1) ?? "—").padStart(6)}  ${(rate?.toFixed(2) ?? "—").padStart(4)}  ${skew.padStart(9)}  ${(beat.kind ?? "—").padEnd(5)}  ${String(hold).padStart(4)}  ${beat.narration.slice(0, 40)}`;
		}),
	];
	const holds = rows.reduce((sum, row) => sum + row.hold, 0);
	const estimate = rows.reduce((sum, row) => sum + row.words / speechRate(video.tts) + row.hold, 0);
	lines.push("", `holds ${holds.toFixed(1)}s (${((holds / (manifest.durationSeconds || 1)) * 100).toFixed(0)}% of runtime) · estimate ${estimate.toFixed(0)}s vs ${(manifest.durationSeconds ?? 0).toFixed(0)}s rendered`);
	// A beat far slower than the rest is a line to split, but only if there are words to move: a four-word line is
	// already just one clause, and its length is the provider's fixed lead-in plus comma pauses.
	for (const row of rows.filter((row) => row.rate && row.rate < median * 0.75 && row.words >= 8)) {
		lines.push(`  ${row.beat.id} spoke at ${row.rate.toFixed(2)} words/s, ${percent(row.rate / median - 1)} against the run: ${row.words} words took ${row.speech.toFixed(1)}s, so split the line or accept the pause`);
	}
	return lines.join("\n");
}

// Pace report before spending minutes on speech and encoding: `node video.mjs script.md --check`.
// Speech rate is estimated per provider (measured: say 155 wpm ≈ 2.75 words/s, Voxtral ≈ 1.96), times tts-speed.
export const speechRate = (tts) => ((tts.provider === "say" ? tts.rate : 118) / 60) * tts.speed;
export function paceReport(video) {
	const wordsPerSecond = speechRate(video.tts);
	const shots = video.scenes.map((scene) => {
		const words = scene.beats.reduce((sum, beat) => sum + beat.split(/\s+/).length, 0);
		// Only a scene's last beat can carry its hold; the others get the default pause.
		const holds = scene.beats.reduce((sum, _, i) => sum + (i === scene.beats.length - 1 ? scene.hold ?? video.pause : video.pause), 0);
		return { scene, words, seconds: words / wordsPerSecond + holds };
	});
	const words = shots.reduce((sum, shot) => sum + shot.words, 0);
	const total = shots.reduce((sum, shot) => sum + shot.seconds, 0);
	const lengths = shots.map((shot) => shot.seconds);
	const mean = total / shots.length;
	const sd = Math.sqrt(lengths.reduce((sum, length) => sum + (length - mean) ** 2, 0) / shots.length);
	const cards = video.scenes.filter((scene) => scene.flash).length;
	const bars = "▁▂▃▄▅▆▇█";
	const spark = lengths.map((length) => bars[Math.min(7, Math.round((length / Math.max(...lengths)) * 7))]).join("");
	const lines = [
		`${shots.length} shots, ${shots.reduce((sum, shot) => sum + shot.scene.beats.length, 0)} beats, ${words} words, about ${total.toFixed(0)}s (${(total / 60).toFixed(1)} min)`,
		`${(shots.length / (total / 60)).toFixed(1)} shots/min, ${(words / total).toFixed(2)} words/s, ${cards} word cards`,
		`rhythm ${spark}  mean ${mean.toFixed(1)}s  sd ${sd.toFixed(2)}s  cv ${(sd / mean).toFixed(2)}  longest/shortest ${(Math.max(...lengths) / Math.min(...lengths)).toFixed(1)}`,
	];
	const long = video.scenes.flatMap((scene) => scene.beats).filter((beat) => beat.split(/\s+/).length > 12).length;
	const held = video.scenes.filter((scene) => scene.beats.length > 1).length;
	if (long) lines.push(`${long} beats are over 12 words: split them for a faster cut rate`);
	// Only a scene boundary changes the visual, so beats sharing a scene are one shot however many they are.
	if (held) lines.push(`${held} scenes hold several beats on one visual: give each line its own scene`);
	if (shots.length / (total / 60) < 12) lines.push("under 12 shots/min: too slow to read as fast paced");
	// Monotony is measurable: four similar shots in a row, or nothing long enough to give the eye a rest.
	const monotonous = lengths.some((length, i) => i >= 3 && lengths.slice(i - 3, i + 1).every((other) => Math.abs(other - length) <= 0.2));
	if (monotonous) lines.push("four shots in a row within 0.2s of each other: vary the hold, not just the words");
	if (Math.max(...lengths) < mean * 2) lines.push("no shot reaches twice the mean: add one held shot for the punchline");
	if (sd / mean < 0.25) lines.push(`cv ${(sd / mean).toFixed(2)} is even; real editing runs 0.4–0.6`);
	return lines.join("\n");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	const [input, flag, output, ...extra] = process.argv.slice(2);
	const usage = "usage: node video.mjs storyboard.md -o NEW_OUTPUT_DIRECTORY | script.md --check | run-directory --inspect";
	const valid = input && !extra.length && (flag === "-o" ? Boolean(output) : (flag === "--check" || flag === "--inspect") && !output);
	if (!valid) {
		console.error(usage);
		process.exitCode = 1;
	} else {
		try {
			if (flag === "--check") console.log(paceReport(parseVideo(readFileSync(path.resolve(input), "utf8"))));
			else if (flag === "--inspect") console.log(inspectRun(path.resolve(input)));
			else renderVideo(path.resolve(input), path.resolve(output));
		} catch (error) { console.error(error.message); process.exitCode = 1; }
	}
}
