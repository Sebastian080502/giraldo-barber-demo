const STORAGE_KEY = "barber-studio-demo-v1";
const DAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const HOLDS_SLOT = ["por_confirmar", "confirmada"];
const AGENDA_STATUSES = ["confirmada", "completada"];
const ADMIN_TITLES = {
  hoy: "Agenda de hoy",
  semana: "Calendario",
  clientes: "Clientes",
  servicios: "Servicios",
  stats: "Estadísticas",
  config: "Configuración",
  mas: "Más",
};

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

function catalog() {
  return barberConfig.services;
}

function weeklyHours() {
  return barberConfig.workingHours;
}

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

function dayLabel(index) {
  return DAYS[index];
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
    tenantId: barberConfig.tenantId,
    services: catalog().map((s) => ({ ...s })),
    blocked: [{ id: "blk-1", date: friday, start: "12:00", end: "14:00", reason: "No disponible" }],
    customers: [
      { id: "c1", name: "Carlos Ramírez", phone: "3204412281", address: "Sede principal", notes: "Fade medio. Prefiere llegada puntual.", visits: 8, lastVisit: today },
      { id: "c2", name: "Andrés López", phone: "3108824410", address: "Sede principal", notes: "Barba cerrada.", visits: 5, lastVisit: today },
      { id: "c3", name: "Felipe Ortiz", phone: "3152039177", address: "Sede principal", notes: "", visits: 3, lastVisit: today },
      { id: "c4", name: "Juan David", phone: "3001568842", address: "Sede principal", notes: "", visits: 12, lastVisit: today },
      { id: "c5", name: "Mateo González", phone: "3127780944", address: "Sede principal", notes: "", visits: 2, lastVisit: today },
      { id: "c6", name: "Santiago Díaz", phone: "3184410092", address: "Sede principal", notes: "", visits: 1, lastVisit: friday },
    ],
    appointments: [],
    notifications: [],
  };

  const stamp = (id, customerId, serviceId, date, start, end, status, notes = "") => {
    const appointment = {
      id,
      tenantId: barberConfig.tenantId,
      customerId,
      serviceId,
      date,
      start,
      end,
      address: db.customers.find((c) => c.id === customerId).address,
      notes,
      status,
      calendar: null,
    };
    appointment.calendar = status === "confirmada"
      ? CalendarSync.onConfirm(appointment)
      : CalendarSync.onCreate(appointment);
    return appointment;
  };

  if (parseISO(today).getDay() !== 0) {
    db.appointments.push(
      stamp("a1", "c1", "corte", today, "08:00", "08:45", "confirmada"),
      stamp("a2", "c2", "corte-barba", today, "10:00", "11:00", "confirmada", "Traer cera mate."),
      stamp("a3", "c3", "premium", today, "12:30", "13:30", "confirmada"),
      stamp("a4", "c4", "corte-barba", today, "15:00", "16:00", "confirmada"),
      stamp("a5", "c5", "corte", today, "17:00", "17:45", "confirmada")
    );
  }

  if (friday !== today) {
    db.appointments.push(
      stamp("a6", "c4", "premium", friday, "09:00", "10:00", "confirmada"),
      stamp("a7", "c1", "barba", friday, "11:00", "11:30", "confirmada"),
      stamp("a8", "c6", "corte", friday, "17:00", "17:45", "por_confirmar")
    );
    pushNotice(db, {
      type: "nueva_reserva",
      appointmentId: "a8",
      title: "Nueva reserva · por confirmar",
      body: "Santiago Díaz — Corte clásico · " + formatTime("17:00"),
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
  return weeklyHours()[parseISO(iso).getDay()];
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
    customer.address = data.address || customer.address;
    if (data.notes) customer.notes = data.notes;
    customer.lastVisit = data.date;
    return customer;
  }
  customer = {
    id: "c" + Date.now(),
    name: data.name,
    phone,
    address: data.address || barberConfig.location.address,
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
    tenantId: barberConfig.tenantId,
    customerId: customer.id,
    serviceId: service.id,
    date: state.booking.date,
    start: state.booking.time,
    end: check.end,
    address: state.booking.address || barberConfig.location.address,
    notes: state.booking.notes,
    status: "por_confirmar",
    calendar: null,
  };
  db.appointments.push(appointment);
  appointment.calendar = CalendarSync.onCreate(appointment);
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
    appointment.calendar = CalendarSync.onConfirm(appointment);
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
    appointment.calendar = CalendarSync.onCancel(appointment);
    pushNotice(db, {
      type: "liberada",
      appointmentId: id,
      title: status === "liberada" ? "Cupo liberado · no reconfirmó" : "Cita cancelada · cupo libre",
      body: `${formatTime(appointment.start)} ya no aparece en la agenda ni en Calendar`,
    });
  }

  if (status === "completada") appointment.calendar = CalendarSync.onConfirm(appointment);
  saveDB(db);
  if (state.lastReceipt && state.lastReceipt.appointment.id === id) {
    state.lastReceipt.appointment = appointment;
  }
}

