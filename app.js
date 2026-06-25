const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const pad = (value) => String(value).padStart(2, "0");
const localDate = (date = new Date()) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const parseDate = (value) => new Date(`${value}T12:00:00`);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

const STORAGE_KEY = "akenoo-forge-data-v2";
const CONFIG_KEY = "akenoo-forge-config-v1";
const todayKey = localDate();
const STREAK_THRESHOLD = 60;
const areas = ["Físico", "Mente", "Profesional", "Proyecto", "Bienestar", "AutoCap", "Orden", "Social"];
const quotes = [
  "Arise. Lo pequeño también suma cuando se repite.",
  "Tu siguiente versión se construye con lo que haces hoy.",
  "La intensidad impresiona. La constancia transforma.",
  "Un día difícil también cuenta cuando decides no abandonarte.",
  "Hazlo pequeño, hazlo real y vuelve mañana.",
  "No persigas perfección. Acumula evidencia.",
  "La disciplina también puede ser una forma de cuidarte."
];

function buildDemoData() {
  const habits = [
    { id: "wake_early", name: "Levantarse temprano", area: "Bienestar", target: 6, priority: "alta", active: true, requiredForStreak: true, description: "Iniciar el día con intención y sin negociar la primera decisión." },
    { id: "run", name: "Salir a correr", area: "Físico", target: 5, priority: "alta", active: true, requiredForStreak: true, description: "Correr o hacer una sesión física clara para activar cuerpo y mente." },
    { id: "job_proposals", name: "Buscar propuestas laborales", area: "Profesional", target: 5, priority: "alta", active: true, requiredForStreak: true, description: "Enviar, revisar o avanzar oportunidades laborales reales." },
    { id: "invyra_work", name: "Trabajo con Invyra", area: "Proyecto", target: 5, priority: "alta", active: true, requiredForStreak: true, description: "Dar un paso concreto en Invyra o en una pieza clave del proyecto." },
    { id: "learning", name: "Aprendizaje consciente", area: "Mente", target: 4, priority: "media", active: true, requiredForStreak: false, description: "Estudiar, leer, practicar o mejorar una habilidad útil." },
    { id: "finances", name: "Orden financiero básico", area: "AutoCap", target: 4, priority: "media", active: true, requiredForStreak: false, description: "Registrar gastos, revisar pagos o tomar una decisión financiera clara." },
    { id: "day_close", name: "Cierre del día", area: "Bienestar", target: 5, priority: "media", active: true, requiredForStreak: false, description: "Escribir una nota breve sobre cómo fue el día y qué sigue mañana." },
    { id: "space_care", name: "Cuidado del espacio", area: "Orden", target: 3, priority: "baja", active: false, requiredForStreak: false, description: "Ordenar o limpiar algo pequeño para mantener el entorno funcional." },
    { id: "connection", name: "Contacto o conexión", area: "Social", target: 3, priority: "baja", active: false, requiredForStreak: false, description: "Responder, escribir o convivir con alguien importante sin hacerlo por compromiso vacío." },
    { id: "no_social_night", name: "Sin redes antes de dormir", area: "Mente", target: 5, priority: "media", active: false, requiredForStreak: false, description: "Evitar redes o consumo automático antes de acostarme." }
  ];
  const completions = {};
  for (let offset = 27; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - offset);
    const seed = date.getDate() + date.getMonth() * 3;
    completions[localDate(date)] = habits.filter((_, index) => ((seed * (index + 3)) % 10) < (offset < 2 ? 3 : 7)).map((habit) => habit.id);
  }
  completions[todayKey] = [];
  return {
    profile: { name: "Solo Leveling Akenoo", motto: "Arise." },
    habits,
    completions,
    journal: [
      { id: "note-demo-1", date: localDate(new Date(Date.now() - 86400000 * 2)), mood: "Con fuerza", energy: 4, advanced: "Corrí y avancé una parte importante de Invyra.", blocked: "Me costó cortar distracciones.", learned: "Empezar temprano cambia el tono del día.", next: "Abrir con propuestas laborales.", text: "Hoy no hice todo, pero sí lo que más necesitaba." },
      { id: "note-demo-2", date: localDate(new Date(Date.now() - 86400000 * 5)), mood: "En calma", energy: 3, advanced: "Ordené pendientes y cerré mejor la noche.", blocked: "Cansancio acumulado.", learned: "Dormir mejor también es progreso.", next: "Correr antes de revisar el celular.", text: "Bajé el ritmo por la noche sin abandonar el proceso." }
    ]
  };
}

