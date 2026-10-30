const $ = id => document.getElementById(id);
const audio = $("audio"), visual = $("visual"), seek = $("seek");
let preview, index = 0, frameReady = false, pendingTime = 0, updateNote = "";
const clock = seconds => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
const current = () => preview?.beats[index];
function controls() {
	$("play").disabled = $("replay").disabled = seek.disabled = !frameReady;
	$("previous").disabled = !frameReady || index === 0;
	$("next").disabled = !frameReady || index === preview.beats.length - 1;
	$("play").textContent = audio.paused ? "Play" : "Pause";
}
function time() {
	const elapsed = (current()?.startSeconds ?? 0) + (audio.currentTime || 0);
	seek.value = elapsed;
	$("time").textContent = `${clock(elapsed)} / ${clock(preview?.durationSeconds ?? 0)}`;
	seek.setAttribute("aria-valuetext", $("time").textContent);
}
async function play() {
	if (!frameReady) return;
	try { await audio.play(); }
	catch (error) { if (error.name !== "AbortError") $("error").textContent = `Playback failed: ${error.message}. Press Play to retry.`; }
	controls();
}
function select(next, playing = false, offset = 0) {
	if (!preview || next < 0 || next >= preview.beats.length) return;
	audio.pause();
	index = next;
	const beat = current();
	pendingTime = Math.min(offset, Math.max(0, beat.durationSeconds - 0.01));
	audio.src = `audio/${beat.audio}`;
	audio.load();
	visual.contentWindow.postMessage({ type: "rehearsal:beat", sceneIndex: beat.sceneIndex, beatIndex: beat.beatIndex }, "*");
	$("position").textContent = `Beat ${index + 1} / ${preview.beats.length} · ${beat.title} · ${beat.durationSeconds.toFixed(1)}s`;
	$("narration").textContent = beat.narration;
	for (const [i, button] of [...$("beats").querySelectorAll("button")].entries()) button.setAttribute("aria-current", String(i === index));
	const active = $("beats").children[index];
	if (active) {
		const list = $("beats"), top = active.offsetTop - list.offsetTop;
		if (top < list.scrollTop || top + active.offsetHeight > list.scrollTop + list.clientHeight) list.scrollTop = top;
	}
	controls();
	time();
	if (playing) play();
}
audio.addEventListener("loadedmetadata", () => {
	if (pendingTime) audio.currentTime = pendingTime;
	pendingTime = 0;
	time();
});
audio.addEventListener("timeupdate", time);
audio.addEventListener("play", controls);
audio.addEventListener("pause", controls);
audio.addEventListener("error", () => { $("error").textContent = "Could not load narration. Check that the preview command is still running, then select the beat again."; });
audio.addEventListener("ended", () => {
	let next = index + 1;
	if ($("loop").checked && preview.beats[next]?.sceneIndex !== current().sceneIndex) next = preview.beats.findIndex(beat => beat.sceneIndex === current().sceneIndex);
	if (next < preview.beats.length) select(next, true);
	else controls();
});
$("play").onclick = () => {
	if (!audio.paused) audio.pause();
	else if (audio.ended && index === preview.beats.length - 1) select(0, true);
	else play();
};
const previous = () => select(index - 1, !audio.paused);
const next = () => select(index + 1, !audio.paused);
$("previous").onclick = previous;
$("next").onclick = next;
$("replay").onclick = () => select(preview.beats.findIndex(beat => beat.sceneIndex === current().sceneIndex), true);
seek.addEventListener("input", () => {
	const target = Math.min(Number(seek.value), preview.durationSeconds - 0.01);
	const next = preview.beats.findLastIndex(beat => beat.startSeconds <= target);
	select(next, !audio.paused, target - preview.beats[next].startSeconds);
});
document.addEventListener("keydown", event => {
	if (!frameReady || event.altKey || event.ctrlKey || event.metaKey || /INPUT|BUTTON|TEXTAREA|SELECT/.test(event.target.tagName)) return;
	const actions = { " ": $("play").onclick, ArrowLeft: previous, ArrowRight: next };
	if (actions[event.key]) { event.preventDefault(); actions[event.key](); }
});
new ResizeObserver(() => { visual.style.transform = `scale(${$('stage').clientWidth / 1280})`; }).observe($("stage"));

function install(next) {
	const old = current(), offset = audio.currentTime;
	audio.pause();
	frameReady = false;
	const wasPreview = Boolean(preview);
	preview = next;
	let position = old ? preview.beats.findIndex(beat => beat.title === old.title && beat.narration === old.narration) : 0;
	if (position < 0) position = preview.beats.findIndex(beat => beat.sceneIndex === old.sceneIndex && beat.beatIndex === old.beatIndex);
	if (position < 0) position = Math.min(index, preview.beats.length - 1);
	index = position;
	updateNote = wasPreview ? `Updated · paused at beat ${index + 1}` : "Ready · press Play to rehearse";
	$("title").textContent = preview.title;
	document.title = `${preview.title} · Rehearsal`;
	$("summary").textContent = `${preview.beats.length} beats · ${clock(preview.durationSeconds)}`;
	seek.max = preview.durationSeconds;
	const buttons = preview.beats.map((beat, i) => {
		const li = document.createElement("li"), button = document.createElement("button");
		button.className = "beat";
		const add = (name, text, parent = button) => { const span = document.createElement("span"); span.className = name; span.textContent = text; parent.append(span); return span; };
		add("number", String(i + 1).padStart(2, "0"));
		const title = add("beat-title", beat.title);
		add("duration", `${beat.durationSeconds.toFixed(1)}s`, title);
		add("line", beat.narration);
		if (beat.warnings.length) add("warning", beat.warnings.join(" · "));
		button.onclick = () => { if (frameReady) select(i, !audio.paused); };
		li.append(button);
		return li;
	});
	$("beats").replaceChildren(...buttons);
	controls();
	visual.onload = () => {
		frameReady = true;
		$("empty").hidden = true;
		select(position, false, old?.audio === current().audio ? offset : 0);
	};
	visual.hidden = false;
	visual.src = `storyboard/${preview.revision}?rehearsal`;
}
async function poll() {
	try {
		const response = await fetch("state", { cache: "no-store" });
		if (!response.ok) throw new Error(`HTTP ${response.status}`);
		const state = await response.json();
		if (state.preview && state.preview.revision !== preview?.revision) install(state.preview);
		const status = state.preparing
			? `Preparing narration${state.progress ? ` · ${state.progress.completed}/${state.progress.total} beats` : "…"}${preview ? " · previous version stays playable" : ""}`
			: state.error ? "Could not update · fix the script and save again, or restart to retry" : `${updateNote} · watching Markdown`;
		if ($("status").textContent !== status) $("status").textContent = status;
		$("error").textContent = state.error || "";
		if (state.error && !preview) $("empty").querySelector("strong").textContent = "Preview needs attention";
	} catch {
		$("status").textContent = "Preview disconnected · restart the command and open its new URL";
	} finally { setTimeout(poll, 700); }
}
poll();
