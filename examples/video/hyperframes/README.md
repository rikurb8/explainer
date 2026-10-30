# A continuous scene, timed to speech

A standalone integration proof, not a replacement for `video.mjs`. One request moves through a server, a durable log, a process crash, recovery, and a retry. The same visual objects persist across all six narration beats.

## Run

Needs Node 22+, macOS with the Samantha speech voice, FFmpeg/FFprobe, and Chrome. Install the parent skill's dependencies first if `marked` is missing (`npm ci --ignore-scripts` at the skill root).

From this directory:

```sh
npm ci --ignore-scripts
npm test
npm run build
npm run lint
npm run check
npm run preview
# After reviewing the preview, in another terminal:
npm run render
open video.mp4
```

`npm run preview` launches the HyperFrames browser editor. The CLI may download its browser on first use. Set `CHROME_PATH` for the browser test if Chrome isn't in the standard macOS location; that test explicitly skips when no executable is found. HyperFrames manages its own browser separately.

The generated project is at `project/index.html`; the rendered movie is `video.mp4`. Both are ignored by Git. The project also contains the source storyboard, measured `timing.json`, audio assets, and a sidecar `captions.vtt`. Captions are visible in the film; the VTT is not embedded as a separate MP4 subtitle track.

## Edit

- `storyboard.md`: narration, voice, pauses, and static reference visuals. Keep the six stage headings in order.
- `scene.html`: the persistent HTML/SVG diagram and its paused GSAP timeline.
- `make.mjs`: calls Explainer's existing `prepareRehearsal` helper, then inserts measured timings and local audio into the composition.

Build synthesizes speech before authoring the final timeline. Cues use fractions of each measured spoken window, excluding its hold; changing a line retimes its animation without guessing words per minute. This is beat-level synchronization, not word-level alignment. Only changed speech is synthesized again. Rebuild and rerun check after edits.

Speech is explicitly local (`tts-provider: say`). GSAP is copied into the project rather than fetched from a CDN. Once installed, the composition requires no cloud service or API key. HyperFrames CLI scripts disable its usage telemetry. The `undici` override patches advisories in the CLI's pinned transitive dependency; installation audit reports zero vulnerabilities.

## What this proves

The 24.07-second draft renders 722 actual animation frames at 1280×720/30fps, rather than adding camera motion to six screenshots. A local render took about 18 seconds on this machine; that is not a benchmark guarantee.

Tests check measured timing, media-path validation, caption escaping, motion inside a beat, object identity, and direct/backward seeking through crash and recovery. HyperFrames lint/check report no errors or warnings, including layout, contrast and audio. Existing video/rehearsal/loop tests remain unchanged and pass.

The film is an illustrative protocol, not recorded execution. It assumes the durable log includes request IDs and the server deduplicates retries. It demonstrates recovery from a process crash, not loss of the storage device, and does not claim that durability alone provides exactly-once effects.

Next decision: judge this film against the existing still-frame style before adding a HyperFrames path to the shared renderer. No editor embedding, cloud rendering, new animation DSL, or automatic conversion of arbitrary storyboards is included.

References: [GSAP contract](https://hyperframes.heygen.com/guides/gsap-animation), [composition schema](https://hyperframes.heygen.com/reference/html-schema), [CLI rendering](https://hyperframes.heygen.com/guides/rendering).
