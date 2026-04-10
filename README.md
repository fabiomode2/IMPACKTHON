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
  <img src="https://img.shields.io/badge/Firebase-Firestore%20%7C%20Auth-orange?logo=firebase" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript" />
  <img src="https://img.shields.io/badge/license-MIT-green" />
</p>

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔥 **Streak tracking** | Daily streaks with goal comparison |
| 📊 **Usage analytics** | Cycling charts: 24h → week → month → 6 months |
| 👥 **Social feed** | Follow friends, see their progress |
| 🏆 **Leaderboard** | Compete with top % of users |
| 📅 **Consistency Map** | GitHub-style heatmap of your daily usage |
| 🌍 **i18n** | Full English & Spanish support |
| 🔐 **Firebase Auth** | Secure username + password login |
| 🌙 **Dark mode** | Automatic system-level theming |
| 🎯 **3 challenge modes** | Soft 🌿 · Mid 🛡️ · Hardcore 🔥 |

---

## 🗂 Repository Structure

```
IMPACKTHON/
├── .env.example           # Template for Firebase environment variables
├── backend/               # Firebase backend (Firestore, Cloud Functions)
│   ├── firestore.rules    # Security rules
│   ├── firestore.indexes.json
│   ├── firebase.json      # Firebase project config
│   └── functions/         # Cloud Functions (Node.js)
│
└── lesser/                # Expo / React Native app
    ├── app/               # Expo Router screens
    │   ├── (tabs)/        # Bottom-tab screens (Home, Social, Settings)
    │   ├── auth.tsx        # Login / Register
    │   ├── onboarding.tsx  # First-time mode selection
    │   ├── stats.tsx       # Detailed statistics
    │   ├── followers.tsx   # Followers list + follow/unfollow
    │   └── friend/[uid].tsx # Friend profile view
    │
    ├── components/        # Reusable UI components
    │   ├── home/          # Home-specific widgets
    │   ├── settings/      # Settings sections
    │   ├── social/        # Feed item, friend cards
    │   └── ui/            # Icon system, themed primitives
    │
    ├── constants/
    │   ├── i18n.ts        # All UI strings (EN + ES), t() helper
    │   └── theme.ts       # Colour tokens (light / dark)
    │
    ├── hooks/
    │   ├── useAuth.tsx    # Firebase Auth context + state
    │   └── use-color-scheme.ts
    │
    └── services/
        ├── firebase.ts    # Firebase initialisation (reads .env)
        ├── auth.ts        # Login / Register / Logout
        ├── social.ts      # Feed, friends, follow requests
        ├── settings.ts    # User preferences
        └── usage.ts       # Screen-time data helpers
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Firebase account](https://console.firebase.google.com/)

### 1. Clone & Install

```bash
git clone https://github.com/your-org/IMPACKTHON.git
cd IMPACKTHON/lesser
npm install
```

### 2. Set up Firebase credentials

```bash
cp ../.env.example ../.env
# Edit .env and fill in your Firebase project values
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

```bash
cd backend
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules
firebase deploy --only functions
```

The Firestore schema:

```
users/{uid}
  username: string
  email: string
  mode: 'soft' | 'mid' | 'hardcore'
  streakDays: number
  createdAt: Timestamp

users/{uid}/friends/{friendUid}
  username: string
  streakDays: number

feedPosts/{postId}
  uid: string
  username: string
  days: number
  message?: string
  photoUrl?: string
  timestamp: Timestamp
```

---

## 🌍 Internationalisation

All UI text is centralised in [`lesser/constants/i18n.ts`](lesser/constants/i18n.ts).

To add a new language:

1. Duplicate the `en` object at the bottom of `i18n.ts`
2. Translate every value
3. Add it to `LANGUAGES` (e.g. `{ en, es, fr }`)
4. Call `setLanguage('fr')` on app start

Current languages: 🇬🇧 `en` · 🇪🇸 `es`

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
