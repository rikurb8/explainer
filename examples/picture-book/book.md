---
title: The Elves and the Markdown Maker
cover: The Elves / and the / Markdown Maker
kicker: A picture book · for readers of any age · 2026-10-30
subtitle: Mara writes the words. Something else does the making.
note: |
  Every picture in this book is drawn from shapes in `figures/`, one plain SVG per page, and the machine on page
  five really works. It is an example for the explainer skill in this repository: `node build.mjs book.md`.
  The story is a retelling of "The Elves and the Shoemaker"; the software is not folklore.
colophon: The Elves and the Markdown Maker · first edition · 2026-10-30 · an example for the explainer skill
---

# For the grown-up reading this aloud {.preface}

This is a picture book about a tool that turns words into a book and into a film of someone reading it. Read one
spread a night. The picture does most of the work, so let the child find things in it before you turn the page.

There is a machine on page five with dials on the front. It works. Let the child turn them and press Run.

Nothing in this book is magic, which is the point of it. A helper can only make what someone wrote down, and the
order of the work never changes. A grown-up who has ever stayed up doing something a machine could have done will
recognise the feeling.

This book was made the same way it describes. Appendix A shows the two files it came from.

# The Bench at Night {lede="Mara writes all day. The making happens at night."}

Mara writes small things.

A gate. A lamp. A bird that sits on the gate and will not move for anything.

She writes them in a markdown file, which is a page of plain words with a `#` at the start of a title. Then she puts
another page on top, and another, until the bench is a small hill of paper.

The writing is the part she knows. The making is the part that takes all night: a cover, a contents, eleven pages with
a picture on each, a voice to read them aloud, and one long reel to hold the voice and the pictures together.

She never finishes before morning. So she stops writing, and she leaves a note.

:::figure wide | Mara at the bench. The hill of pages is the whole book, before anyone has made it.
<svg viewBox="0 0 1000 420" width="1000" height="420" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="ch01-title">
<title id="ch01-title">Mara sits alone at her bench at night, a stack of pages beside her.</title>
<rect width="1000" height="420" fill="#fbf8f2"/>
<rect x="700" y="34" width="230" height="180" rx="6" fill="#2e6a8a"/>
<circle cx="800" cy="92" r="20" fill="#f4eee2"/>
<circle cx="866" cy="128" r="3" fill="#f4eee2" opacity=".65"/>
<circle cx="756" cy="152" r="2.5" fill="#f4eee2" opacity=".45"/>
<rect x="700" y="34" width="230" height="180" rx="6" fill="none" stroke="#2a2723" stroke-width="4"/>
<line x1="815" y1="34" x2="815" y2="214" stroke="#2a2723" stroke-width="3"/>
<ellipse cx="120" cy="250" rx="180" ry="130" fill="#b4472f" opacity=".06"/>
<line x1="120" y1="24" x2="120" y2="120" stroke="#2a2723" stroke-width="3"/>
<path d="M78 120h84l-16 36H94z" fill="#b4472f"/>
<rect x="40" y="300" width="920" height="12" rx="3" fill="#2a2723"/>
<rect x="96" y="312" width="14" height="80" fill="#2a2723" opacity=".5"/>
<rect x="880" y="312" width="14" height="80" fill="#2a2723" opacity=".5"/>
<circle cx="300" cy="196" r="32" fill="#e0bd97"/>
<circle cx="300" cy="160" r="13" fill="#2a2723"/>
<path d="M258 300v-42a42 42 0 0 1 84 0v42z" fill="#2e6a8a"/>
<path d="M266 258l94 14" stroke="#2a2723" stroke-width="10" stroke-linecap="round" opacity=".8"/>
<g fill="#f4eee2" stroke="#d9d0be" stroke-width="2">
<rect x="600" y="286" width="240" height="14" rx="2"/>
<rect x="608" y="272" width="240" height="14" rx="2"/>
<rect x="598" y="258" width="240" height="14" rx="2"/>
<rect x="610" y="244" width="240" height="14" rx="2"/>
</g>
<rect x="600" y="198" width="240" height="46" rx="3" fill="#fbf8f2" stroke="#c2b18c" stroke-width="3"/>
<text x="616" y="220" font-family="'Avenir Next',Helvetica,sans-serif" font-size="15" fill="#2a2723"># the book of small things</text>
<text x="616" y="236" font-family="'SF Mono',Menlo,monospace" font-size="12" fill="#a89c85"># a page, a page, a page</text>
</svg>
:::

# The Note on the Bench {lede="The first thing a helper reads is never the words."}

The note sits on top of the pile. It is small, and it is the first thing anyone reads.

*The Book of Small Things. Cover: a bird, a gate, a lamp. For Ada, who is five.*

That is all of it. A name, a picture, and who it is for.

Mara does not write the note for herself. She knows what she meant. She writes it for whoever comes at night, because
no one can make a book out of a pile, not even a helper. A helper can only make what someone wrote down.

:::figure wide | The note on the pile: a title, the cover, and who the book is for.
<svg viewBox="0 0 1000 420" width="1000" height="420" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="ch02-title">
<title id="ch02-title">A card on top of the stack, in Mara's handwriting: a title, a cover, and who it is for.</title>
<rect width="1000" height="420" fill="#fbf8f2"/>
<rect x="0" y="330" width="1000" height="90" fill="#f4eee2"/>
<line x1="0" y1="330" x2="1000" y2="330" stroke="#2a2723" stroke-width="4"/>
<g fill="#f4eee2" stroke="#d9d0be" stroke-width="2">
<rect x="176" y="304" width="480" height="22" rx="2"/>
<rect x="188" y="282" width="480" height="22" rx="2"/>
</g>
<rect x="176" y="124" width="480" height="158" rx="5" fill="#fbf8f2" stroke="#2a2723" stroke-width="4"/>
<rect x="176" y="124" width="480" height="28" rx="5" fill="#f4eee2"/>
<line x1="176" y1="152" x2="656" y2="152" stroke="#2a2723" stroke-width="3"/>
<text x="198" y="144" font-family="'Avenir Next',Helvetica,sans-serif" font-size="12" letter-spacing=".17em" fill="#7b7468">FOR WHOEVER COMES AT NIGHT</text>
<text x="200" y="200" font-family="'Iowan Old Style',Palatino,Georgia,serif" font-size="31" fill="#2a2723">The Book of Small Things</text>
<text x="200" y="234" font-family="'Iowan Old Style',Palatino,Georgia,serif" font-size="19" fill="#5a544a">cover: a bird, a gate, a lamp</text>
<text x="200" y="262" font-family="'Iowan Old Style',Palatino,Georgia,serif" font-size="19" fill="#5a544a">for Ada, who is five</text>
<rect x="742" y="150" width="74" height="88" rx="7" fill="#2e6a8a"/>
<path d="M742 174h74" stroke="#fbf8f2" stroke-width="7"/>
<path d="M816 238c18 0 28-9 28-24s-10-24-28-24" stroke="#2a2723" stroke-width="5" fill="none"/>
<path d="M470 302l150-12" stroke="#2a2723" stroke-width="6" stroke-linecap="round"/>
<path d="M620 290l6 12" stroke="#2a2723" stroke-width="6" stroke-linecap="round"/>
<path d="M466 306l6-10 4 12z" fill="#2a2723"/>
</svg>
:::

