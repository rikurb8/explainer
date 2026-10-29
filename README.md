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
the video. Motion roughly triples encode time (about half of realtime, so a two-minute video renders in just over
a minute). No API keys, paid services, or new npm dependencies are needed. Set `CHROME_PATH` if Chrome is elsewhere.
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
tts-speed: 1              # any provider: pitch-preserving stretch of the speech, 0.5–2
---
```

- `say` (default): macOS `say`, offline, no key needed. Voice defaults to Samantha at 155 wpm.
- `mistral`: Mistral's Voxtral TTS (`POST /v1/audio/speech`), requires `MISTRAL_API_KEY` in the environment.
  Defaults to model `voxtral-mini-tts-3-0` and voice `gb_jane_neutral`. This sends narration text to Mistral's
  API — unlike the rest of the pipeline it is not offline, so avoid private content in narration.

Voxtral reads at about 2.0 words/s and has no rate setting, against 2.75 for `say` at 155 wpm, so the same script
runs 40% longer. `tts-speed: 1.4` brings it back in line (the same 12-shot script: 56.6s at 1.0, 38.8s at 1.4).
It stretches the synthesized speech with `atempo`, which preserves pitch, and lands before the pause is added,
so captions and cut lengths follow the shortened speech.

### Run archives

Use a new, dated directory under `runs/` for each render (ignored by Git), rather than `/tmp` if you want to keep it:

```text
runs/20261029-213500/
  preview.html        # the live view: refreshes itself, shows frames as they land, plays the video at the end
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
---
title: My video
pause: 0.35     # silence after every beat, seconds; 0.1 for a fast cut
visual: 1       # zoom on the visual, so the frame is not half empty; 1.2 for fast style
---

# Following a request

A short visual, code sample, or diagram goes here.

:::narration
A short paragraph spoken while the first visual beat is shown.

Another paragraph advances the diagram and updates the caption.
:::

# Word card

:::flash
Down 3x
Fewer cuts
:::

:::narration
A flash block turns the scene into big words with no caption line.
:::
```

Each narration paragraph is a beat (maximum 240 characters; keep it shorter for readable captions), and each scene
is one shot: only a new `# scene` changes the visual, so several beats in one scene hold the same picture. Speech
runs at the configured provider's pace (155 words per minute with the default say voice). Diagrams marked
`animate` reveal groups evenly across those beats; this is stepped scene animation, not word-level synchronization
or full-motion video. Use short visuals that fit one slide.

Rhythm comes from two things, and only one of them is the words:

- `:::narration hold=1.4` lengthens the shot its scene ends on, so a punchline sits in silence the way an editor
  holds a frame. It applies to the scene's last beat (the visual changes at the scene boundary, not before) and
  overrides `pause` for that beat only. Default hold is `pause`.
- the kind of motion is picked from the visual: a `:::flash` card cuts hard, a code block sits dead still so it can
  be read, anything else (text, figures) fades in and snaps from 6% to 100% over twelve frames. Motion on every cut
  is not punctuation.

Both are recorded per beat in the manifest (`hold`, `kind`), so a render can be audited for its shape.
`storyboard.html?scene=0&beat=0` previews a specific zero-indexed beat.

### Watching and auditing a run

`preview.html` is written on every checkpoint, so a render can be watched in a browser while it runs: it refreshes
itself every two seconds while the run is live (and stops when it ends, so the player works), shows each beat's
frame, kind, hold and length as they land, and plays `video.mp4` afterwards with the first frame as its poster.
It follows the system light or dark appearance. It self-refreshes rather than polling `manifest.json` because a `file://` page cannot fetch it;
no server is involved.

When the render is done, `node video.mjs runs/<run> --inspect` prints what actually happened, per beat: measured
speech seconds, words per second, and how far that beat sits from the run's own median, plus the share of runtime
spent in holds and the estimate behind `--check`. Beats with eight or more words that speak at under 75% of the
median are listed as split candidates. Short lines are not flagged: a four-word line is one clause, and its length
is the provider's lead-in plus comma pauses, which no word count predicts. This is text rather than a page because
the reader is the agent revising the script.

Pace and rhythm are script decisions, so check them before paying for a render: `node video.mjs script.md --check`
prints shots, beats, words, estimated length, shots per minute, a rhythm bar with mean/sd/cv, and warnings for long
beats, scenes holding several beats, four similar shots in a row, no shot long enough to give the eye a rest, and an
even cadence. `examples/video/fireship.md` is the fast style (12 shots, 29 seconds, cv 0.37);
`examples/video/explainer.md` is the relaxed one.

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