let state = loadState();
let config = loadConfig();
let calendarCursor = new Date();
let focusTimer = null;
let focusSeconds = 25 * 60;

function loadState() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || buildDemoData(); }
  catch { return buildDemoData(); }
}

function loadConfig() {
  try { return JSON.parse(localStorage.getItem(CONFIG_KEY)) || { apiUrl: "", apiToken: "" }; }
  catch { return { apiUrl: "", apiToken: "" }; }
}

function saveLocal() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  renderAll();
}

function dayEntries(dateKey) {
  return state.completions[dateKey] || [];
}

function scoreFor(dateKey) {
  const total = state.habits.filter((habit) => habit.active).length;
  if (!total) return 0;
  return Math.round(dayEntries(dateKey).filter((id) => state.habits.some((habit) => habit.id === id && habit.active)).length / total * 100);
}

function requiredHabits() {
  return state.habits.filter((habit) => habit.active && habit.requiredForStreak);
}

function requiredDoneFor(dateKey) {
  const entries = dayEntries(dateKey);
  return requiredHabits().filter((habit) => entries.includes(habit.id)).length;
}

function dayQualifiesForStreak(dateKey) {
  const required = requiredHabits();
  return scoreFor(dateKey) >= STREAK_THRESHOLD && requiredDoneFor(dateKey) === required.length;
}

function dateRange(days, end = new Date()) {
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(end);
    date.setDate(end.getDate() - (days - index - 1));
    return date;
  });
}

function streak() {
  let count = 0;
  const date = new Date();
  if (!dayQualifiesForStreak(localDate(date))) date.setDate(date.getDate() - 1);
  for (let index = 0; index < 365; index += 1) {
    if (!dayQualifiesForStreak(localDate(date))) break;
    count += 1;
    date.setDate(date.getDate() - 1);
  }
  return count;
}

function bestStreak() {
  const keys = Object.keys(state.completions).sort();
  let best = 0;
  let current = 0;
  let previous = null;
  keys.forEach((key) => {
    const date = parseDate(key);
    const consecutive = previous && Math.round((date - previous) / 86400000) === 1;
    current = dayQualifiesForStreak(key) ? (consecutive ? current + 1 : 1) : 0;
    best = Math.max(best, current);
    previous = date;
  });
  return best;
}

function renderHeader() {
  const now = new Date();
  $("#dateLabel").textContent = new Intl.DateTimeFormat("es-MX", { weekday: "long", day: "numeric", month: "short" }).format(now).toUpperCase();
  const activeView = $(".view.active");
  $("#viewTitle").textContent = activeView?.id === "view-today" ? state.profile.motto : (activeView?.dataset.title || state.profile.motto);
  $(".avatar-button").textContent = state.profile.name.toLowerCase().includes("akenoo") ? "AK" : state.profile.name.slice(0, 2).toUpperCase();
}