function calendarStatus(appointment) {
  return (appointment.calendar && appointment.calendar.status) || "tentative";
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

function renderLanding() {
  const services = catalog().filter((s) => s.active);
  document.getElementById("landing-services").innerHTML = services.map((s) => `
    <button class="service-card visual-card" data-pick-service="${s.id}">
      <img src="${s.image}" alt="${s.name}" />
      <div class="visual-meta">
        <h3>${s.name}</h3>
        <span>${s.duration} min · ${money(s.price)}</span>
      </div>
    </button>
  `).join("");

  document.getElementById("reels").innerHTML = (barberConfig.reels || []).map((reel) => `
    <button class="reel" data-pick-service="${reel.serviceId}">
      <video muted loop playsinline preload="metadata" poster="${reel.poster}" src="${reel.src}"></video>
      <span>${reel.label}</span>
    </button>
  `).join("");

  document.getElementById("style-grid").innerHTML = Object.values(barberThemes).map((theme) => {
    const t = theme.tokens;
    return `
      <button class="style-card" data-theme-card="${theme.id}">
        <div class="style-swatches">
          <i style="background:${t.bg}"></i>
          <i style="background:${t.accent}"></i>
          <i style="background:${t.ink}"></i>
        </div>
        <h3>${theme.name}</h3>
        <p>${theme.summary}</p>
        <small>${theme.palette}</small>
      </button>
    `;
  }).join("");

  document.getElementById("date-hint").textContent = barberConfig.booking.closedHint;
  bindMedia();
}

function bindMedia() {
  const videos = barberConfig.videos || {};
  const interior = document.getElementById("interior-video");
  if (interior && videos.booking) {
    interior.src = videos.booking;
    interior.play().catch(() => {});
  }
  const book = document.getElementById("book-video");
  if (book && videos.booking) {
    book.src = videos.booking;
    book.play().catch(() => {});
  }
  document.querySelectorAll(".reel video").forEach((video) => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.play().catch(() => {});
        else entry.target.pause();
      });
    }, { threshold: 0.55 });
    io.observe(video);
  });
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
  document.getElementById("book-next").textContent = state.bookStep === 4 ? "Confirmar reserva" : "Continuar";
}

