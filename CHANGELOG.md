# Changelog

Format inspiré de [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

Versions suivent [SemVer](https://semver.org/lang/fr/). Tant que l'app n'a pas livré, seule la section `[Unreleased]` est tenue.

## [Unreleased]

### Added

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