function renderToday() {
  const activeHabits = state.habits.filter((habit) => habit.active);
  const completed = dayEntries(todayKey);
  const done = activeHabits.filter((habit) => completed.includes(habit.id)).length;
  const percent = activeHabits.length ? Math.round(done / activeHabits.length * 100) : 0;
  $("#heroDone").textContent = done;
  $("#heroTotal").textContent = activeHabits.length;
  $("#dailyPercent").textContent = `${percent}%`;
  $("#dailyRing").style.setProperty("--progress", percent);
  $("#heroMessage").textContent = percent === 100 ? "Cumpliste contigo. Cierra el día y conserva esta evidencia." : percent >= 60 ? "Ya hay impulso. Protege lo avanzado y termina con intención." : "Empieza por una acción pequeña. El ritmo llega después.";
  $("#dailyQuote").textContent = quotes[new Date().getDay()];

  const list = $("#habitList");
  list.innerHTML = activeHabits.map((habit) => {
    const doneToday = completed.includes(habit.id);
    const week = dateRange(7).filter((date) => dayEntries(localDate(date)).includes(habit.id)).length;
    return `<article class="habit-row ${doneToday ? "done" : ""}">
      <button class="habit-check" data-habit-id="${habit.id}" aria-label="${doneToday ? "Desmarcar" : "Completar"} ${escapeHtml(habit.name)}">${doneToday ? "✓" : ""}</button>
      <div class="habit-copy"><strong>${escapeHtml(habit.name)}${habit.requiredForStreak ? ` <span class="required-tag">clave</span>` : ""}</strong><small>${escapeHtml(habit.area)} · Meta ${habit.target} días por semana · ${escapeHtml(habit.priority || "media")}</small></div>
      <div class="habit-meta"><strong>${week}/${habit.target}</strong><small>ESTA SEMANA</small></div>
    </article>`;
  }).join("") || `<div class="empty-state">Agrega tu primer compromiso para comenzar.</div>`;
  $$(".habit-check", list).forEach((button) => button.addEventListener("click", () => toggleHabit(button.dataset.habitId)));

  const weekDates = dateRange(7);
  $("#weekStrip").innerHTML = weekDates.map((date) => {
    const score = scoreFor(localDate(date));
    const label = new Intl.DateTimeFormat("es-MX", { weekday: "narrow" }).format(date).toUpperCase();
    return `<div class="week-day ${score >= 80 ? "complete" : score >= 30 ? "partial" : ""}"><span>${label}</span><i>${score >= 80 ? "✓" : score ? score : ""}</i></div>`;
  }).join("");
  const currentStreak = streak();
  $("#bestStreak").textContent = currentStreak;
  const requiredDone = requiredDoneFor(todayKey);
  const requiredTotal = requiredHabits().length;
  $("#streakMessage").textContent = currentStreak ? `Mejor racha registrada: ${bestStreak()} días. Claves de hoy: ${requiredDone}/${requiredTotal}.` : `Racha estricta: mínimo ${STREAK_THRESHOLD}% y claves completas (${requiredDone}/${requiredTotal}).`;

  $("#areaBars").innerHTML = areas.map((area) => {
    const habits = activeHabits.filter((habit) => habit.area === area);
    if (!habits.length) return "";
    const areaDone = habits.filter((habit) => completed.includes(habit.id)).length;
    const value = Math.round(areaDone / habits.length * 100);
    return `<div class="area-row"><header><strong>${area}</strong><span>${value}%</span></header><div class="track"><i style="width:${value}%"></i></div></div>`;
  }).join("");
}

function renderCalendar() {
  const year = calendarCursor.getFullYear();
  const month = calendarCursor.getMonth();
  $("#monthTitle").textContent = new Intl.DateTimeFormat("es-MX", { month: "long", year: "numeric" }).format(calendarCursor).replace(/^./, (c) => c.toUpperCase());
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - startOffset);
  const days = Array.from({ length: 42 }, (_, index) => new Date(year, month, 1 - startOffset + index));
  $("#calendarGrid").innerHTML = days.map((date) => {
    const key = localDate(date);
    const score = scoreFor(key);
    const isToday = key === todayKey;
    const outside = date.getMonth() !== month;
    return `<div class="calendar-cell ${outside ? "outside" : ""} ${isToday ? "today" : ""}"><span class="day-number">${date.getDate()}</span>${score ? `<span class="day-score-label">${score}%</span><div class="day-score"><i style="width:${score}%"></i></div>` : ""}</div>`;
  }).join("");
  const monthDates = [];
  for (let date = new Date(year, month, 1); date.getMonth() === month; date.setDate(date.getDate() + 1)) monthDates.push(new Date(date));
  const scores = monthDates.map((date) => scoreFor(localDate(date))).filter((value) => value > 0);
  const average = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const strongDays = scores.filter((value) => value >= 80).length;
  $("#monthSummary").innerHTML = `<article class="summary-card"><span>Promedio mensual</span><strong>${average}%</strong></article><article class="summary-card"><span>Días de alto impacto</span><strong>${strongDays}</strong></article><article class="summary-card"><span>Mejor racha histórica</span><strong>${bestStreak()} días</strong></article>`;
}

