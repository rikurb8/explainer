---
title: What survives a crash
tts-provider: mistral
tts-voice: gb_jane_neutral
tts-speed: 1.15
pause: 0.25
---

# Request

:::flow | A single request, followed through recovery.
row
box client "Client" "Waiting for a reply" blue
box server "Server" "Volatile memory" accent
box log "Durable log" "Survives a process crash" muted
arrow client -> server "write x = 7"
:::

:::narration
A client asks the server to store seven.
:::

# Commit

The server appends the write to durable storage before acknowledging it.

:::narration
Before replying, the server commits the write to a durable log.
:::

# Crash

The process crashes after committing, but before replying. Its memory is lost.

:::narration hold=0.7
Then the server crashes. Its memory disappears. The log survives.
:::

# Restart

A replacement process starts with empty memory.

:::narration
A replacement server starts with nothing in memory.
:::

# Replay

Replaying the committed log reconstructs the stored value.

:::narration
It replays the committed write. Seven is back in memory.
:::

# Retry

The client retries with the same request ID. The server recognizes the committed request.

:::narration hold=2
The client retries the same request. The server recognizes it and replies.
:::
