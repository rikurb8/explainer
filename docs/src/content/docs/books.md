---
title: Books
description: Turn Markdown into a self-contained HTML explainer.
---
A book is Markdown plus front matter and optional directives. The builder adds a
cover, table of contents, chapter numbers, typography, and figure captions.

## Write a book

Save this as `book.md`:

```markdown
---
title: Following a request
cover: Request / Guide
subtitle: Trace one request from the browser to storage.
kicker: Engineering notes
colophon: Request Guide · first edition
---

# Before we begin {.preface}

A reader presses Save. Where does the request go?

# Follow the write {lede="One request, two owners."}

The browser sends the write to the server.

:::sequence animate | Saving a note
actor browser "Browser" blue
actor server "Server" accent
browser -> server: save note
server --> browser: saved
:::

# Reference {.appendix}

The server owns validation and persistence.
```

From the repository root:

```sh
node build.mjs book.md -o index.html
```

The default output, without `-o`, is the input path with `.html` replacing `.md`.
The output's parent directory must already exist.

## Add structure

Each top-level `#` heading starts a section. Ordinary chapters are numbered;
`{.preface}`, `{.epilogue}`, and `{.appendix}` select special sections.
Use `##` and `###` within chapters.

Directives include notes, review notes, statistics, figures, flow diagrams,
sequence diagrams, and step-by-step panels. Diagrams marked `animate` replay on
demand. The [playground](../playground/) lets you edit and run these content blocks.

## Use working examples

[template.md](https://github.com/rikurb8/explainer/blob/main/template.md)
is the syntax reference.
[The durable book](https://github.com/rikurb8/explainer/blob/main/examples/durable/book.md)
shows a complete explainer.

For an illustrated book and video made from shared SVGs:

```sh
cd examples/picture-book
node make.mjs
node ../../build.mjs book.md -o index.html
node check-panel.mjs
```

Edit `book.src.md`, `video.src.md`, and `figures/*.svg`, not the generated
`book.md` or `storyboard.md`. The picture book's panel simulates imaginary pages;
it is not an actual renderer or speech player.

## Limits

A self-contained file does not make arbitrary embedded content offline: explicitly
added external scripts or resources still need a connection. Raw HTML is trusted
author content, not sanitized user input.
