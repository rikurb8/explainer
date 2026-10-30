## Follow a render

Change a label, add a box, or try the stepper below. This is the same
Markdown renderer used by the book builder.

:::flow animate | From words to a page
row
box source "Markdown" "Your source" accent
box page "HTML" "One file" blue
arrow source -> page "build"
:::

:::steps | Try the controls
+++ Write
Keep the source in Markdown, next to its output.
+++ Build
Run `node build.mjs book.md -o index.html`.
+++ Share
Open the HTML file or put it on a static host.
:::

:::note | One source
This example is loaded from `examples/playground.md`, not copied into the docs.
:::
