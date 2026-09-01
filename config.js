/**
 * Tenant config for one barbershop.
 * This demo loads a single studio. Later, a platform can swap this
 * object per tenantId without rewriting booking or admin views.
 */
const barberConfig = {
  tenantId: "barber-studio-demo",
  name: "BARBER STUDIO",
  shortName: "B",
  tagline: "Tu estilo. Tu tiempo. Tu experiencia.",
  description: "Una experiencia de reserva diseñada para tu barbería.",
  demoLabel: "Demo comercial",
  bookingUrl: "tu-barberia.com/reservar",
  location: {
    city: "Tu ciudad",
    address: "Sede principal",
    mode: "shop",
  },
  contact: {
    phone: "300 000 0000",
    email: "hola@barber.studio",
  },
  socialLinks: {
    instagram: "#instagram",
    tiktok: "#tiktok",
  },
  owner: {
    name: "El barbero",
    role: "Propietario",
  },
  images: {
    hero: "img/video/hero.jpg",
    booking: "img/corte-barba.png",
  },
  videos: {
    hero: "img/video/hero.mp4",
    heroPoster: "img/video/hero.jpg",
    booking: "img/video/interior.mp4",
    bookingPoster: "img/video/interior.jpg",
  },
  reels: [
    { src: "img/video/reel-fade.mp4", poster: "img/video/reel-fade.jpg", label: "Fade", serviceId: "corte" },
    { src: "img/video/reel-clipper.mp4", poster: "img/video/reel-clipper.jpg", label: "Máquina", serviceId: "corte" },
    { src: "img/video/reel-cut.mp4", poster: "img/video/reel-cut.jpg", label: "Corte", serviceId: "premium" },
    { src: "img/video/reel-barba.mp4", poster: "img/video/reel-barba.jpg", label: "Barba", serviceId: "barba" },
    { src: "img/video/reel-reveal.mp4", poster: "img/video/reel-reveal.jpg", label: "Reveal", serviceId: "corte-barba" },
  ],
  gallery: [
    { image: "img/fade.png", label: "Fade", serviceId: "corte" },
    { image: "img/textura.png", label: "Textura", serviceId: "corte" },
    { image: "img/clasico.png", label: "Clásico", serviceId: "corte" },
    { image: "img/corte-barba.png", label: "Corte + barba", serviceId: "corte-barba" },
    { image: "img/barba.png", label: "Barba", serviceId: "barba" },
    { image: "img/premium.png", label: "Premium", serviceId: "premium" },
  ],
  services: [
    { id: "corte", name: "Corte clásico", price: 30000, duration: 45, active: true, description: "Corte a medida, preciso y limpio.", image: "img/corte.png" },
    { id: "corte-barba", name: "Corte + barba", price: 40000, duration: 60, active: true, description: "Corte y perfilado en una sola visita.", image: "img/corte-barba.png" },
    { id: "premium", name: "Corte premium", price: 50000, duration: 60, active: true, description: "Detalle completo y experiencia extendida.", image: "img/premium.png" },
    { id: "barba", name: "Barba", price: 25000, duration: 30, active: true, description: "Perfilado y arreglo de barba.", image: "img/barba.png" },
  ],
  workingHours: {
    0: null,
    1: ["08:00", "19:00"],
    2: ["08:00", "19:00"],
    3: ["08:00", "19:00"],
    4: ["08:00", "19:00"],
    5: ["08:00", "20:00"],
    6: ["08:00", "18:00"],
  },
  booking: {
    requireAddress: false,
    requirePhone: true,
    closedHint: "Los días sin atención no se pueden elegir.",
  },
  features: {
    googleCalendar: { enabled: true, mode: "simulated" },
    whatsapp: { enabled: false, comingSoon: true },
  },
  themeId: "premium",
};