# Something Comes Up the Leg {lede="Two small ones, and a lantern."}

At midnight the bench leg gets visitors.

Tick comes first, blue and quick, with the lantern held high. Tock follows, smaller and slower, carrying nothing at
all.

They climb onto the bench and they read the note. They read it before they touch a single page, every night, in the
same order.

Tick, to Tock: "A bird. A gate. A lamp."

Tock, to Tick: "For Ada, who is five."

Then they begin.

:::figure wide | Tick and Tock arrive. The first thing they do is read, not write.
<svg viewBox="0 0 1000 420" width="1000" height="420" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="ch03-title">
<title id="ch03-title">Two small helpers climb the bench leg by lantern light, one blue and one sand.</title>
<rect width="1000" height="420" fill="#fbf8f2"/>
<rect x="0" y="0" width="1000" height="56" fill="#2a2723" opacity=".1"/>
<rect x="0" y="56" width="1000" height="8" fill="#2a2723" opacity=".55"/>
<rect x="0" y="332" width="1000" height="88" fill="#f4eee2"/>
<line x1="0" y1="332" x2="1000" y2="332" stroke="#2a2723" stroke-width="4"/>
<rect x="120" y="64" width="86" height="268" fill="#c2b18c"/>
<line x1="163" y1="64" x2="163" y2="332" stroke="#a89c85" stroke-width="3"/>
<ellipse cx="250" cy="300" rx="130" ry="46" fill="#2a2723" opacity=".06"/>
<ellipse cx="690" cy="300" rx="150" ry="50" fill="#2a2723" opacity=".06"/>
<ellipse cx="470" cy="286" rx="120" ry="90" fill="#e0bd97" opacity=".3"/>
<g>
<path d="M420 332c0-24 17-40 38-40s38 16 38 40z" fill="#2e6a8a"/>
<circle cx="458" cy="266" r="23" fill="#e0bd97"/>
<path d="M435 258l23-32 23 32z" fill="#2e6a8a"/>
<circle cx="451" cy="268" r="3" fill="#2a2723"/>
<circle cx="466" cy="268" r="3" fill="#2a2723"/>
<path d="M452 277c4 3 8 3 12 0" stroke="#2a2723" stroke-width="2.5" fill="none" stroke-linecap="round"/>
<path d="M496 306c15-5 25-17 29-34" stroke="#2e6a8a" stroke-width="8" fill="none" stroke-linecap="round"/>
</g>
<ellipse cx="562" cy="300" rx="92" ry="72" fill="#f0d9a8" opacity=".3"/>
<g transform="translate(562 262)">
<path d="M0-46v-12" stroke="#2a2723" stroke-width="4" stroke-linecap="round"/>
<path d="M-16-46h32l-5 8h-22z" fill="#2a2723"/>
<rect x="-24" y="-38" width="48" height="62" rx="8" fill="#b4472f"/>
<rect x="-15" y="-29" width="30" height="44" rx="4" fill="#f0d9a8"/>
<path d="M-24-6h48" stroke="#2a2723" stroke-width="3"/>
<path d="M-30 24h60" stroke="#2a2723" stroke-width="5" stroke-linecap="round"/>
<path d="M-12 24l4-14h16l4 14z" fill="#2a2723"/>
</g>
<g>
<path d="M648 342c0-21 15-36 33-36s33 15 33 36z" fill="#c2b18c"/>
<circle cx="681" cy="286" r="19" fill="#e0bd97"/>
<path d="M662 279l19-28 19 28z" fill="#b4472f"/>
<circle cx="674" cy="288" r="2.6" fill="#2a2723"/>
<circle cx="688" cy="288" r="2.6" fill="#2a2723"/>
<path d="M675 296c3 3 7 3 10 0" stroke="#2a2723" stroke-width="2.5" fill="none" stroke-linecap="round"/>
</g>
<g fill="#7b7468" opacity=".35">
<ellipse cx="290" cy="352" rx="6" ry="3"/><ellipse cx="330" cy="366" rx="6" ry="3"/><ellipse cx="372" cy="348" rx="6" ry="3"/>
</g>
</svg>
:::

# What They Make by Morning {lede="One pile of pages. Two things to hold."}

By morning there are two things on the bench.

The first is a book. A cover, a contents, eleven chapters numbered in a straight line, a picture beside the words on
every page, and type set small enough to hold and large enough to read in bed.

The second is a reel. The same eleven pages, held on a screen one at a time, while a voice reads them out loud and
leaves a small silence at the end of each one.

One pile of pages. Two things to hold.

Neither one arrives in a single flash. Each is a row of small steps, done in order, all night long.

