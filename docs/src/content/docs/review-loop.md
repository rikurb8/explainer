---
title: Review and revision
description: Run bounded video revision passes with separate reviewer and author agents.
---
The skill can review code or critique videos without changing them. The video loop
adds controlled revisions: render, gather evidence, review, then revise a copy.

## Run a bounded loop

You need the video-rendering tools, a working `pi` command with model access, and
transcription support available to the reviewer. From the repository root:

```sh
node loop.mjs examples/video/fireship.md \
  -o "runs/loop-$(date +%Y%m%d-%H%M%S)" \
  --passes 2 --pause
```

The output directory must be new. The original storyboard is copied and never
edited. Reviewer and author run as separate pi processes. Each pass renders again,
so speech and agent calls can incur additional provider costs.

With `--pause`, the loop waits before a revision. Enter continues, text becomes
director notes, and `q` stops. Director notes override conflicting review advice.

## Read the evidence

Open the loop directory's `report.html`. Each pass has a tab with its verdict,
findings, video, sampled frames, and author changes. Timestamp links seek the video.
The report updates during the loop and pauses refreshing while awaiting input.

Each `pass-N/` retains its storyboard, render, sampled frames, review, and logs.
Later passes also retain the author's change summary. `loop.json` records steps.

The loop stops at the pass limit or earlier on `ready`, `blocked`, or an
unparseable verdict. A ready verdict is bounded by the reviewer's actual coverage.

## Select models or regenerate the report

```sh
node loop.mjs storyboard.md -o runs/my-loop --passes 2 \
  --review-model PROVIDER/MODEL --revise-model PROVIDER/MODEL
node loop.mjs runs/my-loop --report
```

Set `PI_BIN` to use a different pi executable.

## Review without revisions

Ask pi to review a run for clarity, entertainment, pacing, and audiovisual
execution, or to review a code change. The workflow records what was inspected,
evidence-backed findings, and prioritized changes. Transcript-and-frame sampling
is not equivalent to watching and hearing the whole video.

The full [review contract](https://github.com/rikurb8/explainer/blob/main/review/review.md)
defines coverage and report structure. Agent roles and tool restrictions are workflow
controls, not an operating-system security sandbox. Run loops only on trusted inputs.
