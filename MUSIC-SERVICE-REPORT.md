# Managed music generation: options and recommendation

Date: 2026-10-30

## Question

We currently generate music by running ACE-Step locally and calling it through `music.mjs`.
What managed service should we use if we want the same capability without running a GPU?

## Recommendation

Use **ElevenLabs Music** as the first managed provider, behind the existing `generateMusic()` interface.
Do not build our own hosted relay until someone needs to generate music without supplying their own key.

Reasons:

- One synchronous request returns audio. No queue, polling, or worker process.
- API takes a prompt, length, and `force_instrumental`, which matches our current command.
- One API key and a paid plan; no cloud project or service account.
- Commercial licensing is available on Starter and above.
- Predictable list price of **$0.15 per generated minute**.
- Sound effects are available from the same vendor if the explainer later needs them.

## Options compared

| Provider | Output | Access | Indicative cost | Main trade-off |
|---|---|---|---|---|
| **ElevenLabs Music** | Up to 10 min, vocals or instrumental, MP3/WAV/Opus | One API key, paid plan | $0.15/min | Prompts and audio leave the machine; per-minute cost |
| **Google Lyria 3 / Lyria 3 Pro** | Lyria 3: 30-second clips. Pro: up to 184 seconds, with vocals, WAV | Vertex AI, GCP project | Per-track; verify in current Cloud pricing | GCP setup; preview status; fixed length buckets |
| **Stability Stable Audio** | Instrumental beds and sound effects, up to a few minutes | Self-serve API, also via fal/Replicate | Per generation; verify current pricing | Weaker fit for full songs and vocals |
| **fal / Replicate** | Many music models behind one API | One aggregator key | Per-second or per-call | Licensing and SLA belong to the model vendor, not the aggregator |
| **Suno** | Strong full songs | Official developer API is not generally self-serve | — | Not suitable as a current dependency |

Prices and preview status change. Verify them before committing to a production budget.

## What the integration looks like

The public interface stays the same:

```js
await generateMusic({ prompt, duration, output });
```

Only the transport changes:

```text
generateMusic()
  ├─ MUSIC_PROVIDER=ace         → local ACE-Step: submit → poll → download
  └─ MUSIC_PROVIDER=elevenlabs  → POST /v1/music → write response body
```

ElevenLabs request:

```http
POST https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128
xi-api-key: <key>
Content-Type: application/json

{
  "prompt": "Warm lo-fi hip-hop, mellow felt piano, soft vinyl crackle, no vocals",
  "music_length_ms": 30000,
  "force_instrumental": true,
  "model_id": "music_v2_5"
}
```

The response is the audio file. Save it through the existing private-temp-file-and-link step, so timeouts, partial downloads, and the no-overwrite rule behave exactly as they do today.

## Cost

At the list price:

| Clip length | Approx. cost |
|---|---|
| 15 s | $0.04 |
| 30 s | $0.08 |
| 60 s | $0.15 |
| 3 min | $0.45 |

Local ACE-Step has no per-clip fee, but needs a GPU and model downloads. A rented GPU is usually more expensive than a few managed clips and only wins at sustained volume.

## Privacy and licensing

- Prompts and generated audio are sent to the provider. This is a change from the local `say` narration path, so managed music must be an explicit opt-in.
- Commercial use depends on the provider plan and terms. Store the chosen provider and model alongside each generated clip.
- Keep API keys server-side or in the user's environment. Never embed them in generated pages or run archives.

## When to build our own service

Build a hosted relay only if users must generate music without their own provider key.

That service would be:

```text
POST /music
  → authenticate caller
  → check per-user spend cap
  → call provider
  → store audio in object storage
  → return a short-lived signed URL
```

It needs auth, rate limiting, spend caps, content policy, retention rules, and monitoring. That is a product, not an adapter. Defer it.

## Rollout

1. Add the ElevenLabs adapter behind `MUSIC_PROVIDER`; keep ACE-Step as the default.
2. Reuse the existing timeout, cancellation, no-overwrite, and partial-download handling.
3. Add contract tests that mock the provider response, including HTTP errors and truncated audio.
4. Run one real generation and decode the result with `ffmpeg`.
5. Document the key, opt-in, retention, and licensing requirements.

## Baseline evidence

Current local path, Apple Silicon:

- 15-second lo-fi request completed in 6.1 seconds.
- Output: 240,812-byte MP3, 48 kHz stereo.
- `ffmpeg` decoded the file completely.
- 24/24 client tests passed.

This is a single observed run, not a benchmark.

## Sources

- ElevenLabs Music API: https://elevenlabs.io/docs/api-reference/music/compose
- ElevenLabs API pricing: https://elevenlabs.io/pricing/api
- Google Lyria overview: https://docs.cloud.google.com/vertex-ai/generative-ai/docs/music/overview

## Open questions

- Is managed music opt-in acceptable for users who chose local-only narration?
- What monthly budget cap should the client enforce before calling a paid provider?
- Do we need vocals, or only instrumental beds under narration?
