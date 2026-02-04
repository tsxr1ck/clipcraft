import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LoginPage } from './pages/auth/LoginPage';
import { SignupPage } from './pages/auth/SignupPage';
import { Dashboard } from './pages/Dashboard';
import { SeriesPage } from './pages/SeriesPage';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { WanVideoPage } from './features/wan-video/pages/WanVideoPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/series"
            element={
              <ProtectedRoute>
                <SeriesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wan-video"
            element={
              <ProtectedRoute>
                <WanVideoPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;