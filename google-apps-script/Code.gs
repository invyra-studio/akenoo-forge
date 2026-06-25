/**
 * Solo Leveling Akenoo - Google Sheets backend
 * Use this script from a Google Sheet created for the application.
 */

const SHEETS = {
  HABITS: "Habits",
  COMPLETIONS: "Completions",
  JOURNAL: "Journal",
  SETTINGS: "Settings",
  DASHBOARD: "Dashboard"
};

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Solo Leveling Akenoo")
    .addItem("Preparar hoja", "setupForge")
    .addItem("Ver token", "showToken")
    .addToUi();
}

function setupForge() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const token = Utilities.getUuid() + Utilities.getUuid().replace(/-/g, "");
  PropertiesService.getScriptProperties().setProperties({
    FORGE_SHEET_ID: spreadsheet.getId(),
    FORGE_TOKEN: token
  });

  ensureSheet_(SHEETS.HABITS, ["id", "name", "area", "target", "priority", "active", "requiredForStreak", "description", "createdAt"]);
  ensureSheet_(SHEETS.COMPLETIONS, ["date", "habitId", "completed", "updatedAt"]);
  ensureSheet_(SHEETS.JOURNAL, ["id", "date", "mood", "energy", "text", "advanced", "blocked", "learned", "next", "createdAt"]);
  ensureSheet_(SHEETS.SETTINGS, ["key", "value"]);
  ensureSheet_(SHEETS.DASHBOARD, ["metric", "value", "note"]);

  const habitsSheet = getSheet_(SHEETS.HABITS);
  if (habitsSheet.getLastRow() === 1) {
    const now = new Date().toISOString();
    habitsSheet.getRange(2, 1, 10, 9).setValues([
      ["wake_early", "Levantarse temprano", "Bienestar", 6, "alta", true, true, "Iniciar el día con intención y sin negociar la primera decisión.", now],
      ["run", "Salir a correr", "Físico", 5, "alta", true, true, "Correr o hacer una sesión física clara para activar cuerpo y mente.", now],
      ["job_proposals", "Buscar propuestas laborales", "Profesional", 5, "alta", true, true, "Enviar, revisar o avanzar oportunidades laborales reales.", now],
      ["invyra_work", "Trabajo con Invyra", "Proyecto", 5, "alta", true, true, "Dar un paso concreto en Invyra o en una pieza clave del proyecto.", now],
      ["learning", "Aprendizaje consciente", "Mente", 4, "media", true, false, "Estudiar, leer, practicar o mejorar una habilidad útil.", now],
      ["finances", "Orden financiero básico", "AutoCap", 4, "media", true, false, "Registrar gastos, revisar pagos o tomar una decisión financiera clara.", now],
      ["day_close", "Cierre del día", "Bienestar", 5, "media", true, false, "Escribir una nota breve sobre cómo fue el día y qué sigue mañana.", now],
      ["space_care", "Cuidado del espacio", "Orden", 3, "baja", false, false, "Ordenar o limpiar algo pequeño para mantener el entorno funcional.", now],
      ["connection", "Contacto o conexión", "Social", 3, "baja", false, false, "Responder, escribir o convivir con alguien importante sin hacerlo por compromiso vacío.", now],
      ["no_social_night", "Sin redes antes de dormir", "Mente", 5, "media", false, false, "Evitar redes o consumo automático antes de acostarme.", now]
    ]);
  }

  const settingsSheet = getSheet_(SHEETS.SETTINGS);
  if (settingsSheet.getLastRow() === 1) {
    settingsSheet.getRange(2, 1, 4, 2).setValues([["name", "Solo Leveling Akenoo"], ["motto", "Arise."], ["streakThreshold", 60], ["streakMode", "strict"]]);
  }

  const dashboardSheet = getSheet_(SHEETS.DASHBOARD);
  if (dashboardSheet.getLastRow() === 1) {
    dashboardSheet.getRange(2, 1, 5, 3).setValues([
      ["Racha actual", "", "La app calcula la racha estricta con 60% y hábitos clave."],
      ["Porcentaje semanal", "", "Preparado para formulas o dashboard visual."],
      ["Porcentaje mensual", "", "Preparado para formulas o dashboard visual."],
      ["Hábitos fuertes", "", "Se alimenta desde Completions."],
      ["Hábitos débiles", "", "Se alimenta desde Completions."]
    ]);
  }

  styleSheets_();
  SpreadsheetApp.getUi().alert("La hoja quedó preparada. Ve a Solo Leveling Akenoo > Ver token para copiar tu token privado.");
}

function showToken() {
  const token = PropertiesService.getScriptProperties().getProperty("FORGE_TOKEN");
  SpreadsheetApp.getUi().alert(token || "Primero ejecuta 'Preparar hoja'.");
}

function doGet() {
  return json_({ ok: true, data: { service: "Solo Leveling Akenoo", ready: Boolean(getConfig_().token) } });
}

function doPost(event) {
  try {
    const request = JSON.parse(event.postData.contents || "{}");
    const config = getConfig_();
    if (!config.token || request.token !== config.token) throw new Error("Token no válido.");

    const action = request.action;
    const payload = request.payload || {};
    let data;
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      if (action === "getState") data = getState_();
      else if (action === "toggleCompletion") data = toggleCompletion_(payload);
      else if (action === "addHabit") data = addHabit_(payload);
      else if (action === "addJournal") data = addJournal_(payload);
      else if (action === "saveProfile") data = saveProfile_(payload);
      else throw new Error("Acción desconocida.");
    } finally {
      lock.releaseLock();
    }
    return json_({ ok: true, data: data });
  } catch (error) {
    return json_({ ok: false, error: error.message });
  }
}

