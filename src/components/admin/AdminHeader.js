'use client';

import { Menu, LogOut, User, Bell } from 'lucide-react';
import Breadcrumb from './Breadcrumb';

export default function AdminHeader({ profile, breadcrumbItems, onToggleSidebar, onLogout }) {
  return (
    <header className="flex items-center justify-between bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <button
          className="md:hidden p-2 rounded-md hover:bg-gray-100 text-gray-600"
          onClick={onToggleSidebar}
          aria-label="Abrir menú lateral"
        >
          <Menu className="w-6 h-6" />
        </button>
        <Breadcrumb items={breadcrumbItems} />
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 rounded-full hover:bg-gray-100 text-gray-500">
          <Bell className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-semibold">
            {profile?.nombre?.[0] || 'A'}
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-gray-800">{profile?.nombre || 'Admin'}</p>
            <p className="text-xs text-gray-500">{profile?.email || 'admin@nbh.com'}</p>
          </div>
          <button 
            onClick={onLogout}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
            aria-label="Cerrar sesión"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
