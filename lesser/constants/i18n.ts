/**
 * constants/i18n.ts
 *
 * Centralised string definitions for all UI text.
 * To add a new language:
 *   1. Add a new key to `LANGUAGES` (e.g. 'fr', 'de')
 *   2. Duplicate the `en` object and translate every value
 *   3. Set `currentLanguage` or expose a setter via context
 *
 * Usage:
 *   import { t } from '@/constants/i18n';
 *   <Text>{t('home.streak')}</Text>
 */

type Strings = typeof en;

const en = {
  // ── Shared ──────────────────────────────────────────────
  app: {
    name: 'Lesser',
    version: 'v1.0.0',
    tagline: 'Use your phone less.',
  },
  common: {
    confirm: 'Confirm',
    cancel: 'Cancel',
    back: 'Back',
    save: 'Save',
    loading: 'Loading…',
    error: 'Something went wrong. Please try again.',
    seeAll: 'See all',
    today: 'Today',
    week: 'This week',
    month: 'This month',
    sixMonths: '6 months',
    year: '1 year',
    tapToChange: 'Tap to change →',
  },

  // ── Onboarding ──────────────────────────────────────────
  onboarding: {
    title: 'Choose Your Path',
    subtitle: 'Tap a mode to select it. You can always change this later in Settings.',
    confirmButton: 'Start with {{mode}} Mode',
    soft: {
      name: 'Soft',
      tagline: 'Awareness, not restriction.',
      description: 'Track your habits and build awareness without any hard blocks.',
      features: [
        'Daily screen time tracking',
        'Streak counter with goal',
        'Gentle daily reminders',
        'Social feed & friend progress',
        '30-day consistency calendar',
      ],
    },
    mid: {
      name: 'Mid',
      tagline: 'Active reduction.',
      description: 'Soft locks and warning screens nudge you off apps when you go over your daily goal.',
      features: [
        'All Soft features',
        'Warning screens on over-use',
        'Per-app daily limits',
        'Temporary app access cooldowns',
        'Leaderboard & top user badge',
      ],
    },
    hardcore: {
      name: 'Hardcore',
      tagline: 'Maximum enforcement.',
      description: 'Hard-locks, strict limits, and automatic accountability photos when you stare too long.',
      features: [
        'All Mid features',
        'Hard app locks — no override',
        'Auto photos when staring too long',
        'Photos shared to social feed',
        'Emergency unlock only via friend',
      ],
    },
  },

  // ── Auth ────────────────────────────────────────────────
  auth: {
    loginTitle: 'Welcome Back',
    registerTitle: 'Create Account',
    loginSubtitle: 'Log in to sync your reduction progress with friends.',
    registerSubtitle: 'Sign up to connect with friends and compete.',
    usernamePlaceholder: 'Username',
    passwordPlaceholder: 'Password',
    password: 'Password',
    loginButton: 'Log In',
    registerButton: 'Sign Up',
    switchToRegister: "Don't have an account? Sign up",
    switchToLogin: 'Already have an account? Log in',
    skipButton: 'Skip for now',
    fillAllFields: 'Please fill in all fields.',
    genericError: 'Something went wrong. Please try again.',
  },

  // ── Home ────────────────────────────────────────────────
  home: {
    greeting: 'Good job,',
    greetingGuest: 'Stranger',
    statsButton: 'Stats',
    streak: 'Current Streak',
    streakDays: '{{count}} days',
    streakDay: '1 day',
    streakGoal: 'achieving goal',
    badgeLegendary: 'Legendary 🏆',
    badgeFire: 'On Fire!',
    badgeGreat: 'Great going!',
    badgeKeepUp: 'Keep it up!',
    screenTime: 'Screen Time',
    screenTimeLabel: 'used in the last',
    screenTimeLast24h: 'last 24h',
    screenTimeLastWeek: 'last 7 days',
    screenTimeLastMonth: 'last 30 days',
    screenTimeLast6Months: 'last 6 months',
    onTrack: 'On Track',
    overQuota: 'Over Quota',
    topBadge: "You're in the top {{pct}}% of users!",
    timeSaved: 'Time Saved',
    timeSavedComparison: "That's enough to {{what}}",
    timeSavedToday: 'Today',
    timeSavedWeek: 'This week',
    timeSavedMonth: 'This month',
    consistencyMap: 'Consistency Map',
    moreUsage: 'More usage',
    lessUsage: 'Less usage',
    mostUsedApps: 'Most Used Apps',
    usageTime: '{{min}} min',
    comparisons: {
      nap: 'take a power nap 😴',
      film: 'watch a short film 🎬',
      book: 'read 50 pages of a book 📚',
      movie: 'binge a full movie 🍿',
      got: 'watch a Game of Thrones season 🐉',
      show: 'finish a whole Netflix show 📺',
    },
    usagePermissionTitle: 'App Usage Access Required',
    usagePermissionDesc: 'To display your real usage statistics, Lesser needs permission to read Android usage history.',
    grantPermissionBtn: 'Grant Permission',
  },

  // ── Social ──────────────────────────────────────────────
  social: {
    title: 'Social',
    shareProfile: 'Share Profile',
    shareCopied: 'Profile link copied!',
    shareMessage: 'Check out my profile on Lesser 👇\nlesser://profile/{{username}}',
    sharePopupTitle: 'Share your profile',
    sharePopupSubtitle: 'Invite friends to join and track your progress together.',
    sharePopupCopy: 'Copy Profile Link',
    sharePopupClose: 'Close',
    friends: 'Friends',
    addFriend: 'Add',
    followers: 'Followers',
    following: 'Following',
    follow: 'Follow',
    unfollow: 'Unfollow',
    feed: 'Activity Feed',
    streakBadge: '{{days}}d streak',
    noFriends: 'No friends yet. Add some!',
  },

  // ── Friend Profile ───────────────────────────────────────
  friendProfile: {
    title: 'Profile',
    streak: '🔥 {{days}} day streak',
    rank: 'Top {{pct}}% of users',
    youBetter: 'You use {{diff}}h less per day than {{name}} 🏆',
    theyBetter: '{{name}} uses {{diff}}h less per day than you 💪',
    comparison: '7-Day Comparison',
    headToHead: 'Head to Head',
    avgDaily: 'Avg daily usage',
    streakLabel: 'Streak',
    rankLabel: 'Ranking',
  },

  // ── Stats ───────────────────────────────────────────────
  stats: {
    title: 'Statistics',
    week: 'This Week',
    month: 'This Month',
    threeMonths: 'Last 3 Months',
    year: 'Last Year',
    savedThisWeek: 'This week you saved',
    savedHours: '{{h}} hours',
    watchEquivalent: "That's enough time to watch {{what}}",
    avgDaily: 'Avg daily',
    savedLabel: 'Saved this period',
    daysOnGoal: 'Days on goal',
    bestDay: 'Best day',
    goalLine: '{{h}}h goal',
    monthlySnapshot: 'Monthly Snapshot',
    savedThisMonth: 'saved this month',
    dayStreak: 'day streak',
    vsUsers: 'vs users',
    tapToCycle: 'Tap to cycle →',
  },

  // ── Followers ────────────────────────────────────────────
  followers: {
    title: 'Followers',
    searchPlaceholder: 'Search followers…',
    followerSingular: 'follower',
    followerPlural: 'followers',
    streakLabel: '🔥 {{days}} day streak',
    countSummary: '{{count}} {{noun}} · {{following}} following',
    noFollowers: 'No followers yet.',
    noResults: 'No results found.',
  },

  // ── Settings ─────────────────────────────────────────────
  settings: {
    title: 'Settings',
    version: 'IMPACKTHON 2026 — {{version}}',
    account: 'Account',
    memberSince: 'Member since 2026',
    guestLabel: 'Guest — not synced',
    changeUsername: 'Change Username',
    changePassword: 'Change Password',
    logOut: 'Log Out',
    logIn: 'Log In / Sign Up',
    appMode: 'App Mode',
    features: '{{n}} features',
    currentlyActive: 'Currently active',
    switchTo: 'Switch to {{mode}}',
    whitelist: 'App Whitelist',
    whitelistSubtitle: 'These apps are always accessible, even in Hardcore mode.',
    deleteAccount: 'Delete Account',
    deleteAccountTitle: 'Delete Account',
    deleteAccountConfirm: 'This action is permanent and cannot be undone. All your data will be deleted.',
    deleteAccountAction: 'Delete',
    deleteAccountPasswordHint: 'Enter your password to confirm account deletion.',
    deleteAccountError: 'Could not delete account. Please try again.',
    passwordRequired: 'Please enter your password.',
    silentNudge: 'Silent Nudge (Android)',
    silentNudgeDesc: 'Periodically mutes sound after long usage to discourage scrolling.',
    usageThreshold: 'Usage Threshold',
    usageThresholdMinutes: '{{minutes}} minutes',
    usageThresholdInfo: 'Starts nudging after this many minutes of foreground app use.',
  },
  wellbeing: {
    title: 'Digital Wellbeing',
    vpnTitle: 'Network Throttling',
    vpnSubtitle: 'Slows down blacklisted apps to discourage over-use. The delay increases progressively as you use the apps.',
    enableVpn: 'Enable Slow Mode 🐢',
    disableVpn: 'Disable Slow Mode',
    currentDelay: 'Current delay: {{ms}}ms',
    delayDescription: 'The artificial lag currently applied to network requests.',
  },
};

