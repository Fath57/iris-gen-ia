# Iris Gen IA — Web

Interface utilisateur de la plateforme **Iris Gen IA**, une application RAG (Retrieval-Augmented Generation) permettant d'importer des documents et d'interagir avec un assistant IA basé sur leur contenu.

---

## Fonctionnalités

- **Authentification OTP** (passwordless) — connexion par email + code à usage unique
- **Gestion des conversations** — créer, lister, supprimer des conversations
- **Upload de documents** — PDF, Word, Excel, audio, vidéo associés à une conversation
- **Chat IA** — poser des questions sur les documents indexés, réponses en Markdown formaté
- **Design dark** — thème sombre, accent violet, police Figtree
- **Responsive** — layout adapté mobile et desktop

---

## Stack technique

| Catégorie     | Technologie                               |
| ------------- | ----------------------------------------- |
| Framework     | React 19 + TypeScript                     |
| Build         | Vite 8                                    |
| Styles        | Tailwind CSS v4                           |
| Routing       | React Router DOM v7                       |
| Formulaires   | React Hook Form + Zod v4                  |
| Composants UI | shadcn/ui (Radix UI)                      |
| Icônes        | Lucide React, HugeIcons                   |
| Markdown      | react-markdown                            |
| Tests         | Vitest + Testing Library                  |
| Linting       | ESLint + Prettier                         |
| Commits       | Commitlint (conventional commits) + Husky |
| Versioning    | standard-version                          |

---

## Prérequis

- **Node.js** >= 18
- **Yarn** v1.22+
- **Backend** Iris Gen IA démarré sur `http://localhost:8001` (voir `gen-ai/README.md`)

---

## Démarrage rapide

```bash
# Installer les dépendances
yarn install

# Démarrer le serveur de développement
yarn dev
```

L'application est accessible sur [http://localhost:5173](http://localhost:5173).

---

## Variables d'environnement

Créez un fichier `.env` à la racine de `web/` :

```env
VITE_API_URL=http://localhost:8001
```

| Variable       | Défaut                  | Description                  |
| -------------- | ----------------------- | ---------------------------- |
| `VITE_API_URL` | `http://localhost:8001` | URL de base de l'API backend |

---

## Scripts disponibles

| Commande             | Description                             |
| -------------------- | --------------------------------------- |
| `yarn dev`           | Démarrage en mode développement (HMR)   |
| `yarn build`         | Build de production dans `dist/`        |
| `yarn preview`       | Prévisualisation du build de production |
| `yarn lint`          | Analyse ESLint                          |
| `yarn lint:fix`      | Correction automatique ESLint           |
| `yarn format`        | Formatage Prettier                      |
| `yarn test`          | Tests en mode watch (Vitest)            |
| `yarn test:run`      | Tests en mode CI (une seule passe)      |
| `yarn test:coverage` | Rapport de couverture                   |
| `yarn release`       | Bump de version patch + CHANGELOG       |
| `yarn release:minor` | Bump de version mineure                 |
| `yarn release:major` | Bump de version majeure                 |

---

## Structure du projet

```
src/
├── components/
│   ├── auth/          # Composants d'authentification (AuthCard, FormField, OtpInput…)
│   ├── ui/            # Composants génériques (Button, Input, Avatar…)
│   ├── ChatArea.tsx   # Zone de chat principale
│   ├── chat-message.tsx  # Bulle de message avec rendu Markdown
│   ├── Sidebar.tsx    # Barre latérale (conversations)
│   ├── input-box.tsx  # Champ de saisie + upload
│   └── …
├── lib/
│   ├── api.ts         # Client HTTP (apiFetch)
│   ├── auth-context.tsx  # Contexte d'authentification global
│   ├── hooks/         # Hooks métier (useOtpFlow, useConversations…)
│   ├── schemas/       # Schémas Zod
│   └── types.ts       # Types TypeScript partagés
├── pages/
│   ├── OtpAuthPage.tsx   # Page d'authentification (layout deux colonnes)
│   └── Test.tsx
└── main.tsx           # Point d'entrée + routing
```

---

## Flux d'authentification

1. L'utilisateur saisit son email sur `/auth`
2. Le backend envoie un code OTP par email (`POST /auth/request-otp`)
3. L'utilisateur entre le code reçu (`POST /auth/verify-otp`)
4. Le JWT est stocké dans `localStorage` sous la clé `auth_token`
5. Les routes protégées redirigent vers `/auth` si non connecté

---

## Conventions de commit

Ce projet utilise les [Conventional Commits](https://www.conventionalcommits.org/) :

```
feat(scope): description
fix(scope): description
refactor(scope): description
chore(scope): description
```
