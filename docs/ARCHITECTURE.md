# Architecture — Iris

App de chat Gen IA mobile (style ChatGPT / Claude mobile). L'utilisateur s'authentifie par email + OTP, soumet un document à analyser, puis dialogue avec l'IA autour de ce document. L'historique des conversations est consultable et purgeable.

---

## Stack

| Couche | Choix | Raison |
|---|---|---|
| Runtime | Expo SDK 54 + React Native 0.81 + React 19 | tooling moderne, Hermes, new arch activée |
| Routing | expo-router 6 | file-based, typed routes, deep-link prêt |
| Langage | TypeScript 5.9 strict + `noUncheckedIndexedAccess` | sécurité au type-check |
| Lint | `@antfu/eslint-config` (flat) | conventions partagées, stylistic intégré |
| State serveur | TanStack Query 5 | cache/invalidation des conversations et messages |
| State client | Zustand 5 | auth + UI, léger, hooks-only |
| HTTP | `ofetch` + wrapper `request<T>()` | typé, bascule mock/réel via env |
| Stockage secret | `expo-secure-store` | token de session |
| Stockage persisté | `@react-native-async-storage/async-storage` | persist zustand (futur), compatible Expo Go |
| Upload fichier | `expo-document-picker` + `expo-file-system` | sélection + lecture du document |
| Markdown | `react-native-markdown-display` | rendu des réponses IA |
| Animations | `react-native-reanimated` 4 + worklets | transitions fluides, headers animés |

---

## Arborescence

```
iris-gen-ia/
├── docs/
│   └── ARCHITECTURE.md            ← ce document
├── CHANGELOG.md                   ← Keep-a-Changelog, mis à jour à chaque tâche
├── CLAUDE.md                      ← règles RTK projet
└── mobile/                        ← l'app Expo
    ├── app/                       ← routes expo-router (PAS de logique métier)
    │   ├── _layout.tsx            ← providers + auth-gate
    │   ├── (auth)/
    │   │   ├── _layout.tsx
    │   │   ├── login.tsx          ← saisie email
    │   │   └── otp.tsx            ← saisie OTP 6 chiffres
    │   └── (app)/
    │       ├── _layout.tsx
    │       ├── index.tsx          ← écran chat par défaut
    │       ├── history.tsx        ← liste + suppression
    │       └── conversation/
    │           └── [id].tsx       ← conversation existante
    └── src/                       ← code applicatif
        ├── components/            ← ATOMIC DESIGN
        │   ├── atoms/             ← Text, Button, Input, Spinner
        │   ├── molecules/         ← OtpInput, MessageBubble, FileCard, ConversationItem, ChatInputBar (à venir)
        │   ├── organisms/         ← MessageList, ConversationList, AuthForm, FileUploadSheet (à venir)
        │   └── templates/         ← ChatLayout, AuthLayout, HistoryLayout (à venir)
        ├── features/              ← logique métier par domaine (à venir)
        │   ├── auth/
        │   └── conversation/
        ├── lib/
        │   ├── env.ts             ← config env compile-time
        │   ├── http.ts            ← request<T>() typé, ApiError
        │   ├── mock-server.ts     ← mock in-memory routé par regex
        │   └── storage.ts         ← wrapper secure-store
        ├── stores/
        │   └── auth.ts            ← zustand: status, token, user
        ├── theme/
        │   ├── colors.ts
        │   ├── spacing.ts
        │   ├── radius.ts
        │   ├── typography.ts
        │   ├── index.ts           ← darkTheme / lightTheme
        │   └── ThemeProvider.tsx  ← context React 19
        ├── hooks/                 ← hooks transverses (à venir)
        └── types/
            ├── auth.ts            ← User, Session
            └── conversation.ts    ← Conversation, Message, FileAttachment
```

---

## Atomic design — règles de découpage

