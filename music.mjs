import { createWriteStream, existsSync, linkSync, mkdirSync, mkdtempSync, rmSync, statSync } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { setTimeout as sleep } from "node:timers/promises";
import { parseArgs } from "node:util";
import { pathToFileURL } from "node:url";

/** Generate one MP3 through ACE-Step, returning its absolute path. Never overwrites a file. */
export async function generateMusic({
	prompt, output, duration = 30, lyrics = "[Instrumental]",
	baseUrl = process.env.ACESTEP_BASE_URL || "http://127.0.0.1:8001",
	apiKey = process.env.ACESTEP_API_KEY,
	timeout = 600_000, signal,
} = {}) {
	if (typeof prompt !== "string" || !prompt.trim()) throw new Error("A non-empty music prompt is required");
	if (typeof output !== "string" || !output.toLowerCase().endsWith(".mp3")) throw new Error("output must be an .mp3 path");
	if (!Number.isFinite(duration) || duration < 10 || duration > 600) throw new Error("duration must be 10–600 seconds");
	if (typeof lyrics !== "string") throw new Error("lyrics must be a string");
	if (!Number.isSafeInteger(timeout) || timeout < 1 || timeout > 2_147_483_647) throw new Error("timeout must be a positive millisecond count (at most 2147483647)");
	const base = new URL(baseUrl);
	if (!["http:", "https:"].includes(base.protocol) || base.username || base.password || base.pathname !== "/" || base.search || base.hash) {
		throw new Error("baseUrl must be an HTTP(S) origin without credentials, a path or a query");
	}
	const target = path.resolve(output);
	if (existsSync(target)) throw new Error(`Output already exists: ${target}`);
	const deadline = AbortSignal.timeout(timeout);
	const operation = AbortSignal.any(signal ? [signal, deadline] : [deadline]);
	const headers = apiKey ? { Authorization: `Bearer ${apiKey}` } : {};
	const request = async (url, body) => {
		const response = await fetch(url, {
			method: body ? "POST" : "GET", redirect: "error", signal: operation,
			headers: body ? { ...headers, "Content-Type": "application/json" } : headers,
			...(body ? { body: JSON.stringify(body) } : {}),
		});
		if (!response.ok) throw new Error(`ACE-Step ${new URL(url).pathname}: HTTP ${response.status}`);
		return response;
	};
	const post = async (route, body) => {
		const envelope = await (await request(new URL(route, base), body)).json();
		if (envelope?.code !== 200) throw new Error(`ACE-Step ${route}: ${envelope?.error || "invalid response"}`);
		return envelope.data;
	};
	let taskId, temporary;
	try {
		operation.throwIfAborted();
		const job = await post("/release_task", {
			prompt: prompt.trim(), lyrics, audio_duration: duration, batch_size: 1, audio_format: "mp3",
			thinking: false, use_cot_caption: false, use_cot_language: false,
		});
		if (typeof job?.task_id !== "string" || !job.task_id) throw new Error("ACE-Step returned no task ID");
		taskId = job.task_id;
		while (true) {
			const results = await post("/query_result", { task_id_list: [taskId] });
			const result = Array.isArray(results) && results.find(item => item?.task_id === taskId);
			if (!result || ![0, 1, 2].includes(result.status)) throw new Error("ACE-Step returned an invalid task status");
			if (result.status === 2) throw new Error("ACE-Step generation failed; inspect the server logs");
			if (result.status === 1) {
				const clips = JSON.parse(result.result);
				if (!Array.isArray(clips) || typeof clips[0]?.file !== "string" || !clips[0].file) throw new Error("ACE-Step returned no audio file");
				const audioUrl = new URL(clips[0].file, base);
				// Never forward the API key to an arbitrary URL supplied in a task result.
				if (audioUrl.origin !== base.origin || audioUrl.username || audioUrl.password || audioUrl.pathname !== "/v1/audio") throw new Error("ACE-Step returned an untrusted audio URL");
				const audio = await request(audioUrl);
				if (!audio.headers.get("content-type")?.toLowerCase().startsWith("audio/")) throw new Error("ACE-Step download is not audio");
				mkdirSync(path.dirname(target), { recursive: true });
				temporary = mkdtempSync(path.join(path.dirname(target), ".music-"));
				const partial = path.join(temporary, "clip.mp3");
				await pipeline(Readable.fromWeb(audio.body), createWriteStream(partial, { flags: "wx" }), { signal: operation });
				if (!statSync(partial).size) throw new Error("ACE-Step returned empty audio");
				operation.throwIfAborted();
				linkSync(partial, target);
				return target;
			}
			await sleep(1000, undefined, { signal: operation });
		}
	} catch (error) {
		const reason = deadline.aborted ? "Music generation timed out" : operation.aborted ? "Music generation cancelled" : error.message;
		throw new Error(`${reason}${taskId ? ` (task ${taskId}; the server job may still run)` : ""}`, { cause: error });
	} finally {
		if (temporary) rmSync(temporary, { recursive: true, force: true });
	}
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
	try {
		const { values, positionals } = parseArgs({
			allowPositionals: true,
			options: { output: { type: "string", short: "o" }, duration: { type: "string" }, lyrics: { type: "string" }, help: { type: "boolean", short: "h" } },
		});
		if (values.help) console.log('Usage: node music.mjs "music description" -o clip.mp3 [--duration 30] [--lyrics "..."]');
		else {
			if (positionals.length !== 1) throw new Error("Provide one quoted music description; use --help for usage");
			console.log(await generateMusic({ prompt: positionals[0], output: values.output, duration: values.duration === undefined ? 30 : Number(values.duration), lyrics: values.lyrics }));
		}
	} catch (error) { console.error(error.message); process.exitCode = 1; }
}
