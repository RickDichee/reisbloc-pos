import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useStore } from '@/store/appStore'
import Login from '@/pages/Login'
import POS from '@/pages/POS'
import Admin from '@/pages/Admin'
import Reports from '@/pages/Reports'
import Kitchen from '@/pages/Kitchen'
import NotFound from '@/pages/NotFound'

function App() {
  const { isAuthenticated, currentUser } = useStore()

  return (
    <Router>
      <Routes>
        {!isAuthenticated ? (
          <>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        ) : (
          <>
            <Route path="/pos" element={<POS />} />
            <Route path="/kitchen" element={<Kitchen />} />
            <Route path="/admin" element={currentUser?.role === 'admin' ? <Admin /> : <Navigate to="/pos" />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="*" element={<Navigate to="/pos" replace />} />
          </>
        )}
      </Routes>
    </Router>
  )
}

export default App
