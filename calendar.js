/**
 * Calendar sync adapter.
 * Booking and agenda never talk to Google directly.
 * Today this is a visual simulation. Later this file can call Google Calendar
 * without rewriting createAppointment / setAppointmentStatus.
 */
const CalendarSync = {
  provider: "google",
  mode: (window.barberConfig && window.barberConfig.features.googleCalendar.mode) || "simulated",

  onCreate(appointment) {
    return {
      provider: this.provider,
      mode: this.mode,
      eventId: "gcal_" + appointment.id,
      status: "tentative",
    };
  },

  onConfirm(appointment) {
    const current = appointment.calendar || this.onCreate(appointment);
    return { ...current, status: "confirmed" };
  },

  onCancel(appointment) {
    const current = appointment.calendar || this.onCreate(appointment);
    return { ...current, status: "cancelled" };
  },

  isActive(calendar) {
    return Boolean(calendar) && calendar.status !== "cancelled";
  },
};

window.CalendarSync = CalendarSync;
