# Video review

Judge whether this audience would want to keep watching, understand the point, and remember the payoff. Entertainment is an editorial judgement, not a measured retention score.

## 1. Establish the evidence

Identify the rendered file, duration, audience, intended style, and available source. A storyboard alone gets a **script review**, not a verdict on the finished video.

For explainer output, read [../SKILL.md](../SKILL.md)'s video instructions, then inspect the supplied run directory:

- `source.md`: the exact storyboard used for that run, not a potentially newer working copy.
- `manifest.json`: status, beat IDs, narration, start/end times, asset paths, and measured durations.
- `captions.vtt`: authored captions, useful for navigation but not proof of what was spoken.
- `video.mp4`: the actual delivered artifact.
- `node <explainer-skill>/video.mjs <run-directory> --inspect`: measured rhythm and hold diagnostics.

Resolve manifest asset paths against the run directory. An incomplete run is not a finished video. Use its completed portions only, and say so.

## 2. Inspect the experience

Use a tool that actually exposes video/audio to the reviewing model when available. A successful “play” click in a browser does not itself mean the model saw or heard playback.

For a short POC video, cover the whole timeline. First follow it in order for the viewer's experience; then revisit problem intervals for evidence. Record where attention would plausibly drop, where a term becomes confusing, and where the payoff lands.

When direct audiovisual inspection is unavailable, do a clearly labeled **sampled review**:

1. Probe duration and streams with `ffprobe`.
2. Use `transcribe_file` on the delivered media for spoken content. Compare transcription with the storyboard/captions; verify suspected transcription errors before treating them as defects. Transcription does not establish voice quality, pronunciation, or music balance.
3. Inspect an actual encoded frame from every beat (or samples across the timeline for non-explainer videos), including the opening and ending. Add frames around suspected cuts or clipping. Read each extracted image with the image-capable read tool; file existence is not visual inspection.
4. Use manifest timing to support claims about holds and shot lengths. Source PNGs help map a finding but cannot prove final-encode legibility or motion quality.
5. State exact sample times/intervals and remaining gaps. Reserve claims about motion, synchronization, delivery, and sound quality for evidence that actually exposes them.

For long videos, agree on a bounded interval or sampling plan and label the result partial. If media tools are missing, explain what is needed and ask before installing anything; offer a script-only review if source exists.

### Local inspection commands

Use absolute paths and a fresh temporary directory. These commands inspect locally without overwriting the input:

```sh
video="/absolute/path/to/video.mp4"
work="$(mktemp -d)"
ffprobe -v error -show_entries format=duration:stream=codec_type,width,height,r_frame_rate -of json "$video"
# Example: an encoded frame at 12.5 seconds. Choose times from the actual timeline.
ffmpeg -v error -nostdin -n -ss 12.5 -i "$video" -frames:v 1 "$work/at-12.500.png"
```

For an explainer run, choose beat midpoints from `startSeconds` and `endSeconds`; add samples near boundaries as needed. Record each timestamp with its image. Keep full-resolution samples to judge text readability; thumbnails alone can hide defects.

## 3. Apply the editorial lens

Cover these dimensions with observations or explicitly mark them unassessed:

| Dimension | Question |
| --- | --- |
| Hook | Does the opening give this viewer a concrete reason to care, before setup consumes their attention? |
| Clarity | Is there one comprehensible idea per beat? Are terms and claims introduced with enough context? |
| Entertainment | Where are curiosity, surprise, contrast, specificity, or a satisfying reveal? Where does repetition replace progression? |
| Pacing and rhythm | Is there time to read and think? Which holds drag, which cuts rush, and does the rhythm serve the idea? |
| Visual storytelling | Does the image demonstrate something, or merely repeat narration? Is code/text legible and unclipped? |
| Sound and delivery | If audible evidence is available: is speech intelligible, pronunciation credible, and silence/music purposeful? |
| Payoff and truth | Does the ending deliver the opening's promise? Are claims supported by supplied sources, with uncertainty intact? |

Match the intended style. A relaxed tutorial need not cut like a fast demo. Shot-rate statistics are clues, not quality gates; recommend faster cuts only when a specific interval needs them. Prefer a concrete edit (“replace the second definition with the failure example”) over “make it more engaging.” Avoid numeric entertainment scores that imply a measured audience response.

## 4. Return actionable notes

Use the report in [review.md](review.md). Ground video findings in timestamp ranges and map to source scene/beat IDs when available. For a rewrite suggestion, give the replacement line or visual idea, not a whole new screenplay.

A useful finding looks like this (illustrative, not a review of a real run):

> **R1 · should fix · 00:12–00:20, beat 003 — The setup repeats instead of advancing.**  
> Evidence: the narration defines the same term a second time while the card remains unchanged. Judgement: this is a likely attention dip for the stated experienced audience.  
> Impact: eight seconds pass without new information before the promised example.  
> Change: cut the second definition and bring the failure example forward.  
> Check: in the next render, the example follows the first definition without a repeated explanation.

When comparing revisions, use stable finding IDs but refresh timestamps: edits move the timeline. Reinspect the affected intervals and their neighbors; disclose whether the rest of the new render was checked.
