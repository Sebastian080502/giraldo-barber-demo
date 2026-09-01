const STORAGE_KEY = "giraldo-barber-demo-v3";

const SERVICES = [
  { id: "corte", name: "Corte clásico", price: 30000, duration: 45, active: true, description: "Fade o clásico, a domicilio.", image: "img/corte.png" },
  { id: "corte-barba", name: "Corte + barba", price: 40000, duration: 60, active: true, description: "Corte y perfilado de barba.", image: "img/corte-barba.png" },
  { id: "barba", name: "Barba", price: 20000, duration: 30, active: true, description: "Perfilado y arreglo de barba.", image: "img/barba.png" },
  { id: "premium", name: "Servicio premium", price: 55000, duration: 75, active: true, description: "Corte, barba, cejas y detalle.", image: "img/premium.png" },
];

const WEEKLY_HOURS = {
  0: null,
  1: ["08:00", "19:00"],
  2: ["08:00", "19:00"],
  3: ["08:00", "19:00"],
  4: ["08:00", "19:00"],
  5: ["08:00", "20:00"],
  6: ["08:00", "18:00"],
};

const DAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const HOLDS_SLOT = ["por_confirmar", "confirmada"];
const AGENDA_STATUSES = ["confirmada", "completada"];

const state = {
  view: "landing",
  bookStep: 1,
  booking: emptyBooking(),
  lastReceipt: null,
  adminTab: "hoy",
  adminDate: todayISO(),
  selectedAppointmentId: null,
  calendarCursor: startOfMonth(new Date()),
};

function emptyBooking() {
  return { serviceId: "", date: "", time: "", name: "", phone: "", address: "", notes: "" };
}

function todayISO() {
  return toISO(new Date());
}

function toISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseISO(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function thisFridayISO() {
  const d = new Date();
  const add = (5 - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + add);
  return toISO(d);
}

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function fromMinutes(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function formatTime(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = ((h + 11) % 12) + 1;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

function formatDateLong(iso) {
  const d = parseISO(iso);
  return `${cap(DAYS[d.getDay()])} ${d.getDate()} de ${MONTHS[d.getMonth()]}`;
}

function cap(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function money(n) {
  return `$${n.toLocaleString("es-CO")}`;
}

function overlaps(aStart, aEnd, bStart, bEnd) {
  return toMinutes(aStart) < toMinutes(bEnd) && toMinutes(bStart) < toMinutes(aEnd);
}

function statusLabel(status) {
  return {
    por_confirmar: "Por confirmar",
    confirmada: "Confirmada",
    completada: "Completada",
    cancelada: "Cancelada",
    liberada: "No confirmó · cupo libre",
  }[status] || status;
}

function loadDB() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) return JSON.parse(raw);
  return seedDB();
}

function saveDB(db) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

function seedDB() {
  const today = todayISO();
  const friday = thisFridayISO();
  const db = {
    services: SERVICES.map((s) => ({ ...s })),
    blocked: [{ id: "blk-1", date: friday, start: "12:00", end: "14:00", reason: "No disponible" }],
    customers: [
      { id: "c1", name: "Carlos Ramírez", phone: "3204412281", address: "Cra 5 #21-18, Las Granjas", notes: "Fade medio. Prefiere llegada puntual.", visits: 8, lastVisit: today },
      { id: "c2", name: "Andrés Molina", phone: "3108824410", address: "Calle 8 #6-30, Centro", notes: "Barba cerrada.", visits: 5, lastVisit: today },
      { id: "c3", name: "Felipe Castro", phone: "3152039177", address: "Cra 16 #9-12, Timanco", notes: "", visits: 3, lastVisit: today },
      { id: "c4", name: "Juan Pérez", phone: "3001568842", address: "Cra 7 #32-15, Santa Isabel", notes: "Casa con portero.", visits: 12, lastVisit: today },
      { id: "c5", name: "Mateo Herrera", phone: "3127780944", address: "Calle 21 #4-08, Los Lagos", notes: "", visits: 2, lastVisit: today },
      { id: "c6", name: "Santiago Díaz", phone: "3184410092", address: "Cra 10 #4-22, Cándido", notes: "", visits: 1, lastVisit: friday },
    ],
    appointments: [],
    notifications: [],
  };

  const stamp = (id, customerId, serviceId, date, start, end, status, notes = "") => ({
    id,
    customerId,
    serviceId,
    date,
    start,
    end,
    address: db.customers.find((c) => c.id === customerId).address,
    notes,
    status,
    googleEventId: "gcal_" + id,
    googleStatus: status === "confirmada" ? "confirmed" : status === "por_confirmar" ? "tentative" : "cancelled",
  });

  if (parseISO(today).getDay() !== 0) {
    db.appointments.push(
      stamp("a1", "c1", "corte", today, "08:00", "08:45", "confirmada"),
      stamp("a2", "c2", "corte-barba", today, "10:00", "11:00", "confirmada", "Traer cera mate."),
      stamp("a3", "c3", "corte", today, "12:00", "12:45", "confirmada"),
      stamp("a4", "c4", "corte-barba", today, "14:30", "15:30", "confirmada"),
      stamp("a5", "c5", "corte", today, "16:00", "16:45", "confirmada")
    );
  }

  if (friday !== today) {
    db.appointments.push(
      stamp("a6", "c4", "premium", friday, "09:00", "10:15", "confirmada"),
      stamp("a7", "c1", "barba", friday, "11:00", "11:30", "confirmada"),
      stamp("a8", "c6", "corte", friday, "17:00", "17:45", "por_confirmar")
    );
    pushNotice(db, {
      type: "nueva_reserva",
      appointmentId: "a8",
      title: "Nueva reserva · por confirmar",
      body: "Santiago Díaz — Corte · " + formatTime("17:00"),
    });
  }

  saveDB(db);
  return db;
}

function getDB() {
  return loadDB();
}

function serviceById(id) {
  return getDB().services.find((s) => s.id === id);
}

function customerById(id) {
  return getDB().customers.find((c) => c.id === id);
}

function workWindow(iso) {
  return WEEKLY_HOURS[parseISO(iso).getDay()];
}

function appointmentConflicts(db, date, start, end, ignoreId) {
  return db.appointments.some((a) => {
    if (a.id === ignoreId || a.date !== date || !HOLDS_SLOT.includes(a.status)) return false;
    return overlaps(start, end, a.start, a.end);
  });
}

function blockConflicts(db, date, start, end) {
  return db.blocked.some((b) => b.date === date && overlaps(start, end, b.start, b.end));
}

function canBook(db, service, date, start) {
  if (!service || !service.active) return { ok: false, reason: "Servicio no disponible" };
  const window = workWindow(date);
  if (!window) return { ok: false, reason: "Ese día no hay atención" };
  if (date < todayISO()) return { ok: false, reason: "La fecha ya pasó" };
  const end = fromMinutes(toMinutes(start) + service.duration);
  if (toMinutes(start) < toMinutes(window[0]) || toMinutes(end) > toMinutes(window[1])) {
    return { ok: false, reason: "Fuera del horario laboral" };
  }
  if (blockConflicts(db, date, start, end)) return { ok: false, reason: "Horario bloqueado" };
  if (appointmentConflicts(db, date, start, end)) return { ok: false, reason: "Horario ocupado" };
  return { ok: true, end };
}

function availableSlots(date, serviceId) {
  const db = getDB();
  const service = db.services.find((s) => s.id === serviceId);
  const window = workWindow(date);
  if (!service || !window) return [];
  const slots = [];
  for (let t = toMinutes(window[0]); t + service.duration <= toMinutes(window[1]); t += 30) {
    const start = fromMinutes(t);
    if (canBook(db, service, date, start).ok) slots.push(start);
  }
  return slots;
}

function dateHasSlots(date, serviceId) {
  return availableSlots(date, serviceId).length > 0;
}

function upsertCustomer(db, data) {
  const phone = data.phone.replace(/\D/g, "");
  let customer = db.customers.find((c) => c.phone === phone);
  if (customer) {
    customer.name = data.name;
    customer.address = data.address;
    if (data.notes) customer.notes = data.notes;
    customer.lastVisit = data.date;
    return customer;
  }
  customer = {
    id: "c" + Date.now(),
    name: data.name,
    phone,
    address: data.address,
    notes: data.notes || "",
    visits: 0,
    lastVisit: data.date,
  };
  db.customers.unshift(customer);
  return customer;
}

function pushNotice(db, notice) {
  db.notifications.unshift({
    id: "n" + Date.now() + Math.random().toString(16).slice(2),
    read: false,
    createdAt: new Date().toISOString(),
    ...notice,
  });
}

function createAppointment() {
  const db = getDB();
  const service = db.services.find((s) => s.id === state.booking.serviceId);
  const check = canBook(db, service, state.booking.date, state.booking.time);
  if (!check.ok) return { ok: false, reason: check.reason };
  const customer = upsertCustomer(db, state.booking);
  const appointment = {
    id: "a" + Date.now(),
    customerId: customer.id,
    serviceId: service.id,
    date: state.booking.date,
    start: state.booking.time,
    end: check.end,
    address: state.booking.address,
    notes: state.booking.notes,
    status: "por_confirmar",
    googleEventId: "gcal_" + Date.now(),
    googleStatus: "tentative",
  };
  db.appointments.push(appointment);
  pushNotice(db, {
    type: "nueva_reserva",
    appointmentId: appointment.id,
    title: "Nueva reserva · por confirmar",
    body: `${customer.name} — ${service.name} · ${formatTime(appointment.start)}`,
  });
  saveDB(db);
  state.lastReceipt = { appointment, customer, service };
  return { ok: true, appointment };
}

function setAppointmentStatus(id, status) {
  const db = getDB();
  const appointment = db.appointments.find((a) => a.id === id);
  if (!appointment) return;
  appointment.status = status;
  const customer = db.customers.find((c) => c.id === appointment.customerId);
  const service = db.services.find((s) => s.id === appointment.serviceId);

  if (status === "confirmada") {
    appointment.googleStatus = "confirmed";
    customer.visits += 1;
    customer.lastVisit = appointment.date;
    pushNotice(db, {
      type: "confirmada",
      appointmentId: id,
      title: "Cita reconfirmada",
      body: `${customer.name} confirmó ${service.name} · ${formatTime(appointment.start)}`,
    });
  }

  if (status === "cancelada" || status === "liberada") {
    appointment.googleStatus = "cancelled";
    pushNotice(db, {
      type: "liberada",
      appointmentId: id,
      title: status === "liberada" ? "Cupo liberado · no reconfirmó" : "Cita cancelada · cupo libre",
      body: `${formatTime(appointment.start)} ya no aparece en la agenda ni en Google Calendar`,
    });
  }

  if (status === "completada") appointment.googleStatus = "confirmed";
  saveDB(db);
  if (state.lastReceipt && state.lastReceipt.appointment.id === id) {
    state.lastReceipt.appointment = appointment;
  }
}

function unreadCount() {
  return getDB().notifications.filter((n) => !n.read).length;
}

function markNoticesRead() {
  const db = getDB();
  db.notifications.forEach((n) => {
    n.read = true;
  });
  saveDB(db);
}

function showView(name) {
  state.view = name;
  document.querySelectorAll(".view").forEach((el) => el.classList.toggle("is-active", el.dataset.view === name));
  window.scrollTo(0, 0);
  if (name === "book") renderBook();
  if (name === "admin") renderAdmin();
  if (name === "reconfirm") renderReconfirm();
}

function setBookStep(step) {
  state.bookStep = step;
  renderBook();
}

function renderBook() {
  const labels = ["Servicio", "Fecha", "Hora", "Datos"];
  document.getElementById("book-progress").innerHTML = labels.map((label, i) => {
    const n = i + 1;
    const cls = n === state.bookStep ? "on current" : n < state.bookStep ? "on" : "";
    return `<div class="step-pip ${cls}"><span>0${n}</span>${label}</div>`;
  }).join("");
  document.querySelectorAll("[data-book-step]").forEach((el) => {
    el.classList.toggle("hidden", Number(el.dataset.bookStep) !== state.bookStep);
  });
  if (state.bookStep === 1) renderServices();
  if (state.bookStep === 2) renderCalendar();
  if (state.bookStep === 3) renderSlots();
  if (state.bookStep === 4) renderDetailsHint();
  document.getElementById("book-next").textContent = state.bookStep === 4 ? "Reservar horario" : "Continuar";
}

function renderServices() {
  const catalog = SERVICES.filter((s) => s.active);
  document.getElementById("service-list").innerHTML = catalog.map((s) => `
      <button class="svc-card ${state.booking.serviceId === s.id ? "is-selected" : ""}" data-service="${s.id}">
        <img src="${s.image}" alt="" />
        <div class="copy">
          <strong>${s.name}</strong>
          <small>${s.duration} min · ${s.description}</small>
        </div>
        <div class="right">${money(s.price)}</div>
      </button>
    `).join("");
}

function renderCalendar() {
  const cursor = state.calendarCursor;
  document.getElementById("cal-label").textContent = `${cap(MONTHS[cursor.getMonth()])} ${cursor.getFullYear()}`;
  const first = startOfMonth(cursor);
  const startOffset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  let html = "";
  for (let i = 0; i < startOffset; i += 1) html += `<button class="day muted" disabled></button>`;
  for (let d = 1; d <= daysInMonth; d += 1) {
    const iso = toISO(new Date(cursor.getFullYear(), cursor.getMonth(), d));
    const available = dateHasSlots(iso, state.booking.serviceId);
    html += `<button class="day ${available ? "available" : ""} ${state.booking.date === iso ? "selected" : ""}" data-date="${iso}" ${available ? "" : "disabled"}>${d}</button>`;
  }
  document.getElementById("cal-grid").innerHTML = html;
}

function renderSlots() {
  const slots = availableSlots(state.booking.date, state.booking.serviceId);
  document.getElementById("slot-date-label").textContent = formatDateLong(state.booking.date);
  const box = document.getElementById("slot-list");
  if (!slots.length) {
    box.innerHTML = `<p class="empty">No hay horas disponibles este día.</p>`;
    return;
  }
  box.innerHTML = `<div class="slots">${slots.map((t) => `
    <button class="slot ${state.booking.time === t ? "is-selected" : ""}" data-time="${t}">${formatTime(t)}</button>
  `).join("")}</div>`;
}

function renderDetailsHint() {
  const service = serviceById(state.booking.serviceId);
  document.getElementById("details-summary").textContent =
    `${service.name} · ${formatDateLong(state.booking.date)} · ${formatTime(state.booking.time)}`;
}

function renderReceipt() {
  const r = state.lastReceipt;
  if (!r) return;
  document.getElementById("receipt-body").innerHTML = `
    <div class="ok-dot">✓</div>
    <h2>Ya tienes el horario</h2>
    <p class="hint">Giraldo ya se enteró en su celular y el evento quedó en Google Calendar. Para que salga hacia tu casa, reconfirma la cita.</p>
    <div class="receipt">
      <div class="receipt-row"><span>Estado</span><strong>Por confirmar</strong></div>
      <div class="receipt-row"><span>Servicio</span><strong>${r.service.name}</strong></div>
      <div class="receipt-row"><span>Fecha</span><strong>${formatDateLong(r.appointment.date)}</strong></div>
      <div class="receipt-row"><span>Hora</span><strong>${formatTime(r.appointment.start)} — ${formatTime(r.appointment.end)}</strong></div>
      <div class="receipt-row"><span>Dirección</span><strong>${r.appointment.address}</strong></div>
      <div class="receipt-row"><span>WhatsApp</span><strong>${r.customer.phone}</strong></div>
      <div class="receipt-row"><span>Google Calendar</span><strong>Evento tentativo</strong></div>
    </div>
  `;
}

function renderReconfirm() {
  const r = state.lastReceipt;
  if (!r) return;
  document.getElementById("reconfirm-msg").innerHTML = `
    <strong>Giraldo Barber</strong><br><br>
    Hola ${r.customer.name.split(" ")[0]}, tienes una cita el ${formatDateLong(r.appointment.date)} a las ${formatTime(r.appointment.start)} — ${r.service.name}.<br><br>
    Dirección: ${r.appointment.address}.<br><br>
    ¿Confirmas que sí vas a estar? Si no confirmas, el horario se libera y Giraldo no sale para allá.
  `;
}

function liveAppointments(date) {
  return getDB().appointments
    .filter((a) => a.date === date && AGENDA_STATUSES.includes(a.status))
    .sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
}

function pendingAppointments(date) {
  return getDB().appointments
    .filter((a) => a.date === date && a.status === "por_confirmar")
    .sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
}

function initials(name) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function appointmentCard(a, pending) {
  const c = customerById(a.customerId);
  const s = serviceById(a.serviceId);
  const badge = pending ? `<span class="badge warn">Pendiente</span>` : `<span class="badge ok">Confirmada</span>`;
  return `
    <button class="appt ${pending ? "pending" : ""}" data-appt="${a.id}">
      <time>${formatTime(a.start)}</time>
      <span class="avatar">${initials(c.name)}</span>
      <div>
        <div class="who">${c.name}</div>
        <div class="sub">${s.name}</div>
        <div class="sub">${a.address}</div>
      </div>
      ${badge}
    </button>
  `;
}

function renderAppointmentList(date) {
  const list = liveAppointments(date);
  if (!list.length) return `<p class="empty">No hay citas confirmadas este día. Giraldo solo ve aquí lo que sí va a atender.</p>`;
  return list.map((a) => appointmentCard(a, false)).join("");
}

function renderPendingBlock(date) {
  const list = pendingAppointments(date);
  if (!list.length) return "";
  return `<p class="section-kicker">Esperando reconfirmación</p>
    <p class="hint">Ocupan el horario, pero no salen en la ruta del día hasta que el cliente confirme. Si no confirman, el cupo se libera.</p>
    ${list.map((a) => appointmentCard(a, true)).join("")}`;
}

function renderBell() {
  const count = unreadCount();
  const badge = document.getElementById("bell-count");
  badge.textContent = String(count);
  badge.classList.toggle("hidden", count === 0);
}

function renderAdmin() {
  renderBell();
  document.querySelectorAll("[data-admin-tab]").forEach((el) => {
    el.classList.toggle("hidden", el.dataset.adminTab !== state.adminTab);
  });
  document.querySelectorAll(".bottom-nav button, .side-nav button").forEach((btn) => {
    btn.classList.toggle("on", btn.dataset.tab === state.adminTab);
  });
  if (state.adminTab === "hoy") {
    document.getElementById("today-label").textContent = formatDateLong(todayISO());
    document.getElementById("today-list").innerHTML = renderAppointmentList(todayISO());
    document.getElementById("today-pending").innerHTML = renderPendingBlock(todayISO());
  }
  if (state.adminTab === "semana") renderWeek();
  if (state.adminTab === "clientes") renderClients();
  if (state.adminTab === "calendar") {
    renderGoogleCalendar();
    renderAdminServices();
  }
}

function startOfWeek(iso) {
  const d = parseISO(iso);
  const offset = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - offset);
  return d;
}

function renderWeek() {
  const start = startOfWeek(state.adminDate);
  const days = [...Array(7)].map((_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return toISO(d);
  });
  document.getElementById("week-strip").innerHTML = days.map((iso) => {
    const d = parseISO(iso);
    const count = liveAppointments(iso).length;
    return `<button data-week-day="${iso}" class="${iso === state.adminDate ? "on" : ""}">${DAYS[d.getDay()].slice(0, 3)}<br>${d.getDate()}${count ? ` · ${count}` : ""}</button>`;
  }).join("");
  document.getElementById("week-list").innerHTML = renderAppointmentList(state.adminDate) + renderPendingBlock(state.adminDate);
}

function renderClients() {
  const db = getDB();
  document.getElementById("client-list").innerHTML = db.customers.map((c) => `
    <article class="client">
      <span class="avatar">${initials(c.name)}</span>
      <div>
        <h3>${c.name}</h3>
        <p>${c.phone} · ${c.address}</p>
        <p>${c.visits} servicios · última visita ${formatDateLong(c.lastVisit)}</p>
        ${c.notes ? `<p>${c.notes}</p>` : ""}
      </div>
    </article>
  `).join("");
}

function renderAdminServices() {
  const db = getDB();
  document.getElementById("admin-services").innerHTML = db.services.map((s) => `
    <div class="choice">
      <div>
        <strong>${s.name}</strong>
        <small>${s.duration} min · ${s.active ? "Activo" : "Inactivo"}</small>
      </div>
      <div class="right">${money(s.price)}</div>
    </div>
  `).join("");
}

function renderGoogleCalendar() {
  const events = getDB().appointments
    .filter((a) => a.googleStatus !== "cancelled")
    .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
  if (!events.length) {
    document.getElementById("calendar-list").innerHTML = `<p class="empty">No hay eventos activos en Google Calendar.</p>`;
    return;
  }
  document.getElementById("calendar-list").innerHTML = events.map((a) => {
    const c = customerById(a.customerId);
    const s = serviceById(a.serviceId);
    return `
      <article class="gcal-event">
        <div class="gcal-bar ${a.googleStatus === "tentative" ? "tentative" : ""}"></div>
        <div>
          <strong>${c.name} — ${s.name}</strong>
          <p class="hint" style="margin:4px 0 0;">${formatDateLong(a.date)} · ${formatTime(a.start)} — ${formatTime(a.end)}</p>
          <p class="hint" style="margin:4px 0 0;">${a.address} · WhatsApp ${c.phone}</p>
          <span class="status">${a.googleStatus === "tentative" ? "Tentativo en Calendar" : "Confirmado en Calendar"}</span>
        </div>
      </article>
    `;
  }).join("");
}

function openSheet(id) {
  const db = getDB();
  const a = db.appointments.find((x) => x.id === id);
  if (!a) return;
  state.selectedAppointmentId = id;
  const c = customerById(a.customerId);
  const s = serviceById(a.serviceId);
  document.getElementById("sheet-content").innerHTML = `
    <h2 style="font-family:var(--font-display);font-size:32px;letter-spacing:.06em;margin-bottom:8px;">${formatTime(a.start)} — ${c.name}</h2>
    <p class="hint">${s.name} · ${formatDateLong(a.date)}</p>
    <div class="receipt-row"><span>Estado</span><strong>${statusLabel(a.status)}</strong></div>
    <div class="receipt-row"><span>Dirección</span><strong>${a.address}</strong></div>
    <div class="receipt-row"><span>WhatsApp</span><strong>${c.phone}</strong></div>
    <div class="receipt-row"><span>Google Calendar</span><strong>${a.googleEventId} · ${a.googleStatus}</strong></div>
    <div class="receipt-row"><span>Notas</span><strong>${a.notes || "Sin observaciones"}</strong></div>
    <div class="pill-row">
      ${a.status === "por_confirmar" ? `<button class="pill" data-action="ask-reconfirm">Pedir reconfirmación</button>
      <button class="pill" data-status="liberada">No confirmó · liberar</button>` : ""}
      ${a.status === "confirmada" ? `<button class="pill on" data-status="completada">Marcar completada</button>
      <button class="pill" data-status="cancelada">Cancelar y quitar de agenda</button>` : ""}
    </div>
  `;
  document.getElementById("sheet").classList.add("is-open");
}

function showPhoneNotification() {
  const r = state.lastReceipt;
  if (!r) return;
  document.getElementById("phone-card").innerHTML = `
    <small>Ahora · celular de Giraldo</small>
    <h3>Giraldo Barber</h3>
    <p><strong>Nueva reserva · por confirmar</strong><br>${r.customer.name} — ${r.service.name}<br>${formatDateLong(r.appointment.date)} · ${formatTime(r.appointment.start)}</p>
    <p style="margin-top:10px;color:#8d887d;font-size:13px;">También le acaba de llegar el evento a Google Calendar. Si el cliente no reconfirma, el aviso de la ruta del día no aparece.</p>
    <div style="display:grid;gap:8px;margin-top:14px;">
      <button class="btn btn-brass btn-full" data-action="open-admin-from-phone">Abrir agenda</button>
      <button class="btn btn-ghost btn-full" data-action="close-phone">Cerrar</button>
    </div>
  `;
  document.getElementById("phone-overlay").classList.add("is-open");
}

function renderInbox() {
  const notes = getDB().notifications.slice(0, 8);
  document.getElementById("inbox-list").innerHTML = notes.length
    ? notes.map((n) => `<div class="receipt-row"><span>${n.title}</span><strong>${n.body}</strong></div>`).join("")
    : `<p class="empty">Sin avisos.</p>`;
}

function bindEvents() {
  document.body.addEventListener("click", (e) => {
    const t = e.target.closest("[data-action]");
    if (t) {
      const action = t.dataset.action;
      if (action === "book") {
        state.booking = emptyBooking();
        state.bookStep = 1;
        showView("book");
      }
      if (action === "landing") showView("landing");
      if (action === "admin") {
        state.adminTab = "hoy";
        showView("admin");
      }
      if (action === "book-back") {
        if (state.bookStep === 1) showView("landing");
        else setBookStep(state.bookStep - 1);
      }
      if (action === "book-next") handleBookNext();
      if (action === "cal-prev") {
        state.calendarCursor = new Date(state.calendarCursor.getFullYear(), state.calendarCursor.getMonth() - 1, 1);
        renderCalendar();
      }
      if (action === "cal-next") {
        state.calendarCursor = new Date(state.calendarCursor.getFullYear(), state.calendarCursor.getMonth() + 1, 1);
        renderCalendar();
      }
      if (action === "reset") {
        localStorage.removeItem(STORAGE_KEY);
        seedDB();
        state.adminDate = todayISO();
        renderAdmin();
      }
      if (action === "close-sheet") document.getElementById("sheet").classList.remove("is-open");
      if (action === "reconfirm") showView("reconfirm");
      if (action === "see-phone") showPhoneNotification();
      if (action === "close-phone") document.getElementById("phone-overlay").classList.remove("is-open");
      if (action === "open-admin-from-phone") {
        document.getElementById("phone-overlay").classList.remove("is-open");
        if (state.lastReceipt) state.adminDate = state.lastReceipt.appointment.date;
        state.adminTab = state.lastReceipt && state.lastReceipt.appointment.date === todayISO() ? "hoy" : "semana";
        showView("admin");
      }
      if (action === "client-confirm" && state.lastReceipt) {
        setAppointmentStatus(state.lastReceipt.appointment.id, "confirmada");
        showPhoneNotification();
        document.getElementById("phone-card").insertAdjacentHTML("afterbegin", "");
        document.getElementById("phone-card").innerHTML = `
          <small>Ahora · celular de Giraldo</small>
          <h3>Cita confirmada</h3>
          <p>${state.lastReceipt.customer.name} ya reconfirmó. El evento en Google Calendar pasó de tentativo a confirmado y ahora sí aparece en la ruta del día.</p>
          <button class="btn btn-brass btn-full" data-action="open-admin-from-phone" style="margin-top:14px;">Ver agenda del día</button>
        `;
        document.getElementById("phone-overlay").classList.add("is-open");
      }
      if (action === "client-cancel" && state.lastReceipt) {
        setAppointmentStatus(state.lastReceipt.appointment.id, "cancelada");
        showView("admin");
        state.adminTab = "calendar";
        renderAdmin();
        alert("Cita cancelada. El cupo quedó libre y el evento se quitó de Google Calendar. No aparece en la agenda del día.");
      }
      if (action === "ask-reconfirm" && state.selectedAppointmentId) {
        const db = getDB();
        const a = db.appointments.find((x) => x.id === state.selectedAppointmentId);
        const c = customerById(a.customerId);
        const s = serviceById(a.serviceId);
        state.lastReceipt = { appointment: a, customer: c, service: s };
        document.getElementById("sheet").classList.remove("is-open");
        showView("reconfirm");
      }
      if (action === "inbox") {
        renderInbox();
        markNoticesRead();
        renderBell();
        document.getElementById("inbox").classList.add("is-open");
      }
      if (action === "close-inbox") document.getElementById("inbox").classList.remove("is-open");
    }

    const pick = e.target.closest("[data-pick-service]");
    if (pick) {
      state.booking = emptyBooking();
      state.booking.serviceId = pick.dataset.pickService;
      state.bookStep = 2;
      showView("book");
      return;
    }

    const service = e.target.closest("[data-service]");
    if (service) {
      state.booking.serviceId = service.dataset.service;
      state.booking.date = "";
      state.booking.time = "";
      renderServices();
    }

    const day = e.target.closest("[data-date]");
    if (day) {
      state.booking.date = day.dataset.date;
      state.booking.time = "";
      renderCalendar();
    }

    const slot = e.target.closest("[data-time]");
    if (slot) {
      state.booking.time = slot.dataset.time;
      renderSlots();
    }

    const tab = e.target.closest("[data-tab]");
    if (tab) {
      state.adminTab = tab.dataset.tab;
      renderAdmin();
    }

    const weekDay = e.target.closest("[data-week-day]");
    if (weekDay) {
      state.adminDate = weekDay.dataset.weekDay;
      renderWeek();
    }

    const appt = e.target.closest("[data-appt]");
    if (appt) openSheet(appt.dataset.appt);

    const status = e.target.closest("[data-status]");
    if (status && state.selectedAppointmentId) {
      setAppointmentStatus(state.selectedAppointmentId, status.dataset.status);
      document.getElementById("sheet").classList.remove("is-open");
      renderAdmin();
    }
  });
}

function handleBookNext() {
  if (state.bookStep === 1) {
    if (!state.booking.serviceId) return alert("Selecciona un servicio.");
    return setBookStep(2);
  }
  if (state.bookStep === 2) {
    if (!state.booking.date) return alert("Selecciona un día.");
    return setBookStep(3);
  }
  if (state.bookStep === 3) {
    if (!state.booking.time) return alert("Selecciona una hora.");
    return setBookStep(4);
  }
  const name = document.getElementById("f-name").value.trim();
  const phone = document.getElementById("f-phone").value.trim();
  const address = document.getElementById("f-address").value.trim();
  const notes = document.getElementById("f-notes").value.trim();
  if (!name || !phone || !address) return alert("Nombre, WhatsApp y dirección son obligatorios.");
  state.booking = { ...state.booking, name, phone, address, notes };
  const result = createAppointment();
  if (!result.ok) return alert(result.reason);
  renderReceipt();
  showView("done");
}

bindEvents();
showView("landing");
