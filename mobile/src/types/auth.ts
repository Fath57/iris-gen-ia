export interface User {
  id: string
  email: string
  createdAt: string
}

export interface Session {
  token: string
  user: User
}
