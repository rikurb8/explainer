import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { prepareRehearsal } from '../../../lib/rehearsal.mjs';
import { encode } from '../../../lib/render.mjs';
import { timestamp } from '../../../video.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const stages = ['Request', 'Commit', 'Crash', 'Restart', 'Replay', 'Retry'];

// This is one authored film, not a general storyboard-to-animation compiler.
export function composition(preview) {
  if (preview.beats.length !== stages.length) throw new Error('Expected six narration beats');
  let end = 0;
  for (const [i, beat] of preview.beats.entries()) {
    if (beat.title !== stages[i]) throw new Error(`Expected stage ${stages[i]}`);
    if (!Number.isFinite(beat.durationSeconds) || beat.durationSeconds <= 0 ||
        !Number.isFinite(beat.startSeconds) || Math.abs(beat.startSeconds - end) > 1e-6) {
      throw new Error('Invalid or non-contiguous measured beat timing');
    }
    if (!Number.isFinite(beat.hold) || beat.hold < 0 || beat.hold >= beat.durationSeconds) {
      throw new Error('Invalid narration hold');
    }
    if (!/^[a-f0-9]+\.wav$/.test(beat.audio)) throw new Error('Expected generated local WAV filename');
    end += beat.durationSeconds;
  }
  if (!Number.isFinite(preview.durationSeconds) || Math.abs(end - preview.durationSeconds) > 1e-6) {
    throw new Error('Composition duration differs from narration');
  }
  const timing = preview.beats.map(b => ({ start: b.startSeconds, actionDuration: b.durationSeconds - b.hold }));
  const media = preview.beats.map((b, i) => `
    <audio id="voice-${i}" src="assets/${b.audio}" data-start="${b.startSeconds}" data-duration="${b.durationSeconds}" data-track-index="1"></audio>
    <p id="caption-${i}" class="caption clip" data-start="${b.startSeconds}" data-duration="${b.durationSeconds}" data-track-index="2">${encode(b.narration)}</p>`).join('');
  return readFileSync(path.join(HERE, 'scene.html'), 'utf8')
    .replaceAll('__DURATION__', String(preview.durationSeconds))
    .replace('__TIMING__', JSON.stringify(timing))
    .replace('__MEDIA__', media);
}

export function build() {
  const project = path.join(HERE, 'project');
  const assets = path.join(project, 'assets');
  mkdirSync(assets, { recursive: true });
  const source = readFileSync(path.join(HERE, 'storyboard.md'), 'utf8');
  // Reuse Explainer's speech cache, speed adjustment, silence and 30fps rounding.
  const preview = prepareRehearsal(source, assets, undefined, p => console.log(`Speech ${p.completed}/${p.total}`));
  const html = composition(preview);
  copyFileSync(path.join(HERE, 'node_modules/gsap/dist/gsap.min.js'), path.join(assets, 'gsap.min.js'));
  writeFileSync(path.join(project, 'index.html'), html);
  const { html: unused, ...manifest } = preview;
  writeFileSync(path.join(project, 'timing.json'), JSON.stringify(manifest, null, 2) + '\n');
  writeFileSync(path.join(project, 'storyboard.md'), source);
  writeFileSync(path.join(project, 'captions.vtt'), 'WEBVTT\n\n' + preview.beats.map(b =>
    `${timestamp(b.startSeconds)} --> ${timestamp(b.startSeconds + b.durationSeconds)}\n${encode(b.narration)}\n`
  ).join('\n'));
  console.log(`Built ${project}/index.html (${preview.durationSeconds.toFixed(2)}s)`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) build();
