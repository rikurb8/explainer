# explainer

A [pi](https://github.com/earendil-works/pi) skill that turns Markdown into two kinds of single-file HTML pages:

- **Books**: long-form explainers (design docs, API guides, investigations) with a fixed book layout, typography,
  animated sequence and flow diagrams, steppers and notes.
- **Walkthroughs**: an interactive tutor in one HTML page. An agent (pi-durable and pi-ai, running in the browser)
  teaches a topic one concept at a time from bundled sources, draws figures on the fly, asks check questions and
  tracks progress. The reader signs in with an API key (or OAuth where the provider allows it) and chats.

100% slop: written by an agent, lightly supervised. Use at your own risk.

## Install

```sh
git clone https://github.com/badlogic/explainer ~/.pi/agent/skills/explainer
cd ~/.pi/agent/skills/explainer && npm install --ignore-scripts
```

pi picks the skill up from `~/.pi/agent/skills`. Ask it for an explainer, guide or walkthrough, or follow
[`SKILL.md`](SKILL.md) yourself.

## Use

```sh
node build.mjs book.md -o index.html                 # a book
cd <repo> && node <skill>/build.mjs walkthrough.md -o walkthrough.html   # a walkthrough (front matter kind: walkthrough)
```

[`SKILL.md`](SKILL.md) documents the format; [`template.md`](template.md) shows every book feature.
[`examples/durable/`](examples/durable) has a sample book and a sample walkthrough (with their built HTML) on how
pi-durable survives a crash: the reference for prose style and structure.

## Narrated video prototype

Build a narrated video about this repository, entirely locally on macOS:

```sh
# Requires Google Chrome, ffmpeg and ffprobe on PATH. Default speech is macOS's Samantha voice;
# set MISTRAL_API_KEY to use Mistral cloud TTS instead (see Speech providers below).
RUN="runs/$(date +%Y%m%d-%H%M%S)"
node video.mjs examples/video/explainer.md -o "$RUN"
open "$RUN/video.mp4"
node --test video.test.mjs
```

The output directory must not already exist. Outputs: a 1280×720 H.264/AAC `video.mp4`, an embedded subtitle
track, separate `captions.vtt`, and a `storyboard.html` for reviewing the visuals. Captions are also visible in
the video. No API keys, paid services, or new npm dependencies are needed. Set `CHROME_PATH` if Chrome is elsewhere.
The existing book and walkthrough builders are unchanged.

### Speech providers

Speech is configured with flat front-matter keys; the default is fully local:

```markdown
---
title: My video
tts-provider: mistral     # say (default) or mistral
tts-model: voxtral-mini-tts-3-0
tts-voice: voice_478      # say: an installed macOS voice; mistral: a preset slug or saved voice ID
tts-rate: 155             # say only: words per minute
---
```

- `say` (default): macOS `say`, offline, no key needed. Voice defaults to Samantha at 155 wpm.
- `mistral`: Mistral's Voxtral TTS (`POST /v1/audio/speech`), requires `MISTRAL_API_KEY` in the environment.
  Defaults to model `voxtral-mini-tts-3-0` and voice `gb_jane_neutral`. This sends narration text to Mistral's
  API — unlike the rest of the pipeline it is not offline, so avoid private content in narration.

### Run archives

Use a new, dated directory under `runs/` for each render (ignored by Git), rather than `/tmp` if you want to keep it:

```text
runs/20261029-213500/
  manifest.json       # status, settings, tool versions, renderer hashes, beat timings, artifact hashes
  trace.jsonl         # timestamped command starts, completions, failures and error diagnostics
  source.md           # exact input storyboard snapshot
  storyboard.html    # rendered visuals, including embedded SVG diagrams and CSS
  captions.vtt
  video.mp4
  assets/
    000.txt           # narration for beat 000
    000.aiff          # original synthesized speech
    000.png           # captured visual with caption
    ...
```

The manifest maps every beat to its scene, narration, start/end times and relative asset paths. It checkpoints
before and after each beat; completed and failed runs inventory the retained files with SHA-256 hashes and sizes.
The trace records commands and arguments, durations, exit codes, and bounded error diagnostics—not environment
variables or a copy of all tool output. Tool versions and renderer-file hashes record how the run was produced;
this is provenance, not a guarantee of bit-identical regeneration on another machine.

Successful runs discard only Chrome's temporary profile and redundant intermediate MP4 clips. On failure these
scratch files are also retained under `.render-*` for debugging, alongside a failed manifest and any assets already
created. If the process is killed abruptly, the manifest may still say `running`; the trace and checkpoint show
where it stopped. Invalid input and output-directory collisions are rejected before a run is created. Runs are
never overwritten, automatically pruned, or uploaded. There is no resume or asset-cache behavior yet.

Archives can contain private source text, spoken content and local paths. Keep them private unless reviewed.
They live on local disk only: back up the run directory if it matters; Git ignores `runs/` and `/tmp` is temporary.

### Storyboard format

Write a video-specific Markdown storyboard: front matter `title`, then one `# Heading` per scene. Use ordinary
book Markdown and diagrams for the visual, plus exactly one narration block per scene:

```markdown
# Following a request

A short visual, code sample, or diagram goes here.

:::narration
A short paragraph spoken while the first visual beat is shown.

Another paragraph advances the diagram and updates the caption.
:::
```

Each narration paragraph is a beat (maximum 240 characters; keep it shorter for readable captions). Speech runs
at the configured provider's pace (155 words per minute with the default say voice). Diagrams marked `animate`
reveal groups evenly across those beats; this is stepped scene animation, not word-level synchronization or
full-motion video. Use short visuals that fit one slide. `storyboard.html?scene=0&beat=0` previews a specific
zero-indexed beat.

Only render trusted Markdown: as with books, raw HTML and scripts are supported and run in Chrome. Captions are
synthesized locally; speech comes from the configured provider (local `say` by default, Mistral cloud TTS when
selected — see Speech providers). Review factual claims, visual fit, speech pronunciation and timing before
sharing. Source research and script writing are author/agent tasks, not automatic behavior of this CLI. This
first version does not support music, sound effects, avatars, or precise cue timing.

## Layout

- `build.mjs`: the book and walkthrough CLI.
- `video.mjs`: the local narrated-video CLI; `examples/video/explainer.md` is the sample storyboard.
- `lib/render.mjs`: Markdown, directives and the page runtime (shared by books and walkthrough cards).
- `lib/diagrams.mjs`, `lib/highlight.mjs`: the flow and sequence DSLs, code highlighting.
- `lib/walkthrough.mjs`: builds walkthrough pages (outline, check questions, bundled sources).
- `book.css`: the design.
- `walkthrough/`: the browser runtime of walkthroughs. `dist/runtime.js` is prebuilt and committed, so building a
  walkthrough needs no bundler. Rebuild it with `cd walkthrough && npm install --ignore-scripts && npm run check &&
  npm run build`.

## License

MIT
