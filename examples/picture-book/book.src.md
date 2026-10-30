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
{{figures/ch01.svg}}
:::

# The Note on the Bench {lede="The first thing a helper reads is never the words."}

The note sits on top of the pile. It is small, and it is the first thing anyone reads.

*The Book of Small Things. Cover: a bird, a gate, a lamp. For Ada, who is five.*

That is all of it. A name, a picture, and who it is for.

Mara does not write the note for herself. She knows what she meant. She writes it for whoever comes at night, because
no one can make a book out of a pile, not even a helper. A helper can only make what someone wrote down.

:::figure wide | The note on the pile: a title, the cover, and who the book is for.
{{figures/ch02.svg}}
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
{{figures/ch03.svg}}
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
{{figures/ch04.svg}}
:::

# Three Dials {lede="The whole machine, on the front."}

The machine has three dials.

The first says how many pages. The second says how fast the voice reads. The third says whose voice it is.

That is everything there is to set. There is no fourth dial, and nothing hidden behind the machine.

Turn them. Nothing breaks, and nothing is spent. A run that comes out wrong is only a run you can do again.

This panel is a simulation, not a renderer. Its time is an estimate for imaginary pages of 35 words each, not the
length of this book’s narrated reel; the voice selector changes the description, not any audio.

:::figure wide | The machine, front on. Pages, pace, voice, and a slot for the work to come out of.
{{figures/ch05.svg}}
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
{{figures/ch06.svg}}
:::

# Too Slow {lede="Tock learns that the other way is a direction too."}

The next night Tock was careful, and turned the same dial the other way.

0.3x. One page stayed on the screen so long that a spider built a web across the corner of it. The plant in the pot
grew a leaf. Ada went to bed, came back after breakfast, and the same page was still there, halfway through being
read.

Tock is patient. Tock is the most patient thing on the bench. Even Tock began to tap his foot.

:::figure wide | 0.3x. Held so long that the room has time to grow a web.
{{figures/ch07.svg}}
:::

# Just Right {lede="The one setting the whole book is about."}

1.0x. The voice reads at the speed of a person reading to a child, and then it stops for one beat at the end of the
page.

That beat is the whole thing. It is the space where a child looks at the picture. It is where a page is allowed to
land.

The reel then takes as long as it takes. Nobody counts the minutes after the first two nights.

:::figure wide | 1.0x, with the beat at the end. Somebody is listening, and the page waits for her.
{{figures/ch08.svg}}
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
{{figures/ch09.svg}}
:::

# Mara Stays Awake {lede="One night she watches the order instead of sleeping through it."}

One night Mara did not go to bed. She sat in the dark with a blanket and watched.

She watched them read the note. She watched them cut the pile into pages, and hold each page up to the lantern before
they set it down. She watched them hand the pages to the voice, one at a time, and wait for each one to come back.

Then she watched the long part: frame after frame, held still, stitched into a single reel, the way eleven pages are
stitched into a single book.

It took all night. It was the most interesting thing she had seen all year, because it was not magic. It was an order.

:::figure wide | Five steps in the dark: the note, the words, the voice, the frames, one stitch.
{{figures/ch10.svg}}
:::

# The Last Small Note {lede="The helper teaches the trade, and then goes."}

The next night Mara stayed at the bench.

She wrote the note before she yawned. She turned the dials herself. She pressed Run, and she went to sleep while it
worked.

In the morning there was a small folded note on the bench that she had not written.

*You know the order now.*

She kept it in the drawer with the good pencils.

:::figure wide | Morning. Mara makes it herself, and the two of them take the door.
{{figures/ch11.svg}}
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
