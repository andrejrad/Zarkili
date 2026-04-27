import type { SupportedLanguage } from "./types";

type HandoffStrings = {
  welcome: {
    tagline: string;
    title: string;
    description: string;
    ctaPrimary: string;
    ctaSecondary: string;
  };
  auth: {
    loginBody: string;
    registerBody: string;
    emailLabel: string;
    passwordLabel: string;
  };
  home: {
    greeting: string;
    bannerTitle: string;
    bannerDescription: string;
    bannerCta: string;
    categoriesTitle: string;
    featuredTitle: string;
    featuredViewAll: string;
    recentBookingsTitle: string;
    notifications: string;
    notificationsWithCount: string;
  };
  explore: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    filterButton: string;
    resultsCount: string;
    resultsCountZero: string;
  };
  categories: Record<string, string>;
  salonCard: {
    member: string;
    from: string;
    messagingDisabled: string;
  };
};

const en: HandoffStrings = {
  welcome: {
    tagline: "Your beauty, delivered",
    title: "Discover beauty services near you",
    description: "Book appointments with top-rated salons and beauty professionals in your area",
    ctaPrimary: "Get Started",
    ctaSecondary: "Already have an account? Sign In",
  },
  auth: {
    loginBody: "Continue into the early access build with the current dev authentication path.",
    registerBody: "Create your account and continue into the current development build.",
    emailLabel: "Email",
    passwordLabel: "Password",
  },
  home: {
    greeting: "Hello, {firstName}",
    bannerTitle: "First booking discount",
    bannerDescription: "Get 20% off your first appointment",
    bannerCta: "Book Now",
    categoriesTitle: "Browse by category",
    featuredTitle: "Featured salons",
    featuredViewAll: "View All",
    recentBookingsTitle: "Recent bookings",
    notifications: "Notifications",
    notificationsWithCount: "Notifications, {count} unread",
  },
  explore: {
    title: "Explore",
    subtitle: "Main discovery screen for salons and services.",
    searchPlaceholder: "Search services, salons...",
    filterButton: "Filters",
    resultsCount: "{count} salons found",
    resultsCountZero: "No salons found",
  },
  categories: {
    all: "All",
    nails: "Nails",
    hair: "Hair",
    skin: "Skin",
    lashes: "Lashes",
    brows: "Brows",
    massage: "Massage",
    makeup: "Makeup",
    barber: "Barber",
    waxing: "Waxing",
    spa: "Spa",
    injectables: "Injectables",
    wellness: "Wellness",
  },
  salonCard: {
    member: "Member",
    from: "From",
    messagingDisabled: "This salon has not enabled messaging yet. You can still call them directly for any questions.",
  },
};

const hr: HandoffStrings = {
  welcome: {
    tagline: "Tvoja ljepota, dostavljena",
    title: "Otkrij beauty usluge u svojoj blizini",
    description: "Rezerviraj termine kod najbolje ocijenjenih salona i beauty profesionalaca u svojoj blizini",
    ctaPrimary: "Zapocni",
    ctaSecondary: "Vec imas racun? Prijavi se",
  },
  auth: {
    loginBody: "Nastavi u early access build preko trenutnog development auth toka.",
    registerBody: "Kreiraj racun i nastavi u trenutni development build.",
    emailLabel: "Email",
    passwordLabel: "Lozinka",
  },
  home: {
    greeting: "Bok, {firstName}",
    bannerTitle: "Popust za prvu rezervaciju",
    bannerDescription: "Ostvari 20% popusta na svoj prvi termin",
    bannerCta: "Rezerviraj",
    categoriesTitle: "Pregledaj po kategoriji",
    featuredTitle: "Istaknuti saloni",
    featuredViewAll: "Pogledaj sve",
    recentBookingsTitle: "Nedavne rezervacije",
    notifications: "Obavijesti",
    notificationsWithCount: "Obavijesti, {count} neprocitanih",
  },
  explore: {
    title: "Explore",
    subtitle: "Glavni ekran za otkrivanje salona i usluga.",
    searchPlaceholder: "Pretrazi usluge, salone...",
    filterButton: "Filteri",
    resultsCount: "{count} salona pronadeno",
    resultsCountZero: "Nema pronadenih salona",
  },
  categories: {
    all: "Sve",
    nails: "Nokti",
    hair: "Kosa",
    skin: "Koza",
    lashes: "Trepavice",
    brows: "Obrve",
    massage: "Masaza",
    makeup: "Sminka",
    barber: "Barber",
    waxing: "Depilacija",
    spa: "Spa",
    injectables: "Estetski tretmani",
    wellness: "Wellness",
  },
  salonCard: {
    member: "Member",
    from: "Od",
    messagingDisabled: "Ovaj salon jos nema ukljuceno dopisivanje. I dalje ih mozes nazvati za pitanja.",
  },
};

const es: HandoffStrings = {
  welcome: {
    tagline: "Tu belleza, a domicilio",
    title: "Descubre servicios de belleza cerca de ti",
    description: "Reserva citas con salones y profesionales de belleza mejor valorados en tu zona",
    ctaPrimary: "Empezar",
    ctaSecondary: "Ya tienes cuenta? Inicia sesion",
  },
  auth: {
    loginBody: "Continua al build de acceso temprano usando la ruta actual de autenticacion de desarrollo.",
    registerBody: "Crea tu cuenta y continua al build actual de desarrollo.",
    emailLabel: "Correo",
    passwordLabel: "Contrasena",
  },
  home: {
    greeting: "Hola, {firstName}",
    bannerTitle: "Descuento en tu primera reserva",
    bannerDescription: "Consigue 20% de descuento en tu primera cita",
    bannerCta: "Reservar",
    categoriesTitle: "Explorar por categoria",
    featuredTitle: "Salones destacados",
    featuredViewAll: "Ver todo",
    recentBookingsTitle: "Reservas recientes",
    notifications: "Notificaciones",
    notificationsWithCount: "Notificaciones, {count} sin leer",
  },
  explore: {
    title: "Explorar",
    subtitle: "Pantalla principal para descubrir salones y servicios.",
    searchPlaceholder: "Buscar servicios, salones...",
    filterButton: "Filtros",
    resultsCount: "{count} salones encontrados",
    resultsCountZero: "No se encontraron salones",
  },
  categories: {
    all: "Todo",
    nails: "Unas",
    hair: "Cabello",
    skin: "Piel",
    lashes: "Pestanas",
    brows: "Cejas",
    massage: "Masaje",
    makeup: "Maquillaje",
    barber: "Barberia",
    waxing: "Depilacion",
    spa: "Spa",
    injectables: "Inyectables",
    wellness: "Wellness",
  },
  salonCard: {
    member: "Member",
    from: "Desde",
    messagingDisabled: "Este salon aun no ha activado la mensajeria. Aun puedes llamar directamente para cualquier consulta.",
  },
};

const handoffStringsByLanguage: Record<SupportedLanguage, HandoffStrings> = {
  en,
  hr,
  es,
};

export function getHandoffStrings(language: SupportedLanguage): HandoffStrings {
  return handoffStringsByLanguage[language] ?? handoffStringsByLanguage.en;
}

export function interpolateHandoffString(template: string, params?: Record<string, string>): string {
  if (!params) {
    return template;
  }

  return Object.entries(params).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, value),
    template
  );
}