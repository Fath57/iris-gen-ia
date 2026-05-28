## Membres de l'équipe & leurs contributions

### 👨‍💻 Arafath ATTA YAYA (`Fath57`) - Tech Lead / Mobile Lead

**Branches :** `feat/foundation`, `feat/auth`, `feat/chat`, `feat/history`, `feat/account`, `feat/integration`, `main`

**Rôle :** Initiateur du projet, architecte principal, lead développeur mobile (Expo/React Native)

| Branche | Fonctionnalités |
|---------|----------------|
| `feat/foundation` | Init app Expo SDK 54, atomic design (atoms/molecules/organisms), thème dark, client HTTP, Zustand auth store, routing (auth) / (app) avec auth-gate |
| `feat/auth` | Écrans Login + OTP (6 cases avec autofill SMS iOS), hooks react-query (useRequestOtp, useVerifyOtp), thème accent jaune `#FDCD38` |
| `feat/chat` | Écran chat home + conversation/[id], MessageList auto-scroll, ChatInputBar (attach + send), FileCard, MessageBubble Markdown, useDocumentPicker |
| `feat/history` | Écran historique (liste + delete + nouvelle conversation), ConversationList swipe-to-delete, ConversationItem avec date relative |
| `feat/account` | Écran compte avec sign-out, Avatar (cercle + initiale email), intégration mobile sur l'API gen-ai |

---

### 👨‍💻 Soulé Soumaré (`sourtoumo`) - Frontend Web Lead

**Branches :** `feat/web-auth`, `develop/web`

**Rôle :** Développeur principal de l'interface web React

| Branche | Fonctionnalités |
|---------|----------------|
| Init `develop/web` | Init React + Vite, configuration outils (commitlint, husky, standard-version) |
| `feat/web-auth` | Auth context + schémas Zod, formulaires (react-hook-form), pages Login/Register, flux OTP complet (`useOtpFlow` hook + `OtpInput`), refactoring vers `OtpAuthPage` unique sur `/auth`, remplacement des composants auth par `ui/Input` + `ui/Button` |

---

### 👨‍💻 Patrick AMOUSSOU - Backend & Intégration Web/Backend

**Branches :** gen-ai, `develop/web-review`, `feat/process-gen-ai`

**Rôle :** Développeur backend FastAPI + intégration frontend↔backend

| Branche | Fonctionnalités |
|---------|----------------|
| gen-ai | Premier commit backend, mise à jour Dockerfile |
| `feat/process-gen-ai` | Auth, ask, réponses IA, conversations côté backend |
| `develop/web-review` | Intégration complète backend dans le web : API conversations (list/create/delete/upload), hook `useConversations`, adaptation Sidebar + ChatArea + Dropzone aux vrais types, support tous formats fichiers (PDF, Word, Excel, audio, vidéo) |

---

### 👨‍💻 Yanis Bouzidi (`Yanis-Bouzidi`) - Frontend Web / UI

**Branches :** `develop/web`, `feat/web-chat-interface`

**Rôle :** Développement interface web, mise en place UI de base

| Branche | Fonctionnalités |
|---------|----------------|
| `develop/web` | Tailwind CSS + shadcn/ui + router, interface chat + sidebar |
| `feat/web-chat-interface` | Chat interface + sidebar (branche parallèle) |

---

### 👨‍💻 Sodjinnin - Mainteneur / Merge Master

**Rôle :** Gestion des merges de PR sur `main` (PR #9, PR #10)

---

## Vue d'ensemble des branches

```
main
├── feat/foundation
├── feat/auth
├── feat/chat
├── feat/history
├── feat/account
├── gen-ai  
├── feat/process-gen-ai
├── develop/web        
├── feat/web-auth  
└── develop/web-review 
```