:::figure wide | The same words, made twice: a book you can read, and a reel that says it out loud.
<svg viewBox="0 0 1000 420" width="1000" height="420" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="ch04-title">
<title id="ch04-title">One pile of pages becomes two things: a book you can read, and a reel that speaks.</title>
<rect width="1000" height="420" fill="#fbf8f2"/>
<g fill="#f4eee2" stroke="#d9d0be" stroke-width="2">
<rect x="60" y="196" width="150" height="16" rx="2"/>
<rect x="68" y="176" width="150" height="16" rx="2"/>
<rect x="58" y="156" width="150" height="16" rx="2"/>
</g>
<rect x="58" y="96" width="150" height="56" rx="3" fill="#fbf8f2" stroke="#c2b18c" stroke-width="3"/>
<text x="72" y="120" font-family="'SF Mono',Menlo,monospace" font-size="12" fill="#2a2723"># small things</text>
<text x="72" y="138" font-family="'SF Mono',Menlo,monospace" font-size="12" fill="#a89c85"># a gate, a lamp</text>
<text x="60" y="272" font-family="'Avenir Next',Helvetica,sans-serif" font-size="14" letter-spacing=".14em" fill="#7b7468">MARKDOWN</text>
<g stroke="#b4472f" stroke-width="3" fill="none" stroke-linecap="round">
<path d="M262 200h96"/>
<path d="M350 190l12 10-12 10"/>
</g>
<g stroke="#2e6a8a" stroke-width="3" fill="none" stroke-linecap="round">
<path d="M262 240h96"/>
<path d="M350 230l12 10-12 10"/>
</g>
<g>
<path d="M420 168h250v124H420z" fill="#fbf8f2" stroke="#2a2723" stroke-width="3"/>
<path d="M545 168v124" stroke="#e3dbcc" stroke-width="2"/>
<path d="M444 200h76" stroke="#e3dbcc" stroke-width="3"/>
<path d="M444 220h76" stroke="#e3dbcc" stroke-width="3"/>
<path d="M444 240h58" stroke="#e3dbcc" stroke-width="3"/>
<circle cx="606" cy="212" r="18" fill="#b4472f"/>
<path d="M600 204l14 8-14 8z" fill="#fbf8f2"/>
<path d="M578 258h70" stroke="#e3dbcc" stroke-width="3"/>
<path d="M420 168l-14-16h278l-14 16" fill="#f4eee2" stroke="#2a2723" stroke-width="3" stroke-linejoin="round"/>
<text x="420" y="322" font-family="'Avenir Next',Helvetica,sans-serif" font-size="15" letter-spacing=".04em" fill="#7b7468">a book you can read</text>
</g>
<g>
<rect x="716" y="150" width="220" height="150" rx="10" fill="#2e6a8a"/>
<g fill="#fbf8f2">
<rect x="736" y="166" width="14" height="10" rx="2"/><rect x="736" y="190" width="14" height="10" rx="2"/>
<rect x="736" y="214" width="14" height="10" rx="2"/><rect x="736" y="238" width="14" height="10" rx="2"/>
<rect x="736" y="262" width="14" height="10" rx="2"/><rect x="902" y="166" width="14" height="10" rx="2"/>
<rect x="902" y="190" width="14" height="10" rx="2"/><rect x="902" y="214" width="14" height="10" rx="2"/>
<rect x="902" y="238" width="14" height="10" rx="2"/><rect x="902" y="262" width="14" height="10" rx="2"/>
</g>
<circle cx="826" cy="225" r="38" fill="#fbf8f2"/>
<path d="M816 208l26 17-26 17z" fill="#2e6a8a"/>
<text x="716" y="322" font-family="'Avenir Next',Helvetica,sans-serif" font-size="15" letter-spacing=".04em" fill="#7b7468">a reel that says it out loud</text>
</g>
</svg>
:::

# Three Dials {lede="The whole machine, on the front."}

The machine has three dials.

The first says how many pages. The second says how fast the voice reads. The third says whose voice it is.

That is everything there is to set. There is no fourth dial, and nothing hidden behind the machine.

Turn them. Nothing breaks, and nothing is spent. A run that comes out wrong is only a run you can do again.

This panel is a simulation, not a renderer. Its time is an estimate for imaginary pages of 35 words each, not the
length of this book’s narrated reel; the voice selector changes the description, not any audio.

:::figure wide | The machine, front on. Pages, pace, voice, and a slot for the work to come out of.
<svg viewBox="0 0 1000 420" width="1000" height="420" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="ch05-title">
<title id="ch05-title">The little machine has three dials: pages, pace and voice.</title>
<rect width="1000" height="420" fill="#fbf8f2"/>
<ellipse cx="500" cy="200" rx="380" ry="190" fill="#b4472f" opacity=".05"/>
<path d="M500 34v20" stroke="#2a2723" stroke-width="4" stroke-linecap="round"/>
<circle cx="500" cy="26" r="11" fill="#b4472f"/>
<rect x="170" y="56" width="660" height="272" rx="16" fill="#f4eee2" stroke="#2a2723" stroke-width="4"/>
<rect x="206" y="328" width="26" height="26" rx="4" fill="#2a2723" opacity=".6"/>
<rect x="768" y="328" width="26" height="26" rx="4" fill="#2a2723" opacity=".6"/>
<g stroke="#2a2723" stroke-width="3" fill="#fbf8f2">
<circle cx="300" cy="152" r="46"/><circle cx="500" cy="152" r="46"/><circle cx="700" cy="152" r="46"/>
</g>
<g stroke="#c2b18c" stroke-width="3" stroke-linecap="round">
<path d="M300 110v8"/><path d="M300 186v8"/><path d="M258 152h8"/><path d="M334 152h8"/>
<path d="M500 110v8"/><path d="M500 186v8"/><path d="M458 152h8"/><path d="M534 152h8"/>
<path d="M700 110v8"/><path d="M700 186v8"/><path d="M658 152h8"/><path d="M734 152h8"/>
</g>
<g stroke="#b4472f" stroke-width="5" stroke-linecap="round">
<path d="M300 152l16-24"/>
<path d="M500 152l-6-30"/>
<path d="M700 152l26-12"/>
</g>
<g font-family="'Avenir Next',Helvetica,sans-serif" font-size="15" letter-spacing=".18em" fill="#7b7468" text-anchor="middle">
<text x="300" y="214">PAGES</text><text x="500" y="214">PACE</text><text x="700" y="214">VOICE</text>
</g>
<rect x="330" y="242" width="340" height="58" rx="8" fill="#2a2723"/>
<rect x="348" y="252" width="304" height="38" rx="3" fill="#fbf8f2"/>
<g stroke="#d9d0be" stroke-width="3" stroke-linecap="round">
<path d="M366 266h130"/><path d="M366 278h96"/>
</g>
<circle cx="620" cy="271" r="9" fill="#b4472f"/>
</svg>
:::

