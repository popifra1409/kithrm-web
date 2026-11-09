import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppInfoProvider } from './context/AppInfoContext';
import { CensusLockProvider } from './context/CensusLockContext';
import { LangProvider } from './context/LangContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import ActivatePage from './pages/ActivatePage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import LeavesPage from './pages/LeavesPage';
import LeaveDetailPage from './pages/LeaveDetailPage';
import NewLeaveRequestPage from './pages/NewLeaveRequestPage';
import DependentsPage from './pages/DependentsPage';
import AddDependentPage from './pages/AddDependentPage';
import DiplomasPage from './pages/DiplomasPage';
import AddDiplomaPage from './pages/AddDiplomaPage';
import CensusPage from './pages/CensusPage';
import PreferencesPage from './pages/PreferencesPage';
import NotFoundPage from './pages/NotFoundPage';
import ConnectionBanner from './components/ConnectionBanner';
import PreferencesSync from './components/PreferencesSync';

export default function App() {
  return (
    <BrowserRouter>
      <LangProvider>
        <AppInfoProvider>
          <AuthProvider>
            <ConnectionBanner />
            <PreferencesSync />
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/activate" element={<ActivatePage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />

              <Route
                element={
                  <ProtectedRoute>
                    <CensusLockProvider>
                      <Layout />
                    </CensusLockProvider>
                  </ProtectedRoute>
                }
              >
                <Route path="/" element={<HomePage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/leaves" element={<LeavesPage />} />
                <Route path="/leaves/new" element={<NewLeaveRequestPage />} />
                <Route path="/leaves/:id" element={<LeaveDetailPage />} />
                <Route path="/dependents" element={<DependentsPage />} />
                <Route path="/dependents/new" element={<AddDependentPage />} />
                <Route path="/diplomas" element={<DiplomasPage />} />
                <Route path="/diplomas/new" element={<AddDiplomaPage />} />
                <Route path="/census" element={<CensusPage />} />
                <Route path="/preferences" element={<PreferencesPage />} />
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </AuthProvider>
        </AppInfoProvider>
      </LangProvider>
    </BrowserRouter>
  );
}