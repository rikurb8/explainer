---
title: Narrated videos
description: Rehearse a storyboard, render an MP4, and inspect measured timing.
---
The video CLI combines Markdown visuals, synthesized speech, Chrome screenshots,
and ffmpeg encoding. It does not research or write the script for you.

## Check, rehearse, then render

From the repository root:

```sh
node video.mjs examples/video/fireship.md --check
node video.mjs examples/video/fireship.md --preview
```

The check reports estimated duration, shot cadence, and pacing warnings.
The rehearsal server runs on loopback: play, scrub, loop a scene, and edit the
Markdown. Valid changes refresh the preview; a broken edit keeps the last good
version. Changed lines are synthesized again. Stop with Ctrl+C.

When the script is ready:

```sh
RUN="runs/$(date +%Y%m%d-%H%M%S)"
node video.mjs examples/video/fireship.md -o "$RUN"
node video.mjs "$RUN" --inspect
```

The output directory must be new. Rendering requires Chrome, ffmpeg, and ffprobe.
Set `CHROME_PATH` if Chrome is not at the default macOS application path.

## Write a storyboard

```markdown
---
title: One source, two views
tts-provider: say
pause: 0.1
visual: 1.2
---

# The source

:::flash
Write once
Render twice
:::

:::narration
The same source feeds the book and the video.
:::

# The output

A book to read. A video to watch.

:::narration hold=1.4
Change the source, then rebuild both.
:::
```

One top-level heading is a scene. Exactly one narration block belongs to each scene;
each paragraph in that block is a beat, limited to 240 characters. Several beats
within one scene keep the same visual. A scene's `hold` overrides the pause after
its last beat.

## Choose where speech happens

| Setting | Behavior |
| --- | --- |
| Default `tts-provider: mistral` | Sends narration to Mistral with `MISTRAL_API_KEY` |
| `tts-provider: say` | Offline macOS speech |
| No Mistral key on macOS | Falls back to local speech |
| No Mistral key elsewhere | Fails with setup guidance |

Mistral defaults to `voxtral-mini-tts-3-0` and `gb_jane_neutral`.
Local speech defaults to Samantha at 155 words per minute.
`tts-speed` stretches speech without changing pitch, from 0.5 to 2.
Only local speech uses `tts-rate`.

:::caution[Private narration]
Rendering is not entirely offline by default. Rehearsal also synthesizes speech.
Choose `say` explicitly for private narration on a Mac.
:::

## Keep and inspect a run

A run contains `video.mp4` (1280×720 H.264/AAC), `captions.vtt`,
`storyboard.html`, `source.md`, assets, `manifest.json`, and `trace.jsonl`.
Open `preview.html` during a render to watch frames arrive; it plays the video
when the run finishes.

The manifest checkpoints beat timings and inventories retained artifacts.
`--inspect` reports measured speech and unusually slow beats.
Failed runs keep diagnostic artifacts. There is no automatic resume or pruning.

Archives can contain source text, audio, local paths, and private material.
They are ignored by Git, not backed up or uploaded automatically.
The rehearsal is not a frame-exact preview of final encoding. Review pronunciation,
captions, visual fit, and factual claims before sharing.