const es: Strings = {
  app: { name: 'Lesser', version: 'v1.0.0', tagline: 'Usa menos tu móvil.' },
  common: {
    confirm: 'Confirmar', cancel: 'Cancelar', back: 'Volver', save: 'Guardar',
    loading: 'Cargando…', error: 'Algo salió mal. Inténtalo de nuevo.',
    seeAll: 'Ver todo', today: 'Hoy', week: 'Esta semana', month: 'Este mes',
    sixMonths: '6 meses', year: '1 año',
    tapToChange: 'Toca para cambiar →',
  },
  onboarding: {
    title: 'Elige tu camino', subtitle: 'Toca un modo para seleccionarlo. Puedes cambiarlo en Ajustes.',
    confirmButton: 'Empezar en modo {{mode}}',
    soft: { name: 'Suave', tagline: 'Consciencia, no restricción.', description: 'Rastrea tus hábitos sin bloqueos.', features: ['Rastreo diario de uso', 'Contador de racha', 'Recordatorios suaves', 'Feed social', 'Calendario de 30 días'] },
    mid: { name: 'Medio', tagline: 'Reducción activa.', description: 'Bloqueos suaves cuando superas tu límite diario.', features: ['Todo lo de Suave', 'Pantallas de aviso', 'Límites por app', 'Enfriamientos de acceso', 'Tabla de clasificación'] },
    hardcore: { name: 'Extremo', tagline: 'Máxima aplicación.', description: 'Bloqueos duros y fotos automáticas si miras demasiado.', features: ['Todo lo de Medio', 'Bloqueos duros', 'Fotos automáticas', 'Fotos en el feed', 'Desbloqueo solo con amigo'] },
  },
  auth: {
    loginTitle: 'Bienvenido de vuelta', registerTitle: 'Crear cuenta',
    loginSubtitle: 'Inicia sesión para sincronizar tu progreso.', registerSubtitle: 'Regístrate para conectar con amigos.',
    usernamePlaceholder: 'Usuario', passwordPlaceholder: 'Contraseña',
    password: 'Contraseña',
    loginButton: 'Iniciar sesión', registerButton: 'Registrarse',
    switchToRegister: '¿No tienes cuenta? Regístrate', switchToLogin: '¿Ya tienes cuenta? Inicia sesión',
    skipButton: 'Saltar por ahora', fillAllFields: 'Por favor rellena todos los campos.',
    genericError: 'Algo salió mal. Inténtalo de nuevo.',
  },
  home: {
    greeting: '¡Buen trabajo,', greetingGuest: 'Desconocido', statsButton: 'Estadísticas',
    streak: 'Racha actual', streakDays: '{{count}} días', streakDay: '1 día', streakGoal: 'cumpliendo el objetivo',
    badgeLegendary: 'Legendario 🏆', badgeFire: '¡En racha!', badgeGreat: '¡Muy bien!', badgeKeepUp: '¡Sigue así!',
    screenTime: 'Tiempo de pantalla', screenTimeLabel: 'usado en', screenTimeLast24h: 'las últimas 24h',
    screenTimeLastWeek: 'los últimos 7 días', screenTimeLastMonth: 'los últimos 30 días', screenTimeLast6Months: 'los últimos 6 meses',
    onTrack: 'En objetivo', overQuota: 'Superado',
    topBadge: '¡Estás en el top {{pct}}% de usuarios!',
    timeSaved: 'Tiempo ahorrado', timeSavedComparison: 'Suficiente para {{what}}',
    timeSavedToday: 'Hoy', timeSavedWeek: 'Esta semana', timeSavedMonth: 'Este mes',
    consistencyMap: 'Mapa de consistencia', moreUsage: 'Más uso', lessUsage: 'Menos uso',
    mostUsedApps: 'Apps más usadas', usageTime: '{{min}} min',
    comparisons: { nap: 'echar una siesta 😴', film: 'ver un cortometraje 🎬', book: 'leer 50 páginas 📚', movie: 'ver una película entera 🍿', got: 'ver una temporada de Juego de Tronos 🐉', show: 'terminar una serie de Netflix 📺' },
    usagePermissionTitle: 'Permiso de uso requerido',
    usagePermissionDesc: 'Para mostrar tus estadísticas reales de cada app, Lesser necesita permiso para leer el historial de uso de Android.',
    grantPermissionBtn: 'Conceder permiso',
  },
  social: {
    title: 'Social', shareProfile: 'Compartir perfil', shareCopied: '¡Enlace de perfil copiado!',
    shareMessage: 'Mira mi perfil en Lesser 👇\nlesser://profile/{{username}}',
    sharePopupTitle: 'Comparte tu perfil',
    sharePopupSubtitle: 'Invita a amigos a unirse y seguir vuestro progreso juntos.',
    sharePopupCopy: 'Copiar enlace de perfil',
    sharePopupClose: 'Cerrar',
    friends: 'Amigos', addFriend: 'Añadir', followers: 'Seguidores', following: 'Siguiendo',
    follow: 'Seguir', unfollow: 'Dejar de seguir', feed: 'Feed de actividad',
    streakBadge: '{{days}}d de racha', noFriends: 'Sin amigos aún. ¡Añade alguno!',
  },
  friendProfile: {
    title: 'Perfil', streak: '🔥 Racha de {{days}} días', rank: 'Top {{pct}}% de usuarios',
    youBetter: 'Tú usas {{diff}}h menos al día que {{name}} 🏆',
    theyBetter: '{{name}} usa {{diff}}h menos al día que tú 💪',
    comparison: 'Comparativa 7 días', headToHead: 'Cara a cara',
    avgDaily: 'Uso diario medio', streakLabel: 'Racha', rankLabel: 'Clasificación',
  },
  stats: {
    title: 'Estadísticas', week: 'Esta semana', month: 'Este mes', threeMonths: 'Últimos 3 meses', year: 'Último año',
    savedThisWeek: 'Esta semana has ahorrado', savedHours: '{{h}} horas',
    watchEquivalent: 'Suficiente para ver {{what}}',
    avgDaily: 'Media diaria', savedLabel: 'Ahorrado en el período', daysOnGoal: 'Días en objetivo', bestDay: 'Mejor día',
    goalLine: 'Objetivo {{h}}h', monthlySnapshot: 'Resumen mensual',
    savedThisMonth: 'ahorrado este mes', dayStreak: 'días de racha', vsUsers: 'vs usuarios', tapToCycle: 'Toca para cambiar →',
  },
  followers: {
    title: 'Seguidores',
    searchPlaceholder: 'Buscar seguidores…',
    followerSingular: 'seguidor',
    followerPlural: 'seguidores',
    streakLabel: '🔥 {{days}} días de racha',
    countSummary: '{{count}} {{noun}} · {{following}} siguiendo',
    noFollowers: 'Aún no tienes seguidores.',
    noResults: 'Sin resultados.',
  },
  settings: {
    title: 'Ajustes', version: 'IMPACKTHON 2026 — {{version}}',
    account: 'Cuenta', memberSince: 'Miembro desde 2026', guestLabel: 'Invitado — no sincronizado',
    changeUsername: 'Cambiar usuario', changePassword: 'Cambiar contraseña', logOut: 'Cerrar sesión', logIn: 'Iniciar sesión / Registrarse',
    appMode: 'Modo de la app', features: '{{n}} funciones', currentlyActive: 'Activo actualmente', switchTo: 'Cambiar a {{mode}}',
    whitelist: 'Lista blanca de apps', whitelistSubtitle: 'Estas apps son siempre accesibles, incluso en modo Extremo.',
    deleteAccount: 'Eliminar cuenta',
    deleteAccountTitle: 'Eliminar cuenta',
    deleteAccountConfirm: 'Esta acción es permanente e irreversible. Todos tus datos serán eliminados.',
    deleteAccountAction: 'Eliminar',
    deleteAccountPasswordHint: 'Introduce tu contraseña para confirmar la eliminación de la cuenta.',
    deleteAccountError: 'No se pudo eliminar la cuenta. Inténtalo de nuevo.',
    passwordRequired: 'Por favor introduce tu contraseña.',
    silentNudge: 'Empujón Silencioso (Android)',
    silentNudgeDesc: 'Silencia el sonido periódicamente tras un uso prolongado.',
    usageThreshold: 'Límite de Uso',
    usageThresholdMinutes: '{{minutes}} minutos',
    usageThresholdInfo: 'El empujón comienza tras estos minutos de uso.',
  },
  wellbeing: {
    title: 'Bienestar Digital',
    vpnTitle: 'Ralentización de Red',
    vpnSubtitle: 'Ralentiza las apps en la lista negra para desincentivar el uso excesivo. El retraso aumenta progresivamente con el uso.',
    enableVpn: 'Activar Modo Lento 🐢',
    disableVpn: 'Desactivar Modo Lento',
    currentDelay: 'Retraso actual: {{ms}}ms',
    delayDescription: 'El lag artificial aplicado actualmente a las peticiones de red.',
  },
};

const LANGUAGES: Record<string, Strings> = { en, es };

// Current language — change this to switch the whole UI
let currentLanguage = 'es';

export function setLanguage(lang: string) {
  if (LANGUAGES[lang]) currentLanguage = lang;
}

export function getLanguage(): string {
  return currentLanguage;
}

/**
 * Translate a dot-notated key, optionally replacing {{placeholder}} tokens.
 * Example: t('home.streak'), t('settings.features', { n: 5 })
 */
export function t(key: string, params?: Record<string, string | number>): string {
  const strings = LANGUAGES[currentLanguage] ?? en;
  const keys = key.split('.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let value: any = strings;
  for (const k of keys) {
    value = value?.[k];
    if (value === undefined) {
      // Fallback to English
      let fb: any = en;
      for (const fk of keys) fb = fb?.[fk];
      value = fb ?? key;
      break;
    }
  }
  if (typeof value !== 'string') return key;
  if (!params) return value;
  return Object.entries(params).reduce(
    (str, [k, v]) => str.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v)),
    value,
  );
}
