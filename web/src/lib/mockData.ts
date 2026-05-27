import { Chat } from "./types";

export const mockChats: Chat[] = [
  {
    id: "1",
    title: "Comment centrer une div",
    updatedAt: new Date("2024-05-20T10:00:00Z"),
    messages: [
      { id: "m1", role: "user", content: "Comment centrer une div avec Tailwind CSS ?" },
      { id: "m2", role: "assistant", content: "Pour centrer une div avec Tailwind, tu peux utiliser Flexbox. Ajoute les classes `flex justify-center items-center` au conteneur parent." }
    ]
  },
  {
    id: "2",
    title: "Idées de repas sains",
    updatedAt: new Date("2024-05-21T14:30:00Z"),
    messages: [
      { id: "m3", role: "user", content: "Donne-moi 3 idées de repas sains et rapides." },
      { id: "m4", role: "assistant", content: "1. Salade de quinoa et avocat.\n2. Wrap au poulet grillé et crudités.\n3. Omelette aux épinards et champignons." }
    ]
  },
  // Exemple de chat vide
  {
    id: "3",
    title: "Nouvelle discussion",
    updatedAt: new Date(),
    messages: [] 
  }
];