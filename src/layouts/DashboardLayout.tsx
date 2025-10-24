import { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  ShoppingCart,
  FileText,
  Users,
  LogOut,
  Shield,
  UserCheck,
  History,
  Monitor,
} from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/connexion');
  };

  const isSuperAdmin = user?.role === 'Super Administrateur';

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord', roles: ['Administrateur', 'Super Administrateur'] },
    { to: '/stocks', icon: Package, label: 'Gestion des stocks', roles: ['Administrateur', 'Super Administrateur'] },
    { to: '/mouvements', icon: ArrowLeftRight, label: 'Mouvements', roles: ['Administrateur', 'Super Administrateur'] },
    { to: '/fournisseurs-clients', icon: UserCheck, label: 'Fournisseurs & Clients', roles: ['Administrateur', 'Super Administrateur'] },
    { to: '/commandes', icon: ShoppingCart, label: 'Commandes', roles: ['Administrateur', 'Super Administrateur'] },
    { to: '/rapports', icon: FileText, label: 'Rapports', roles: ['Super Administrateur'] },
    { to: '/utilisateurs', icon: Users, label: 'Utilisateurs', roles: ['Super Administrateur'] },
    { to: '/sessions', icon: Monitor, label: 'Sessions', roles: ['Super Administrateur'] },
    { to: '/historique', icon: History, label: 'Historique', roles: ['Super Administrateur'] },
  ].filter(item => item.roles.includes(user?.role || ''));

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-military-700 text-white flex flex-col">
        <div className="p-6 border-b border-military-600">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8" />
            <div>
              <h1 className="font-bold text-lg">Atelier Militaire</h1>
              <p className="text-xs text-military-200">Gestion des stocks</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-military-600 text-white'
                    : 'text-military-100 hover:bg-military-600'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-military-600 bg-military-700">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-military-500 flex items-center justify-center text-xs font-bold flex-shrink-0">
              {user?.nom_complet.split(' ').map(n => n[0]).join('').toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{user?.nom_complet}</p>
              <p className="text-xs text-military-200 truncate">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-military-100 hover:bg-military-600 transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              {navItems.find(item => window.location.pathname.includes(item.to.split('/')[1]))?.label || 'Dashboard'}
            </h2>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-military-600 flex items-center justify-center text-white font-bold">
                {user?.nom_complet.split(' ').map(n => n[0]).join('').toUpperCase()}
              </div>
            </div>
          </div>
        </div>
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
};