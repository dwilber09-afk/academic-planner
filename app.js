const monthData = [
  [2026, 6], [2026, 7], [2026, 8], [2026, 9], [2026, 10], [2026, 11],
  [2027, 0], [2027, 1], [2027, 2], [2027, 3], [2027, 4], [2027, 5],
];

const colors = ["#c5cfbd", "#ddd1df", "#eee4d2", "#b7c4ab", "#d8bed3", "#ebc5b1", "#dec7cf", "#d4e8e6"];
const stickyColors = ["#fff4c8", "#eaf1dd", "#eee2f0", "#e1f2f0", "#f5ded1"];
const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const fullWeekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const state = {
  monthIndex: 0,
  weekIndex: 0,
  tool: "pen",
  color: "#3a3434",
  size: 3,
  activeSurface: "month",
  drawing: false,
  drawingPointerId: null,
  lastPointerEventAt: 0,
  touchFallbackActive: false,
  currentStroke: null,
  monthStrokes: [],
  weekStrokes: [],
  monthNotes: [],
  weekNotes: [],
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
  penTool: document.querySelector("#penTool"),
  highlighterTool: document.querySelector("#highlighterTool"),
  eraserTool: document.querySelector("#eraserTool"),
  addStickyButton: document.querySelector("#addStickyButton"),
  todayButton: document.querySelector("#todayButton"),
  exportButton: document.querySelector("#exportButton"),
  importButton: document.querySelector("#importButton"),
  importInput: document.querySelector("#importInput"),
  undoButton: document.querySelector("#undoButton"),
  clearButton: document.querySelector("#clearButton"),
  colorInput: document.querySelector("#colorInput"),
  sizeInput: document.querySelector("#sizeInput"),
  monthCanvas: document.querySelector("#monthCanvas"),
  weekCanvas: document.querySelector("#weekCanvas"),
  monthStickyLayer: document.querySelector("#monthStickyLayer"),
  weekStickyLayer: document.querySelector("#weekStickyLayer"),
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

function weeksForMonth(year, month) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  let cursor = startOfWeek(first);
  const end = startOfWeek(last);
  const weeks = [];
  while (cursor <= end) {
    weeks.push(new Date(cursor));
    cursor = addDays(cursor, 7);
  }
  return weeks;
}

function keyWeek() {
  const week = currentWeeks()[state.weekIndex];
  return `planner:week:${week.toISOString().slice(0, 10)}`;
}

function keyWeekNotes() {
  return `${keyWeek()}:notes`;
}

function keyForMonth(year, month) {
  return `planner:month:${year}-${String(month + 1).padStart(2, "0")}`;
}

function keyForWeek(week) {
  return `planner:week:${week.toISOString().slice(0, 10)}`;
}

function currentWeeks() {
  const [year, month] = monthData[state.monthIndex];
  return weeksForMonth(year, month);
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

function formatDay(date) {
  return `${monthNames[date.getMonth()].slice(0, 3)} ${date.getDate()}`;
}

function academicMonthIndexForDate(date) {
  return monthData.findIndex(([year, month]) => year === date.getFullYear() && month === date.getMonth());
}

function goToDate(date) {
  const monthIndex = academicMonthIndexForDate(date);
  if (monthIndex === -1) return false;
  saveCurrent();
  state.monthIndex = monthIndex;
  const targetWeek = startOfWeek(date).getTime();
  const weekIndex = currentWeeks().findIndex((week) => week.getTime() === targetWeek);
  state.weekIndex = Math.max(0, weekIndex);
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
      state.weekIndex = 0;
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
  const weeks = currentWeeks();
  els.weekSelect.innerHTML = "";
  weeks.forEach((week, index) => {
    const end = addDays(week, 6);
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = `${formatDay(week)} - ${formatDay(end)}`;
    els.weekSelect.append(option);
  });
  els.weekSelect.value = String(state.weekIndex);
  const week = weeks[state.weekIndex];
  els.weekHeading.textContent = `Week of ${formatDay(week)} - ${formatDay(addDays(week, 6))}`;
}

function renderWeekGrid() {
  const week = currentWeeks()[state.weekIndex];
  els.weekGrid.innerHTML = "";
  for (let i = 0; i < 5; i++) {
    const date = addDays(week, i);
    const day = document.createElement("div");
    day.className = "week-day";
    day.innerHTML = `<header><strong>${dayNames[i].toUpperCase()}</strong><small>${formatDay(date)}</small></header><div class="week-lines"></div>`;
    els.weekGrid.append(day);
  }
}

function resizeCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const scale = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.round(rect.width * scale));
  canvas.height = Math.max(1, Math.round(rect.height * scale));
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
  const rect = canvas.getBoundingClientRect();
  ctx.clearRect(0, 0, rect.width, rect.height);
  strokes.forEach((stroke) => drawStroke(ctx, stroke));
}

