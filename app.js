const monthData = [
  [2026, 4], [2026, 5], [2026, 6], [2026, 7], [2026, 8], [2026, 9], [2026, 10], [2026, 11],
  [2027, 0], [2027, 1], [2027, 2], [2027, 3], [2027, 4], [2027, 5],
];

const colors = ["#d4e8e6", "#eee4d2", "#c5cfbd", "#ddd1df", "#eee4d2", "#b7c4ab", "#d8bed3", "#ebc5b1", "#dec7cf", "#d4e8e6"];
const stickyColors = ["#fff4c8", "#eaf1dd", "#eee2f0", "#e1f2f0", "#f5ded1"];
const stickerTypes = {
  etr: { label: "ETR", color: "#d8bed3" },
  "504": { label: "504", color: "#d4e8e6" },
  iep: { label: "IEP", color: "#c5cfbd" },
  eval: { label: "Eval", color: "#eee4d2" },
  "re-eval": { label: "Re-Eval", color: "#dec7cf" },
  consult: { label: "Consult", color: "#e1f2f0" },
  parent: { label: "Parent Call", color: "#f5ded1" },
  testing: { label: "Testing", color: "#eaf1dd" },
  report: { label: "Report Due", color: "#fff4c8" },
  deadline: { label: "Deadline", color: "#ebc5b1" },
  "no-school": { label: "No School", color: "#eee2f0" },
  conference: { label: "Conference", color: "#d7e3cc" },
};
const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const fullWeekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const state = {
  monthIndex: 0,
  dayIndex: 0,
  tool: "pen",
  inputMode: "write",
  color: "#3a3434",
  highlighterColor: "#f6dd7a",
  size: 3,
  activeSurface: "month",
  drawing: false,
  drawingPointerId: null,
  panPointerId: null,
  panPoint: null,
  panFrame: null,
  panDistance: 0,
  lastPointerEventAt: 0,
  touchFallbackActive: false,
  currentStroke: null,
  monthStrokes: [],
  dayStrokes: [],
  monthNotes: [],
  dayNotes: [],
  monthStickers: [],
  dayStickers: [],
};

const els = {
  monthTabs: document.querySelector("#monthTabs"),
  monthTitle: document.querySelector("#monthTitle"),
  calendarHeading: document.querySelector("#calendarHeading"),
  calendarGrid: document.querySelector("#calendarGrid"),
  weekGrid: document.querySelector("#weekGrid"),
  weekHeading: document.querySelector("#weekHeading"),
  weekSelect: document.querySelector("#weekSelect"),
  prevWeek: document.querySelector("#prevWeek"),
  nextWeek: document.querySelector("#nextWeek"),
  quickWriteModeButton: document.querySelector("#quickWriteModeButton"),
  quickMoveModeButton: document.querySelector("#quickMoveModeButton"),
  quickPenTool: document.querySelector("#quickPenTool"),
  quickHighlighterTool: document.querySelector("#quickHighlighterTool"),
  quickEraserTool: document.querySelector("#quickEraserTool"),
  addStickyButton: document.querySelector("#addStickyButton"),
  stickerSelect: document.querySelector("#stickerSelect"),
  addStickerButton: document.querySelector("#addStickerButton"),
  pencilOnlyInput: document.querySelector("#pencilOnlyInput"),
  todayButton: document.querySelector("#todayButton"),
  exportButton: document.querySelector("#exportButton"),
  importButton: document.querySelector("#importButton"),
  importInput: document.querySelector("#importInput"),
  backupReminder: document.querySelector("#backupReminder"),
  backupNowButton: document.querySelector("#backupNowButton"),
  undoButton: document.querySelector("#undoButton"),
  clearButton: document.querySelector("#clearButton"),
  quickColorInput: document.querySelector("#quickColorInput"),
  quickSizeInput: document.querySelector("#quickSizeInput"),
  quickZoomOutButton: document.querySelector("#quickZoomOutButton"),
  quickZoomResetButton: document.querySelector("#quickZoomResetButton"),
  quickZoomInButton: document.querySelector("#quickZoomInButton"),
  monthCanvas: document.querySelector("#monthCanvas"),
  weekCanvas: document.querySelector("#weekCanvas"),
  monthSurface: document.querySelector('[data-surface="month"]'),
  weekSurface: document.querySelector('[data-surface="week"]'),
  monthStickyLayer: document.querySelector("#monthStickyLayer"),
  weekStickyLayer: document.querySelector("#weekStickyLayer"),
  monthStickerLayer: document.querySelector("#monthStickerLayer"),
  weekStickerLayer: document.querySelector("#weekStickerLayer"),
};

