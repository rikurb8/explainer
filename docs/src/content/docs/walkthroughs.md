---
title: Walkthroughs
description: Build an interactive tutor backed by bundled source files.
---
A walkthrough puts an agent in an HTML page. It teaches one concept at a time,
draws figures, asks check questions, and tracks the reader's progress.

## Write the teaching outline

Save `walkthrough.md` in the repository whose sources you want to teach:

```markdown
---
title: Learning this project
kind: walkthrough
subtitle: Trace a book from Markdown to HTML.
sources:
  - README.md
  - lib/render.mjs
truth: Code wins over the README.
---

:::tutor
The reader knows JavaScript, but not this project. Start with one concrete example.
:::

:::intro
We will follow a Markdown book through parsing, rendering, and the browser runtime.
:::

# The source {#source part="Building a book"}

Explain the role of Markdown and directives. Read README.md first.

:::check
1. What file should you edit to change a book?
+++ answers
1. Its Markdown source, not the generated HTML.
:::
```

Build from the directory that the source paths are relative to:

```sh
node /path/to/explainer/build.mjs walkthrough.md -o walkthrough.html
```

The builder bundles the sources, outline, checks, and prebuilt browser runtime.
Source files matching secret-looking names are rejected, but that is not a
substitute for reviewing the bundle.

## Open and sign in

Serve the output from a local static server or static host. The reader chooses a
model and signs in. Model requests go **from the reader's browser to the provider**,
not through an Explainer backend.

Browser CORS support limits which providers and sign-in methods work. The dialog
labels blocked methods. API keys for Anthropic, OpenAI, and OpenRouter, and Radius
and OpenRouter sign-in are documented by the project; provider behavior can change.

Conversation, progress, credentials, and the chosen model persist in browser
IndexedDB, scoped to the page's origin. Use a trusted origin and browser profile.
Only use one tab at a time. “Start over” clears the conversation; it is not a
promise to clear provider credentials.

## Rebuild the tutor runtime

You do not need to rebuild it to author a walkthrough. After changing
`walkthrough/src/`:

```sh
cd walkthrough
npm ci --ignore-scripts
npm run check
npm test
npm run build
```

Before sharing, open the page, sign in, answer a question, and inspect its figures.
The [durable walkthrough](https://github.com/rikurb8/explainer/blob/main/examples/durable/walkthrough.md)
is a complete example.