function redraw() {
  redrawCanvas(els.monthCanvas, state.monthStrokes);
  redrawCanvas(els.weekCanvas, state.weekStrokes);
}

function loadCurrent() {
  state.monthStrokes = readStrokes(keyMonth());
  state.weekStrokes = readStrokes(keyWeek());
  state.monthNotes = readNotes(keyMonthNotes());
  state.weekNotes = readNotes(keyWeekNotes());
}

function saveCurrent() {
  writeStrokes(keyMonth(), state.monthStrokes);
  writeStrokes(keyWeek(), state.weekStrokes);
  writeNotes(keyMonthNotes(), state.monthNotes);
  writeNotes(keyWeekNotes(), state.weekNotes);
}

function collectPlannerBackup() {
  saveCurrent();
  const data = {
    app: "school-psychology-planner",
    version: 1,
    exportedAt: new Date().toISOString(),
    months: {},
    weeks: {},
  };

  monthData.forEach(([year, month]) => {
    const monthKey = keyForMonth(year, month);
    data.months[monthKey] = {
      strokes: readStrokes(monthKey),
      notes: readNotes(`${monthKey}:notes`),
    };
    weeksForMonth(year, month).forEach((week) => {
      const weekKey = keyForWeek(week);
      data.weeks[weekKey] = {
        strokes: readStrokes(weekKey),
        notes: readNotes(`${weekKey}:notes`),
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
}

function restoreBackup(data) {
  if (!data || data.app !== "school-psychology-planner" || !data.months || !data.weeks) {
    alert("This does not look like a planner backup file.");
    return;
  }

  Object.entries(data.months).forEach(([key, value]) => {
    writeStrokes(key, Array.isArray(value.strokes) ? value.strokes : []);
    writeNotes(`${key}:notes`, Array.isArray(value.notes) ? value.notes : []);
  });
  Object.entries(data.weeks).forEach(([key, value]) => {
    writeStrokes(key, Array.isArray(value.strokes) ? value.strokes : []);
    writeNotes(`${key}:notes`, Array.isArray(value.notes) ? value.notes : []);
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
  requestAnimationFrame(redraw);
}

function surfaceForCanvas(canvas) {
  return canvas === els.monthCanvas ? "month" : "week";
}

function strokesForSurface(surface) {
  return surface === "month" ? state.monthStrokes : state.weekStrokes;
}

function setStrokesForSurface(surface, strokes) {
  if (surface === "month") state.monthStrokes = strokes;
  else state.weekStrokes = strokes;
}

function notesForSurface(surface) {
  return surface === "month" ? state.monthNotes : state.weekNotes;
}

function setNotesForSurface(surface, notes) {
  if (surface === "month") state.monthNotes = notes;
  else state.weekNotes = notes;
}

function layerForSurface(surface) {
  return surface === "month" ? els.monthStickyLayer : els.weekStickyLayer;
}

function canvasPoint(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

function beginDraw(canvas, event) {
  event.preventDefault();
  state.lastPointerEventAt = Date.now();
  const surface = surfaceForCanvas(canvas);
  state.activeSurface = surface;
  state.drawing = true;
  state.drawingPointerId = event.pointerId ?? null;
  if (event.pointerId !== undefined && canvas.setPointerCapture) {
    canvas.setPointerCapture(event.pointerId);
  }
  const isHighlighter = state.tool === "highlighter";
  state.currentStroke = {
    tool: state.tool,
    color: isHighlighter ? "#f6dd7a" : state.color,
    size: state.tool === "eraser" ? state.size * 5 : isHighlighter ? Math.max(10, state.size * 3) : state.size,
    points: [canvasPoint(canvas, event)],
  };
}

function moveDraw(canvas, event) {
  if (!state.drawing || !state.currentStroke) return;
  if (state.drawingPointerId !== null && event.pointerId !== undefined && event.pointerId !== state.drawingPointerId) return;
  event.preventDefault();
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
  event.preventDefault();
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

  canvas.addEventListener("pointerdown", (event) => beginDraw(canvas, event));
  canvas.addEventListener("pointermove", (event) => moveDraw(canvas, event));
  canvas.addEventListener("pointerrawupdate", (event) => moveDraw(canvas, event));
  canvas.addEventListener("pointerup", (event) => endDraw(canvas, event));
  canvas.addEventListener("pointercancel", (event) => endDraw(canvas, event));

  canvas.addEventListener("touchstart", (event) => {
    if (Date.now() - state.lastPointerEventAt < 250) return;
    const touch = event.changedTouches[0];
    if (!touch) return;
    activeTouch.id = touch.identifier;
    state.touchFallbackActive = true;
    beginDraw(canvas, touch);
  }, touchOptions);

  canvas.addEventListener("touchmove", (event) => {
    if (!state.touchFallbackActive) return;
    const touch = [...event.changedTouches].find((item) => item.identifier === activeTouch.id);
    if (touch) moveDraw(canvas, touch);
  }, touchOptions);

  canvas.addEventListener("touchend", (event) => {
    if (!state.touchFallbackActive) return;
    const touch = [...event.changedTouches].find((item) => item.identifier === activeTouch.id) || event.changedTouches[0];
    if (touch) endDraw(canvas, touch);
    activeTouch.id = null;
  }, touchOptions);

  canvas.addEventListener("touchcancel", (event) => {
    if (!state.touchFallbackActive) return;
    const touch = [...event.changedTouches].find((item) => item.identifier === activeTouch.id) || event.changedTouches[0];
    if (touch) endDraw(canvas, touch);
    activeTouch.id = null;
  }, touchOptions);
}

function setTool(tool) {
  state.tool = tool;
  els.penTool.classList.toggle("active", tool === "pen");
  els.highlighterTool.classList.toggle("active", tool === "highlighter");
  els.eraserTool.classList.toggle("active", tool === "eraser");
  els.penTool.setAttribute("aria-pressed", String(tool === "pen"));
  els.highlighterTool.setAttribute("aria-pressed", String(tool === "highlighter"));
  els.eraserTool.setAttribute("aria-pressed", String(tool === "eraser"));
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
      state.activeSurface = surface;
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
    state.activeSurface = surface;
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
    state.activeSurface = surface;
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
  state.weekIndex = Number(els.weekSelect.value);
  state.weekStrokes = readStrokes(keyWeek());
  renderWeekControls();
  renderWeekGrid();
  requestAnimationFrame(redraw);
});

els.prevWeek.addEventListener("click", () => {
  saveCurrent();
  if (state.weekIndex > 0) state.weekIndex -= 1;
  else if (state.monthIndex > 0) {
    state.monthIndex -= 1;
    state.weekIndex = currentWeeks().length - 1;
  }
  loadCurrent();
  renderAll();
});

els.nextWeek.addEventListener("click", () => {
  saveCurrent();
  if (state.weekIndex < currentWeeks().length - 1) state.weekIndex += 1;
  else if (state.monthIndex < monthData.length - 1) {
    state.monthIndex += 1;
    state.weekIndex = 0;
  }
  loadCurrent();
  renderAll();
});

els.penTool.addEventListener("click", () => setTool("pen"));
els.highlighterTool.addEventListener("click", () => setTool("highlighter"));
els.eraserTool.addEventListener("click", () => setTool("eraser"));
els.addStickyButton.addEventListener("click", addSticky);
els.todayButton.addEventListener("click", () => {
  if (!goToDate(new Date())) {
    alert("Today is outside this July 2026 - June 2027 planner.");
  }
});
els.exportButton.addEventListener("click", exportBackup);
els.importButton.addEventListener("click", () => els.importInput.click());
els.importInput.addEventListener("change", () => {
  const file = els.importInput.files?.[0];
  if (file) importBackupFile(file);
  els.importInput.value = "";
});
els.colorInput.addEventListener("input", () => {
  state.color = els.colorInput.value;
  setTool("pen");
});
els.sizeInput.addEventListener("input", () => {
  state.size = Number(els.sizeInput.value);
});
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
  saveCurrent();
  redraw();
  renderNotesForSurface(surface);
});

window.addEventListener("resize", () => requestAnimationFrame(redraw));
window.addEventListener("beforeunload", saveCurrent);

attachDrawing(els.monthCanvas);
attachDrawing(els.weekCanvas);
loadCurrent();
renderAll();
