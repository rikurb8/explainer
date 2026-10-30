---
title: Get started
description: Install Explainer and build your first HTML book.
---
Explainer is a pi skill and a set of Node.js command-line tools. You can use the
builders without asking an agent to write the source.

## Install the skill

```sh
git clone https://github.com/rikurb8/explainer ~/.pi/agent/skills/explainer
cd ~/.pi/agent/skills/explainer
npm install --ignore-scripts
```

pi discovers the skill in that directory. Ask for an explainer, walkthrough, or
video storyboard. The agent authoring instructions live in
[SKILL.md](https://github.com/rikurb8/explainer/blob/main/SKILL.md).

## Build an existing book

From the repository root:

```sh
node build.mjs examples/durable/book.md -o /tmp/explainer-book.html
```

Open `/tmp/explainer-book.html` in your browser. The output includes its styles,
diagrams, and any required animation runtime in one file.

Use the [live editor](../playground/) to try Markdown and directives without
installing anything. Follow [Books](../books/) to create a full document.

## Choose an output

| Output | Needed to build | Needed to use |
| --- | --- | --- |
| Book | Node.js and root npm dependencies | A browser |
| Walkthrough | Same; bundled sources and committed tutor runtime | A static server, browser, and supported model credentials |
| Video | Node.js, Chrome, ffmpeg, ffprobe; curl for Mistral speech | Any MP4 player |
| Review loop | Video tools, pi with model access, and transcription support | Browser to read the report |

The docs site is a separate Astro app. It needs Node.js **22.23.4 or newer**;
install its dependencies only if you want to edit or build the docs.

## Run the documentation locally

```sh
npm --prefix docs ci --ignore-scripts
npm run docs:dev
```

Open the URL printed by Astro. Editing files in `docs/src/content/docs/` refreshes
the page. See [Editing these docs](../editing-docs/) for build and test commands.

:::caution[Trust the source]
Books and video storyboards can contain raw HTML and scripts. Only build trusted
source. Walkthrough bundles and video archives can contain private material;
review them before sharing.
:::
