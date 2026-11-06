const STORAGE_KEY = "streamingDashboard.v1";

const SERVICES = {
  "Netflix": { color: "#e50914", search: "https://www.netflix.com/search?q=" },
  "Disney+": { color: "#113ccf", search: "https://www.disneyplus.com/search?q=" },
  "Prime Video": { color: "#00a8e1", search: "https://www.primevideo.com/search?phrase=" },
  "Max": { color: "#002be7", search: "https://www.max.com/search?q=" },
  "Hulu": { color: "#1ce783", search: "https://www.hulu.com/search?q=" },
  "Apple TV+": { color: "#333333", search: "https://tv.apple.com/search?term=" },
  "Paramount+": { color: "#0064ff", search: "https://www.paramountplus.com/search/?q=" },
  "BBC iPlayer": { color: "#ff4fa3", search: "https://www.bbc.co.uk/iplayer/search?q=" },
  "YouTube": { color: "#ff0000", search: "https://www.youtube.com/results?search_query=" },
  "Custom": { color: "#6b7280", search: "" }
};

const SAMPLE_SHOWS = [
  { title: "The Bear", year: 2022, service: "Hulu", url: "https://www.hulu.com/series/the-bear", genre: "Drama", notes: "" },
  { title: "Severance", year: 2022, service: "Apple TV+", url: "https://tv.apple.com/show/severance/umc.cmc.1sRk2Goyh2q2zVBgtouerein", genre: "Sci-fi", notes: "" },
  { title: "Shogun", year: 2024, service: "Hulu", url: "https://www.hulu.com/series/shogun", genre: "Drama", notes: "" },
  { title: "The Last of Us", year: 2023, service: "Max", url: "https://www.max.com/shows/the-last-of-us", genre: "Drama", notes: "" },
  { title: "Slow Horses", year: 2022, service: "Apple TV+", url: "https://tv.apple.com/show/slow-horses/umc.cmc.4lgzydqgaqut3rve3vudv5ig", genre: "Thriller", notes: "" }
];