function getState_() {
  const habits = rowsAsObjects_(getSheet_(SHEETS.HABITS)).map(function (row) {
    return { id: String(row.id), name: String(row.name), area: String(row.area), target: Number(row.target), priority: String(row.priority || "media"), active: asBoolean_(row.active), requiredForStreak: asBoolean_(row.requiredForStreak), description: String(row.description || "") };
  });
  const completions = {};
  rowsAsObjects_(getSheet_(SHEETS.COMPLETIONS)).forEach(function (row) {
    if (!asBoolean_(row.completed)) return;
    const date = normalizeDate_(row.date);
    if (!completions[date]) completions[date] = [];
    completions[date].push(String(row.habitId));
  });
  const journal = rowsAsObjects_(getSheet_(SHEETS.JOURNAL)).map(function (row) {
    return { id: String(row.id), date: normalizeDate_(row.date), mood: String(row.mood), energy: Number(row.energy || 3), text: String(row.text || ""), advanced: String(row.advanced || ""), blocked: String(row.blocked || ""), learned: String(row.learned || ""), next: String(row.next || "") };
  });
  const settings = {};
  rowsAsObjects_(getSheet_(SHEETS.SETTINGS)).forEach(function (row) { settings[row.key] = row.value; });
  return {
    profile: { name: settings.name || "Solo Leveling Akenoo", motto: settings.motto || "Arise." },
    habits: habits,
    completions: completions,
    journal: journal
  };
}

function toggleCompletion_(payload) {
  requireFields_(payload, ["date", "habitId"]);
  const sheet = getSheet_(SHEETS.COMPLETIONS);
  const values = sheet.getDataRange().getValues();
  let rowNumber = -1;
  for (let index = 1; index < values.length; index += 1) {
    if (normalizeDate_(values[index][0]) === payload.date && String(values[index][1]) === String(payload.habitId)) {
      rowNumber = index + 1;
      break;
    }
  }
  const row = [payload.date, payload.habitId, Boolean(payload.completed), new Date().toISOString()];
  if (rowNumber > 0) sheet.getRange(rowNumber, 1, 1, row.length).setValues([row]);
  else sheet.appendRow(row);
  return { saved: true };
}

function addHabit_(payload) {
  requireFields_(payload, ["id", "name", "area", "target"]);
  getSheet_(SHEETS.HABITS).appendRow([payload.id, payload.name, payload.area, Number(payload.target), payload.priority || "media", true, Boolean(payload.requiredForStreak), payload.description || "", new Date().toISOString()]);
  return { saved: true };
}

function addJournal_(payload) {
  requireFields_(payload, ["id", "date", "mood"]);
  getSheet_(SHEETS.JOURNAL).appendRow([payload.id, payload.date, payload.mood, Number(payload.energy || 3), payload.text || "", payload.advanced || "", payload.blocked || "", payload.learned || "", payload.next || "", new Date().toISOString()]);
  return { saved: true };
}

function saveProfile_(payload) {
  requireFields_(payload, ["name", "motto"]);
  const sheet = getSheet_(SHEETS.SETTINGS);
  const values = sheet.getDataRange().getValues();
  const updates = { name: payload.name, motto: payload.motto };
  Object.keys(updates).forEach(function (key) {
    let rowNumber = -1;
    for (let index = 1; index < values.length; index += 1) if (String(values[index][0]) === key) rowNumber = index + 1;
    if (rowNumber > 0) sheet.getRange(rowNumber, 2).setValue(updates[key]);
    else sheet.appendRow([key, updates[key]]);
  });
  return { saved: true };
}

function ensureSheet_(name, headers) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(name);
  if (!sheet) sheet = spreadsheet.insertSheet(name);
  if (sheet.getLastRow() === 0) sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.setFrozenRows(1);
  return sheet;
}

function styleSheets_() {
  Object.keys(SHEETS).forEach(function (key) {
    const sheet = getSheet_(SHEETS[key]);
    const columns = Math.max(1, sheet.getLastColumn());
    sheet.getRange(1, 1, 1, columns).setBackground("#111519").setFontColor("#35d4df").setFontWeight("bold");
    sheet.autoResizeColumns(1, columns);
    sheet.setHiddenGridlines(true);
  });
}

function rowsAsObjects_(sheet) {
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0].map(String);
  return values.slice(1).filter(function (row) { return row.some(function (cell) { return cell !== ""; }); }).map(function (row) {
    const object = {};
    headers.forEach(function (header, index) { object[header] = row[index]; });
    return object;
  });
}

function getConfig_() {
  const properties = PropertiesService.getScriptProperties();
  return { sheetId: properties.getProperty("FORGE_SHEET_ID"), token: properties.getProperty("FORGE_TOKEN") };
}

function getSheet_(name) {
  const config = getConfig_();
  const spreadsheet = config.sheetId ? SpreadsheetApp.openById(config.sheetId) : SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(name);
  if (!sheet) throw new Error("Falta la pestaña " + name + ". Ejecuta setupForge.");
  return sheet;
}

function normalizeDate_(value) {
  if (value instanceof Date) return Utilities.formatDate(value, Session.getScriptTimeZone(), "yyyy-MM-dd");
  return String(value).slice(0, 10);
}

function asBoolean_(value) {
  return value === true || String(value).toLowerCase() === "true" || value === 1;
}

function requireFields_(object, fields) {
  fields.forEach(function (field) { if (object[field] === undefined || object[field] === null || object[field] === "") throw new Error("Falta el campo " + field + "."); });
}

function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
