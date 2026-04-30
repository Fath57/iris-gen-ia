# Changelog

Format inspiré de [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

Versions suivent [SemVer](https://semver.org/lang/fr/). Tant que l'app n'a pas livré, seule la section `[Unreleased]` est tenue.

## [Unreleased]

### Added

- **Chat — feat/chat** :
  - `src/features/conversation/api.ts` : `list`, `get`, `create`, `remove`, `attachDocument`, `listMessages`, `sendMessage`.
  - `src/features/conversation/hooks.ts` : `useConversations`, `useConversation`, `useMessages`, `useCreateConversation`, `useDeleteConversation`, `useAttachDocument`, `useSendMessage` (avec optimistic insert + rollback). `conversationKeys` constants.
  - `src/features/conversation/useDocumentPicker.ts` : wrap `expo-document-picker`, retourne `pick()` qui ouvre le picker système.
  - Molecule `MessageBubble` : variante user (bulle alignée droite, surface elevated) et assistant (flush left, markdown rendu via `react-native-markdown-display` aligné sur le theme).
  - Molecule `ChatInputBar` : multiline qui grandit (48–140px), bouton `+` attach à gauche, bouton `↑` send à droite (jaune actif → noir, gris inactif), `ActivityIndicator` pendant pending.
  - Molecule `FileCard` : icône document + nom + taille humanisée FR (`o`, `Ko`, `Mo`, `Go`), variant `compact` pour les headers, prop optionnelle `onRemove`.
  - Organism `MessageList` : `FlatList` avec auto-scroll bas via `onContentSizeChange`, slots `header` et `emptyState`.
  - Écran `(app)/index.tsx` : empty state CTA "Joindre un document" → pick → lazy create conv → attach. Header burger ouvre `/history`. `ChatInputBar` désactivé tant que pas de doc.
  - Écran `(app)/conversation/[id].tsx` : back-button + titre, MessageList + ChatInputBar, Spinner pendant load.
- **Auth — feat/auth** :
  - `src/features/auth/api.ts` : `authApi.requestOtp`, `authApi.verifyOtp` typés.
  - `src/features/auth/hooks.ts` : `useRequestOtp`, `useVerifyOtp` (branche `setSession` en `onSuccess`), `useSignOut`.
  - `src/components/molecules/OtpInput.tsx` : 6 cases avec `TextInput` invisible (paste, iOS SMS autofill `oneTimeCode`/`sms-otp`), focus visuel sur la case courante.
  - Écran `app/(auth)/login.tsx` : input email validé (regex non-redos), bouton désactivé si invalide, `useRequestOtp` puis navigation vers `/otp` avec email en param, `KeyboardAvoidingView` iOS.
  - Écran `app/(auth)/otp.tsx` : `OtpInput` auto-submit quand 6 chiffres, bouton Vérifier fallback, gestion d'erreurs (`401` code invalide, `410` expiré), liens "Renvoyer" et "Modifier l'email", guard si param `email` manquant.
- Init Expo SDK 54 (template default, expo-router 6, RN 0.81, React 19, TS 5.9).
- Lint `@antfu/eslint-config` (flat) + plugin React + polyfill `Object.groupBy` pour Node 20.
- TypeScript strict + `noUncheckedIndexedAccess` + path aliases (`@/`, `@atoms/`, `@molecules/`, `@organisms/`, `@templates/`, `@features/`, `@hooks/`, `@lib/`, `@stores/`, `@theme/`, `@types/`, `@app/`).
- Theme dark-first inspiré Claude mobile (palette `#0E0E10` / accent iris `#A78BFA`), tokens `colors`, `spacing`, `radius`, `typography`.
- `ThemeProvider` + hook `useTheme` (API React 19 `<Context value>` + `use()`).
- Atomes : `Text`, `Button` (primary/secondary/ghost), `Input`, `Spinner`. Barrels documentés pour molecules/organisms/templates.
- Lib HTTP : `request<T>()` typé avec `ApiError`, route vers `mock-server` si `env.useMock`.
- Mock-server in-memory : `/auth/email`, `/auth/verify`, `/me`, `/conversations` (CRUD), `/conversations/:id/document`, `/conversations/:id/messages` (GET/POST). OTP figé à `123456`, loggé en DEV.
- Wrapper `expo-secure-store` pour token de session.
- Types `User`, `Session`, `Conversation`, `Message`, `FileAttachment`.
- Store zustand `auth` : `status`, `token`, `user`, `hydrate()`, `setSession()`, `signOut()`.
- Routing expo-router : groupes `(auth)` (login, otp) et `(app)` (index = chat default, history, conversation/[id]). Auth-gate au boot dans le `_layout` racine, redirige selon le status hydraté.
- `docs/ARCHITECTURE.md` : stack, arbo, flows auth + conversation, contrat API, conventions, env, aliases.
- `.gitignore` racine (RTK, éditeurs).

### Changed

- `app.json` : nom `Iris`, slug `iris-gen-ia`, scheme `iris`, `userInterfaceStyle: dark`.
- `package.json` : scripts `lint`, `lint:fix`, `typecheck` ; suppression de `reset-project` une fois le template purgé.

### Removed

- Template par défaut Expo : groupe `(tabs)`, écran `modal.tsx`, composants exemples (`themed-text`, `themed-view`, `parallax-scroll-view`, `hello-wave`, `external-link`, `haptic-tab`, icônes), hooks `use-color-scheme`/`use-theme-color`, `constants/theme.ts`, `scripts/reset-project.js`, logos React.
- `eslint-config-expo` (remplacé par `@antfu/eslint-config`).