function renderServices() {
  const list = getDB().services.filter((s) => s.active);
  document.getElementById("service-list").innerHTML = list.map((s) => `
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
    <p class="hint">La cita quedó registrada. Calendar recibe una copia tentativa. Para que salga en la agenda del día, reconfirma.</p>
    <div class="receipt">
      <div class="receipt-row"><span>Estado</span><strong>Por confirmar</strong></div>
      <div class="receipt-row"><span>Servicio</span><strong>${r.service.name}</strong></div>
      <div class="receipt-row"><span>Fecha</span><strong>${formatDateLong(r.appointment.date)}</strong></div>
      <div class="receipt-row"><span>Hora</span><strong>${formatTime(r.appointment.start)} — ${formatTime(r.appointment.end)}</strong></div>
      <div class="receipt-row"><span>Lugar</span><strong>${r.appointment.address}</strong></div>
      <div class="receipt-row"><span>WhatsApp</span><strong>${r.customer.phone}</strong></div>
      <div class="receipt-row"><span>Google Calendar</span><strong>Evento tentativo · simulado</strong></div>
    </div>
  `;
}

function renderReconfirm() {
  const r = state.lastReceipt;
  if (!r) return;
  document.getElementById("reconfirm-msg").innerHTML = `
    <strong>${barberConfig.name}</strong><br><br>
    Hola ${r.customer.name.split(" ")[0]}, tienes una cita el ${formatDateLong(r.appointment.date)} a las ${formatTime(r.appointment.start)} — ${r.service.name}.<br><br>
    Lugar: ${r.appointment.address}.<br><br>
    ¿Confirmas que sí vas a estar? Si no confirmas, el horario se libera.
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
  if (!list.length) return `<p class="empty">No hay citas confirmadas este día. Aquí solo aparece lo que sí se va a atender.</p>`;
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
  document.getElementById("admin-title").textContent = ADMIN_TITLES[state.adminTab] || "Panel";
  document.querySelectorAll("[data-admin-tab]").forEach((el) => {
    el.classList.toggle("hidden", el.dataset.adminTab !== state.adminTab);
  });
  document.querySelectorAll(".bottom-nav button, .side-nav button").forEach((btn) => {
    const onMore = state.adminTab === "mas" || ["servicios", "stats", "config"].includes(state.adminTab);
    if (btn.closest(".bottom-nav") && btn.dataset.tab === "mas") {
      btn.classList.toggle("on", onMore);
    } else {
      btn.classList.toggle("on", btn.dataset.tab === state.adminTab);
    }
  });
  if (state.adminTab === "hoy") {
    document.getElementById("today-label").textContent = formatDateLong(todayISO());
    document.getElementById("today-list").innerHTML = renderAppointmentList(todayISO());
    document.getElementById("today-pending").innerHTML = renderPendingBlock(todayISO());
  }
  if (state.adminTab === "semana") renderWeek();
  if (state.adminTab === "clientes") renderClients();
  if (state.adminTab === "servicios") {
    renderAdminServices();
    renderGoogleCalendar();
  }
  if (state.adminTab === "stats") renderStats();
  if (state.adminTab === "config") renderConfig();
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
    .filter((a) => CalendarSync.isActive(a.calendar))
    .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
  if (!events.length) {
    document.getElementById("calendar-list").innerHTML = `<p class="empty">No hay eventos activos en Calendar.</p>`;
    return;
  }
  document.getElementById("calendar-list").innerHTML = events.map((a) => {
    const c = customerById(a.customerId);
    const s = serviceById(a.serviceId);
    const status = calendarStatus(a);
    return `
      <article class="gcal-event">
        <div class="gcal-bar ${status === "tentative" ? "tentative" : ""}"></div>
        <div>
          <strong>${c.name} — ${s.name}</strong>
          <p class="hint" style="margin:4px 0 0;">${formatDateLong(a.date)} · ${formatTime(a.start)} — ${formatTime(a.end)}</p>
          <p class="hint" style="margin:4px 0 0;">${a.address} · WhatsApp ${c.phone}</p>
          <span class="status">${status === "tentative" ? "Tentativo en Calendar" : "Confirmado en Calendar"}</span>
        </div>
      </article>
    `;
  }).join("");
}

function renderStats() {
  const db = getDB();
  const today = todayISO();
  const confirmed = liveAppointments(today);
  const pending = pendingAppointments(today);
  const revenue = confirmed.reduce((sum, a) => {
    const service = serviceById(a.serviceId);
    return sum + (service ? service.price : 0);
  }, 0);
  document.getElementById("stats-grid").innerHTML = `
    <article class="stat-card"><strong>${confirmed.length}</strong><span>Confirmadas hoy</span></article>
    <article class="stat-card"><strong>${pending.length}</strong><span>Por reconfirmar</span></article>
    <article class="stat-card"><strong>${db.customers.length}</strong><span>Clientes</span></article>
    <article class="stat-card"><strong>${money(revenue)}</strong><span>Estimado del día</span></article>
  `;
}

function renderConfig() {
  const hours = Object.entries(weeklyHours()).map(([day, window]) => {
    const label = cap(dayLabel(Number(day)));
    return window ? `${label}: ${window[0]}–${window[1]}` : `${label}: cerrado`;
  }).join(" · ");
  const rows = [
    ["Barbería", barberConfig.name],
    ["Eslogan", barberConfig.tagline],
    ["Ciudad", barberConfig.location.city],
    ["Modelo", barberConfig.location.mode === "shop" ? "En sede" : "A domicilio"],
    ["Enlace de reserva", barberConfig.bookingUrl],
    ["Horarios", hours],
    ["Calendar", barberConfig.features.googleCalendar.mode === "simulated" ? "Simulado · listo para conectar" : "Google"],
    ["WhatsApp", barberConfig.features.whatsapp.comingSoon ? "Próximamente" : "Activo"],
    ["Archivo", "config.js · un tenant, una identidad"],
  ];
  document.getElementById("config-list").innerHTML = rows.map(([label, value]) => `
    <div class="config-row"><small>${label}</small><strong>${value}</strong></div>
  `).join("");
}

function openSheet(id) {
  const db = getDB();
  const a = db.appointments.find((x) => x.id === id);
  if (!a) return;
  state.selectedAppointmentId = id;
  const c = customerById(a.customerId);
  const s = serviceById(a.serviceId);
  document.getElementById("sheet-content").innerHTML = `
    <h2 style="font-family:var(--serif);font-size:32px;letter-spacing:.06em;margin-bottom:8px;">${formatTime(a.start)} — ${c.name}</h2>
    <p class="hint">${s.name} · ${formatDateLong(a.date)}</p>
    <div class="receipt-row"><span>Estado</span><strong>${statusLabel(a.status)}</strong></div>
    <div class="receipt-row"><span>Lugar</span><strong>${a.address}</strong></div>
    <div class="receipt-row"><span>WhatsApp</span><strong>${c.phone}</strong></div>
    <div class="receipt-row"><span>Google Calendar</span><strong>${(a.calendar && a.calendar.eventId) || "—"} · ${calendarStatus(a)}</strong></div>
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
    <small>Ahora · celular del barbero</small>
    <h3>${barberConfig.name}</h3>
    <p><strong>Nueva reserva · por confirmar</strong><br>${r.customer.name} — ${r.service.name}<br>${formatDateLong(r.appointment.date)} · ${formatTime(r.appointment.start)}</p>
    <p style="margin-top:10px;">La cita ya está en el sistema. Calendar recibe una copia tentativa. Si el cliente no reconfirma, no aparece en la ruta del día.</p>
    <div class="done-actions">
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
    const themeCard = e.target.closest("[data-theme-card]");
    if (themeCard) {
      applyTheme(themeCard.dataset.themeCard);
      return;
    }

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
        document.getElementById("phone-card").innerHTML = `
          <small>Ahora · celular del barbero</small>
          <h3>Cita confirmada</h3>
          <p>${state.lastReceipt.customer.name} ya reconfirmó. Calendar pasa de tentativo a confirmado y ahora sí aparece en la ruta del día.</p>
          <button class="btn btn-brass btn-full" data-action="open-admin-from-phone" style="margin-top:14px;">Ver agenda del día</button>
        `;
        document.getElementById("phone-overlay").classList.add("is-open");
      }
      if (action === "client-cancel" && state.lastReceipt) {
        setAppointmentStatus(state.lastReceipt.appointment.id, "cancelada");
        showView("admin");
        state.adminTab = "servicios";
        renderAdmin();
        alert("Cita cancelada. El cupo quedó libre y el evento se quitó de Calendar. No aparece en la agenda del día.");
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
  if (!name) return alert("El nombre es obligatorio.");
  if (barberConfig.booking.requirePhone && !phone) return alert("El WhatsApp es obligatorio.");
  if (barberConfig.booking.requireAddress && !address) return alert("La dirección es obligatoria.");
  state.booking = { ...state.booking, name, phone, address, notes };
  const result = createAppointment();
  if (!result.ok) return alert(result.reason);
  renderReceipt();
  showView("done");
}

applyBrand();
applyTheme(getActiveThemeId());
renderLanding();
bindEvents();
showView("landing");