function startOfWeek(date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function keyMonth() {
  const [year, month] = monthData[state.monthIndex];
  return `planner:month:${year}-${String(month + 1).padStart(2, "0")}`;
}

function keyMonthNotes() {
  return `${keyMonth()}:notes`;
}

function keyMonthStickers() {
  return `${keyMonth()}:stickers`;
}

function daysForMonth(year, month) {
  const days = [];
  const last = new Date(year, month + 1, 0).getDate();
  for (let day = 1; day <= last; day++) {
    const date = new Date(year, month, day);
    const weekday = date.getDay();
    if (weekday !== 0 && weekday !== 6) days.push(date);
  }
  return days;
}

function keyDay() {
  const day = currentDays()[state.dayIndex];
  return `planner:day:${day.toISOString().slice(0, 10)}`;
}

function keyDayNotes() {
  return `${keyDay()}:notes`;
}

function keyDayStickers() {
  return `${keyDay()}:stickers`;
}

function keyForMonth(year, month) {
  return `planner:month:${year}-${String(month + 1).padStart(2, "0")}`;
}

function keyForDay(day) {
  return `planner:day:${day.toISOString().slice(0, 10)}`;
}

function currentDays() {
  const [year, month] = monthData[state.monthIndex];
  return daysForMonth(year, month);
}

function readStrokes(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

function writeStrokes(key, strokes) {
  localStorage.setItem(key, JSON.stringify(strokes));
}

function readNotes(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

function writeNotes(key, notes) {
  localStorage.setItem(key, JSON.stringify(notes));
}

function readStickers(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

function writeStickers(key, stickers) {
  localStorage.setItem(key, JSON.stringify(stickers));
}

function plannerHasSavedWork() {
  for (let index = 0; index < localStorage.length; index++) {
    const key = localStorage.key(index);
    if (!key || (!key.startsWith("planner:month:") && !key.startsWith("planner:day:"))) continue;
    const value = localStorage.getItem(key);
    if (value && value !== "[]") return true;
  }
  return false;
}

function updateBackupReminder() {
  const lastBackup = Number(localStorage.getItem("planner:lastBackupAt") || "0");
  const fourteenDays = 14 * 24 * 60 * 60 * 1000;
  els.backupReminder.hidden = !plannerHasSavedWork() || Date.now() - lastBackup < fourteenDays;
}

function formatDay(date) {
  return `${monthNames[date.getMonth()].slice(0, 3)} ${date.getDate()}`;
}

function formatDailyLabel(date) {
  return `${dayNames[(date.getDay() + 6) % 7]}, ${formatDay(date)}`;
}

function readZoom() {
  const saved = Number(localStorage.getItem("planner:zoom") || "1");
  return Number.isFinite(saved) ? Math.min(1.8, Math.max(0.8, saved)) : 1;
}

function applyZoom(value) {
  const zoom = Math.min(1.8, Math.max(0.8, Number(value.toFixed(2))));
  document.documentElement.style.setProperty("--planner-zoom", zoom);
  els.quickZoomResetButton.textContent = `${Math.round(zoom * 100)}%`;
  localStorage.setItem("planner:zoom", String(zoom));
  requestAnimationFrame(redraw);
}

function changeZoom(step) {
  applyZoom(readZoom() + step);
}

function setActiveSurface(surface) {
  state.activeSurface = surface;
  els.monthSurface.classList.toggle("active-surface", surface === "month");
  els.weekSurface.classList.toggle("active-surface", surface === "week");
}

function updateActiveSurfaceFromView() {
  if (state.drawing || state.panPoint) return;
  const focusY = window.innerHeight * 0.55;
  const monthRect = els.monthSurface.getBoundingClientRect();
  const weekRect = els.weekSurface.getBoundingClientRect();
  const distance = (rect) => Math.abs(rect.top + rect.height / 2 - focusY);
  setActiveSurface(distance(weekRect) < distance(monthRect) ? "week" : "month");
}

function academicMonthIndexForDate(date) {
  return monthData.findIndex(([year, month]) => year === date.getFullYear() && month === date.getMonth());
}

function setPlannerDate(date) {
  const monthIndex = academicMonthIndexForDate(date);
  if (monthIndex === -1) return false;
  state.monthIndex = monthIndex;
  const days = currentDays();
  const exactDay = days.findIndex((day) => day.getDate() === date.getDate());
  const nextSchoolDay = days.findIndex((day) => day.getDate() > date.getDate());
  state.dayIndex = exactDay >= 0 ? exactDay : nextSchoolDay >= 0 ? nextSchoolDay : days.length - 1;
  return true;
}

function goToDate(date) {
  if (academicMonthIndexForDate(date) === -1) return false;
  saveCurrent();
  setPlannerDate(date);
  loadCurrent();
  renderAll();
  return true;
}

function renderTabs() {
  els.monthTabs.innerHTML = "";
  monthData.forEach(([year, month], index) => {
    const button = document.createElement("button");
    button.className = `month-tab${index === state.monthIndex ? " active" : ""}`;
    button.style.background = colors[index % colors.length];
    button.textContent = monthNames[month].slice(0, 3).toUpperCase();
    button.addEventListener("click", () => {
      saveCurrent();
      state.monthIndex = index;
      state.dayIndex = 0;
      loadCurrent();
      renderAll();
    });
    els.monthTabs.append(button);
  });
}

function renderCalendar() {
  const [year, month] = monthData[state.monthIndex];
  els.monthTitle.textContent = `${monthNames[month]} ${year}`;
  els.calendarHeading.textContent = `${monthNames[month]} ${year}`;
  els.calendarGrid.innerHTML = "";

  fullWeekDays.forEach((day) => {
    const cell = document.createElement("div");
    cell.className = "calendar-cell calendar-head";
    cell.textContent = day;
    els.calendarGrid.append(cell);
  });

  const first = new Date(year, month, 1);
  let cursor = startOfWeek(first);
  for (let i = 0; i < 42; i++) {
    const cell = document.createElement("div");
    cell.className = `calendar-cell${cursor.getMonth() !== month ? " other-month" : ""}`;
    cell.innerHTML = `<span class="day-number">${cursor.getDate()}</span><div class="guide-lines"></div>`;
    els.calendarGrid.append(cell);
    cursor = addDays(cursor, 1);
  }
}

function renderWeekControls() {
  const days = currentDays();
  els.weekSelect.innerHTML = "";
  days.forEach((day, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = formatDailyLabel(day);
    els.weekSelect.append(option);
  });
  els.weekSelect.value = String(state.dayIndex);
  const day = days[state.dayIndex];
  els.weekHeading.textContent = `Daily Focus: ${formatDailyLabel(day)}`;
}

function renderWeekGrid() {
  const day = currentDays()[state.dayIndex];
  els.weekGrid.innerHTML = "";
  const focus = document.createElement("div");
  focus.className = "daily-todos";
  focus.innerHTML = `<header><strong>${formatDailyLabel(day)}</strong><small>To-Dos</small></header><div class="week-lines"></div>`;
  els.weekGrid.append(focus);
}

function resizeCanvas(canvas) {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const scale = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const ctx = canvas.getContext("2d");
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
}

function drawStroke(ctx, stroke) {
  if (stroke.points.length < 2) return;
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.globalCompositeOperation = stroke.tool === "eraser" ? "destination-out" : "source-over";
  ctx.globalAlpha = stroke.tool === "highlighter" ? 0.34 : 1;
  ctx.strokeStyle = stroke.color;
  ctx.lineWidth = stroke.size;
  ctx.beginPath();
  ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
  for (let i = 1; i < stroke.points.length; i++) {
    const prev = stroke.points[i - 1];
    const point = stroke.points[i];
    ctx.quadraticCurveTo(prev.x, prev.y, (prev.x + point.x) / 2, (prev.y + point.y) / 2);
  }
  ctx.stroke();
  ctx.restore();
}

function redrawCanvas(canvas, strokes) {
  resizeCanvas(canvas);
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
  strokes.forEach((stroke) => drawStroke(ctx, stroke));
}

function redraw() {
  redrawCanvas(els.monthCanvas, state.monthStrokes);
  redrawCanvas(els.weekCanvas, state.dayStrokes);
}

function loadCurrent() {
  state.monthStrokes = readStrokes(keyMonth());
  state.dayStrokes = readStrokes(keyDay());
  state.monthNotes = readNotes(keyMonthNotes());
  state.dayNotes = readNotes(keyDayNotes());
  state.monthStickers = readStickers(keyMonthStickers());
  state.dayStickers = readStickers(keyDayStickers());
}

function saveCurrent() {
  writeStrokes(keyMonth(), state.monthStrokes);
  writeStrokes(keyDay(), state.dayStrokes);
  writeNotes(keyMonthNotes(), state.monthNotes);
  writeNotes(keyDayNotes(), state.dayNotes);
  writeStickers(keyMonthStickers(), state.monthStickers);
  writeStickers(keyDayStickers(), state.dayStickers);
  updateBackupReminder();
}

function collectPlannerBackup() {
  saveCurrent();
  const data = {
    app: "school-psychology-planner",
    version: 1,
    exportedAt: new Date().toISOString(),
    months: {},
    days: {},
  };

  monthData.forEach(([year, month]) => {
    const monthKey = keyForMonth(year, month);
    data.months[monthKey] = {
      strokes: readStrokes(monthKey),
      notes: readNotes(`${monthKey}:notes`),
      stickers: readStickers(`${monthKey}:stickers`),
    };
    daysForMonth(year, month).forEach((day) => {
      const dayKey = keyForDay(day);
      data.days[dayKey] = {
        strokes: readStrokes(dayKey),
        notes: readNotes(`${dayKey}:notes`),
        stickers: readStickers(`${dayKey}:stickers`),
      };
    });
  });

  return data;
}

function exportBackup() {
  const data = collectPlannerBackup();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  const today = new Date().toISOString().slice(0, 10);
  link.href = URL.createObjectURL(blob);
  link.download = `school-psychology-planner-backup-${today}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
  localStorage.setItem("planner:lastBackupAt", String(Date.now()));
  updateBackupReminder();
}

function restoreBackup(data) {
  if (!data || data.app !== "school-psychology-planner" || !data.months || (!data.days && !data.weeks)) {
    alert("This does not look like a planner backup file.");
    return;
  }

  Object.entries(data.months).forEach(([key, value]) => {
    writeStrokes(key, Array.isArray(value.strokes) ? value.strokes : []);
    writeNotes(`${key}:notes`, Array.isArray(value.notes) ? value.notes : []);
    writeStickers(`${key}:stickers`, Array.isArray(value.stickers) ? value.stickers : []);
  });
  Object.entries(data.days || {}).forEach(([key, value]) => {
    writeStrokes(key, Array.isArray(value.strokes) ? value.strokes : []);
    writeNotes(`${key}:notes`, Array.isArray(value.notes) ? value.notes : []);
    writeStickers(`${key}:stickers`, Array.isArray(value.stickers) ? value.stickers : []);
  });
  loadCurrent();
  renderAll();
  alert("Planner backup restored.");
}

function importBackupFile(file) {
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      restoreBackup(JSON.parse(String(reader.result || "")));
    } catch {
      alert("I could not read that backup file.");
    }
  });
  reader.readAsText(file);
}

function renderAll() {
  renderTabs();
  renderCalendar();
  renderWeekControls();
  renderWeekGrid();
  renderNotes();
  renderStickers();
  requestAnimationFrame(redraw);
}

function surfaceForCanvas(canvas) {
  return canvas === els.monthCanvas ? "month" : "week";
}

function strokesForSurface(surface) {
  return surface === "month" ? state.monthStrokes : state.dayStrokes;
}

function setStrokesForSurface(surface, strokes) {
  if (surface === "month") state.monthStrokes = strokes;
  else state.dayStrokes = strokes;
}

function notesForSurface(surface) {
  return surface === "month" ? state.monthNotes : state.dayNotes;
}

function setNotesForSurface(surface, notes) {
  if (surface === "month") state.monthNotes = notes;
  else state.dayNotes = notes;
}

function layerForSurface(surface) {
  return surface === "month" ? els.monthStickyLayer : els.weekStickyLayer;
}

function stickerLayerForSurface(surface) {
  return surface === "month" ? els.monthStickerLayer : els.weekStickerLayer;
}

function stickersForSurface(surface) {
  return surface === "month" ? state.monthStickers : state.dayStickers;
}

function setStickersForSurface(surface, stickers) {
  if (surface === "month") state.monthStickers = stickers;
  else state.dayStickers = stickers;
}

function canvasPoint(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  const widthRatio = rect.width ? canvas.clientWidth / rect.width : 1;
  const heightRatio = rect.height ? canvas.clientHeight / rect.height : 1;
  return {
    x: (event.clientX - rect.left) * widthRatio,
    y: (event.clientY - rect.top) * heightRatio,
  };
}

function shouldDrawFromInput(event) {
  if (state.inputMode !== "write") return false;
  if (!els.pencilOnlyInput.checked) return true;
  return event.pointerType === "pen" || event.touchType === "stylus";
}

function shouldDrawFromTouch(touch) {
  if (state.inputMode !== "write") return false;
  if (!els.pencilOnlyInput.checked) return true;
  return touch?.touchType === "stylus";
}

function beginFingerPan(canvas, event) {
  if (state.inputMode !== "move" || !els.pencilOnlyInput.checked || event.pointerType !== "touch") return false;
  event.preventDefault();
  state.panPointerId = event.pointerId ?? null;
  state.panPoint = { x: event.clientX, y: event.clientY };
  return true;
}

function cancelFingerPan() {
  state.panPointerId = null;
  state.panPoint = null;
  state.panDistance = 0;
  if (state.panFrame) {
    cancelAnimationFrame(state.panFrame);
    state.panFrame = null;
  }
}

function moveFingerPan(event) {
  if (!state.panPoint) return false;
  if (state.panPointerId !== null && event.pointerId !== undefined && event.pointerId !== state.panPointerId) return false;
  event.preventDefault();
  const dy = state.panPoint.y - event.clientY;
  state.panPoint = { x: event.clientX, y: event.clientY };
  state.panDistance += dy;
  if (!state.panFrame) {
    state.panFrame = requestAnimationFrame(() => {
      window.scrollBy(0, state.panDistance);
      state.panDistance = 0;
      state.panFrame = null;
    });
  }
  return true;
}

function endFingerPan(event) {
  if (!state.panPoint) return false;
  if (state.panPointerId !== null && event.pointerId !== undefined && event.pointerId !== state.panPointerId) return false;
  event.preventDefault();
  cancelFingerPan();
  requestAnimationFrame(updateActiveSurfaceFromView);
  return true;
}

function beginDraw(canvas, event) {
  if (!shouldDrawFromInput(event)) return;
  event.preventDefault?.();
  state.lastPointerEventAt = Date.now();
  const surface = surfaceForCanvas(canvas);
  setActiveSurface(surface);
  state.drawing = true;
  state.drawingPointerId = event.pointerId ?? null;
  if (event.pointerId !== undefined && canvas.setPointerCapture) {
    canvas.setPointerCapture(event.pointerId);
  }
  const isHighlighter = state.tool === "highlighter";
  state.currentStroke = {
    tool: state.tool,
    color: isHighlighter ? state.highlighterColor : state.color,
    size: state.tool === "eraser" ? state.size * 5 : isHighlighter ? Math.max(10, state.size * 3) : state.size,
    points: [canvasPoint(canvas, event)],
  };
}

function moveDraw(canvas, event) {
  if (!state.drawing || !state.currentStroke) return;
  if (state.drawingPointerId !== null && event.pointerId !== undefined && event.pointerId !== state.drawingPointerId) return;
  event.preventDefault?.();
  state.lastPointerEventAt = Date.now();
  state.currentStroke.points.push(canvasPoint(canvas, event));
  const surface = surfaceForCanvas(canvas);
  redrawCanvas(canvas, strokesForSurface(surface));
  const ctx = canvas.getContext("2d");
  drawStroke(ctx, state.currentStroke);
}

function endDraw(canvas, event) {
  if (!state.drawing || !state.currentStroke) return;
  if (state.drawingPointerId !== null && event.pointerId !== undefined && event.pointerId !== state.drawingPointerId) return;
  event.preventDefault?.();
  state.lastPointerEventAt = Date.now();
  const surface = surfaceForCanvas(canvas);
  const strokes = strokesForSurface(surface);
  strokes.push(state.currentStroke);
  setStrokesForSurface(surface, strokes);
  state.currentStroke = null;
  state.drawing = false;
  state.drawingPointerId = null;
  state.touchFallbackActive = false;
  saveCurrent();
  redraw();
}

function attachDrawing(canvas) {
  const activeTouch = { id: null };
  const touchOptions = { passive: false };

  canvas.addEventListener("pointerdown", (event) => {
    if (!beginFingerPan(canvas, event)) beginDraw(canvas, event);
  });
  canvas.addEventListener("pointermove", (event) => {
    if (!moveFingerPan(event)) moveDraw(canvas, event);
  });
  canvas.addEventListener("pointerrawupdate", (event) => moveDraw(canvas, event));
  canvas.addEventListener("pointerup", (event) => {
    if (!endFingerPan(event)) endDraw(canvas, event);
  });
  canvas.addEventListener("pointercancel", (event) => {
    if (!endFingerPan(event)) endDraw(canvas, event);
  });

  canvas.addEventListener("touchstart", (event) => {
    if (Date.now() - state.lastPointerEventAt < 250) return;
    const touch = event.changedTouches[0];
    if (!shouldDrawFromTouch(touch)) return;
    event.preventDefault();
    cancelFingerPan();
    activeTouch.id = touch.identifier;
    state.touchFallbackActive = true;
    beginDraw(canvas, touch);
  }, touchOptions);

  canvas.addEventListener("touchmove", (event) => {
    if (!state.touchFallbackActive) return;
    const touch = [...event.changedTouches].find((item) => item.identifier === activeTouch.id);
    if (!shouldDrawFromTouch(touch)) return;
    event.preventDefault();
    moveDraw(canvas, touch);
  }, touchOptions);

  canvas.addEventListener("touchend", (event) => {
    if (!state.touchFallbackActive) return;
    const touch = [...event.changedTouches].find((item) => item.identifier === activeTouch.id) || event.changedTouches[0];
    if (shouldDrawFromTouch(touch)) {
      event.preventDefault();
      endDraw(canvas, touch);
    }
    activeTouch.id = null;
  }, touchOptions);

  canvas.addEventListener("touchcancel", (event) => {
    if (!state.touchFallbackActive) return;
    const touch = [...event.changedTouches].find((item) => item.identifier === activeTouch.id) || event.changedTouches[0];
    if (shouldDrawFromTouch(touch)) {
      event.preventDefault();
      endDraw(canvas, touch);
    }
    activeTouch.id = null;
  }, touchOptions);
}

function setTool(tool) {
  state.tool = tool;
  els.quickPenTool.classList.toggle("active", tool === "pen");
  els.quickHighlighterTool.classList.toggle("active", tool === "highlighter");
  els.quickEraserTool.classList.toggle("active", tool === "eraser");
  els.quickPenTool.setAttribute("aria-pressed", String(tool === "pen"));
  els.quickHighlighterTool.setAttribute("aria-pressed", String(tool === "highlighter"));
  els.quickEraserTool.setAttribute("aria-pressed", String(tool === "eraser"));
  syncToolControls();
}

function selectedWritingColor() {
  return state.tool === "highlighter" ? state.highlighterColor : state.color;
}

function syncToolControls() {
  const color = selectedWritingColor();
  els.quickColorInput.value = color;
  els.quickSizeInput.value = String(state.size);
}

function setWritingColor(color) {
  if (state.tool === "highlighter") state.highlighterColor = color;
  else {
    state.color = color;
    if (state.tool === "eraser") setTool("pen");
  }
  syncToolControls();
}

function setWritingSize(size) {
  state.size = Number(size);
  syncToolControls();
}

function setInputMode(mode) {
  state.inputMode = mode;
  cancelFingerPan();
  els.quickWriteModeButton.classList.toggle("active", mode === "write");
  els.quickMoveModeButton.classList.toggle("active", mode === "move");
  els.quickWriteModeButton.setAttribute("aria-pressed", String(mode === "write"));
  els.quickMoveModeButton.setAttribute("aria-pressed", String(mode === "move"));
  updateInputMode();
}

function updateInputMode() {
  const action = state.inputMode === "move" ? "pan-x pan-y" : "none";
  els.monthCanvas.style.touchAction = action;
  els.weekCanvas.style.touchAction = action;
}

function renderNotes() {
  renderNotesForSurface("month");
  renderNotesForSurface("week");
}

function renderNotesForSurface(surface) {
  const layer = layerForSurface(surface);
  layer.innerHTML = "";
  notesForSurface(surface).forEach((note) => {
    const element = document.createElement("div");
    element.className = "sticky-note";
    element.style.left = `${note.x}px`;
    element.style.top = `${note.y}px`;
    element.style.width = `${note.w}px`;
    element.style.height = `${note.h}px`;
    element.style.background = note.color;
    element.dataset.id = note.id;
    element.innerHTML = `
      <div class="sticky-bar">
        <span class="sticky-dots">•••</span>
        <button class="sticky-delete" aria-label="Delete post-it">×</button>
      </div>
      <textarea aria-label="Post-it text" placeholder="Type here..."></textarea>
      <span class="sticky-resize" aria-hidden="true"></span>
    `;

    const textarea = element.querySelector("textarea");
    const bar = element.querySelector(".sticky-bar");
    const deleteButton = element.querySelector(".sticky-delete");
    const resizeHandle = element.querySelector(".sticky-resize");
    textarea.value = note.text || "";
    textarea.addEventListener("input", () => {
      updateNote(surface, note.id, { text: textarea.value });
    });
    textarea.addEventListener("focus", () => {
      setActiveSurface(surface);
    });
    deleteButton.addEventListener("click", () => {
      setNotesForSurface(surface, notesForSurface(surface).filter((item) => item.id !== note.id));
      saveCurrent();
      renderNotesForSurface(surface);
    });
    attachStickyDrag(surface, element, bar);
    attachStickyResize(surface, element, resizeHandle);
    new ResizeObserver(() => {
      updateNote(surface, note.id, { w: element.offsetWidth, h: element.offsetHeight });
    }).observe(element);
    layer.append(element);
  });
}

function updateNote(surface, id, patch, shouldSave = true) {
  const notes = notesForSurface(surface).map((note) => (note.id === id ? { ...note, ...patch } : note));
  setNotesForSurface(surface, notes);
  if (shouldSave) saveCurrent();
}

function attachStickyDrag(surface, element, handle) {
  let drag = null;
  handle.addEventListener("pointerdown", (event) => {
    setActiveSurface(surface);
    drag = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originalX: parseFloat(element.style.left || "0"),
      originalY: parseFloat(element.style.top || "0"),
    };
    element.classList.add("dragging");
    handle.setPointerCapture(event.pointerId);
  });
  handle.addEventListener("pointermove", (event) => {
    if (!drag) return;
    const layer = layerForSurface(surface);
    const maxX = Math.max(0, layer.clientWidth - element.offsetWidth);
    const maxY = Math.max(0, layer.clientHeight - element.offsetHeight);
    const x = Math.min(maxX, Math.max(0, drag.originalX + event.clientX - drag.startX));
    const y = Math.min(maxY, Math.max(0, drag.originalY + event.clientY - drag.startY));
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
  });
  handle.addEventListener("pointerup", () => {
    if (!drag) return;
    updateNote(surface, element.dataset.id, {
      x: parseFloat(element.style.left || "0"),
      y: parseFloat(element.style.top || "0"),
      w: element.offsetWidth,
      h: element.offsetHeight,
    });
    element.classList.remove("dragging");
    drag = null;
  });
}

function attachStickyResize(surface, element, handle) {
  let resize = null;
  handle.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    setActiveSurface(surface);
    resize = {
      startX: event.clientX,
      startY: event.clientY,
      originalW: element.offsetWidth,
      originalH: element.offsetHeight,
    };
    handle.setPointerCapture(event.pointerId);
  });
  handle.addEventListener("pointermove", (event) => {
    if (!resize) return;
    event.preventDefault();
    const layer = layerForSurface(surface);
    const x = parseFloat(element.style.left || "0");
    const y = parseFloat(element.style.top || "0");
    const maxW = Math.max(118, layer.clientWidth - x);
    const maxH = Math.max(88, layer.clientHeight - y);
    const w = Math.min(maxW, Math.max(118, resize.originalW + event.clientX - resize.startX));
    const h = Math.min(maxH, Math.max(88, resize.originalH + event.clientY - resize.startY));
    element.style.width = `${w}px`;
    element.style.height = `${h}px`;
  });
  handle.addEventListener("pointerup", () => {
    if (!resize) return;
    updateNote(surface, element.dataset.id, {
      w: element.offsetWidth,
      h: element.offsetHeight,
    });
    resize = null;
  });
}

function renderStickers() {
  renderStickersForSurface("month");
  renderStickersForSurface("week");
}

function renderStickersForSurface(surface) {
  const layer = stickerLayerForSurface(surface);
  layer.innerHTML = "";
  stickersForSurface(surface).forEach((sticker) => {
    const config = stickerTypes[sticker.type] || { label: sticker.label || "Event", color: "#eee4d2" };
    const element = document.createElement("div");
    element.className = "calendar-sticker";
    element.style.left = `${sticker.x}px`;
    element.style.top = `${sticker.y}px`;
    element.style.width = `${sticker.w}px`;
    element.style.height = `${sticker.h}px`;
    element.style.background = sticker.color || config.color;
    element.dataset.id = sticker.id;
    element.innerHTML = `
      <span class="sticker-label">${config.label}</span>
      <button class="sticker-delete" aria-label="Delete sticker">×</button>
    `;
    const deleteButton = element.querySelector(".sticker-delete");
    deleteButton.addEventListener("click", (event) => {
      event.stopPropagation();
      setStickersForSurface(surface, stickersForSurface(surface).filter((item) => item.id !== sticker.id));
      saveCurrent();
      renderStickersForSurface(surface);
    });
    attachStickerDrag(surface, element);
    attachStickerResize(surface, element);
    layer.append(element);
  });
}

function updateSticker(surface, id, patch) {
  const stickers = stickersForSurface(surface).map((sticker) =>
    sticker.id === id ? { ...sticker, ...patch } : sticker
  );
  setStickersForSurface(surface, stickers);
  saveCurrent();
}

function attachStickerDrag(surface, element) {
  let drag = null;
  element.addEventListener("pointerdown", (event) => {
    if (event.target.closest(".sticker-delete")) return;
    setActiveSurface(surface);
    drag = {
      startX: event.clientX,
      startY: event.clientY,
      originalX: parseFloat(element.style.left || "0"),
      originalY: parseFloat(element.style.top || "0"),
    };
    element.classList.add("dragging");
    element.setPointerCapture(event.pointerId);
  });
  element.addEventListener("pointermove", (event) => {
    if (!drag) return;
    const layer = stickerLayerForSurface(surface);
    const maxX = Math.max(0, layer.clientWidth - element.offsetWidth);
    const maxY = Math.max(0, layer.clientHeight - element.offsetHeight);
    const x = Math.min(maxX, Math.max(0, drag.originalX + event.clientX - drag.startX));
    const y = Math.min(maxY, Math.max(0, drag.originalY + event.clientY - drag.startY));
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
  });
  element.addEventListener("pointerup", () => {
    if (!drag) return;
    updateSticker(surface, element.dataset.id, {
      x: parseFloat(element.style.left || "0"),
      y: parseFloat(element.style.top || "0"),
      w: element.offsetWidth,
      h: element.offsetHeight,
    });
    element.classList.remove("dragging");
    drag = null;
  });
}

function attachStickerResize(surface, element) {
  new ResizeObserver(() => {
    updateSticker(surface, element.dataset.id, {
      w: element.offsetWidth,
      h: element.offsetHeight,
    });
  }).observe(element);
}

function addSticker() {
  const surface = state.activeSurface;
  const layer = stickerLayerForSurface(surface);
  const existing = stickersForSurface(surface);
  const type = els.stickerSelect.value;
  const config = stickerTypes[type];
  const offset = (existing.length % 5) * 14;
  const stickerWidth = Math.max(62, Math.min(112, 34 + config.label.length * 7));
  const sticker = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type,
    x: Math.min(28 + offset, Math.max(0, layer.clientWidth - stickerWidth - 8)),
    y: Math.min(28 + offset, Math.max(0, layer.clientHeight - 32)),
    w: stickerWidth,
    h: 22,
    color: config.color,
  };
  setStickersForSurface(surface, [...existing, sticker]);
  saveCurrent();
  renderStickersForSurface(surface);
}

function addSticky() {
  const surface = state.activeSurface;
  const layer = layerForSurface(surface);
  const existing = notesForSurface(surface);
  const offset = (existing.length % 4) * 18;
  const note = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    x: Math.min(40 + offset, Math.max(0, layer.clientWidth - 170)),
    y: Math.min(40 + offset, Math.max(0, layer.clientHeight - 130)),
    w: 160,
    h: 118,
    color: stickyColors[existing.length % stickyColors.length],
    text: "",
  };
  setNotesForSurface(surface, [...existing, note]);
  saveCurrent();
  renderNotesForSurface(surface);
}

els.weekSelect.addEventListener("change", () => {
  saveCurrent();
  state.dayIndex = Number(els.weekSelect.value);
  state.dayStrokes = readStrokes(keyDay());
  state.dayNotes = readNotes(keyDayNotes());
  state.dayStickers = readStickers(keyDayStickers());
  renderWeekControls();
  renderWeekGrid();
  renderNotesForSurface("week");
  renderStickersForSurface("week");
  requestAnimationFrame(redraw);
});

els.prevWeek.addEventListener("click", () => {
  saveCurrent();
  if (state.dayIndex > 0) state.dayIndex -= 1;
  else if (state.monthIndex > 0) {
    state.monthIndex -= 1;
    state.dayIndex = currentDays().length - 1;
  }
  loadCurrent();
  renderAll();
});

els.nextWeek.addEventListener("click", () => {
  saveCurrent();
  if (state.dayIndex < currentDays().length - 1) state.dayIndex += 1;
  else if (state.monthIndex < monthData.length - 1) {
    state.monthIndex += 1;
    state.dayIndex = 0;
  }
  loadCurrent();
  renderAll();
});

els.quickPenTool.addEventListener("click", () => setTool("pen"));
els.quickHighlighterTool.addEventListener("click", () => setTool("highlighter"));
els.quickEraserTool.addEventListener("click", () => setTool("eraser"));
els.quickWriteModeButton.addEventListener("click", () => setInputMode("write"));
els.quickMoveModeButton.addEventListener("click", () => setInputMode("move"));
els.addStickyButton.addEventListener("click", addSticky);
els.addStickerButton.addEventListener("click", addSticker);
els.pencilOnlyInput.addEventListener("change", updateInputMode);
els.todayButton.addEventListener("click", () => {
  if (!goToDate(new Date())) {
    alert("Today is outside this May 2026 - June 2027 planner.");
  }
});
els.quickZoomOutButton.addEventListener("click", () => changeZoom(-0.1));
els.quickZoomInButton.addEventListener("click", () => changeZoom(0.1));
els.quickZoomResetButton.addEventListener("click", () => applyZoom(1));
els.exportButton.addEventListener("click", exportBackup);
els.backupNowButton.addEventListener("click", exportBackup);
els.importButton.addEventListener("click", () => els.importInput.click());
els.importInput.addEventListener("change", () => {
  const file = els.importInput.files?.[0];
  if (file) importBackupFile(file);
  els.importInput.value = "";
});
els.quickColorInput.addEventListener("input", () => setWritingColor(els.quickColorInput.value));
els.quickSizeInput.addEventListener("input", () => setWritingSize(els.quickSizeInput.value));
els.undoButton.addEventListener("click", () => {
  const surface = state.activeSurface;
  const strokes = strokesForSurface(surface);
  strokes.pop();
  setStrokesForSurface(surface, strokes);
  saveCurrent();
  redraw();
});
els.clearButton.addEventListener("click", () => {
  const surface = state.activeSurface;
  setStrokesForSurface(surface, []);
  setNotesForSurface(surface, []);
  setStickersForSurface(surface, []);
  saveCurrent();
  redraw();
  renderNotesForSurface(surface);
  renderStickersForSurface(surface);
});

window.addEventListener("resize", () => {
  requestAnimationFrame(() => {
    redraw();
    updateActiveSurfaceFromView();
  });
});
window.addEventListener("scroll", () => requestAnimationFrame(updateActiveSurfaceFromView), { passive: true });
window.addEventListener("beforeunload", saveCurrent);

attachDrawing(els.monthCanvas);
attachDrawing(els.weekCanvas);
els.monthSurface.addEventListener("pointerdown", () => setActiveSurface("month"), true);
els.weekSurface.addEventListener("pointerdown", () => setActiveSurface("week"), true);
updateInputMode();
applyZoom(readZoom());
setPlannerDate(new Date());
loadCurrent();
renderAll();
updateActiveSurfaceFromView();
updateBackupReminder();