:::raw
<div class="pd">
  <div class="pd-top"><b>the little machine</b><span>turn the dials, then press run</span></div>
  <div class="pd-body">
    <label class="pd-f" for="pd-pages"><span>pages</span><input id="pd-pages" type="range" min="4" max="16" step="1" value="11"><output id="pd-pages-out">11</output></label>
    <label class="pd-f" for="pd-pace"><span>pace</span><input id="pd-pace" type="range" min="0.3" max="2" step="0.1" value="1"><output id="pd-pace-out">1.0x</output></label>
    <label class="pd-f" for="pd-voice"><span>voice</span><select id="pd-voice"><option>Samantha</option><option>Karen</option><option>Moira</option></select></label>
    <label class="pd-f" for="pd-make"><span>make</span><select id="pd-make"><option>a book and a reel</option><option>the book</option><option>the reel</option></select></label>
  </div>
  <div class="pd-foot">
    <button id="pd-run" type="button">Run</button>
    <ol class="pd-stages" id="pd-stages"><li>the note</li><li>the words</li><li>the voice</li><li>the frames</li><li>one stitch</li></ol>
  </div>
  <p class="pd-say" id="pd-say" aria-live="polite"></p>
</div>
<style>
.pd{border:1px solid var(--rule);background:var(--soft);border-radius:8px;padding:20px 22px 18px;margin:2rem 0 2.4rem}
.pd-top{display:flex;justify-content:space-between;align-items:baseline;gap:1rem;font:600 .7rem/1 'Avenir Next',sans-serif;letter-spacing:.2em;text-transform:uppercase;color:var(--muted);margin-bottom:18px}
.pd-top b{color:var(--accent);font-weight:600}
.pd-body{display:grid;grid-template-columns:1fr 1fr;gap:14px 30px}
.pd-f{display:grid;grid-template-columns:3.4rem 1fr auto;align-items:center;gap:12px}
.pd-f>span{font:600 .66rem/1 'Avenir Next',sans-serif;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
.pd input[type=range]{-webkit-appearance:none;appearance:none;width:100%;height:4px;border-radius:2px;background:var(--rule);margin:0}
.pd input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;background:var(--accent);border:2px solid var(--paper);cursor:pointer}
.pd input[type=range]::-moz-range-thumb{width:14px;height:14px;border-radius:50%;background:var(--accent);border:2px solid var(--paper);cursor:pointer}
.pd select{font:.78rem 'Avenir Next',sans-serif;padding:4px 6px;border:1px solid var(--rule);background:var(--paper);color:var(--ink);border-radius:3px}
.pd output{font:.72rem 'SF Mono',Menlo,monospace;color:var(--ink);min-width:3.4em;text-align:right}
.pd-foot{display:flex;align-items:center;gap:16px;margin-top:20px;flex-wrap:wrap}
#pd-run{font:600 .72rem/1 'Avenir Next',sans-serif;letter-spacing:.18em;text-transform:uppercase;padding:12px 26px;border:0;border-radius:4px;background:var(--accent);color:var(--paper);cursor:pointer}
#pd-run:hover{background:#9d3a25}
#pd-run:disabled{opacity:.45;cursor:default}
.pd-stages{display:flex;gap:8px;list-style:none;margin:0;padding:0;flex-wrap:wrap}
.pd-stages li{font:.64rem/1 'Avenir Next',sans-serif;letter-spacing:.1em;text-transform:uppercase;color:#b8af9f;border:1px solid var(--rule);border-radius:3px;padding:6px 8px;background:var(--paper);transition:color .2s,border-color .2s}
.pd-stages li.on{color:var(--accent);border-color:var(--accent);background:#fdf3f0}
.pd-say{font:.82rem/1.55 'Avenir Next',sans-serif;color:#5a544a;margin:16px 0 0;padding-top:14px;border-top:1px dotted var(--rule)}
@media(max-width:760px){.pd-body{grid-template-columns:1fr}}
@media(prefers-reduced-motion:reduce){.pd-stages li{transition:none}}
</style>
<script>
// Model imaginary 35-word pages, not the actual storyboard or a speech provider.
function plan(pages, pace) {
  var wordsPerPage = 35, wordsPerMinute = 150, breathAtEnd = 1.5;
  return Math.round(pages * (wordsPerPage / (wordsPerMinute / 60) / pace + breathAtEnd));
}
function clockOf(seconds) {
  var minutes = Math.floor(seconds / 60), rest = seconds % 60;
  return minutes + " min " + (rest < 10 ? "0" : "") + rest + " s";
}
var NUMBER = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
  "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen"];

if (typeof document !== "undefined") {
  var el = function (id) { return document.getElementById(id); };
  var say = el("pd-say"), button = el("pd-run"), stages = el("pd-stages").children;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var speaking = false;

  function settings() {
    return { pages: Number(el("pd-pages").value), pace: Number(el("pd-pace").value),
      voice: el("pd-voice").value, make: el("pd-make").value };
  }
  function describe() {
    var s = settings(), words = NUMBER[s.pages] + " pages";
    var made = s.make === "the book" ? "one book" : s.make === "the reel" ? "one reel" : "one book and one reel";
    var time = s.make === "the book" ? "" : ", about " + clockOf(plan(s.pages, s.pace)) + ", read by " + s.voice;
    return "In the morning: " + made + ". " + words.charAt(0).toUpperCase() + words.slice(1) + time + ".";
  }
  function clearStages() { for (var i = 0; i < stages.length; i++) stages[i].className = ""; }
  // A book stops after the words; a reel goes all the way to the stitch.
  function settle() {
    var keep = settings().make === "the book" ? 2 : stages.length;
    for (var i = 0; i < stages.length; i++) stages[i].className = i < keep ? "on" : "";
  }

  function send(text, busy) {
    say.textContent = text;
    button.disabled = busy;
  }
  function run() {
    if (speaking) return;
    speaking = true;
    clearStages();
    if (reduced) { settle(); send(describe(), false); speaking = false; return; }
    send("The helpers read the note.", true);
    var step = 0;
    var tick = setInterval(function () {
      if (step < stages.length) {
        stages[step].className = "on";
        say.textContent = ["The helpers read the note.", "The words are cut into " + NUMBER[settings().pages] + " pages.",
          "The voice reads each page, one at a time.", "Every page is held still and caught as a frame.",
          "One long stitch, and the reel is whole."][step];
        step++;
        return;
      }
      clearInterval(tick);
      settle();
      send(describe(), false);
      speaking = false;
    }, 620);
  }

  el("pd-pages").addEventListener("input", function () {
    el("pd-pages-out").textContent = this.value;
    send(describe(), false);
  });
  el("pd-pace").addEventListener("input", function () {
    el("pd-pace-out").textContent = Number(this.value).toFixed(1) + "x";
    send(describe(), false);
  });
  el("pd-voice").addEventListener("change", function () { send(describe(), false); });
  el("pd-make").addEventListener("change", function () { send(describe(), false); });
  button.addEventListener("click", run);
  send(describe(), false);
}
</script>
:::

When the helpers are done, the dials were only ever a way of saying what to make. The looking at the result is still
yours.

# Too Fast {lede="Tock turns one dial a little too far."}

One night Tock turned the pace dial too far.

1.9x. The voice ran the words together like a river after rain. The pages flew past, a gate, a bird, a lamp, gone,
gone, gone, and the silence at the end of each page was gone with them.

Ada watched, and laughed, and then stopped laughing, because she could not follow it. A picture you cannot reach is
not a picture.

Tick put the dial back.

:::figure wide | 1.9x. The pages arrive faster than anyone can look at them.
<svg viewBox="0 0 1000 420" width="1000" height="420" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="ch06-title">
<title id="ch06-title">Turned too far: the pages fly past in a blur and nobody can follow them.</title>
<rect width="1000" height="420" fill="#fbf8f2"/>
<g stroke="#b4472f" stroke-width="3" fill="none" stroke-linecap="round" opacity=".5">
<path d="M30 150c40-30 90-30 140 0"/><path d="M20 200c50-34 110-34 160 0"/><path d="M40 250c40-26 80-26 120 0"/>
</g>
<g stroke="#b4472f" stroke-width="3" fill="none" stroke-linecap="round" opacity=".28">
<path d="M800 120c40 26 80 26 120 0"/><path d="M770 172c50 34 110 34 160 0"/><path d="M820 224c30 22 60 22 90 0"/>
</g>
<g fill="#f4eee2" stroke="#d9d0be" stroke-width="3">
<rect x="150" y="150" width="132" height="180" rx="4" transform="rotate(-15 216 240)" opacity=".22"/>
<rect x="252" y="136" width="132" height="180" rx="4" transform="rotate(-7 318 226)" opacity=".45"/>
<rect x="352" y="122" width="132" height="180" rx="4" transform="rotate(-1 418 212)" opacity=".7"/>
</g>
<g fill="#fbf8f2" stroke="#2a2723" stroke-width="4">
<rect x="452" y="112" width="140" height="190" rx="4" transform="rotate(7 522 207)"/>
</g>
<g stroke="#d9d0be" stroke-width="4" stroke-linecap="round" transform="rotate(7 522 207)">
<path d="M474 146h96"/><path d="M474 172h96"/><path d="M474 198h72"/><path d="M474 224h86"/>
</g>
<g>
<path d="M600 330c0-22 16-38 36-38s36 16 36 38z" fill="#2e6a8a"/>
<circle cx="636" cy="266" r="21" fill="#e0bd97"/>
<path d="M615 258l21-30 21 30z" fill="#2e6a8a"/>
<circle cx="629" cy="268" r="3" fill="#2a2723"/>
<circle cx="643" cy="268" r="3" fill="#2a2723"/>
<path d="M628 279c5 5 11 5 16 0" stroke="#2a2723" stroke-width="2.6" fill="none" stroke-linecap="round"/>
</g>
<g transform="translate(824 268)">
<path d="M-76 0A76 76 0 0 1 76 0" fill="none" stroke="#e3dbcc" stroke-width="12" stroke-linecap="round"/>
<path d="M-76 0A76 76 0 0 1 58 -49" fill="none" stroke="#b4472f" stroke-width="12" stroke-linecap="round"/>
<path d="M0 0L58 -49" stroke="#2a2723" stroke-width="5" stroke-linecap="round"/>
<circle cx="0" cy="0" r="7" fill="#2a2723"/>
<circle cx="-76" cy="0" r="5" fill="#2a2723"/>
<circle cx="76" cy="0" r="5" fill="#2a2723"/>
<text x="0" y="42" font-family="'Avenir Next',Helvetica,sans-serif" font-size="24" font-weight="600" fill="#b4472f" text-anchor="middle">1.9x</text>
</g>
</svg>
:::

# Too Slow {lede="Tock learns that the other way is a direction too."}

The next night Tock was careful, and turned the same dial the other way.

0.3x. One page stayed on the screen so long that a spider built a web across the corner of it. The plant in the pot
grew a leaf. Ada went to bed, came back after breakfast, and the same page was still there, halfway through being
read.

Tock is patient. Tock is the most patient thing on the bench. Even Tock began to tap his foot.

:::figure wide | 0.3x. Held so long that the room has time to grow a web.
<svg viewBox="0 0 1000 420" width="1000" height="420" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="ch07-title">
<title id="ch07-title">Turned too far the other way: one page stays so long that a spider builds a web across it.</title>
<rect width="1000" height="420" fill="#fbf8f2"/>
<rect x="352" y="48" width="290" height="292" rx="4" fill="#f4eee2" stroke="#c2b18c" stroke-width="3"/>
<g stroke="#d9d0be" stroke-width="5" stroke-linecap="round">
<path d="M384 130h170"/><path d="M384 158h170"/><path d="M384 186h124"/>
</g>
<ellipse cx="606" cy="150" rx="16" ry="16" fill="#e0d8c6"/>
<g stroke="#8d8576" stroke-width="1.5" fill="none">
<path d="M352 48l84 4M352 48l78 26M352 48l64 46M352 48l44 60M352 48l18 68"/>
<path d="M394 50c26 16 48 42 56 66M382 66c24 16 40 38 46 58M370 84c20 14 32 32 36 48M360 100c16 10 24 24 28 36"/>
</g>
<circle cx="404" cy="104" r="7" fill="#7b7468"/>
<g transform="translate(812 176)">
<circle cx="0" cy="0" r="66" fill="#f4eee2" stroke="#2a2723" stroke-width="4"/>
<g stroke="#2a2723" stroke-width="3.5" stroke-linecap="round">
<path d="M0-54v9"/><path d="M0 54v-9"/><path d="M-54 0h9"/><path d="M54 0h-9"/>
</g>
<path d="M0 0v-38" stroke="#2a2723" stroke-width="4" stroke-linecap="round"/>
<path d="M0 0l-20 22" stroke="#b4472f" stroke-width="4" stroke-linecap="round"/>
<text x="0" y="42" font-family="'Avenir Next',Helvetica,sans-serif" font-size="19" font-weight="600" fill="#b4472f" text-anchor="middle">0.3x</text>
</g>
<g transform="translate(180 340)">
<path d="M-26 0h52l-6-42h-40z" fill="#b4472f" opacity=".85"/>
<path d="M0-42c-16-24 0-46 0-46s16 22 0 46" fill="#2e6a8a" opacity=".65"/>
<path d="M0-88c-12-18 0-34 0-34s12 16 0 34" fill="#2e6a8a" opacity=".4"/>
<path d="M0-122c-8-12 0-22 0-22s8 10 0 22" fill="#2e6a8a" opacity=".25"/>
</g>
<g fill="#c2b18c" opacity=".45">
<circle cx="686" cy="86" r="2.5"/><circle cx="736" cy="312" r="2"/><circle cx="300" cy="120" r="2"/>
</g>
</svg>
:::

# Just Right {lede="The one setting the whole book is about."}

1.0x. The voice reads at the speed of a person reading to a child, and then it stops for one beat at the end of the
page.

That beat is the whole thing. It is the space where a child looks at the picture. It is where a page is allowed to
land.

The reel then takes as long as it takes. Nobody counts the minutes after the first two nights.

:::figure wide | 1.0x, with the beat at the end. Somebody is listening, and the page waits for her.
<svg viewBox="0 0 1000 420" width="1000" height="420" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="ch08-title">
<title id="ch08-title">Turned just right: a child on a cushion follows one page, and a dog sleeps beside her.</title>
<rect width="1000" height="420" fill="#fbf8f2"/>
<ellipse cx="600" cy="230" rx="330" ry="200" fill="#e0bd97" opacity=".18"/>
<rect x="470" y="44" width="340" height="308" rx="6" fill="#f4eee2" stroke="#c2b18c" stroke-width="3"/>
<g stroke="#cdc4b0" stroke-width="5" stroke-linecap="round">
<path d="M508 106h230"/><path d="M508 138h230"/><path d="M508 170h150"/>
</g>
<rect x="508" y="206" width="240" height="108" rx="3" fill="#fbf8f2" stroke="#d9d0be" stroke-width="2"/>
<path d="M516 306l52-56 34 34 26-22 42 44" fill="none" stroke="#2e6a8a" stroke-width="3" stroke-linejoin="round"/>
<circle cx="704" cy="234" r="13" fill="#b4472f"/>
<path d="M470 352h340" stroke="#2a2723" stroke-width="3" opacity=".18"/>
<ellipse cx="266" cy="320" rx="112" ry="34" fill="#c2b18c" opacity=".45"/>
<path d="M186 320c0-52 36-88 80-88s80 36 80 88z" fill="#b4472f" opacity=".85"/>
<circle cx="266" cy="186" r="34" fill="#e0bd97"/>
<path d="M234 180c0-26 14-42 32-42s32 16 32 42c-10-8-22-12-32-12s-22 4-32 12" fill="#2a2723"/>
<circle cx="286" cy="190" r="3.5" fill="#2a2723"/>
<path d="M282 202c6 5 12 5 17 1" stroke="#2a2723" stroke-width="2.5" fill="none" stroke-linecap="round"/>
<path d="M320 268c34 6 58 18 74 30" stroke="#b4472f" stroke-width="11" fill="none" stroke-linecap="round"/>
<circle cx="398" cy="300" r="8" fill="#e0bd97"/>
<g transform="translate(120 336)">
<ellipse cx="0" cy="0" rx="62" ry="26" fill="#7b7468" opacity=".5"/>
<circle cx="-56" cy="-6" r="20" fill="#7b7468" opacity=".5"/>
<path d="M-76-16c-4-12 6-20 14-14" stroke="#7b7468" stroke-width="6" fill="none" stroke-linecap="round"/>
<path d="M58-8c14-8 18-18 14-26" stroke="#7b7468" stroke-width="6" fill="none" stroke-linecap="round"/>
<g stroke="#7b7468" stroke-width="2" opacity=".9">
<path d="M-62-12h8"/><path d="M-62-4h8"/>
</g>
</g>
<text x="824" y="352" font-family="'Avenir Next',Helvetica,sans-serif" font-size="19" font-weight="600" fill="#b4472f" text-anchor="end">1.0x</text>
</svg>
:::

# The Rules the Elves Keep {lede="Four rules, and they are not about software."}

:::findings
1. **One idea a page.** A page that says two things says neither of them. The elves cut before they draw.
2. **The picture shows what the words cannot.** A gate is a word. A bird that will not move is a picture.
3. **The words say it out loud.** If a page only makes sense when you can see it, the reel is broken, and the elves
   know it before the reel does.
4. **Nothing is made that was not written down.** The note comes first. There is no version of the story where the
   helpers invent the cover.
:::

Tick and Tock have kept these rules for a long time, and they have never once been asked to break one.

:::figure wide | The four rules, as Tick draws them on the bench with a stub of pencil.
<svg viewBox="0 0 1000 420" width="1000" height="420" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="ch09-title">
<title id="ch09-title">The three rules the helpers keep: one idea a page, the picture shows it, the words say it out loud.</title>
<rect width="1000" height="420" fill="#fbf8f2"/>
<g fill="#f4eee2" stroke="#e3dbcc" stroke-width="2">
<rect x="56" y="50" width="272" height="300" rx="8"/>
<rect x="364" y="50" width="272" height="300" rx="8"/>
<rect x="672" y="50" width="272" height="300" rx="8"/>
</g>
<g>
<rect x="136" y="92" width="112" height="152" rx="3" fill="#fbf8f2" stroke="#2a2723" stroke-width="3"/>
<circle cx="192" cy="168" r="23" fill="#b4472f"/>
</g>
<g>
<path d="M424 110c24-28 56-42 76-42s52 14 76 42c-24 28-56 42-76 42s-52-14-76-42z" fill="#fbf8f2" stroke="#b4472f" stroke-width="3.5"/>
<circle cx="500" cy="110" r="15" fill="#2a2723"/>
<circle cx="505" cy="105" r="4.5" fill="#fbf8f2"/>
<rect x="440" y="168" width="120" height="86" rx="2" fill="#fbf8f2" stroke="#2a2723" stroke-width="3"/>
<path d="M450 240l28-32 20 22 14-14 28 24" fill="none" stroke="#2e6a8a" stroke-width="3" stroke-linejoin="round"/>
<circle cx="536" cy="190" r="8" fill="#2e6a8a" opacity=".55"/>
</g>
<g>
<path d="M748 156c24-16 56-16 80 0" fill="none" stroke="#2a2723" stroke-width="6" stroke-linecap="round"/>
<path d="M742 186c28-9 64-9 92 0" fill="none" stroke="#2a2723" stroke-width="6" stroke-linecap="round"/>
<g stroke="#b4472f" stroke-width="3" stroke-linecap="round" fill="none">
<path d="M846 148l38-16"/><path d="M852 172l44 2"/><path d="M846 196l38 18"/>
</g>
</g>
<g font-family="'Avenir Next',Helvetica,sans-serif" font-size="13" letter-spacing=".12em" fill="#7b7468" text-anchor="middle">
<text x="192" y="298">ONE IDEA</text>
<text x="500" y="298">THE PICTURE SHOWS IT</text>
<text x="808" y="298">THE WORDS SAY IT</text>
</g>
</svg>
:::

# Mara Stays Awake {lede="One night she watches the order instead of sleeping through it."}

One night Mara did not go to bed. She sat in the dark with a blanket and watched.

She watched them read the note. She watched them cut the pile into pages, and hold each page up to the lantern before
they set it down. She watched them hand the pages to the voice, one at a time, and wait for each one to come back.

Then she watched the long part: frame after frame, held still, stitched into a single reel, the way eleven pages are
stitched into a single book.

It took all night. It was the most interesting thing she had seen all year, because it was not magic. It was an order.

:::figure wide | Five steps in the dark: the note, the words, the voice, the frames, one stitch.
<svg viewBox="0 0 1000 420" width="1000" height="420" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="ch10-title">
<title id="ch10-title">Mara stays awake and watches the whole order once: the note, the words, the voice, the frames, one long stitch.</title>
<rect width="1000" height="420" fill="#fbf8f2"/>
<ellipse cx="700" cy="190" rx="230" ry="150" fill="#e0bd97" opacity=".35"/>
<circle cx="300" cy="146" r="30" fill="#e0bd97"/>
<path d="M270 146c0-24 14-38 30-38s30 14 30 38c-9-8-19-12-30-12s-21 4-30 12" fill="#2a2723"/>
<circle cx="300" cy="112" r="10" fill="#2a2723"/>
<path d="M264 232v-32a36 36 0 0 1 72 0v32z" fill="#b4472f" opacity=".9"/>
<circle cx="292" cy="148" r="3" fill="#2a2723"/>
<circle cx="308" cy="148" r="3" fill="#2a2723"/>
<path d="M293 158c4 3 9 3 13 0" stroke="#2a2723" stroke-width="2.4" fill="none" stroke-linecap="round"/>
<rect x="600" y="116" width="220" height="140" rx="10" fill="#f4eee2" stroke="#2a2723" stroke-width="4"/>
<g fill="#b4472f"><circle cx="640" cy="156" r="8"/><circle cx="710" cy="156" r="8"/><circle cx="780" cy="156" r="8"/></g>
<rect x="628" y="192" width="164" height="16" rx="3" fill="#2a2723" opacity=".75"/>
<rect x="642" y="198" width="120" height="5" rx="2" fill="#fbf8f2"/>
<g>
<path d="M470 330c0-20 14-34 32-34s32 14 32 34z" fill="#2e6a8a"/>
<circle cx="502" cy="280" r="17" fill="#e0bd97"/>
<path d="M485 274l17-24 17 24z" fill="#2e6a8a"/>
</g>
<g>
<path d="M846 334c0-18 13-31 29-31s29 13 29 31z" fill="#c2b18c"/>
<circle cx="875" cy="288" r="15" fill="#e0bd97"/>
<path d="M860 283l15-22 15 22z" fill="#b4472f"/>
</g>
<g font-family="'Avenir Next',Helvetica,sans-serif" font-size="13" letter-spacing=".06em" text-anchor="middle">
<rect x="40" y="352" width="140" height="40" rx="6" fill="#f4eee2" stroke="#c2b18c" stroke-width="2"/>
<text x="110" y="377" fill="#5a544a">the note</text>
<rect x="248" y="352" width="140" height="40" rx="6" fill="#f4eee2" stroke="#c2b18c" stroke-width="2"/>
<text x="318" y="377" fill="#5a544a">the words</text>
<rect x="456" y="352" width="140" height="40" rx="6" fill="#f4eee2" stroke="#c2b18c" stroke-width="2"/>
<text x="526" y="377" fill="#5a544a">the voice</text>
<rect x="664" y="352" width="140" height="40" rx="6" fill="#f4eee2" stroke="#c2b18c" stroke-width="2"/>
<text x="734" y="377" fill="#5a544a">the frames</text>
<rect x="872" y="352" width="108" height="40" rx="6" fill="#fdf3f0" stroke="#b4472f" stroke-width="2"/>
<text x="926" y="377" fill="#b4472f">one stitch</text>
</g>
<g stroke="#7b7468" stroke-width="2.5" fill="none" stroke-linecap="round">
<path d="M188 372h50"/><path d="M232 366l8 6-8 6"/>
<path d="M396 372h50"/><path d="M440 366l8 6-8 6"/>
<path d="M604 372h50"/><path d="M648 366l8 6-8 6"/>
<path d="M812 372h50"/><path d="M856 366l8 6-8 6"/>
</g>
</svg>
:::

# The Last Small Note {lede="The helper teaches the trade, and then goes."}

The next night Mara stayed at the bench.

She wrote the note before she yawned. She turned the dials herself. She pressed Run, and she went to sleep while it
worked.

In the morning there was a small folded note on the bench that she had not written.

*You know the order now.*

She kept it in the drawer with the good pencils.

:::figure wide | Morning. Mara makes it herself, and the two of them take the door.
<svg viewBox="0 0 1000 420" width="1000" height="420" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="ch11-title">
<title id="ch11-title">In the morning Mara makes the book herself; two small figures walk out through the door.</title>
<rect width="1000" height="420" fill="#fbf8f2"/>
<path d="M0 0h340L200 420H0z" fill="#e0bd97" opacity=".16"/>
<rect x="52" y="36" width="180" height="240" rx="4" fill="#c2b18c" opacity=".3"/>
<rect x="52" y="36" width="180" height="240" rx="4" fill="none" stroke="#c2b18c" stroke-width="4"/>
<line x1="142" y1="36" x2="142" y2="276" stroke="#c2b18c" stroke-width="3"/>
<line x1="52" y1="156" x2="232" y2="156" stroke="#c2b18c" stroke-width="3"/>
<rect x="0" y="336" width="1000" height="7" fill="#2a2723"/>
<rect x="796" y="96" width="164" height="240" fill="#2a2723" opacity=".12"/>
<rect x="796" y="96" width="164" height="240" fill="none" stroke="#2a2723" stroke-width="5"/>
<rect x="330" y="248" width="330" height="88" rx="5" fill="#f4eee2" stroke="#c2b18c" stroke-width="3"/>
<circle cx="452" cy="206" r="31" fill="#e0bd97"/>
<path d="M420 206c0-24 14-38 32-38s32 14 32 38c-10-8-20-12-32-12s-22 4-32 12" fill="#2a2723"/>
<circle cx="452" cy="168" r="11" fill="#2a2723"/>
<path d="M388 336v-52a64 64 0 0 1 128 0v52z" fill="#2e6a8a"/>
<path d="M412 292l106 10" stroke="#2a2723" stroke-width="10" stroke-linecap="round" opacity=".85"/>
<rect x="498" y="296" width="130" height="20" rx="2" fill="#fbf8f2" stroke="#2a2723" stroke-width="2.5"/>
<g stroke="#d9d0be" stroke-width="3" stroke-linecap="round">
<path d="M512 304h54"/>
</g>
<g fill="#f4eee2" stroke="#d9d0be" stroke-width="2">
<rect x="660" y="306" width="150" height="15" rx="2"/>
<rect x="668" y="290" width="150" height="15" rx="2"/>
</g>
<path d="M700 336l70-14-6 18-64 14z" fill="#fbf8f2" stroke="#2a2723" stroke-width="2.5"/>
<path d="M714 334l32-7" stroke="#c2b18c" stroke-width="2"/>
<g opacity=".75">
<path d="M818 336c0-16 11-27 25-27s25 11 25 27z" fill="#2a2723"/>
<circle cx="843" cy="298" r="13" fill="#2a2723"/>
<path d="M830 294l13-20 13 20z" fill="#b4472f"/>
<path d="M868 316c10-4 16-12 17-22" stroke="#2a2723" stroke-width="5" fill="none" stroke-linecap="round"/>
<circle cx="888" cy="288" r="7" fill="#f0d9a8"/>
<path d="M880 336c0-12 8-20 18-20s18 8 18 20z" fill="#2a2723"/>
<circle cx="898" cy="308" r="10" fill="#2a2723"/>
<path d="M888 305l10-15 10 15z" fill="#b4472f"/>
</g>
</svg>
:::

# Things to Make Next {.epilogue .nodrop lede="Three small things a reader can make tonight."}

**A one-page book.** Write one page about one thing in your room. Give it a title, a cover, and a name on the front.
That is a book. It takes ten minutes.

**A reel of your own page.** Read your page aloud, slowly, and stop for one beat at the end. Somebody will look at
the picture in that beat. That somebody is the whole audience.

**A note for a helper.** Write down what you want made, for whom, and what the cover should be. Then hand it to
anything that makes things for you, human or otherwise, and see how much better it goes.

# Reference {.appendix}

## The two files this book came from

The book is one markdown file, and each picture is one SVG file drawn from shapes, not painted. `make.mjs` inlines
the pictures before the build, so a book source looks like this:

```md
---
title: The Elves and the Markdown Maker
cover: The Elves / and the / Markdown Maker
---

# The Bench at Night {lede="Mara writes all day. The making happens at night."}

Mara writes small things.

:::figure wide | Mara at the bench.
{{figures/ch01.svg}}
:::
```

The reel is a storyboard: the same pictures, one scene each, with the words to be spoken under them. The same
inline step applies.

```md
# The Bench at Night

:::figure wide
{{figures/ch01.svg}}
:::

:::narration
Mara writes small things. A gate, a lamp, a bird that will not move.
Every night she leaves a note on top of the pile.
:::
```

## The three commands

```sh
node make.mjs                       # inline the figures: book.md, storyboard.md
node ../../build.mjs book.md -o index.html
node ../../video.mjs storyboard.md -o video
```

## Glossary

- **Markdown**: a page of plain words. `#` makes a title, a blank line makes a new paragraph.
- **Run**: one turn of the machine, from note to finished thing.
- **Pace**: how fast the voice reads. Too fast and the pictures blur; too slow and a spider moves in.
- **Stitch**: the last step, where many still frames become one reel.
