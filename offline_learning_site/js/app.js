/* Offline Learning — Minimal JS controller
   Notes:
   - No external dependencies.
   - All progress is stored in localStorage under the key 'ol_progress'.
   - Strings and comments avoid contractions as requested.
*/

(function () {
  "use strict";

  const SELECTORS = {
    views: ".view",
    moduleList: "#modules-list",
    lessonArticle: "#lesson-article",
    quizArea: "#quiz-area",
    progressSummary: "#progress-summary",
    moduleSearch: "#module-search",
    homeSuggestions: "#home-suggestions",
  };

  const STATE = {
    modulesIndex: null,
    currentModule: null,
    currentLesson: null,
    progress: loadProgress(),
  };

  // View switching
  document.addEventListener("click", function (e) {
    const target = e.target;
    if (target.matches("[data-view]")) {
      const view = target.getAttribute("data-view");
      showView(view);
    }
    if (target.id === "back-to-modules") {
      showView("modules");
    }
  });

  function showView(view) {
    document.querySelectorAll(SELECTORS.views).forEach(v => {
      const shouldShow = v.dataset.view === view;
      v.hidden = !shouldShow;
    });
    document.getElementById("main").focus();
    if (view === "modules") renderModules();
    if (view === "progress") renderProgress();
  }

  // Initial load
  window.addEventListener("DOMContentLoaded", async () => {
    await loadModulesIndex();
    showView("home");
    wireSearch();
    renderHomeSuggestions();
  });

  async function loadModulesIndex() {
    try {
      const res = await fetch("modules/index.json");
      STATE.modulesIndex = await res.json();
    } catch (err) {
      console.error("Failed to load modules index:", err);
      STATE.modulesIndex = { modules: [] };
    }
  }

  function renderHomeSuggestions() {
    const container = document.querySelector(SELECTORS.homeSuggestions);
    container.innerHTML = "";
    const pool = (STATE.modulesIndex.modules || []).slice(0, 6);
    pool.forEach(mod => container.appendChild(renderModuleCard(mod)));
  }

  function renderModules(filterText = "") {
    const list = document.querySelector(SELECTORS.moduleList);
    list.innerHTML = "";
    const items = (STATE.modulesIndex.modules || []).filter(m => {
      if (!filterText) return true;
      const t = filterText.toLowerCase();
      return (
        m.id.toLowerCase().includes(t) ||
        m.title.toLowerCase().includes(t) ||
        (m.tags || []).join(" ").toLowerCase().includes(t)
      );
    });
    if (items.length === 0) {
      const empty = document.createElement("p");
      empty.textContent = "No modules matched your search.";
      list.appendChild(empty);
      return;
    }
    items.forEach(m => list.appendChild(renderModuleCard(m)));
  }

  function renderModuleCard(mod) {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <h3>${escapeHtml(mod.title)}</h3>
      <p>${escapeHtml(mod.description || "")}</p>
      <p class="note">Lessons: ${mod.lesson_count ?? "Unknown"}</p>
      <div style="display:flex; gap:.5rem; flex-wrap:wrap; margin-top:.25rem;">
        <button class="btn small" data-action="open-module" data-module="${mod.id}">Open</button>
      </div>
    `;
    card.addEventListener("click", async (e) => {
      const t = e.target;
      if (t && t.dataset && t.dataset.action === "open-module") {
        await openModule(t.dataset.module);
      }
    });
    return card;
  }

  async function openModule(moduleId) {
    const mod = (STATE.modulesIndex.modules || []).find(m => m.id === moduleId);
    if (!mod) return;
    STATE.currentModule = mod;
    try {
      const res = await fetch(`modules/${moduleId}/lessons.json`);
      const data = await res.json();
      // Render the first lesson by default
      if (Array.isArray(data.lessons) && data.lessons.length) {
        renderLesson(data.lessons[0], data.lessons);
      } else {
        alert("Module has no lessons defined.");
      }
      showView("lesson");
    } catch (err) {
      console.error("Failed to load lessons:", err);
      alert("Could not load lessons for this module.");
    }
  }
  
  async function hydrateSvg() {
    const holders = document.querySelectorAll(".svg-wrap[data-src]");
    for (const el of holders) {
      const src = el.getAttribute("data-src");
      try {
        const res = await fetch(src);
        el.innerHTML = await res.text(); // inline the SVG markup
      } catch {
        // Fallback if fetch is blocked under file:// or the file is missing
        el.innerHTML = `<img src="${escapeAttr(src)}" alt="" style="max-width:100%;height:auto"/>`;
      }
    }
  }

  function renderLesson(lesson, collection) {
    STATE.currentLesson = lesson;
    const el = document.querySelector(SELECTORS.lessonArticle);
    el.innerHTML = `
      <header>
        <h2>${escapeHtml(lesson.title)}</h2>
        <p class="meta">Module: ${escapeHtml(STATE.currentModule.title)} — Level: ${escapeHtml(lesson.level || "General")}</p>
      </header>
      <section class="content">${renderBlocks(lesson.content)}</section>
      <nav class="lesson-nav">
        ${renderLessonNav(lesson, collection)}
      </nav>
    `;
	 hydrateSvg();
	  
    renderQuiz(lesson);
    markVisited(STATE.currentModule.id, lesson.id);
  }
  
  function renderImg(b) {
    const alt = escapeAttr(b.alt || "");
    return `<p><img src="${escapeAttr(b.src)}" alt="${alt}" style="max-width:100%;height:auto"/></p>`;
  }

  function renderSvg(b) {
    // Option A: external file
    if (b.src) return `<div class="svg-wrap" data-src="${escapeAttr(b.src)}"></div>`;
    // Option B: inline string (b.markup)
    return `<div class="svg-wrap">${b.markup || ""}</div>`;
  }

  function renderAudio(b) {
    const cap = b.caption ? `<div class="note">${escapeHtml(b.caption)}</div>` : "";
    return `<div><audio controls preload="metadata" src="${escapeAttr(b.src)}"></audio>${cap}</div>`;
  }

  // Number line as inline SVG (lightweight)
  function renderNumberLine(b) {
    const min = b.min ?? 0, max = b.max ?? 10, tickEvery = b.tickEvery ?? 1;
    const width = 300, height = 50, pad = 20;
    const range = Math.max(1, max - min);
   // const range = max - min;
    const ticks = [];
    for (let v = min; v <= max; v += tickEvery) {
      const x = pad + ((v - min) / range) * (width - 2*pad);
      ticks.push(`<line x1="${x}" y1="20" x2="${x}" y2="35" stroke="currentColor"/>`);
      ticks.push(`<text x="${x}" y="48" font-size="12" text-anchor="middle">${v}</text>`);
    }
    const targetX = b.target != null ? pad + ((b.target - min) / range) * (width - 2*pad) : null;
    const target = (targetX != null)
      ? `<circle cx="${targetX}" cy="10" r="4" fill="currentColor"/>${b.showTargetLabel ? `<text x="${targetX}" y="10" dy="-6" font-size="12" text-anchor="middle">${b.target}</text>` : ""}`
      : "";
    return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Number line ${min} to ${max}">
      <line x1="${pad}" y1="20" x2="${width-pad}" y2="20" stroke="currentColor"/>
      ${ticks.join("")}
      ${target}
    </svg>`;
  }

  // Ten-frame (0–10)
  function renderTenFrame(b) {
    const value = Math.max(0, Math.min(10, Number(b.value || 0)));
    const cells = Array.from({length:10}, (_,i) =>
      `<div class="cell" aria-label="slot ${i+1}">${i < value ? "●" : ""}</div>`
    ).join("");
    return `<div class="tenframe" role="group" aria-label="${escapeAttr(b.label || "Ten frame")}">${cells}</div>`;
  }

  // Phoneme block
  function renderPhoneme(b) {
    const ex = (b.examples || []).map(e =>
      `<button class="btn small" data-audio="${escapeAttr(e.audio)}">${escapeHtml(e.word)}</button>`
    ).join(" ");
    const mp = (b.minimalPairs || []).map(p =>
      `<div class="card"><button class="btn small" data-audio="${escapeAttr(p.audioA)}">${escapeHtml(p.pair[0])}</button>
       <button class="btn small" data-audio="${escapeAttr(p.audioB)}">${escapeHtml(p.pair[1])}</button></div>`
    ).join("");
    return `<div class="phoneme">
      <div><strong>${escapeHtml(b.grapheme)}</strong> /${escapeHtml(b.ipa || "")}/</div>
      <div class="examples">${ex}</div>
      <div class="pairs">${mp}</div>
    </div>`;
  }

  // Hook up audio buttons once:
  document.addEventListener("click", (e) => {
    const a = e.target.closest("[data-audio]");
    if (!a) return;
    const src = a.getAttribute("data-audio");
    const audio = new Audio(src);
    audio.play().catch(()=>{});
  });
  
  function renderBlocks(blocks) {
    if (!Array.isArray(blocks)) return "";
    return blocks.map(b => {
	  if (b.type === "a") return renderLink(b);
      if (b.type === "p") return `<p>${escapeHtml(b.text)}</p>`;
      if (b.type === "ul") return `<ul>${b.items.map(it => `<li>${escapeHtml(it)}</li>`).join("")}</ul>`;
      if (b.type === "ol") return `<ol>${b.items.map(it => `<li>${escapeHtml(it)}</li>`).join("")}</ol>`;
      if (b.type === "code") return `<pre><code>${escapeHtml(b.code)}</code></pre>`;
      if (b.type === "h3") return `<h3>${escapeHtml(b.text)}</h3>`;
	  if (b.type === "img") return renderImg(b);
	  if (b.type === "svg") return renderSvg(b);
	  if (b.type === "audio") return renderAudio(b);
	  if (b.type === "numberline") return renderNumberLine(b);
	  if (b.type === "tenframe") return renderTenFrame(b);
	  if (b.type === "phoneme") return renderPhoneme(b);
      return "";
    }).join("");
  }

  function renderLessonNav(current, collection) {
    const idx = collection.findIndex(x => x.id === current.id);
    const prev = idx > 0 ? collection[idx - 1] : null;
    const next = idx < collection.length - 1 ? collection[idx + 1] : null;
    return `
      <div style="display:flex; gap:.5rem; margin-top:.5rem;">
        <button class="btn small" ${prev ? "" : "disabled"} data-go="${prev ? prev.id : ""}" id="prev-lesson">Previous</button>
        <button class="btn small" ${next ? "" : "disabled"} data-go="${next ? next.id : ""}" id="next-lesson">Next</button>
      </div>
    `;
  }

  document.addEventListener("click", function (e) {
    const t = e.target;
    if (t && t.id === "prev-lesson" && t.dataset.go) goToLesson(t.dataset.go);
    if (t && t.id === "next-lesson" && t.dataset.go) goToLesson(t.dataset.go);
  });

  async function goToLesson(lessonId) {
    try {
      const res = await fetch(`modules/${STATE.currentModule.id}/lessons.json`);
      const data = await res.json();
      const target = data.lessons.find(x => x.id === lessonId);
      if (target) renderLesson(target, data.lessons);
    } catch (err) {
      console.error("Navigation failed:", err);
    }
  }

  function renderQuiz(lesson) {
    const area = document.querySelector(SELECTORS.quizArea);
    const q = lesson.quiz;
    if (!q) { area.innerHTML = ""; return; }
    const userAns = getAnswer(STATE.currentModule.id, lesson.id);
    area.innerHTML = `
      <h3>Check Your Understanding</h3>
      <p>${escapeHtml(q.prompt)}</p>
      <div class="choices" role="radiogroup" aria-label="Quiz choices">
        ${q.choices.map((c, i) => {
          const checked = userAns === i ? 'aria-checked="true"' : 'aria-checked="false"';
          return `<div class="choice" role="radio" tabindex="0" data-index="${i}" ${checked}>${escapeHtml(c)}</div>`;
        }).join("")}
      </div>
      <div class="result" id="quiz-result" aria-live="polite"></div>
    `;
    area.querySelectorAll(".choice").forEach(el => {
      el.addEventListener("click", () => selectChoice(el, q.answer));
      el.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); selectChoice(el, q.answer); }
      });
    });
    // Show previous result if any
    if (typeof userAns === "number") {
      showQuizResult(userAns === q.answer);
    }
  }

  function selectChoice(el, correctIndex) {
    const idx = Number(el.dataset.index);
    el.parentElement.querySelectorAll(".choice").forEach(n => n.setAttribute("aria-checked", "false"));
    el.setAttribute("aria-checked", "true");
    setAnswer(STATE.currentModule.id, STATE.currentLesson.id, idx);
    showQuizResult(idx === correctIndex);
  }

  function showQuizResult(isCorrect) {
    const rr = document.getElementById("quiz-result");
    rr.textContent = isCorrect ? "Correct." : "Not correct. Please review the lesson and try again.";
  }

  // Progress handling
  function loadProgress() {
    try {
      return JSON.parse(localStorage.getItem("ol_progress")) || { visited: {}, answers: {} };
    } catch {
      return { visited: {}, answers: {} };
    }
  }
  function saveProgress() {
    localStorage.setItem("ol_progress", JSON.stringify(STATE.progress));
  }
  function markVisited(moduleId, lessonId) {
    if (!STATE.progress.visited[moduleId]) STATE.progress.visited[moduleId] = {};
    STATE.progress.visited[moduleId][lessonId] = true;
    saveProgress();
  }
  function setAnswer(moduleId, lessonId, ansIndex) {
    if (!STATE.progress.answers[moduleId]) STATE.progress.answers[moduleId] = {};
    STATE.progress.answers[moduleId][lessonId] = ansIndex;
    saveProgress();
  }
  function getAnswer(moduleId, lessonId) {
    return STATE.progress.answers?.[moduleId]?.[lessonId];
  }

  // Progress view
  function renderProgress() {
    const box = document.querySelector(SELECTORS.progressSummary);
    box.innerHTML = "";
    const mods = STATE.modulesIndex.modules || [];
    mods.forEach(m => {
      const visited = Object.keys(STATE.progress.visited[m.id] || {}).length;
      const total = m.lesson_count || 0;
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `<h3>${escapeHtml(m.title)}</h3><p>${visited} of ${total} lessons visited.</p>`;
      box.appendChild(card);
    });
  }

  // Export / Import
  document.addEventListener("click", function (e) {
    if (e.target && e.target.id === "export-progress") {
      const blob = new Blob([JSON.stringify(STATE.progress, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "offline_learning_progress.json";
      a.click();
      URL.revokeObjectURL(url);
    }
    if (e.target && e.target.id === "clear-progress") {
      if (confirm("This will erase local progress on this device. Proceed?")) {
        STATE.progress = { visited: {}, answers: {} };
        saveProgress();
        renderProgress();
      }
    }
    if (e.target && e.target.id === "import-progress") {
      const file = document.getElementById("import-file").files[0];
      if (!file) { alert("Please select a file to import."); return; }
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result);
          if (data && typeof data === "object") {
            STATE.progress = data;
            saveProgress();
            alert("Progress imported successfully.");
            renderProgress();
          }
        } catch (err) {
          alert("Import failed. The file did not contain valid JSON.");
        }
      };
      reader.readAsText(file);
    }
  });

  // Search
  function wireSearch() {
    const input = document.querySelector(SELECTORS.moduleSearch);
    if (!input) return;
    input.addEventListener("input", (e) => {
      const value = e.target.value.trim();
      renderModules(value);
    });
  }

  // Utilities
  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // Escapes content for attribute contexts like href="..."
  function escapeAttr(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll("'", "&#039;");
  }

  // Renders a safe link element using lesson block fields
  function renderLink(b) {
    const href = b && b.href ? escapeAttr(b.href) : "#";
    const download = b && b.download ? " download" : "";
    const target = b && b.newTab ? ' target="_blank" rel="noopener"' : "";
    const label = b && b.text ? escapeHtml(b.text) : href;
    return `<p><a href="${href}"${download}${target}>${label}</a></p>`;
  }



})();