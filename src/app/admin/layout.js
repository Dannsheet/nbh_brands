'use client';

import { useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

export default function AdminRootLayout({ children }) {
  useEffect(() => {
    document.documentElement.classList.add('admin-mode');
    return () => {
      document.documentElement.classList.remove('admin-mode');
    };
  }, []);

  return <AdminLayout>{children}</AdminLayout>;
}
