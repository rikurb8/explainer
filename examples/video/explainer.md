---
title: From source to explanation
---

# A document people can follow

You have the source. Your reader needs the story.

:::flow animate | From evidence to a readable explanation.
row
box source "Source" "Code, docs, decisions" muted
box story "Story" "A concrete example" accent
box reader "Understanding" "What happens and why" blue
arrow source -> story
arrow story -> reader
:::

:::narration
You have a repository full of code and documentation. But handing someone a folder does not explain how the system works.

Explainer helps an author turn that source material into a readable story, with diagrams that show what happens and why.

The author can work directly in Markdown, or ask the coding agent to research the subject and write the explanation.
:::

# One repo, two reading experiences

:::flow animate | Choose the experience that fits the reader.
row
box markdown "Markdown" "The authored explanation" muted
box book "Book" "Read at your own pace" accent
box tutor "Walkthrough" "Ask, answer, explore" blue
arrow markdown -> book
arrow markdown -> tutor
:::

:::narration
The repository already builds two kinds of pages. A book gives readers a structured explanation they can read at their own pace.

A walkthrough adds an interactive tutor. It introduces concepts, asks questions, and uses bundled sources to help the reader explore.

Both start as Markdown. Their layouts and behavior differ, but they share the same tools for rendering explanations and diagrams.
:::

# Write the story, not the layout

```md
---
title: How our service works
---

# Following a request

Start with one concrete example.
```

:::narration
For a book, start with a title and chapter headings. Explain one concrete example before introducing the general rules.

The builder supplies the cover, contents, typography, and chapter numbering. You spend your time on the explanation, not page styling.
:::

# Draw the path that matters

:::sequence animate | A small request, shown in the order it happens.
actor reader "reader" blue
actor service "service" accent
actor storage "storage" muted
reader -> service: request a document
service -> storage: load the record
storage --> service: return the record
service --> reader: show the document
:::

:::narration
When order matters, write a sequence diagram. Here, the reader requests a document, and the service asks storage for the record.

Storage returns the record. Then the service sends the result to the reader. The diagram makes the boundaries and ordering visible.

Flow diagrams handle paths and structure. Notes explain caveats, while steppers let readers move through a longer process one stage at a time.
:::

# Build a shareable page

```sh
node build.mjs book.md -o index.html
```

A book becomes one HTML file.

:::narration
Run the build command with your Markdown file and an output path. The result is a single HTML page you can open or share.

Ordinary book content does not need a running application server. The builder includes the styling, and adds a runtime when interactive features need it.
:::

# Let the reader ask questions

:::flow animate | Walkthrough model requests go from the browser to the provider.
row
box sources "Bundled sources" "Selected documentation" muted
box browser "Browser tutor" "One concept at a time" accent
box model "Model provider" "Reader signs in" blue
arrow sources -> browser
arrow browser -> model "request"
arrow model -> browser "response"
:::

:::narration
For a walkthrough, choose the concepts and bundle the relevant sources. Those source files become part of the page you distribute.

The reader signs in to a supported model provider. The browser sends model requests directly to that provider, so walkthroughs are not offline experiences.

Review bundled files before publishing. The tutor needs useful evidence, but private repository material should not become public teaching material by accident.
:::

# Now add a narrated version

:::flow animate | This prototype adds a third output without replacing the existing builders.
row
box script "Storyboard" "Visuals and narration" muted
box speech "Local speech" "Audio for each beat" accent
box movie "Video" "Frames, voice, captions" blue
arrow script -> speech
arrow speech -> movie
:::

:::narration
This video demonstrates a third format. A short storyboard pairs each visual with narration written for listening, rather than reading a book aloud.

Local speech creates the voice. Chrome captures the scenes, and FFmpeg combines them with audio and captions into a shareable video.

The first version keeps things focused: clear explanations, familiar diagrams, and no avatar. The next improvement is more precise timing between the voice and visuals.
:::
