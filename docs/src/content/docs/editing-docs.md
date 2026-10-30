---
title: Editing these docs
description: Markdown authoring, live components, tests, and static builds.
---
This site uses Astro and Starlight. Most pages are plain Markdown; MDX is reserved
for pages that embed components. No server is needed for the built site.

## Start editing

From the repository root, with Node.js 22.23.4 or newer:

```sh
npm ci --ignore-scripts
npm --prefix docs ci --ignore-scripts
npm run docs:dev
```

Edit `docs/src/content/docs/*.md` or `*.mdx`. Astro refreshes the page as you save.
Page front matter needs a `title` and should include a `description`.
Navigation is explicit in `docs/astro.config.mjs`.

## Keep examples real

The playground imports `examples/playground.md` directly and uses the repository's
browser-safe renderer and book stylesheet. Edit that file to change the initial
example. The preview is deliberately a content-fragment renderer, not a second
implementation of book layout.

Interactive UI lives in `docs/src/components/`. Keep user-generated HTML inside
the sandboxed preview iframe, never in the parent documentation page.
Do not put API keys in MDX, browser bundles, or walkthrough source bundles.

## Test and build

```sh
npm run docs:test
npm run docs:build
npm --prefix docs run preview
```

The tests render the actual playground sample, validate error handling and sandbox
configuration, and check the book example and storyboard parser.
The production build checks page schemas, bundles assets, and generates search.
It writes static output to `docs/dist/`; preview it before deploying that directory.

For the existing video and loop logic:

```sh
node --test video.test.mjs rehearsal.test.mjs loop.test.mjs
```

These checks do not synthesize narration or call reviewer agents. Browser
interaction, provider authentication, audio quality, and a complete video render
still need separate validation.

## Publish deliberately

There is no deployment target configured. Deploy `docs/dist/` to your chosen
static host. If hosting below a path such as `/explainer/`, configure Astro's
`base` and test links and assets there before publishing.
