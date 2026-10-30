import assert from 'node:assert/strict';
import { test } from 'node:test';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { composition } from './make.mjs';

function fixture() {
  return {
    durationSeconds: 24,
    beats: ['Request', 'Commit', 'Crash', 'Restart', 'Replay', 'Retry'].map((title, i) => ({
      title, narration: 'Store <seven> & reply.', audio: `${i}abc.wav`,
      startSeconds: i * 4, durationSeconds: 4, hold: .5,
    })),
  };
}

test('composition uses measured timings, local audio and escaped captions', () => {
  const html = composition(fixture());
  assert.match(html, /data-duration="24"/);
  assert.match(html, /id="voice-5" src="assets\/5abc.wav" data-start="20" data-duration="4"/);
  assert.match(html, /Store &lt;seven&gt; &amp; reply\./);
  assert.match(html, /"start":20,"actionDuration":3.5/);
  assert.doesNotMatch(html, /__(?:DURATION|MEDIA|TIMING)__/);
  assert.doesNotMatch(html, /https?:\/\//);
});

test('rejects mismatched stages, bad timing, holds and unsafe media paths', () => {
  for (const mutate of [
    p => p.beats.pop(),
    p => p.beats[2].title = 'Different film',
    p => p.beats[1].startSeconds = 0,
    p => p.beats[0].durationSeconds = NaN,
    p => p.beats[0].hold = 4,
    p => p.durationSeconds = Infinity,
    p => p.beats[0].audio = '../private.wav',
  ]) {
    const preview = fixture();
    mutate(preview);
    assert.throws(() => composition(preview));
  }
});

const chrome = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
test('scene survives random/backward seeks and retains the same visual objects', { skip: !existsSync(chrome) }, async () => {
  const { default: puppeteer } = await import('puppeteer-core');
  const directory = mkdtempSync(path.join(tmpdir(), 'explainer-hyperframes-'));
  let browser;
  try {
    mkdirSync(path.join(directory, 'assets'));
    copyFileSync(new URL('./node_modules/gsap/dist/gsap.min.js', import.meta.url), path.join(directory, 'assets/gsap.min.js'));
    writeFileSync(path.join(directory, 'index.html'), composition(fixture()));
    browser = await puppeteer.launch({ executablePath: chrome, headless: true });
    const page = await browser.newPage();
    await page.goto(pathToFileURL(path.join(directory, 'index.html')).href);
    await page.waitForFunction(() => !!window.__timelines?.durability);
    const result = await page.evaluate(() => {
      const ids = ['server', 'memory', 'record', 'crash', 'done', 'request'];
      const nodes = ids.map(id => document.getElementById(id));
      const state = time => {
        window.__timelines.durability.seek(time);
        return Object.fromEntries(ids.map(id => [id, Number(gsap.getProperty('#'+id, 'opacity'))]));
      };
      const crash = state(11.5);
      const restart = state(15.5);
      const recovered = state(19.5);
      const end = state(23.8);
      const crashAgain = state(11.5);
      const endAgain = state(23.8);
      const start = state(0);
      window.__timelines.durability.seek(.9);
      const x1 = Number(gsap.getProperty('#request', 'x'));
      window.__timelines.durability.seek(1.7);
      const x2 = Number(gsap.getProperty('#request', 'x'));
      return { crash, restart, recovered, end, crashAgain, endAgain, start, x1, x2,
        sameNodes: ids.every((id, i) => document.getElementById(id) === nodes[i]) };
    });
    assert.equal(result.crash.server, 0);
    assert.equal(result.crash.memory, 0);
    assert.equal(result.crash.record, 1);
    assert.equal(result.crash.crash, 1);
    assert.equal(result.restart.server, 1);
    assert.equal(result.restart.memory, 0);
    assert.equal(result.recovered.memory, 1);
    assert.equal(result.end.done, 1);
    assert.deepEqual(result.crashAgain, result.crash);
    assert.deepEqual(result.endAgain, result.end);
    assert.equal(result.start.record, 0);
    assert.equal(result.start.memory, 0);
    assert.equal(result.start.done, 0);
    assert.equal(result.sameNodes, true);
    assert.ok(result.x2 > result.x1, 'request moves within a beat, not just between still frames');
  } finally {
    await browser?.close();
    rmSync(directory, { recursive: true, force: true });
  }
});
