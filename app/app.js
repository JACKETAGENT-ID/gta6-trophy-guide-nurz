import { GUIDES, ROADMAP, MISSABLE_NOTES } from "./data/guides.js";
const LS_KEY = "leonida-legend-progress-v1";
const LS_SPOILER = "leonida-legend-spoiler-v1";
let trophies = [];
let earned = new Set(JSON.parse(localStorage.getItem(LS_KEY) || "[]"));
let spoilerOn = localStorage.getItem(LS_SPOILER) === "1";
let activeKind = "all";
let selectedId = null;
const $ = (s) => document.querySelector(s);
function save() { localStorage.setItem(LS_KEY, JSON.stringify([...earned])); }
function merged() { return trophies.map(t => ({ ...t, ...(GUIDES[t.id] || {}) })); }
function isSpoilerHidden(t) { return spoilerOn && t.kind === "story" && !earned.has(t.id); }
function displayName(t) { return isSpoilerHidden(t) ? "??? Hidden story trophy" : t.name; }
function displayDesc(t) { return isSpoilerHidden(t) ? "Spoiler protection is on. Earn this story trophy to reveal it, or turn protection off above." : t.description; }
function updateProgress() {
  const all = merged();
  const total = all.length || 55;
  const done = earned.size;
  const pct = total ? Math.round((done / total) * 100) : 0;
  $("#earnedCount").textContent = `${done} / ${total} earned`;
  $("#ringPct").textContent = pct + "%";
  const circ = 326.7;
  $("#ringFg").style.strokeDashoffset = String(circ - (circ * pct) / 100);
  const counts = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  all.forEach(t => { if (earned.has(t.id)) counts[t.grade] = (counts[t.grade] || 0) + 1; });
  $("#gradeCounts").textContent = `Platinum ${counts.platinum} · Gold ${counts.gold} · Silver ${counts.silver} · Bronze ${counts.bronze}`;
}
function passesFilters(t) {
  if (activeKind === "missable" && !t.missable) return false;
  if (activeKind !== "all" && activeKind !== "missable" && t.kind !== activeKind) return false;
  const g = $("#gradeFilter").value;
  if (g !== "all" && t.grade !== g) return false;
  const q = $("#searchBox").value.trim().toLowerCase();
  if (q && !(t.name + " " + t.description + " " + (t.guide || "")).toLowerCase().includes(q)) return false;
  return true;
}
function renderList() {
  const list = merged().filter(passesFilters);
  $("#visibleCount").textContent = `— showing ${list.length}`;
  const order = ["platinum", "gold", "silver", "bronze"];
  const wrap = $("#trophyList");
  wrap.innerHTML = "";
  order.forEach(grade => {
    const group = list.filter(t => t.grade === grade);
    if (!group.length) return;
    const div = document.createElement("div"); div.className = "grade-group";
    div.innerHTML = `<h3>${grade} · ${group.length}</h3>`;
    group.forEach(t => {
      const row = document.createElement("div");
      row.className = "trophy-row" + (selectedId === t.id ? " selected" : "");
      row.innerHTML = `<input type="checkbox" ${earned.has(t.id) ? "checked" : ""} aria-label="Mark earned"><div><span class="name">${displayName(t)}</span><span class="desc">${displayDesc(t)}</span><span class="badge ${t.grade}">${t.grade}</span>${t.missable ? '<span class="badge missable">MISSABLE</span>' : ""}<span class="badge kind">${t.kind || ""}</span></div>`;
      const cb = row.querySelector("input");
      cb.addEventListener("click", e => { e.stopPropagation(); if (cb.checked) earned.add(t.id); else earned.delete(t.id); save(); updateProgress(); renderList(); if (selectedId === t.id) renderDetail(t.id); });
      row.addEventListener("click", () => { selectedId = t.id; renderList(); renderDetail(t.id); });
      div.appendChild(row);
    });
    wrap.appendChild(div);
  });
  if (!list.length) wrap.innerHTML = "<p>No trophies match those filters.</p>";
}
function renderDetail(id) {
  const t = merged().find(x => x.id === id); if (!t) return;
  const hidden = isSpoilerHidden(t);
  $("#detailPane").innerHTML = `<h2>${displayName(t)}</h2><p class="desc">${displayDesc(t)}</p><p><span class="badge ${t.grade}">${t.grade}</span> ${t.missable ? '<span class="badge missable">MISSABLE</span>' : ""} <span class="badge kind">${t.kind}</span></p><p><strong>Roadmap stage:</strong> ${t.stage || ""}</p><h3>Guide</h3><p>${hidden ? "Guide hidden by spoiler protection until this story trophy is earned." : (t.guide || "")}</p><h3>Sources</h3><p class="sources">${(t.sources || []).join(" · ")}</p><label><input type="checkbox" id="detailCheck" ${earned.has(t.id) ? "checked" : ""}> Mark as earned</label>`;
  $("#detailCheck").addEventListener("change", e => { if (e.target.checked) earned.add(t.id); else earned.delete(t.id); save(); updateProgress(); renderList(); renderDetail(t.id); });
}
function bindCore() {
  $("#kindFilters").addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; activeKind = b.dataset.kind; document.querySelectorAll("#kindFilters button").forEach(x => x.classList.toggle("active", x === b)); renderList(); });
  $("#gradeFilter").addEventListener("change", renderList);
  $("#searchBox").addEventListener("input", renderList);
  const sp = $("#spoilerToggle"); sp.checked = spoilerOn;
  sp.addEventListener("change", () => { spoilerOn = sp.checked; localStorage.setItem(LS_SPOILER, spoilerOn ? "1" : "0"); renderList(); if (selectedId) renderDetail(selectedId); });
}
function renderRoadmap() {
  $("#missableNote").textContent = MISSABLE_NOTES;
  const all = merged();
  const wrap = $("#roadmapStages"); wrap.innerHTML = "";
  ROADMAP.forEach(stage => {
    const div = document.createElement("div"); div.className = "stage";
    const items = stage.trophyIds.map(id => { const t = all.find(x => x.id === id); if (!t) return ""; return `<li>${earned.has(id) ? "✓" : "○"} <strong>${displayName(t)}</strong> (${t.grade})${t.missable ? ' — <strong>MISSABLE</strong>' : ""} — ${displayDesc(t)}</li>`; }).join("");
    div.innerHTML = `<h3>${stage.title}</h3><p>${stage.text}</p><ul>${items}</ul>`;
    wrap.appendChild(div);
  });
}
function bindExtras() {
  $("#viewTracker").addEventListener("click", () => { $("#trackerView").classList.remove("hidden"); $("#roadmapView").classList.add("hidden"); $("#viewTracker").classList.add("active"); $("#viewRoadmap").classList.remove("active"); });
  $("#viewRoadmap").addEventListener("click", () => { renderRoadmap(); $("#trackerView").classList.add("hidden"); $("#roadmapView").classList.remove("hidden"); $("#viewRoadmap").classList.add("active"); $("#viewTracker").classList.remove("active"); });
  $("#exportBtn").addEventListener("click", () => {
    const payload = { app: "Leonida Legend", exportedAt: new Date().toISOString(), earned: [...earned].sort((a, b) => a - b) };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "leonida-legend-progress.json"; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 500);
  });
  $("#importFile").addEventListener("change", async (e) => {
    const file = e.target.files[0]; if (!file) return;
    try { const data = JSON.parse(await file.text()); const ids = Array.isArray(data) ? data : data.earned; if (!Array.isArray(ids)) throw new Error("bad file"); earned = new Set(ids.filter(n => Number.isInteger(n) && n >= 1 && n <= 55)); save(); updateProgress(); renderList(); renderRoadmap(); if (selectedId) renderDetail(selectedId); alert("Progress imported: " + earned.size + " trophies earned."); } catch { alert("That file could not be read as Leonida Legend progress."); }
    e.target.value = "";
  });
}
async function init() {
  const res = await fetch("./data/trophies.json");
  const data = await res.json();
  trophies = data.trophies;
  bindCore(); bindExtras(); updateProgress(); renderList(); renderRoadmap();
  if (trophies.length) { selectedId = trophies[0].id; renderList(); renderDetail(selectedId); }
}
init();
