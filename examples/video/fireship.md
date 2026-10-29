---
title: Markdown to video
pause: 0.1
tts-rate: 175
visual: 1.2
---

# In, video out

:::flash
Markdown in
Video out
:::

:::narration hold=0.05
Markdown in. Video out.
:::

# Local

:::flash
Chrome renders
FFmpeg stitches
:::

:::narration hold=0.05
Chrome draws. FFmpeg stitches.
:::

# Four steps

:::flow animate | Four processes, one command.
row
box say "say" "Speech per beat" muted
box chrome "Chrome" "One frame per beat" accent
box ffmpeg "FFmpeg" "One clip per beat" blue
box mp4 "MP4" "Concatenated" muted
arrow say -> chrome
arrow chrome -> ffmpeg
arrow ffmpeg -> mp4
:::

:::narration
Speech, frame, clip. Then concatenate.
:::

# One beat, one cut

:::flash
One beat
One cut
:::

:::narration
One spoken paragraph. One cut.
:::

# Nine seconds

:::flash
9s
per cut
:::

:::narration hold=0.7
The sample cuts every nine seconds.
:::

# Twelve words

:::flash
12 words
4 seconds
:::

:::narration
Twelve words is four seconds.
:::

# The two lines

```md
---
pause: 0.1     # after every beat
tts-rate: 175  # words per minute
---
```

:::narration
Two lines set the pace.
:::

# Check first

```sh
node video.mjs script.md --check
```

:::narration
Check the pace before you render.
:::

# Word cards

:::flash
Everything
is a cut
:::

:::narration hold=0.05
Word cards. No caption.
:::

# Provenance

:::stats
- 1 manifest | per run
- 3 tools | versioned
- every file | SHA-256
:::

:::narration
Every run keeps a manifest.
:::

# Snap

Cards cut hard. Code sits still so it can be read. Everything else snaps in from 6%.

:::narration
Cards cut hard. Slides snap in.
:::

# Done

:::flash
That is
the whole
pipeline
:::

:::narration hold=2.4
Change one constant. Fix the pace.
:::
