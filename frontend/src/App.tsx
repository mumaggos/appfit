import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
  Outlet,
  useLocation
} from 'react-router-dom';
import Dashboard from './components/Dashboard';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import HomePage from './components/HomePage';
import UserProfilePage from './components/UserProfilePage';
import UserPreferencesPage from './components/UserPreferencesPage';
import AdminDashboard from './components/AdminDashboard'; 
import AdminAdvertisements from './components/AdminAdvertisements';
import AdminShop from './components/AdminShop';
import ShopPage from './components/ShopPage'; // Import ShopPage
import ProductDetailPage from './components/ProductDetailPage'; // Import ProductDetailPage
import { Toaster } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ShieldCheck, LayoutDashboard, Users, ShoppingBag, Annoyed } from 'lucide-react'; // Icons

// Wrapper for protected routes (general users)
const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="p-4 text-center">A verificar autenticação...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <Outlet />; 
};

// Wrapper for Admin protected routes
const AdminProtectedRoute: React.FC = () => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="p-4 text-center">A verificar permissões de administrador...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (!user?.is_admin) {
    return <Navigate to="/dashboard" state={{ from: location }} replace />;
  }
  return <Outlet />;
};

const AppLayout: React.FC = () => {
  const { isAuthenticated, logout, user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link to={isAuthenticated ? "/dashboard" : "/"} className="text-2xl font-bold text-green-600 hover:text-green-700 transition-colors">
                FitnessApp
              </Link>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              {isAuthenticated ? (
                <>
                  <span className="text-gray-700 hidden md:inline">Olá, {user?.username || 'Utilizador'}!</span>
                  <Link to="/dashboard" className="text-gray-600 hover:text-green-600 transition-colors">Painel</Link>
                  <Link to="/profile" className="text-gray-600 hover:text-green-600 transition-colors">Perfil</Link>
                  <Link to="/preferences" className="text-gray-600 hover:text-green-600 transition-colors">Preferências</Link>
                  <Link to="/shop" className="text-gray-600 hover:text-green-600 transition-colors">Loja</Link>
                  {user?.is_admin && (
                    <Link to="/admin/dashboard" className="flex items-center text-purple-600 hover:text-purple-700 transition-colors">
                      <ShieldCheck className="h-5 w-5 mr-1" /> Admin
                    </Link>
                  )}
                  <Button onClick={logout} variant="outline" size="sm" className="border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600">
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-gray-600 hover:text-green-600 transition-colors">Login</Link>
                  <Link to="/register" className="text-gray-600 hover:text-green-600 transition-colors">Registar</Link>
                  <Link to="/shop" className="text-gray-600 hover:text-green-600 transition-colors">Loja</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
      <main className="flex-grow">
        <Outlet /> {/* Child routes will render here */}
      </main>
      <Toaster />
      <footer className="bg-gray-800 text-white text-center p-4 mt-auto">
        <p>&copy; {new Date().getFullYear()} FitnessApp. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
};

const AdminLayout: React.FC = () => {
  // This layout can be used for the admin section, including a sidebar for navigation
  return (
    <div className="flex h-screen">
      <aside className="w-64 bg-gray-800 text-white p-4 space-y-2 fixed h-full">
        <h2 className="text-xl font-semibold mb-4">Admin FitnessApp</h2>
        <nav>
          <Link to="/admin/dashboard" className="flex items-center py-2 px-3 rounded hover:bg-gray-700">
            <LayoutDashboard className="mr-2 h-5 w-5" /> Painel Principal
          </Link>
          <Link to="/admin/users" className="flex items-center py-2 px-3 rounded hover:bg-gray-700">
            <Users className="mr-2 h-5 w-5" /> Gerir Utilizadores
          </Link>
          <Link to="/admin/advertisements" className="flex items-center py-2 px-3 rounded hover:bg-gray-700">
            <Annoyed className="mr-2 h-5 w-5" /> Gerir Publicidade
          </Link>
          <Link to="/admin/shop" className="flex items-center py-2 px-3 rounded hover:bg-gray-700">
            <ShoppingBag className="mr-2 h-5 w-5" /> Gerir Loja
          </Link>
        </nav>
      </aside>
      <main className="flex-1 ml-64 p-6 bg-gray-100 overflow-auto">
        <Outlet /> {/* Admin child routes will render here */}
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/shop" element={<ShopPage />} /> {/* Shop page route */}
            <Route path="/shop/product/:slug" element={<ProductDetailPage />} /> {/* Product detail route */}
            
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<UserProfilePage />} />
              <Route path="/preferences" element={<UserPreferencesPage />} />
            </Route>
          </Route>

          {/* Admin Protected Routes with AdminLayout */}
          <Route element={<AdminProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/dashboard" element={<h1 className='text-2xl'>Bem-vindo ao Painel Admin!</h1>} />
              <Route path="/admin/users" element={<AdminDashboard />} />
              <Route path="/admin/advertisements" element={<AdminAdvertisements />} />
              <Route path="/admin/shop" element={<AdminShop />} />
            </Route>
          </Route>
            
          {/* Catch-all route - ensure it's last or correctly placed */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
