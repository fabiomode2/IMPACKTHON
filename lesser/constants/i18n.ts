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
    close: 'Close',
    justNow: 'Just now',
    now: 'Now',
    agoMinutes: '{{n}}m ago',
    agoHours: '{{n}}h ago',
    agoDays: '{{n}}d ago',
    guest: 'Stranger',
  },

  // ── Onboarding ──────────────────────────────────────────
  onboarding: {
    title: 'Choose Your Path',
    subtitle: 'Tap a mode to select it. You can always change this later in Settings.',
    confirmButton: 'Start with {{mode}} Mode',
    soft: {
      name: 'Soft',
      tagline: 'Gentle discouragement.',
      description: 'Add subtle friction to your phone usage to break the habit.',
      features: [
        'Random periods of sound loss',
        'Internet speed throttling',
      ],
    },
    mid: {
      name: 'Mid',
      tagline: 'Active interference.',
      description: 'More noticeable interventions to keep you off your phone.',
      features: [
        'All Soft features',
        'Screen flickering',
        'Progression to monochrome palette',
      ],
    },
    hardcore: {
      name: 'Hardcore',
      tagline: 'Maximum enforcement.',
      description: 'Aggressive measures to ensure you stop using your device.',
      features: [
        'All Mid features',
        'Unannounced selfies to catch bad postures',
        'Minimalist system launcher (Coming soon)',
      ],
    },
  },

  // ── Auth ────────────────────────────────────────────────
  auth: {
    loginTitle: 'Welcome Back',
    registerTitle: 'Create Account',
    loginSubtitle: 'Log in to sync your reduction progress with friends.',
    registerSubtitle: 'Sign up to connect with friends and compete.',
    usernameLabel: 'Username',
    usernamePlaceholder: '',
    passwordLabel: 'Password',
    passwordPlaceholder: '',
    loginButton: 'Log In',
    registerButton: 'Sign Up',
    switchToRegister: "Don't have an account? ",
    switchToLogin: 'Already have an account? ',
    skipButton: 'Skip for now',
    fillAllFields: 'Please fill in all fields.',
    genericError: 'Something went wrong. Please try again.',
    errorUsernameShort: 'Username must be at least 3 characters.',
    errorUsernameInvalid: 'Username can only contain letters, numbers, and underscores.',
    errorUsernameTaken: 'This username is already taken.',
    errorPasswordShort: 'Password must be at least 6 characters.',
    errorUserNotFound: 'User not found.',
    errorWrongPassword: 'Incorrect password.',
    errorInvalidCredential: 'Invalid credentials.',
    errorTooManyRequests: 'Too many attempts. Please try again later.',
    errorNetworkFailed: 'Network error. Please check your connection.',
    errorRecentLogin: 'Please log out and log in again before this action.',
    errorInvalidEmail: 'Invalid username format.',
    errorPermissionDenied: 'Permission denied.',
  },

  // ── Home ────────────────────────────────────────────────
  home: {
    title: 'Home',
    stats: 'Statistics',
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
    activateStats: 'Activate Statistics',
    activateStatsDesc: 'Lesser needs "Usage Access" to measure your screen time. Tap here to enable it in Settings.',
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
    mockMessage: 'Keeping the focus at max.',
    agoHours: '{{n}} hours ago',
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
    topPercentage: 'Top {{pct}}%',
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
    days: {
      mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun',
    },
    invite: 'Invite',
    shareTitle: 'Share your progress',
    shareSubtitle: 'Invite others to follow your streak and get motivated together.',
    sendWhatsApp: 'Send via WhatsApp / More',
    copied: 'Copied!',
    followers: 'Followers',
    following: 'Following',
    sharePopupTitleNative: 'Share Lesser Profile',
    shareMessageNative: 'Join my challenge on Lesser! Follow me to see my progress reducing screen time: {{link}}',
    shareMessageFriend: 'Check out @{{username}}\'s progress on Lesser. Let\'s be disciplined together! {{link}}',
    weekLabel: 'W{{n}}',
    resultsFound: '{{count}} results',
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
    searching: 'Searching...',
    noFollowing: 'Not following anyone yet.',
  },

  // ── Settings ─────────────────────────────────────────────
  settings: {
    title: 'Settings',
    version: 'IMPACKTHON 2026 — {{version}}',
    account: 'Account',
    memberSince: 'Member since 2026',
    guestLabel: 'Guest — not synced',
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
    language: 'Language',
    english: 'English',
    spanish: 'Spanish',
    goal: 'Daily Goal',
    timeLimit: 'Time Limit',
    adjustGoal: 'Adjust your goal (affects streak)',
    whitelistTitle: 'Whitelisted Apps',
    whitelistHelper: 'These apps will not be affected by screen time limitations.',
    deleteConfirmTitle: 'Final Confirmation',
    deleteConfirmDesc: 'This action CANNOT be undone. Your followers, following, posts and profile will be deleted forever.',
    deletePermanently: 'DELETE PERMANENTLY',
    deleteSureTitle: 'Are you sure?',
    deleteSureSubtitle: 'This action will permanently delete all your presence in Lesser.',
    deleteLoseTitle: 'You will lose forever:',
    deleteLose1: 'Your profile and username',
    deleteLose2: 'All your followers and following',
    deleteLose3: 'All your activity history and posts',
    deleteLose4: 'Statistics comparisons with friends',
    deleteLabelPassword: 'Confirm Password',
    deletePlaceholderPassword: 'Write your password',
    deleteLabelConfirmText: 'Type {{text}}',
    deleteConfirmValue: 'DELETE MY ACCOUNT',
    deleteCancel: 'Not now, go back',
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
  // ── AI ──────────────────────────────────────────────────
  ai: {
    systemInstructionMotivational: `
### ROLE
You are an elite Digital Wellbeing Analyst and Productivity Coach for the 'Lesser' app.

### OBJECTIVE
Analyze the user's real phone usage data and provide a motivating, professional, and data-driven diagnosis.

### TONE & STYLE
- Professional, elegant, and empowering.
- Use sophisticated but accessible language.
- Avoid boring clichés; look for powerful intellectual comparisons.
- No hashtags. Minimal emojis (max 1).
`,
    systemInstructionSocial: `
### ROLE
You are an ultra-positive and modern support community. 

### TASK
Your goal is to encourage a friend who has achieved a digital detox milestone.
Use "hype" language but with class. 

### CONSTRAINTS
- English.
- Maximum 15 words.
- Focus on the value of time gained.
`,
    fallbackMotivational: 'Top {{pct}}% with {{saved}}h saved. Your discipline is real!',
    fallbackSocial: 'Amazing progress! The time you reclaim today is the freedom of tomorrow.',
    promptMotivational: `
### USER DATA
<context>
  <username>{{username}}</username>
  <mode>{{mode}}</mode>
  <streak>{{streak}} days</streak>
  <usage_24h>{{usage24h}}h</usage_24h>
  <daily_goal>{{goal}}h</daily_goal>
  <saved_week>{{savedWeek}}h</saved_week>
  <ranking>Top {{ranking}}%</ranking>
</context>

### APP DETAILS
<app_usages>
{{appsXml}}
</app_usages>

### TASK
Generate a reflection of 35-45 words. 
1. Analyze if the technical goal of {{usage24h}}h vs {{goal}}h was met.
2. Mention a specific app from the list.
3. Compare the weekly savings with a high intellectual or recreational value activity.
`,
    promptSocial: `Congratulate <friend>{{friendName}}</friend> for their achievement of <type>{{type}}</type> with a value of <value>{{value}}</value>.`,
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
    close: 'Cerrar',
    justNow: 'Justo ahora',
    now: 'Ahora',
    agoMinutes: 'Hace {{n}}m',
    agoHours: 'Hace {{n}}h',
    agoDays: 'Hace {{n}}d',
    guest: 'Desconocido',
  },
  auth: {
    loginTitle: 'Bienvenido de vuelta', registerTitle: 'Crear cuenta',
    loginSubtitle: 'Inicia sesión para sincronizar tu progreso.', registerSubtitle: 'Regístrate para conectar con amigos.',
    usernameLabel: 'Usuario',
    usernamePlaceholder: '',
    passwordLabel: 'Contraseña',
    passwordPlaceholder: '',
    loginButton: 'Iniciar sesión', registerButton: 'Registrarse',
    switchToRegister: '¿No tienes cuenta? ', switchToLogin: '¿Ya tienes cuenta? ',
    skipButton: 'Saltar por ahora', fillAllFields: 'Por favor rellena todos los campos.',
    genericError: 'Algo salió mal. Inténtalo de nuevo.',
    errorUsernameShort: 'El nombre de usuario debe tener al menos 3 caracteres.',
    errorUsernameInvalid: 'El nombre de usuario solo puede contener letras, números y guiones bajos.',
    errorUsernameTaken: 'Este nombre de usuario ya está ocupado.',
    errorPasswordShort: 'La contraseña debe tener al menos 6 caracteres.',
    errorUserNotFound: 'Usuario no encontrado.',
    errorWrongPassword: 'Contraseña incorrecta.',
    errorInvalidCredential: 'Credenciales inválidas.',
    errorTooManyRequests: 'Demasiados intentos. Prueba más tarde.',
    errorNetworkFailed: 'Error de red. Revisa tu conexión.',
    errorRecentLogin: 'Cierra sesión e inicia de nuevo antes de esta acción.',
    errorInvalidEmail: 'Nombre de usuario inválido.',
    errorPermissionDenied: 'Error de permisos.',
  },
  onboarding: {
    title: 'Elige tu camino', subtitle: 'Toca un modo para seleccionarlo. Puedes cambiarlo en Ajustes.',
    confirmButton: 'Empezar en modo {{mode}}',
    soft: {
      name: 'Soft',
      tagline: 'Disuasión suave.',
      description: 'Añade fricción sutil al uso del móvil para romper el hábito.',
      features: [
        'Periodos aleatorios donde se pierde el sonido',
        'Ralentización de la velocidad del internet para disminuir la frecuencia de carga de contenido',
      ],
    },
    mid: {
      name: 'Mid',
      tagline: 'Interferencia activa.',
      description: 'Intervenciones más notables para mantenerte alejado del móvil.',
      features: [
        'Todo lo de Soft',
        'Parpadeo de pantalla',
        'Progresión a una gama monocroma',
      ],
    },
    hardcore: {
      name: 'Hardcore',
      tagline: 'Máxima aplicación.',
      description: 'Medidas agresivas para asegurar que dejes de usar tu dispositivo.',
      features: [
        'Todo lo de Mid',
        'Realización de un selfie sin avisar donde se pille al usuario en una posición poco óptima',
        'Launcher de sistema minimalista (futuro)',
      ],
    },
  },
  home: {
    title: 'Inicio',
    stats: 'Estadísticas',
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
    activateStats: 'Activar Estadísticas',
    activateStatsDesc: 'Lesser necesita "Acceso de uso" para medir tu tiempo de pantalla. Toca aquí para activarlo en Ajustes.',
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
    mockMessage: 'Manteniendo el enfoque a tope.',
    agoHours: 'Hace {{n}} horas',
  },
  friendProfile: {
    title: 'Perfil', streak: '🔥 Racha de {{days}} días', rank: 'Top {{pct}}% de usuarios',
    youBetter: 'Tú usas {{diff}}h menos al día que {{name}} 🏆',
    theyBetter: '{{name}} usa {{diff}}h menos al día que tú 💪',
    comparison: 'Comparativa 7 días', headToHead: 'Cara a cara',
    avgDaily: 'Uso diario medio', streakLabel: 'Racha', rankLabel: 'Clasificación',
    topPercentage: 'Top {{pct}}% de usuarios',
  },
  stats: {
    title: 'Estadísticas', week: 'Esta semana', month: 'Este mes', threeMonths: 'Últimos 3 meses', year: 'Último año',
    savedThisWeek: 'Esta semana has ahorrado', savedHours: '{{h}} horas',
    watchEquivalent: 'Suficiente para ver {{what}}',
    avgDaily: 'Media diaria', savedLabel: 'Ahorrado en el período', daysOnGoal: 'Días en objetivo', bestDay: 'Mejor día',
    goalLine: 'Objetivo {{h}}h', monthlySnapshot: 'Resumen mensual',
    savedThisMonth: 'ahorrado este mes', dayStreak: 'días de racha', vsUsers: 'vs usuarios', tapToCycle: 'Toca para cambiar →',
    days: {
      mon: 'L', tue: 'M', wed: 'X', thu: 'J', fri: 'V', sat: 'S', sun: 'D'
    },
    invite: 'Invitar',
    shareTitle: 'Comparte tu progreso',
    shareSubtitle: 'Invita a otros a seguir tu racha y motivarse juntos.',
    sendWhatsApp: 'Enviar por WhatsApp / Más',
    copied: '¡Copiado!',
    followers: 'Seguidores',
    following: 'Siguiendo',
    sharePopupTitleNative: 'Compartir Perfil de Lesser',
    shareMessageNative: '¡Únete a mi reto en Lesser! Sígueme para ver mi progreso reduciendo el tiempo de pantalla: {{link}}',
    shareMessageFriend: 'Mira el progreso de @{{username}} en Lesser. ¡Vamos a ser disciplinados juntos! {{link}}',
    weekLabel: 'S{{n}}',
    resultsFound: '{{count}} resultados',
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
    searching: 'Buscando...',
    noFollowing: 'No sigues a nadie todavía.',
  },
  settings: {
    title: 'Ajustes', version: 'IMPACKTHON 2026 — {{version}}',
    account: 'Cuenta', memberSince: 'Miembro desde 2026', guestLabel: 'Invitado — no sincronizado',
    logOut: 'Cerrar sesión', logIn: 'Iniciar sesión / Registrarse',
    appMode: 'Modo de la app', features: '{{n}} funciones', currentlyActive: 'Activo actualmente', switchTo: 'Cambiar a {{mode}}',
    whitelist: 'Lista blanca de apps', whitelistSubtitle: 'Estas apps son siempre accesibles, incluso en modo Hardcore.',
    deleteAccount: 'Eliminar cuenta',
    deleteAccountTitle: 'Eliminar cuenta',
    deleteAccountConfirm: 'Esta acción es permanente e irreversible. Todos tus datos serán eliminados.',
    deleteAccountAction: 'Eliminar',
    deleteAccountPasswordHint: 'Introduce tu contraseña para confirmar la eliminación de la cuenta.',
    deleteAccountError: 'No se pudo eliminar la cuenta. Inténtalo de nuevo.',
    passwordRequired: 'Por favor introduce tu contraseña.',
    silentNudge: 'Nudge Silencioso (Android)',
    silentNudgeDesc: 'Silencia el sonido periódicamente tras un uso prolongado.',
    usageThreshold: 'Límite de Uso',
    usageThresholdMinutes: '{{minutes}} minutos',
    usageThresholdInfo: 'El empujón comienza tras estos minutos de uso.',
    language: 'Idioma',
    english: 'Inglés',
    spanish: 'Español',
    goal: 'Objetivo Diario',
    timeLimit: 'Límite de tiempo',
    adjustGoal: 'Ajusta tu meta (influye en la racha)',
    whitelistTitle: 'Aplicaciones Permitidas',
    whitelistHelper: 'Estas aplicaciones no se verán afectadas por las limitaciones de tiempo.',
    deleteConfirmTitle: 'Confirmación Final',
    deleteConfirmDesc: 'Esta acción NO se puede deshacer. Se borrarán tus seguidores, seguidos, posts y perfil para siempre.',
    deletePermanently: 'ELIMINAR PERMANENTEMENTE',
    deleteSureTitle: '¿Estás seguro?',
    deleteSureSubtitle: 'Esta acción borrará permanentemente toda tu presencia en Lesser.',
    deleteLoseTitle: 'Perderás para siempre:',
    deleteLose1: 'Tu perfil y nombre de usuario',
    deleteLose2: 'Todos tus seguidores y personas que sigues',
    deleteLose3: 'Todo tu historial de actividad y posts',
    deleteLose4: 'Comparaciones de estadísticas con amigos',
    deleteLabelPassword: 'Confirmar Contraseña',
    deletePlaceholderPassword: 'Escribe tu contraseña',
    deleteLabelConfirmText: 'Escribe {{text}}',
    deleteConfirmValue: 'ELIMINAR MI CUENTA',
    deleteCancel: 'Mejor no, volver atrás',
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
  ai: {
    systemInstructionMotivational: `
### ROLE
Eres un Analista de Bienestar Digital de élite y Coach de Productividad para la aplicación 'Lesser'.

### OBJECTIVE
Analizar los datos reales de uso de móvil del usuario y proporcionar un diagnóstico motivador, profesional y basado en datos.

### TONE & STYLE
- Profesional, elegante y empoderador.
- Usa un lenguaje sofisticado pero accesible (Español de España).
- Evita clichés aburridos; busca comparaciones intelectuales potentes.
- Sin hashtags. Emojis mínimos (máximo 1).
`,
    systemInstructionSocial: `
### ROLE
Eres una comunidad de apoyo ultra-positiva y moderna. 

### TASK
Tu objetivo es animar a un amigo que ha logrado un hito de desintoxicación digital.
Usa un lenguaje tipo "hype" pero con clase. 

### CONSTRAINTS
- Español de España.
- Máximo 15 palabras.
- Enfoque en el valor del tiempo ganado.
`,
    fallbackMotivational: 'Top {{pct}}% con {{saved}}h ahorradas. ¡Tu disciplina es real!',
    fallbackSocial: '¡Has ahorrado lo suficiente para verte la 1º temporada de True Detective!',
    promptMotivational: `
### DATOS DEL USUARIO
<context>
  <username>{{username}}</username>
  <mode>{{mode}}</mode>
  <streak>{{streak}} días</streak>
  <usage_24h>{{usage24h}}h</usage_24h>
  <daily_goal>{{goal}}h</daily_goal>
  <saved_week>{{savedWeek}}h</saved_week>
  <ranking>Top {{ranking}}%</ranking>
</context>

### DETALLES DE APPS
<app_usages>
{{appsXml}}
</app_usages>

### TAREA
Genera una reflexión de 35-45 palabras. 
1. Analiza si ha cumplido su meta técnica ({{usage24h}}h vs {{goal}}h).
2. Menciona una app específica del listado.
3. Compara el ahorro semanal con una actividad de alto valor intelectual o recreativa.
`,
    promptSocial: `Felicita a <friend>{{friendName}}</friend> por su logro de <type>{{type}}</type> con valor de <value>{{value}}</value>.`,
  },
};

const LANGUAGES: Record<string, Strings> = { en, es };

// Only Spanish supported now.
let currentLanguage = 'es';

export function setLanguage(lang: string) {
  // Logic disabled - only 'es' is allowed
  currentLanguage = 'es';
}

export function getLanguage(): string {
  return 'es';
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
  if (typeof value !== 'string') return value ?? key;
  if (!params) return value;
  return Object.entries(params).reduce(
    (str, [k, v]) => str.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v)),
    value,
  );
}
