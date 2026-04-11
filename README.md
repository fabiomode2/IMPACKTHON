<p align="center">
  <img src="lesser/assets/images/icon.png" alt="Lesser Logo" width="100" />
</p>

<h1 align="center">Lesser 📱</h1>

<p align="center">
  <strong>Use your phone less. Live more.</strong><br/>
  A React Native + Firebase app helping you track, reduce, and compete over your screen time.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Expo-54-blue?logo=expo" />
  <img src="https://img.shields.io/badge/Firebase-Firestore%20%7C%20Auth%20%7C%20Functions-orange?logo=firebase" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript" />
  <img src="https://img.shields.io/badge/license-MIT-green" />
</p>

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔥 **Streak tracking** | Daily streaks with goal comparison |
| 📊 **Usage analytics** | Cycling charts: 24h → week → month → 6 months |
| 👥 **Social feed** | Follow friends, see their progress in real-time |
| 🏆 **Leaderboard** | Compete with top % of users |
| 📅 **Consistency Map** | GitHub-style heatmap of your daily usage |
| 🌍 **i18n** | Full English & Spanish support |
| 🔐 **Firebase Auth** | Secure username + password login |
| 🌙 **Dark mode** | Automatic system-level theming |
| 🎯 **3 challenge modes** | Soft 🌿 · Mid 🛡️ · Hardcore 🔥 |
| 🔒 **Production security** | Firestore Security Rules + Cloud Functions |

---

## 🗂 Repository Structure

```
IMPACKTHON/
├── .env.example                  # Template for EXPO_PUBLIC_ environment variables
├── .gitignore
├── README.md
│
├── backend/                      # Firebase project root
│   ├── .firebaserc               # Active Firebase project
│   ├── firebase.json             # Firestore + Functions config
│   ├── firestore.rules           # Production security rules
│   ├── firestore.indexes.json    # Composite indexes
│   ├── README.md
│   └── functions/
│       ├── package.json          # TypeScript build scripts
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts          # Entry point — exports all functions
│           ├── users.ts          # onUserDeleted → clean up Firestore data
│           └── social.ts         # onFollowUser / onUnfollowUser callables
│
└── lesser/                       # Expo / React Native app
    ├── app/                      # Expo Router screens
    │   ├── (tabs)/               # Bottom-tab screens (Home, Social, Settings)
    │   ├── _layout.tsx
    │   ├── auth.tsx              # Login / Register
    │   ├── onboarding.tsx        # First-time mode selection
    │   ├── stats.tsx             # Detailed statistics
    │   ├── followers.tsx         # Follower list (real-time Firestore)
    │   ├── friend/[uid].tsx      # Friend profile view
    │   └── modal.tsx
    │
    ├── components/
    │   ├── home/
    │   ├── settings/
    │   │   └── AccountSection.tsx  # Delete account + settings UI
    │   ├── social/
    │   └── ui/
    │
    ├── constants/
    │   ├── firebase.config.ts    # Public Firebase client config (safe to commit)
    │   ├── i18n.ts               # All UI strings (EN + ES), t() helper
    │   └── theme.ts              # Colour tokens (light / dark)
    │
    ├── hooks/
    │   ├── useAuth.tsx           # Firebase Auth context + state
    │   ├── useSocial.ts          # Follow/unfollow with real-time listeners
    │   └── use-color-scheme.ts
    │
    └── services/
        ├── firebase.ts           # Firebase initialisation (reads EXPO_PUBLIC_ env)
        ├── auth.ts               # Login / Register / Logout / DeleteAccount
        ├── social.ts             # Firestore follow/unfollow, feed, search
        ├── settings.ts           # User preferences
        └── usage.ts              # Screen-time data helpers
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Firebase account](https://console.firebase.google.com/)

### 1. Clone & Install

```bash
git clone https://github.com/your-org/IMPACKTHON.git
cd IMPACKTHON/lesser
npm install
```

### 2. Set up Firebase credentials

The app reads config from `EXPO_PUBLIC_` environment variables, falling back to the defaults in `constants/firebase.config.ts`.

```bash
# From the IMPACKTHON/ root:
cp .env.example .env
# Edit .env and fill in your Firebase project values (never commit .env!)
```

`.env` variables:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
```

### 3. Run the app

```bash
npm run start          # Expo dev server (scan QR with Expo Go)
npm run android        # Android emulator
npm run ios            # iOS simulator (macOS only)
```

---

## 🔥 Backend — Firebase Setup

### Deploy Firestore rules & indexes

```bash
cd backend
firebase login
firebase deploy --only firestore
```

### Deploy Cloud Functions

The functions are written in TypeScript and compiled automatically on deploy:

```bash
cd backend/functions
npm install
cd ..
firebase deploy --only functions
```

> **Note:** Functions are deployed to `europe-west1` (eur3 region, same as Firestore).

---

## 🛡️ Security Architecture

### Firestore Security Rules

| Collection | Read | Write |
|---|---|---|
| `/users/{uid}` | Any authenticated user | Owner only |
| `/users/{uid}/followers/*` | Any authenticated user | Cloud Functions only |
| `/users/{uid}/following/*` | Any authenticated user | Owner only |
| `/feedPosts/{postId}` | Any authenticated user | Author (create/delete) |

### Cloud Functions

| Function | Trigger | Purpose |
|---|---|---|
| `onUserDeleted` | Auth user deletion | Cleans up all Firestore data |
| `onFollowUser` | HTTPS Callable | Atomic follow (both sides) |
| `onUnfollowUser` | HTTPS Callable | Atomic unfollow (both sides) |

---

## 🔑 Firebase Credential Strategy

`apiKey`, `projectId`, etc. are **public identifiers** — not secrets. Security is enforced via Firestore Rules.

- `constants/firebase.config.ts` — public config, safe to commit ✅
- `.env` — local overrides, in `.gitignore` ✅
- **Never commit**: service account keys, Firebase Admin tokens ❌

---

## 🌍 Internationalisation

All UI text is centralised in [`lesser/constants/i18n.ts`](lesser/constants/i18n.ts).

Current languages: 🇬🇧 `en` · 🇪🇸 `es`

To add a new language:

1. Duplicate the `en` object at the bottom of `i18n.ts`
2. Translate every value
3. Add it to `LANGUAGES` (e.g. `{ en, es, fr }`)
4. Call `setLanguage('fr')` on app start

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Commit: `git commit -m 'feat: add my feature'`
4. Push: `git push origin feat/my-feature`
5. Open a Pull Request

---

## 📄 License

MIT © IMPACKTHON 2026
