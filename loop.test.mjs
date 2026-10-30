import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { decorate, loopReport, runLoop, sampleTimes, verdict } from "./loop.mjs";

test("verdict reads the report line, unknown otherwise", () => {
	assert.equal(verdict("# Review: x\n\n**Verdict:** Revise — the hook is late."), "revise");
	assert.equal(verdict("**Verdict:** ready — fine."), "ready");
	assert.equal(verdict("no report"), "unknown");
});

test("one sample per completed beat, at its midpoint", () => {
	const beats = [{ id: "000", status: "completed", startSeconds: 0, endSeconds: 4 }, { id: "001", status: "failed", startSeconds: 4, endSeconds: 6 }];
	assert.deepEqual(sampleTimes({ beats }), [{ id: "000", at: 2 }]);
});

test("findings get severity badges and seekable timestamps", () => {
	const html = decorate("<strong>R2 · still open · 01:02.5–01:04, beat 003</strong>");
	assert.match(html, /R2 <span class="sev s-still-open">still open<\/span>/);
	assert.match(html, /data-t="62.5">01:02.5<\/a>/);
	assert.match(html, /data-t="64">01:04<\/a>/);
});

test("invalid pass counts are rejected before output is created", async (t) => {
	const tmp = mkdtempSync(path.join(os.tmpdir(), "loop-test-"));
	t.after(() => rmSync(tmp, { recursive: true, force: true }));
	const out = path.join(tmp, "out");
	for (const passes of [0, -1, 1.5, Infinity, NaN, Number.MAX_SAFE_INTEGER + 1]) {
		await assert.rejects(runLoop("unused.md", out, { passes }), /passes must be a positive safe integer/);
		assert.equal(existsSync(out), false);
	}
});

test("paused reports do not refresh and running reports do", (t) => {
	const tmp = mkdtempSync(path.join(os.tmpdir(), "loop-test-"));
	t.after(() => rmSync(tmp, { recursive: true, force: true }));
	const state = { input: "storyboard.md", passes: 2, startedAt: new Date().toISOString(), steps: [], paused: true };
	writeFileSync(path.join(tmp, "loop.json"), JSON.stringify(state));
	assert.doesNotMatch(loopReport(tmp), /http-equiv="refresh"/);
	assert.match(loopReport(tmp), /awaiting director feedback/);
	state.paused = false;
	writeFileSync(path.join(tmp, "loop.json"), JSON.stringify(state));
	assert.match(loopReport(tmp), /http-equiv="refresh"/);
});

test("render failures are recorded and propagated without leaving a live report", async (t) => {
	const tmp = mkdtempSync(path.join(os.tmpdir(), "loop-test-"));
	t.after(() => rmSync(tmp, { recursive: true, force: true }));
	const input = path.join(tmp, "invalid.md"), out = path.join(tmp, "out");
	writeFileSync(input, "not a storyboard");
	await assert.rejects(runLoop(input, out, { passes: 1 }), { status: 1 });
	const state = JSON.parse(readFileSync(path.join(out, "loop.json"), "utf8"));
	assert.ok(state.finishedAt);
	assert.equal(state.paused, false);
	assert.equal(state.steps.at(-1).pass, 1);
	assert.match(state.steps.at(-1).event, /^failed:/);
	const report = readFileSync(path.join(out, "report.html"), "utf8");
	assert.match(report, /failed:/);
	assert.doesNotMatch(report, /http-equiv="refresh"/);
});
