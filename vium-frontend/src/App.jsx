import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { getCurrentUser } from './lib/supabase'

// Páginas
import Home from './pages/Home'
import Login from './pages/Login'
import UserType from './pages/UserType'
import PassengerDashboard from './pages/passenger/Dashboard'
import DriverDashboard from './pages/driver/Dashboard'
import DriverRegistration from './pages/driver/Registration'
import AdminDashboard from './pages/admin/Dashboard'
import NotFound from './pages/NotFound'
import AuthCallback from './pages/AuthCallback'
import ShareView from './pages/ShareView'

// Componentes
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadUser() {
      try {
        const currentUser = await getCurrentUser()
        setUser(currentUser)
      } catch (error) {
        console.error('Erro ao carregar usuário:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="auth/callback" element={<AuthCallback />} />
        <Route path="user-type" element={
          <ProtectedRoute user={user}>
            <UserType />
          </ProtectedRoute>
        } />
        
        {/* Rotas de Passageiro */}
        <Route path="passenger" element={
          <ProtectedRoute user={user} userType="passageiro">
            <PassengerDashboard />
          </ProtectedRoute>
        } />
        
        {/* Rotas de Motorista */}
        <Route path="driver/register" element={
          <ProtectedRoute user={user}>
            <DriverRegistration />
          </ProtectedRoute>
        } />
        <Route path="driver" element={
          <ProtectedRoute user={user} userType="motorista">
            <DriverDashboard />
          </ProtectedRoute>
        } />
        
        {/* Rotas de Admin */}
        <Route path="admin" element={
          <ProtectedRoute user={user} userType="admin">
            <AdminDashboard />
          </ProtectedRoute>
        } />
        
        {/* Rota de Compartilhamento */}
        <Route path="share/:shareId" element={<ShareView />} />
        
        {/* Rota 404 */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

export default App
