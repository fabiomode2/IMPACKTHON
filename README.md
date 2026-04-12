<p align="center">
  <img src="lesser/assets/images/icon.png" alt="Logo de Lesser" width="100" />
</p>

<h1 align="center">Lesser 📱</h1>

<p align="center">
  <strong>Menos scroll. Más vida.</strong><br/>
  Una app desarrollada con React Native y Firebase para ayudarte a controlar tu tiempo de pantalla, reducirlo poco a poco y motivarte con retos, estadísticas y comparativas con amigos.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Expo-54-blue?logo=expo" />
  <img src="https://img.shields.io/badge/Firebase-Firestore%20%7C%20Auth%20%7C%20Functions-orange?logo=firebase" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript" />
  <img src="https://img.shields.io/badge/license-MIT-green" />
</p>

---

## Características principales

| Característica | Descripción |
|---|---|
| **Rachas diarias** | Mantén tu racha cumpliendo tus objetivos de uso día a día. |
| **Estadísticas de uso** | Consulta tu actividad con gráficos de 24 horas, semana, mes y hasta 6 meses. |
| **Comparte con tus amigos** | Sigue a tus amigos y mira su progreso en tiempo real. |
| **Clasificación** | Compite con otros usuarios y descubre en qué percentil estás. |
| **Calendario de uso** | Visualiza tu actividad diaria con un mapa de calor al estilo GitHub. |
| **Autenticación con Firebase** | Inicio de sesión seguro con usuario y contraseña. |
| **Modo oscuro** | Cambio automático entre modo claro y oscuro. |
| **3 modos de desafío** | Elige entre Soft , Mid o Hardcore según el nivel que quieras. |
| **Seguridad lista para producción** | Protección reforzada con Firebase y Cloud Functions. |

---

## Estructura del repositorio

```bash
IMPACKTHON/
├── .env.example                  # Plantilla para variables EXPO_PUBLIC_
├── .gitignore
├── README.md
│
├── backend/                      # Raíz del proyecto Firebase
│   ├── .firebaserc               # Proyecto Firebase activo
│   ├── firebase.json             # Configuración de Firestore y Functions
│   ├── firestore.rules           # Reglas de seguridad para producción
│   ├── firestore.indexes.json    # Índices compuestos
│   ├── README.md
│   └── functions/
│       ├── package.json          # Scripts de compilación en TypeScript
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts          # Punto de entrada: exporta todas las funciones
│           ├── users.ts          # onUserDeleted → limpieza de datos en Firestore
│           └── social.ts         # onFollowUser / onUnfollowUser como funciones callable
│
└── lesser/                       # App en Expo / React Native
    ├── app/                      # Pantallas con Expo Router
    │   ├── (tabs)/               # Pestañas inferiores (Inicio, Social, Ajustes)
    │   ├── _layout.tsx
    │   ├── auth.tsx              # Inicio de sesión / Registro
    │   ├── onboarding.tsx        # Selección inicial del modo
    │   ├── stats.tsx             # Estadísticas detalladas
    │   ├── followers.tsx         # Lista de seguidores en tiempo real
    │   ├── friend/[uid].tsx      # Vista del perfil de un amigo
    │   └── modal.tsx
    │
    ├── components/
    │   ├── home/
    │   ├── settings/
    │   │   └── AccountSection.tsx  # Eliminación de cuenta y ajustes
    │   ├── social/
    │   └── ui/
    │
    ├── constants/
    │   ├── firebase.config.ts    # Configuración pública del cliente Firebase
    │   ├── i18n.ts               # Textos de la interfaz (EN + ES) y helper t()
    │   └── theme.ts              # Colores del tema (claro / oscuro)
    │
    ├── hooks/
    │   ├── useAuth.tsx           # Contexto y estado de Firebase Auth
    │   ├── useSocial.ts          # Seguir/dejar de seguir con listeners en tiempo real
    │   └── use-color-scheme.ts
    │
    └── services/
        ├── firebase.ts           # Inicialización de Firebase (usa variables EXPO_PUBLIC_)
        ├── auth.ts               # Login / Registro / Logout / Eliminar cuenta
        ├── social.ts             # Firestore: seguir, dejar de seguir, feed y búsqueda
        ├── settings.ts           # Preferencias del usuario
        └── usage.ts              # Utilidades para datos de tiempo de pantalla
```

---

## Para empezar

### Requisitos previos

- Node.js 20 o superior
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- Una cuenta de [Firebase](https://console.firebase.google.com/)

### 1. Clonar el repositorio e instalar dependencias

```bash
git clone https://github.com/your-org/IMPACKTHON.git
cd IMPACKTHON/lesser
npm install
```

### 2. Configurar las credenciales de Firebase

La app lee la configuración desde variables de entorno `EXPO_PUBLIC_`, y si no existen, usa los valores por defecto definidos en `constants/firebase.config.ts`.

```bash
# Desde la raíz de IMPACKTHON/
cp .env.example .env
# Edita el archivo .env y añade los valores de tu proyecto Firebase
# No subas .env al repositorio
```

### 3. Ejecutar la app

```bash
npm run start          # Inicia el servidor de desarrollo de Expo
npm run android        # Abre el emulador de Android
```

---

## Backend — Configuración de Firebase

### Desplegar reglas e índices de Firestore

```bash
cd backend
firebase login
firebase deploy --only firestore
```

## Arquitectura de seguridad

### Reglas de seguridad de Firestore

| Colección | Lectura | Escritura |
|---|---|---|
| `/users/{uid}` | Cualquier usuario autenticado | Solo el propietario |
| `/users/{uid}/followers/*` | Cualquier usuario autenticado | Solo Cloud Functions |
| `/users/{uid}/following/*` | Cualquier usuario autenticado | Solo el propietario |
| `/feedPosts/{postId}` | Cualquier usuario autenticado | El autor (crear/eliminar) |


## 🌍 Internacionalización

Todos los textos de la interfaz están centralizados en [`lesser/constants/i18n.ts`](lesser/constants/i18n.ts).

Idiomas disponibles actualmente: 🇬🇧 `en` · 🇪🇸 `es`