function renderProgress() {
  const last14 = dateRange(14);
  const scores = last14.map((date) => scoreFor(localDate(date)));
  const average = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const totalChecks = Object.values(state.completions).reduce((sum, values) => sum + values.length, 0);
  const weekAverage = Math.round(dateRange(7).reduce((sum, date) => sum + scoreFor(localDate(date)), 0) / 7);
  $("#metricGrid").innerHTML = [
    ["Promedio 14 días", `${average}%`, "Tu pulso reciente"],
    ["Racha actual", `${streak()} días`, "60% + claves completas"],
    ["Semana actual", `${weekAverage}%`, "Resultado acumulado"],
    ["Acciones cumplidas", totalChecks, "Evidencia total"]
  ].map(([label, value, note]) => `<article class="metric-card"><span>${label}</span><strong>${value}</strong><small>${note}</small></article>`).join("");
  $("#barChart").innerHTML = last14.map((date, index) => `<div class="bar-item" title="${scores[index]}%"><i style="height:${Math.max(2, scores[index])}%"></i><span>${date.getDate()}</span></div>`).join("");
  $("#habitRanking").innerHTML = state.habits.filter((habit) => habit.active).map((habit) => {
    const days = dateRange(28);
    const value = Math.round(days.filter((date) => dayEntries(localDate(date)).includes(habit.id)).length / days.length * 100);
    return { name: habit.name, value };
  }).sort((a, b) => b.value - a.value).map((item) => `<div class="rank-row"><header><strong>${escapeHtml(item.name)}</strong><span>${item.value}%</span></header><div class="track"><i style="width:${item.value}%"></i></div></div>`).join("");
}

function renderJournal() {
  const entries = [...state.journal].sort((a, b) => b.date.localeCompare(a.date));
  $("#journalGrid").innerHTML = entries.map((entry) => `<article class="journal-entry"><header><time datetime="${entry.date}">${new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "long", year: "numeric" }).format(parseDate(entry.date)).toUpperCase()}</time><span class="mood">${escapeHtml(entry.mood)} · Energía ${escapeHtml(entry.energy || "-")}/5</span></header><p>${escapeHtml(entry.text || "")}</p><dl><dt>Avancé</dt><dd>${escapeHtml(entry.advanced || "-")}</dd><dt>Estorbó</dt><dd>${escapeHtml(entry.blocked || "-")}</dd><dt>Mañana</dt><dd>${escapeHtml(entry.next || "-")}</dd></dl></article>`).join("") || `<div class="empty-state">Todavía no hay entradas. Escribe la primera evidencia de tu proceso.</div>`;
}

function renderSettings() {
  $("#profileName").value = state.profile.name;
  $("#profileMotto").value = state.profile.motto;
  $("#apiUrl").value = config.apiUrl || "";
  $("#apiToken").value = config.apiToken || "";
  const connected = Boolean(config.apiUrl && config.apiToken);
  $("#syncDot").classList.toggle("connected", connected);
  $("#syncTitle").textContent = connected ? "Google Sheets" : "Modo local";
  $("#syncText").textContent = connected ? "Sincronización activa" : "Listo para conectar";
}

function renderAll() {
  renderHeader();
  renderToday();
  renderCalendar();
  renderProgress();
  renderJournal();
  renderSettings();
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = String(value);
  return div.innerHTML;
}

function toast(message) {
  const element = $("#toast");
  element.textContent = message;
  element.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => element.classList.remove("show"), 2400);
}

async function api(action, payload = {}) {
  if (!config.apiUrl || !config.apiToken) return null;
  const response = await fetch(config.apiUrl, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action, token: config.apiToken, payload })
  });
  const result = await response.json();
  if (!result.ok) throw new Error(result.error || "No se pudo sincronizar");
  return result.data;
}

async function toggleHabit(id) {
  const values = new Set(dayEntries(todayKey));
  values.has(id) ? values.delete(id) : values.add(id);
  state.completions[todayKey] = [...values];
  saveLocal();
  try { await api("toggleCompletion", { date: todayKey, habitId: id, completed: values.has(id) }); }
  catch (error) { toast(`Guardado localmente. ${error.message}`); }
}

async function syncFromSheets(showMessage = true) {
  if (!config.apiUrl || !config.apiToken) { if (showMessage) toast("Configura Google Sheets para sincronizar."); return; }
  const button = $("#refreshBtn");
  button.disabled = true;
  try {
    const remote = await api("getState");
    if (remote?.habits) {
      state = remote;
      saveLocal();
      if (showMessage) toast("Datos sincronizados con Google Sheets.");
    }
  } catch (error) { toast(error.message); }
  finally { button.disabled = false; }
}