const barberThemes = {
  premium: {
    id: "premium",
    name: "Premium",
    summary: "Elegante y exclusivo.",
    palette: "Negro + dorado",
    tokens: {
      bg: "#070707",
      bg2: "#111111",
      bg3: "#181818",
      card: "#141414",
      ink: "#f4f1ea",
      muted: "#8e8a82",
      line: "rgba(244, 241, 234, 0.1)",
      accent: "#c4a35a",
      accent2: "#e0c37a",
      accentInk: "#111111",
      heroOverlay: "linear-gradient(180deg, rgba(7,7,7,0.28) 0%, rgba(7,7,7,0.78) 68%, #070707 100%)",
    },
  },
  urbana: {
    id: "urbana",
    name: "Urbana",
    summary: "Moderna y atrevida.",
    palette: "Negro + rojo",
    tokens: {
      bg: "#090909",
      bg2: "#121212",
      bg3: "#1a1a1a",
      card: "#151515",
      ink: "#f6f1ef",
      muted: "#9a8e8c",
      line: "rgba(255, 220, 214, 0.12)",
      accent: "#d61f26",
      accent2: "#f04545",
      accentInk: "#ffffff",
      heroOverlay: "linear-gradient(180deg, rgba(9,9,9,0.35) 0%, rgba(9,9,9,0.82) 70%, #090909 100%)",
    },
  },
  minimalista: {
    id: "minimalista",
    name: "Minimalista",
    summary: "Limpia y sofisticada.",
    palette: "Blanco + negro",
    tokens: {
      bg: "#f6f4f1",
      bg2: "#ffffff",
      bg3: "#ece8e2",
      card: "#ffffff",
      ink: "#121212",
      muted: "#6f6a64",
      line: "rgba(18, 18, 18, 0.1)",
      accent: "#121212",
      accent2: "#2a2a2a",
      accentInk: "#ffffff",
      heroOverlay: "linear-gradient(180deg, rgba(246,244,241,0.18) 0%, rgba(246,244,241,0.78) 68%, #f6f4f1 100%)",
    },
  },
  classic: {
    id: "classic",
    name: "Classic",
    summary: "Tradicional y elegante.",
    palette: "Oscuro + beige",
    tokens: {
      bg: "#12100e",
      bg2: "#1b1814",
      bg3: "#221e19",
      card: "#1a1713",
      ink: "#f3ead9",
      muted: "#a39480",
      line: "rgba(243, 234, 217, 0.12)",
      accent: "#c4b59a",
      accent2: "#e0d3bb",
      accentInk: "#161310",
      heroOverlay: "linear-gradient(180deg, rgba(18,16,14,0.3) 0%, rgba(18,16,14,0.8) 70%, #12100e 100%)",
    },
  },
  modern: {
    id: "modern",
    name: "Modern",
    summary: "Tecnológica y contemporánea.",
    palette: "Colores personalizados",
    tokens: {
      bg: "#090d16",
      bg2: "#101624",
      bg3: "#172033",
      card: "#121a2a",
      ink: "#eef3ff",
      muted: "#93a0ba",
      line: "rgba(238, 243, 255, 0.1)",
      accent: "#7aa6ff",
      accent2: "#a8c6ff",
      accentInk: "#0b1020",
      heroOverlay: "linear-gradient(180deg, rgba(9,13,22,0.28) 0%, rgba(9,13,22,0.82) 70%, #090d16 100%)",
    },
  },
};

const THEME_STORAGE_KEY = "barber-studio-theme";

function getActiveThemeId() {
  return localStorage.getItem(THEME_STORAGE_KEY) || barberConfig.themeId;
}

function applyTheme(themeId) {
  const theme = barberThemes[themeId] || barberThemes.premium;
  const t = theme.tokens;
  const root = document.documentElement;
  root.dataset.theme = theme.id;
  root.style.setProperty("--bg", t.bg);
  root.style.setProperty("--bg-2", t.bg2);
  root.style.setProperty("--bg-3", t.bg3);
  root.style.setProperty("--card", t.card);
  root.style.setProperty("--ink", t.ink);
  root.style.setProperty("--muted", t.muted);
  root.style.setProperty("--line", t.line);
  root.style.setProperty("--accent", t.accent);
  root.style.setProperty("--accent-2", t.accent2);
  root.style.setProperty("--accent-ink", t.accentInk);
  root.style.setProperty("--gold", t.accent);
  root.style.setProperty("--gold-2", t.accent2);
  root.style.setProperty("--brass", t.accent);
  root.style.setProperty("--hero-overlay", t.heroOverlay);
  root.style.setProperty("--hero-image", `url("${barberConfig.images.hero}")`);
  root.style.setProperty("--booking-image", `url("${barberConfig.images.booking}")`);
  localStorage.setItem(THEME_STORAGE_KEY, theme.id);
  document.querySelectorAll("[data-theme-card]").forEach((card) => {
    card.classList.toggle("is-active", card.dataset.themeCard === theme.id);
  });
}

function applyBrand() {
  document.title = `${barberConfig.name} — Plataforma de reservas`;
  document.querySelectorAll("[data-brand-name]").forEach((el) => {
    el.textContent = barberConfig.name;
  });
  document.querySelectorAll("[data-brand-mark]").forEach((el) => {
    el.textContent = barberConfig.shortName;
  });
  document.querySelectorAll("[data-brand-tagline]").forEach((el) => {
    el.textContent = barberConfig.tagline;
  });
  document.querySelectorAll("[data-brand-owner]").forEach((el) => {
    el.textContent = barberConfig.owner.name;
  });
  document.querySelectorAll("[data-brand-role]").forEach((el) => {
    el.textContent = barberConfig.owner.role;
  });
  document.querySelectorAll("[data-brand-url]").forEach((el) => {
    el.textContent = barberConfig.bookingUrl;
  });
  const instagram = document.querySelector("[data-social='instagram']");
  const tiktok = document.querySelector("[data-social='tiktok']");
  if (instagram) instagram.href = barberConfig.socialLinks.instagram;
  if (tiktok) tiktok.href = barberConfig.socialLinks.tiktok;
}

window.barberConfig = barberConfig;
window.barberThemes = barberThemes;
window.applyTheme = applyTheme;
window.applyBrand = applyBrand;
window.getActiveThemeId = getActiveThemeId;
