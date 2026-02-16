import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Store,
  LayoutDashboard,
  Package,
  Receipt,
  Users,
  Settings,
  LogOut,
  ExternalLink,
} from 'lucide-react';

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout, isSuperAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigation = [
    ...(isSuperAdmin
      ? [{ name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }]
      : []),
    { name: 'Products', href: '/products', icon: Package },
    { name: 'Transactions', href: '/transactions', icon: Receipt },
    ...(isSuperAdmin
      ? [
          { name: 'Users', href: '/users', icon: Users },
          { name: 'Settings', href: '/settings', icon: Settings },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <Store className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">ElectroShop</span>
              </div>

              <div className="hidden md:flex items-center gap-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                        isActive
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Link
                to={`/shop/${user?.shop_id}`}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="hidden sm:inline">View Public Shop</span>
              </Link>

              <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.role}</p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  );
}
