// src/main.tsx (ou main.jsx)
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import App from './App'
import Test from './pages/Test'

const router = createBrowserRouter([
  {
    path: "/", 
    element: <App />,
  },
  {
    path: "/test",
    element: <Test />,
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
)