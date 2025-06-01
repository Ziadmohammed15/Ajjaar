import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Welcome from './pages/Welcome';
import Auth from './pages/Auth';
import UserType from './pages/UserType';
import Home from './pages/Home';
import MyBookings from './pages/MyBookings';
import ServiceDetails from './pages/ServiceDetails';
import AddService from './pages/AddService';
import EditService from './pages/EditService';
import MyServices from './pages/MyServices';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Notifications from './pages/Notifications';
import FavoritesPage from './pages/FavoritesPage';
import BookingConfirmation from './pages/BookingConfirmation';
import CategoryPage from './pages/CategoryPage';
import Layout from './components/Layout';
import ProviderLayout from './components/ProviderLayout';
import ChatPage from './pages/ChatPage';
import ChatsListPage from './pages/ChatsListPage';
import CompleteProfile from './pages/CompleteProfile';
import TermsAndConditions from './pages/TermsAndConditions';
import { useAuth } from './context/AuthContext';
import RequireCompleteProfile from './components/RequireCompleteProfile';

function App() {
  const [userType, setUserType] = useState<'client' | 'provider' | null>(null);
  const { user, isProfileComplete, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const savedUserType = localStorage.getItem('userType') as 'client' | 'provider' | null;
    if (savedUserType) {
      setUserType(savedUserType);
    }
  }, []);

  const handleSetUserType = (type: 'client' | 'provider') => {
    setUserType(type);
    localStorage.setItem('userType', type);
    if (type === 'client') {
      navigate('/home');
    } else if (type === 'provider') {
      navigate('/provider/home');
    }
  };

  // حماية فقط الصفحات التي تتطلب تسجيل دخول حقيقي (مثل: ملفي، الإعدادات)
  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (loading) return null;
    if (!user) {
      return <Navigate to="/auth" replace />;
    }
    return <>{children}</>;
  };

  // حماية الصفحات التي تتطلب اكتمال الملف الشخصي (مثل: نشر خدمة، نشر طلب)
  const RequireProfileCompletion = ({ children }: { children: React.ReactNode }) => {
    if (loading) return null;
    if (!user) {
      return <Navigate to="/auth" replace />;
    }
    if (!isProfileComplete) {
      return <Navigate to="/complete-profile" replace />;
    }
    return <>{children}</>;
  };

  return (
    <div className="bg-secondary-100 min-h-screen">
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/complete-profile" element={
          <ProtectedRoute>
            <CompleteProfile />
          </ProtectedRoute>
        } />
        <Route
          path="/user-type"
          element={
            <ProtectedRoute>
              <UserType onSelectUserType={handleSetUserType} />
            </ProtectedRoute>
          }
        />

        {/* Client routes */}
        <Route element={<Layout userType="client" />}>
          <Route path="/home" element={
            // الصفحة الرئيسية متاحة للجميع (زائر أو مسجل)
            <Home />
          } />
          <Route path="/my-bookings" element={
            <ProtectedRoute>
              <MyBookings />
            </ProtectedRoute>
          } />
          <Route path="/favorites" element={
            <ProtectedRoute>
              <FavoritesPage />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile userType={userType} />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />
          <Route path="/category/:categoryId" element={
            <Home />
          } />
        </Route>

        {/* Provider routes */}
        <Route element={<ProviderLayout />}>
          <Route path="/provider/home" element={
            // الصفحة الرئيسية متاحة للجميع (زائر أو مسجل)
            <Home isProvider={true} />
          } />
          <Route path="/provider/bookings" element={
            <ProtectedRoute>
              <MyBookings isProvider={true} />
            </ProtectedRoute>
          } />
          <Route path="/provider/add-service" element={
            // إضافة خدمة تتطلب اكتمال الملف الشخصي
            <RequireProfileCompletion>
              <AddService />
            </RequireProfileCompletion>
          } />
          <Route path="/provider/edit-service/:id" element={
            <RequireProfileCompletion>
              <EditService />
            </RequireProfileCompletion>
          } />
          <Route path="/provider/my-services" element={
            <ProtectedRoute>
              <MyServices />
            </ProtectedRoute>
          } />
          <Route path="/provider/profile" element={
            <ProtectedRoute>
              <Profile userType={userType} />
            </ProtectedRoute>
          } />
          <Route path="/provider/settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />
        </Route>

        {/* Shared routes */}
        <Route path="/service/:id" element={
          <ServiceDetails />
        } />
        <Route path="/booking-confirmation" element={
          <ProtectedRoute>
            <BookingConfirmation />
          </ProtectedRoute>
        } />
        <Route path="/notifications" element={
          <ProtectedRoute>
            <Notifications />
          </ProtectedRoute>
        } />
        <Route path="/chat/:id" element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        } />
        <Route path="/chats" element={
          <ProtectedRoute>
            <ChatsListPage />
          </ProtectedRoute>
        } />
        <Route path="/terms" element={<TermsAndConditions />} />
      </Routes>
    </div>
  );
}

export default App;