function openView(name) {
  $$(".view").forEach((view) => view.classList.toggle("active", view.id === `view-${name}`));
  $$("[data-view]").forEach((button) => button.classList.toggle("active", button.dataset.view === name));
  renderHeader();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function startFocus() {
  const button = $("#focusBtn");
  if (focusTimer) {
    clearInterval(focusTimer);
    focusTimer = null;
    focusSeconds = 25 * 60;
    button.innerHTML = `<svg aria-hidden="true"><use href="#i-play"/></svg>Iniciar enfoque`;
    toast("Sesión detenida.");
    return;
  }
  focusTimer = setInterval(() => {
    focusSeconds -= 1;
    button.textContent = `${pad(Math.floor(focusSeconds / 60))}:${pad(focusSeconds % 60)} · Detener`;
    if (focusSeconds <= 0) {
      clearInterval(focusTimer);
      focusTimer = null;
      focusSeconds = 25 * 60;
      button.textContent = "Iniciar enfoque";
      toast("Sesión terminada. Buen trabajo.");
    }
  }, 1000);
  toast("25 minutos. Una sola tarea.");
}

function downloadExport() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `akenoo-forge-${todayKey}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function bindEvents() {
  $$("[data-view]").forEach((button) => button.addEventListener("click", () => openView(button.dataset.view)));
  $("#refreshBtn").addEventListener("click", () => syncFromSheets());
  $("#focusBtn").addEventListener("click", startFocus);
  $("#addHabitBtn").addEventListener("click", () => $("#habitDialog").showModal());
  ["#journalQuickBtn", "#newJournalBtn"].forEach((selector) => $(selector).addEventListener("click", () => $("#journalDialog").showModal()));
  $("#prevMonth").addEventListener("click", () => { calendarCursor.setMonth(calendarCursor.getMonth() - 1); renderCalendar(); });
  $("#nextMonth").addEventListener("click", () => { calendarCursor.setMonth(calendarCursor.getMonth() + 1); renderCalendar(); });
  $("#currentMonth").addEventListener("click", () => { calendarCursor = new Date(); renderCalendar(); });

  $("#habitForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const habit = { id: uid(), name: data.get("name").trim(), area: data.get("area"), target: Number(data.get("target")), priority: data.get("priority"), active: true, requiredForStreak: data.get("requiredForStreak") === "on", description: data.get("description").trim() };
    if (!habit.name) return;
    state.habits.push(habit);
    saveLocal();
    $("#habitDialog").close();
    event.currentTarget.reset();
    try { await api("addHabit", habit); toast("Nuevo compromiso agregado."); }
    catch (error) { toast(`Agregado localmente. ${error.message}`); }
  });

  $("#journalForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const entry = {
      id: uid(),
      date: todayKey,
      mood: data.get("mood"),
      energy: Number(data.get("energy")),
      text: data.get("text").trim(),
      advanced: data.get("advanced").trim(),
      blocked: data.get("blocked").trim(),
      learned: data.get("learned").trim(),
      next: data.get("next").trim()
    };
    if (!entry.text && !entry.advanced) return;
    state.journal.push(entry);
    saveLocal();
    $("#journalDialog").close();
    event.currentTarget.reset();
    try { await api("addJournal", entry); toast("Entrada guardada."); }
    catch (error) { toast(`Guardada localmente. ${error.message}`); }
  });

  $("#saveProfile").addEventListener("click", async () => {
    state.profile.name = $("#profileName").value.trim() || "Solo Leveling Akenoo";
    state.profile.motto = $("#profileMotto").value.trim() || "Arise.";
    saveLocal();
    try { await api("saveProfile", state.profile); toast("Identidad actualizada."); }
    catch (error) { toast(`Guardada localmente. ${error.message}`); }
  });

  $("#connectBtn").addEventListener("click", async () => {
    config = { apiUrl: $("#apiUrl").value.trim(), apiToken: $("#apiToken").value.trim() };
    $("#connectionStatus").textContent = "Probando conexión…";
    try {
      const remote = await api("getState");
      if (!remote?.habits) throw new Error("La respuesta no contiene datos válidos.");
      localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
      state = remote;
      saveLocal();
      $("#connectionStatus").textContent = "Conexión correcta. Google Sheets es ahora la fuente principal.";
    } catch (error) {
      $("#connectionStatus").textContent = `No se pudo conectar: ${error.message}`;
    }
  });

  $("#disconnectBtn").addEventListener("click", () => {
    config = { apiUrl: "", apiToken: "" };
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    renderSettings();
    $("#connectionStatus").textContent = "Modo local activado.";
  });
  $("#exportBtn").addEventListener("click", downloadExport);
  $("#resetBtn").addEventListener("click", () => {
    if (!confirm("¿Restaurar los datos de demostración? Se reemplazarán los datos locales actuales.")) return;
    state = buildDemoData();
    saveLocal();
    toast("Datos de demostración restaurados.");
  });
}

bindEvents();
renderAll();
if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("service-worker.js").catch(() => {}));
