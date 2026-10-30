import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { generateMusic } from "./music.mjs";

async function fixture(t, handler = () => undefined) {
	const directory = mkdtempSync(path.join(tmpdir(), "music-test-"));
	const calls = [];
	let polls = 0;
	const server = createServer(async (request, response) => {
		let raw = "";
		for await (const chunk of request) raw += chunk;
		const body = raw ? JSON.parse(raw) : undefined;
		calls.push({ url: request.url, headers: request.headers, body });
		if (handler(request, response, body, directory)) return;
		response.setHeader("Content-Type", "application/json");
		if (request.url === "/release_task") response.end(JSON.stringify({ code: 200, data: { task_id: "task-1" } }));
		else if (request.url === "/query_result") response.end(JSON.stringify({ code: 200, data: [{ task_id: "task-1", status: polls++ === 0 ? 0 : 1, result: JSON.stringify([{ file: "/v1/audio?path=%2Ftmp%2Fclip.mp3" }]) }] }));
		else {
			response.setHeader("Content-Type", "audio/mpeg");
			response.end("ID3-test-audio");
		}
	});
	await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
	t.after(async () => {
		server.closeAllConnections();
		await new Promise(resolve => server.close(resolve));
		rmSync(directory, { recursive: true, force: true });
	});
	return { directory, calls, options: { prompt: "Mellow piano, no vocals", duration: 30, output: path.join(directory, "clip.mp3"), baseUrl: `http://127.0.0.1:${server.address().port}`, apiKey: "test-secret", timeout: 5000 } };
}

function ready(response, file = "/v1/audio?path=clip.mp3") {
	response.setHeader("Content-Type", "application/json");
	response.end(JSON.stringify({ code: 200, data: [{ task_id: "task-1", status: 1, result: JSON.stringify([{ file }]) }] }));
}

test("submits one instrumental, polls and downloads with auth", async t => {
	const { options, calls, directory } = await fixture(t);
	assert.equal(await generateMusic(options), options.output);
	assert.equal(readFileSync(options.output, "utf8"), "ID3-test-audio");
	assert.deepEqual(calls[0].body, { prompt: options.prompt, lyrics: "[Instrumental]", audio_duration: 30, batch_size: 1, audio_format: "mp3", thinking: false, use_cot_caption: false, use_cot_language: false });
	assert.deepEqual(calls[1].body, { task_id_list: ["task-1"] });
	assert.equal(calls.length, 4);
	assert.ok(calls.every(call => call.headers.authorization === "Bearer test-secret"));
	assert.deepEqual(readdirSync(directory), ["clip.mp3"]);
});

test("forwards supplied lyrics and does not require an API key", async t => {
	const { options, calls } = await fixture(t, (request, response) => {
		if (request.url === "/query_result") { ready(response); return true; }
	});
	await generateMusic({ ...options, apiKey: "", lyrics: "[Verse]\nHello world" });
	assert.equal(calls[0].body.lyrics, "[Verse]\nHello world");
	assert.equal(calls[0].headers.authorization, undefined);
});

test("rejects bad inputs and existing outputs before submitting", async t => {
	const { options, calls } = await fixture(t);
	for (const invalid of [{ prompt: " " }, { duration: 0 }, { duration: 601 }, { duration: NaN }, { output: "clip.wav" }, { lyrics: null }, { timeout: 0 }, { baseUrl: "file:///tmp" }, { baseUrl: "http://user:pass@localhost" }]) {
		await assert.rejects(generateMusic({ ...options, ...invalid }));
	}
	writeFileSync(options.output, "keep");
	await assert.rejects(generateMusic(options), /already exists/);
	assert.equal(readFileSync(options.output, "utf8"), "keep");
	assert.equal(calls.length, 0);
});

test("HTTP and envelope errors, failed jobs and malformed results leave no output", async t => {
	for (const scenario of ["http", "envelope", "failed", "missing", "malformed", "no-file", "status"]) {
		await t.test(scenario, async t => {
			const { options, directory } = await fixture(t, (request, response) => {
				response.setHeader("Content-Type", "application/json");
				if (scenario === "http") { response.writeHead(429); response.end("busy"); return true; }
				if (scenario === "envelope") { response.end(JSON.stringify({ code: 500, error: "unavailable" })); return true; }
				if (scenario === "missing") { response.end(JSON.stringify({ code: 200, data: {} })); return true; }
				if (request.url !== "/query_result") return;
				const result = scenario === "malformed" ? "not-json" : "[]";
				response.end(JSON.stringify({ code: 200, data: [{ task_id: "task-1", status: scenario === "failed" ? 2 : scenario === "status" ? 99 : 1, result }] }));
				return true;
			});
			await assert.rejects(generateMusic(options));
			assert.deepEqual(readdirSync(directory), []);
		});
	}
});

test("timeout covers a stalled HTTP request", async t => {
	const { options, directory } = await fixture(t, () => true);
	await assert.rejects(generateMusic({ ...options, timeout: 100 }), /timed out/);
	assert.deepEqual(readdirSync(directory), []);
});

test("cancellation interrupts polling and reports the task ID", async t => {
	const controller = new AbortController();
	const { options } = await fixture(t, request => {
		if (request.url === "/query_result") controller.abort();
	});
	await assert.rejects(generateMusic({ ...options, signal: controller.signal }), /cancelled.*task-1/);
});

test("does not send credentials to untrusted audio URLs or follow redirects", async t => {
	for (const file of ["http://example.com/v1/audio", "/not-audio", "http://user:pass@localhost/v1/audio", "/v1/audio?redirect=1"]) {
		await t.test(file, async t => {
			const { options, calls } = await fixture(t, (request, response) => {
				if (request.url === "/query_result") { ready(response, file); return true; }
				if (request.url.startsWith("/v1/audio")) { response.writeHead(302, { Location: "http://example.com" }); response.end(); return true; }
			});
			await assert.rejects(generateMusic(options));
			assert.ok(calls.length <= 3);
			assert.equal(existsSync(options.output), false);
		});
	}
});

test("bad or interrupted downloads and output races never publish partial files", async t => {
	for (const scenario of ["empty", "json", "truncated", "race"]) {
		await t.test(scenario, async t => {
			const { options, directory } = await fixture(t, (request, response, body, directory) => {
				if (request.url === "/query_result") { ready(response); return true; }
				if (!request.url.startsWith("/v1/audio")) return;
				response.setHeader("Content-Type", scenario === "json" ? "application/json" : "audio/mpeg");
				if (scenario === "race") writeFileSync(path.join(directory, "clip.mp3"), "keep");
				if (scenario === "truncated") { response.setHeader("Content-Length", "100"); response.flushHeaders(); response.write("partial"); response.destroy(); }
				else response.end(scenario === "empty" ? "" : "not-audio");
				return true;
			});
			await assert.rejects(generateMusic(options));
			assert.deepEqual(readdirSync(directory), scenario === "race" ? ["clip.mp3"] : []);
			if (scenario === "race") assert.equal(readFileSync(options.output, "utf8"), "keep");
		});
	}
});

test("CLI documents usage and rejects missing arguments", () => {
	assert.match(execFileSync(process.execPath, ["music.mjs", "--help"], { cwd: import.meta.dirname, encoding: "utf8" }), /Usage:/);
	assert.throws(() => execFileSync(process.execPath, ["music.mjs"], { cwd: import.meta.dirname, stdio: "pipe" }), /Command failed/);
});
