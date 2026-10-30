import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { previewDocument } from "../src/lib/preview.mjs";
import { build } from "../../build.mjs";
import { parseVideo } from "../../video.mjs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("the actual playground sample renders diagrams and interactive steps", () => {
  const html = previewDocument(read("../../examples/playground.md"), read("../../book.css"));
  assert.match(html, /<svg/);
  assert.match(html, /class="steps"/);
  assert.match(html, /Replay/);
  assert.match(html, /IntersectionObserver/);
  assert.match(html, /Content-Security-Policy/);
  assert.match(html, /default-src 'none'/);
  assert.match(html, /form-action 'none'/);
});

test("invalid directives fail before replacing a valid preview", () => {
  assert.throws(() => previewDocument(":::flow\nbox a", ""), /not closed/);
  assert.throws(() => previewDocument(":::unknown\ntext\n:::", ""), /unknown directive/);
});

test("preview HTML stays in an iframe without parent-origin privileges", () => {
  const component = read("../src/components/Playground.astro");
  assert.match(component, /sandbox="allow-scripts"/);
  assert.doesNotMatch(component, /allow-same-origin|set:html|innerHTML/);
  assert.match(component, /preview.srcdoc = html/);
  assert.match(component, /error.textContent/);
});

test("existing guide examples remain buildable", () => {
  assert.match(build(read("../../examples/durable/book.md")), /<!doctype html>/);
  assert.ok(parseVideo(read("../../examples/video/fireship.md")).scenes.length > 0);
});

test("the book and storyboard snippets in the docs use the real parsers", () => {
  const book = read("../src/content/docs/books.md").match(/```markdown\n([\s\S]*?)\n```/)[1];
  assert.match(build(book), /Saving a note/);
  const video = read("../src/content/docs/videos.md").match(/```markdown\n([\s\S]*?)\n```/)[1];
  assert.equal(parseVideo(video).scenes.length, 2);
});