const state = loadState();
const ui = { q: "", service: "All", editingId: null };

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* fall through to defaults */ }
  return {
    shows: SAMPLE_SHOWS.map(s => ({ ...s, id: uid(), watched: false, poster: "" })),
    settings: { tmdbKey: "", mistralKey: "", mistralModel: "mistral-small-latest" }
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

function serviceSearchUrl(service, title) {
  const svc = SERVICES[service];
  if (svc && svc.search) return svc.search + encodeURIComponent(title);
  return "https://www.google.com/search?q=" + encodeURIComponent(title + " " + service);
}

function watchUrl(show) {
  return show.url && show.url.trim() ? show.url.trim() : serviceSearchUrl(show.service, show.title);
}

function visibleShows() {
  const q = ui.q.trim().toLowerCase();
  return state.shows.filter(s => {
    if (ui.service !== "All" && s.service !== ui.service) return false;
    if (!q) return true;
    return [s.title, s.service, s.genre, s.notes].some(f => (f || "").toLowerCase().includes(q));
  });
}

function renderChips() {
  const nav = document.getElementById("service-chips");
  const names = ["All", ...new Set(state.shows.map(s => s.service))];
  nav.innerHTML = names.map(n =>
    `<button class="chip ${ui.service === n ? "active" : ""}" data-service="${esc(n)}">${esc(n)}</button>`
  ).join("");
  nav.querySelectorAll(".chip").forEach(chip => {
    chip.addEventListener("click", () => { ui.service = chip.dataset.service; render(); });
  });
}

function posterHtml(show) {
  if (show.poster) {
    return `<div class="poster" style="background-image:url('${esc(show.poster)}')"></div>`;
  }
  const svc = SERVICES[show.service] || SERVICES["Custom"];
  const letter = esc((show.title || "?").trim().charAt(0).toUpperCase());
  return `<div class="poster" style="background:linear-gradient(135deg, ${svc.color}, #171a21)">${letter}</div>`;
}

function renderGrid() {
  const grid = document.getElementById("grid");
  const shows = visibleShows();
  document.getElementById("empty").hidden = shows.length > 0;
  grid.innerHTML = shows.map(s => {
    const svc = SERVICES[s.service] || SERVICES["Custom"];
    return `<article class="card ${s.watched ? "watched" : ""}" data-id="${esc(s.id)}">
      ${posterHtml(s)}
      <div class="card-body">
        <div class="card-title">${esc(s.title)}</div>
        <div class="card-meta">
          <span class="badge" style="background:${svc.color}">${esc(s.service)}</span>
          ${s.year ? `<span>${esc(s.year)}</span>` : ""}
          ${s.genre ? `<span>${esc(s.genre)}</span>` : ""}
        </div>
        ${s.notes ? `<div class="muted">${esc(s.notes)}</div>` : ""}
        <div class="card-actions">
          <a class="btn small primary" href="${esc(watchUrl(s))}" target="_blank" rel="noopener noreferrer">Watch</a>
          <button class="btn small ghost act-watched">${s.watched ? "Unmark" : "Watched"}</button>
          <button class="btn small ghost act-edit">Edit</button>
          <button class="btn small danger act-delete">Delete</button>
        </div>
      </div>
    </article>`;
  }).join("");

  grid.querySelectorAll(".card").forEach(card => {
    const id = card.dataset.id;
    card.querySelector(".act-watched").addEventListener("click", () => toggleWatched(id));
    card.querySelector(".act-edit").addEventListener("click", () => openModal(id));
    card.querySelector(".act-delete").addEventListener("click", () => deleteShow(id));
  });
}

function render() {
  renderChips();
  renderGrid();
}

function toggleWatched(id) {
  const show = state.shows.find(s => s.id === id);
  if (show) { show.watched = !show.watched; saveState(); render(); }
}

function deleteShow(id) {
  const show = state.shows.find(s => s.id === id);
  if (!show) return;
  if (confirm(`Remove "${show.title}" from your list?`)) {
    state.shows = state.shows.filter(s => s.id !== id);
    saveState();
    render();
  }
}

function fillServiceSelect() {
  const sel = document.getElementById("f-service");
  sel.innerHTML = Object.keys(SERVICES).map(n => `<option value="${esc(n)}">${esc(n)}</option>`).join("");
}

function openModal(id) {
  ui.editingId = id || null;
  const modal = document.getElementById("show-modal");
  const form = document.getElementById("show-form");
  form.reset();
  document.getElementById("tmdb-results").hidden = true;
  const show = state.shows.find(s => s.id === id);
  document.getElementById("modal-title").textContent = show ? "Edit show" : "Add show";
  if (show) {
    document.getElementById("f-title").value = show.title || "";
    document.getElementById("f-year").value = show.year || "";
    document.getElementById("f-service").value = show.service || "Custom";
    document.getElementById("f-url").value = show.url || "";
    document.getElementById("f-poster").value = show.poster || "";
    document.getElementById("f-genre").value = show.genre || "";
    document.getElementById("f-notes").value = show.notes || "";
  }
  modal.showModal();
}

function saveShowFromForm(e) {
  e.preventDefault();
  const data = {
    title: document.getElementById("f-title").value.trim(),
    year: parseInt(document.getElementById("f-year").value, 10) || null,
    service: document.getElementById("f-service").value,
    url: document.getElementById("f-url").value.trim(),
    poster: document.getElementById("f-poster").value.trim(),
    genre: document.getElementById("f-genre").value.trim(),
    notes: document.getElementById("f-notes").value.trim()
  };
  if (!data.title) return;
  if (ui.editingId) {
    const show = state.shows.find(s => s.id === ui.editingId);
    if (show) Object.assign(show, data);
  } else {
    state.shows.unshift({ ...data, id: uid(), watched: false });
  }
  saveState();
  render();
  document.getElementById("show-modal").close();
}

async function tmdbLookup() {
  const key = state.settings.tmdbKey;
  const q = document.getElementById("f-title").value.trim();
  const sel = document.getElementById("tmdb-results");
  if (!key) { alert("Add a TMDB API key in Settings to use metadata lookup."); return; }
  if (!q) return;
  sel.innerHTML = "<option>Searching...</option>";
  sel.hidden = false;
  try {
    const res = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${encodeURIComponent(key)}&query=${encodeURIComponent(q)}`);
    const data = await res.json();
    const results = (data.results || []).filter(r => r.media_type === "tv" || r.media_type === "movie").slice(0, 10);
    if (!results.length) { sel.innerHTML = "<option>No results</option>"; return; }
    sel.innerHTML = results.map((r, i) => {
      const name = r.name || r.title || "Untitled";
      const year = (r.first_air_date || r.release_date || "").slice(0, 4);
      return `<option value="${i}">${esc(name)}${year ? " (" + esc(year) + ")" : ""}</option>`;
    }).join("");
    sel.onchange = () => {
      const r = results[parseInt(sel.value, 10)];
      if (!r) return;
      document.getElementById("f-title").value = r.name || r.title || "";
      document.getElementById("f-year").value = (r.first_air_date || r.release_date || "").slice(0, 4);
      if (r.poster_path) document.getElementById("f-poster").value = "https://image.tmdb.org/t/p/w342" + r.poster_path;
      if (r.overview) document.getElementById("f-notes").value = r.overview.slice(0, 300);
    };
  } catch (err) {
    sel.innerHTML = "<option>Lookup failed</option>";
  }
}

async function askAssistant() {
  const reply = document.getElementById("assistant-reply");
  const q = document.getElementById("assistant-q").value.trim();
  if (!q) return;
  const key = state.settings.mistralKey;
  reply.hidden = false;
  if (!key) {
    reply.textContent = "Add your Mistral API key in Settings first (get one at https://console.mistral.ai).";
    return;
  }
  reply.textContent = "Thinking...";
  const catalog = state.shows.length
    ? state.shows.map(s => `- ${s.title}${s.year ? ` (${s.year})` : ""}, ${s.service}${s.genre ? ", " + s.genre : ""}${s.watched ? ", already watched" : ""}`).join("\n")
    : "(your list is empty)";
  try {
    const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + key
      },
      body: JSON.stringify({
        model: state.settings.mistralModel || "mistral-small-latest",
        messages: [
          { role: "system", content: "You are a concise watchlist assistant for a personal streaming dashboard. Recommend only from the user's list when it fits, and say why in one short sentence. The user's shows:\n" + catalog },
          { role: "user", content: q }
        ]
      })
    });
    const data = await res.json();
    reply.textContent = (data.choices && data.choices[0] && data.choices[0].message.content)
      || ("Request failed: " + (data.error ? data.error.message : res.status));
  } catch (err) {
    reply.textContent = "Request failed: " + err.message;
  }
}

function loadSettingsForm() {
  document.getElementById("s-tmdb").value = state.settings.tmdbKey || "";
  document.getElementById("s-mistral").value = state.settings.mistralKey || "";
  document.getElementById("s-model").value = state.settings.mistralModel || "mistral-small-latest";
}

function saveSettings(e) {
  e.preventDefault();
  state.settings.tmdbKey = document.getElementById("s-tmdb").value.trim();
  state.settings.mistralKey = document.getElementById("s-mistral").value.trim();
  state.settings.mistralModel = document.getElementById("s-model").value.trim() || "mistral-small-latest";
  saveState();
  document.getElementById("settings-modal").close();
}

function init() {
  fillServiceSelect();
  render();
  document.getElementById("search").addEventListener("input", e => { ui.q = e.target.value; renderGrid(); });
  document.getElementById("add-show").addEventListener("click", () => openModal(null));
  document.getElementById("show-form").addEventListener("submit", saveShowFromForm);
  document.getElementById("modal-cancel").addEventListener("click", () => document.getElementById("show-modal").close());
  document.getElementById("tmdb-search").addEventListener("click", tmdbLookup);
  document.getElementById("assistant-toggle").addEventListener("click", () => {
    const p = document.getElementById("assistant-panel");
    p.hidden = !p.hidden;
  });
  document.getElementById("assistant-ask").addEventListener("click", askAssistant);
  document.getElementById("assistant-q").addEventListener("keydown", e => { if (e.key === "Enter") askAssistant(); });
  document.getElementById("settings-toggle").addEventListener("click", () => {
    loadSettingsForm();
    document.getElementById("settings-modal").showModal();
  });
  document.getElementById("settings-cancel").addEventListener("click", () => document.getElementById("settings-modal").close());
  document.getElementById("settings-form").addEventListener("submit", saveSettings);
}

init();