- **atoms** : un seul élément RN/théme. Ne dépend que du theme. Aucune logique métier, aucun appel API.
- **molecules** : combinaison d'atomes (≤3 atomes). Stateful local possible (focus, hover). Pas d'API.
- **organisms** : section complète (liste de messages, formulaire d'auth). Peut consommer des hooks de feature mais reste *présentationnel*.
- **templates** : layout d'écran sans données (slots).
- **app/(group)/screen.tsx** : assemble template + organismes + hooks de feature. Pas de styling brut ici, pas de logique non-routing.

**Règle d'or** : un atome ne dépend pas d'un molecule (pas de remontée). La hiérarchie est descendante.

---

## Flow d'authentification

```
[LoginScreen]                                       [OtpScreen]
  email saisie                                        code saisie
      ↓                                                  ↓
  POST /auth/email   ────────►  mock-server      POST /auth/verify  ──►  mock-server
      │                  log OTP en DEV                   │              valide entry
      ↓                                                   ↓
  router.push('/otp')                              { token, user }
                                                         ↓
                                                  authStore.setSession()
                                                  (token persisté en secure-store)
                                                         ↓
                                              status passe à 'authenticated'
                                                         ↓
                                              auth-gate redirect vers /
                                                  (= (app)/index.tsx)
```

En mock le code OTP est figé à `123456` et loggé dans la console DEV à chaque envoi.

---

## Flow conversation

```
                                [ChatHomeScreen — (app)/index.tsx]
                                   à l'arrivée: pas besoin de "créer"
                                   l'écran = chat vierge prêt à recevoir un fichier
                                                  ↓
                       [user upload un document via FileUploadSheet]
                                                  ↓
                          POST /conversations            (création lazy)
                                                  ↓
                          POST /conversations/:id/document
                                                  ↓
                       conversation a maintenant un document attaché
                                                  ↓
                          [user pose une question]
                                                  ↓
                          POST /conversations/:id/messages   { content }
                                                  ↓
                          réponse user + assistant retournés
                                                  ↓
                          react-query invalide /conversations
                                                  ↓
                          historique mis à jour automatiquement

[HistoryScreen — (app)/history.tsx]
   GET /conversations            → liste triée par updatedAt desc
   DELETE /conversations/:id     → invalidate query → liste refetch
   tap sur item                  → router.push(`/conversation/${id}`)
```

---

## Couche HTTP

`request<T>(path, options)` dans `src/lib/http.ts` est l'unique point d'entrée HTTP de l'app.

- Si `env.useMock === true` (défaut tant qu'aucun back) : le wrapper route vers `mock-server.ts` qui matche par regex et exécute un handler in-memory.
- Sinon : `ofetch` contre `${env.apiUrl}${path}` avec injection automatique du `Authorization: Bearer <token>` lu depuis secure-store.

Erreurs : toujours sous forme `ApiError(status, message)`. Les hooks de feature sont responsables de la traduction UX.

### Routes (contrat à figer côté back)

| Méthode | Chemin | Body | Réponse |
|---|---|---|---|
| `POST` | `/auth/email` | `{ email }` | `{ sent: true }` |
| `POST` | `/auth/verify` | `{ email, code }` | `{ token, user }` |
| `GET` | `/me` | — | `User` |
| `GET` | `/conversations` | — | `Conversation[]` |
| `POST` | `/conversations` | `{ title? }` | `Conversation` |
| `GET` | `/conversations/:id` | — | `Conversation` |
| `DELETE` | `/conversations/:id` | — | `{ ok: true }` |
| `POST` | `/conversations/:id/document` | `{ name, mimeType, size }` | `Conversation` |
| `GET` | `/conversations/:id/messages` | — | `Message[]` |
| `POST` | `/conversations/:id/messages` | `{ content }` | `[userMsg, assistantMsg]` |

---

## State management

- **Zustand** (`src/stores/auth.ts`) : token, user, status (`idle` / `loading` / `authenticated` / `unauthenticated`). `hydrate()` est appelée au boot par le RootLayout.
- **TanStack Query** : tout ce qui vient du back (conversations, messages). Clé conventions : `['conversations']`, `['conversation', id]`, `['messages', id]`.
- Pas de state global pour les données serveur — seulement Query.

---

## Variables d'environnement

| Var | Défaut | Usage |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | `https://api.iris.invalid` | base URL du back en mode réel |
| `EXPO_PUBLIC_USE_MOCK` | `1` (par défaut) | `0` pour utiliser le back réel |

Toutes les vars exposées au runtime client doivent commencer par `EXPO_PUBLIC_` (inlinée à la build par Expo).

---

## Path aliases

| Alias | Cible |
|---|---|
| `@/*` | `src/*` |
| `@app/*` | `app/*` |
| `@atoms/*` | `src/components/atoms/*` |
| `@molecules/*` | `src/components/molecules/*` |
| `@organisms/*` | `src/components/organisms/*` |
| `@templates/*` | `src/components/templates/*` |
| `@features/*` | `src/features/*` |
| `@hooks/*` | `src/hooks/*` |
| `@lib/*` | `src/lib/*` |
| `@stores/*` | `src/stores/*` |
| `@theme/*` | `src/theme/*` |
| `@types/*` | `src/types/*` |

---

## Conventions

- **Commentaires en français**, et uniquement sur le *pourquoi* non-évident (jamais sur le *quoi*).
- **Identifiants de code en anglais** (variables, fonctions, types).
- **Pas de `any`** — utiliser `unknown` puis typer en aval.
- **Pas de defaut export** sauf pour les écrans expo-router (exigés par le runtime).
- **Branches** : `feat/<nom>`. Plusieurs commits par branche, PR vers `main`.
- **CHANGELOG.md** : format Keep-a-Changelog, entrée `[Unreleased]` mise à jour à chaque tâche.
- **Tests** : à introduire avec `jest-expo` + `@testing-library/react-native` une fois les premières features stabilisées.

---

## Lancer en local

```bash
cd mobile
npm install
npm run typecheck     # strict
npm run lint          # antfu
npm run start         # expo start (Q pour QR Expo Go, A iOS, W web)
```

L'app démarre sur l'écran login (mock auth, code OTP `123456`).
