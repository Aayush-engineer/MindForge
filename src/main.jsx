import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { AuthProvider, useAuth } from './context/AuthContext'
import AuthPage from './AuthPage'
import ProfilePage from './ProfilePage'
import MultiAgentDashboard from './MultiAgentDashboard.jsx'

function AppRouter() {
  const { isLoggedIn } = useAuth()
  const [page, setPage] = useState('dashboard')

  if (!isLoggedIn) return <AuthPage />
  if (page === 'profile') return <ProfilePage onBack={() => setPage('dashboard')} />
  return <MultiAgentDashboard onProfile={() => setPage('profile')} />
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  </StrictMode>,
)